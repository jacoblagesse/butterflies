import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/spirit-butterfly.css';
import FlowersBackground from '../assets/backgrounds/background__homepage.png';

const About = () => (
  <div className="page" style={{
    backgroundImage: `url(${FlowersBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh',
  }}>
    <div className="wrap">
      <header>
        <div className="brand">
          <Link to="/" className="brand">
            <div className="logo">🦋</div>
            <h1 className="h1">Butterfly Memorial</h1>
          </Link>
        </div>
        <nav>
          <Link to="/pricing">Pricing</Link>
          <Link to="/about">About</Link>
          <Link className="signin" to="/signin">Sign in</Link>
        </nav>
      </header>
      <section className="hero">
        <div className="hero-card" style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Butterfly Memorial Garden</h2>
          <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.15rem', color: '#394150' }}>
            This site is a gentle space for people to pay tribute to their loved ones. Here, you can share fond thoughts and prayers, and offer comfort to those who are grieving. Each butterfly is a symbol of remembrance, hope, and connection.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <a href="/create" className="btn primary" style={{ textAlign: 'center', minWidth: '220px' }}>Create your first Garden</a>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#394150' }}>
  © {new Date().getFullYear()} Butterfly Memorial • Made with love
      </footer>
    </div>
  </div>
);

export default About;
