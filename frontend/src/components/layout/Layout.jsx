import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, MessageSquare, Calendar, Timer,
  BrainCircuit, Map, FileText, BarChart3, Trophy, UserCircle,
  Bell, Search, ChevronDown, LogOut, Settings, Flame, Brain,
  UserCheck, Inbox, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { Avatar } from '../ui/index.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { apiUsers } from '../../api/realApi.js';
import { getSocket, onSocket } from '../../api/socket.js';

const NAV = [
  { icon:LayoutDashboard, label:'Dashboard',     id:'dashboard' },
  { icon:Users,           label:'Find Partners', id:'matches' },
  { icon:UserCheck,       label:'Connections',   id:'connections' },
  { icon:MessageSquare,   label:'Chat',          id:'chat' },
  { icon:Users,           label:'Study Groups',  id:'groups' },
  { icon:Calendar,        label:'Sessions',      id:'sessions' },
  { icon:Timer,           label:'Focus Timer',   id:'timer' },
  { icon:Map,             label:'AI Schedule',   id:'schedule' },
  { icon:FileText,        label:'Notes',         id:'notes' },
  { icon:BarChart3,       label:'Analytics',     id:'analytics' },
  { icon:Trophy,          label:'Leaderboard',   id:'leaderboard' },
  { icon:UserCircle,      label:'Profile',       id:'profile' },
];

export function Sidebar({ page, go }) {
  const { sidebarOpen, toggleSidebar, user } = useApp();
  const W = sidebarOpen ? 220 : 64;

  return (
    <motion.nav
      animate={{ width: W }}
      transition={{ type:'spring', stiffness:300, damping:30 }}
      style={{
        position:'fixed', left:0, top:0, bottom:0, zIndex:40, overflow:'hidden',
        background:'rgba(6,13,26,.98)', backdropFilter:'blur(20px)',
        borderRight:'1px solid var(--border2)', display:'flex', flexDirection:'column',
      }}>

      {/* Logo + toggle */}
      <div style={{ height:62, display:'flex', alignItems:'center', justifyContent:sidebarOpen?'space-between':'center', padding:sidebarOpen?'0 14px 0 16px':'0 10px', borderBottom:'1px solid var(--border2)', flexShrink:0 }}>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}}
              style={{ display:'flex', alignItems:'center', gap:9, overflow:'hidden', whiteSpace:'nowrap' }}>
              <div style={{ width:34,height:34,borderRadius:11,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(99,102,241,.4)',flexShrink:0 }}>
                <Brain size={17} color="white"/>
              </div>
              <span style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:16 }}>
                <span className="gt">StudySync</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {!sidebarOpen && (
          <div style={{ width:34,height:34,borderRadius:11,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Brain size={17} color="white"/>
          </div>
        )}
        <button onClick={toggleSidebar}
          style={{ width:28,height:28,borderRadius:8,background:'rgba(255,255,255,.05)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text3)',flexShrink:0,transition:'all .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(99,102,241,.1)';e.currentTarget.style.color='#818cf8'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.05)';e.currentTarget.style.color='var(--text3)'}}>
          {sidebarOpen ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 0' }}>
        {NAV.map(item=>{
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <motion.button key={item.id} onClick={()=>go(item.id)} whileTap={{scale:.95}}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding: sidebarOpen ? '10px 16px' : '10px 0', justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: active ? 'rgba(99,102,241,.1)' : 'transparent',
                borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                borderLeft: `2px solid ${active?'#6366f1':'transparent'}`,
                cursor:'pointer', transition:'all .2s',
                color: active ? '#a5b4fc' : 'var(--text3)',
                fontFamily:'var(--font)', fontWeight:600, fontSize:13,
                whiteSpace:'nowrap', overflow:'hidden',
              }}
              onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='rgba(255,255,255,.03)';e.currentTarget.style.color='var(--text2)'; }}}
              onMouseLeave={e=>{ if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text3)'; }}}>
              <Icon size={17} strokeWidth={active?2.5:1.8} style={{ flexShrink:0, color:active?'#818cf8':'inherit' }}/>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Streak widget — only when expanded */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
            style={{ margin:12, padding:14, borderRadius:16, background:'linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1))', border:'1px solid rgba(99,102,241,.2)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <Flame size={14} color="#fb923c"/>
              <span style={{ fontSize:11, fontFamily:'var(--font)', fontWeight:700, color:'#fb923c' }}>Study Streak</span>
            </div>
            <p style={{ fontFamily:'var(--font)', fontWeight:900, fontSize:22, marginBottom:2 }}>{user?.currentStreak || 0} days</p>
            <p style={{ fontSize:10, color:'var(--text3)', marginBottom:8 }}>Keep studying daily!</p>
            <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100,(user?.currentStreak||0)/30*100)}%`, background:'linear-gradient(90deg,#f59e0b,#ef4444)', borderRadius:2 }}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export function Topbar({ page, go, sidebarOpen }) {
  const { user, logout } = useApp();
  const [showN, setShowN] = useState(false);
  const [showP, setShowP] = useState(false);
  const [pendingReqs,   setPendingReqs]  = useState(0);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.length;
  const nRef = useRef(null);
  const pRef = useRef(null);
  const W = sidebarOpen ? 220 : 64;
  const pageName = NAV.find(n=>n.id===page)?.label || 'Dashboard';

  useEffect(()=>{
    if (!user) return;
    const uid = user._id || user.id;
    // Initial fetch
    apiUsers.getPendingReceived(uid).then(d => setPendingReqs((d||[]).length)).catch(()=>{});
  },[page, user?._id, user?.id]);

  // Real-time notifications via onSocket (works even before socket connects)
  useEffect(() => {
    if (!user) return;
    const uid = user._id || user.id;

    const addNotif = (text, type, meta = {}) => {
      setNotifications(prev => [{
        id: Date.now() + Math.random(),
        text,
        time: new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }),
        type,
        meta,
      }, ...prev].slice(0, 30));
    };

    const unConn = onSocket('new_connection_request', () => {
      apiUsers.getPendingReceived(uid).then(d => setPendingReqs((d||[]).length)).catch(()=>{});
    });

    const unJoin = onSocket('new_join_request', (data) => {
      addNotif(`${data.userName} wants to join "${data.groupName}"`, 'join_request', data);
    });

    const unApproved = onSocket('join_request_approved', (data) => {
      addNotif(`You were approved to join "${data.groupName}"! 🎉`, 'join_approved', data);
    });

    return () => { unConn(); unJoin(); unApproved(); };
  }, [user?._id, user?.id]);

  useEffect(()=>{
    const h = e=>{
      if(nRef.current&&!nRef.current.contains(e.target)) setShowN(false);
      if(pRef.current&&!pRef.current.contains(e.target)) setShowP(false);
    };
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);

  return (
    <motion.header animate={{ left: W }} transition={{ type:'spring',stiffness:300,damping:30 }}
      style={{ position:'fixed',right:0,top:0,height:62,background:'rgba(3,7,18,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',zIndex:39 }}>
      <div style={{ display:'flex',alignItems:'center',gap:16 }}>
        <span style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:16 }}>{pageName}</span>
        <div style={{ position:'relative',display:'flex',alignItems:'center' }}>
          <Search size={13} style={{ position:'absolute',left:11,color:'var(--text3)',pointerEvents:'none' }}/>
          <input placeholder="Search..." className="inp" style={{ paddingLeft:32,height:34,width:200,fontSize:12,background:'rgba(15,31,56,.6)' }}/>
        </div>
      </div>

      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
        {pendingReqs>0 && (
          <motion.button initial={{scale:0}} animate={{scale:1}} onClick={()=>go('connections')}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',borderRadius:10,cursor:'pointer',color:'#fbbf24',fontSize:11,fontFamily:'var(--font)',fontWeight:700 }}>
            <Inbox size={13}/>{pendingReqs} request{pendingReqs>1?'s':''}
          </motion.button>
        )}

        {/* Notifications */}
        <div style={{ position:'relative' }} ref={nRef}>
          <button onClick={()=>{setShowN(!showN);setShowP(false);}}
            style={{ width:36,height:36,borderRadius:11,background:'rgba(255,255,255,.04)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)',position:'relative' }}>
            <Bell size={16}/>
            {(pendingReqs > 0 || unreadCount > 0) && <div style={{ position:'absolute',top:-3,right:-3,width:16,height:16,borderRadius:'50%',background:'var(--rose)',border:'2px solid var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white',fontFamily:'var(--font)' }}>{pendingReqs + unreadCount}</div>}
          </button>
          <AnimatePresence>
            {showN && (
              <motion.div initial={{opacity:0,y:8,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.96}}
                transition={{type:'spring',stiffness:400,damping:30}}
                style={{ position:'absolute',right:0,top:44,width:300,background:'var(--card)',border:'1px solid var(--border)',borderRadius:18,overflow:'hidden',boxShadow:'0 20px 50px rgba(0,0,0,.6)',zIndex:100 }}>
                <div style={{ padding:'12px 16px',borderBottom:'1px solid var(--border2)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:13 }}>Notifications</span>

                </div>
                <div style={{ maxHeight:320, overflowY:'auto' }}>
                  {notifications.length === 0 && pendingReqs === 0 ? (
                    <div style={{ padding:'24px',textAlign:'center',color:'var(--text3)' }}>
                      <Bell size={28} style={{ margin:'0 auto 8px' }}/>
                      <p style={{ fontSize:12,fontFamily:'var(--font)' }}>No new notifications</p>
                    </div>
                  ) : (
                    <>
                      {pendingReqs > 0 && (
                        <button onClick={()=>{go('connections');setShowN(false);}}
                          style={{ width:'100%',display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'rgba(245,158,11,.06)',border:'none',borderBottom:'1px solid var(--border2)',cursor:'pointer',textAlign:'left' }}>
                          <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(245,158,11,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                            <Inbox size={14} color="#fbbf24"/>
                          </div>
                          <p style={{ fontSize:12,color:'#fbbf24',fontFamily:'var(--font)',fontWeight:600 }}>{pendingReqs} connection request{pendingReqs>1?'s':''}</p>
                        </button>
                      )}
                      {notifications.map(n => (
                        <button key={n.id}
                          onClick={()=>{ go(n.type==='join_request'?'groups':'groups'); setShowN(false); setNotifications(p=>p.filter(x=>x.id!==n.id)); }}
                          style={{ width:'100%',display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',cursor:'pointer',textAlign:'left',transition:'background .2s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.03)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <div style={{ width:32,height:32,borderRadius:'50%',background:n.type==='join_approved'?'rgba(16,185,129,.2)':'rgba(99,102,241,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                            <Bell size={14} color={n.type==='join_approved'?'#10b981':'#818cf8'}/>
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <p style={{ fontSize:12,color:'var(--text)',fontFamily:'var(--font)',fontWeight:600,lineHeight:1.5 }}>{n.text}</p>
                            <p style={{ fontSize:10,color:'var(--text3)',marginTop:2 }}>{n.time}</p>
                          </div>
                        </button>
                      ))}
                      {notifications.length > 0 && (
                        <button onClick={()=>setNotifications([])}
                          style={{ width:'100%',padding:'10px',fontSize:12,color:'var(--text3)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)' }}>
                          Clear all
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div style={{ position:'relative' }} ref={pRef}>
          <button onClick={()=>{setShowP(!showP);setShowN(false);}}
            style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 10px',background:'rgba(255,255,255,.04)',border:'1px solid var(--border2)',borderRadius:11,cursor:'pointer' }}>
            <Avatar user={user} size={26} ring/>
            <span style={{ fontSize:12,fontWeight:700,fontFamily:'var(--font)',color:'var(--text)',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={12} style={{ color:'var(--text3)' }}/>
          </button>
          <AnimatePresence>
            {showP && (
              <motion.div initial={{opacity:0,y:8,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.96}}
                transition={{type:'spring',stiffness:400,damping:30}}
                style={{ position:'absolute',right:0,top:44,width:196,background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',boxShadow:'0 20px 50px rgba(0,0,0,.6)',zIndex:100 }}>
                <div style={{ padding:'12px 14px',borderBottom:'1px solid var(--border2)' }}>
                  <p style={{ fontWeight:700,fontSize:13,fontFamily:'var(--font)',marginBottom:1 }}>{user?.name}</p>
                  <p style={{ fontSize:11,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</p>
                </div>
                {[{icon:UserCircle,label:'Profile',id:'profile'},{icon:BarChart3,label:'Analytics',id:'analytics'}].map(item=>(
                  <button key={item.id} onClick={()=>{go(item.id);setShowP(false);}}
                    style={{ width:'100%',display:'flex',alignItems:'center',gap:9,padding:'10px 14px',fontSize:12,color:'var(--text2)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600,textAlign:'left',transition:'all .2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.03)';e.currentTarget.style.color='var(--text)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text2)'}}>
                    <item.icon size={14}/>{item.label}
                  </button>
                ))}
                <button onClick={()=>{logout();go('login');}}
                  style={{ width:'100%',display:'flex',alignItems:'center',gap:9,padding:'10px 14px',fontSize:12,color:'var(--rose)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600,borderTop:'1px solid var(--border2)',transition:'all .2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(244,63,94,.08)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <LogOut size={14}/>Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
