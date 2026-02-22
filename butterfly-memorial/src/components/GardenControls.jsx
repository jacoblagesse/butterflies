import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc } from 'firebase/firestore';
import { db, createPaymentIntentFn, confirmPaymentFn } from '../firebase';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import hatchGif from '../assets/misc/hatch.gif';
import ButterflyColorChanger from '../assets/misc/butterfly6colorchanger.gif';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function GardenControls({ butterflies, onAdd, gardenId, releaseDisabledPredicate }) {
  const [open, setOpen] = useState(null); // 'list' | 'buy' | null
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [qty, setQty] = useState('1');

  // 3-step wizard state
  const [wizardStep, setWizardStep] = useState(1); // 1 | 2 | 3
  const [wizardDir, setWizardDir] = useState('forward');

  // Payment flow state
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // Discover butterfly color folders dynamically (Vite import.meta.glob)
  const [colors, setColors] = useState([]);
  const [assets, setAssets] = useState({}); // { ColorName: { resting, flying } }
  const [selectedColor, setSelectedColor] = useState(null);
  const [hatchPlaying, setHatchPlaying] = useState(false);
  const [hatchKey, setHatchKey] = useState(0); // force GIF remount each play
  const [spawnVisible, setSpawnVisible] = useState(false); // show butterfly centered after hatch
  const [hatchSrc, setHatchSrc] = useState(hatchGif);

  // Load chrysalis gifs: src/assets/chrysalis/chrysalis-<color>.gif
  const [chrysalisMap, setChrysalisMap] = useState({});
  useEffect(() => {
    try {
      const chrysalisFiles = import.meta.glob('/src/assets/chrysalis/chrysalis-*.gif', { eager: true });
      const map = {};
      Object.keys(chrysalisFiles).forEach((p) => {
        // extract "<color>" from "chrysalis-<color>.gif"
        const m = p.match(/chrysalis-([^./]+)\.gif$/);
        if (!m) return;
        const color = m[1].toLowerCase(); // e.g., "blue"
        const mod = chrysalisFiles[p];
        map[color] = mod.default ?? mod;
      });
      setChrysalisMap(map);
    } catch {
      setChrysalisMap({});
    }
  }, []);

  useEffect(() => {
    try {
      const restingFiles = import.meta.glob('/src/assets/butterflies/*/resting.*', { eager: true });
      const flyingFiles = import.meta.glob('/src/assets/butterflies/*/flying.*', { eager: true });

      const toColor = (p) => {
        const m = p.match(/\/butterflies\/([^/]+)\//);
        return m ? m[1] : null;
      };

      const colorSet = new Set();
      Object.keys(restingFiles).forEach((p) => {
        const c = toColor(p);
        if (c) colorSet.add(c);
      });
      Object.keys(flyingFiles).forEach((p) => {
        const c = toColor(p);
        if (c) colorSet.add(c);
      });

      const sorted = Array.from(colorSet).sort((a, b) => a.localeCompare(b));
      const names = sorted.map((n) => n.charAt(0).toUpperCase() + n.slice(1));
      setColors(names);

      const map = {};
      sorted.forEach((c) => {
        const cap = c.charAt(0).toUpperCase() + c.slice(1);
        const restingKey = Object.keys(restingFiles).find((p) => toColor(p) === c);
        const flyingKey = Object.keys(flyingFiles).find((p) => toColor(p) === c);
        map[cap] = {
          resting: restingKey ? restingFiles[restingKey].default ?? restingFiles[restingKey] : null,
          flying: flyingKey ? flyingFiles[flyingKey].default ?? flyingFiles[flyingKey] : null,
        };
      });
      setAssets(map);
    } catch {
      setColors([]);
      setAssets({});
    }
  }, []);

  const createButterfly = async () => {
    const gardenRef = doc(db, 'gardens', gardenId);
    const colorKey = selectedColor ? selectedColor.toLowerCase() : null;

    const docRef = await addDoc(collection(db, 'butterflies'), {
      gifter: name,
      message: msg,
      garden: gardenRef,
      gardenId,
      color: colorKey, // selected color saved
      created: new Date(),
    });
    console.log('Butterfly created:', docRef.id);
    return docRef.id;
  };

  const release = async () => {
    // Close shop immediately so it doesn't affect butterflies
    setOpen(null);
    setWizardStep(1);
    setWizardDir('forward');
    setClientSecret(null);

    // Pick chrysalis gif based on selectedColor (fallback to hatchGif)
    const colorKey = selectedColor ? selectedColor.toLowerCase() : null;
    const baseSrc = (colorKey && chrysalisMap[colorKey]) ? chrysalisMap[colorKey] : hatchGif;

    // Cache-bust + remount image to guarantee full restart
    const bust = Date.now();
    setHatchSrc(`${baseSrc}?cb=${bust}`);
    setHatchKey((k) => k + 1);

    // Start hatch after src set
    setHatchPlaying(true);
  };

  // Wizard navigation
  const goNext = () => {
    setWizardDir('forward');
    setWizardStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setWizardDir('back');
    setWizardStep((s) => Math.max(1, s - 1));
    // If going back from payment step, clear intent
    if (wizardStep === 3) {
      setClientSecret(null);
      setPaymentError(null);
    }
  };

  // Create PaymentIntent and move to payment step
  const handleContinueToPayment = async () => {
    setCreatingIntent(true);
    setPaymentError(null);

    try {
      const colorKey = selectedColor ? selectedColor.toLowerCase() : null;
      const result = await createPaymentIntentFn({
        gardenId,
        color: colorKey || '',
        gifter: name.trim(),
        message: msg.trim(),
      });
      setClientSecret(result.data.clientSecret);
      setWizardDir('forward');
      setWizardStep(3);
    } catch (err) {
      setPaymentError(err.message || 'Failed to start payment. Please try again.');
    } finally {
      setCreatingIntent(false);
    }
  };

  // After Stripe confirms payment on client, verify server-side then release
  const handlePaymentSuccess = async (paymentIntentId) => {
    setConfirmingPayment(true);
    setPaymentError(null);

    try {
      await confirmPaymentFn({ paymentIntentId });
      // Payment verified — trigger hatch animation + butterfly creation
      release();
    } catch (err) {
      setPaymentError(err.message || 'Payment verification failed.');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handlePanelClose = () => {
    setOpen(null);
    setWizardStep(1);
    setWizardDir('forward');
    setClientSecret(null);
    setPaymentError(null);
  };

  // Validation
  const hasColor = !!selectedColor;
  const hasNameMsg = !!(name && name.trim()) && !!(msg && msg.trim());

  // Stripe Elements appearance — warm/light theme
  const stripeAppearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#7d6b91',
      colorBackground: '#ffffff',
      colorText: '#2c2836',
      colorDanger: '#c44040',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '12px',
    },
    rules: {
      '.Input': { border: '1px solid #e8e2ee', boxShadow: 'none' },
      '.Input:focus': { border: '1px solid #9b8ec4', boxShadow: '0 0 0 3px rgba(155,142,196,0.12)' },
      '.Tab': { border: '1px solid #e8e2ee' },
      '.Tab--selected': { backgroundColor: 'rgba(155,142,196,0.08)', border: '1px solid #9b8ec4' },
    },
  };

  return (
    <>
      {/* Full-screen hatch overlay */}
      <div className={`hatch-overlay ${hatchPlaying ? 'open' : ''}`} aria-hidden={!hatchPlaying}>
        {hatchPlaying && (
          <img
            key={hatchKey}
            className="hatch-img"
            src={hatchSrc}
            alt="Butterfly hatching"
            style={{ boxShadow: 'none', filter: 'none', animation: 'none' }}
            onLoad={() => {
              // Play long enough to ensure full GIF completes
              const hatchDurationMs = 5000;
              setTimeout(async () => {
                try {
                  const butterflyId = await createButterfly();
                  setHatchPlaying(false);
                  setSpawnVisible(false);
                  setTimeout(() => {
                    setSpawnVisible(false);
                    setName('');
                    setMsg('');
                    setQty('1');
                    setSelectedColor(null);
                  }, 1800);
                } catch (e) {
                  setHatchPlaying(false);
                }
              }, hatchDurationMs);
            }}
          />
        )}
      </div>

      {/* Centered spawn overlay after hatch */}
      <div
        className={`spawn-overlay ${spawnVisible ? 'open' : ''}`}
        aria-hidden={!spawnVisible}
        style={{
          position: 'fixed',
          inset: 0,
          display: spawnVisible ? 'grid' : 'none',
          placeItems: 'center',
          zIndex: 1002, // above everything
          pointerEvents: 'none',
        }}
      >
        {selectedColor && assets[selectedColor] && (
          <img
            src={assets[selectedColor].flying || assets[selectedColor].resting}
            alt={`${selectedColor} butterfly`}
            style={{ width: 120, height: 120 }}
          />
        )}
      </div>

      {/* Local keyframes for pulsing shadow */}
      <style>
        {`
          @keyframes pulseShadow {
            0% { box-shadow: 0 0 10px 5px rgba(255,255,255,1); }
            50% { box-shadow: 0 0 10px 10px rgba(255,255,255,1); }
            100% { box-shadow: 0 0 10px 5px rgba(255,255,255,1); }
          }
          /* Ensure chrysalis image has no glow */
          .hatch-img {
            box-shadow: none !important;
            animation: none !important;
            filter: none !important;
          }
        `}
      </style>

      <div className="garden-controls" style={{ zIndex: 21 }}>
        <button className="btn ghost" onClick={() => setOpen('list')}>
          Butterflies ({butterflies.length})
        </button>
        <button
          className="btn"
          style={{
            background: 'transparent',
            color: '#fff',
            border: 'none',
            transition: 'transform 100ms ease',
            padding: 0,
          }}
          onClick={() => setOpen('buy')}
        >
          <img
            src={ButterflyColorChanger}
            alt="Buy & Release"
            style={{ height: '6rem', width: 'auto', display: 'block'}}
          />
        </button>
      </div>

      <Panel open={open === 'list'} onClose={handlePanelClose} title="Butterflies in this garden">
        {butterflies.length === 0 && <div className="sub">No butterflies yet. Be the first to leave a message.</div>}
        {butterflies.map((b) => (
          <div
            key={b.id}
            className="card"
            style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <div
              className="badge"
              style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center' }}
            >
              🦋
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{b.from}</div>
              <div className="sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {b.message}
              </div>
            </div>
          </div>
        ))}
      </Panel>

      <Panel open={open === 'buy'} onClose={handlePanelClose} stepLabel={`Step ${wizardStep} of 3`}>
        <div className="step-viewport" style={{ marginTop: 0 }}>
          {/* ── Step 1: Choose a butterfly ── */}
          {wizardStep === 1 && (
            <div className={`step-panel ${wizardDir === 'forward' ? 'slide-forward' : 'slide-back'}`}>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', margin: '12px 0 6px' }}>Choose a butterfly</h2>
              <p className="sub" style={{ margin: '0 0 16px' }}>Select a butterfly to release in the garden</p>

              <div className="buy-wizard-grid">
                {colors.map((label) => {
                  const a = assets[label] || {};
                  const isSelected = selectedColor === label;
                  const src = isSelected ? a.flying || a.resting : a.resting || a.flying;
                  return (
                    <button
                      type="button"
                      className={`buy-butterfly-tile${isSelected ? ' selected' : ''}`}
                      key={label}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedColor(isSelected ? null : label)}
                    >
                      {isSelected && <span className="tile-check">✓</span>}
                      {src && <img className="tile-img" src={src} alt={`${label} butterfly`} />}
                      <span className="tile-label">{label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="cta-row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  className="btn primary"
                  onClick={goNext}
                  disabled={!hasColor}
                  aria-disabled={!hasColor}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Attach a message ── */}
          {wizardStep === 2 && (
            <div className={`step-panel ${wizardDir === 'forward' ? 'slide-forward' : 'slide-back'}`}>
              {/* Two-column: heading left, butterfly right */}
              <div className="buy-step2-layout">
                <div className="buy-step2-left">
                  <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', margin: '12px 0 6px' }}>Attach a message</h2>
                  <p className="sub" style={{ margin: 0 }}>Leave a note for it to carry</p>
                </div>

                {/* Butterfly preview — right column */}
                {selectedColor && assets[selectedColor] && (
                  <div className="buy-step2-right">
                    <img
                      src={assets[selectedColor].flying || assets[selectedColor].resting}
                      alt={selectedColor}
                    />
                  </div>
                )}
              </div>

              {/* Inputs — full width below */}
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <input
                  className="in"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <textarea
                  className="in"
                  placeholder="A heartfelt message..."
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {paymentError && (
                <div className="buy-error" style={{ marginTop: 12 }}>{paymentError}</div>
              )}

              <div className="cta-row" style={{ justifyContent: 'space-between', marginTop: 16 }}>
                <button className="btn ghost" onClick={goBack}>Back</button>
                <button
                  className="btn primary"
                  onClick={handleContinueToPayment}
                  disabled={!hasNameMsg || creatingIntent}
                  aria-disabled={!hasNameMsg || creatingIntent}
                >
                  {creatingIntent ? 'Loading...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Complete your release ── */}
          {wizardStep === 3 && (
            <div className={`step-panel ${wizardDir === 'forward' ? 'slide-forward' : 'slide-back'}`}>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', margin: '12px 0 16px' }}>Complete your release</h2>

              {/* Order summary */}
              <div className="buy-summary" style={{ marginBottom: 20 }}>
                {selectedColor && assets[selectedColor] && (
                  <img
                    src={assets[selectedColor].resting}
                    alt={selectedColor}
                  />
                )}
                <div className="summary-details">
                  <div className="summary-name">{selectedColor} for {name}</div>
                  <div className="summary-msg">"{msg}"</div>
                </div>
                <div className="summary-price">$0.99</div>
              </div>

              {paymentError && (
                <div className="buy-error" style={{ marginBottom: 12 }}>{paymentError}</div>
              )}

              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: stripeAppearance,
                  }}
                >
                  <CheckoutForm
                    onSuccess={handlePaymentSuccess}
                    onBack={goBack}
                    loading={confirmingPayment}
                  />
                </Elements>
              )}
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}

function Panel({ open, onClose, title, stepLabel, children }) {
  // Hide completely when not open to avoid dark overlay affecting the scene
  if (!open) return null;

  return (
    <div
      className="panel-root open"
      aria-hidden={!open}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001,
        pointerEvents: 'auto',
        padding: '5vh 0',
      }}
    >
      <button
        aria-label="Close"
        className="panel-backdrop"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
        }}
      />
      <div
        className="hero-card panel-sheet open"
        style={{
          position: 'relative',
          maxWidth: 680,
          zIndex: 1002,
        }}
      >
        <div className="panel-head">
          {title ? (
            <h3 className="h3" style={{ margin: 0, fontSize: '1.5em' }}>
              {title}
            </h3>
          ) : stepLabel ? (
            <span className="eyebrow">{stepLabel}</span>
          ) : <div />}
          <button
            aria-label="Close"
            onClick={onClose}
            style={{
              appearance: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              lineHeight: 1,
              fontSize: 22,
              color: '#a8a0b4',
            }}
          >
            ✕
          </button>
        </div>
        <div className="panel-content open">{children}</div>
      </div>
    </div>
  );
}
