import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc } from 'firebase/firestore';
import { db } from '../firebase';
import hatchGif from '../assets/misc/hatch.gif';
import ButterflyIcon from '../assets/logos/butterfly.png';

export default function GardenControls({ butterflies, onAdd, gardenId, releaseDisabledPredicate }) {
  const [open, setOpen] = useState(null); // 'list' | 'buy' | null
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [qty, setQty] = useState('1');

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

  // Centralized disabled logic
  const isReleaseDisabled =
    typeof releaseDisabledPredicate === 'function'
      ? releaseDisabledPredicate(name, msg)
      : !(name && name.trim()) || !(msg && msg.trim());

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
            // Apply gradient matching the logo SVG colors
            backgroundImage: 'linear-gradient(135deg, #6ec3ff 0%, #6c62ff 100%)',
            color: '#fff',
            border: 'none',
            animation: 'pulseShadow 2s ease-in-out infinite',
            transition: 'transform 100ms ease',
          }}
          onClick={() => setOpen('buy')}
        >
          <img
            src={ButterflyIcon}
            alt="Buy & Release"
            style={{ height: '6rem', width: 'auto', display: 'inline-block', filter: 'brightness(0) invert(1)', padding: '20px'}}
          />
        </button>
      </div>

      <Panel open={open === 'list'} onClose={() => setOpen(null)} title="Butterflies in this garden">
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

      <Panel open={open === 'buy'} onClose={() => setOpen(null)} title="Pick a butterfly!">
        <div style={{ display: 'grid', gap: 12 }}>
          {/* Dynamic swipeable square list of butterfly colors */}
          <div
            className="shop-swipe-container"
            role="list"
            aria-label="Butterfly selections"
            ref={(el) => {
              if (!el) return;
              if (el._dragBound) return;
              el._dragBound = true;

              let isDown = false;
              let startX = 0;
              let startScroll = 0;
              let moved = 0;

              const onPointerDown = (e) => {
                if (e.button !== 0) return; // left click only
                isDown = true;
                startX = e.clientX;
                startScroll = el.scrollLeft;
                moved = 0;
              };
              const onPointerMove = (e) => {
                if (!isDown) return;
                const dx = e.clientX - startX;
                moved = Math.max(moved, Math.abs(dx));
                el.scrollLeft = startScroll - dx;
                // prevent text selection while dragging
                e.preventDefault();
              };
              const end = () => {
                isDown = false;
              };

              el.addEventListener('pointerdown', onPointerDown);
              el.addEventListener('pointermove', onPointerMove);
              el.addEventListener('pointerup', end);
              el.addEventListener('pointercancel', end);
            }}
          >
            {colors.map((label) => {
              const a = assets[label] || {};
              const isSelected = selectedColor === label;
              const src = isSelected ? a.flying || a.resting : a.resting || a.flying;
              return (
                <button
                  type="button"
                  className={`shop-swipe-item${isSelected ? ' selected' : ''}`}
                  role="listitem"
                  key={label}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedColor(isSelected ? null : label)}
                  style={{ cursor: 'pointer' }}
                >
                  {src && <img className="shop-swipe-img" src={src} alt={`${label} butterfly`} />}
                  <span className="shop-swipe-label">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary header under the butterfly window */}
          <div className="sub" style={{ fontWeight: 700 }}>
            Leave a note for it to carry:
          </div>

          <input className="in" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="in" placeholder="A short message..." value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="cta-row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              className="btn primary"
              onClick={release}
              disabled={isReleaseDisabled}
              aria-disabled={isReleaseDisabled}
              title={isReleaseDisabled ? 'Select a butterfly first' : undefined}
            >
              $0.99 - Release
            </button>
          </div>
        </div>
      </Panel>
    </>
  );
}

function Panel({ open, onClose, title, children }) {
  // Hide completely when not open to avoid dark overlay affecting the scene
  if (!open) return null;

  return (
    <div
      className="panel-root open"
      aria-hidden={!open}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001, // above butterflies and controls
        pointerEvents: 'auto',
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
          margin: '10vh auto',
          maxWidth: 680,
          zIndex: 1002,
        }}
      >
        <div className="panel-head">
          <h3 className="h3" style={{ margin: 0, fontSize: '1.5em' }}>
            {title}
          </h3>
          <button className="btn ghost" onClick={onClose}>
          Close
          </button>
        </div>
        <div className="panel-content open">{children}</div>
      </div>
    </div>
  );
}