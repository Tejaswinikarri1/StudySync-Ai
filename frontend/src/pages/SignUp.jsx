import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Building2, Eye, EyeOff, Brain, ArrowRight,
  CheckCircle2, ChevronLeft, Sparkles, Phone, MapPin, Linkedin,
  Github, Target, BookOpen, Clock, Globe, Code2, Lightbulb,
  Users, MessageCircle
} from 'lucide-react';
import { Btn, Inp } from '../components/ui/index.jsx';
import { apiAuth } from '../api/realApi.js';

const SUBJECTS = [
  'Data Structures','Algorithms','Machine Learning','Operating Systems',
  'Computer Networks','Databases','Mathematics','System Design',
  'Deep Learning','Statistics','Web Development','Mobile Development',
  'Compiler Design','TOC','Graph Theory','Discrete Mathematics',
  'Python','Java','C++','JavaScript',
];
const STEPS = [
  { id:1, label:'Account', icon:User },
  { id:2, label:'Education', icon:Building2 },
  { id:3, label:'Study Preferences', icon:BookOpen },
  { id:4, label:'Goals & More', icon:Target },
  { id:5, label:'Verify Email', icon:Mail },
];

export default function SignUp({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    // Step 1
    name:'', email:'', password:'', confirmPassword:'', phone:'',
    // Step 2
    college:'', dept:'', year:'1st Year', location:'', linkedIn:'', github:'',
    // Step 3
    subjects:[], learningStyle:'Visual', avail:'Evening', studyMode:'Solo + Group',
    preferredTime:'Evening', skillLevel:'Beginner', language:'English',
    // Step 4
    goals:'', weeklyTarget:'10', timezone:'IST (UTC+5:30)', bio:'',
  });

  const s = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const toggleSub = sub => setForm(p => ({
    ...p, subjects: p.subjects.includes(sub) ? p.subjects.filter(x=>x!==sub) : [...p.subjects, sub]
  }));

  const validate = () => {
    if (step===1) {
      if (!form.name.trim()) return 'Full name is required.';
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Enter a valid email address.';
      if (form.password.length < 6) return 'Password must be at least 6 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    if (step===2) {
      if (!form.college.trim()) return 'College name is required.';
      if (!form.dept.trim()) return 'Department is required.';
    }
    if (step===3) {
      if (form.subjects.length === 0) return 'Select at least one subject.';
    }
    if (step===4) {
      if (!form.goals.trim()) return 'Please describe your study goals.';
    }
    return null;
  };

  const next = async () => {
    setError('');
    const err = validate();
    if (err) return setError(err);
    if (step < 4) { setStep(s => s+1); return; }
    // Step 4 → Submit
    setLoading(true);
    try {
      await apiAuth.register(form);
      setStep(5);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mesh min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div style={{ position:'absolute', top:'10%', left:'5%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.13),transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'15%', right:'8%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.1),transparent 70%)', pointerEvents:'none' }}/>

      <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{type:'spring',stiffness:260,damping:26}}
        style={{ width:'100%', maxWidth:520, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:28 }}>
          <div style={{ width:42,height:42,borderRadius:14,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(99,102,241,.4)' }}>
            <Brain size={22} color="white"/>
          </div>
          <span style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:20 }}>
            <span className="gt">StudySync</span>{' '}
            <span style={{ color:'var(--text2)',fontWeight:400,fontSize:16 }}>AI</span>
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, fontFamily:'var(--font)', fontWeight:700, color:'var(--text2)' }}>
              Step {Math.min(step,4)} of 4
            </span>
            <span style={{ fontSize:12, fontFamily:'var(--font)', color:'var(--text3)' }}>
              {STEPS[step-1]?.label}
            </span>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}>
            <motion.div animate={{ width:`${Math.min(progress,100)}%` }} transition={{ duration:.4 }}
              style={{ height:'100%', background:'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius:2 }}/>
          </div>
        </div>

        {/* Steps indicator */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
          {STEPS.slice(0,4).map((st,i) => {
            const Icon = st.icon;
            const done = step > st.id;
            const active = step === st.id;
            return (
              <div key={st.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                  background: done?'linear-gradient(135deg,#10b981,#059669)':active?'linear-gradient(135deg,#4f46e5,#7c3aed)':'rgba(255,255,255,.05)',
                  border:`1px solid ${done?'transparent':active?'transparent':'var(--border2)'}`,
                  boxShadow: active?'0 4px 16px rgba(99,102,241,.4)':'none',
                  transition:'all .3s' }}>
                  {done ? <CheckCircle2 size={15} color="white"/> : <Icon size={14} color={active?'white':'var(--text3)'}/>}
                </div>
                <span style={{ fontSize:9, fontFamily:'var(--font)', fontWeight:700, color:active||done?'var(--text2)':'var(--text3)', textTransform:'uppercase', letterSpacing:'.04em' }}>{st.label}</span>
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="grad-border" style={{ borderRadius:24, padding:32 }}>
          <AnimatePresence mode="wait">

            {/* ── Step 1: Account ── */}
            {step===1 && (
              <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:.22}}>
                <h2 style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:22,marginBottom:4 }}>Create your account</h2>
                <p style={{ color:'var(--text2)',fontSize:13,marginBottom:24 }}>Start your AI-powered study journey</p>
                {error && <ErrBox msg={error}/>}
                <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                  <Inp label="Full Name *" placeholder="Arjun Sharma" value={form.name} onChange={s('name')} icon={User}/>
                  <Inp label="Email Address *" type="email" placeholder="student@college.edu" value={form.email} onChange={s('email')} icon={Mail}/>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ position:'relative' }}>
                      <Inp label="Password *" type={showPw?'text':'password'} placeholder="Min 6 characters" value={form.password} onChange={s('password')} icon={Lock}/>
                      <button onClick={()=>setShowPw(!showPw)} style={{ position:'absolute',right:12,bottom:13,background:'none',border:'none',cursor:'pointer',color:'var(--text3)' }}>
                        {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                    <Inp label="Confirm Password *" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={s('confirmPassword')} icon={Lock}/>
                  </div>
                  <Inp label="Phone Number (optional)" placeholder="+91 98765 43210" value={form.phone} onChange={s('phone')} icon={Phone}/>
                </div>
                <Btn v="primary" sz="lg" className="w-full mt-5" onClick={next} icon={<ArrowRight size={17}/>}>Continue to Education</Btn>
                <p style={{ textAlign:'center',marginTop:16,fontSize:13,color:'var(--text2)' }}>
                  Already have an account?{' '}
                  <button onClick={()=>onNavigate('login')} style={{ color:'#818cf8',fontWeight:700,background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)' }}>Sign in</button>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Education ── */}
            {step===2 && (
              <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:.22}}>
                <BackBtn onClick={()=>setStep(1)}/>
                <h2 style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:22,marginBottom:4 }}>Education & Location</h2>
                <p style={{ color:'var(--text2)',fontSize:13,marginBottom:24 }}>Helps us find partners from your college</p>
                {error && <ErrBox msg={error}/>}
                <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                  <Inp label="College / University *" placeholder="IIT Delhi" value={form.college} onChange={s('college')} icon={Building2}/>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                    <Inp label="Department *" placeholder="Computer Science" value={form.dept} onChange={s('dept')}/>
                    <SelField label="Year" value={form.year} onChange={s('year')}
                      opts={['1st Year','2nd Year','3rd Year','4th Year','5th Year','Alumni']}/>
                  </div>
                  <Inp label="City / Location" placeholder="New Delhi, India" value={form.location} onChange={s('location')} icon={MapPin}/>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                    <Inp label="LinkedIn (optional)" placeholder="linkedin.com/in/..." value={form.linkedIn} onChange={s('linkedIn')} icon={Linkedin}/>
                    <Inp label="GitHub (optional)" placeholder="github.com/..." value={form.github} onChange={s('github')} icon={Github}/>
                  </div>
                </div>
                <Btn v="primary" sz="lg" className="w-full mt-5" onClick={next} icon={<ArrowRight size={17}/>}>Continue to Subjects</Btn>
              </motion.div>
            )}

            {/* ── Step 3: Study Preferences ── */}
            {step===3 && (
              <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:.22}}>
                <BackBtn onClick={()=>setStep(2)}/>
                <h2 style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:22,marginBottom:4 }}>Study Preferences</h2>
                <p style={{ color:'var(--text2)',fontSize:13,marginBottom:20 }}>Powers your AI compatibility matching</p>
                {error && <ErrBox msg={error}/>}

                <div style={{ marginBottom:18 }}>
                  <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:10 }}>
                    Subjects You Study ({form.subjects.length} selected) *
                  </label>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
                    {SUBJECTS.map(sub=>(
                      <button key={sub} onClick={()=>toggleSub(sub)}
                        className={`chip ${form.subjects.includes(sub)?'on':''}`}
                        style={{ cursor:'pointer',border:'none',display:'flex',alignItems:'center',gap:4 }}>
                        {form.subjects.includes(sub)&&<CheckCircle2 size={10}/>}{sub}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
                  <SelField label="Skill Level" value={form.skillLevel} onChange={s('skillLevel')} opts={['Beginner','Intermediate','Advanced']}/>
                  <SelField label="Learning Style" value={form.learningStyle} onChange={s('learningStyle')} opts={['Visual','Auditory','Reading/Writing','Practical']}/>
                  <SelField label="Availability" value={form.avail} onChange={s('avail')} opts={['Morning','Afternoon','Evening','Night','Flexible']}/>
                  <SelField label="Study Mode" value={form.studyMode} onChange={s('studyMode')} opts={['Solo only','Solo + Group','Group only']}/>
                  <SelField label="Preferred Language" value={form.language} onChange={s('language')} opts={['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Other']}/>
                  <SelField label="Timezone" value={form.timezone} onChange={s('timezone')} opts={['IST (UTC+5:30)','PST (UTC-8)','EST (UTC-5)','GMT (UTC+0)','CET (UTC+1)','SGT (UTC+8)']}/>
                </div>
                <Btn v="primary" sz="lg" className="w-full mt-2" onClick={next} icon={<ArrowRight size={17}/>}>Continue to Goals</Btn>
              </motion.div>
            )}

            {/* ── Step 4: Goals ── */}
            {step===4 && (
              <motion.div key="s4" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:.22}}>
                <BackBtn onClick={()=>setStep(3)}/>
                <h2 style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:22,marginBottom:4 }}>Goals & About You</h2>
                <p style={{ color:'var(--text2)',fontSize:13,marginBottom:24 }}>Last step — tell us what drives you</p>
                {error && <ErrBox msg={error}/>}
                <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:6 }}>Study Goals *</label>
                    <textarea className="inp" rows={3} placeholder="e.g. Crack FAANG interviews, GATE rank under 100, Masters at CMU..." style={{ resize:'none' }} value={form.goals} onChange={s('goals')}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:6 }}>Short Bio</label>
                    <textarea className="inp" rows={2} placeholder="Tell potential study partners about yourself..." style={{ resize:'none' }} value={form.bio} onChange={s('bio')}/>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:6 }}>Weekly Study Target (hrs)</label>
                      <input type="number" className="inp" min={1} max={80} value={form.weeklyTarget} onChange={s('weeklyTarget')} style={{ width:'100%' }}/>
                    </div>
                    <SelField label="Preferred Timezone" value={form.timezone} onChange={s('timezone')} opts={['IST (UTC+5:30)','PST (UTC-8)','EST (UTC-5)','GMT (UTC+0)','CET (UTC+1)','SGT (UTC+8)']}/>
                  </div>
                </div>
                <Btn v="primary" sz="lg" className="w-full mt-5" loading={loading} onClick={next} icon={!loading&&<Sparkles size={16}/>}>
                  Create My Account
                </Btn>
              </motion.div>
            )}

            {/* ── Step 5: Email Verify ── */}
            {step===5 && (
              <motion.div key="s5" initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="text-center" style={{ padding:'8px 0' }}>
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:.2,type:'spring',stiffness:300}}
                  style={{ width:76,height:76,borderRadius:'50%',background:'linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.05))',border:'2px solid rgba(16,185,129,.4)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px' }}>
                  <Mail size={34} color="#10b981"/>
                </motion.div>
                <h2 style={{ fontFamily:'var(--font)',fontWeight:800,fontSize:22,marginBottom:8 }}>Check your inbox!</h2>
                <p style={{ color:'var(--text2)',fontSize:13,marginBottom:6 }}>We sent a verification link to</p>
                <p style={{ fontFamily:'var(--font)',fontWeight:700,color:'#818cf8',fontSize:15,marginBottom:20 }}>{form.email}</p>
                <div style={{ background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.15)',borderRadius:14,padding:16,marginBottom:24,textAlign:'left' }}>
                  <p style={{ fontSize:12,color:'var(--text2)',lineHeight:1.8 }}>
                    ✉️ Check your email inbox (and spam folder)<br/>
                    🔗 Click the verification link<br/>
                    ✅ Come back and sign in with your registered email
                  </p>
                </div>
                <Btn v="primary" sz="lg" className="w-full" onClick={()=>onNavigate('login', form.email)} icon={<ArrowRight size={17}/>}>
                  Go to Sign In
                </Btn>
                <p style={{ marginTop:14,fontSize:12,color:'var(--text3)' }}>
                  Didn't get it?{' '}
                  <button style={{ color:'#818cf8',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600 }}>Resend email</button>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{ background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.25)',borderRadius:10,padding:'10px 14px',color:'#fda4af',fontSize:12,marginBottom:18 }}>{msg}</div>
  );
}
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text2)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600,marginBottom:16 }}>
      <ChevronLeft size={14}/>Back
    </button>
  );
}
function SelField({ label, value, onChange, opts }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
      <label style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em' }}>{label}</label>
      <select className="inp" value={value} onChange={onChange} style={{ appearance:'none',cursor:'pointer' }}>
        {opts.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
