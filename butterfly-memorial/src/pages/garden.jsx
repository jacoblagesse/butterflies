import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import AuthPopup from "../components/AuthPopup";
import GardenControls from "../components/GardenControls";
import FlyingButterfly from "../components/FlyingButterfly";
import VideoBackground from "../components/VideoBackground";
import { useButterflyPhysics } from "../hooks/useButterflyPhysics";

import "./spirit-butterfly.css";

import LogoUrl from "../assets/logos/logo.svg";

export default function Garden() {
  const { gardenId } = useParams();
  const stageRef = useRef(null);

  const [garden, setGarden] = useState(null);
  const [honoree, setHonoree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [butterflies, setButterflies] = useState([]);
  const [isAuthOpen, setAuthOpen] = useState(false);

  // Hover card: {visible, name, message, x, y, tailSide}
  const [hoverCard, setHoverCard] = useState({ visible: false, name: "", message: "", x: 0, y: 0, tailSide: "left" });
  const frozenRef = useRef(new Set()); // ids of butterflies frozen on hover

  const butterflyStates = useButterflyPhysics(butterflies, stageRef, frozenRef);

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
      const butterflyList = [];
      querySnapshot.forEach((doc) => {
        butterflyList.push({ id: doc.id, ...doc.data() });
      });
      setButterflies(butterflyList);
    });

    fetchData();

    return unsubscribe;
  }, [gardenId]);


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

  return (
    <div className="page full-page" style={{ position: "relative" }}>
      <VideoBackground backgroundKey={garden.style || "flowers"} />

      <div className="wrap full-wrap" style={{ padding: 0 }}>
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} variant="minimal" />

        <main className="garden-stage">
          <div ref={stageRef} className="garden">
            {butterflyStates.map((s) => (
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
                onHoverStart={(rect) => {
                  frozenRef.current.add(s.id);
                  // parse "Name: message"
                  const txt = s.label || "";
                  const idx = txt.indexOf(":");
                  const name = idx === -1 ? txt.trim() : txt.slice(0, idx).trim();
                  const message = idx === -1 ? "" : txt.slice(idx + 1).trim();

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
                  setHoverCard({ visible: true, name, message, x, y, tailSide });
                }}
                onHoverEnd={() => {
                  frozenRef.current.delete(s.id);
                  setHoverCard((h) => ({ ...h, visible: false }));
                }}
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
                <div className="bf-hover-from">A message from</div>
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
                    lineHeight: 1.6,
                  }}>
                    {honoree.obit}
                  </div>
                )}
              </div>
            )}

            <GardenControls butterflies={butterflies} gardenId={gardenId} />
          </div>
        </main>
      </div>
    </div>
  );
}
