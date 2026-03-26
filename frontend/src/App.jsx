import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { Sidebar, Topbar } from './components/layout/Layout.jsx';
import FloatingAI from './components/FloatingAI.jsx';
import SignUp from './pages/SignUp.jsx';
import SignIn from './pages/SignIn.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Matches, Connections } from './pages/Matches.jsx';
import Chat from './pages/Chat.jsx';
import Groups from './pages/Groups.jsx';
import { Sessions, FocusTimer, Analytics, Leaderboard, Schedule, Notes, Profile } from './pages/Pages.jsx';
import { initSocket, disconnectSocket, onSocket } from './api/socket.js';

const PUBLIC = ['signup', 'login'];

// Notification sound — shared singleton
let _audioCtx = null;
function playNotif() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function Shell() {
  const { user, sidebarOpen } = useApp();
  const [page,   setPage]   = useState(user ? 'dashboard' : 'login');
  const [prefill, setPrefill] = useState('');
  const [dmUser,  setDmUser]  = useState(null);
  const [toasts,  setToasts]  = useState([]);
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);

  // Init socket on login, clean up on logout
  useEffect(() => {
    if (user) {
      const uid = user._id || user.id;
      initSocket(uid);
    } else {
      disconnectSocket();
    }
  }, [user?._id, user?.id]);

  // Global real-time listeners — registered once via onSocket (safe before connect)
  useEffect(() => {
    if (!user) return;

    const addToast = (text, icon = '💬') => {
      const id = Date.now() + Math.random();
      setToasts(p => [...p.slice(-4), { id, text, icon }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
      playNotif();
    };

    // DM arrives → toast if not on chat page
    const unDM = onSocket('new_dm_message', (msg) => {
      if (pageRef.current === 'chat') return;
      const name = msg.sender?.name || 'Someone';
      addToast(`${name}: ${(msg.text || '').slice(0, 45)}`, '💬');
    });

    // Connection request received
    const unConn = onSocket('new_connection_request', (data) => {
      addToast(`${data.fromName} sent you a connection request`, '🤝');
    });

    // Join request (admin receives)
    const unJoin = onSocket('new_join_request', (data) => {
      addToast(`${data.userName} wants to join "${data.groupName}"`, '📋');
    });

    // Join approved (user receives)
    const unApproved = onSocket('join_request_approved', (data) => {
      addToast(`You were approved to join "${data.groupName}"! 🎉`, '✅');
    });

    return () => { unDM(); unConn(); unJoin(); unApproved(); };
  }, [user?._id, user?.id]);

  const go = (p, opts) => {
    if (typeof opts === 'string') setPrefill(opts);
    else if (opts?.dmUser) setDmUser(opts.dmUser);
    setPage(p);
    window.scrollTo(0, 0);
  };

  const isPublic = PUBLIC.includes(page);
  const W = sidebarOpen ? 220 : 64;

  const renderPage = () => {
    switch (page) {
      case 'signup':      return <SignUp onNavigate={go}/>;
      case 'login':       return <SignIn onNavigate={go} prefillEmail={prefill}/>;
      case 'dashboard':   return <Dashboard go={go}/>;
      case 'matches':     return <Matches/>;
      case 'connections': return <Connections go={go} onOpenDM={u => { setDmUser(u); go('chat'); }}/>;
      case 'chat':        return <Chat initialDMUser={dmUser}/>;
      case 'groups':      return <Groups/>;
      case 'sessions':    return <Sessions/>;
      case 'timer':       return <FocusTimer/>;
      case 'schedule':    return <Schedule/>;
      case 'notes':       return <Notes/>;
      case 'analytics':   return <Analytics/>;
      case 'leaderboard': return <Leaderboard/>;
      case 'profile':     return <Profile/>;
      default:            return <Dashboard go={go}/>;
    }
  };

  if (isPublic || !user) return (
    <AnimatePresence mode="wait">
      <motion.div key={page} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}}>
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Sidebar page={page} go={go}/>
      <Topbar  page={page} go={go} sidebarOpen={sidebarOpen}/>
      <motion.main animate={{ paddingLeft: W }} transition={{ type:'spring',stiffness:300,damping:30 }}
        style={{ paddingTop:62, minHeight:'100vh' }}>
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            transition={{type:'spring',stiffness:300,damping:28}}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </motion.main>
      <FloatingAI/>

      {/* Global toast notifications */}
      <div style={{ position:'fixed', bottom:90, right:24, zIndex:9999, display:'flex', flexDirection:'column-reverse', gap:8, pointerEvents:'none' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity:0, y:20, scale:.9 }}
              animate={{ opacity:1, y:0,  scale:1  }}
              exit={{    opacity:0, y:10, scale:.9  }}
              transition={{ type:'spring', stiffness:400, damping:30 }}
              style={{ background:'var(--card)', border:'1px solid rgba(99,102,241,.35)', borderRadius:14, padding:'11px 16px', maxWidth:300, boxShadow:'0 8px 32px rgba(0,0,0,.55)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
              <p style={{ fontSize:12, fontFamily:'var(--font)', fontWeight:600, color:'var(--text)', lineHeight:1.5 }}>{t.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell/></AppProvider>;
}
