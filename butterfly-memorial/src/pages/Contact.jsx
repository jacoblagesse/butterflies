import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../contexts/AuthContext';
import { sendContactMessageFn } from '../firebase';
import LogoUrl from '../assets/logos/logo.svg';
import './spirit-butterfly.css';

const MAX_MESSAGE_LEN = 3000;

const labelStyle = { display: 'grid', gap: '6px', fontSize: 'var(--fs-small)', color: 'var(--ink)', fontWeight: 500 };

export default function Contact() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }
    setStatus('sending');
    try {
      await sendContactMessageFn({ name: name.trim(), email: email.trim(), message: message.trim(), website });
      setStatus('sent');
    } catch (err) {
      console.error('Contact form failed:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  };

  const reset = () => {
    setMessage('');
    setStatus('idle');
  };

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
              Contact Us
            </h2>

            {status === 'sent' ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
                  Thank you for reaching out. Your message is on its way, and we'll reply to{' '}
                  <strong style={{ color: 'var(--ink)' }}>{email.trim()}</strong> as soon as we can.
                </p>
                <div className="cta-row">
                  <button type="button" className="btn ghost" onClick={reset}>Send another message</button>
                  <Link to="/" className="btn primary">Back to Home</Link>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                  Have a question, a suggestion, or need help with a garden? Send us a note and we'll get back to you.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }} noValidate>
                  <label style={labelStyle}>
                    Your name <span className="sub" style={{ fontWeight: 400 }}>(optional)</span>
                    <input
                      className="in"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      autoComplete="name"
                    />
                  </label>
                  <label style={labelStyle}>
                    Email address
                    <input
                      className="in"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </label>
                  <label style={labelStyle}>
                    Message
                    <textarea
                      className="in"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={7}
                      maxLength={MAX_MESSAGE_LEN}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </label>
                  {/* Honeypot — hidden from people, tempting to bots. */}
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  />
                  {error && <div className="buy-error" role="alert">{error}</div>}
                  <div className="cta-row">
                    <button type="submit" className="btn primary" disabled={status === 'sending'}>
                      {status === 'sending' ? 'Sending…' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
