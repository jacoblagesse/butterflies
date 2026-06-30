import { useState, useRef } from "react";
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
  { id: "amb-7", gifter: "", message: "", color: "white" },
];

export default function PageLayout({ children, centered = false, snap = false }) {
  const [isAuthOpen, setAuthOpen] = useState(false);
  const stageRef = useRef(null);
  const butterflyStates = useButterflyPhysics(AMBIENT_BUTTERFLIES, stageRef);

  // Children may be a function so the page body can request the auth popup
  // be opened (e.g. a "Sign In" button inside the content).
  const openSignIn = () => setAuthOpen(true);
  const renderedChildren =
    typeof children === "function" ? children({ openSignIn }) : children;

  return (
    <div
      className={`page${snap ? " page-snap" : ""}`}
      style={{
        backgroundImage: `url(${DaisiesBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
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

      {/* Header */}
      <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
      <Header onSignInClick={openSignIn} />

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
        {renderedChildren}
      </div>

      <footer className="page-footer" style={{ position: "relative", zIndex: 1 }}>
        Copyright LavidaCo 2026
      </footer>
    </div>
  );
}
