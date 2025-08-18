import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './spirit-butterfly.css';

export default function Garden(){
  const navigate = useNavigate();
  const { state } = useLocation();
  const stageRef = useRef(null);

  const theme = state?.theme || 'serene';
  const form  = state?.form  || { firstName:'First', lastName:'Last', dates:'—', message:'A few words…', photo:'' };
  const initial = state?.butterflies || [
    { id: 'b1', from: 'Alex', message: 'Thinking of you.' },
    { id: 'b2', from: 'Sam',  message: 'Forever in our hearts.' },
  ];

  const [butterflies, setButterflies] = useState(initial);
  const [highlightedId, setHighlightedId] = useState(null);
  const fullName = useMemo(() => `${form.firstName||'First'} ${form.lastName||'Last'}`.trim(), [form]);
  const makeId   = () => Math.random().toString(36).slice(2, 9);

  // rotate a random butterfly's label every ~20s
  useEffect(() => {
    if (butterflies.length === 0) return;
    let timer;
    const choose = () => {
      const random = butterflies[Math.floor(Math.random() * butterflies.length)];
      setHighlightedId(random.id);
      timer = setTimeout(choose, 20000);
    };
    choose();
    return () => clearTimeout(timer);
  }, [butterflies]);

  return (
    <div className="page full-page" style={{position:'relative'}}>
      <div className="wrap full-wrap" style={{padding:0}}>
        {/* Header */}
        <div style={{position:'absolute', top:12, left:12, right:12, zIndex:20, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <Link to="/" className="brand" style={{padding:'6px 10px', borderRadius:10, background:'#ffffffb8', boxShadow:'0 8px 24px var(--ring)', backdropFilter:'blur(6px)'}}>
            <div className="logo" aria-hidden="true">🦋</div>
            <h1 className="h1">Spirit Butterfly</h1>
          </Link>
          <div className="cta-row" style={{margin:0}}>
            <Link to="/create" className="btn ghost">Create a Garden</Link>
          </div>
        </div>

        {/* Full-viewport garden */}
        <main className={`right theme-${theme} garden-stage`} style={{position:'fixed', inset:0, borderRadius:0}}>
          <div ref={stageRef} className="garden">
            <div className="hill" />

            {/* Floating butterflies (SVG + label, physics-driven) */}
            {butterflies.map((b, i) => (
              <FlyingButterfly
                key={b.id}
                seed={hashSeed(b.id, i)}
                label={`${b.from}: ${b.message}`}
                forceShow={highlightedId === b.id}
                containerRef={stageRef}
              />
            ))}

            {/* Identity card */}
            <div className="identity-card" style={{zIndex:22}}>
              {form.photo
                ? <img src={form.photo} alt="" className="identity-photo" />
                : <div className="identity-photo placeholder" />
              }
              <div>
                <div className="identity-name">{fullName}</div>
                <div className="sub">{form.dates || '—'}</div>
              </div>
            </div>

            {/* Bottom message ribbon */}
            <div className="message-ribbon">
              <div className="sub" style={{textAlign:'center'}}>
                {form.message || 'This garden is a serene space for memories and butterflies.'}
              </div>
            </div>

            {/* Controls */}
            <GardenControls
              butterflies={butterflies}
              onAdd={(entries)=>{
                setButterflies(curr => [
                  ...curr,
                  ...entries.map(e => ({ id: makeId(), from: e.from, message: e.message }))
                ]);
              }}
            />
          </div>
        </main>
      </div>

      {/* Scoped styles for the flapping SVG + label */}
      <style>{`
        .bf { position:absolute; will-change: transform; pointer-events:auto; }
        .bf-svg { width:32px; height:28px; filter: drop-shadow(0 4px 10px rgba(0,0,0,.15)); display:block; }
        .bf-label {
          position:absolute; top:30px; left:50%; transform:translateX(-50%);
          background:#ffffffcc; padding:4px 8px; border-radius:10px; font-size:.85rem;
          max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          box-shadow:0 6px 16px var(--ring);
          opacity:0; transition: opacity .25s ease; pointer-events:none;
        }
        .bf:hover .bf-label, .bf-label.force-show { opacity:1; }
        .wing-left  { transform-origin: 16px 14px; animation: flapL 1.05s ease-in-out infinite; }
        .wing-right { transform-origin: 24px 14px; animation: flapR 1.05s ease-in-out infinite; }
        @keyframes flapL { 0%,100%{ transform: rotate(8deg) } 50%{ transform: rotate(-14deg) } }
        @keyframes flapR { 0%,100%{ transform: rotate(-8deg) } 50%{ transform: rotate(14deg) } }
      `}</style>
    </div>
  );
}

/* ---------- Butterfly physics (noise, lift, edge steer) ---------- */
function FlyingButterfly({ seed=1, label='', forceShow=false, containerRef }){
  const elRef  = useRef(null);  // translates
  const svgRef = useRef(null);  // rotates (wings flap via CSS)

  useEffect(()=>{
    const el = elRef.current;
    const svgEl = svgRef.current;
    if (!el || !svgEl) return;

    const getW = () => (containerRef?.current?.clientWidth  ?? window.innerWidth);
    const getH = () => (containerRef?.current?.clientHeight ?? window.innerHeight);

    const rand = (n)=> Math.abs(Math.sin((seed+1)*9973 + n*37));
    let x = 40 + rand(1) * (getW()*0.6);
    let y = 140 + rand(2) * (getH()*0.5);
    let angle = (rand(3)*Math.PI*2) - Math.PI;
    let speed = 20 + rand(4)*20;
    let t0 = performance.now();
    const margin = 24;

    function loop(t){
      const dt = Math.min(0.032, (t - t0)/1000); t0 = t;

      // heading noise + lift
      const w = 0.9*Math.sin(t*0.0012 + seed) + 0.4*Math.sin(t*0.00073 + seed*1.7);
      angle += w * 0.015;

      // soft edge steer towards center-ish
      const W = getW(), H = getH();
      const cx = W*0.5, cy = H*0.45;
      if (x < margin || x > W - margin || y < margin || y > H - margin){
        const desired = Math.atan2(cy - y, cx - x);
        const diff = normalizeAngle(desired - angle);
        angle += diff * 0.08;
      }

      // speed pulse
      const pulse = 1 + 0.12*Math.sin(t*0.012 + seed);
      const vx = Math.cos(angle) * speed * pulse;
      const vy = Math.sin(angle) * speed * pulse - 4;

      x += vx * dt; y += vy * dt;

      // soft clamp
      if (x < margin) { x = margin; angle += 0.6; }
      if (x > W - margin) { x = W - margin; angle -= 0.6; }
      if (y < margin) { y = margin; angle += 0.6; }
      if (y > H - margin) { y = H - margin; angle -= 0.6; }

      const tilt = (Math.sin(t*0.008 + seed)*8);

      // translate container (no rotation)
      el.style.transform = `translate(${x}px, ${y}px)`;
      // rotate only the svg (keeps text upright)
      svgEl.style.transform = `rotate(${(angle*180/Math.PI)+tilt}deg)`;

      raf = requestAnimationFrame(loop);
    }

    let raf = requestAnimationFrame(loop);
    const onResize = () => {}; // sizes fetched each frame
    window.addEventListener('resize', onResize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  },[seed, containerRef]);

  return (
    <div ref={elRef} className="bf" aria-hidden="true">
      <svg ref={svgRef} className="bf-svg" viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="20" r="2.4" fill="#2f3a4c"/>
        <g className="wing-left">
          <path d="M24 8c-6 0-10 2-12 5s-2 7 2 9c4-1 7-3 10-6 2-2 3-5 0-8z" fill="#6ec3ff"/>
        </g>
        <g className="wing-right">
          <path d="M24 8c6 0 10 2 12 5s2 7-2 9c-4-1-7-3-10-6-2-2-3-5 0-8z" fill="#6c62ff"/>
        </g>
      </svg>
      {label && <div className={`bf-label ${forceShow ? 'force-show' : ''}`}>{label}</div>}
    </div>
  );
}

function GardenControls({ butterflies, onAdd }) {
  const [open, setOpen] = useState(null); // 'list' | 'buy' | null
  const [name, setName] = useState('');
  const [msg,  setMsg]  = useState('');
  const [qty,  setQty]  = useState('1');

  const release = () => {
    const count = Math.max(1, Math.min(parseInt(qty || '1', 10), 50));
    const entries = Array.from({ length: count }).map(() => ({
      from: name || 'Someone',
      message: msg || '🦋'
    }));
    onAdd(entries);
    setOpen(null);
    setName(''); setMsg(''); setQty('1');
  };

  return (
    <>
      <div className="garden-controls" style={{zIndex:21}}>
        <button className="btn ghost" onClick={()=>setOpen('list')}>Butterflies ({butterflies.length})</button>
        <button className="btn primary" onClick={()=>setOpen('buy')}>Buy & release</button>
      </div>

      <Panel open={open==='list'} onClose={()=>setOpen(null)} title="Butterflies in this garden">
        {butterflies.length===0 && <div className="sub">No butterflies yet. Be the first to leave a message.</div>}
        {butterflies.map(b => (
          <div key={b.id} className="card" style={{marginBottom:10, display:'flex', gap:10, alignItems:'center'}}>
            <div className="badge" style={{width:36, height:36, borderRadius:10, display:'grid', placeItems:'center'}}>🦋</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:700}}>{b.from}</div>
              <div className="sub" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{b.message}</div>
            </div>
          </div>
        ))}
      </Panel>

      <Panel open={open==='buy'} onClose={()=>setOpen(null)} title="Buy & release butterflies">
        <div style={{display:'grid', gap:12}}>
          <input className="in" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="in" placeholder="Short message" value={msg} onChange={e=>setMsg(e.target.value)} />
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
            {[1,5,20].map(n => (
              <button key={n} className={`btn ${qty===(n+'')?'primary':'ghost'}`} onClick={()=>setQty(n+'')}>
                {n} {n===1 ? 'Butterfly' : 'Butterflies'}
              </button>
            ))}
          </div>
          <div className="cta-row" style={{justifyContent:'flex-end', marginTop:4}}>
            <button className="btn primary" onClick={release}>Release</button>
          </div>
        </div>
      </Panel>
    </>
  );
}

function Panel({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="panel-root">
      <button aria-label="Close" className="panel-backdrop" onClick={onClose} />
      <div className="hero-card panel-sheet">
        <div className="panel-head">
          <h3 className="h3" style={{margin:0}}>{title}</h3>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* util */
function hashSeed(id, i){
  let h=0; const s=id+':'+i; for(let k=0;k<s.length;k++){ h=(h*31 + s.charCodeAt(k))|0; }
  return Math.abs(h%10000)+1;
}
function normalizeAngle(a){
  while(a > Math.PI) a -= Math.PI*2; while(a < -Math.PI) a += Math.PI*2; return a;
}
