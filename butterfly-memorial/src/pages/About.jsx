import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../pages/spirit-butterfly.css';
import FlowersBackground from '../assets/backgrounds/background__homepage.png';
import AuthPopup from '../components/AuthPopup';
import Header from '../components/Header';

const About = () => {
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

        <section className="hero" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '380px',
        }}>
          <div className="hero-card" style={{
            maxWidth: '600px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '44px 36px',
            textAlign: 'center',
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
              Butterfly Memorial Garden
            </h2>
            <p style={{
              marginBottom: '1.25rem',
              color: 'var(--muted)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              maxWidth: '480px',
            }}>
              This site is a gentle space for people to pay tribute to their loved ones. Here, you can share fond thoughts and prayers, and offer comfort to those who are grieving. Each butterfly is a symbol of remembrance, hope, and connection.
            </p>
            <Link to="/create" className="btn primary" style={{ minWidth: '200px' }}>
              Create your first Garden
            </Link>
          </div>
        </section>

        <footer className="page-footer">
          &copy; {new Date().getFullYear()} Butterfly Memorial &bull; Made with love
        </footer>
      </div>
    </div>
  );
};

export default About;
