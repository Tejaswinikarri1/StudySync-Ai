import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Video, MessageSquare, Lock, Hash } from 'lucide-react';
import { Avatar, Loading, Empty } from '../components/ui/index.jsx';
import { apiDM, apiGroups, apiUsers } from '../api/realApi.js';
import { useApp } from '../context/AppContext.jsx';
import { onSocket, getSocket } from '../api/socket.js';

const EMOJIS = ['👍','🔥','💡','❓','🙏','😂','✅','🎯'];

let _audioCtx = null;
function playNotif() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

export default function Chat({ initialDMUser }) {
  const { user } = useApp();
  const myId = user?._id || user?.id;

  const [view,        setView]       = useState('dm');
  const [connections, setConns]      = useState([]);
  const [groups,      setGroups]     = useState([]);
  const [activeConn,  setActiveConn] = useState(null);
  const [activeGroup, setActiveGroup]= useState(null);
  const [messages,    setMsgs]       = useState([]);
  const [input,       setInput]      = useState('');
  const [loading,     setLoading]    = useState(false);
  const [typing,      setTyping]     = useState(null);
  const [showEmoji,   setShowEmoji]  = useState(null);

  // Refs so socket callbacks always read current values (no stale closures)
  const viewRef        = useRef(view);
  const activeConnRef  = useRef(null);
  const activeGroupRef = useRef(null);
  const myIdRef        = useRef(myId);
  const endRef         = useRef(null);
  const typingTimer    = useRef(null);

  useEffect(() => { viewRef.current = view; },              [view]);
  useEffect(() => { activeConnRef.current  = activeConn;  }, [activeConn]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);
  useEffect(() => { myIdRef.current        = myId;        }, [myId]);

  // ── Load sidebar lists ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    apiUsers.getConnections(myId).then(c => {
      setConns(c || []);
      if (initialDMUser) {
        const conn = (c||[]).find(cn => (cn.user?._id||cn.user?.id) === (initialDMUser._id||initialDMUser.id));
        if (conn) { setActiveConn(conn); setView('dm'); }
      }
    }).catch(() => {});
    apiGroups.getAll().then(g => setGroups((g||[]).filter(x => x.isMember || x.isAdmin))).catch(() => {});
  }, [myId, initialDMUser]);

  // ── Load messages when conversation changes ────────────────────────────────
  useEffect(() => {
    if (view === 'dm' && activeConn) {
      const otherId = activeConn.user?._id || activeConn.user?.id;
      if (!otherId) return;
      setLoading(true); setMsgs([]);
      apiDM.getMessages(otherId).then(m => { setMsgs(m||[]); setLoading(false); }).catch(() => setLoading(false));
    } else if (view === 'group' && activeGroup) {
      setLoading(true); setMsgs([]);
      apiGroups.getMessages(activeGroup._id||activeGroup.id).then(m => { setMsgs(m||[]); setLoading(false); }).catch(() => setLoading(false));
    } else {
      setMsgs([]);
    }
  }, [activeConn?._id, activeConn?.id, activeGroup?._id, activeGroup?.id, view]);

  // ── Join/leave group socket room ───────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || view !== 'group' || !activeGroup) return;
    const gid = activeGroup._id || activeGroup.id;
    socket.emit('join_room', { groupId: gid });
    return () => socket.emit('leave_room', { groupId: gid });
  }, [view, activeGroup?._id, activeGroup?.id]);

  // ── Socket listeners — registered with onSocket (safe before connect) ──────
  // Registered ONCE when myId is available. All state read via refs.
  useEffect(() => {
    if (!myId) return;

    const unDM = onSocket('new_dm_message', (msg) => {
      if (viewRef.current !== 'dm') return;
      const conn     = activeConnRef.current;
      const otherId  = conn?.user?._id || conn?.user?.id;
      const senderId = msg.sender?._id || msg.sender || msg.from;
      if (!otherId || senderId !== otherId) return;

      const m = {
        id:   msg._id || ('rt_'+Date.now()),
        from: senderId,
        text: msg.text,
        time: new Date(msg.createdAt||Date.now()).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}),
      };
      setMsgs(p => p.some(x => x.id === m.id) ? p : [...p, m]);
      playNotif();
    });

    const unGroup = onSocket('new_group_message', (msg) => {
      if (viewRef.current !== 'group') return;
      const grp     = activeGroupRef.current;
      const curGid  = grp?._id || grp?.id;
      const msgGid  = msg.group || msg.groupId;
      if (!curGid) return;
      if (msgGid && msgGid.toString() !== curGid.toString()) return;

      const senderId = msg.sender?._id || msg.userId || msg.sender;
      const m = {
        id:         msg._id || ('rt_'+Date.now()),
        userId:     senderId,
        text:       msg.text,
        time:       new Date(msg.createdAt||Date.now()).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}),
        senderName: msg.sender?.name || msg.senderName || 'Member',
        senderGrad: msg.sender?.grad || msg.senderGrad || '135deg,#6366f1,#8b5cf6',
        isSystem:   msg.isSystem || false,
      };
      setMsgs(p => p.some(x => x.id === m.id) ? p : [...p, m]);
      if (senderId !== myIdRef.current) playNotif();
    });

    const unDMTyping    = onSocket('dm_user_typing',      ({ fromName }) => {
      if (viewRef.current !== 'dm') return;
      setTyping(fromName);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 3000);
    });
    const unDMStop      = onSocket('dm_user_stop_typing', () => setTyping(null));

    const unGrpTyping   = onSocket('user_typing',         ({ name, userId }) => {
      if (viewRef.current !== 'group' || userId === myIdRef.current) return;
      setTyping(name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 3000);
    });
    const unGrpStop     = onSocket('user_stop_typing',    () => setTyping(null));

    return () => { unDM(); unGroup(); unDMTyping(); unDMStop(); unGrpTyping(); unGrpStop(); };
  }, [myId]); // runs once per user session

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const emitTypingStart = () => {
    const socket = getSocket();
    if (!socket) return;
    if (view === 'dm' && activeConn) {
      socket.emit('dm_typing_start', { toUserId: activeConn.user?._id||activeConn.user?.id, fromName: user?.name });
    } else if (view === 'group' && activeGroup) {
      socket.emit('typing_start', { groupId: activeGroup._id||activeGroup.id, userId: myId, name: user?.name });
    }
  };

  const emitTypingStop = () => {
    const socket = getSocket();
    if (!socket) return;
    if (view === 'dm' && activeConn) {
      socket.emit('dm_typing_stop', { toUserId: activeConn.user?._id||activeConn.user?.id });
    } else if (view === 'group' && activeGroup) {
      socket.emit('typing_stop', { groupId: activeGroup._id||activeGroup.id });
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    emitTypingStart();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(emitTypingStop, 2000);
  };

  const send = async () => {
    if (!input.trim()) return;
    const text  = input.trim();
    const socket = getSocket();
    setInput('');
    emitTypingStop();

    if (view === 'dm' && activeConn) {
      const otherId = activeConn.user?._id || activeConn.user?.id;
      const optId   = 'opt_' + Date.now();
      const opt     = { id: optId, from: myId, text, time: new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}) };

      setMsgs(p => [...p, opt]);

      try {
        const saved = await apiDM.send(otherId, myId, text);
        setMsgs(p => p.map(m => m.id === optId ? { ...saved, from: myId } : m));
        // Broadcast to recipient via socket
        if (socket) {
          socket.emit('dm_message', {
            toUserId: otherId,
            message: {
              _id: saved.id, from: myId, text,
              createdAt: new Date().toISOString(),
              sender: { _id: myId, name: user?.name, grad: user?.grad },
            },
          });
        }
      } catch (e) {
        setMsgs(p => p.filter(m => m.id !== optId));
        console.error('Send DM failed:', e.message);
      }

    } else if (view === 'group' && activeGroup) {
      const groupId = activeGroup._id || activeGroup.id;
      const optId   = 'opt_' + Date.now();
      const opt     = { id: optId, userId: myId, text, time: new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}), senderName: user?.name, senderGrad: user?.grad };

      setMsgs(p => [...p, opt]);

      try {
        const saved = await apiGroups.sendMessage(groupId, text);
        setMsgs(p => p.map(m => m.id === optId ? { ...saved, userId: myId } : m));
        if (socket) {
          socket.emit('group_message', {
            groupId,
            message: {
              _id: saved.id || saved._id, group: groupId, text,
              createdAt: new Date().toISOString(),
              userId: myId,
              senderName: user?.name, senderGrad: user?.grad,
              sender: { _id: myId, name: user?.name, grad: user?.grad },
            },
          });
        }
      } catch (e) {
        setMsgs(p => p.filter(m => m.id !== optId));
        console.error('Send group msg failed:', e.message);
      }
    }
  };

  const hasActive = (view === 'dm' && activeConn) || (view === 'group' && activeGroup);

  return (
    <div style={{ display:'flex', height:'calc(100vh - 62px)', overflow:'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{ width:260, borderRight:'1px solid var(--border2)', display:'flex', flexDirection:'column', flexShrink:0, background:'rgba(6,13,26,.6)' }}>
        <div style={{ padding:12, borderBottom:'1px solid var(--border2)' }}>
          <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:14,marginBottom:10,paddingLeft:2 }}>Messages</p>
          <div style={{ display:'flex',gap:4,background:'var(--bg2)',padding:4,borderRadius:12 }}>
            {[{id:'dm',label:'DMs',Icon:MessageSquare},{id:'group',label:'Groups',Icon:Hash}].map(v => (
              <button key={v.id} onClick={() => { setView(v.id); setActiveConn(null); setActiveGroup(null); setMsgs([]); setTyping(null); }}
                style={{ flex:1,padding:'8px 4px',borderRadius:9,fontSize:12,fontWeight:700,fontFamily:'var(--font)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                  background:view===v.id?'linear-gradient(135deg,#4f46e5,#7c3aed)':'transparent',
                  color:view===v.id?'white':'var(--text3)',transition:'all .2s' }}>
                <v.Icon size={13}/>{v.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {view === 'dm' ? (
            connections.length === 0 ? (
              <div style={{ padding:'28px 16px', textAlign:'center' }}>
                <Lock size={24} color="var(--text3)" style={{ margin:'0 auto 12px', display:'block' }}/>
                <p style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--font)', lineHeight:1.7 }}>Connect with study partners to unlock direct messaging</p>
              </div>
            ) : connections.map(c => {
              const active = (activeConn?._id||activeConn?.id) === (c._id||c.id);
              return (
                <button key={c._id||c.id} onClick={() => { setActiveConn(c); setActiveGroup(null); setView('dm'); }}
                  style={{ width:'100%',display:'flex',alignItems:'center',gap:11,padding:'13px 14px',background:active?'rgba(99,102,241,.1)':'transparent',borderTop:'none',borderRight:'none',borderBottom:'1px solid rgba(255,255,255,.03)',borderLeft:`2px solid ${active?'#6366f1':'transparent'}`,cursor:'pointer',textAlign:'left',transition:'all .2s' }}>
                  <Avatar user={c.user} size={40} ring={active}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700,fontSize:13,fontFamily:'var(--font)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.user?.name}</p>
                    <p style={{ fontSize:11,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.user?.subjects?.[0]||'Start a conversation'}</p>
                  </div>
                </button>
              );
            })
          ) : (
            groups.length === 0 ? (
              <div style={{ padding:'28px 16px', textAlign:'center' }}>
                <Hash size={24} color="var(--text3)" style={{ margin:'0 auto 12px', display:'block' }}/>
                <p style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--font)', lineHeight:1.7 }}>Join or create study groups to chat here</p>
              </div>
            ) : groups.map(g => {
              const active = (activeGroup?._id||activeGroup?.id) === (g._id||g.id);
              return (
                <button key={g._id||g.id} onClick={() => { setActiveGroup(g); setActiveConn(null); setView('group'); }}
                  style={{ width:'100%',display:'flex',alignItems:'center',gap:11,padding:'13px 14px',background:active?'rgba(99,102,241,.1)':'transparent',borderTop:'none',borderRight:'none',borderBottom:'1px solid rgba(255,255,255,.03)',borderLeft:`2px solid ${active?'#6366f1':'transparent'}`,cursor:'pointer',textAlign:'left',transition:'all .2s' }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${g.color||'#6366f1'}30,${g.color||'#6366f1'}15)`,border:`1px solid ${g.color||'#6366f1'}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
                    {g.avatar||'📚'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700,fontSize:13,fontFamily:'var(--font)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{g.name}</p>
                    <p style={{ fontSize:11,color:'var(--text3)' }}>{g.members?.length||1} member{g.members?.length!==1?'s':''}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      {hasActive ? (
        <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
          {/* Header */}
          <div style={{ padding:'12px 20px',borderBottom:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'rgba(9,18,33,.6)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              {view === 'dm' ? (
                <><Avatar user={activeConn?.user} size={38} ring/>
                <div>
                  <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:14 }}>{activeConn?.user?.name}</p>
                  <p style={{ fontSize:11,color:'var(--green)' }}>● Connected</p>
                </div></>
              ) : (
                <><div style={{ width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${activeGroup?.color||'#6366f1'}30,${activeGroup?.color||'#6366f1'}15)`,border:`1px solid ${activeGroup?.color||'#6366f1'}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>
                  {activeGroup?.avatar||'📚'}
                </div>
                <div>
                  <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:14 }}>{activeGroup?.name}</p>
                  <p style={{ fontSize:11,color:'var(--green)' }}>● {activeGroup?.members?.length||1} members</p>
                </div></>
              )}
            </div>
            <button style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:'rgba(255,255,255,.04)',border:'1px solid var(--border2)',borderRadius:9,fontSize:11,fontFamily:'var(--font)',fontWeight:600,color:'var(--text2)',cursor:'pointer' }}>
              <Video size={12}/>Video
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12 }}>
            {loading ? <Loading/> : <>
              {messages.length === 0 && (
                <div style={{ textAlign:'center',padding:'40px 20px',color:'var(--text3)' }}>
                  <MessageSquare size={28} style={{ margin:'0 auto 12px',opacity:.4 }}/>
                  <p style={{ fontFamily:'var(--font)',fontSize:13 }}>No messages yet — say hello! 👋</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                if (msg.isSystem) return (
                  <div key={msg.id||idx} style={{ textAlign:'center' }}>
                    <span style={{ fontSize:11,color:'var(--text3)',background:'rgba(255,255,255,.04)',borderRadius:10,padding:'3px 12px',fontFamily:'var(--font)' }}>{msg.text}</span>
                  </div>
                );
                const isMine = view === 'dm' ? msg.from === myId : msg.userId === myId;
                const sName = view === 'dm' ? (isMine ? user?.name : activeConn?.user?.name) : (msg.senderName||'Member');
                const sGrad = view === 'dm' ? (isMine ? user?.grad : activeConn?.user?.grad) : (msg.senderGrad||'135deg,#6366f1,#8b5cf6');

                return (
                  <motion.div key={msg.id||idx} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{ display:'flex',gap:9,alignItems:'flex-end',flexDirection:isMine?'row-reverse':'row' }}>
                    {!isMine && (
                      <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(${sGrad||'135deg,#6366f1,#8b5cf6'})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',fontFamily:'var(--font)',flexShrink:0 }}>
                        {(sName||'?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth:'65%',display:'flex',flexDirection:'column',alignItems:isMine?'flex-end':'flex-start' }}>
                      {!isMine && view==='group' && <p style={{ fontSize:11,color:'var(--text3)',marginBottom:3,marginLeft:3,fontFamily:'var(--font)',fontWeight:600 }}>{(sName||'Member').split(' ')[0]}</p>}
                      <div className={isMine?'bubble-me':'bubble-them'}
                        style={{ padding:'9px 14px',fontSize:13,lineHeight:1.6,position:'relative',cursor:'default',opacity:msg.id?.startsWith?.('opt_')?0.6:1 }}
                        onMouseEnter={()=>setShowEmoji(msg.id||idx)} onMouseLeave={()=>setShowEmoji(null)}>
                        {msg.text}
                        <AnimatePresence>
                          {showEmoji===(msg.id||idx) && (
                            <motion.div initial={{opacity:0,scale:.85,y:4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.85}}
                              style={{ position:'absolute',[isMine?'right':'left']:0,top:-38,display:'flex',gap:4,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'5px 8px',boxShadow:'0 8px 24px rgba(0,0,0,.4)',zIndex:10 }}>
                              {EMOJIS.map(e=>(
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

              {/* Typing indicator with three animated dots */}
              <AnimatePresence>
                {typing && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}}
                    style={{ display:'flex',gap:9,alignItems:'flex-end' }}>
                    <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',flexShrink:0 }}/>
                    <div className="bubble-them" style={{ padding:'12px 16px' }}>
                      <p style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font)',marginBottom:5 }}>{typing} is typing</p>
                      <div style={{ display:'flex',gap:5,alignItems:'center' }}>
                        {[0,1,2].map(i => (
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
            <div style={{ display:'flex',gap:9,alignItems:'center' }}>
              <input className="inp"
                placeholder={view==='dm'?`Message ${activeConn?.user?.name?.split(' ')[0]}…`:`Message ${activeGroup?.name}…`}
                value={input} onChange={handleInput}
                onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send(); } }}
                style={{ flex:1,borderRadius:14 }}/>
              <motion.button whileTap={{scale:.88}} onClick={send} disabled={!input.trim()}
                style={{ width:42,height:42,borderRadius:13,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(99,102,241,.4)',flexShrink:0,opacity:input.trim()?1:.4,transition:'opacity .2s' }}>
                <Send size={16} color="white"/>
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Empty
            icon={view==='dm'?Lock:MessageSquare}
            title={view==='dm'?'Select a conversation':'Select a group'}
            sub={view==='dm'?'One-on-one chat is available between connected users':'Pick a group from the sidebar'}/>
        </div>
      )}
    </div>
  );
}
