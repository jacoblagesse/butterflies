import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./spirit-butterfly.css"; // shared stylesheet

import FlowersBackground from '../assets/backgrounds/background__homepage.png';
import MountainBackground from '../assets/backgrounds/background_mountain__HD_50000.png';

export default function Landing() {
  useEffect(() => {
    const container = document.getElementById("butterflies");
    if (!container) return;
    container.innerHTML = "";
    const make = (x, y, dx, delay, dur) => {
      const el = document.createElement("div");
      el.className = "butterfly";
      el.style.setProperty("--x", x + "px");
      el.style.setProperty("--y", y + "px");
      el.style.setProperty("--dx", dx + "px");
      el.style.setProperty("--delay", delay + "ms");
      el.style.setProperty("--dur", dur + "ms");
      el.innerHTML = `
        <svg width="44" height="44" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5c1.6 0 2.6.3 3.6 1.3S17 8.4 17 10c-1.3-.3-2.3-.7-3.6-1.9C12.5 7 12 6 12 5Z" fill="#6c62ff"/>
          <path d="M12 5c-1.6 0-2.6.3-3.6 1.3S7 8.4 7 10c1.3-.3 2.3-.7 3.6-1.9C11.5 7 12 6 12 5Z" fill="#6ec3ff"/>
          <circle cx="12" cy="12" r="1" fill="#2f3a4c"/>
        </svg>`;
      container.appendChild(el);
    };
    for (let i = 0; i < 16; i++) {
      make(
        Math.random() * 520 + 40,
        Math.random() * 340 + 180,
        Math.random() * 180 - 90,
        Math.random() * 2400,
        9000 + Math.random() * 6000
      );
    }
  }, []);

  return (
    <div className="page" style={{
      backgroundImage: `url(${FlowersBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <div className="wrap">
        <header>
          <Link className="brand" to="/">
            <div className="logo">🦋</div>
            <h1 className="h1">Butterfly Memorial</h1>
          </Link>
          <nav>
            <Link to="/pricing">Butterflies</Link>
            <Link to="/about">About</Link>
            <Link className="signin" to="/signin">Sign in</Link>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px', padding: '0' }}>
            <h2 style={{ marginBottom: '2.5rem', fontSize: '2.4rem' }}>Butterfly Memorial Garden</h2>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Link className="btn primary" to="/create" style={{ textAlign: 'center', minWidth: '260px', fontSize: '1.25rem', padding: '1rem 2.5rem', borderRadius: '2rem' }}>Create your first Garden</Link>
            </div>
          </div>

          <div className="right" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '340px' }}>
            <img 
              src={MountainBackground} 
              alt="Mountainscape" 
              style={{
                width: '520px',
                height: '340px',
                objectFit: 'cover',
                borderRadius: '2rem',
                border: '4px solid #fff',
                display: 'block',
              }}
            />
          </div>
        </section>

        {/* Removed butterfly purchase options section */}

        <footer>© {new Date().getFullYear()} Spirit Butterfly • Made with love</footer>
      </div>
    </div>
  );
}