/**
 * realApi.js
 * All frontend API calls — every route exactly matches the Express backend.
 * Base URL is '/api' (proxied to http://localhost:5000 in dev via vite.config.js)
 */

import api from './axios.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const unwrap = (res) => res.data;
const err    = (e)   => { throw new Error(e.response?.data?.message || e.message || 'Request failed'); };

// Normalize: ensure every user object has both _id and id populated
const norm = (u) => u ? ({ ...u, _id: u._id || u.id, id: u._id || u.id }) : u;
const normArr = (arr) => (arr || []).map(norm);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH   /api/auth/*
// ─────────────────────────────────────────────────────────────────────────────
export const apiAuth = {
  /** POST /api/auth/register */
  async register(data) {
    try { return unwrap(await api.post('/auth/register', data)); }
    catch (e) { err(e); }
  },

  /** POST /api/auth/login → { success, token, user } */
  async login(email, password) {
    try { return unwrap(await api.post('/auth/login', { email, password })); }
    catch (e) { err(e); }
  },

  /** POST /api/auth/forgot-password */
  async forgotPassword(email) {
    try { return unwrap(await api.post('/auth/forgot-password', { email })); }
    catch (e) { err(e); }
  },

  /** POST /api/auth/reset-password/:token */
  async resetPassword(token, password) {
    try { return unwrap(await api.post(`/auth/reset-password/${token}`, { password })); }
    catch (e) { err(e); }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS  /api/users/*
// ─────────────────────────────────────────────────────────────────────────────
export const apiUsers = {
  /** GET /api/users/me */
  async getMe() {
    try { return norm(unwrap(await api.get('/users/me')).user); }
    catch (e) { err(e); }
  },

  /** PUT /api/users/me */
  async updateMe(data) {
    try { return unwrap(await api.put('/users/me', data)).user; }
    catch (e) { err(e); }
  },

  /** GET /api/users/matches?subject=&skill=&avail= */
  async getMatches(_userId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.subject) params.set('subject', filters.subject);
      if (filters.skill)   params.set('skill',   filters.skill);
      if (filters.avail)   params.set('avail',   filters.avail);
      const qs = params.toString();
      return normArr(unwrap(await api.get(`/users/matches${qs ? `?${qs}` : ''}`)).users);
    } catch (e) { err(e); }
  },

  /** POST /api/users/connect/:id */
  async sendRequest(_fromId, toId) {
    try { return unwrap(await api.post(`/users/connect/${toId}`)); }
    catch (e) { err(e); }
  },

  /** PUT /api/users/connect/:userId/accept — userId = the other person's _id */
  async acceptRequest(otherUserId) {
    try { return unwrap(await api.put(`/users/connect/${otherUserId}/accept`)); }
    catch (e) { err(e); }
  },

  /** PUT /api/users/connect/:userId/decline */
  async declineRequest(otherUserId) {
    try { return unwrap(await api.put(`/users/connect/${otherUserId}/decline`)); }
    catch (e) { err(e); }
  },

  /** GET /api/users/connections?status=accepted */
  async getConnections(_userId) {
    try {
      const res = unwrap(await api.get('/users/connections?status=accepted'));
      return (res.connections || []).map(c => ({ ...c, user: norm(c.user) }));
    } catch (e) { err(e); }
  },

  /**
   * GET /api/users/connections?status=pending
   * Backend returns connections where current user is either side.
   * We filter: "received" = where the OTHER user initiated (they are sender).
   */
  async getPendingReceived(_uid) {
    try {
      const res = unwrap(await api.get('/users/connections?status=pending'));
      // initiatedByMe:false means THEY sent to us
      return (res.connections || [])
        .filter(c => c.initiatedByMe === false)
        .map(c => ({ ...c, user: norm(c.user) }));
    } catch (e) { return []; }
  },

  async getPendingSent(_uid) {
    try {
      const res = unwrap(await api.get('/users/connections?status=pending'));
      // initiatedByMe:true means WE sent to them
      return (res.connections || [])
        .filter(c => c.initiatedByMe === true || c.initiatedByMe === undefined)
        .map(c => ({ ...c, user: norm(c.user) }));
    } catch (e) { return []; }
  },

  /** GET /api/users/leaderboard?tab=hours|streak|sessions */
  async getLeaderboard(tab = 'hours') {
    try { return normArr(unwrap(await api.get(`/users/leaderboard?tab=${tab}`)).users); }
    catch (e) { return []; }
  },

  /** GET /api/users/notifications */
  async getNotifications() {
    try { return unwrap(await api.get('/users/notifications')).notifications || []; }
    catch (e) { return []; }
  },

  /** PUT /api/users/notifications/read */
  async markNotificationsRead() {
    try { await api.put('/users/notifications/read'); }
    catch (e) { /* silent */ }
  },

  // Profile aliases
  async getProfile(_userId)      { return this.getMe(); },
  async updateProfile(_uid, data){ return this.updateMe(data); },
};

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS  /api/groups/*
// ─────────────────────────────────────────────────────────────────────────────
export const apiGroups = {
  async getAll() {
    try { return unwrap(await api.get('/groups')).groups || []; }
    catch (e) { return []; }
  },
  async create(data) {
    try { return unwrap(await api.post('/groups', data)).group; }
    catch (e) { err(e); }
  },
  /** POST /api/groups/:id/request — send join request to admin */
  async requestJoin(groupId) {
    try { return unwrap(await api.post(`/groups/${groupId}/request`)); }
    catch (e) { err(e); }
  },
  /** GET /api/groups/:id/requests — admin only */
  async getJoinRequests(groupId) {
    try { return unwrap(await api.get(`/groups/${groupId}/requests`)).requests || []; }
    catch (e) { return []; }
  },
  /** PUT /api/groups/:id/requests/:userId/approve */
  async approveJoin(groupId, userId) {
    try { return unwrap(await api.put(`/groups/${groupId}/requests/${userId}/approve`)); }
    catch (e) { err(e); }
  },
  /** PUT /api/groups/:id/requests/:userId/decline */
  async declineJoin(groupId, userId) {
    try { return unwrap(await api.put(`/groups/${groupId}/requests/${userId}/decline`)); }
    catch (e) { err(e); }
  },
  /** DELETE /api/groups/:id/leave */
  async leaveGroup(groupId) {
    try { return unwrap(await api.delete(`/groups/${groupId}/leave`)); }
    catch (e) { err(e); }
  },
  /** POST /api/groups/:id/invite */
  async regenerateInvite(groupId) {
    try { return unwrap(await api.post(`/groups/${groupId}/invite`)); }
    catch (e) { err(e); }
  },
  async getMessages(groupId) {
    try {
      const msgs = unwrap(await api.get(`/groups/${groupId}/messages`)).messages || [];
      return msgs.map(m => ({
        id:         m._id,
        userId:     typeof m.sender === 'object' ? m.sender._id : m.sender,
        text:       m.text,
        time:       new Date(m.createdAt).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }),
        reactions:  m.reactions || [],
        isSystem:   m.isSystem  || false,
        senderName: m.sender?.name || 'Member',
        senderGrad: m.sender?.grad || '135deg,#6366f1,#8b5cf6',
      }));
    } catch (e) { return []; }
  },
  async sendMessage(groupId, text) {
    try {
      const m = unwrap(await api.post(`/groups/${groupId}/messages`, { text })).message;
      return {
        id:         m._id,
        userId:     typeof m.sender === 'object' ? m.sender._id : m.sender,
        text:       m.text,
        time:       new Date(m.createdAt).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }),
        reactions:  [],
        senderName: m.sender?.name || 'Me',
        senderGrad: m.sender?.grad || '135deg,#6366f1,#8b5cf6',
      };
    } catch (e) { err(e); }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES (DM)  /api/messages/*
// ─────────────────────────────────────────────────────────────────────────────
export const apiDM = {
  /** Get list of DM threads (derived from accepted connections) */
  async getThreads(_userId) {
    try {
      const conns = await apiUsers.getConnections();
      return (conns || []).map(c => ({
        key:   c.user?._id || c.user?.id,
        other: c.user,
        last:  null,
        count: 0,
      }));
    } catch (e) { return []; }
  },

  /** GET /api/messages/:userId */
  async getMessages(otherUserId) {
    try {
      const msgs = unwrap(await api.get(`/messages/${otherUserId}`)).messages || [];
      return msgs.map(m => ({
        id:   m._id,
        from: typeof m.sender === 'object' ? m.sender._id : m.sender,
        text: m.text,
        time: new Date(m.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        senderName: m.sender?.name || 'User',
        senderGrad: m.sender?.grad || '135deg,#6366f1,#8b5cf6',
      }));
    } catch (e) { return []; }
  },

  /** POST /api/messages/:userId */
  async send(otherUserId, fromId, text) {
    try {
      const m = unwrap(await api.post(`/messages/${otherUserId}`, { text })).message;
      return {
        id:   m._id,
        from: fromId,
        text: m.text,
        time: new Date(m.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (e) { err(e); }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS  /api/sessions/*
// ─────────────────────────────────────────────────────────────────────────────
export const apiSessions = {
  /** GET /api/sessions */
  async getAll(_userId) {
    try { return unwrap(await api.get('/sessions')).sessions || []; }
    catch (e) { err(e); }
  },

  /** POST /api/sessions */
  async create(_userId, data) {
    try { return unwrap(await api.post('/sessions', data)).session; }
    catch (e) { err(e); }
  },

  /** PUT /api/sessions/:id/complete */
  async complete(sessionId, _userId, minutes) {
    try { return unwrap(await api.put(`/sessions/${sessionId}/complete`, { minutes })); }
    catch (e) { err(e); }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS  /api/analytics/*
// ─────────────────────────────────────────────────────────────────────────────
export const apiAnalytics = {
  /** GET /api/analytics */
  async get(_userId) {
    try { return unwrap(await api.get('/analytics')).analytics; }
    catch (e) { err(e); }
  },

  /** POST /api/analytics/log */
  async log(minutes, subject = 'General Study', source = 'timer') {
    try { return unwrap(await api.post('/analytics/log', { minutes, subject, source })); }
    catch (e) { /* silent — don't break timer UI on log failure */ }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AI ASSISTANT  /api/analytics/ai
// ─────────────────────────────────────────────────────────────────────────────
export const apiAI = {
  /** POST /api/analytics/ai */
  async ask(_userId, question) {
    try { return unwrap(await api.post('/analytics/ai', { question })).result; }
    catch (e) { return { text: 'Sorry, the AI assistant is unavailable right now. Make sure you are logged in.', explanation: '', code: '' }; }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE (local — no backend needed)
// ─────────────────────────────────────────────────────────────────────────────
export const apiSchedule = {
  async generate(subjects, hoursPerDay) {
    const days  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const slots = ['7:00 AM','9:00 AM','11:00 AM','2:00 PM','4:30 PM','6:30 PM','8:00 PM'];
    const spd   = Math.max(1, Math.min(3, Math.floor(hoursPerDay / 1.5)));
    await new Promise(r => setTimeout(r, 600));
    return days.map((day, di) => ({
      day,
      date: new Date(Date.now() + (di + 1) * 86400000)
        .toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      sessions: Array.from({ length: Math.min(spd, subjects.length) }, (_, si) => ({
        subject:  subjects[(di + si) % subjects.length],
        time:     slots[(di * 2 + si * 3) % slots.length],
        duration: hoursPerDay <= 2 ? 60 : 90,
        type:     si === 0 ? 'Primary' : 'Revision',
      })),
    }));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD (aggregates multiple endpoints)
// ─────────────────────────────────────────────────────────────────────────────
export const apiDash = {
  async get(_userId) {
    try {
      const [user, analytics, connections, sessions, matches] = await Promise.all([
        apiUsers.getMe(),
        apiAnalytics.get(),
        apiUsers.getConnections(),
        apiSessions.getAll(),
        apiUsers.getMatches(null, {}).then(u => u.slice(0, 3)).catch(() => []),
      ]);
      return {
        user,
        stats: {
          hours:       analytics?.totalHours    || 0,
          sessions:    analytics?.totalSessions || 0,
          streak:      analytics?.streak        || 0,
          partners:    (connections || []).length,
          weeklyHours: analytics?.weeklyHours   || [0,0,0,0,0,0,0],
        },
        topMatches: matches,
        upcoming:   (sessions || []).filter(s => s.status === 'upcoming').slice(0, 2),
      };
    } catch (e) { err(e); }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE aliases
// ─────────────────────────────────────────────────────────────────────────────
export const apiProfile = {
  async get(_userId)        { return apiUsers.getMe(); },
  async update(_userId, d)  { return apiUsers.updateMe(d); },
};

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard helper (compat with Pages.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export function getAllUsers() { return []; }
