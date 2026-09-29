import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import LogoUrl from '../assets/logos/logo.svg';
import './spirit-butterfly.css';

export default function FAQ() {
  return (
    <PageLayout>
      <Link
        to="/"
        className="brand"
        style={{ position: 'fixed', top: 12, left: 16, zIndex: 50 }}
      >
        <img src={LogoUrl} alt="Butterfly Memorial logo" className="logo" />
      </Link>
      <section style={{ flex: 1, padding: '40px 16px 60px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'grid', gap: '24px' }}>
          <div className="hero-card" style={{ padding: 'clamp(28px, 6vw, 48px)' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 1.2rem',
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              Placeholder text — FAQ content coming soon.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
