import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/spirit-butterfly.css';

const pricingTiers = [
  { q: '1', p: '$0.99' },
  { q: '5', p: '$4.95' },
  { q: '20', p: '$19.80' },
];

const Pricing = () => (
  <div className="page" style={{ minHeight: '100vh' }}>
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
      <section className="buy" style={{ marginTop: '2.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem', color: '#394150' }}>Buy butterflies</h2>
        <div className="tiers" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {pricingTiers.map((t, i) => (
            <div className="card" key={i} style={{ background: '#fff', borderRadius: '1.2rem', boxShadow: '0 2px 12px #0001', padding: '1.5rem 1.2rem', minWidth: '160px', textAlign: 'center' }}>
              <div className="left" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <div className="badge" style={{ marginRight: '0.7rem', fontSize: '2rem' }}>
                  🦋
                </div>
                <div>
                  <div className="qty" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t.q} Butterfl{t.q !== '1' ? 'ies' : 'y'}</div>
                  <div className="price" style={{ color: '#6c62ff', fontSize: '1.1rem', marginTop: '0.2rem' }}>{t.p}</div>
                </div>
              </div>
              <button className="btn ghost" style={{ display: 'inline-block', marginTop: '0.7rem', minWidth: '90px', borderRadius: '1.2rem', padding: '0.6rem 1.2rem', fontSize: '1rem', background: '#f6f8ff', color: '#394150', border: '1px solid #e0e7ff' }}>Buy</button>
            </div>
          ))}
        </div>
      </section>
      <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#394150' }}>
        © {new Date().getFullYear()} Butterfly Memorial • Made with love
      </footer>
    </div>
  </div>
);

export default Pricing;
