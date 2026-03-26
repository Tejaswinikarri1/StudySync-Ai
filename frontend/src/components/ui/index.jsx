import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, WifiOff } from 'lucide-react';

export function Avatar({ user, size = 44, ring = false }) {
  const init = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const grad = user?.grad || '135deg,#6366f1,#8b5cf6';
  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      <div style={{
        width:size, height:size, borderRadius:'50%', background:`linear-gradient(${grad})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size * 0.35, fontFamily:'var(--font)', fontWeight:700, color:'white',
        userSelect:'none',
        outline: ring ? '2px solid #10b981' : 'none',
        outlineOffset: ring ? 2 : 0,
      }}>
        {init}
      </div>
    </div>
  );
}

export function Spinner({ size = 20, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation:'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="40 20" strokeLinecap="round"/>
    </svg>
  );
}

export function Loading({ text = 'Loading...' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, gap:16 }}>
      <Spinner size={36}/>
      <p style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text2)' }}>{text}</p>
    </div>
  );
}

export function BackendError({ onRetry }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, gap:14, padding:'40px 20px', textAlign:'center' }}>
      <div style={{ width:60, height:60, borderRadius:18, background:'rgba(244,63,94,.1)', border:'1px solid rgba(244,63,94,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <WifiOff size={26} color="#f43f5e"/>
      </div>
      <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:16 }}>Backend not connected</p>
      <p style={{ fontSize:13, color:'var(--text2)', maxWidth:320, lineHeight:1.7 }}>
        Make sure the backend is running on <code style={{ color:'#818cf8', fontFamily:'var(--mono)', fontSize:12 }}>localhost:5000</code>.
        Run <code style={{ color:'#818cf8', fontFamily:'var(--mono)', fontSize:12 }}>npm run dev</code> in the <code style={{ color:'#818cf8', fontFamily:'var(--mono)', fontSize:12 }}>backend/</code> folder.
      </p>
      {onRetry && (
        <button onClick={onRetry} style={{ padding:'9px 20px', borderRadius:12, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', border:'none', color:'white', fontFamily:'var(--font)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Badge({ children, v = 'purple' }) {
  const map = {
    purple: { bg:'rgba(99,102,241,.15)',  color:'#a5b4fc', border:'rgba(99,102,241,.25)' },
    green:  { bg:'rgba(16,185,129,.15)',  color:'#6ee7b7', border:'rgba(16,185,129,.25)' },
    amber:  { bg:'rgba(245,158,11,.15)',  color:'#fcd34d', border:'rgba(245,158,11,.25)' },
    rose:   { bg:'rgba(244,63,94,.15)',   color:'#fda4af', border:'rgba(244,63,94,.25)'  },
    cyan:   { bg:'rgba(34,211,238,.15)',  color:'#a5f3fc', border:'rgba(34,211,238,.25)' },
  };
  const s = map[v] || map.purple;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, fontFamily:'var(--font)', background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {children}
    </span>
  );
}

export function Btn({ children, onClick, v='primary', sz='md', loading=false, disabled=false, icon, className='', type='button', style={} }) {
  const bg   = { primary:'linear-gradient(135deg,#4f46e5,#7c3aed)', secondary:'transparent', accent:'linear-gradient(135deg,#10b981,#059669)', danger:'linear-gradient(135deg,#f43f5e,#dc2626)', ghost:'transparent' };
  const col  = { primary:'white', secondary:'var(--text2)', accent:'white', danger:'white', ghost:'var(--text2)' };
  const bdr  = { primary:'none', secondary:'1px solid var(--border2)', accent:'none', danger:'none', ghost:'none' };
  const szs  = { xs:{padding:'4px 10px',fontSize:11}, sm:{padding:'7px 14px',fontSize:12}, md:{padding:'10px 20px',fontSize:13}, lg:{padding:'13px 28px',fontSize:14}, xl:{padding:'16px 36px',fontSize:16} };
  const p    = szs[sz] || szs.md;
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={className}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, fontWeight:700, fontFamily:'var(--font)', borderRadius:12, cursor:'pointer', transition:'all .2s', background:bg[v], color:col[v], border:bdr[v], opacity:(disabled||loading)?0.5:1, ...p, ...style }}>
      {loading ? <Spinner size={14} color="white"/> : icon}
      {children}
    </button>
  );
}

export function Inp({ label, error, icon: Icon, className='', style={}, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {Icon && <Icon size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }}/>}
        <input className={`inp ${className}`} style={{ paddingLeft: Icon ? 38 : undefined, ...style }} {...props}/>
      </div>
      {error && <p style={{ fontSize:11, color:'#f43f5e' }}>{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,.75)', backdropFilter:'blur(8px)' }}
          onClick={onClose}>
          <motion.div initial={{opacity:0,scale:.94,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.94}}
            transition={{type:'spring',stiffness:320,damping:30}}
            style={{ width:'100%', maxWidth:520, maxHeight:'88vh', overflowY:'auto', background:'var(--card)', border:'1px solid var(--border)', borderRadius:24, padding:32 }}
            onClick={e=>e.stopPropagation()}>
            {(title||onClose) && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                {title && <h3 style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:18 }}>{title}</h3>}
                {onClose && <button onClick={onClose} style={{ width:30, height:30, borderRadius:9, background:'rgba(255,255,255,.05)', borderTop:'none', borderRight:'none', borderBottom:'none', borderLeft:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text2)' }}><X size={15}/></button>}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Progress({ value=0, max=100, color='#6366f1', h=6 }) {
  const pct = Math.min(100, (value / Math.max(max,1)) * 100);
  return (
    <div style={{ height:h, background:'rgba(255,255,255,.06)', borderRadius:h, overflow:'hidden' }}>
      <motion.div style={{ height:'100%', borderRadius:h, background:color }}
        initial={{width:0}} animate={{width:`${pct}%`}}
        transition={{duration:.8, ease:'easeOut'}}/>
    </div>
  );
}

export function ScoreRing({ score=0, size=60 }) {
  const r = size/2 - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score/100) * circ;
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#818cf8' : '#f59e0b';
  return (
    <div style={{ position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', position:'absolute', inset:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={4}/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} initial={{strokeDashoffset:circ}} animate={{strokeDashoffset:offset}}
          transition={{duration:1, ease:'easeOut'}} strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize:size*0.18, fontWeight:800, fontFamily:'var(--font)', color, zIndex:1 }}>{score}%</span>
    </div>
  );
}

export function SH({ title, sub, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
      <div>
        <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:21, marginBottom:4 }}>{title}</h2>
        {sub && <p style={{ fontSize:13, color:'var(--text2)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon:Icon, title, sub, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 20px', textAlign:'center', gap:14 }}>
      {Icon && (
        <div style={{ width:60, height:60, borderRadius:18, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={26} color="#6366f1"/>
        </div>
      )}
      <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15 }}>{title}</p>
      {sub && <p style={{ fontSize:13, color:'var(--text2)', maxWidth:280, lineHeight:1.7 }}>{sub}</p>}
      {children}
    </div>
  );
}
