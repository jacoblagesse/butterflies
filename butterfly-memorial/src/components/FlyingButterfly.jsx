import React, { useState } from "react";
import BlueButterflyFlying from "../assets/butterflies/blue/flying.gif";
import OrangeButterflyFlying from "../assets/butterflies/orange/flying.gif";
import GreenButterflyFlying from "../assets/butterflies/green/flying.gif";
import BlueButterflyResting from "../assets/butterflies/blue/resting.gif";
import OrangeButterflyResting from "../assets/butterflies/orange/resting.gif";
import GreenButterflyResting from "../assets/butterflies/green/resting.gif";

const BUTTERFLY_FLYING = [BlueButterflyFlying, OrangeButterflyFlying, GreenButterflyFlying];
const BUTTERFLY_RESTING = [BlueButterflyResting, OrangeButterflyResting, GreenButterflyResting];

export default function FlyingButterfly({
  x = 0, y = 0, size = 0.5, direction = 1, imageIndex = 0, label = "",
  isLanded = false, color, onHoverStart, onHoverEnd
}) {
  const [hovered, setHovered] = useState(false);

  // show resting only when landed; keep flying gif on hover
  const useResting = isLanded;
  const butterflyImages = useResting ? BUTTERFLY_RESTING : BUTTERFLY_FLYING;

  // resolve by color (flying by default; resting when landed)
  let src = null;
  if (color) {
    try {
      const mapFlying = import.meta.glob('/src/assets/butterflies/*/flying.*', { eager: true });
      const mapResting = import.meta.glob('/src/assets/butterflies/*/resting.*', { eager: true });
      const key = Object.keys(useResting ? mapResting : mapFlying).find((p) => p.includes(`/butterflies/${color}/`));
      if (key) {
        const mod = (useResting ? mapResting : mapFlying)[key];
        src = mod.default ?? mod;
      }
    } catch {
      // ignore and fallback below
    }
  }

  const butterflyImage = src || butterflyImages[imageIndex % butterflyImages.length] || butterflyImages[0];
  // stop local bobbing when hovered to visually freeze position; gif keeps playing
  const bobbingOffset = (useResting || hovered) ? 0 : (x + y) * 0.01;

  return (
    <div
      className={`flying-butterfly${hovered ? " hovered" : ""}`}
      style={{
        position: "absolute",
        left: x,
        top: y + (bobbingOffset ? Math.sin(bobbingOffset) * 5 : 0),
        transform: `scale(${size}) scaleX(${direction})`,
        pointerEvents: "auto", // enable hover
        zIndex: Math.round(size * 100),
      }}
      onMouseEnter={() => { setHovered(true); onHoverStart && onHoverStart(); }}
      onMouseLeave={() => { setHovered(false); onHoverEnd && onHoverEnd(); }}
    >
      <img src={butterflyImage} alt={label} title={label} />
    </div>
  );
}
