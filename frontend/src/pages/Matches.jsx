import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, Clock, Search, UserCheck, Inbox, Send, Zap, Users, Lock } from 'lucide-react';
import { Avatar, ScoreRing, Badge, Btn, Modal, Loading, Empty } from '../components/ui/index.jsx';
import { apiUsers } from '../api/realApi.js';
import { useApp } from '../context/AppContext.jsx';

// ─── MATCHES ──────────────────────────────────────────────────────────────────
export function Matches() {
  const { user } = useApp();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subject:'', skill:'', avail:'' });
  const [modal, setModal]     = useState(null);

  useEffect(() => {
    if (!user?._id && !user?.id) return;
    setLoading(true);
    apiUsers.getMatches(user._id || user.id, filters)
      .then(d => { setUsers(d || []); setLoading(false); })
      .catch(() => { setUsers([]); setLoading(false); });
  }, [filters, user?._id, user?.id]);

  const sendReq = async uid => {
    const conn = await apiUsers.sendRequest(user._id || user.id, uid);
    setUsers(prev => prev.map(u => (u._id || u.id) === uid ? { ...u, connStatus: conn.status } : u));
    if (modal && (modal._id || modal.id) === uid) setModal(prev => ({ ...prev, connStatus: conn.status }));
  };

  const FACTORS = [
    { label:'Subjects', pct:'40%', color:'#818cf8' }, { label:'Skill Level', pct:'20%', color:'#10b981' },
    { label:'Availability', pct:'20%', color:'#f59e0b' }, { label:'Learning Style', pct:'10%', color:'#ec4899' },
    { label:'Goals', pct:'10%', color:'#22d3ee' },
  ];

  return (
    <div style={{ padding:'28px 28px 48px', maxWidth:1280 }}>
      <div style={{ marginBottom:22 }}>
        <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>Find Study Partners</h2>
        <p style={{ fontSize:13, color:'var(--text2)' }}>AI compatibility scoring across 5 key dimensions</p>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
        {FACTORS.map(f => (
          <div key={f.label} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 13px', background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, fontSize:12 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:f.color }} />
            <span style={{ fontFamily:'var(--font)', fontWeight:600 }}>{f.label}</span>
            <span style={{ fontFamily:'var(--font)', fontWeight:800, color:f.color }}>{f.pct}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:24, alignItems:'center' }}>
        <div style={{ position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} />
          <input className="inp" placeholder="Filter by subject..." value={filters.subject}
            onChange={e => setFilters(f => ({ ...f, subject:e.target.value }))}
            style={{ paddingLeft:32, height:38, width:200, fontSize:13 }} />
        </div>
        <select className="inp" value={filters.skill} onChange={e => setFilters(f => ({ ...f, skill:e.target.value }))}
          style={{ height:38, width:158, fontSize:13, appearance:'none', cursor:'pointer' }}>
          <option value="">All Skill Levels</option>
          {['Beginner','Intermediate','Advanced'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select className="inp" value={filters.avail} onChange={e => setFilters(f => ({ ...f, avail:e.target.value }))}
          style={{ height:38, width:150, fontSize:13, appearance:'none', cursor:'pointer' }}>
          <option value="">All Times</option>
          {['Morning','Afternoon','Evening','Night','Flexible'].map(o => <option key={o}>{o}</option>)}
        </select>
        {(filters.subject || filters.skill || filters.avail) && (
          <button onClick={() => setFilters({ subject:'', skill:'', avail:'' })}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)', borderRadius:10, fontSize:12, color:'var(--text2)', cursor:'pointer', fontFamily:'var(--font)', fontWeight:600 }}>
            <X size={13} />Clear
          </button>
        )}
      </div>

      {loading ? <Loading text="Running AI matching algorithm..." />
      : users.length === 0
        ? <Empty icon={Users} title="No partners found" sub={(!user?.subjects?.length) ? "Add subjects to your profile to get matched with compatible partners" : "No partners match your current filters"} />
        : (
          <motion.div initial="hidden" animate="show"
            variants={{ hidden:{}, show:{ transition:{ staggerChildren:.07 } } }}
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
            {users.map(u => { const uid = u._id || u.id; return <MatchCard key={uid} user={u} onView={() => setModal(u)} onConnect={() => sendReq(uid)} />; })}
          </motion.div>
        )
      }

      <Modal open={!!modal} onClose={() => setModal(null)} title="Student Profile" mw="max-w-xl">
        {modal && <ProfileModal user={modal} onConnect={() => sendReq(modal._id || modal.id)} onClose={() => setModal(null)} />}
      </Modal>
    </div>
  );
}

function ConnBtn({ cs, onConnect }) {
  if (cs === 'accepted') return <button style={{ flex:1, padding:'8px', borderRadius:10, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#34d399', fontSize:12, fontFamily:'var(--font)', fontWeight:700, cursor:'default', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><Check size={13}/>Connected</button>;
  if (cs === 'pending')  return <button style={{ flex:1, padding:'8px', borderRadius:10, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', color:'#fbbf24', fontSize:12, fontFamily:'var(--font)', fontWeight:700, cursor:'default', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><Clock size={13}/>Pending</button>;
  return <Btn v="primary" sz="sm" style={{ flex:1 }} icon={<UserPlus size={13}/>} onClick={onConnect}>Connect</Btn>;
}

function MatchCard({ user:u, onView, onConnect }) {
  return (
    <motion.div variants={{ hidden:{opacity:0,y:20}, show:{opacity:1,y:0} }}
      whileHover={{ y:-7, scale:1.015 }} transition={{ type:'spring', stiffness:280, damping:22 }}
      style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, padding:22, position:'relative', overflow:'hidden', cursor:'pointer' }}
      onClick={onView}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2.5, background:`linear-gradient(90deg,transparent,${u.score>=90?'#10b981':'#6366f1'},transparent)` }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <Avatar user={u} size={50} ring={u.score >= 90}/>
          <div>
            <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15, marginBottom:2 }}>{u.name}</p>
            <p style={{ fontSize:11, color:'var(--text2)' }}>{u.college || '—'}</p>
            <p style={{ fontSize:11, color:'#818cf8', marginTop:1 }}>{u.dept} · {u.year}</p>
          </div>
        </div>
        <ScoreRing score={u.score} size={56}/>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
        {(u.subjects||[]).slice(0,3).map(s => <Badge key={s} v="purple">{s}</Badge>)}
        {(u.subjects||[]).length > 3 && <Badge v="purple">+{u.subjects.length-3}</Badge>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:12 }}>
        {[['Skill',u.skillLevel],['Style',u.learningStyle],['Time',u.avail],['Goal',(u.goals||'—').split(' ').slice(0,3).join(' ')]].map(([k,v])=>(
          <div key={k} style={{ background:'rgba(15,31,56,.8)', borderRadius:10, padding:'6px 10px' }}>
            <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:2 }}>{k}</p>
            <p style={{ fontSize:12, fontWeight:600, fontFamily:'var(--font)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v||'—'}</p>
          </div>
        ))}
      </div>
      {(u.shared||[]).length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:12, fontSize:11, color:'#34d399', fontFamily:'var(--font)', fontWeight:600 }}>
          <Zap size={11}/>{u.shared.length} shared subject{u.shared.length>1?'s':''}
        </div>
      )}
      <div style={{ display:'flex', gap:8 }} onClick={e=>e.stopPropagation()}>
        <ConnBtn cs={u.connStatus} onConnect={onConnect}/>
        <Btn v="secondary" sz="sm" style={{ flex:1 }} onClick={onView}>View Profile</Btn>
      </div>
    </motion.div>
  );
}

function ProfileModal({ user:u, onConnect, onClose }) {
  const cs = u.connStatus;
  return (
    <>
      <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:18 }}>
        <Avatar user={u} size={68}/>
        <div>
          <h3 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:20, marginBottom:3 }}>{u.name}</h3>
          <p style={{ color:'var(--text2)', fontSize:13 }}>{u.dept} · {u.year}</p>
          <p style={{ color:'var(--text2)', fontSize:13 }}>{u.college}</p>
          <div style={{ marginTop:10 }}><ScoreRing score={u.score} size={52}/></div>
        </div>
      </div>
      {u.bio && <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, marginBottom:16 }}>{u.bio}</p>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:16 }}>
        {[['Skill',u.skillLevel],['Style',u.learningStyle],['Time',u.avail],['Year',u.year],['Language',u.language],['Goal',u.goals]].map(([k,v])=>(
          <div key={k} style={{ background:'var(--bg2)', borderRadius:11, padding:'9px 11px', border:'1px solid var(--border2)' }}>
            <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font)', fontWeight:700, textTransform:'uppercase', marginBottom:3 }}>{k}</p>
            <p style={{ fontSize:12, fontWeight:600, fontFamily:'var(--font)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v||'—'}</p>
          </div>
        ))}
      </div>
      {(u.subjects||[]).length > 0 && (
        <div style={{ marginBottom:18 }}>
          <p style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Subjects</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>{u.subjects.map(s=><Badge key={s} v="purple">{s}</Badge>)}</div>
        </div>
      )}
      <div style={{ display:'flex', gap:10 }}>
        {cs==='accepted' ? <button style={{ flex:1, padding:'11px', borderRadius:12, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#34d399', fontSize:13, fontFamily:'var(--font)', fontWeight:700, cursor:'default' }}>✓ Connected</button>
        : cs==='pending' ? <button style={{ flex:1, padding:'11px', borderRadius:12, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', color:'#fbbf24', fontSize:13, fontFamily:'var(--font)', fontWeight:700, cursor:'default' }}>Request Pending</button>
        : <Btn v="primary" className="flex-1" icon={<UserPlus size={15}/>} onClick={onConnect}>Send Connection Request</Btn>}
        <Btn v="secondary" className="flex-1" onClick={onClose}>Close</Btn>
      </div>
      {cs !== 'accepted' && <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:10, fontFamily:'var(--font)' }}>1-on-1 chat unlocks after the connection is accepted</p>}
    </>
  );
}

// ─── CONNECTIONS ──────────────────────────────────────────────────────────────
export function Connections({ go, onOpenDM }) {
  const { user } = useApp();
  const [tab, setTab]         = useState('connected');
  const [connected, setConn]  = useState([]);
  const [received, setRec]    = useState([]);
  const [sent, setSent]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user?._id && !user?.id) return;
    const uid = user._id || user.id;
    setLoading(true);
    Promise.all([
      apiUsers.getConnections(uid).catch(() => []),
      apiUsers.getPendingReceived(uid).catch(() => []),
      apiUsers.getPendingSent(uid).catch(() => []),
    ]).then(([c,r,s]) => { setConn(c||[]); setRec(r||[]); setSent(s||[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  const accept  = async id => { await apiUsers.acceptRequest(id); load(); };
  const decline = async (otherUserId) => { await apiUsers.declineRequest(otherUserId); load(); };

  return (
    <div style={{ padding:'28px 28px 48px', maxWidth:960 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>Connections</h2>
        <p style={{ fontSize:13, color:'var(--text2)' }}>1-on-1 chat is only available between connected students</p>
      </div>
      <div style={{ display:'flex', gap:4, background:'var(--surface)', padding:4, borderRadius:16, width:'fit-content', marginBottom:28 }}>
        {[{id:'connected',label:'Connected',count:connected.length},{id:'received',label:'Requests In',count:received.length},{id:'sent',label:'Requests Sent',count:sent.length}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'8px 16px', borderRadius:12, fontSize:12, fontWeight:700, fontFamily:'var(--font)', border:'none', cursor:'pointer', background:tab===t.id?'linear-gradient(135deg,#4f46e5,#7c3aed)':'transparent', color:tab===t.id?'white':'var(--text3)', transition:'all .2s', display:'flex', alignItems:'center', gap:6 }}>
            {t.label}
            {t.count>0 && <span style={{ fontSize:10, background:tab===t.id?'rgba(255,255,255,.2)':'rgba(99,102,241,.2)', borderRadius:10, padding:'1px 7px', color:tab===t.id?'white':'#818cf8' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? <Loading/> : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}}>

            {tab==='connected' && (
              connected.length===0
                ? <Empty icon={UserCheck} title="No connections yet" sub="Go to Find Partners and send connection requests to study partners"/>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                    {connected.map((c, ci) => (
                      <motion.div key={c._id || c.id || ci} whileHover={{y:-5}} transition={{type:'spring',stiffness:300}}
                        style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:20, position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#10b981,transparent)' }}/>
                        <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:12 }}>
                          <Avatar user={c.user} size={46} ring/>
                          <div>
                            <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14 }}>{c.user.name}</p>
                            <p style={{ fontSize:11, color:'var(--text2)' }}>{c.user.college||c.user.dept}</p>
                            <span style={{ fontSize:10, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#34d399', borderRadius:6, padding:'1px 8px', fontFamily:'var(--font)', fontWeight:700, marginTop:4, display:'inline-block' }}>Connected</span>
                          </div>
                        </div>
                        {(c.user.subjects||[]).length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>{c.user.subjects.slice(0,2).map(s=><Badge key={s} v="purple">{s}</Badge>)}</div>}
                        <Btn v="primary" sz="sm" className="w-full" icon={<Send size={13}/>} onClick={()=>{onOpenDM?.(c.user);go('chat');}}>Open Chat</Btn>
                      </motion.div>
                    ))}
                  </div>
            )}

            {tab==='received' && (
              received.length===0
                ? <Empty icon={Inbox} title="No pending requests" sub="Incoming connection requests appear here"/>
                : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {received.map((c, ci) => (
                      <motion.div key={c._id || c.id || ci} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}
                        style={{ background:'var(--card)', border:'1px solid rgba(245,158,11,.2)', borderRadius:18, padding:18, display:'flex', alignItems:'center', gap:14 }}>
                        <Avatar user={c.user} size={48}/>
                        <div style={{ flex:1 }}>
                          <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:2 }}>{c.user.name}</p>
                          <p style={{ fontSize:12, color:'var(--text2)' }}>{c.user.college} · {c.user.dept}</p>
                          {(c.user.subjects||[]).length>0 && <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>{c.user.subjects.slice(0,2).map(s=><Badge key={s} v="purple">{s}</Badge>)}</div>}
                        </div>
                        <span style={{ fontSize:10, background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.3)', color:'#fbbf24', borderRadius:8, padding:'2px 10px', fontFamily:'var(--font)', fontWeight:700, marginRight:4 }}>Pending</span>
                        <div style={{ display:'flex', gap:8 }}>
                          <Btn v="accent" sz="sm" icon={<Check size={13}/>} onClick={()=>accept(c.user?._id || c.user?.id)}>Accept</Btn>
                          <Btn v="danger" sz="sm" icon={<X size={13}/>} onClick={()=>decline(c.user?._id || c.user?.id)}>Decline</Btn>
                        </div>
                      </motion.div>
                    ))}
                  </div>
            )}

            {tab==='sent' && (
              sent.length===0
                ? <Empty icon={Send} title="No sent requests" sub="Your outgoing connection requests appear here"/>
                : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {sent.map((c, ci) => (
                      <motion.div key={c._id || c.id} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}
                        style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:18, padding:18, display:'flex', alignItems:'center', gap:14 }}>
                        <Avatar user={c.user} size={48}/>
                        <div style={{ flex:1 }}>
                          <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14 }}>{c.user.name}</p>
                          <p style={{ fontSize:12, color:'var(--text2)' }}>{c.user.college} · {c.user.dept}</p>
                        </div>
                        <span style={{ fontSize:10, background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.3)', color:'#fbbf24', borderRadius:8, padding:'2px 10px', fontFamily:'var(--font)', fontWeight:700 }}>Awaiting response</span>
                      </motion.div>
                    ))}
                  </div>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
