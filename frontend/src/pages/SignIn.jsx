import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Brain, ArrowRight } from 'lucide-react';
import { Btn, Inp } from '../components/ui/index.jsx';
import { apiAuth } from '../api/realApi.js';
import { useApp } from '../context/AppContext.jsx';

export default function SignIn({ onNavigate, prefillEmail }) {
  const { login } = useApp();
  const [email,    setEmail]    = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [forgot,   setForgot]   = useState(false);
  const [forgotOk, setForgotOk] = useState(false);

  useEffect(() => { if (prefillEmail) setEmail(prefillEmail); }, [prefillEmail]);

  const submit = async () => {
    setError('');
    if (!email || !password) return setError('Both email and password are required.');
    setLoading(true);
    try {
      const data = await apiAuth.login(email, password);
      login(data.user, data.token);
      onNavigate('dashboard');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const sendForgot = async () => {
    if (!email) return setError('Enter your email address first.');
    setLoading(true);
    try { await apiAuth.forgotPassword(email); setForgotOk(true); setError(''); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="mesh min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background orbs */}
      <div style={{ position:'absolute', top:'15%', left:'5%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.13),transparent 65%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'20%', right:'8%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.1),transparent 65%)', pointerEvents:'none' }}/>

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ type:'spring', stiffness:260, damping:26 }}
        style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:28 }}>
          <div style={{ width:42, height:42, borderRadius:14, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(99,102,241,.4)' }}>
            <Brain size={22} color="white"/>
          </div>
          <span style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:20 }}>
            <span className="gt">StudySync</span>{' '}
            <span style={{ color:'var(--text2)', fontWeight:400, fontSize:16 }}>AI</span>
          </span>
        </div>

        <div className="grad-border" style={{ borderRadius:24, padding:36 }}>
          {!forgot ? (
            <>
              <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:24, marginBottom:4 }}>Welcome back</h2>
              <p style={{ color:'var(--text2)', fontSize:13, marginBottom: prefillEmail ? 14 : 24 }}>
                {prefillEmail ? `Sign in as ${prefillEmail}` : 'Sign in to StudySync AI'}
              </p>

              {prefillEmail && (
                <div style={{ background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:10, padding:'10px 14px', color:'#6ee7b7', fontSize:12, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
                  <Mail size={13}/>Account created! Sign in with your registered email.
                </div>
              )}

              {error && (
                <div style={{ background:'rgba(244,63,94,.1)', border:'1px solid rgba(244,63,94,.25)', borderRadius:10, padding:'10px 14px', color:'#fda4af', fontSize:12, marginBottom:16 }}>
                  {error}
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <Inp label="Email Address" type="email" placeholder="student@college.edu"
                  value={email} onChange={e => setEmail(e.target.value)} icon={Mail}/>
                <div style={{ position:'relative' }}>
                  <Inp label="Password" type={showPw ? 'text' : 'password'} placeholder="Your password"
                    value={password} onChange={e => setPassword(e.target.value)} icon={Lock}/>
                  <button onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, bottom:13, background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              <div style={{ textAlign:'right', marginTop:8, marginBottom:22 }}>
                <button onClick={() => { setForgot(true); setError(''); }} style={{ fontSize:12, color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontWeight:600 }}>
                  Forgot password?
                </button>
              </div>

              <Btn v="primary" sz="lg" className="w-full" loading={loading} onClick={submit} icon={!loading && <ArrowRight size={17}/>}>
                Sign In
              </Btn>

              <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--text2)' }}>
                Don't have an account?{' '}
                <button onClick={() => onNavigate('signup')} style={{ color:'#818cf8', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
                  Create one
                </button>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setForgot(false); setForgotOk(false); setError(''); }}
                style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text2)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontWeight:600, marginBottom:20 }}>
                ← Back to Sign In
              </button>

              <h2 style={{ fontFamily:'var(--font)', fontWeight:800, fontSize:22, marginBottom:4 }}>Reset password</h2>
              <p style={{ color:'var(--text2)', fontSize:13, marginBottom:22 }}>We'll send a reset link to your email</p>

              {error && (
                <div style={{ background:'rgba(244,63,94,.1)', border:'1px solid rgba(244,63,94,.25)', borderRadius:10, padding:'10px 14px', color:'#fda4af', fontSize:12, marginBottom:16 }}>
                  {error}
                </div>
              )}

              {forgotOk ? (
                <div style={{ background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:12, padding:24, textAlign:'center' }}>
                  <Mail size={32} color="#10b981" style={{ margin:'0 auto 12px' }}/>
                  <p style={{ fontFamily:'var(--font)', fontWeight:700, fontSize:15, marginBottom:6 }}>Reset link sent!</p>
                  <p style={{ fontSize:12, color:'var(--text2)' }}>Check your inbox at {email}</p>
                </div>
              ) : (
                <>
                  <Inp label="Email Address" type="email" placeholder="student@college.edu"
                    value={email} onChange={e => setEmail(e.target.value)} icon={Mail}/>
                  <Btn v="primary" sz="lg" className="w-full mt-4" loading={loading} onClick={sendForgot} icon={!loading && <Mail size={16}/>}>
                    Send Reset Link
                  </Btn>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
