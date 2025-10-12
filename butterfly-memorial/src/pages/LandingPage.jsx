import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./spirit-butterfly.css"; // shared stylesheet

import FlowersBackground from '../assets/backgrounds/background__homepage.png';

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
            <div className="logo" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <section className="hero">
          <div className="hero-card">
            <span className="eyebrow">A gentle place</span>
            <h2>Butterfly Garden</h2>
            <p className="sub">Create a serene memorial where butterflies carry messages of love.</p>
            <div className="cta-row">
              <Link className="btn primary" to="/create">Create your first Garden</Link>
              <Link className="btn ghost" to="/pricing">Buy butterflies</Link>
            </div>
          </div>

          <div className="right" aria-hidden="true">
            <div className="garden">
              <div className="hill"></div>
              <div className="flower" style={{ left: "18%", bottom: "14%" }} />
              <div className="flower" style={{ left: "34%", bottom: "18%", background: "#c7ebff", boxShadow: "0 0 0 12px #c7ebff3a" }} />
              <div className="flower" style={{ left: "56%", bottom: "12%" }} />
              <div className="flower" style={{ left: "72%", bottom: "20%", background: "#c7ebff", boxShadow: "0 0 0 12px #c7ebff3a" }} />
              <div id="butterflies" />
            </div>
          </div>
        </section>

        <section id="pricing" className="buy">
          <h4>Buy butterflies</h4>
          <div className="tiers">
            {[
              { q: "1", p: "¥300" },
              { q: "5", p: "¥1,200" },
              { q: "20", p: "¥4,200" },
            ].map((t, i) => (
              <div className="card" key={i}>
                <div className="left">
                  <div className="badge">
                    <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4c1.8 0 2.9.4 4 1.5S18.5 8.2 18.5 10c-1.5-.4-2.7-.8-4.2-2.2C12.7 6.3 12 5.2 12 4Z" fill="#6c62ff"/>
                      <path d="M12 4c-1.8 0-2.9.4-4 1.5S5.5 8.2 5.5 10c1.5-.4 2.7-.8 4.2-2.2C11.3 6.3 12 5.2 12 4Z" fill="#6ec3ff"/>
                    </svg>
                  </div>
                  <div>
                    <div className="qty">{t.q} Butterfl{t.q !== "1" ? "ies" : "y"}</div>
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