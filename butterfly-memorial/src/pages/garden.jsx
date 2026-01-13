import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import GardenControls from '../components/GardenControls';
import FlyingButterfly from '../components/FlyingButterfly';
import FlowersBackground from '../assets/backgrounds/background__homepage.png';
import MountainBackground from '../assets/backgrounds/background_mountain__HD.gif';
import TropicalBackground from '../assets/backgrounds/background_tropical__HD.gif';
import LakeBackground from '../assets/backgrounds/background_lake__HD.gif';

import './spirit-butterfly.css';

import LogoUrl from "../assets/logos/logo.svg";
import GardenSign from "../assets/backgrounds/garden_sign.png"; // add sign background

const BACKGROUNDS = {
  flowers: FlowersBackground,
  mountain: MountainBackground,
  tropical: TropicalBackground,
  lake: LakeBackground,
};

export default function Garden() {
  const { gardenId } = useParams();
  const stageRef = useRef(null);

  const [garden, setGarden] = useState(null);
  const [honoree, setHonoree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [butterflies, setButterflies] = useState([]);

  const sessionSalt = useRef(Math.floor(Math.random() * 1e9)); // varies each page load
  const butterfliesStateRef = useRef([]); // mutable ref holding runtime state for each butterfly
  const frozenRef = useRef(new Set()); // ids of butterflies frozen on hover
  const [, setTick] = useState(0); // used to trigger infrequent re-renders

  // Hover card: {visible, name, message, x, y}
  const [hoverCard, setHoverCard] = useState({ visible: false, name: '', message: '', x: 0, y: 0 });

  useEffect(() => {
    if (!gardenId) return;

    const fetchData = async () => {
      try {
        const gardenDoc = doc(db, 'gardens', gardenId);
        const gardenSnap = await getDoc(gardenDoc);

        if (gardenSnap.exists()) {
          const gardenDataLocal = gardenSnap.data();
          setGarden({ id: gardenSnap.id, ...gardenSnap.data() });

          const honoreeSnap = await getDoc(gardenDataLocal.honoree);
          if (honoreeSnap.exists()) {
            setHonoree({ id: honoreeSnap.id, ...honoreeSnap.data() });
          } else {
            setError('Honoree not found');
          }
        } else {
          setError('Garden not found');
        }

        setLoading(false);
      } catch (err) {
        setError('Error loading garden: ' + err.message);
        setLoading(false);
      }
    };

    const q = query(collection(db, 'butterflies'), where('gardenId', '==', gardenId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const butterflyList = [];
      querySnapshot.forEach((doc) => {
        butterflyList.push({ id: doc.id, ...doc.data() });
      });
      setButterflies(butterflyList);
    });

    fetchData();

    return unsubscribe;
  }, [gardenId]);

  // Initialize per-butterfly runtime state whenever butterflies list changes
  useEffect(() => {
    const container = stageRef.current;
    const width = container ? container.offsetWidth : 800;
    const height = container ? container.offsetHeight : 600;

    // simple PRNG factory (LCG)
    const makePRNG = (seed) => {
      let s = seed >>> 0;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    };

    butterfliesStateRef.current = butterflies.map((b, i) => {
      const idSeed = hashSeed(b.id || i) + sessionSalt.current;
      const prng = makePRNG(idSeed);
      const x = prng() * width;
      const y = prng() * height;
      const size = 0.2 + prng() * 0.3;
      const personality = {
        speed: prng() * 1.5 + 0.5,
        wanderlust: prng() * 100 + 50,
        patience: prng() * 3000 + 1000,
        restlessness: prng(),
        prng,
      };
      const targetAngle = prng() * Math.PI * 2;
      const targetDistance = prng() * personality.wanderlust;
      const tx = Math.max(0, Math.min(width, x + Math.cos(targetAngle) * targetDistance));
      const ty = Math.max(0, Math.min(height, y + Math.sin(targetAngle) * targetDistance));
      return {
        id: b.id || i,
        label: `${b.gifter || b.from || 'Someone'}: ${b.message || ''}`,
        x,
        y,
        velocity: { x: 0, y: 0 },
        target: { x: tx, y: ty },
        size,
        direction: tx >= x ? 1 : -1,
        lastTargetChange: Date.now(),
        personality,
        width,
        height,
        raw: b, // contains b.color if present
      };
    });

    // force a render once after initialization
    setTick((t) => t + 1);
  }, [butterflies, stageRef.current]);

  // Single animation loop for all butterflies (physics + AI)
  useEffect(() => {
    let rafId = null;
    let lastTime = performance.now();
    let lastRenderTick = performance.now();

    const step = (now) => {
      const dt = Math.min(100, now - lastTime);
      lastTime = now;

      const list = butterfliesStateRef.current;
      if (list.length > 0) {
        for (let i = 0; i < list.length; i++) {
          const b = list[i];
          // skip movement when hovered/frozen
          if (frozenRef.current.has(b.id)) continue;
          const p = b.personality;
          const prng = p.prng;
          const dx = b.target.x - b.x;
          const dy = b.target.y - b.y;
          const dist = Math.hypot(dx, dy);

          // Occasionally pick a new target
          if (dist < 5 || prng() < p.restlessness * 0.01) {
            const angle = prng() * Math.PI * 2;
            const distance = prng() * p.wanderlust;
            let nx = b.x + Math.cos(angle) * distance;
            let ny = b.y + Math.sin(angle) * distance;
            nx = Math.max(0, Math.min(nx, b.width));
            ny = Math.max(0, Math.min(ny, b.height));
            b.target.x = nx;
            b.target.y = ny;
            b.lastTargetChange = Date.now();
            b.direction = nx >= b.x ? 1 : -1;
          }

          const ndx = dist > 0 ? dx / dist : 0;
          const ndy = dist > 0 ? dy / dist : 0;

          // velocity smoothing and movement
          b.velocity.x = b.velocity.x * 0.95 + ndx * p.speed * (dt / 50);
          b.velocity.y = b.velocity.y * 0.95 + ndy * p.speed * (dt / 50);

          b.x += b.velocity.x;
          b.y += b.velocity.y;

          // clamp in bounds
          b.x = Math.max(0, Math.min(b.x, b.width));
          b.y = Math.max(0, Math.min(b.y, b.height));
        }
      }

      // throttle React updates to ~10Hz to avoid too many renders while keeping visuals smooth
      if (now - lastRenderTick > 100) {
        lastRenderTick = now;
        setTick((t) => t + 1);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Update mouse position to move hover card within viewport
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (!hoverCard.visible) return;
      const pad = 12; // padding from edges
      const cardW = 320; // estimated card width for clamping
      const cardH = 140; // estimated card height for clamping
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mx = e.clientX;
      const my = e.clientY;
      const clampedX = Math.max(pad, Math.min(mx, vw - pad - cardW));
      const clampedY = Math.max(pad, Math.min(my + 18, vh - pad - cardH));
      setHoverCard((h) => ({ ...h, x: clampedX, y: clampedY }));
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [hoverCard.visible, stageRef.current]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading garden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!garden) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Garden not found</p>
      </div>
    );
  }

  const backgroundImage = BACKGROUNDS[garden.style] || BACKGROUNDS.flowers;

  return (
    <div
      className="page full-page"
      style={{
        position: 'relative',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="wrap full-wrap" style={{ padding: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            className="brand"
          >
            <img src={LogoUrl} alt="Butterfly Memorial logo" className="logo" />
          </Link>
        </div>

        <main className="garden-stage">
          <div ref={stageRef} className="garden">
            {butterfliesStateRef.current.map((s) => (
              <FlyingButterfly
                key={s.id}
                x={s.x}
                y={s.y}
                size={s.size}
                direction={s.direction}
                label={s.label}
                color={s.raw.color || null} // pass stored color
                onHoverStart={() => {
                  frozenRef.current.add(s.id);
                  // parse "Name: message"
                  const txt = s.label || '';
                  const idx = txt.indexOf(':');
                  const name = idx === -1 ? txt.trim() : txt.slice(0, idx).trim();
                  const message = idx === -1 ? '' : txt.slice(idx + 1).trim();
                  setHoverCard({ visible: true, name, message, x: s.x, y: s.y });
                }}
                onHoverEnd={() => {
                  frozenRef.current.delete(s.id);
                  setHoverCard((h) => ({ ...h, visible: false }));
                }}
              />
            ))}

            {/* Hover card that follows mouse and clamps to viewport */}
            {hoverCard.visible && (
              <div
                className="bf-hover-card"
                style={{
                  position: 'fixed',
                  left: hoverCard.x,
                  top: hoverCard.y,
                  zIndex: 200,
                }}
              >
                <div className="bf-hover-name">{hoverCard.name}</div>
                {hoverCard.message && <div className="bf-hover-message">{hoverCard.message}</div>}
              </div>
            )}

            {/* Bottom-center honoree info with sign background */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -20,
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  color: '#fff',
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                  height: 200,
                  minWidth: 600,
                  backgroundImage: `url(${GardenSign})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  padding: '24px 32px',
                }}
              >
                <div className="identity-name" style={{ marginBottom: 4, marginTop: 50, fontSize: 30 }}>
                  {honoree ? `${honoree.first_name} ${honoree.last_name}` : ''}
                </div>
                <div className="sub" style={{ marginBottom: 6 }}>
                  {honoree ? honoree.dates || '—' : ''}
                </div>
                <div className="sub">
                  {honoree ? (honoree.obit || '') : ''}
                </div>
              </div>
            </div>

            <GardenControls butterflies={butterflies} gardenId={gardenId} />
          </div>
        </main>
      </div>
    </div>
  );
}

function hashSeed(id) {
  // Deterministic string -> number hash (FNV-1a-like), returns 1..100000
  const s = String(id);
  let h = 2166136261;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return (h % 100000) + 1;
}
