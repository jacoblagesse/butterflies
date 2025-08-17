import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './spirit-butterfly.css';

export default function Landing(){
  // spawn decorative butterflies on the hero visual
  useEffect(()=>{
    const box = document.getElementById('landing-butterflies');
    if(!box) return; box.innerHTML = '';
    const add=(x,y,dx,delay,dur)=>{
      const d=document.createElement('div');
      d.className='butterfly';
      d.style.setProperty('--x',x+'px');
      d.style.setProperty('--y',y+'px');
      d.style.setProperty('--dx',dx+'px');
      d.style.setProperty('--delay',delay+'ms');
      d.style.setProperty('--dur',dur+'ms');
      d.innerHTML=`<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 5c1.6 0 2.6.3 3.6 1.3S17 8.4 17 10c-1.3-.3-2.3-.7-3.6-1.9C12.5 7 12 6 12 5Z" fill="#6c62ff"/><path d="M12 5c-1.6 0-2.6.3-3.6 1.3S7 8.4 7 10c1.3-.3 2.3-.7 3.6-1.9C11.5 7 12 6 12 5Z" fill="#6ec3ff"/><circle cx="12" cy="12" r="1" fill="#2f3a4c"/></svg>`;
      box.appendChild(d);
    };
    for(let i=0;i<14;i++){
      add(
        40 + Math.random()*420,
        140 + Math.random()*260,
        -70 + Math.random()*140,
        Math.random()*2200,
        9000 + Math.random()*5000
      );
    }
  },[]);

  return (
    <div className="page">
      <div className="wrap">
        <header>
          <Link to="/" className="brand">
            <div className="logo" aria-hidden="true">🦋</div>
            <h1 className="h1">Spirit Butterfly</h1>
          </Link>
          <nav>
            <Link to="/about">About</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/signin" className="signin">Sign in</Link>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card">
            <span className="eyebrow">A gentle place</span>
            <h2>Butterfly Garden</h2>
            <p className="sub">Create a serene memorial where butterflies carry short messages.</p>
            <div className="cta-row">
              <Link className="btn primary" to="/create">Create your first Garden</Link>
              <a className="btn ghost" href="#pricing">Buy butterflies</a>
            </div>
          </div>

          <div className="right" aria-hidden="true">
            <div className="garden">
              <div className="hill"/>
              <div className="flower" style={{left:'18%', bottom:'14%'}}/>
              <div className="flower" style={{left:'34%', bottom:'18%'}}/>
              <div className="flower" style={{left:'56%', bottom:'12%'}}/>
              <div className="flower" style={{left:'72%', bottom:'20%'}}/>
              <div id="landing-butterflies"/>
            </div>
          </div>
        </section>

        <section id="pricing" className="buy" style={{marginTop:24}}>
          <h4 className="h4">Buy butterflies</h4>
          <div className="tiers">
            {[
              { q:'1',  p:'¥300' },
              { q:'5',  p:'¥1,200' },
              { q:'20', p:'¥4,200' }
            ].map((t,i)=> (
              <div className="card" key={i}>
                <div className="left" style={{display:'flex',alignItems:'center',gap:12}}>
                  <div className="badge" style={{background:'linear-gradient(135deg,#ffe7f3,#e6f5ff)', borderRadius:12, width:40, height:40, display:'grid',placeItems:'center'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4c1.8 0 2.9.4 4 1.5S18.5 8.2 18.5 10c-1.5-.4-2.7-.8-4.2-2.2C12.7 6.3 12 5.2 12 4Z" fill="#6c62ff"/><path d="M12 4c-1.8 0-2.9.4-4 1.5S5.5 8.2 5.5 10c1.5-.4 2.7-.8 4.2-2.2C11.3 6.3 12 5.2 12 4Z" fill="#6ec3ff"/></svg>
                  </div>
                  <div>
                    <div className="qty">{t.q} {t.q==='1'?'Butterfly':'Butterflies'}</div>
                    <div className="price">{t.p}</div>
                  </div>
                </div>
                <Link className="btn ghost" to="/pricing">Buy</Link>
              </div>
            ))}
          </div>
        </section>

        <footer>© {new Date().getFullYear()} Spirit Butterfly • Made with love</footer>
      </div>
    </div>
  );
}
