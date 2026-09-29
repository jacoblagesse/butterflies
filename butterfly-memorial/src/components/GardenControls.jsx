import React, { useState, useEffect, useRef } from 'react';
import { createPaymentIntentFn, confirmPaymentFn } from '../firebase';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import VolumeButton from './VolumeButton';
import hatchGif from '../assets/misc/hatch.gif';
import ButterflyColorChanger from '../assets/logos/butterfly.png';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Parse every frame's delay time (ms) by properly walking the GIF block
// structure (header + logical screen descriptor + optional global color
// table, then extension / image blocks up to the trailer) rather than
// scanning raw bytes for the Graphic Control Extension's 0x21 0xF9 0x04
// signature. A raw scan can false-positive on that exact 3-byte sequence
// turning up by chance inside compressed image data — large GIFs have
// enough LZW-encoded bytes for this to happen, and the two bytes read as
// "delay" after a false match corrupt the result. Walking the real block
// structure (via documented sub-block lengths) can't be fooled by pixel data.
async function getGifFrameDelaysMs(src) {
  try {
    const resp = await fetch(src);
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);

    // Header (6 bytes: "GIF87a"/"GIF89a") + Logical Screen Descriptor (7
    // bytes: width, height, packed fields, bg color index, pixel aspect).
    const packed = bytes[10];
    const hasGlobalColorTable = (packed & 0x80) !== 0;
    let i = hasGlobalColorTable
      ? 13 + 3 * (1 << ((packed & 0x07) + 1))
      : 13;

    // Sub-blocks are a series of [length byte][length bytes of data],
    // terminated by a zero-length block. Used for extension data and image
    // (LZW-compressed) data alike.
    const skipSubBlocks = (idx) => {
      while (idx < bytes.length) {
        const len = bytes[idx];
        idx += 1;
        if (len === 0) break;
        idx += len;
      }
      return idx;
    };

    const delaysMs = [];
    while (i < bytes.length) {
      const marker = bytes[i];
      if (marker === 0x21) {
        // Extension Introducer
        const label = bytes[i + 1];
        if (label === 0xF9) {
          // Graphic Control Extension: 21 F9 <blockSize> <blockSize bytes> 00
          const blockSize = bytes[i + 2];
          // Delay time is the 2nd/3rd data byte (LE), right after the
          // packed-fields byte.
          delaysMs.push((bytes[i + 4] | (bytes[i + 5] << 8)) * 10);
          i = i + 3 + blockSize + 1; // introducer+label+sizebyte + data + terminator
        } else {
          i += 2; // past introducer + label
          i = skipSubBlocks(i);
        }
      } else if (marker === 0x2C) {
        // Image Descriptor: 2C + left(2) + top(2) + width(2) + height(2) + packed(1)
        const imgPacked = bytes[i + 9];
        let idx = i + 10;
        if (imgPacked & 0x80) {
          idx += 3 * (1 << ((imgPacked & 0x07) + 1)); // local color table
        }
        idx += 1; // LZW minimum code size byte
        i = skipSubBlocks(idx);
      } else {
        // Trailer (0x3B) or anything unexpected — stop parsing.
        break;
      }
    }

    return delaysMs;
  } catch {
    return [];
  }
}

// The gif's own frame delays sum to ~14.5-14.6s, but browsers add a little
// per-frame compositing overhead on top of the nominal delay — across
// 42-43 frames that's enough to visibly run past the real animation and
// loop a bit before the fade kicks in. Capping the cutoff below the summed
// total accounts for that overhead.
const CUTOFF_CAP_MS = 14000;

function computeCutoffMs(delaysMs) {
  if (!delaysMs.length) return 5000; // parsing failed — safe fallback
  let total = 0;
  for (const d of delaysMs) total += d;
  return Math.min(total, CUTOFF_CAP_MS);
}

export default function GardenControls({ butterflies, onAdd, gardenId, releaseDisabledPredicate, muted, onVolumeToggle, onPendingChange }) {
  const [open, setOpen] = useState(null); // 'list' | 'buy' | null
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

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
  const [hatchFading, setHatchFading] = useState(false);
  const [hatchKey, setHatchKey] = useState(0); // force GIF remount each play
  const [hatchSrc, setHatchSrc] = useState(hatchGif);
  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');
  const hatchFireRef = useRef(false);
  // { [color]: Promise<cutoffMs> } — kicked off as soon as a color is picked
  // (step 1) so the multi-megabyte gif is already fetched and its cutoff
  // point (see computeCutoffMs) known by the time the user reaches "Release"
  // a couple of steps later. Without this, parsing frame timing at play-time
  // (inside the <img> onLoad handler) adds the fetch+parse latency of a
  // ~7-13MB file on top of the real cutoff before the fade-out timer is even
  // scheduled.
  const chrysalisCutoffsRef = useRef({});

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

  // Prefetch the selected color's chrysalis gif (and compute its cutoff
  // point) as soon as it's chosen, well ahead of the "Release" click.
  useEffect(() => {
    if (!selectedColor) return;
    const colorKey = selectedColor.toLowerCase();
    if (chrysalisCutoffsRef.current[colorKey]) return; // already fetching/fetched
    const src = chrysalisMap[colorKey];
    if (!src) return;
    chrysalisCutoffsRef.current[colorKey] = getGifFrameDelaysMs(src).then(computeCutoffMs);
  }, [selectedColor, chrysalisMap]);

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

      const sorted = Array.from(colorSet).filter((c) => c !== "white").sort((a, b) => a.localeCompare(b));
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
    hatchFireRef.current = false;
    const bust = Date.now();
    setHatchSrc(`${baseSrc}?cb=${bust}`);
    setHatchKey((k) => k + 1);

    // Start hatch after src set
    setHatchPlaying(true);
  };

  // Wizard navigation
  const goNext = () => {
    if (!hasColor) { setStep1Error('Please choose a butterfly first.'); return; }
    setStep1Error('');
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
    if (!hasNameMsg) { setStep2Error('Please enter your name and a message.'); return; }
    setStep2Error('');
    setCreatingIntent(true);
    setPaymentError(null);

    try {
      const colorKey = selectedColor ? selectedColor.toLowerCase() : null;
      const result = await createPaymentIntentFn({
        gardenId,
        color: colorKey || '',
        gifter: name.trim(),
        email: email.trim(),
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
      const result = await confirmPaymentFn({ paymentIntentId });
      const butterflyId = result?.data?.butterflyId;
      if (butterflyId) onPendingChange?.(butterflyId);
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

  const hasColor = !!selectedColor;
  const hasNameMsg = !!(name && name.trim()) && !!(msg && msg.trim());

  // Stripe Elements appearance — warm/light theme
  const stripeAppearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#19b2ed',
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
      <div className={`hatch-overlay ${hatchPlaying && !hatchFading ? 'open' : ''}`} aria-hidden={!hatchPlaying}>
        {hatchPlaying && (
          <img
            key={hatchKey}
            className="hatch-img"
            src={hatchSrc}
            alt="Butterfly hatching"
            style={{ boxShadow: 'none', filter: 'none', animation: 'none' }}
            onLoad={async () => {
              if (hatchFireRef.current) return;
              hatchFireRef.current = true;
              // Use the prefetched cutoff if step 1 already kicked it off
              // (the common case) — awaiting an already-settled promise
              // costs a microtask, not a fresh multi-megabyte fetch. Only
              // fetch fresh here if nothing was prefetched (e.g. the
              // no-chrysalis fallback gif).
              const colorKey = selectedColor ? selectedColor.toLowerCase() : null;
              const cutoffPromise = (colorKey && chrysalisCutoffsRef.current[colorKey])
                || getGifFrameDelaysMs(hatchSrc).then(computeCutoffMs);
              const cutoffMs = await cutoffPromise;

              // Reveal the real butterfly a moment before the chrysalis
              // itself starts fading — it's still rendered underneath the
              // (higher z-index) chrysalis overlay at that point, so it's
              // invisible until the overlay actually fades, but it's
              // already there, positioned and settled, the instant it does.
              // That removes any pop-in gap between the chrysalis
              // disappearing and the real butterfly appearing. The fade
              // below still triggers at the exact, full natural duration —
              // this just runs slightly ahead of it, not instead of it.
              const revealHeadStartMs = 200;
              setTimeout(() => {
                onPendingChange?.(null);
              }, Math.max(0, cutoffMs - revealHeadStartMs));

              setTimeout(() => {
                // Swap to transparent pixel so the GIF doesn't loop during fade
                setHatchSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
                setHatchFading(true);
                setTimeout(() => {
                  setHatchPlaying(false);
                  setHatchFading(false);
                  setName('');
                  setEmail('');
                  setMsg('');
                  setSelectedColor(null);
                }, 350);
              }, cutoffMs);
            }}
          />
        )}
      </div>

      {/* Local keyframes for pulsing shadow */}
      <style>
        {`
          @keyframes hueShift {
            0%   { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
          }
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
          .release-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: linear-gradient(135deg, rgba(155,142,196,0.55), rgba(212,169,199,0.45));
            border: none;
            border-radius: 16px;
            padding: 10px 14px 6px;
            cursor: pointer;
            transition: transform 120ms ease, background 200ms ease, box-shadow 200ms ease;
            box-shadow: 0 4px 16px rgba(125,107,145,0.25);
            backdrop-filter: blur(8px);
          }
          .release-btn:hover {
            background: linear-gradient(135deg, rgba(155,142,196,0.8), rgba(212,169,199,0.7));
            transform: scale(1.08);
            box-shadow: 0 8px 28px rgba(125,107,145,0.45);
          }
          .release-btn:active {
            transform: scale(0.97);
          }
          .tile-img-wrap {
            position: relative;
          }
          .tile-img-wrap .tile-img {
            display: block;
            transition: opacity 350ms ease;
          }
          .tile-img-wrap .tile-img-flying {
            position: absolute;
            top: 0; left: 0;
          }
          .release-label {
            font-family: Inter, system-ui, sans-serif;
            font-style: normal;
            font-weight: 800;
            font-size: 1rem;
            color: #fff;
            text-shadow: 0 1px 4px rgba(44,40,54,0.4);
            letter-spacing: 0.02em;
            pointer-events: none;
          }
        `}
      </style>

      {onVolumeToggle && (
        <VolumeButton
          muted={muted}
          onToggle={onVolumeToggle}
          style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 100 }}
        />
      )}
      <div className="garden-controls" style={{ zIndex: 21 }}>
        <button className="btn ghost" onClick={() => setOpen('list')}>
          View all tributes
        </button>
        <button className="release-btn" onClick={() => setOpen('buy')}>
          <span className="release-label">Release a butterfly</span>
          <img
            src={ButterflyColorChanger}
            alt="Buy & Release"
            style={{ height: '6rem', width: 'auto', display: 'block', animation: 'hueShift 4s linear infinite' }}
          />
        </button>
      </div>

      <Panel open={open === 'list'} onClose={handlePanelClose} title="Butterflies in this garden">
        {(() => {
          const listedButterflies = butterflies.filter(b => b.color !== 'white');
          if (listedButterflies.length === 0) return (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div className="sub" style={{ marginBottom: 14 }}>No butterflies yet. Be the first to leave a message.</div>
              <button className="btn primary" onClick={() => { handlePanelClose(); setOpen('buy'); }}>
                Release a butterfly
              </button>
            </div>
          );
          return listedButterflies.map((b) => (
          <div
            key={b.id}
            className="card"
            style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center' }}
          >
            {(() => {
              const colorKey = b.color ? b.color.charAt(0).toUpperCase() + b.color.slice(1) : null;
              const gifSrc = colorKey && assets[colorKey] ? assets[colorKey].resting || assets[colorKey].flying : null;
              return gifSrc
                ? <img src={gifSrc} alt={b.color} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                : <div className="badge" style={{ width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 22 }}>🦋</div>;
            })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{b.gifter || b.from || 'Anonymous'}</div>
              <div className="sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {b.message}
              </div>
            </div>
          </div>
        ));
        })()}
      </Panel>

      <Panel open={open === 'buy'} onClose={handlePanelClose} stepLabel={`Step ${wizardStep} of 3`}>
        <div className="step-viewport" style={{ marginTop: 0 }}>
          {/* ── Step 1: Choose a butterfly ── */}
          {wizardStep === 1 && (
            <div className={`step-panel ${wizardDir === 'forward' ? 'slide-forward' : 'slide-back'}`}>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', margin: '12px 0 6px' }}>Choose a butterfly</h2>
              <p className="sub" style={{ margin: '0 0 16px' }}>
                Select a butterfly to release in the garden — <strong>$1.99 each</strong>
              </p>

              <div className="buy-wizard-grid">
                {colors.map((label) => {
                  const a = assets[label] || {};
                  const isSelected = selectedColor === label;
                  return (
                    <button
                      type="button"
                      className={`buy-butterfly-tile${isSelected ? ' selected' : ''}`}
                      key={label}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedColor(isSelected ? null : label)}
                    >
                      {isSelected && <span className="tile-check">✓</span>}
                      <div className="tile-img-wrap">
                        <img
                          className="tile-img"
                          src={a.resting || a.flying}
                          alt={`${label} butterfly`}
                          style={{ opacity: isSelected ? 0 : 1 }}
                        />
                        <img
                          className="tile-img tile-img-flying"
                          src={a.flying || a.resting}
                          alt=""
                          aria-hidden="true"
                          style={{ opacity: isSelected ? 1 : 0 }}
                        />
                      </div>
                      <span className="tile-label">{label}</span>
                    </button>
                  );
                })}
              </div>

              {step1Error && <p style={{ color: '#c44040', fontSize: 13, margin: '8px 0 0', textAlign: 'right' }}>{step1Error}</p>}
              <div className="cta-row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn primary" onClick={goNext}>
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
                <input
                  className="in"
                  type="email"
                  placeholder="Your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              {step2Error && <p style={{ color: '#c44040', fontSize: 13, margin: '8px 0 0' }}>{step2Error}</p>}
              <div className="cta-row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <button className="btn ghost" onClick={goBack}>Back</button>
                <button
                  className="btn primary"
                  onClick={handleContinueToPayment}
                  disabled={creatingIntent}
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
                <div className="summary-price">$1.99</div>
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

export function Panel({ open, onClose, title, stepLabel, children }) {
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
