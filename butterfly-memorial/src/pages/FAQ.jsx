import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import LogoUrl from '../assets/logos/logo.svg';
import './spirit-butterfly.css';

const FAQS = [
  {
    q: 'Must I be related to whomever the garden is dedicated to?',
    a: 'No. We imagine these places to be gatherings of friends and family who are mourning the loss of someone for whom they shared feelings. Some might even be strangers, such as fans of beloved stars, creators, or leaders. Whoever creates a garden by default becomes its caretaker, though we plan to make that admin role transferable or shareable sometime soon.',
  },
  {
    q: 'What if I don’t want my garden shared publicly?',
    a: 'The default is that anyone with the link, which presumably the garden’s caretaker has shared, can visit and release a butterfly. But gardens can be password protected. In that case, a caretaker would need to share the password along with the link for anyone wanting to release a butterfly.',
  },
  {
    q: 'Why is there a charge to release a butterfly?',
    a: 'This is a family operation put together by five of us. We don’t feel it appropriate to have ads on the site, but we’d like to earn something for the many hours spent creating the entirely original art, images, backgrounds and computer code. There are also continuing costs in maintaining and upgrading the service. We’ve kept the price low - significantly less expensive than sending a condolence card. We don’t know that we can ever fully recoup what we’ve invested, but it’s also a feel-good project with an emotional payback. We’ll also donate a percentage of the proceeds to charities that work to preserve real butterflies.',
  },
  {
    q: 'Somebody might release a poor butterfly that doesn’t know it’s carrying a message that’s rude or inappropriate. Who monitors for those, and what can they do about it?',
    a: (
      <>
        The garden’s caretaker can monitor the comments, and delete those they deem unwanted. We also ask visitors
        to <Link to="/contact" style={{ color: 'var(--cta)', textDecoration: 'underline' }}>alert us</Link> to
        inappropriate content, and we will take action when gardens stray from the site’s stated purpose of
        celebrating the lives of those we’ve lost.
      </>
    ),
  },
];

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
            <div style={{ display: 'grid', gap: '1.6rem' }}>
              {FAQS.map(({ q, a }) => (
                <div key={q}>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    lineHeight: 1.4,
                    margin: '0 0 0.5rem',
                  }}>
                    {q}
                  </h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
