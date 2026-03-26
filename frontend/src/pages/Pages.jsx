import { useApp } from '../context/AppContext.jsx';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Calendar, Clock, Video, ExternalLink, Users, Wand2,
  CheckCircle2, BookOpen, Play, Pause, RotateCcw, Square, Target,
  Coffee, Zap, Trophy, Flame, BarChart3, TrendingUp, Send, BrainCircuit,
  User, Copy, Check, Edit3, Download, Star, Save, X,
  FileText, Activity, CheckSquare, Hash, MessageSquare
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Avatar, Badge, Btn, Inp, Modal, Loading, Empty, Progress, ScoreRing } from '../components/ui/index.jsx';
import { apiGroups, apiSessions, apiAnalytics, apiAI, apiSchedule, apiProfile, apiUsers } from '../api/realApi.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_STYLE = {
  grid: 'rgba(255,255,255,0.04)',
  tick: '#475569',
  font: 'Manrope',
};

const fadeUp = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{type:'spring',stiffness:280,damping:26}} };
const stagger = { hidden:{}, show:{ transition:{ staggerChildren:.09 } } };

// ─── GROUPS (minimal stub - full version in Groups.jsx) ───────────────────────
export function Groups({ go }) {
  const { user } = useApp();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const f = k => e => {};
  useEffect(()=>{ const uid=user?._id||user?.id; if(!uid)return; setLoading(true); apiGroups.getAll(uid).then(d=>{setGroups(d||[]);setLoading(false);}).catch(()=>setLoading(false)); },[user?._id,user?.id]);
  if (loading) return <Loading/>;
  return <div style={{padding:32}}><p style={{color:'var(--text2)'}}>Use the Groups page for full group management.</p></div>;
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
export function Sessions() {
  const { user } = useApp();
  const [sessions, setSessions] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('upcoming');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ title:'', groupId:'', date:'', time:'18:00', duration:90, meetLink:'' });
  const [creating, setCreating] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  useEffect(()=>{
    if (!user?.id) return;
    const uid = user?._id||user?.id;
    setLoading(true);
    Promise.all([
      apiSessions.getAll(uid).catch(()=>[]),
      apiGroups.getAll(uid).catch(()=>[]),
    ]).then(([s,g])=>{
      setSessions(s||[]);
      setGroups((g||[]).filter(x=>x.isMember||x.members?.some(m=>(m._id||m)===uid)));
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[user?._id || user?.id]);

  const create = async () => {
    if (!form.title||!form.date) return;
    setCreating(true);
    const s = await apiSessions.create(user.id, form);
    setSessions(p=>[...p,s]); setModal(false);
    setForm({ title:'', groupId:'', date:'', time:'18:00', duration:90, meetLink:'' });
    setCreating(false);
  };

  const filtered = sessions.filter(s=>s.status===tab);

  return (
    <div style={{ padding:'28px 28px 48px', maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div><h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>Study Sessions</h2>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Schedule and manage collaborative learning sessions</p></div>
        <Btn v="primary" icon={<Plus size={16}/>} onClick={()=>setModal(true)}>Schedule Session</Btn>
      </div>

      <div style={{ display:'flex', gap:4, background:'var(--surface)', padding:4, borderRadius:16, width:'fit-content', marginBottom:24 }}>
        {['upcoming','completed'].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:'8px 18px', borderRadius:12, fontSize:12, fontWeight:700, fontFamily:'var(--font)', border:'none', cursor:'pointer', background:tab===t?'linear-gradient(135deg,#4f46e5,#7c3aed)':'transparent', color:tab===t?'white':'var(--text3)', transition:'all .2s', textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {loading ? <Loading/> : filtered.length===0
        ? <Empty icon={Calendar} title={`No ${tab} sessions`} sub={tab==='upcoming'?"Schedule a session to start collaborating with your study group":"Your completed sessions will appear here"}
            action={tab==='upcoming'&&<Btn v="primary" icon={<Plus size={15}/>} onClick={()=>setModal(true)}>Schedule Session</Btn>}/>
        : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {filtered.map(s=>(
              <motion.div key={s.id} variants={fadeUp} whileHover={{ y:-3 }}
                style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:20 }}>
                <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 6px 18px rgba(99,102,241,.3)' }}>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,.7)', fontFamily:'var(--font)', fontWeight:700 }}>{s.date?.split('-').slice(1).join('/')}</span>
                    <Calendar size={20} color="white" style={{ marginTop:2 }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                      <div>
                        <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15, marginBottom:3 }}>{s.title}</p>
                        <p style={{ fontSize:12, color:'var(--text2)' }}>{s.groupName} · {s.date} at {s.time}</p>
                      </div>
                      <Badge v={s.status==='upcoming'?'purple':'green'}>{s.status}</Badge>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:10, marginTop:10 }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text2)', fontFamily:'var(--font)' }}><Clock size={12}/>{s.duration} min</span>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text2)', fontFamily:'var(--font)' }}><Users size={12}/>{s.members?.length||1} attending</span>
                      {s.meetLink&&<a href={s.meetLink} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#818cf8', textDecoration:'none', fontFamily:'var(--font)', fontWeight:600 }}><ExternalLink size={12}/>Meet</a>}
                      {s.status==='upcoming'&&<div style={{ marginLeft:'auto', display:'flex', gap:8 }}><Btn v="primary" sz="xs" icon={<Video size={11}/>}>Join</Btn><Btn v="secondary" sz="xs">Invite</Btn></div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )
      }

      <Modal open={modal} onClose={()=>setModal(false)} title="Schedule Study Session">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Inp label="Session Title *" placeholder="e.g. Binary Trees Deep Dive" value={form.title} onChange={f('title')}/>
          <div>
            <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Study Group</label>
            <select className="inp" value={form.groupId} onChange={f('groupId')} style={{ appearance:'none', cursor:'pointer' }}>
              <option value="">Select a group...</option>
              {groups.map(g => { const gKey = g._id || g.id || g.name; return <option key={gKey} value={gKey}>{g.name}</option>; })}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Inp label="Date *" type="date" value={form.date} onChange={f('date')}/>
            <Inp label="Time" type="time" value={form.time} onChange={f('time')}/>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Duration</label>
            <select className="inp" value={form.duration} onChange={e=>setForm(p=>({...p,duration:+e.target.value}))} style={{ appearance:'none', cursor:'pointer' }}>
              {[30,45,60,90,120,180].map(d=><option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>
          <Inp label="Google Meet Link (optional)" placeholder="https://meet.google.com/..." value={form.meetLink} onChange={f('meetLink')}/>
          <div style={{ display:'flex', gap:10, paddingTop:4 }}>
            <Btn v="primary" style={{flex:1}} loading={creating} onClick={create}>Schedule Session</Btn>
            <Btn v="secondary" style={{flex:1}} onClick={()=>setModal(false)}>Cancel</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── FOCUS TIMER ──────────────────────────────────────────────────────────────
export function FocusTimer() {
  const { user } = useApp();
  const [mode, setMode]   = useState('focus');
  const [secs, setSecs]   = useState(25*60);
  const [running, setRun] = useState(false);
  const [fSessions, setFS]= useState(0);
  const [fMins, setFM]    = useState(0);
  const [custF, setCF]    = useState(25);
  const [custB, setCB]    = useState(5);
  const [subject, setSub] = useState('');
  const iRef = useRef(null);

  const MODES = {
    focus:{ label:'Focus',       dur:custF, color:'#818cf8', glow:'rgba(129,140,248,.3)', Icon:Target },
    short:{ label:'Short Break', dur:custB, color:'#34d399', glow:'rgba(52,211,153,.25)', Icon:Coffee },
    long: { label:'Long Break',  dur:15,    color:'#fb923c', glow:'rgba(251,146,60,.25)',  Icon:Zap },
  };
  const cm    = MODES[mode];
  const total = cm.dur * 60;
  const pct   = 1 - (secs / total);
  const r=110, circ=2*Math.PI*r;

  useEffect(()=>{ setSecs(total); setRun(false); }, [mode, custF, custB]);

  useEffect(()=>{
    if (running) {
      iRef.current = setInterval(()=>{
        setSecs(s=>{
          if (s <= 1) {
            clearInterval(iRef.current); setRun(false);
            if (mode==='focus') {
              setFS(n=>n+1); setFM(m=>m+custF);
              if (user?._id || user?.id) apiAnalytics.log(custF, subject || 'General Study', 'timer').catch(() => {});
            }
            return 0;
          }
          return s-1;
        });
      }, 1000);
    } else clearInterval(iRef.current);
    return ()=>clearInterval(iRef.current);
  }, [running, mode]);

  const fmt = s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ padding:'28px 28px 48px', maxWidth:1000 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>Pomodoro Focus Timer</h2>
        <p style={{ fontSize:13, color:'var(--text2)' }}>Stay in flow — each completed session logs your study hours automatically</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Timer */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:24, padding:32, display:'flex', flexDirection:'column', alignItems:'center' }}>
          {/* Mode tabs */}
          <div style={{ display:'flex', gap:4, background:'var(--bg2)', padding:4, borderRadius:16, width:'100%', marginBottom:28 }}>
            {Object.entries(MODES).map(([k,m])=>(
              <button key={k} onClick={()=>setMode(k)}
                style={{ flex:1, padding:'8px 4px', borderRadius:12, fontSize:11, fontWeight:700, fontFamily:'var(--font)', border:'none', cursor:'pointer', background:mode===k?`linear-gradient(135deg,${m.color}cc,${m.color}88)`:'transparent', color:mode===k?'white':'var(--text3)', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                <m.Icon size={12}/>{m.label}
              </button>
            ))}
          </div>

          {/* SVG Ring */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:28 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle,${cm.glow},transparent 70%)`, filter:'blur(22px)', pointerEvents:'none' }}/>
            <svg width={280} height={280} style={{ transform:'rotate(-90deg)' }}>
              {Array.from({length:60},(_,i)=>{
                const a=(i/60)*Math.PI*2, x1=140+(r+14)*Math.cos(a), y1=140+(r+14)*Math.sin(a), x2=140+(r+20)*Math.cos(a), y2=140+(r+20)*Math.sin(a);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i%5===0?'rgba(255,255,255,.1)':'rgba(255,255,255,.04)'} strokeWidth={i%5===0?1.5:1}/>;
              })}
              <circle cx={140} cy={140} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={10}/>
              <motion.circle cx={140} cy={140} r={r} fill="none" stroke={cm.color} strokeWidth={10}
                strokeDasharray={circ} strokeLinecap="round"
                animate={{ strokeDashoffset: circ*(1-pct) }}
                transition={{ duration: running ? 1 : 0.3, ease:'linear' }}
                style={{ filter:`drop-shadow(0 0 10px ${cm.color})` }}/>
            </svg>
            <div style={{ position:'absolute', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:54, fontWeight:500, lineHeight:1, color:cm.color, textShadow:`0 0 24px ${cm.glow}` }}>{fmt(secs)}</span>
              <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text2)' }}>{cm.label}</span>
              <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text3)' }}>Session {fSessions+(mode==='focus'?1:0)}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20 }}>
            <motion.button whileTap={{scale:.88}} onClick={()=>{setSecs(total);setRun(false);}}
              style={{ width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.05)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)' }}>
              <RotateCcw size={18}/>
            </motion.button>
            <motion.button whileTap={{scale:.92}} onClick={()=>setRun(!running)}
              style={{ width:88,height:52,borderRadius:26,background:`linear-gradient(135deg,${cm.color}dd,${cm.color}88)`,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'var(--font)',fontWeight:700,fontSize:14,color:'white',boxShadow:`0 6px 24px ${cm.glow}`,transition:'all .2s' }}>
              {running?<><Pause size={18}/>Pause</>:<><Play size={18}/>Start</>}
            </motion.button>
            <motion.button whileTap={{scale:.88}} onClick={()=>{setRun(false);setSecs(0);}}
              style={{ width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.05)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)' }}>
              <Square size={18}/>
            </motion.button>
          </div>

          {/* Subject */}
          <div style={{ width:'100%' }}>
            <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:6 }}>Studying (optional)</label>
            <input className="inp" placeholder="e.g. Data Structures" value={subject} onChange={e=>setSub(e.target.value)} style={{ fontSize:13 }}/>
            <p style={{ fontSize:11,color:'var(--text3)',marginTop:6 }}>This subject will be logged to your analytics when the timer completes.</p>
          </div>
        </div>

        {/* Stats + Settings */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[{label:'Sessions',val:fSessions,Icon:Target,color:'#818cf8'},{label:'Minutes',val:fMins,Icon:Activity,color:'#34d399'},{label:'Breaks',val:Math.max(0,fSessions-1),Icon:Coffee,color:'#fb923c'}].map(s=>(
              <motion.div key={s.label} whileHover={{y:-4,scale:1.03}} transition={{type:'spring',stiffness:300}}
                style={{ background:'var(--card)',border:'1px solid var(--border2)',borderRadius:18,padding:18 }}>
                <s.Icon size={20} color={s.color} style={{ marginBottom:10 }}/>
                <p style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:28,color:s.color }}>{s.val}</p>
                <p style={{ fontSize:11,color:'var(--text2)',marginTop:2 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div style={{ background:'var(--card)',border:'1px solid var(--border2)',borderRadius:20,padding:20,flex:1 }}>
            <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:14,marginBottom:16 }}>Custom Durations</p>
            <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
              {[{label:`Focus — ${custF} min`,val:custF,set:setCF,min:5,max:90,color:'#818cf8'},{label:`Break — ${custB} min`,val:custB,set:setCB,min:1,max:30,color:'#34d399'}].map(s=>(
                <div key={s.label}>
                  <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',display:'block',marginBottom:8 }}>{s.label}</label>
                  <input type="range" min={s.min} max={s.max} step={s.min===5?5:1} value={s.val} onChange={e=>s.set(+e.target.value)} style={{ width:'100%',accentColor:s.color }}/>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginTop:3 }}>
                    <span>{s.min}m</span><span style={{color:s.color,fontWeight:700}}>{s.val}m selected</span><span>{s.max}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.15)',borderRadius:14,padding:14 }}>
            <p style={{ fontSize:12,color:'#a5b4fc',fontFamily:'var(--font)',fontWeight:600,marginBottom:4 }}>📊 Auto-logging enabled</p>
            <p style={{ fontSize:11,color:'var(--text3)',lineHeight:1.7 }}>When a focus session ends, your study hours are logged and your streak updates automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
export function Analytics() {
  const { user } = useApp();
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);

  useEffect(()=>{
    if (!user?.id) return;
    setLoad(true);
    apiAnalytics.get(user.id).then(d=>{ setData(d); setLoad(false); });
  },[user?._id || user?.id]);

  if (loading) return <Loading text="Loading your analytics..."/>;

  const wh  = data?.weeklyHours  || [0,0,0,0,0,0,0];
  const sub = data?.subjectHours || [];
  const mh  = data?.monthlyHours || new Array(12).fill(0);
  const prod= wh.map(h => h > 0 ? Math.min(100, Math.round(h*18+45)) : 0);
  const totalH = data?.totalHours    || 0;
  const totalS = data?.totalSessions || 0;
  const streak = data?.streak        || 0;
  const days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const lineData = {
    labels: days,
    datasets: [
      { label:'Study Hours', data:wh, borderColor:'#818cf8', backgroundColor:'rgba(129,140,248,.1)', borderWidth:2, tension:.4, fill:true, pointBackgroundColor:'#818cf8', pointRadius:wh.some(v=>v>0)?4:0 },
      { label:'Productivity', data:prod.map(v=>v/20), borderColor:'#34d399', backgroundColor:'rgba(52,211,153,.07)', borderWidth:2, tension:.4, fill:true, pointBackgroundColor:'#34d399', pointRadius:prod.some(v=>v>0)?4:0 },
    ],
  };
  const donutData = {
    labels: sub.length ? sub.map(s=>s.name) : ['No data yet'],
    datasets:[{
      data: sub.length ? sub.map(s=>s.hours) : [1],
      backgroundColor: sub.length ? sub.map(s=>s.color+'bb') : ['rgba(99,102,241,0.15)'],
      borderColor: sub.length ? sub.map(s=>s.color) : ['rgba(99,102,241,0.3)'],
      borderWidth: 2, hoverOffset: 8,
    }],
  };
  const barData = {
    labels: months,
    datasets:[{ label:'Monthly Hours', data:mh,
      backgroundColor: mh.map(v=>v>0?'rgba(99,102,241,.55)':'rgba(99,102,241,.1)'),
      borderColor:'#6366f1', borderWidth:mh.some(v=>v>0)?1:0,
      borderRadius:6, borderSkipped:false }],
  };
  const chartOpts = (yMax) => ({
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ display:false } },
    scales:{
      x:{ grid:{color:CHART_STYLE.grid}, ticks:{color:CHART_STYLE.tick,font:{family:CHART_STYLE.font}} },
      y:{ grid:{color:CHART_STYLE.grid}, ticks:{color:CHART_STYLE.tick,font:{family:CHART_STYLE.font}}, min:0, suggestedMax:yMax||3 },
    },
  });

  const statCards = [
    { label:'Total Study Hours',    val: totalH > 0 ? totalH+'h' : '0h',         Icon:Clock,        color:'#818cf8' },
    { label:'Sessions Completed',   val: totalS,                                  Icon:CheckSquare,  color:'#34d399' },
    { label:'Current Streak',       val: streak > 0 ? streak+'d' : '0 days',      Icon:Flame,        color:'#fb923c' },
    { label:'Subjects Tracked',     val: sub.length,                              Icon:BookOpen,     color:'#ec4899' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show"
      style={{ padding:'28px 28px 48px', maxWidth:1280 }}>

      <motion.div variants={fadeUp} style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>Study Analytics</h2>
        <p style={{ fontSize:13, color:'var(--text2)' }}>
          {totalH > 0
            ? `You've studied ${totalH}h across ${totalS} sessions. Here's your breakdown.`
            : 'Your analytics are ready — complete sessions and use the timer to fill these charts.'}
        </p>
      </motion.div>

      {/* Stat cards — always shown with animated hover */}
      <motion.div variants={fadeUp}
        style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        {statCards.map(s => (
          <motion.div key={s.label}
            whileHover={{ y:-7, scale:1.025, boxShadow:`0 20px 50px ${s.color}28` }}
            transition={{ type:'spring', stiffness:300, damping:22 }}
            style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:22, position:'relative', overflow:'hidden', cursor:'default' }}>
            <div style={{ position:'absolute', top:-24, right:-24, width:80, height:80, borderRadius:'50%', background:`${s.color}15`, filter:'blur(20px)', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${s.color},transparent)` }}/>
            <div style={{ width:42,height:42,borderRadius:13,background:`${s.color}15`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
              <s.Icon size={21} color={s.color}/>
            </div>
            <p style={{ fontFamily:'var(--font)', fontWeight:900, fontSize:32, color:'var(--text)', marginBottom:4 }}>{s.val}</p>
            <p style={{ fontSize:12, color:'var(--text2)' }}>{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Line + Donut — always shown */}
      <motion.div variants={fadeUp} style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:18, marginBottom:18 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
          <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:4 }}>Weekly Activity</p>
          <p style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>
            {wh.some(v=>v>0) ? 'Study hours and productivity score this week' : 'Charts fill as you study — start your first session!'}
          </p>
          <div style={{ display:'flex', gap:16, marginBottom:14 }}>
            {[{label:'Study Hours',color:'#818cf8'},{label:'Productivity',color:'#34d399'}].map(l=>(
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:22, height:2.5, borderRadius:2, background:l.color }}/>
                <span style={{ fontSize:11, color:'var(--text2)', fontFamily:'var(--font)' }}>{l.label}</span>
              </div>
            ))}
          </div>
          <div style={{ height:200 }}>
            <Line data={lineData} options={{ ...chartOpts(Math.max(...wh,4)), plugins:{ legend:{ display:false } } }}/>
          </div>
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
          <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:4 }}>Subject Distribution</p>
          <p style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>
            {sub.length > 0 ? 'Hours per subject this month' : 'Subjects tracked after first session'}
          </p>
          <div style={{ height:200 }}>
            <Doughnut data={donutData} options={{
              responsive:true, maintainAspectRatio:false, cutout:'65%',
              plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', padding:12, font:{ family:'Manrope', size:11 } } } },
            }}/>
          </div>
        </div>
      </motion.div>

      {/* Bar + Subject breakdown */}
      <motion.div variants={fadeUp} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
          <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:4 }}>Monthly Progress</p>
          <p style={{ fontSize:12, color:'var(--text2)', marginBottom:20 }}>
            {mh.some(v=>v>0) ? 'Study hours across the year' : 'Monthly bars appear as you study'}
          </p>
          <div style={{ height:180 }}>
            <Bar data={barData} options={chartOpts(Math.max(...mh,4))}/>
          </div>
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
          <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:18 }}>Subject Breakdown</p>
          {sub.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 12px' }}>
              <div style={{ width:48,height:48,borderRadius:16,background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px' }}>
                <BookOpen size={22} color="#6366f1"/>
              </div>
              <p style={{ fontSize:13, color:'var(--text2)', fontFamily:'var(--font)', fontWeight:600, marginBottom:6 }}>No subjects tracked yet</p>
              <p style={{ fontSize:11, color:'var(--text3)', lineHeight:1.7 }}>Use the Focus Timer with a subject name, or complete a group session</p>
            </div>
          ) : sub.map(s=>(
            <div key={s.name} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:s.color }}/>
                  <span style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font)' }}>{s.name}</span>
                </div>
                <span style={{ fontSize:11, color:'var(--text2)' }}>{s.hours}h</span>
              </div>
              <Progress value={s.hours} max={Math.max(...sub.map(x=>x.hours),1)} color={s.color}/>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
export function Leaderboard() {
  const { user } = useApp();
  const [tab, setTab] = useState('hours');

  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => { apiUsers.getLeaderboard(tab).then(u => setAllUsers(u||[])).catch(()=>setAllUsers([])); }, [tab]);
  const sorted = allUsers;

  const val = u => {
    if (tab==='hours')  { const h = Math.round((u.totalFocusMinutes||0)/60*10)/10; return h > 0 ? h+'h' : '0h'; }
    if (tab==='streak') return (u.currentStreak||0)+'d';
    return String(u.totalSessions||0);
  };

  const MEDALS = [
    { color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.35)', emoji:'🥇' },
    { color:'#94a3b8', bg:'rgba(148,163,184,.12)', border:'rgba(148,163,184,.35)', emoji:'🥈' },
    { color:'#b45309', bg:'rgba(180,83,9,.12)',    border:'rgba(180,83,9,.35)',    emoji:'🥉' },
  ];

  const hasActivity = sorted.some(u=>(u.totalFocusMinutes||0)>0||(u.currentStreak||0)>0||(u.totalSessions||0)>0);

  return (
    <div style={{ padding:'28px 28px 48px', maxWidth:900 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>Leaderboard</h2>
        <p style={{ fontSize:13, color:'var(--text2)' }}>Top students ranked by study activity — earn your rank by studying!</p>
      </div>

      <div style={{ display:'flex', gap:4, background:'var(--surface)', padding:4, borderRadius:16, width:'fit-content', marginBottom:28 }}>
        {[{id:'hours',label:'Study Hours'},{id:'streak',label:'Day Streak'},{id:'sessions',label:'Sessions'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'8px 18px', borderRadius:12, fontSize:12, fontWeight:700, fontFamily:'var(--font)', border:'none', cursor:'pointer', background:tab===t.id?'linear-gradient(135deg,#4f46e5,#7c3aed)':'transparent', color:tab===t.id?'white':'var(--text3)', transition:'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:60, textAlign:'center' }}>
          <Trophy size={32} color="#f59e0b" style={{ margin:'0 auto 16px', opacity:.4 }}/>
          <h3 style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:16, marginBottom:8 }}>No rankings yet</h3>
          <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>Create an account and start studying to earn your rank!</p>
        </div>
      ) : (
        <>
          {/* Podium — only if enough users */}
          {sorted.length >= 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', gap:20, marginBottom:32 }}>
              {[1,0,2].map((rank,pi)=>{
                const u = sorted[rank];
                if (!u) return null;
                const m = MEDALS[rank];
                const heights = [120, 160, 90];
                const sizes   = [48, 56, 42];
                return (
                  <motion.div key={u._id || u.id} initial={{opacity:0,y:40}} animate={{opacity:1,y:0}}
                    transition={{delay:.1+pi*.1,type:'spring',stiffness:280,damping:26}}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                    <Avatar user={u} size={sizes[pi]} ring={rank===0}/>
                    <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:13, textAlign:'center' }}>{u.name.split(' ')[0]}</p>
                    <p style={{ fontSize:12, fontWeight:800, fontFamily:'var(--font)', color:m.color }}>{val(u)}</p>
                    <motion.div initial={{height:0}} animate={{height:heights[pi]}}
                      transition={{delay:.3+pi*.1,duration:.5,ease:'easeOut'}}
                      style={{ width:88, background:`linear-gradient(180deg,${m.bg},transparent)`, border:`1px solid ${m.border}`, borderBottom:'none', borderRadius:'12px 12px 0 0', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:12, fontSize:24 }}>
                      {m.emoji}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', gap:8 }}>
              <Trophy size={16} color="#f59e0b"/>
              <span style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:13 }}>Full Rankings — {tab==='hours'?'Study Hours':tab==='streak'?'Day Streak':'Sessions'}</span>
            </div>
            {sorted.map((u, i) => {
              const isMe = user && u.id === user.id;
              const m = i < 3 ? MEDALS[i] : null;
              return (
                <motion.div key={u.id} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}
                  transition={{delay:i*.04}}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 20px', borderBottom:'1px solid rgba(255,255,255,.04)', background:isMe?'rgba(99,102,241,.06)':'transparent', transition:'background .2s' }}
                  onMouseEnter={e=>{ if(!isMe) e.currentTarget.style.background='rgba(255,255,255,.02)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=isMe?'rgba(99,102,241,.06)':'transparent'; }}>
                  <div style={{ width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,fontFamily:'var(--font)', background:m?m.bg:'rgba(255,255,255,.05)', color:m?m.color:'var(--text3)', border:`1px solid ${m?m.border:'var(--border2)'}` }}>
                    {m ? m.emoji : i+1}
                  </div>
                  <Avatar user={u} size={42} ring={i<2}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:13 }}>{u.name}</p>
                      {isMe && <Badge v="purple">You</Badge>}
                    </div>
                    <p style={{ fontSize:11, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.college||u.dept||'—'}</p>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    {(u.badges||[]).slice(0,2).map(b=>(
                      <span key={b} title={b} style={{ fontSize:15 }}>{b.includes('Champion')?'🏆':b.includes('Consistency')?'🔥':'🌙'}</span>
                    ))}
                  </div>
                  <p style={{ fontFamily:'var(--font)', fontWeight:900, fontSize:17, minWidth:55, textAlign:'right', color:i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#b45309':'var(--text)' }}>
                    {val(u)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
export function Schedule() {
  const [subs, setSubs]     = useState([]);
  const [hpd, setHpd]       = useState(2);
  const [plan, setPlan]     = useState(null);
  const [loading, setLoad]  = useState(false);
  const ALL = ['Data Structures','Algorithms','Machine Learning','Operating Systems','Computer Networks','Databases','Mathematics','System Design','Statistics','Deep Learning','Python','Java'];
  const COLORS = ['#818cf8','#a78bfa','#34d399','#fb923c','#f472b6','#38bdf8','#fbbf24','#a3e635'];
  const toggle = s => setSubs(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const gen = async () => { if(!subs.length) return; setLoad(true); const d=await apiSchedule.generate(subs,hpd); setPlan(d); setLoad(false); };

  return (
    <div style={{ padding:'28px 28px 48px', maxWidth:1100 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>AI Schedule Generator</h2>
        <p style={{ fontSize:13, color:'var(--text2)' }}>Get a personalized weekly study plan optimized by AI</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, padding:24 }}>
          <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:16 }}>Configure Your Plan</p>
          <div style={{ marginBottom:18 }}>
            <p style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10 }}>Select Subjects ({subs.length} selected) *</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {ALL.map(s=>(
                <button key={s} onClick={()=>toggle(s)} className={`chip ${subs.includes(s)?'on':''}`} style={{ cursor:'pointer', border:'none', display:'flex', alignItems:'center', gap:4 }}>
                  {subs.includes(s)&&<CheckCircle2 size={10}/>}{s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <p style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8 }}>Hours per day — <span style={{color:'#818cf8'}}>{hpd}h</span></p>
            <input type="range" min={1} max={8} step={.5} value={hpd} onChange={e=>setHpd(+e.target.value)} style={{ width:'100%', accentColor:'#6366f1' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', marginTop:4 }}><span>1h</span><span>8h</span></div>
          </div>
          <Btn v="primary" sz="lg" className="w-full" loading={loading} disabled={!subs.length} onClick={gen} icon={!loading&&<Wand2 size={16}/>}>
            {loading?'Generating...':'Generate Weekly Schedule'}
          </Btn>
          {!subs.length && <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:8 }}>Select at least one subject to generate</p>}
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, padding:24, overflow:'hidden' }}>
          <AnimatePresence mode="wait">
            {!plan&&!loading ? (
              <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', minHeight:400, textAlign:'center', gap:16 }}>
                <div style={{ fontSize:56 }} className="anim-float">📅</div>
                <p style={{ fontFamily:'var(--font)', fontWeight:700, color:'var(--text2)', fontSize:15 }}>Your schedule will appear here</p>
                <p style={{ fontSize:12, color:'var(--text3)', maxWidth:260, lineHeight:1.7 }}>Select subjects and click Generate to create your AI-powered study plan</p>
              </motion.div>
            ) : (
              <motion.div key="plan" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14 }}>Your Weekly Plan</p>
                  <Badge v="green">AI Generated</Badge>
                </div>
                <div style={{ overflowY:'auto', maxHeight:480, display:'flex', flexDirection:'column', gap:10 }}>
                  {plan?.map((day,di)=>(
                    <motion.div key={day.day} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:di*.06}}
                      style={{ borderRadius:14, border:`1px solid ${COLORS[di%COLORS.length]}25`, background:`${COLORS[di%COLORS.length]}07`, padding:12 }}>
                      <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:13, color:COLORS[di%COLORS.length], marginBottom:8 }}>{day.day} <span style={{fontSize:10,color:'var(--text3)',fontWeight:400}}>{day.date}</span></p>
                      {day.sessions.map((s,si)=>(
                        <div key={si} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:si<day.sessions.length-1?6:0 }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:11, color:COLORS[di%COLORS.length], width:62, flexShrink:0 }}>{s.time}</span>
                          <div style={{ flex:1, background:`${COLORS[di%COLORS.length]}12`, borderRadius:8, padding:'6px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}><BookOpen size={12} color={COLORS[di%COLORS.length]}/><span style={{ fontSize:12, fontFamily:'var(--font)', fontWeight:600 }}>{s.subject}</span></div>
                            <div style={{ display:'flex', gap:6 }}>
                              <span style={{ fontSize:10, color:'var(--text3)' }}>{s.duration}m</span>
                              <Badge v={s.type==='Primary'?'purple':'cyan'}>{s.type}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── NOTES ────────────────────────────────────────────────────────────────────
export function Notes() {
  const INIT = [
    { id:'n1', title:'Binary Search Tree — Operations', content:`## Binary Search Tree\n\n**Search** — O(h)\nStart at root. Go left if value < node, right if value > node.\n\n**Insertion** — O(h)\nFind the correct leaf position following BST property.\n\n**Deletion — 3 cases:**\n1. Leaf node → simply remove\n2. One child → replace with child\n3. Two children → find inorder successor\n\n**Balanced BSTs:** AVL Tree, Red-Black Tree\nUsed in std::map and Java TreeMap.`, tags:['DSA','Trees'], updated:'Pinned', color:'#818cf8' },
    { id:'n2', title:'Gradient Descent Intuition', content:`## Gradient Descent\n\nUpdate rule: θ = θ − α × ∇J(θ)\n\n- θ = model parameters\n- α = learning rate (hyperparameter)\n- ∇J = gradient of cost function\n\n**Variants:**\n- Batch GD — entire dataset per step\n- SGD — one sample at a time\n- Mini-batch — compromise (32–256 samples)\n\nAdam optimizer adapts LR per-parameter.`, tags:['ML','Math'], updated:'Pinned', color:'#34d399' },
  ];
  const [notes, setNotes]     = useState(INIT);
  const [sel, setSel]         = useState(INIT[0]);
  const [editing, setEdit]    = useState(false);
  const [editTitle, setET]    = useState('');
  const [editContent, setEC]  = useState('');

  const newNote = () => {
    const n = { id:'n'+Date.now(), title:'New Note', content:'## New Note\n\nStart writing...', tags:[], updated:'just now', color:'#818cf8' };
    setNotes(p=>[n,...p]); setSel(n); setET(n.title); setEC(n.content); setEdit(true);
  };
  const save = () => {
    const up={...sel,title:editTitle,content:editContent,updated:'just now'};
    setNotes(p=>p.map(n=>n.id===sel.id?up:n)); setSel(up); setEdit(false);
  };
  const renderMD = text => {
    if (!text) return null;
    return text.split('\n').map((line,i)=>{
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:18,color:sel?.color||'#818cf8',marginBottom:8,marginTop:i>0?16:0 }}>{line.slice(3)}</h2>;
      if (line.startsWith('**')&&line.endsWith('**')) return <p key={i} style={{ fontWeight:700,marginBottom:4,fontSize:13 }}>{line.slice(2,-2)}</p>;
      if (line.startsWith('- ')) return <li key={i} style={{ fontSize:13,color:'var(--text2)',marginBottom:4,marginLeft:16 }}>{line.slice(2)}</li>;
      if (line==='') return <div key={i} style={{ height:8 }}/>;
      return <p key={i} style={{ fontSize:13,color:'var(--text2)',lineHeight:1.8,marginBottom:2 }}>{line}</p>;
    });
  };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 62px)', overflow:'hidden' }}>
      <div style={{ width:280, borderRight:'1px solid var(--border2)', display:'flex', flexDirection:'column', padding:16, gap:10, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:16 }}>Notes</p>
          <Btn v="primary" sz="xs" icon={<Plus size={12}/>} onClick={newNote}>New</Btn>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, overflowY:'auto', flex:1 }}>
          {notes.map(n=>(
            <motion.div key={n.id} whileHover={{x:3}} onClick={()=>{setSel(n);setEdit(false);}}
              style={{ padding:'12px 14px', borderRadius:16, cursor:'pointer', transition:'all .2s', background:sel?.id===n.id?`${n.color}10`:'var(--surface)', border:`1px solid ${sel?.id===n.id?`${n.color}40`:'var(--border2)'}`, borderLeft:`3px solid ${sel?.id===n.id?n.color:'transparent'}` }}>
              <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:13,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{n.title}</p>
              <p style={{ fontSize:11,color:'var(--text3)',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{n.content.replace(/[#*]/g,'').trim().slice(0,50)}...</p>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {n.tags.map(t=><span key={t} style={{ fontSize:10,padding:'2px 8px',borderRadius:10,background:`${n.color}15`,color:n.color,border:`1px solid ${n.color}30`,fontFamily:'var(--font)',fontWeight:600 }}>{t}</span>)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {sel ? (
          <>
            <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:sel.color }}/>
                {editing
                  ? <input value={editTitle} onChange={e=>setET(e.target.value)} style={{ background:'transparent', border:'none', outline:'none', fontFamily:'var(--font)', fontWeight:700, fontSize:15, color:'var(--text)', borderBottom:`1px solid ${sel.color}60`, paddingBottom:2, minWidth:200 }}/>
                  : <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15 }}>{sel.title}</p>
                }
                <span style={{ fontSize:11, color:'var(--text3)' }}>· {sel.updated}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {editing
                  ? <><Btn v="accent" sz="sm" icon={<Save size={13}/>} onClick={save}>Save</Btn><Btn v="secondary" sz="sm" onClick={()=>setEdit(false)}>Cancel</Btn></>
                  : <><Btn v="secondary" sz="sm" icon={<Edit3 size={13}/>} onClick={()=>{setET(sel.title);setEC(sel.content);setEdit(true);}}>Edit</Btn><Btn v="secondary" sz="sm" icon={<Download size={13}/>}>Export</Btn></>
                }
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:28 }}>
              {editing
                ? <textarea value={editContent} onChange={e=>setEC(e.target.value)} style={{ width:'100%', height:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontFamily:'var(--mono)', fontSize:13, lineHeight:1.9, color:'var(--text)', caretColor:sel.color }}/>
                : <div>{renderMD(sel.content)}</div>
              }
            </div>
          </>
        ) : (
          <Empty icon={FileText} title="Select a note" sub="Click a note from the sidebar or create a new one"/>
        )}
      </div>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export function Profile() {
  const { user, update } = useApp();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [form,     setForm]     = useState({});

  const ALL_SUBS = [
    'Data Structures','Algorithms','Machine Learning','Operating Systems',
    'Computer Networks','Databases','Mathematics','System Design',
    'Deep Learning','Statistics','Python','Java','C++','Web Development',
    'Graph Theory','Compiler Design','TOC','Discrete Math',
  ];

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    apiProfile.get(user.id).then(d => {
      if (d) { setProfile(d); setForm(d); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  const fld = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const toggleSub = s => setForm(p => ({
    ...p,
    subjects: (p.subjects || []).includes(s)
      ? (p.subjects || []).filter(x => x !== s)
      : [...(p.subjects || []), s],
  }));

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const updated = await apiProfile.update(user.id, form);
      setProfile(updated);
      update(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setEditing(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const SelectField = ({ label, fieldKey, opts }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</label>
      <select className="inp" value={form[fieldKey] || ''} onChange={fld(fieldKey)} style={{ appearance:'none', cursor:'pointer' }}>
        <option value="">Select...</option>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  if (loading) return <Loading text="Loading your profile..."/>;

  if (!profile) return (
    <div style={{ padding:'28px', textAlign:'center' }}>
      <p style={{ color:'var(--text2)', fontFamily:'var(--font)' }}>Profile not found. Please log out and sign in again.</p>
    </div>
  );

  const totalHours = Math.round(((profile.totalFocusMinutes || 0) / 60) * 10) / 10;

  return (
    <div style={{ padding:'28px 28px 56px', maxWidth:1100 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>My Profile</h2>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Manage your study profile and preferences</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {saved && <Badge v="green">✓ Saved!</Badge>}
          {editing ? (
            <>
              <Btn v="primary" icon={<Save size={14}/>} loading={saving} onClick={save}>Save Changes</Btn>
              <Btn v="secondary" icon={<X size={14}/>} onClick={() => { setEditing(false); setForm(profile); }}>Cancel</Btn>
            </>
          ) : (
            <Btn v="secondary" icon={<Edit3 size={14}/>} onClick={() => { setForm({ ...profile }); setEditing(true); }}>
              Edit Profile
            </Btn>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>

        {/* ── Left column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Avatar card */}
          <motion.div whileHover={{ y:-3 }}
            style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, padding:28, textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2.5, background:'linear-gradient(90deg,transparent,#6366f1,transparent)' }}/>

            <div style={{ position:'relative', display:'inline-block', marginBottom:16 }}>
              <Avatar user={profile} size={88}/>
              <div style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', border:'3px solid var(--card)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Check size={12} color="white"/>
              </div>
            </div>

            <h3 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:18, marginBottom:3 }}>{profile.name}</h3>
            <p style={{ fontSize:12, color:'var(--text2)', marginBottom:2 }}>{profile.dept || '—'} · {profile.year || '—'}</p>
            <p style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>{profile.college || '—'}</p>
            {profile.location && <p style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>📍 {profile.location}</p>}

            {(profile.badges || []).length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:6, marginBottom:16 }}>
                {profile.badges.map(b => (
                  <Badge key={b} v="purple">
                    {b.includes('Champion') ? '🏆' : b.includes('Consistency') ? '🔥' : '🌙'} {b}
                  </Badge>
                ))}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:16 }}>
              {[
                { icon:Clock,    val:`${totalHours}h`,             label:'Hours' },
                { icon:Calendar, val: profile.totalSessions || 0,  label:'Sessions' },
                { icon:Flame,    val: profile.currentStreak || 0,  label:'Streak' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center', padding:'10px 4px', background:'rgba(255,255,255,.03)', borderRadius:12, border:'1px solid var(--border2)' }}>
                  <s.icon size={14} color="var(--text3)" style={{ margin:'0 auto 4px' }}/>
                  <p style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:18 }}>{s.val}</p>
                  <p style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.04em', fontFamily:'var(--font)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {(profile.linkedIn || profile.github) && (
              <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:14, flexWrap:'wrap' }}>
                {profile.linkedIn && (
                  <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:'#818cf8', fontFamily:'var(--font)', fontWeight:600, textDecoration:'none' }}>
                    LinkedIn ↗
                  </a>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:'#818cf8', fontFamily:'var(--font)', fontWeight:600, textDecoration:'none' }}>
                    GitHub ↗
                  </a>
                )}
              </div>
            )}
          </motion.div>

          {/* Subjects */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:18, padding:18 }}>
            <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:13, marginBottom:12 }}>Subjects</p>
            {(profile.subjects || []).length === 0 ? (
              <div style={{ textAlign:'center', padding:'12px 8px' }}>
                <BookOpen size={20} color="var(--text3)" style={{ margin:'0 auto 8px', opacity:.4 }}/>
                <p style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--font)', lineHeight:1.6 }}>
                  No subjects added. Edit profile to add subjects.
                </p>
              </div>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {profile.subjects.map(s => <Badge key={s} v="purple">{s}</Badge>)}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:18, padding:18 }}>
            <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:13, marginBottom:12 }}>Ratings & Reviews</p>
            <div style={{ textAlign:'center', padding:'14px 8px', color:'var(--text3)' }}>
              <Star size={22} color="var(--text3)" style={{ margin:'0 auto 8px', opacity:.4 }}/>
              <p style={{ fontSize:12, fontFamily:'var(--font)', lineHeight:1.7 }}>
                No ratings yet. Connect with partners and study together to receive reviews.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {editing ? (
            <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, padding:28 }}>
              <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15, marginBottom:20 }}>Edit Information</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Inp label="Full Name"    value={form.name || ''}     onChange={fld('name')} />
                <Inp label="Email"        type="email" value={form.email || ''} onChange={fld('email')} />
                <Inp label="College"      value={form.college || ''}  onChange={fld('college')} />
                <Inp label="Department"   value={form.dept || ''}     onChange={fld('dept')} />
                <Inp label="Location"     placeholder="City, Country" value={form.location || ''} onChange={fld('location')} />
                <Inp label="Phone"        type="tel" value={form.phone || ''} onChange={fld('phone')} />
                <Inp label="LinkedIn URL" placeholder="https://linkedin.com/in/..." value={form.linkedIn || ''} onChange={fld('linkedIn')} />
                <Inp label="GitHub URL"   placeholder="https://github.com/..." value={form.github || ''} onChange={fld('github')} />
                <SelectField label="Year"            fieldKey="year"          opts={['1st Year','2nd Year','3rd Year','4th Year','5th Year','Alumni']} />
                <SelectField label="Skill Level"     fieldKey="skillLevel"    opts={['Beginner','Intermediate','Advanced']} />
                <SelectField label="Learning Style"  fieldKey="learningStyle" opts={['Visual','Auditory','Reading/Writing','Practical']} />
                <SelectField label="Availability"    fieldKey="avail"         opts={['Morning','Afternoon','Evening','Night','Flexible','Weekend']} />
                <SelectField label="Study Mode"      fieldKey="studyMode"     opts={['Solo only','Solo + Group','Group only']} />
                <SelectField label="Language"        fieldKey="language"      opts={['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Other']} />
                <div style={{ gridColumn:'span 2' }}>
                  <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Bio</label>
                  <textarea className="inp" rows={3} value={form.bio || ''} onChange={fld('bio')}
                    placeholder="Tell study partners about yourself..." style={{ resize:'none' }}/>
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Study Goals</label>
                  <input className="inp" value={form.goals || ''} onChange={fld('goals')}
                    placeholder="e.g. Crack FAANG, GATE rank under 100..."/>
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:10 }}>Subjects</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {ALL_SUBS.map(s => (
                      <button key={s} onClick={() => toggleSub(s)}
                        className={`chip ${(form.subjects || []).includes(s) ? 'on' : ''}`}
                        style={{ cursor:'pointer', border:'none', display:'flex', alignItems:'center', gap:4 }}>
                        {(form.subjects || []).includes(s) && <CheckCircle2 size={10}/>}{s}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn:'span 2', display:'flex', gap:10, paddingTop:4 }}>
                  <Btn v="primary" style={{ flex:1 }} loading={saving} onClick={save} icon={<Save size={14}/>}>Save Changes</Btn>
                  <Btn v="secondary" style={{ flex:1 }} onClick={() => { setEditing(false); setForm(profile); }}>Cancel</Btn>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, padding:24 }}>
                <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:16 }}>About</p>
                {profile.bio ? (
                  <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8, marginBottom:20 }}>{profile.bio}</p>
                ) : (
                  <p style={{ fontSize:13, color:'var(--text3)', lineHeight:1.8, marginBottom:20, fontStyle:'italic' }}>
                    No bio yet. Click "Edit Profile" to add one.
                  </p>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[
                    ['Email',          profile.email],
                    ['College',        profile.college],
                    ['Department',     profile.dept],
                    ['Year',           profile.year],
                    ['Skill Level',    profile.skillLevel],
                    ['Learning Style', profile.learningStyle],
                    ['Availability',   profile.avail],
                    ['Study Mode',     profile.studyMode],
                    ['Study Goals',    profile.goals],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background:'var(--bg2)', borderRadius:12, padding:'10px 12px', border:'1px solid var(--border2)' }}>
                      <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{k}</p>
                      <p style={{ fontSize:12, fontWeight:600, fontFamily:'var(--font)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:22, padding:24 }}>
                <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:14, marginBottom:16 }}>Learning Style Analysis</p>
                {[
                  { style:'Visual',          pct: profile.learningStyle==='Visual'          ? 68 : 12, color:'#818cf8' },
                  { style:'Practical',       pct: profile.learningStyle==='Practical'       ? 62 : 10, color:'#34d399' },
                  { style:'Reading/Writing', pct: profile.learningStyle==='Reading/Writing' ? 58 : 15, color:'#fb923c' },
                  { style:'Auditory',        pct: profile.learningStyle==='Auditory'        ? 55 : 8,  color:'#ec4899' },
                ].sort((a, b) => b.pct - a.pct).map(s => (
                  <div key={s.style} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:13, fontFamily:'var(--font)', fontWeight: profile.learningStyle === s.style ? 700 : 400 }}>{s.style}</span>
                      <span style={{ fontSize:12, fontWeight:700, fontFamily:'var(--font)', color:s.color }}>{s.pct}%</span>
                    </div>
                    <Progress value={s.pct} max={100} color={s.color}/>
                  </div>
                ))}
                <p style={{ fontSize:11, color:'var(--text3)', marginTop:12 }}>
                  Based on your selected learning style: <strong style={{ color:'var(--text2)' }}>{profile.learningStyle || 'Not set'}</strong>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
