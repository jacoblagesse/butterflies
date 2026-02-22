import React, { useState, useRef } from "react";
import Header from "./Header";
import AuthPopup from "./AuthPopup";
import FlyingButterfly from "./FlyingButterfly";
import { useButterflyPhysics } from "../hooks/useButterflyPhysics";
import DaisiesBackground from "../assets/backgrounds/daisies.png";
import "../pages/spirit-butterfly.css";

const AMBIENT_BUTTERFLIES = [
  { id: "amb-1", gifter: "", message: "", color: "blue" },
  { id: "amb-2", gifter: "", message: "", color: "pink" },
  { id: "amb-3", gifter: "", message: "", color: "purple" },
  { id: "amb-4", gifter: "", message: "", color: "orange" },
  { id: "amb-5", gifter: "", message: "", color: "green" },
  { id: "amb-6", gifter: "", message: "", color: "yellow" },
];

export default function PageLayout({ children, centered = false }) {
  const [isAuthOpen, setAuthOpen] = useState(false);
  const stageRef = useRef(null);
  const butterflyStates = useButterflyPhysics(AMBIENT_BUTTERFLIES, stageRef);

  return (
    <div
      className="page"
      style={{
        backgroundImage: `url(${DaisiesBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      {/* Ambient butterfly layer */}
      <div
        ref={stageRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {butterflyStates.map((s) => (
          <FlyingButterfly
            key={s.id}
            x={s.x}
            y={s.y}
            size={s.size}
            direction={s.direction}
            imageIndex={s.imageIndex}
            label=""
            isLanded={s.isLanded}
            color={s.color || null}
          />
        ))}
      </div>

      {/* Header - full width */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", padding: "28px 24px 0", boxSizing: "border-box" }}>
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} />
      </div>

      {/* Content area */}
      <div
        className="wrap"
        style={{
          position: "relative",
          zIndex: 1,
          paddingTop: 0,
          boxSizing: "border-box",
          ...(centered && {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }),
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <footer className="page-footer" style={{ position: "relative", zIndex: 1 }}>
        &copy; {new Date().getFullYear()} Butterfly Memorial
      </footer>
    </div>
  );
}
