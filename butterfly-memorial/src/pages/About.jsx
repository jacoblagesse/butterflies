import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import './spirit-butterfly.css';

export default function About() {
  return (
    <PageLayout>
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
              The Hope
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: '0 0 1rem' }}>
              We want these "gardens of celebration" to open hearts to connection, creating a space where love,
              memory — and sometimes even laughter — combine to comfort tender hearts. They offer solace similar
              to what's often felt at a loved one's resting place, but can be visited anytime.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: '0 0 1rem' }}>
              Sometimes, these personal gardens become places of gathering, where family and friends celebrate
              the life of someone dearly loved. For others, they become private sanctuaries where the
              broken-hearted can feel moments of connection that soften sorrow, mend the heart, and lift the spirit.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              We hope these gardens offer comfort in beautiful memories shared by family and friends as they
              release butterflies in honor of a loved one. Each becomes its own sacred haven: a place of shared
              love, remembrance, and peace.
            </p>
          </div>

          <div className="hero-card" style={{ padding: 'clamp(28px, 6vw, 48px)' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 1.2rem',
            }}>
              The Inspiration
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: '0 0 1rem' }}>
              This website was born from deep love and healing, inspired by the life and spirit of Stephanie Dobson.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: '0 0 1rem' }}>
              Stephanie's unexpected passing left a void in the hearts of those who knew and loved her. Her mother,
              in particular, found solace in the beauty and symbolism of butterflies. To her, butterflies represented
              Stephanie's spirit — free, beautiful, and ever-present. She began raising butterflies in her Florida
              garden, taking solace in the symbolism of transformation in a caterpillar becoming a winged jewel.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: '0 0 1rem' }}>
              Sadly, many people have no gardens. Our virtual ones allow anyone to share in the same comfort and
              peace that Stephanie's mother feels through the magic of butterflies.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              This initiative is a heartwarming testament to a mother's love and her journey from pain to healing.
              We hope it offers some of the peace that we all are seeking.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/create" className="btn primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
              Create a Garden
            </Link>
          </div>

        </div>
      </section>
    </PageLayout>
  );
}
