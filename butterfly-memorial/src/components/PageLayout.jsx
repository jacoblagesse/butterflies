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

export default function PageLayout({ children, centered = false, snap = false }) {
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
        backgroundAttachment: "fixed",
        position: "relative",
        ...(snap && {
          height: "100vh",
          overflowY: "scroll",
          scrollSnapType: "y proximity",
          scrollPaddingTop: "80px",
        }),
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

      {/* Dark overlay for readability in snap mode */}
      {snap && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(18, 12, 28, 0.38)",
          zIndex: 0,
          pointerEvents: "none",
        }} />
      )}

      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "12px 16px",
          boxSizing: "border-box",
        }}
      >
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} />
      </div>

      {/* Content area */}
      <div
        className={snap ? undefined : "wrap"}
        style={{
          position: "relative",
          zIndex: 1,
          paddingTop: 0,
          boxSizing: "border-box",
          width: "100%",
          ...(!snap && centered && {
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

      {!snap && (
        <footer className="page-footer" style={{ position: "relative", zIndex: 1 }}>
          &copy; {new Date().getFullYear()} Butterfly Memorial
        </footer>
      )}
    </div>
  );
}
