import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../pages/spirit-butterfly.css';
import FlowersBackground from '../assets/backgrounds/background__homepage.png';
import AuthPopup from '../components/AuthPopup';
import Header from '../components/Header';

const pricingTiers = [
  { q: '1', p: '$0.99' },
  { q: '5', p: '$4.95' },
  { q: '20', p: '$19.80' },
];

const Pricing = () => {
  const [isAuthOpen, setAuthOpen] = useState(false);

  return (
    <div className="page" style={{
      backgroundImage: `url(${FlowersBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
    }}>
      <div className="wrap">
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} />

        <section style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 0 20px',
          flex: 1,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem', maxWidth: '460px' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
              Buy butterflies
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            width: '100%',
            maxWidth: '680px',
          }}>
            {pricingTiers.map((t, i) => (
              <div
                key={i}
                className="hero-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '28px 24px',
                  textAlign: 'center',
                  gap: '8px',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(212,169,199,0.2), rgba(155,142,196,0.15))',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '22px',
                  marginBottom: '4px',
                }}>
                  🦋
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>
                  {t.q} Butterfl{t.q !== '1' ? 'ies' : 'y'}
                </div>
                <div style={{ color: 'var(--cta)', fontSize: '1.2rem', fontWeight: 700 }}>
                  {t.p}
                </div>
                <button className="btn ghost" style={{
                  fontSize: '0.9rem',
                  padding: '10px 24px',
                  width: '100%',
                }}>
                  Buy
                </button>
              </div>
            ))}
          </div>

        </section>

        <footer className="page-footer">
          &copy; {new Date().getFullYear()} Butterfly Memorial &bull; Made with love
        </footer>
      </div>
    </div>
  );
};

export default Pricing;
