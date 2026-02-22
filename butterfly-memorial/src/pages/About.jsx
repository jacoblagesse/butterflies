import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import './spirit-butterfly.css';

const About = () => {
  return (
    <PageLayout centered>
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
          Welcome to ButterflyTribute.com
        </h2>
        <p style={{
          marginBottom: '1rem',
          color: 'var(--muted)',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          maxWidth: '520px',
        }}>
          Choose from our serene garden scenes, each designed to reflect peace and hold memories of a loved one.
          Together, we'll honor their spirit with heartfelt tributes in a tranquil space.
        </p>
        <p style={{
          marginBottom: '1.5rem',
          color: 'var(--muted)',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          maxWidth: '520px',
        }}>
          As a gift to those grieving, we offer a free garden memorial and a butterfly. Once the garden is created,
          you can share it with friends and family, who can release their own butterflies as a show of love and support.
          This beautiful garden can be revisited anytime as a place where memories can continue to bloom.
        </p>
        <Link to="/create" className="btn primary" style={{ minWidth: '200px' }}>
          Create your first Garden
        </Link>
      </div>
    </PageLayout>
  );
};

export default About;
