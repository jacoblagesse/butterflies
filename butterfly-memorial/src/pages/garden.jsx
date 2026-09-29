import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import AuthPopup from "../components/AuthPopup";
import GardenControls from "../components/GardenControls";
import GardenSettings from "../components/GardenSettings";
import GardenShare from "../components/GardenShare";
import FlyingButterfly from "../components/FlyingButterfly";
import VideoBackground from "../components/VideoBackground";
import DevRibbon from "../components/DevRibbon";
import { useButterflyPhysics } from "../hooks/useButterflyPhysics";
import { useBackgroundAudio } from "../hooks/useBackgroundAudio";
import { useAuth } from "../contexts/AuthContext";
import { sha256Hex } from "../utils/hash";

import "./spirit-butterfly.css";

import LogoUrl from "../assets/logos/logo.svg";

export default function Garden() {
  const { gardenId } = useParams();
  const stageRef = useRef(null);
  const { user } = useAuth();

  const { muted, toggleMute } = useBackgroundAudio();

  const [garden, setGarden] = useState(null);
  const [honoree, setHonoree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [butterflies, setButterflies] = useState([]);
  const [pendingButterflyId, setPendingButterflyId] = useState(null);
  const [isAuthOpen, setAuthOpen] = useState(false);

  // Simple UI-level gate (not real access control — see functions/index.js's
  // updateGardenInfo comment on passwordHash): once entered correctly for a
  // garden, remembered for the rest of the browser tab session.
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);

  useEffect(() => {
    if (!gardenId) return;
    setUnlocked(sessionStorage.getItem(`garden-unlocked-${gardenId}`) === "1");
  }, [gardenId]);

  // Hover card: {visible, name, message, x, y, tailSide}
  const [hoverCard, setHoverCard] = useState({ visible: false, name: "", message: "", x: 0, y: 0, tailSide: "left", isHonoree: false });
  const frozenRef = useRef(new Set()); // ids of butterflies frozen on hover
  // Which butterfly's card is currently showing. Tracked explicitly (rather
  // than relying solely on mouseenter/mouseleave pairing) because touch
  // devices synthesize a mouseenter on first tap but never fire the
  // matching mouseleave until a *different* element is touched — so without
  // this, tapping the same butterfly again after tapping away (e.g. to open
  // a panel) did nothing until some other butterfly was tapped first.
  const activeButterflyIdRef = useRef(null);

  // Cap the visible scene at 8 butterflies. Pinned ones (white spirit +
  // current viewer's purchases) always count toward the cap; excess
  // unpinned butterflies wait in a pool and rotate in when an active one
  // leaves the screen.
  const butterflyStates = useButterflyPhysics(butterflies, stageRef, frozenRef, 8, pendingButterflyId);
  const visibleStates = pendingButterflyId
    ? butterflyStates.filter((s) => s.id !== pendingButterflyId)
    : butterflyStates;

  // The viewer's just-purchased butterfly is spawned centered (see
  // useButterflyPhysics) and hidden via the filter above while the chrysalis
  // overlay plays. Freeze it in place for that whole span so it's still
  // exactly centered — not partway through a flight path — the moment it's
  // revealed; unfreeze as soon as it's handed back to normal flight.
  const handlePendingChange = (id) => {
    setPendingButterflyId((prev) => {
      if (id) frozenRef.current.add(id);
      else if (prev) frozenRef.current.delete(prev);
      return id;
    });
  };

  useEffect(() => {
    if (!gardenId) return;

    const fetchData = async () => {
      try {
        const gardenDoc = doc(db, "gardens", gardenId);
        const gardenSnap = await getDoc(gardenDoc);

        if (gardenSnap.exists()) {
          const gardenDataLocal = gardenSnap.data();
          setGarden({ id: gardenSnap.id, ...gardenSnap.data() });

          const honoreeSnap = await getDoc(gardenDataLocal.honoree);
          if (honoreeSnap.exists()) {
            setHonoree({ id: honoreeSnap.id, ...honoreeSnap.data() });
          } else {
            setError("Honoree not found");
          }
        } else {
          setError("Garden not found");
        }

        setLoading(false);
      } catch (err) {
        setError("Error loading garden: " + err.message);
        setLoading(false);
      }
    };

    const q = query(collection(db, "butterflies"), where("gardenId", "==", gardenId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const currentUid = user?.uid || null;
      const butterflyList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Pin the white spirit butterfly (always present in a garden) and
        // any butterfly purchased by the CURRENT viewer so they don't have
        // to wonder where their own butterflies are. Other visitors'
        // butterflies behave like the ambient ones — they may drift off
        // and back over time.
        const isMine = currentUid && data.uid === currentUid;
        const isSpirit = data.color === "white";
        butterflyList.push({
          id: doc.id,
          ...data,
          pinned: isMine || isSpirit,
        });
      });
      setButterflies(butterflyList);
    }, (err) => {
      console.error("Butterflies listener error:", err.message);
    });

    fetchData();

    return unsubscribe;
  }, [gardenId, user?.uid]);


  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading garden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!garden) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Garden not found</p>
      </div>
    );
  }

  const isOwner = !!(user && garden.user && garden.user.id === user.uid);
  const isLocked = !!garden.passwordHash && !isOwner && !unlocked;

  const handleUnlock = async (e) => {
    e.preventDefault();
    setCheckingPassword(true);
    setUnlockError("");
    try {
      const hash = await sha256Hex(passwordInput.trim());
      if (hash === garden.passwordHash) {
        sessionStorage.setItem(`garden-unlocked-${gardenId}`, "1");
        setUnlocked(true);
      } else {
        setUnlockError("Incorrect password.");
      }
    } finally {
      setCheckingPassword(false);
    }
  };

  if (isLocked) {
    return (
      <div className="page full-page" style={{ position: "relative" }}>
        <VideoBackground backgroundKey={garden.style || "flowers"} />
        <Header onSignInClick={() => setAuthOpen(true)} variant="minimal" />
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <div style={{
          position: "fixed", inset: 0, display: "grid", placeItems: "center", padding: 16, zIndex: 20,
        }}>
          <form onSubmit={handleUnlock} className="hero-card" style={{ maxWidth: 360, width: "100%", padding: "clamp(24px, 5vw, 36px)", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", margin: "0 0 8px", color: "var(--ink)" }}>
              This garden is password protected
            </h2>
            <p className="sub" style={{ margin: "0 0 18px" }}>Enter the password to view it.</p>
            <input
              className="in"
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            {unlockError && <div style={{ color: "#c44040", fontSize: "0.9rem", marginTop: 10 }}>{unlockError}</div>}
            <button type="submit" className="btn primary" style={{ marginTop: 18, width: "100%" }} disabled={checkingPassword || !passwordInput.trim()}>
              {checkingPassword ? "Checking…" : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Shared by desktop hover and mobile tap (see FlyingButterfly.jsx) so
  // selection is deterministic regardless of which fired: switching to a
  // new butterfly always frees the previous one first.
  const selectButterfly = (s, rect) => {
    const prevId = activeButterflyIdRef.current;
    if (prevId && prevId !== s.id) frozenRef.current.delete(prevId);
    activeButterflyIdRef.current = s.id;
    frozenRef.current.add(s.id);

    const isHonoree = s.color === "white";
    const txt = s.label || "";
    let name, message;
    if (isHonoree) {
      name = txt.trim();
      message = "";
    } else {
      const idx = txt.indexOf(":");
      name = idx === -1 ? txt.trim() : txt.slice(0, idx).trim();
      message = idx === -1 ? "" : txt.slice(idx + 1).trim();
    }

    // Position bubble in the direction the butterfly faces
    // direction: -1 = facing right (vx > 0), 1 = facing left
    const cardW = 240;
    const cardH = message ? 100 : 56;
    const gap = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const facingRight = s.direction === -1;

    // For left-facing butterflies the GIF has leading whitespace on the
    // left edge, so anchor off the element center rather than rect.left
    const cx = rect.left + rect.width / 2;

    let x, tailSide;
    if (facingRight && rect.right + gap + cardW <= vw - 8) {
      x = rect.right + gap;
      tailSide = "left";
    } else if (!facingRight && cx - gap - cardW >= 8) {
      x = cx - gap - cardW;
      tailSide = "right";
    } else if (rect.right + gap + cardW <= vw - 8) {
      x = rect.right + gap;
      tailSide = "left";
    } else {
      x = Math.max(8, cx - gap - cardW);
      tailSide = "right";
    }
    x = Math.max(8, Math.min(x, vw - cardW - 8));
    const y = Math.max(8, Math.min(
      rect.top + rect.height / 2 - cardH / 2,
      vh - cardH - 8
    ));
    setHoverCard({ visible: true, name, message, x, y, tailSide, isHonoree });
  };

  // Only deselects if `id` is still the active one — guards against a
  // stale mouseleave (from the previously-hovered butterfly) firing after
  // a new one has already been selected, which would otherwise wrongly
  // clear the new selection.
  const deselectButterfly = (id) => {
    if (id != null && activeButterflyIdRef.current !== id) return;
    if (activeButterflyIdRef.current) frozenRef.current.delete(activeButterflyIdRef.current);
    activeButterflyIdRef.current = null;
    setHoverCard((h) => ({ ...h, visible: false }));
  };

  return (
    <div className="page full-page" style={{ position: "relative" }}>
      <VideoBackground backgroundKey={garden.style || "flowers"} />
      <DevRibbon />

      <div className="wrap full-wrap" style={{ padding: 0 }}>
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} variant="minimal" />
        <GardenSettings
          garden={garden}
          honoree={honoree}
          gardenId={gardenId}
          isOwner={isOwner}
          onSaved={({ garden: g, honoree: h }) => {
            setGarden(g);
            setHonoree(h);
          }}
        />

        <main className="garden-stage">
          <div
            ref={stageRef}
            className="garden"
            onClick={(e) => {
              // Tapping empty space dismisses the active card — the only way
              // to close it on mobile without needing to tap another butterfly.
              if (e.target === e.currentTarget) deselectButterfly();
            }}
          >
            {visibleStates.map((s) => (
              <FlyingButterfly
                key={s.id}
                x={s.x}
                y={s.y}
                size={s.size}
                direction={s.direction}
                imageIndex={s.imageIndex}
                label={s.label}
                isLanded={s.isLanded}
                color={s.color || null}
                onHoverStart={(rect) => selectButterfly(s, rect)}
                onHoverEnd={() => deselectButterfly(s.id)}
                onSelect={(rect) => selectButterfly(s, rect)}
              />
            ))}

            {/* Speech bubble anchored to the butterfly */}
            {hoverCard.visible && (
              <div
                className={`bf-hover-card tail-${hoverCard.tailSide}`}
                style={{
                  position: "fixed",
                  left: hoverCard.x,
                  top: hoverCard.y,
                  zIndex: 200,
                }}
              >
                {!hoverCard.isHonoree && <div className="bf-hover-from">A message from</div>}
                <div className="bf-hover-name">{hoverCard.name}</div>
                {hoverCard.message && (
                  <>
                    <hr className="bf-hover-divider" />
                    <div className="bf-hover-message">{hoverCard.message}</div>
                  </>
                )}
              </div>
            )}

            {/* Top-left honoree info */}
            {honoree && (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 19,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(circle 620px at top left, rgba(18,12,28,0.55) 0%, rgba(18,12,28,0.28) 40%, transparent 100%)",
                  }}
                />
              <div
                style={{
                  position: "fixed",
                  top: 80,
                  left: 24,
                  zIndex: 20,
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.95rem, 4.5vw, 2.85rem)",
                  color: "#fff",
                  textShadow: "0 1px 6px rgba(0,0,0,0.7), 0 3px 20px rgba(0,0,0,0.5)",
                  lineHeight: 1.2,
                }}>
                  {honoree.first_name} {honoree.last_name}
                </div>
                {honoree.dates && (
                  <div style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(1.2rem, 2.25vw, 1.5rem)",
                    color: "rgba(255,255,255,0.88)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  }}>
                    {honoree.dates}
                  </div>
                )}
                {honoree.obit && (
                  <div style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "clamp(1.1rem, 1.95vw, 1.35rem)",
                    color: "rgba(255,255,255,0.75)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                    maxWidth: 280,
                    lineHeight: 1.3,
                  }}>
                    {honoree.obit}
                  </div>
                )}
              </div>
              </>
            )}

            <GardenControls butterflies={butterflies} gardenId={gardenId} muted={muted} onVolumeToggle={toggleMute} onPendingChange={handlePendingChange} isOwner={isOwner} />
            <GardenShare honoreeName={honoree ? `${honoree.first_name} ${honoree.last_name}`.trim() : ''} />
          </div>
        </main>
      </div>
    </div>
  );
}
