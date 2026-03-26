import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Video, Flame, Users, ChevronRight, TrendingUp, Calendar, BookOpen, Plus, UserPlus } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Avatar, Badge, Loading, Progress, ScoreRing } from '../components/ui/index.jsx';
import { apiDash, apiAnalytics } from '../api/realApi.js';
import { useApp } from '../context/AppContext.jsx';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } }
};
const CHART_COLORS = {
  grid:  'rgba(255,255,255,0.04)',
  tick:  '#475569',
  font:  'Manrope',
};

// Animated stat card with glow hover
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -7, scale: 1.025, boxShadow: `0 20px 50px ${color}30` }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: 20,
        padding: '22px 20px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}/>
      {/* Background glow */}
      <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100,
        borderRadius:'50%', background:`${color}18`, filter:'blur(24px)', pointerEvents:'none' }}/>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div style={{ width:44, height:44, borderRadius:14, background:`${color}15`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={22} color={color}/>
        </div>
        <span style={{ fontSize:10, fontWeight:700, fontFamily:'var(--font)', color,
          background:`${color}15`, border:`1px solid ${color}25`, borderRadius:20,
          padding:'3px 10px', whiteSpace:'nowrap' }}>
          {sub}
        </span>
      </div>

      <motion.p
        key={value}
        initial={{ opacity:0, y:8 }}
        animate={{ opacity:1, y:0 }}
        style={{ fontFamily:'var(--font)', fontWeight:900, fontSize:34, marginBottom:4, color:'var(--text)' }}>
        {value}
      </motion.p>
      <p style={{ fontSize:12, color:'var(--text2)' }}>{label}</p>
    </motion.div>
  );
}

// Match card with hover animation
function MatchCard({ user: u, rank, onClick }) {
  return (
    <motion.div
      whileHover={{ x: 5, borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
        borderRadius:14, border:'1px solid var(--border2)', cursor:'pointer',
        transition:'background .2s, border-color .2s',
        background: 'rgba(255,255,255,0.02)',
      }}>
      <Avatar user={u} size={40} ring={rank === 0}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font)', marginBottom:2,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
        <p style={{ fontSize:11, color:'var(--text2)', overflow:'hidden',
          textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {(u.subjects||[]).slice(0,2).join(' · ') || u.college || '—'}
        </p>
      </div>
      <ScoreRing score={u.score} size={44}/>
    </motion.div>
  );
}

export default function Dashboard({ go }) {
  const { user } = useApp();
  const [data, setData]           = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user?._id && !user?.id) return;
    setLoading(true);
    const uid = user._id || user.id;
    Promise.all([
      apiDash.get(uid).catch(() => null),
      apiAnalytics.get(uid).catch(() => null),
    ]).then(([d, a]) => {
      setData(d || { stats:{hours:0,sessions:0,streak:0,partners:0,weeklyHours:[0,0,0,0,0,0,0]}, topMatches:[], upcoming:[] });
      setAnalytics(a || { weeklyHours:[0,0,0,0,0,0,0], subjectHours:[], monthlyHours:Array(12).fill(0), totalHours:0, totalSessions:0, streak:0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?._id, user?.id]);

  if (loading) return <Loading text="Building your dashboard..."/>;

  const weeklyHours   = analytics?.weeklyHours  || [0,0,0,0,0,0,0];
  const subjectHours  = analytics?.subjectHours || [];
  const totalHours    = analytics?.totalHours   || 0;
  const totalSessions = analytics?.totalSessions || 0;
  const streak        = analytics?.streak        || 0;
  const partners      = data?.stats?.partners    || 0;
  const topMatches    = data?.topMatches         || [];
  const upcoming      = data?.upcoming           || [];
  const isNewUser     = totalHours === 0 && totalSessions === 0;

  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Chart - always render, just with zeros if no data
  const barData = {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [{
      label: 'Study Hours',
      data: weeklyHours,
      backgroundColor: weeklyHours.map(h => h > 0 ? 'rgba(99,102,241,0.65)' : 'rgba(99,102,241,0.12)'),
      borderColor: '#6366f1',
      borderWidth: weeklyHours.some(h=>h>0) ? 1 : 0,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid:{ color:CHART_COLORS.grid }, ticks:{ color:CHART_COLORS.tick, font:{ family:CHART_COLORS.font } } },
      y: { grid:{ color:CHART_COLORS.grid }, ticks:{ color:CHART_COLORS.tick, font:{ family:CHART_COLORS.font } },
           min: 0, suggestedMax: Math.max(...weeklyHours, 2) },
    },
  };

  const stats = [
    { label:'Study Hours',    value: totalHours > 0 ? `${totalHours}h` : '0h',       icon:Clock,    color:'#6366f1', sub: totalHours > 0 ? 'Total' : 'Start studying' },
    { label:'Sessions Done',  value: totalSessions,                                   icon:Video,    color:'#10b981', sub: totalSessions > 0 ? 'Completed' : 'None yet' },
    { label:'Day Streak',     value: streak > 0 ? `${streak}d` : '0',                icon:Flame,    color:'#f59e0b', sub: streak > 0 ? `${streak} days` : 'Study today!' },
    { label:'Study Partners', value: partners,                                        icon:Users,    color:'#ec4899', sub: partners > 0 ? 'Connected' : 'Find partners' },
  ];

  return (
    <div style={{ padding:'28px 28px 56px', maxWidth:1280 }}>
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* ── Greeting ── */}
        <motion.div variants={fadeUp} style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:'var(--font)', fontWeight:900, fontSize:26, marginBottom:6 }}>
            {greet}, <span className="gt">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color:'var(--text2)', fontSize:13 }}>
            {isNewUser
              ? 'Welcome to StudySync AI! Your dashboard is ready — start studying to see your stats.'
              : `You've studied ${totalHours}h total across ${totalSessions} session${totalSessions !== 1 ? 's' : ''}. Keep it up!`}
          </p>
        </motion.div>

        {/* ── Stat Cards — always shown, animated hover ── */}
        <motion.div variants={fadeUp}
          style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:22 }}>
          {stats.map(s => <StatCard key={s.label} {...s}/>)}
        </motion.div>

        {/* ── Chart + Matches row ── */}
        <motion.div variants={fadeUp}
          style={{ display:'grid', gridTemplateColumns:'1.25fr 1fr', gap:18, marginBottom:18 }}>

          {/* Bar chart — always visible */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div>
                <h3 style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15, marginBottom:3 }}>Weekly Study Hours</h3>
                <p style={{ fontSize:12, color:'var(--text2)' }}>
                  {weeklyHours.some(h=>h>0) ? 'Your activity this week' : 'No activity yet this week'}
                </p>
              </div>
              {weeklyHours.some(h=>h>0) && (
                <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12,
                  color:'#10b981', fontFamily:'var(--font)', fontWeight:600 }}>
                  <TrendingUp size={13}/>{totalHours}h total
                </span>
              )}
            </div>
            <div style={{ height:200 }}>
              <Bar data={barData} options={barOpts}/>
            </div>
            {!weeklyHours.some(h=>h>0) && (
              <p style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:10, fontFamily:'var(--font)' }}>
                Complete sessions or use the Focus Timer to fill this chart
              </p>
            )}
          </div>

          {/* Top matches */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15 }}>AI Top Matches</h3>
              <button onClick={() => go('matches')} style={{ display:'flex', alignItems:'center', gap:4,
                fontSize:12, color:'#818cf8', background:'none', border:'none', cursor:'pointer',
                fontFamily:'var(--font)', fontWeight:600 }}>
                See all <ChevronRight size={13}/>
              </button>
            </div>

            {topMatches.length === 0 ? (
              <div style={{ textAlign:'center', padding:'28px 12px' }}>
                <div style={{ width:52, height:52, borderRadius:16, background:'rgba(99,102,241,.08)',
                  border:'1px solid rgba(99,102,241,.15)', display:'flex', alignItems:'center',
                  justifyContent:'center', margin:'0 auto 14px' }}>
                  <UserPlus size={22} color="#6366f1"/>
                </div>
                <p style={{ fontSize:13, color:'var(--text2)', fontFamily:'var(--font)', fontWeight:600, marginBottom:6 }}>
                  No matches yet
                </p>
                <p style={{ fontSize:11, color:'var(--text3)', lineHeight:1.7, maxWidth:180, margin:'0 auto 14px' }}>
                  Add subjects to your profile to get matched with compatible partners
                </p>
                <button onClick={() => go('profile')} style={{ fontSize:12, color:'#818cf8',
                  background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)',
                  borderRadius:10, padding:'6px 14px', cursor:'pointer', fontFamily:'var(--font)', fontWeight:700 }}>
                  Update Profile →
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {topMatches.map((u, i) => (
                  <MatchCard key={u._id || u.id || i} user={u} rank={i} onClick={() => go('matches')}/>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Sessions + Subject progress ── */}
        <motion.div variants={fadeUp}
          style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

          {/* Upcoming sessions */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15 }}>Upcoming Sessions</h3>
              <button onClick={() => go('sessions')} style={{ display:'flex', alignItems:'center', gap:3,
                fontSize:12, color:'#818cf8', background:'none', border:'none', cursor:'pointer',
                fontFamily:'var(--font)', fontWeight:600 }}>
                View all <ChevronRight size={13}/>
              </button>
            </div>

            {upcoming.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 12px' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'rgba(99,102,241,.08)',
                  border:'1px solid rgba(99,102,241,.15)', display:'flex', alignItems:'center',
                  justifyContent:'center', margin:'0 auto 12px' }}>
                  <Calendar size={20} color="#6366f1"/>
                </div>
                <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.7 }}>No upcoming sessions</p>
                <button onClick={() => go('sessions')} style={{ marginTop:10, fontSize:12, color:'#818cf8',
                  background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontWeight:600 }}>
                  Schedule one →
                </button>
              </div>
            ) : upcoming.map(s => (
              <motion.div key={s.id}
                whileHover={{ scale:1.01, borderColor:'rgba(99,102,241,0.3)' }}
                style={{ display:'flex', gap:13, alignItems:'center', padding:'12px',
                  borderRadius:14, background:'rgba(99,102,241,.06)',
                  border:'1px solid rgba(99,102,241,.15)', marginBottom:10, cursor:'default' }}>
                <div style={{ width:42, height:42, borderRadius:12,
                  background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Calendar size={19} color="white"/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</p>
                  <p style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>
                    {s.groupName} · {s.date} at {s.time}
                  </p>
                  <div style={{ display:'flex', gap:5, marginTop:6 }}>
                    <Badge v="purple">{s.duration} min</Badge>
                    <Badge v="green">Upcoming</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Subject progress — always visible */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:20, padding:24 }}>
            <h3 style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15, marginBottom:18 }}>Subject Progress</h3>

            {subjectHours.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 12px' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'rgba(99,102,241,.08)',
                  border:'1px solid rgba(99,102,241,.15)', display:'flex', alignItems:'center',
                  justifyContent:'center', margin:'0 auto 12px' }}>
                  <BookOpen size={20} color="#6366f1"/>
                </div>
                <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.7 }}>
                  Complete study sessions to see<br/>your subject breakdown here
                </p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {subjectHours.map(s => (
                  <div key={s.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }}/>
                        <span style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font)' }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize:11, color:'var(--text2)' }}>{s.hours}h</span>
                    </div>
                    <Progress value={s.hours}
                      max={Math.max(...subjectHours.map(x=>x.hours), 1)} color={s.color}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Getting started banner — only for new users ── */}
        <AnimatePresence>
          {isNewUser && (
            <motion.div variants={fadeUp}
              style={{ background:'linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08))',
                border:'1px solid rgba(99,102,241,.25)', borderRadius:20, padding:24,
                display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:200 }}>
                <h3 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:17, marginBottom:6 }}>
                  🚀 Get started with StudySync AI
                </h3>
                <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>
                  Complete your profile, find study partners, join groups, and start tracking your sessions.
                </p>
              </div>
              <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
                {[
                  { label:'Complete Profile', page:'profile', color:'#6366f1' },
                  { label:'Find Partners',    page:'matches', color:'#10b981' },
                  { label:'Join a Group',     page:'groups',  color:'#f59e0b' },
                  { label:'Start Timer',      page:'timer',   color:'#ec4899' },
                ].map(a => (
                  <motion.button key={a.page}
                    whileHover={{ scale:1.04, y:-2 }}
                    whileTap={{ scale:.96 }}
                    onClick={() => go(a.page)}
                    style={{ padding:'9px 16px', borderRadius:12, background:`${a.color}20`,
                      border:`1px solid ${a.color}40`, cursor:'pointer', color:a.color,
                      fontSize:12, fontFamily:'var(--font)', fontWeight:700, whiteSpace:'nowrap' }}>
                    {a.label} →
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
