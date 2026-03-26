import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Copy, Check, RefreshCw, Link, Send, Video,
  X, MessageSquare, Crown, UserCheck, Clock, LogOut, Bell,
  Search, Shield, Info, ChevronRight, Hash
} from 'lucide-react';
import { Avatar, Badge, Btn, Inp, Modal, Loading, Empty } from '../components/ui/index.jsx';
import { apiGroups } from '../api/realApi.js';
import { useApp } from '../context/AppContext.jsx';
import { getSocket, onSocket } from '../api/socket.js';

const EMOJIS_CHAT = ['👍','🔥','💡','❓','🙏','✅','🎯','😂','⚡','🏆'];

const GROUP_AVATARS = [
  {emoji:'📚',label:'Books'},{emoji:'🔬',label:'Science'},{emoji:'💡',label:'Ideas'},
  {emoji:'🧮',label:'Math'},{emoji:'🖥️',label:'Code'},{emoji:'🎯',label:'Goals'},
  {emoji:'⚡',label:'Fast'},{emoji:'🚀',label:'Launch'},{emoji:'🧠',label:'Brain'},
  {emoji:'🎓',label:'Grad'},{emoji:'📐',label:'Design'},{emoji:'🔭',label:'Space'},
  {emoji:'💻',label:'Dev'},{emoji:'🏆',label:'Trophy'},{emoji:'🌐',label:'Global'},{emoji:'🎵',label:'Music'},
];
const GROUP_COLORS = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ec4899','#22d3ee','#f43f5e','#a78bfa'];

// ── Invite Code Modal (shown after create + on demand) ────────────────────────
function InviteModal({ group, onClose, onRegenerate }) {
  const [copied,  setCopied]  = useState(false);
  const [regen,   setRegen]   = useState(false);
  const [curCode, setCurCode] = useState(group?.inviteCode || '');

  const safeOrigin = () =>
    window.location.origin && window.location.origin !== 'null'
      ? window.location.origin : 'http://localhost:5173';

  const copy = async () => {
    const link = `${safeOrigin()}?join=${curCode}`;
    await navigator.clipboard.writeText(link).catch(() =>
      prompt('Copy this invite link:', link)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const regenerate = async () => {
    setRegen(true);
    try {
      const result = await apiGroups.regenerateInvite(group._id || group.id);
      const newCode = result.inviteCode;
      setCurCode(newCode);
      onRegenerate?.(newCode);
    } catch (e) { alert(e.message); }
    setRegen(false);
  };

  return (
    <Modal open onClose={onClose} title="Share Invite Link">
      <p style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>
        Share this link or code with anyone to let them join{' '}
        <strong style={{ color:'var(--text)' }}>{group?.name}</strong>
      </p>

      {/* Invite Code */}
      <div style={{ marginBottom:18 }}>
        <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:8 }}>Invite Code</label>
        <div style={{ background:'var(--bg2)', border:'1px solid rgba(99,102,241,.3)', borderRadius:14, padding:'16px 20px', fontFamily:'var(--mono)', fontSize:26, fontWeight:700, letterSpacing:'0.18em', color:'#818cf8', textAlign:'center' }}>
          {curCode || '—'}
        </div>
      </div>

      {/* Shareable link */}
      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:8 }}>Shareable Link</label>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--mono)' }}>
            {`${safeOrigin()}?join=${curCode}`}
          </div>
          <Btn v="primary" sz="sm" icon={copied ? <Check size={13}/> : <Copy size={13}/>} onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </Btn>
        </div>
      </div>

      <div style={{ background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'#fbbf24', marginBottom:20 }}>
        <strong>Admin only:</strong> Anyone with this code can request to join. Regenerate if you want to revoke access.
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <Btn v="secondary" sz="sm" icon={<RefreshCw size={13}/>} loading={regen} onClick={regenerate}>
          Regenerate Code
        </Btn>
        <Btn v="secondary" sz="sm" style={{ marginLeft:'auto' }} onClick={onClose}>Done</Btn>
      </div>
    </Modal>
  );
}

// ── Group Info Panel (members list + group details) ───────────────────────────
function GroupInfoPanel({ group, user, onClose, onShowInvite }) {
  const myId = user?._id || user?.id;
  return (
    <Modal open onClose={onClose} title="Group Info">
      {/* Header */}
      <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20, padding:'16px', background:'var(--surface)', borderRadius:16, border:'1px solid var(--border2)' }}>
        <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${group.color||'#6366f1'}30,${group.color||'#6366f1'}15)`, border:`1px solid ${group.color||'#6366f1'}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>
          {group.avatar || '📚'}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:17, marginBottom:3 }}>{group.name}</p>
          <p style={{ fontSize:12, color:group.color||'#818cf8', fontWeight:600, marginBottom:4 }}>{group.subject}</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {group.isAdmin && <Badge v="amber"><Crown size={10} style={{display:'inline',marginRight:3}}/>Admin</Badge>}
            {group.isMember && !group.isAdmin && <Badge v="green"><UserCheck size={10} style={{display:'inline',marginRight:3}}/>Member</Badge>}
            <Badge v="purple">{group.memberCount || group.members?.length || 0}/{group.maxSize} members</Badge>
          </div>
        </div>
      </div>

      {/* Description */}
      {group.desc && (
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>About</p>
          <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{group.desc}</p>
        </div>
      )}

      {/* Tags */}
      {(group.tags||[]).length > 0 && (
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Tags</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {group.tags.map(t => <Badge key={t} v="purple">#{t}</Badge>)}
          </div>
        </div>
      )}

      {/* Members */}
      <div style={{ marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>
          Members ({group.memberCount || group.members?.length || 0})
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:220, overflowY:'auto' }}>
          {(group.members||[]).map((m, idx) => {
            const u = typeof m === 'object' ? m : { name: '?', grad: '135deg,#6366f1,#8b5cf6' };
            const isThisAdmin = typeof group.admin === 'object'
              ? (group.admin?._id || group.admin?.id) === (u._id || u.id)
              : group.admin === (u._id || u.id);
            const isMe = (u._id || u.id) === myId;
            return (
              <div key={u._id || u.id || idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--surface)', borderRadius:12, border:'1px solid var(--border2)' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(${u.grad||'135deg,#6366f1,#8b5cf6'})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', fontFamily:'var(--font)', flexShrink:0 }}>
                  {(u.name||'?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font)', fontWeight:600, fontSize:13 }}>{u.name}{isMe ? ' (You)' : ''}</p>
                  {u.dept && <p style={{ fontSize:11, color:'var(--text3)' }}>{u.dept}</p>}
                </div>
                {isThisAdmin && <Badge v="amber"><Crown size={10} style={{display:'inline',marginRight:3}}/>Admin</Badge>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin invite code section */}
      {group.isAdmin && (
        <div style={{ background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.15)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <p style={{ fontSize:12, fontWeight:700, fontFamily:'var(--font)', color:'#818cf8' }}>Invite Code</p>
            <Btn v="primary" sz="xs" icon={<Link size={11}/>} onClick={onShowInvite}>Share / Copy</Btn>
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:700, letterSpacing:'0.15em', color:'#818cf8', textAlign:'center', padding:'8px', background:'var(--bg2)', borderRadius:10 }}>
            {group.inviteCode || '—'}
          </div>
        </div>
      )}

      <Btn v="secondary" className="w-full" onClick={onClose}>Close</Btn>
    </Modal>
  );
}

// ── Group Chat ─────────────────────────────────────────────────────────────────
function GroupChat({ group: initialGroup, user, onBack }) {
  const [group,     setGroup]    = useState(initialGroup);
  const [messages,  setMessages] = useState([]);
  const [input,     setInput]    = useState('');
  const [loading,   setLoading]  = useState(true);
  const [typing,    setTyping]   = useState(null);
  const [showEmoji, setShowEmoji]= useState(null);
  const [showInfo,  setShowInfo] = useState(false);
  const [showInvite,setShowInvite]=useState(false);
  const [curCode,   setCurCode]  = useState(initialGroup?.inviteCode || '');
  const [copied,    setCopied]   = useState(false);
  const endRef      = useRef(null);
  const typingTimer = useRef(null);
  const audioCtx    = useRef(null);
  const myId = user?._id || user?.id;

  // Play notification sound using Web Audio API (no file needed)
  const playNotif = () => {
    try {
      const ctx = audioCtx.current || (audioCtx.current = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const groupIdRef = useRef(group._id || group.id);
  const myIdRef    = useRef(myId);
  useEffect(() => { groupIdRef.current = group._id || group.id; }, [group._id, group.id]);
  useEffect(() => { myIdRef.current    = myId; },                  [myId]);

  useEffect(() => {
    const groupId = group._id || group.id;

    apiGroups.getMessages(groupId)
      .then(m => { setMessages(m); setLoading(false); })
      .catch(() => setLoading(false));

    // Join room
    const socket = getSocket();
    if (socket) socket.emit('join_room', { groupId });

    const handleNewMsg = (msg) => {
      const msgGid = msg.group || msg.groupId;
      const curGid = groupIdRef.current;
      if (msgGid && curGid && msgGid.toString() !== curGid.toString()) return;

      const senderId = msg.sender?._id || msg.userId || msg.sender;
      const m = {
        id:         msg._id || msg.id || ('rt_'+Date.now()),
        userId:     senderId,
        text:       msg.text,
        time:       new Date(msg.createdAt||Date.now()).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}),
        senderName: msg.sender?.name || msg.senderName || 'Member',
        senderGrad: msg.sender?.grad || msg.senderGrad || '135deg,#6366f1,#8b5cf6',
        isSystem:   msg.isSystem || false,
      };
      setMessages(p => p.some(x => x.id === m.id) ? p : [...p, m]);
      if (senderId !== myIdRef.current) playNotif();
    };

    const handleTypingIn  = ({ name, userId }) => {
      if (userId === myIdRef.current) return;
      setTyping(name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 3000);
    };
    const handleTypingOut = () => setTyping(null);

    // Use onSocket — works even if socket hasn't connected yet
    const unMsg  = onSocket('new_group_message', handleNewMsg);
    const unTyp  = onSocket('user_typing',       handleTypingIn);
    const unStop = onSocket('user_stop_typing',  handleTypingOut);

    return () => {
      if (socket) socket.emit('leave_room', { groupId });
      unMsg(); unTyp(); unStop();
    };
  }, [group._id, group.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const normalizeMsg = (m) => ({
    id:         m._id || m.id,
    userId:     m.sender?._id || m.userId || m.sender,
    text:       m.text,
    time:       m.time || new Date(m.createdAt || Date.now()).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }),
    reactions:  m.reactions || [],
    isSystem:   m.isSystem || false,
    senderName: m.sender?.name || m.senderName || 'Member',
    senderGrad: m.sender?.grad || m.senderGrad || '135deg,#6366f1,#8b5cf6',
  });

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    const socket = getSocket();
    const groupId = group._id || group.id;

    const optimistic = {
      id: 'opt_'+Date.now(), userId: myId, text,
      time: new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }),
      senderName: user?.name, senderGrad: user?.grad, reactions: [],
    };
    setMessages(p => [...p, optimistic]);

    try {
      const msg = await apiGroups.sendMessage(groupId, text);
      setMessages(p => p.map(m => m.id === optimistic.id ? normalizeMsg(msg) : m));
      if (socket) {
        socket.emit('group_message', {
          groupId,
          message: {
            _id: msg.id || msg._id, group: groupId, text,
            createdAt: new Date().toISOString(),
            userId: myId,
            senderName: user?.name, senderGrad: user?.grad,
            sender: { _id: myId, name: user?.name, grad: user?.grad },
          },
        });
        socket.emit('typing_stop', { groupId });
      }
    } catch { setMessages(p => p.filter(m => m.id !== optimistic.id)); }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (socket) {
      socket.emit('typing_start', { groupId: group._id||group.id, userId: myId, name: user?.name });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit('typing_stop', { groupId: group._id||group.id }), 2000);
    }
  };

  const copyInvite = async () => {
    const origin = window.location.origin !== 'null' ? window.location.origin : 'http://localhost:5173';
    const link = `${origin}?join=${curCode}`;
    await navigator.clipboard.writeText(link).catch(() => prompt('Copy this invite link:', link));
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 62px)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'rgba(9,18,33,.6)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ width:32,height:32,borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)',fontSize:18 }}>←</button>
          <div style={{ width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${group.color||'#6366f1'}30,${group.color||'#6366f1'}15)`,border:`1px solid ${group.color||'#6366f1'}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>
            {group.avatar || '📚'}
          </div>
          <div>
            <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:14 }}>{group.name}</p>
            <p style={{ fontSize:11,color:'var(--green)' }}>● {group.members?.length||1} members</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {/* Admin: invite code copy button */}
          {group.isAdmin && (
            <button onClick={() => setShowInvite(true)}
              style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:'rgba(99,102,241,.1)',border:'1px solid rgba(99,102,241,.25)',borderRadius:9,fontSize:11,fontFamily:'var(--font)',fontWeight:600,color:'#818cf8',cursor:'pointer' }}>
              {copied ? <><Check size={12}/>Copied!</> : <><Link size={12}/>Invite</>}
            </button>
          )}
          {/* Info button for all members */}
          <button onClick={() => setShowInfo(true)}
            style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:'rgba(255,255,255,.04)',border:'1px solid var(--border2)',borderRadius:9,fontSize:11,fontFamily:'var(--font)',fontWeight:600,color:'var(--text2)',cursor:'pointer' }}>
            <Info size={12}/>Info
          </button>
          <button style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:'rgba(255,255,255,.04)',border:'1px solid var(--border2)',borderRadius:9,fontSize:11,fontFamily:'var(--font)',fontWeight:600,color:'var(--text2)',cursor:'pointer' }}>
            <Video size={12}/>Video
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12 }}>
        {loading ? <Loading/> : <>
          {messages.length === 0 && (
            <div style={{ textAlign:'center',padding:'40px 20px',color:'var(--text3)' }}>
              <MessageSquare size={30} style={{ margin:'0 auto 12px',opacity:.4 }}/>
              <p style={{ fontFamily:'var(--font)',fontSize:13 }}>No messages yet — say hello! 👋</p>
            </div>
          )}
          {messages.map((msg, idx) => {
            if (msg.isSystem) return (
              <div key={msg.id||idx} style={{ textAlign:'center' }}>
                <span style={{ fontSize:11,color:'var(--text3)',background:'rgba(255,255,255,.04)',borderRadius:10,padding:'3px 12px',fontFamily:'var(--font)' }}>{msg.text}</span>
              </div>
            );
            const isMine = msg.userId === myId;
            return (
              <motion.div key={msg.id||idx} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                style={{ display:'flex',gap:9,alignItems:'flex-end',flexDirection:isMine?'row-reverse':'row' }}>
                {!isMine && (
                  <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(${msg.senderGrad||'135deg,#6366f1,#8b5cf6'})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',fontFamily:'var(--font)',flexShrink:0 }}>
                    {(msg.senderName||'?')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ maxWidth:'65%',display:'flex',flexDirection:'column',alignItems:isMine?'flex-end':'flex-start' }}>
                  {!isMine && <p style={{ fontSize:11,color:'var(--text3)',marginBottom:3,marginLeft:3,fontFamily:'var(--font)',fontWeight:600 }}>{(msg.senderName||'Member').split(' ')[0]}</p>}
                  <div className={isMine?'bubble-me':'bubble-them'}
                    style={{ padding:'9px 14px',fontSize:13,lineHeight:1.6,position:'relative',cursor:'default' }}
                    onMouseEnter={()=>setShowEmoji(msg.id||idx)} onMouseLeave={()=>setShowEmoji(null)}>
                    {msg.text}
                    <AnimatePresence>
                      {showEmoji===(msg.id||idx) && (
                        <motion.div initial={{opacity:0,scale:.85,y:4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.85}}
                          style={{ position:'absolute',[isMine?'right':'left']:0,top:-38,display:'flex',gap:3,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'5px 8px',boxShadow:'0 8px 24px rgba(0,0,0,.4)',zIndex:10 }}>
                          {EMOJIS_CHAT.slice(0,6).map(e => (
                            <button key={e} style={{ background:'none',border:'none',cursor:'pointer',fontSize:14 }}
                              onMouseEnter={ev=>ev.target.style.transform='scale(1.3)'} onMouseLeave={ev=>ev.target.style.transform='scale(1)'}>{e}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span style={{ fontSize:10,color:'var(--text3)',marginTop:3 }}>{msg.time}</span>
                </div>
              </motion.div>
            );
          })}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{ display:'flex',gap:9,alignItems:'flex-end' }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',flexShrink:0 }}/>
                <div className="bubble-them" style={{ padding:'12px 16px' }}>
                  <p style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font)',marginBottom:5 }}>{typing} is typing</p>
                  <div style={{ display:'flex',gap:5,alignItems:'center' }}>
                    {[0,1,2].map(i=>(
                      <motion.div key={i}
                        animate={{ y:[0,-6,0], opacity:[0.4,1,0.4] }}
                        transition={{ duration:0.8, delay:i*0.15, repeat:Infinity, ease:'easeInOut' }}
                        style={{ width:7,height:7,borderRadius:'50%',background:'#818cf8' }}/>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef}/>
        </>}
      </div>

      {/* Input */}
      <div style={{ padding:'12px 20px',borderTop:'1px solid var(--border2)',flexShrink:0 }}>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <input className="inp" placeholder={`Message ${group.name}…`} value={input}
            onChange={handleTyping} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
            style={{ flex:1,borderRadius:14 }}/>
          <motion.button whileTap={{scale:.88}} onClick={send} disabled={!input.trim()}
            style={{ width:42,height:42,borderRadius:13,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(99,102,241,.4)',flexShrink:0,opacity:input.trim()?1:.4,transition:'opacity .2s' }}>
            <Send size={16} color="white"/>
          </motion.button>
        </div>
      </div>

      {/* Group Info Modal */}
      {showInfo && (
        <GroupInfoPanel
          group={group} user={user}
          onClose={() => setShowInfo(false)}
          onShowInvite={() => { setShowInfo(false); setShowInvite(true); }}
        />
      )}

      {/* Invite Code Modal */}
      {showInvite && (
        <InviteModal
          group={{ ...group, inviteCode: curCode }}
          onClose={() => setShowInvite(false)}
          onRegenerate={(newCode) => { setCurCode(newCode); setGroup(g => ({...g, inviteCode: newCode})); }}
        />
      )}
    </div>
  );
}

// ── Join Requests Panel ───────────────────────────────────────────────────────
function JoinRequestsPanel({ group, onClose, onApprove, onDecline }) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    apiGroups.getJoinRequests(group._id || group.id)
      .then(r => { setRequests(r||[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [group._id]);

  return (
    <Modal open onClose={onClose} title={`Join Requests — ${group.name}`}>
      {loading ? <Loading/> : requests.length === 0 ? (
        <div style={{ textAlign:'center',padding:'32px',color:'var(--text3)' }}>
          <Users size={28} style={{ margin:'0 auto 12px',opacity:.4 }}/>
          <p style={{ fontFamily:'var(--font)',fontSize:13 }}>No pending join requests</p>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          {requests.map(r => {
            const rId = r.user?._id || r.user?.id;
            return (
              <div key={rId} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--surface)',borderRadius:16,border:'1px solid var(--border2)' }}>
                <div style={{ width:42,height:42,borderRadius:'50%',background:`linear-gradient(${r.user?.grad||'135deg,#6366f1,#8b5cf6'})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'white',fontFamily:'var(--font)',flexShrink:0 }}>
                  {(r.user?.name||'?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:13 }}>{r.user?.name}</p>
                  <p style={{ fontSize:11,color:'var(--text2)' }}>{r.user?.college} · {r.user?.dept}</p>
                  {(r.user?.subjects||[]).length > 0 && (
                    <div style={{ display:'flex',gap:4,marginTop:4,flexWrap:'wrap' }}>
                      {r.user.subjects.slice(0,2).map(s => <Badge key={s} v="purple">{s}</Badge>)}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex',gap:6 }}>
                  <Btn v="accent" sz="xs" icon={<Check size={12}/>}
                    onClick={() => { onApprove(rId); setRequests(p => p.filter(x => (x.user?._id||x.user?.id) !== rId)); }}>
                    Approve
                  </Btn>
                  <Btn v="danger" sz="xs" icon={<X size={12}/>}
                    onClick={() => { onDecline(rId); setRequests(p => p.filter(x => (x.user?._id||x.user?.id) !== rId)); }}>
                    Decline
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ── Group Card ─────────────────────────────────────────────────────────────────
function GroupCard({ group, user, onOpenChat, onRequestJoin, onLeave, onViewRequests, onShowInfo, onShowInvite }) {
  const myId = user?._id || user?.id;
  const pendingCount = (group.joinRequests||[]).filter(r => r.status === 'pending').length;

  const statusBadge = () => {
    if (group.isAdmin)        return <Badge v="amber"><Crown size={10} style={{display:'inline',marginRight:3}}/>Admin</Badge>;
    if (group.isMember)       return <Badge v="green"><UserCheck size={10} style={{display:'inline',marginRight:3}}/>Joined</Badge>;
    if (group.pendingRequest) return <Badge v="amber"><Clock size={10} style={{display:'inline',marginRight:3}}/>Pending</Badge>;
    return null;
  };

  return (
    <motion.div whileHover={{ y:-6, scale:1.015 }} transition={{ type:'spring',stiffness:280,damping:22 }}
      style={{ background:'var(--card)',border:'1px solid var(--border2)',borderRadius:22,padding:22,position:'relative',overflow:'hidden',display:'flex',flexDirection:'column' }}>
      <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${group.color||'#6366f1'},transparent)` }}/>

      <div style={{ display:'flex',gap:12,alignItems:'flex-start',marginBottom:14 }}>
        <div style={{ width:52,height:52,borderRadius:15,background:`linear-gradient(135deg,${group.color||'#6366f1'}30,${group.color||'#6366f1'}15)`,border:`1px solid ${group.color||'#6366f1'}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0 }}>
          {group.avatar || '📚'}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:3,flexWrap:'wrap' }}>
            <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{group.name}</p>
            {statusBadge()}
          </div>
          <p style={{ fontSize:11,color:group.color||'#818cf8',fontWeight:600 }}>{group.subject}</p>
        </div>
        {group.isAdmin && pendingCount > 0 && (
          <button onClick={e=>{e.stopPropagation();onViewRequests(group);}}
            style={{ width:26,height:26,borderRadius:'50%',background:'var(--rose)',border:'none',color:'white',fontSize:11,fontWeight:700,fontFamily:'var(--font)',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
            {pendingCount}
          </button>
        )}
      </div>

      {group.desc && <p style={{ fontSize:12,color:'var(--text2)',lineHeight:1.7,marginBottom:12,flex:1 }}>{group.desc}</p>}

      {(group.tags||[]).length > 0 && (
        <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginBottom:12 }}>
          {group.tags.map(t => <Badge key={t} v="purple">#{t}</Badge>)}
        </div>
      )}

      {/* Members row + info/invite buttons */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <div style={{ display:'flex' }}>
            {(group.members||[]).slice(0,4).map((m,idx) => {
              const u = typeof m === 'object' ? m : { name:'?', grad:'135deg,#6366f1,#8b5cf6' };
              return (
                <div key={idx} style={{ width:24,height:24,borderRadius:'50%',background:`linear-gradient(${u.grad||'135deg,#6366f1,#8b5cf6'})`,border:'2px solid var(--card)',marginLeft:idx>0?-8:0,zIndex:4-idx,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white',fontFamily:'var(--font)' }}>
                  {(u.name||'?')[0]?.toUpperCase()}
                </div>
              );
            })}
          </div>
          <span style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font)' }}>{group.memberCount||group.members?.length||0}/{group.maxSize}</span>
        </div>
        <div style={{ display:'flex',gap:6 }}>
          {/* Info button — all members */}
          {(group.isMember || group.isAdmin) && (
            <button onClick={e=>{e.stopPropagation();onShowInfo(group);}}
              style={{ display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--text2)',background:'rgba(255,255,255,.05)',border:'1px solid var(--border2)',borderRadius:8,padding:'4px 9px',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600 }}>
              <Info size={10}/>Info
            </button>
          )}
          {/* Invite button — admin only */}
          {group.isAdmin && (
            <button onClick={e=>{e.stopPropagation();onShowInvite(group);}}
              style={{ display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#818cf8',background:'rgba(99,102,241,.1)',border:'1px solid rgba(99,102,241,.2)',borderRadius:8,padding:'4px 9px',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600 }}>
              <Link size={10}/>Invite
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex',gap:8 }}>
        {group.isMember || group.isAdmin ? (
          <>
            <Btn v="primary" sz="sm" style={{flex:1}} icon={<MessageSquare size={13}/>}
              onClick={e=>{e.stopPropagation();onOpenChat(group);}}>Open Chat</Btn>
            {!group.isAdmin && (
              <Btn v="danger" sz="sm" icon={<LogOut size={13}/>}
                onClick={e=>{e.stopPropagation();onLeave(group);}}>Leave</Btn>
            )}
            {group.isAdmin && pendingCount > 0 && (
              <Btn v="secondary" sz="sm" icon={<Bell size={13}/>}
                onClick={e=>{e.stopPropagation();onViewRequests(group);}}>
                {pendingCount} Req.
              </Btn>
            )}
          </>
        ) : group.pendingRequest ? (
          <button disabled style={{ flex:1,padding:'8px',borderRadius:10,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',color:'#fbbf24',fontSize:12,fontFamily:'var(--font)',fontWeight:700,cursor:'default',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
            <Clock size={13}/>Request Pending
          </button>
        ) : (
          <Btn v="primary" sz="sm" style={{flex:1}} icon={<Plus size={13}/>}
            onClick={e=>{e.stopPropagation();onRequestJoin(group);}}>Request to Join</Btn>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Groups Page ───────────────────────────────────────────────────────────
export default function Groups() {
  const { user } = useApp();
  const [groups,      setGroups]     = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [tab,         setTab]        = useState('mine');
  const [search,      setSearch]     = useState('');
  const [chatGroup,   setChatGroup]  = useState(null);
  const [showCreate,  setShowCreate] = useState(false);
  const [reqPanel,    setReqPanel]   = useState(null);
  const [infoGroup,   setInfoGroup]  = useState(null);
  const [inviteGroup, setInviteGroup]= useState(null);
  const [creating,    setCreating]   = useState(false);
  const [error,       setError]      = useState('');
  const [form, setForm] = useState({ name:'', subject:'', desc:'', maxSize:8, tags:'', avatar:'📚', color:'#6366f1', isPublic:true });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const uid = user?._id || user?.id;

  const load = () => {
    if (!uid) return;
    setLoading(true);
    apiGroups.getAll().then(d => { setGroups(d||[]); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [uid]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => load();
    socket.on('new_join_request',     refresh);
    socket.on('join_request_approved',refresh);
    return () => {
      socket.off('new_join_request',     refresh);
      socket.off('join_request_approved',refresh);
    };
  }, [uid]);

  const myGroups       = groups.filter(g => g.isMember || g.isAdmin);
  const discoverGroups = groups.filter(g => !g.isMember && !g.isAdmin);
  const filtered       = (tab === 'mine' ? myGroups : discoverGroups)
    .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.subject.toLowerCase().includes(search.toLowerCase()));

  const create = async () => {
    if (!form.name.trim() || !form.subject.trim()) return setError('Name and subject are required.');
    setCreating(true); setError('');
    try {
      const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
      const g = await apiGroups.create({ name:form.name, subject:form.subject, desc:form.desc, maxSize:form.maxSize, tags, avatar:form.avatar, color:form.color, isPublic:form.isPublic });
      setGroups(p => [g, ...p]);
      setShowCreate(false);
      setForm({ name:'', subject:'', desc:'', maxSize:8, tags:'', avatar:'📚', color:'#6366f1', isPublic:true });
      setTab('mine');
      // Show invite code immediately after creation
      setInviteGroup(g);
    } catch (e) { setError(e.message || 'Failed to create group.'); }
    setCreating(false);
  };

  const requestJoin = async (group) => {
    try {
      await apiGroups.requestJoin(group._id || group.id);
      setGroups(p => p.map(g => (g._id||g.id)===(group._id||group.id) ? {...g, pendingRequest:true} : g));
      const socket = getSocket();
      if (socket) socket.emit('join_request_sent', { adminId: group.admin?._id||group.admin, groupName: group.name, userName: user.name });
    } catch (e) { alert(e.message || 'Failed to send request.'); }
  };

  const leave = async (group) => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    try {
      await apiGroups.leaveGroup(group._id || group.id);
      setGroups(p => p.map(g => (g._id||g.id)===(group._id||group.id) ? {...g, isMember:false} : g));
    } catch (e) { alert(e.message || 'Failed to leave.'); }
  };

  const approveJoin = async (groupId, requestUserId) => {
    try {
      await apiGroups.approveJoin(groupId, requestUserId);
      const socket = getSocket();
      if (socket) {
        const g = groups.find(x=>(x._id||x.id)===groupId);
        socket.emit('join_approved', { userId: requestUserId, groupId, groupName: g?.name });
      }
      load();
    } catch (e) { alert(e.message); }
  };

  const declineJoin = async (groupId, requestUserId) => {
    try {
      await apiGroups.declineJoin(groupId, requestUserId);
      load();
    } catch (e) { alert(e.message); }
  };

  if (chatGroup) {
    return <GroupChat group={chatGroup} user={user} onBack={() => { setChatGroup(null); load(); }}/>;
  }

  return (
    <div style={{ padding:'28px 28px 56px', maxWidth:1280 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:22,marginBottom:4 }}>Study Groups</h2>
          <p style={{ fontSize:13,color:'var(--text2)' }}>Collaborate in focused study sessions. Admins approve all join requests.</p>
        </div>
        <Btn v="primary" icon={<Plus size={15}/>} onClick={() => setShowCreate(true)}>Create Group</Btn>
      </div>

      {/* Tabs + Search */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ display:'flex',gap:4,background:'var(--surface)',padding:4,borderRadius:16 }}>
          {[{id:'mine',label:`My Groups (${myGroups.length})`},{id:'discover',label:`Discover (${discoverGroups.length})`}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'8px 18px',borderRadius:12,fontSize:12,fontWeight:700,fontFamily:'var(--font)',border:'none',cursor:'pointer',background:tab===t.id?'linear-gradient(135deg,#4f46e5,#7c3aed)':'transparent',color:tab===t.id?'white':'var(--text3)',transition:'all .2s',whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ position:'relative',flex:1,maxWidth:280 }}>
          <Search size={13} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none' }}/>
          <input className="inp" placeholder="Search groups..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:34,height:38,fontSize:13 }}/>
        </div>
      </div>

      {loading ? <Loading text="Loading groups..."/> : filtered.length === 0 ? (
        <Empty icon={Users} title={tab==='mine'?'No groups yet':'No groups to discover'} sub={tab==='mine'?'Create your first group or discover public groups':'All public groups are listed here'}>
          {tab==='mine' && <Btn v="primary" icon={<Plus size={15}/>} onClick={() => setShowCreate(true)}>Create Group</Btn>}
          {tab==='discover' && <Btn v="secondary" onClick={() => setTab('mine')}>View My Groups</Btn>}
        </Empty>
      ) : (
        <motion.div initial="hidden" animate="show"
          variants={{ hidden:{}, show:{ transition:{ staggerChildren:.07 } } }}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
          {filtered.map(g => (
            <motion.div key={g._id||g.id} variants={{ hidden:{opacity:0,y:20}, show:{opacity:1,y:0} }}>
              <GroupCard
                group={g} user={user}
                onOpenChat={setChatGroup}
                onRequestJoin={requestJoin}
                onLeave={leave}
                onViewRequests={setReqPanel}
                onShowInfo={setInfoGroup}
                onShowInvite={setInviteGroup}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Group Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); }} title="Create Study Group">
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {error && <div style={{ padding:'10px 14px',background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.25)',borderRadius:10,color:'#fda4af',fontSize:12 }}>{error}</div>}

          <div>
            <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:9 }}>Group Avatar</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
              {GROUP_AVATARS.map(a => (
                <button key={a.emoji} onClick={() => setForm(p=>({...p,avatar:a.emoji}))} title={a.label}
                  style={{ width:40,height:40,borderRadius:11,background:form.avatar===a.emoji?'rgba(99,102,241,.25)':'rgba(255,255,255,.04)',border:`2px solid ${form.avatar===a.emoji?'#6366f1':'var(--border2)'}`,fontSize:20,cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:9 }}>Accent Color</label>
            <div style={{ display:'flex',gap:8 }}>
              {GROUP_COLORS.map(c => (
                <button key={c} onClick={() => setForm(p=>({...p,color:c}))}
                  style={{ width:28,height:28,borderRadius:'50%',background:c,border:`3px solid ${form.color===c?'white':'transparent'}`,cursor:'pointer',transition:'all .15s' }}/>
              ))}
            </div>
          </div>

          <Inp label="Group Name *" placeholder="e.g. DSA Mastery Squad" value={form.name} onChange={f('name')}/>
          <Inp label="Subject / Topic *" placeholder="e.g. Data Structures & Algorithms" value={form.subject} onChange={f('subject')}/>
          <div>
            <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:6 }}>Description</label>
            <textarea className="inp" rows={3} placeholder="What will this group focus on?" style={{ resize:'none' }} value={form.desc} onChange={f('desc')}/>
          </div>
          <Inp label="Tags (comma separated)" placeholder="DSA, Placement, Competitive" value={form.tags} onChange={f('tags')}/>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:6 }}>Max Members</label>
              <select className="inp" value={form.maxSize} onChange={e=>setForm(p=>({...p,maxSize:+e.target.value}))} style={{ appearance:'none',cursor:'pointer' }}>
                {[4,6,8,10,15,20].map(n=><option key={n} value={n}>{n} members</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:6 }}>Visibility</label>
              <select className="inp" value={form.isPublic?'public':'private'} onChange={e=>setForm(p=>({...p,isPublic:e.target.value==='public'}))} style={{ appearance:'none',cursor:'pointer' }}>
                <option value="public">Public (discoverable)</option>
                <option value="private">Private (invite only)</option>
              </select>
            </div>
          </div>
          <div style={{ background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.15)',borderRadius:12,padding:'10px 14px',fontSize:12,color:'var(--text2)' }}>
            <Shield size={12} style={{ display:'inline',marginRight:6,color:'#818cf8' }}/>
            After creating, you'll receive an invite code to share with others. New members need your approval.
          </div>
          <div style={{ display:'flex',gap:10,paddingTop:4 }}>
            <Btn v="primary" style={{flex:1}} loading={creating} onClick={create}>Create Group</Btn>
            <Btn v="secondary" style={{flex:1}} onClick={() => { setShowCreate(false); setError(''); }}>Cancel</Btn>
          </div>
        </div>
      </Modal>

      {/* Join Requests Panel */}
      {reqPanel && (
        <JoinRequestsPanel
          group={reqPanel}
          onClose={() => setReqPanel(null)}
          onApprove={(userId) => approveJoin(reqPanel._id||reqPanel.id, userId)}
          onDecline={(userId) => declineJoin(reqPanel._id||reqPanel.id, userId)}
        />
      )}

      {/* Group Info Panel */}
      {infoGroup && (
        <GroupInfoPanel
          group={infoGroup} user={user}
          onClose={() => setInfoGroup(null)}
          onShowInvite={() => { setInviteGroup(infoGroup); setInfoGroup(null); }}
        />
      )}

      {/* Invite Code Modal */}
      {inviteGroup && (
        <InviteModal
          group={inviteGroup}
          onClose={() => setInviteGroup(null)}
          onRegenerate={(newCode) => {
            setGroups(p => p.map(g => (g._id||g.id)===(inviteGroup._id||inviteGroup.id) ? {...g, inviteCode:newCode} : g));
            setInviteGroup(g => ({...g, inviteCode:newCode}));
          }}
        />
      )}
    </div>
  );
}
