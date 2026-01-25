import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import AuthPopup from "../components/AuthPopup";
import GardenControls from "../components/GardenControls";
import FlyingButterfly from "../components/FlyingButterfly";
import { useButterflyPhysics } from "../hooks/useButterflyPhysics";
import FlowersBackground from "../assets/backgrounds/background__homepage.png";
import MountainBackground from "../assets/backgrounds/background_mountain__HD.gif";
import TropicalBackground from "../assets/backgrounds/background_tropical__HD.gif";
import LakeBackground from "../assets/backgrounds/background_lake__HD.gif";

import "./spirit-butterfly.css";

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
  const [isAuthOpen, setAuthOpen] = useState(false);

  const butterflyStates = useButterflyPhysics(butterflies, stageRef);

  // Hover card: {visible, name, message, x, y}
  const [hoverCard, setHoverCard] = useState({ visible: false, name: "", message: "", x: 0, y: 0 });
  const frozenRef = useRef(new Set()); // ids of butterflies frozen on hover

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
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [hoverCard.visible, stageRef.current]);

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

  const backgroundImage = BACKGROUNDS[garden.style] || BACKGROUNDS.flowers;

  return (
    <div
      className="page full-page"
      style={{
        position: "relative",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
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
                onHoverStart={() => {
                  frozenRef.current.add(s.id);
                  // parse "Name: message"
                  const txt = s.label || "";
                  const idx = txt.indexOf(":");
                  const name = idx === -1 ? txt.trim() : txt.slice(0, idx).trim();
                  const message = idx === -1 ? "" : txt.slice(idx + 1).trim();
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
                  position: "fixed",
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
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -20,
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "#fff",
                  textShadow: "0 2px 6px rgba(0,0,0,0.35)",
                  height: 200,
                  minWidth: 600,
                  backgroundImage: `url(${GardenSign})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundSize: "contain",
                  padding: "24px 32px",
                }}
              >
                <div className="identity-name" style={{ marginBottom: 4, marginTop: 50, fontSize: 30 }}>
                  {honoree ? `${honoree.first_name} ${honoree.last_name}` : ""}
                </div>
                <div className="sub" style={{ marginBottom: 6 }}>
                  {honoree ? honoree.dates || "—" : ""}
                </div>
                <div className="sub">{honoree ? honoree.obit || "" : ""}</div>
              </div>
            </div>

            <GardenControls butterflies={butterflies} gardenId={gardenId} />
          </div>
        </main>
      </div>
    </div>
  );
}
