import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./spirit-butterfly.css"; // use the shared stylesheet in your project

export default function Creation(){
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState('Serene');
  const [form, setForm] = useState({ firstName:'', lastName:'', dates:'', message:'', photo:'' });
  const [extras, setExtras] = useState({ pack:'1', ribbon:false, candle:false, music:false });
  const price = useMemo(()=> (extras.pack==='1'?300:extras.pack==='5'?1200:4200) + (extras.ribbon?200:0) + (extras.candle?300:0) + (extras.music?200:0),[extras]);
  const prevRef = useRef(null);

  // Butterflies only on preview step
  useEffect(()=>{
    if(step!==4) return; const el = prevRef.current; if(!el) return; el.innerHTML='';
    const add=(x,y,dx,delay,dur)=>{const d=document.createElement('div'); d.className='butterfly'; d.style.setProperty('--x',x+'px'); d.style.setProperty('--y',y+'px'); d.style.setProperty('--dx',dx+'px'); d.style.setProperty('--delay',delay+'ms'); d.style.setProperty('--dur',dur+'ms'); d.innerHTML=`<svg width="44" height="44" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 5c1.6 0 2.6.3 3.6 1.3S17 8.4 17 10c-1.3-.3-2.3-.7-3.6-1.9C12.5 7 12 6 12 5Z" fill="#6c62ff"/><path d="M12 5c-1.6 0-2.6.3-3.6 1.3S7 8.4 7 10c1.3-.3 2.3-.7 3.6-1.9C11.5 7 12 6 12 5Z" fill="#6ec3ff"/><circle cx="12" cy="12" r="1" fill="#2f3a4c"/></svg>`; el.appendChild(d)};
    for(let i=0;i<16;i++){add(Math.random()*620+40,Math.random()*380+220,Math.random()*200-100,Math.random()*2200,9000+Math.random()*6000)}
  },[step]);

  return (
    <div className="page full-page">
      <div className="wrap full-wrap">
        <header>
          <Link className="brand" to="/">
            <div className="logo" aria-hidden="true">
              <svg width="54" height="54" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3c2.5 0 4 .5 5.5 2 1.5 1.5 2 3 2 5.5-2-.6-3.5-1.1-5.5-3.1C12 5.5 11 4 12 3Z" fill="#6c62ff"/>
                <path d="M12 3c-2.5 0-4 .5-5.5 2S4 8 4 10.5c2-.6 3.5-1.1 5.5-3.1C12 5.5 13 4 12 3Z" fill="#6ec3ff"/>
                <circle cx="12" cy="12" r="1.2" fill="#394150"/>
              </svg>
            </div>
            <h1 className="h1">Spirit Butterfly</h1>
          </Link>
          <nav>
            <Link to="/pricing">Pricing</Link>
            <Link to="/about">About</Link>
            <Link className="signin" to="/signin">Sign in</Link>
          </nav>
        </header>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
          <h2 style={{fontFamily:'"Playfair Display",serif', margin:0}}>Create your Garden</h2>
          <div style={{display:'flex', alignItems:'center', gap:14, fontWeight:800, color:'var(--muted)'}}>
            <div className={`dot ${step===1?'active':''}`}>1</div>
            <div className="sep"/>
            <div className={`dot ${step===2?'active':''}`}>2</div>
            <div className="sep"/>
            <div className={`dot ${step===3?'active':''}`}>3</div>
            <div className="sep"/>
            <div className={`dot ${step===4?'active':''}`}>4</div>
          </div>
        </div>

        <section className="hero full-hero">
          <div className="hero-card">
            {step===1 && (
              <div className="fade in">
                <span className="eyebrow">Step 1</span>
                <h3 className="h3" style={{fontFamily:'"Playfair Display",serif', margin:'16px 0 6px', fontSize:42}}>Pick a garden</h3>
                <p className="sub">Choose a theme. You can change later.</p>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:18}}>
                  {['Serene','Twilight','Blossom'].map(n=> (
                    <button key={n} className={`theme ${theme===n?'active':''}`} onClick={()=>setTheme(n)} style={{textAlign:'left'}}>
                      <div className="garden" style={{height:180, borderRadius:20, position:'relative', overflow:'hidden'}}>
                        <div className="hill"/>
                        <div className="flower" style={{left:'18%', bottom:'24%'}}/>
                        <div className="flower" style={{left:'38%', bottom:'30%', background:'#c7ebff', boxShadow:'0 0 0 12px #c7ebff3a'}}/>
                        <div className="flower" style={{left:'62%', bottom:'22%'}}/>
                      </div>
                      <div style={{marginTop:12, fontWeight:900, fontSize:26}}>{n}</div>
                    </button>
                  ))}
                </div>
                <div className="cta-row" style={{justifyContent:'flex-end'}}>
                  <button className="btn primary" onClick={()=>setStep(2)}>Next</button>
                </div>
              </div>
            )}

            {step===2 && (
              <div className="fade in">
                <span className="eyebrow">Step 2</span>
                <h3 className="h3" style={{fontFamily:'"Playfair Display",serif', margin:'16px 0 6px', fontSize:42}}>Loved one’s details</h3>
                <p className="sub">A few basics to personalize the page.</p>
                <div style={{display:'grid', gap:18}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
                    <input className="in" placeholder="First name" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})}/>
                    <input className="in" placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})}/>
                  </div>
                  <input className="in" placeholder="Dates (e.g., 1950–2024)" value={form.dates} onChange={e=>setForm({...form, dates:e.target.value})}/>
                  <input className="in" placeholder="Short dedication" value={form.message} onChange={e=>setForm({...form, message:e.target.value})}/>
                  <input className="in" placeholder="Photo URL (optional)" value={form.photo} onChange={e=>setForm({...form, photo:e.target.value})}/>
                </div>
                <div className="cta-row" style={{justifyContent:'space-between'}}>
                  <button className="btn ghost" onClick={()=>setStep(1)}>Back</button>
                  <button className="btn primary" onClick={()=>setStep(3)}>Next</button>
                </div>
              </div>
            )}

            {step===3 && (
              <div className="fade in">
                <span className="eyebrow">Step 3</span>
                <h3 className="h3" style={{fontFamily:'"Playfair Display",serif', margin:'16px 0 6px', fontSize:42}}>Extras</h3>
                <p className="sub">Add butterflies and gentle touches.</p>
                <div className="card" style={{marginBottom:18, display:'flex', gap:12, alignItems:'center', justifyContent:'center'}}>
                  {["1","5","20"].map(q=> (
                    <button key={q} className={`btn ${extras.pack===q?'primary':'ghost'}`} onClick={()=>setExtras({...extras, pack:q})}>{q} {q==="1"?"Butterfly":"Butterflies"}</button>
                  ))}
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
                  <label className="card" style={{display:'flex', alignItems:'center', gap:14}}><input type="checkbox" checked={extras.ribbon} onChange={e=>setExtras({...extras, ribbon:e.target.checked})}/><div>Remembrance ribbon</div><div className="price" style={{marginLeft:'auto'}}>+¥200</div></label>
                  <label className="card" style={{display:'flex', alignItems:'center', gap:14}}><input type="checkbox" checked={extras.candle} onChange={e=>setExtras({...extras, candle:e.target.checked})}/><div>Virtual candle</div><div className="price" style={{marginLeft:'auto'}}>+¥300</div></label>
                </div>
                <label className="card" style={{display:'flex', alignItems:'center', gap:14, marginTop:18}}><input type="checkbox" checked={extras.music} onChange={e=>setExtras({...extras, music:e.target.checked})}/><div>Gentle music</div><div className="price" style={{marginLeft:'auto'}}>+¥200</div></label>
                <div className="cta-row" style={{justifyContent:'space-between'}}>
                  <button className="btn ghost" onClick={()=>setStep(2)}>Back</button>
                  <button className="btn primary" onClick={()=>setStep(4)}>Preview</button>
                </div>
              </div>
            )}

            {step===4 && (
              <div className="fade in">
                <span className="eyebrow">Step 4</span>
                <h3 className="h3" style={{fontFamily:'"Playfair Display",serif', margin:'16px 0 6px', fontSize:42}}>Preview (demo only)</h3>
                <p className="sub">This is a demo preview — nothing is saved.</p>
                <div className="card" style={{marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontWeight:900}}>Total</div>
                  <div style={{fontWeight:900}}>¥{price.toLocaleString()}</div>
                </div>
                <div className="right" style={{minHeight:560}} aria-hidden="true">
                  <div className="garden">
                    <div className="hill"/>
                    <div className="flower" style={{left:'18%', bottom:'14%'}}/>
                    <div className="flower" style={{left:'34%', bottom:'18%', background:'#c7ebff', boxShadow:'0 0 0 12px #c7ebff3a'}}/>
                    <div className="flower" style={{left:'56%', bottom:'12%'}}/>
                    <div className="flower" style={{left:'72%', bottom:'20%', background:'#c7ebff', boxShadow:'0 0 0 12px #c7ebff3a'}}/>
                    <div id="preview-butterflies" ref={prevRef}/>
                    <div style={{position:'absolute', top:24, left:24, right:24, display:'flex', alignItems:'center', gap:16}}>
                      {form.photo? <img src={form.photo} alt="" style={{width:82, height:82, objectFit:'cover', borderRadius:22, boxShadow:'0 8px 22px var(--ring)'}}/>: <div style={{width:82,height:82,borderRadius:22, background:'#fff', boxShadow:'0 8px 22px var(--ring)'}}/>}
                      <div>
                        <div style={{fontFamily:'"Playfair Display",serif', fontSize:32, fontWeight:800}}>{form.firstName||'First'} {form.lastName||'Last'}</div>
                        <div style={{color:'var(--muted)', fontWeight:700, fontSize:20}}>{form.dates||'—'}</div>
                      </div>
                    </div>
                    <div style={{position:'absolute', left:24, right:24, bottom:24, background:'#ffffffcc', borderRadius:20, padding:18, boxShadow:'0 12px 36px var(--ring)'}}>
                      <div style={{color:'var(--muted)', fontSize:22}}>{form.message||'A few words about your loved one…'}</div>
                    </div>
                  </div>
                </div>
                <div className="cta-row" style={{justifyContent:'space-between'}}>
                  <button className="btn ghost" onClick={()=>setStep(3)}>Back</button>
                  <button className="btn primary" onClick={()=>{ navigate('/'); }}>Looks good (no data saved)</button>
                </div>
              </div>
            )}
          </div>

          {/* Summary side panel */}
          <aside className="hero-card">
            <h4 style={{fontFamily:'"Playfair Display",serif', margin:'0 0 16px', fontSize:38}}>Summary</h4>
            <div className="card" style={{marginBottom:16, display:'flex', gap:16, alignItems:'center'}}>
              <div className="logo" style={{width:56, height:56}}/>
              <div>
                <div style={{fontWeight:900, fontSize:24}}>Theme</div>
                <div className="sub">{theme}</div>
              </div>
            </div>
            <div className="card" style={{marginBottom:16}}>
              <div style={{fontWeight:900, fontSize:24}}>For</div>
              <div className="sub">{(form.firstName||'First')+' '+(form.lastName||'Last')} {form.dates? '• '+form.dates:''}</div>
            </div>
            <div className="card" style={{marginBottom:16}}>
              <div style={{fontWeight:900, fontSize:24}}>Extras</div>
              <div className="sub">Pack: {extras.pack} • {(extras.ribbon?'Ribbon • ':'')+(extras.candle?'Candle • ':'')+(extras.music?'Music':'') || 'None'}</div>
            </div>
            <div className="card" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div style={{fontWeight:900, fontSize:24}}>Total</div>
              <div style={{fontWeight:900, fontSize:24}}>¥{price.toLocaleString()}</div>
            </div>
            <div className="cta-row" style={{justifyContent:'flex-end'}}>
              {step>1 && <button className="btn ghost" onClick={()=>setStep(step-1)}>Back</button>}
              {step<4 && <button className="btn primary" onClick={()=>setStep(step+1)}>Next</button>}
            </div>
          </aside>
        </section>

        <footer>© {new Date().getFullYear()} Spirit Butterfly • Creator (demo)</footer>
      </div>
    </div>
  );
}
