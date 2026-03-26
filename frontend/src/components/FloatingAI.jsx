import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, Send, Sparkles, Copy, Check, Minimize2 } from 'lucide-react';
import api from '../api/axios.js';
import { useApp } from '../context/AppContext.jsx';

export default function FloatingAI() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role:'ai', text:'Hi! I\'m your AI Study Assistant. Ask me anything about your subjects — algorithms, concepts, code, you name it!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const ask = async (q) => {
    const question = (q || input).trim();
    if (!question || loading) return;
    setInput('');
    setMsgs(p => [...p, { role:'user', text:question }]);
    setLoading(true);
    const res = await api.post('/analytics/ai', { question }).then(r => r.data.result).catch(() => ({ text: 'Sorry, I could not process that. Make sure you are logged in.', explanation: '', code: '' }));
    setLoading(false);
    setMsgs(p => [...p, { role:'ai', ...res }]);
  };

  const copyCode = (code, i) => {
    navigator.clipboard.writeText(code).catch(()=>{});
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const suggestions = ['Explain QuickSort','What is DP?','Big O notation','Binary Trees','Graph BFS vs DFS'];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale:0, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            exit={{ scale:0, opacity:0 }}
            whileHover={{ scale:1.08 }}
            whileTap={{ scale:.95 }}
            onClick={() => setOpen(true)}
            style={{
              position:'fixed', bottom:28, right:28, zIndex:60,
              width:56, height:56, borderRadius:'50%',
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
              border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 8px 32px rgba(99,102,241,.55)',
            }}
            className="anim-glow"
          >
            <BrainCircuit size={24} color="white"/>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, scale:.92, y:20 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:.92, y:20 }}
            transition={{ type:'spring', stiffness:320, damping:30 }}
            style={{
              position:'fixed', bottom:24, right:24, zIndex:60,
              width:380, height:560,
              background:'var(--card)',
              border:'1px solid rgba(99,102,241,.3)',
              borderRadius:24, overflow:'hidden', display:'flex', flexDirection:'column',
              boxShadow:'0 24px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(99,102,241,.1)',
            }}
          >
            {/* Header */}
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'linear-gradient(135deg,rgba(79,70,229,.15),rgba(124,58,237,.1))' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(99,102,241,.4)' }}>
                  <BrainCircuit size={17} color="white"/>
                </div>
                <div>
                  <p style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:13 }}>AI Study Assistant</p>
                  <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                    <span style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',display:'block' }} className="anim-pulse"/>
                    <span style={{ fontSize:10,color:'var(--green)' }}>Online</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>setOpen(false)}
                style={{ width:28,height:28,borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)' }}>
                <X size={15}/>
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:14 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <div style={{ width:28,height:28,borderRadius:9,background:m.role==='ai'?'linear-gradient(135deg,#4f46e5,#7c3aed)':'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    {m.role==='ai' ? <BrainCircuit size={14} color="white"/> : <span style={{ fontSize:11,fontWeight:700,color:'white',fontFamily:'var(--font)' }}>{user?.name?.[0]||'U'}</span>}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:11,fontWeight:700,fontFamily:'var(--font)',marginBottom:5,color:m.role==='ai'?'#a5b4fc':'#6ee7b7' }}>{m.role==='ai'?'AI Assistant':'You'}</p>
                    <div style={{ background:m.role==='ai'?'var(--surface2)':'rgba(16,185,129,.08)',border:`1px solid ${m.role==='ai'?'var(--border2)':'rgba(16,185,129,.2)'}`,borderRadius:12,borderTopLeftRadius:m.role==='ai'?3:12,borderTopRightRadius:m.role==='user'?3:12,padding:'10px 12px' }}>
                      <p style={{ fontSize:12,lineHeight:1.7,whiteSpace:'pre-wrap' }}>{m.text}</p>
                      {m.explanation && <pre style={{ fontFamily:'var(--body)',whiteSpace:'pre-wrap',fontSize:11,lineHeight:1.7,color:'var(--text2)',marginTop:8,borderTop:'1px solid var(--border2)',paddingTop:8 }}>{m.explanation}</pre>}
                      {m.code && (
                        <div style={{ marginTop:10,borderRadius:9,overflow:'hidden',border:'1px solid rgba(99,102,241,.2)' }}>
                          <div style={{ background:'rgba(99,102,241,.1)',padding:'5px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(99,102,241,.15)' }}>
                            <div style={{ display:'flex',gap:4 }}>
                              {['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }}/>)}
                            </div>
                            <button onClick={()=>copyCode(m.code,i)} style={{ fontSize:10,color:'#818cf8',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontWeight:600,display:'flex',alignItems:'center',gap:3 }}>
                              {copied===i?<><Check size={9}/>Copied!</>:<><Copy size={9}/>Copy</>}
                            </button>
                          </div>
                          <pre style={{ padding:'10px',fontSize:10.5,overflowX:'auto',fontFamily:'var(--mono)',lineHeight:1.6,color:'#a5b4fc',background:'#050d1a',margin:0 }}><code>{m.code}</code></pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <AnimatePresence>
                {loading && (
                  <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    style={{ display:'flex',gap:8 }}>
                    <div style={{ width:28,height:28,borderRadius:9,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <BrainCircuit size={14} color="white"/>
                    </div>
                    <div style={{ background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:12,borderTopLeftRadius:3,padding:'10px 14px' }}>
                      <div style={{ display:'flex',gap:4 }}>
                        {[0,1,2].map(k=><motion.div key={k} animate={{y:[0,-6,0]}} transition={{duration:.7,delay:k*.15,repeat:Infinity}} style={{ width:6,height:6,borderRadius:'50%',background:'#6366f1' }}/>)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={endRef}/>
            </div>

            {/* Suggestions */}
            {msgs.length < 3 && (
              <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:5 }}>
                {suggestions.map(s=>(
                  <button key={s} onClick={()=>ask(s)} disabled={loading}
                    style={{ padding:'4px 10px',background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:16,fontSize:11,fontWeight:600,fontFamily:'var(--font)',color:'#a5b4fc',cursor:'pointer',opacity:loading?.5:1,transition:'all .2s' }}
                    onMouseEnter={e=>e.target.style.background='rgba(99,102,241,.18)'}
                    onMouseLeave={e=>e.target.style.background='rgba(99,102,241,.08)'}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border2)', flexShrink:0 }}>
              <div style={{ display:'flex',gap:8 }}>
                <input className="inp" placeholder="Ask anything..." value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&ask()}
                  ref={inputRef}
                  style={{ fontSize:12,borderRadius:12,paddingRight:36 }}/>
                <motion.button whileTap={{scale:.88}} onClick={()=>ask()} disabled={!input.trim()||loading}
                  style={{ width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:input.trim()&&!loading?1:.4,transition:'opacity .2s' }}>
                  <Send size={14} color="white"/>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
