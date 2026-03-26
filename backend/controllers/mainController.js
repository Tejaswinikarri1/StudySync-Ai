const crypto = require('crypto');
const User   = require('../models/User');
const { Group, Message, Session, StudyLog, Notification } = require('../models/index');
const { sendEmail } = require('../utils/email');

// Lazy-load socket emitter to avoid circular dependency
const emit = (userId, event, data) => {
  try {
    const { emitToUser } = require('../server');
    emitToUser(userId?.toString(), event, data);
  } catch {}
};

// ─── GROUP AVATARS ────────────────────────────────────────────────────────────
const GROUP_AVATARS = ['📚','🔬','💡','🧮','🖥️','🎯','⚡','🚀','🧠','🎓','📐','🔭','💻','🏆','🌐'];
const GROUP_COLORS  = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ec4899','#22d3ee','#f43f5e','#a78bfa'];
const pickAvatar = (i) => GROUP_AVATARS[i % GROUP_AVATARS.length];
const pickColor  = (i) => GROUP_COLORS[i % GROUP_COLORS.length];

// Helper: populate group with isMember/isAdmin/pendingRequest flags
const populateGroup = (g, userId) => {
  const uid   = userId?.toString();
  const obj   = g.toObject ? g.toObject() : g;
  const myReq = obj.joinRequests?.find(r => r.user?.toString() === uid);
  return {
    ...obj,
    isMember:       obj.members.some(m => m?.toString() === uid || m?._id?.toString() === uid),
    isAdmin:        obj.admin?.toString() === uid || obj.admin?._id?.toString() === uid,
    pendingRequest: myReq?.status === 'pending',
    declinedRequest:myReq?.status === 'declined',
    memberCount:    obj.members.length,
  };
};

// ─── GET ALL GROUPS ───────────────────────────────────────────────────────────
exports.getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find()
      .populate('admin',   'name grad _id')
      .populate('members', 'name grad _id')
      .sort({ createdAt: -1 });

    const result = groups.map(g => populateGroup(g, req.user._id));
    res.json({ success: true, groups: result });
  } catch (err) { next(err); }
};

// ─── CREATE GROUP ─────────────────────────────────────────────────────────────
exports.createGroup = async (req, res, next) => {
  try {
    const { name, subject, desc, maxSize, tags, isPublic } = req.body;
    if (!name || !subject)
      return res.status(400).json({ success: false, message: 'Name and subject are required.' });

    const count      = await Group.countDocuments();
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const group = await Group.create({
      name, subject,
      desc:       desc || '',
      maxSize:    maxSize || 8,
      tags:       tags || [],
      isPublic:   isPublic !== false,
      avatar:     req.body.avatar || pickAvatar(count),
      color:      req.body.color  || pickColor(count),
      admin:      req.user._id,
      members:    [req.user._id],
      inviteCode,
      joinRequests: [],
    });

    await group.populate('admin members', 'name grad _id');

    try {
      await sendEmail({
        to: req.user.email,
        subject: `"${name}" group created on StudySync AI`,
        html: `<p>Your group <strong>${name}</strong> was created!<br/>Invite code: <strong>${inviteCode}</strong></p>`,
      });
    } catch (e) {}

    res.status(201).json({ success: true, group: populateGroup(group, req.user._id) });
  } catch (err) { next(err); }
};

// ─── REQUEST TO JOIN (replaces direct join) ───────────────────────────────────
// POST /api/groups/:id/request
exports.requestJoin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const uid = req.user._id.toString();

    if (group.members.some(m => m.toString() === uid))
      return res.status(400).json({ success: false, message: 'You are already a member.' });

    if (group.members.length >= group.maxSize)
      return res.status(400).json({ success: false, message: 'Group is full.' });

    // Check existing request
    const existing = group.joinRequests.find(r => r.user.toString() === uid);
    if (existing) {
      if (existing.status === 'pending')
        return res.status(400).json({ success: false, message: 'Join request already sent.' });
      if (existing.status === 'declined') {
        existing.status = 'pending';
        existing.createdAt = new Date();
        await group.save();
        return res.json({ success: true, status: 'pending' });
      }
    }

    group.joinRequests.push({ user: req.user._id, status: 'pending' });
    await group.save();

    // Notify admin in DB
    await Notification.create({
      user: group.admin,
      type: 'join_request',
      text: `${req.user.name} wants to join "${group.name}"`,
      meta: { groupId: group._id, userId: req.user._id },
    });

    // Push real-time notification to admin immediately
    emit(group.admin, 'new_join_request', {
      groupId:   group._id.toString(),
      groupName: group.name,
      userName:  req.user.name,
      userId:    req.user._id.toString(),
    });

    res.json({ success: true, status: 'pending', message: 'Join request sent to admin.' });
  } catch (err) { next(err); }
};

// ─── ADMIN: GET PENDING JOIN REQUESTS ─────────────────────────────────────────
// GET /api/groups/:id/requests
exports.getJoinRequests = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('joinRequests.user', 'name email grad subjects skillLevel dept college year');

    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only admins can view join requests.' });

    const pending = group.joinRequests.filter(r => r.status === 'pending');
    res.json({ success: true, requests: pending });
  } catch (err) { next(err); }
};

// ─── ADMIN: APPROVE JOIN REQUEST ──────────────────────────────────────────────
// PUT /api/groups/:id/requests/:userId/approve
exports.approveJoin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only admins can approve requests.' });

    const reqEntry = group.joinRequests.find(r => r.user.toString() === req.params.userId);
    if (!reqEntry) return res.status(404).json({ success: false, message: 'Request not found.' });

    if (group.members.length >= group.maxSize)
      return res.status(400).json({ success: false, message: 'Group is full.' });

    reqEntry.status = 'accepted';
    if (!group.members.includes(req.params.userId))
      group.members.push(req.params.userId);

    await group.save();

    // System message in group
    const newUser = await User.findById(req.params.userId);
    await Message.create({
      type: 'group', group: group._id,
      sender: req.params.userId,
      text:   `${newUser?.name || 'A user'} joined the group`,
      isSystem: true,
    });

    // Notify approved user in DB + real-time
    await Notification.create({
      user: req.params.userId,
      type: 'join_approved',
      text: `Your request to join "${group.name}" was approved!`,
      meta: { groupId: group._id },
    });

    emit(req.params.userId, 'join_request_approved', {
      groupId:   group._id.toString(),
      groupName: group.name,
    });

    try {
      await sendEmail({
        to: newUser.email,
        subject: `You've been approved to join "${group.name}"`,
        html: `<p>Great news! The admin approved your request to join <strong>${group.name}</strong>.</p>`,
      });
    } catch (e) {}

    await group.populate('admin members', 'name grad _id');
    res.json({ success: true, group: populateGroup(group, req.user._id) });
  } catch (err) { next(err); }
};

// ─── ADMIN: DECLINE JOIN REQUEST ─────────────────────────────────────────────
// PUT /api/groups/:id/requests/:userId/decline
exports.declineJoin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only admins can decline requests.' });

    const reqEntry = group.joinRequests.find(r => r.user.toString() === req.params.userId);
    if (reqEntry) reqEntry.status = 'declined';
    await group.save();

    res.json({ success: true, message: 'Request declined.' });
  } catch (err) { next(err); }
};

// ─── LEAVE GROUP ──────────────────────────────────────────────────────────────
// DELETE /api/groups/:id/leave
exports.leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const uid = req.user._id.toString();
    if (group.admin.toString() === uid)
      return res.status(400).json({ success: false, message: 'Admins cannot leave. Transfer ownership or delete the group.' });

    group.members = group.members.filter(m => m.toString() !== uid);

    // System message
    await Message.create({
      type: 'group', group: group._id,
      sender: req.user._id,
      text:   `${req.user.name} left the group`,
      isSystem: true,
    });

    await group.save();
    res.json({ success: true, message: 'You left the group.' });
  } catch (err) { next(err); }
};

// ─── REGENERATE INVITE ────────────────────────────────────────────────────────
exports.regenerateInvite = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    if (group.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only admins can regenerate invite codes.' });

    group.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await group.save();
    res.json({ success: true, inviteCode: group.inviteCode });
  } catch (err) { next(err); }
};

// ─── GET GROUP MESSAGES ───────────────────────────────────────────────────────
exports.getGroupMessages = async (req, res, next) => {
  try {
    const msgs = await Message.find({ type: 'group', group: req.params.id })
      .populate('sender', 'name grad _id')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ success: true, messages: msgs });
  } catch (err) { next(err); }
};

// ─── SEND GROUP MESSAGE ───────────────────────────────────────────────────────
exports.sendGroupMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required.' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'You must be a member to send messages.' });

    const msg = await Message.create({
      type: 'group', group: req.params.id,
      sender: req.user._id, text: text.trim(),
    });
    await msg.populate('sender', 'name grad _id');
    res.status(201).json({ success: true, message: msg });
  } catch (err) { next(err); }
};

// ─── DM MESSAGES ─────────────────────────────────────────────────────────────
exports.getDMMessages = async (req, res, next) => {
  try {
    const msgs = await Message.find({
      type: 'dm',
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate('sender',   'name grad _id')
      .populate('receiver', 'name grad _id')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ success: true, messages: msgs });
  } catch (err) { next(err); }
};

exports.sendDM = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id);
    const isConnected = me.connections.some(
      c => c.user.toString() === req.params.userId && c.status === 'accepted'
    );
    if (!isConnected)
      return res.status(403).json({ success: false, message: 'You must be connected to send direct messages.' });

    const msg = await Message.create({
      type: 'dm',
      sender:   req.user._id,
      receiver: req.params.userId,
      text:     req.body.text?.trim(),
    });
    await msg.populate('sender receiver', 'name grad _id');

    // Push DM to recipient immediately via socket (in case they are online)
    emit(req.params.userId, 'new_dm_message', msg);

    res.status(201).json({ success: true, message: msg });
  } catch (err) { next(err); }
};

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ members: req.user._id }).sort({ date: -1, time: -1 });
    res.json({ success: true, sessions });
  } catch (err) { next(err); }
};

exports.createSession = async (req, res, next) => {
  try {
    const { title, groupId, date, time, duration, meetLink } = req.body;
    if (!title || !date)
      return res.status(400).json({ success: false, message: 'Title and date are required.' });

    const group   = groupId ? await Group.findById(groupId) : null;
    const session = await Session.create({
      title, date, time, duration: duration || 60, meetLink: meetLink || null,
      group:     groupId || null,
      groupName: group?.name || '',
      members:   [req.user._id],
      createdBy: req.user._id,
    });

    try {
      await sendEmail({
        to: req.user.email,
        subject: `Session "${title}" scheduled`,
        html: `<p>Session <strong>${title}</strong> scheduled for ${date} at ${time}.</p>`,
      });
    } catch (e) {}

    res.status(201).json({ success: true, session });
  } catch (err) { next(err); }
};

exports.completeSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (!session.members.some(m => m.toString() === req.user._id.toString()))
      return res.status(403).json({ success: false, message: 'Not a member of this session.' });

    session.status = 'completed';
    await session.save();

    const mins  = req.body.minutes || session.duration;
    const today = new Date().toISOString().split('T')[0];
    const group = session.group ? await Group.findById(session.group) : null;

    await StudyLog.create({
      user: req.user._id, session: session._id, group: session.group || null,
      subject: group?.subject || 'General Study', minutes: mins, date: today, source: 'session',
    });

    const user = await User.findById(req.user._id);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (user.lastStudyDate === yStr || user.lastStudyDate === today) {
      if (user.lastStudyDate !== today) user.currentStreak += 1;
    } else { user.currentStreak = 1; }
    user.lastStudyDate      = today;
    user.totalSessions     += 1;
    user.totalFocusMinutes += mins;

    const totalH = user.totalFocusMinutes / 60;
    if (totalH >= 100 && !user.badges.includes('Study Champion'))       user.badges.push('Study Champion');
    if (user.currentStreak >= 7 && !user.badges.includes('Consistency Master')) user.badges.push('Consistency Master');
    await user.save();

    res.json({ success: true, session, user });
  } catch (err) { next(err); }
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const logs = await StudyLog.find({ user: req.user._id });

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const weeklyHours = weekDays.map(d => {
      const mins = logs.filter(l => l.date === d).reduce((s,l) => s+(l.minutes||0), 0);
      return Math.round(mins/60*10)/10;
    });

    const subMap = {};
    logs.forEach(l => { subMap[l.subject] = (subMap[l.subject]||0) + (l.minutes||0); });
    const colors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#22d3ee','#ec4899'];
    const subjectHours = Object.entries(subMap)
      .map(([name,mins],i) => ({ name, hours: Math.round(mins/60*10)/10, color: colors[i%colors.length] }))
      .sort((a,b) => b.hours-a.hours).slice(0,6);

    const monthlyHours = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth()-(11-i));
      const ym = d.toISOString().slice(0,7);
      const mins = logs.filter(l => l.date?.startsWith(ym)).reduce((s,l) => s+(l.minutes||0),0);
      return Math.round(mins/60*10)/10;
    });

    const user = await User.findById(req.user._id);
    const totalMinutes = logs.reduce((s,l) => s+(l.minutes||0),0);

    res.json({ success: true, analytics: {
      weeklyHours, subjectHours, monthlyHours,
      totalHours:    Math.round(totalMinutes/60*10)/10,
      totalSessions: user.totalSessions,
      streak:        user.currentStreak,
    }});
  } catch (err) { next(err); }
};

exports.logStudy = async (req, res, next) => {
  try {
    const { minutes, subject, source } = req.body;
    if (!minutes || minutes < 1)
      return res.status(400).json({ success: false, message: 'Minutes required.' });

    const today = new Date().toISOString().split('T')[0];
    await StudyLog.create({ user: req.user._id, subject: subject||'General Study', minutes, date: today, source: source||'timer' });

    const user = await User.findById(req.user._id);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (user.lastStudyDate === yStr || user.lastStudyDate === today) {
      if (user.lastStudyDate !== today) user.currentStreak += 1;
    } else { user.currentStreak = 1; }
    user.lastStudyDate      = today;
    user.totalFocusMinutes += minutes;
    const hr = new Date().getHours();
    if (hr >= 22 && !user.badges.includes('Night Owl')) user.badges.push('Night Owl');
    if (user.currentStreak >= 7 && !user.badges.includes('Consistency Master')) user.badges.push('Consistency Master');
    await user.save();

    res.json({ success: true, message: 'Study logged.', user });
  } catch (err) { next(err); }
};

exports.askAI = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question required.' });
    const q = question.toLowerCase();

    let result;
    if (q.includes('quicksort')||q.includes('quick sort')) {
      result = { text:'QuickSort is a divide-and-conquer algorithm with average O(n log n) complexity.', explanation:'Pick pivot → Partition → Recurse\nAverage: O(n log n) | Worst: O(n²)', code:`function quickSort(arr,lo=0,hi=arr.length-1){\n  if(lo>=hi) return arr;\n  const pi=partition(arr,lo,hi);\n  quickSort(arr,lo,pi-1);\n  quickSort(arr,pi+1,hi);\n  return arr;\n}\nfunction partition(arr,lo,hi){\n  const p=arr[hi]; let i=lo-1;\n  for(let j=lo;j<hi;j++) if(arr[j]<=p) [arr[++i],arr[j]]=[arr[j],arr[i]];\n  [arr[i+1],arr[hi]]=[arr[hi],arr[i+1]];\n  return i+1;\n}` };
    } else if (q.includes('dynamic programming')||q.includes(' dp ')||q.startsWith('dp ')) {
      result = { text:'Dynamic Programming solves overlapping subproblems by storing results.', explanation:'Top-down: recursion + memo\nBottom-up: fill table iteratively\nUse when: optimal substructure + overlapping subproblems', code:`const fib=(n,m={})=>n<=1?n:(m[n]??=fib(n-1,m)+fib(n-2,m));` };
    } else {
      result = { text:`Here's a breakdown of "${question}":`, explanation:`1. Understand the core concept\n2. Identify key properties\n3. Analyze time & space complexity\n4. Consider edge cases\n5. Practice implementation`, code:`function solve(input){\n  if(!input?.length) return null;\n  // implement here\n}` };
    }
    res.json({ success: true, result });
  } catch (err) { next(err); }
};
