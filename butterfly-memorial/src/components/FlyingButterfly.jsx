import React from "react";
import BlueButterflyFlying from "../assets/butterflies/blue/flying.gif";
import OrangeButterflyFlying from "../assets/butterflies/orange/flying.gif";
import GreenButterflyFlying from "../assets/butterflies/green/flying.gif";
import BlueButterflyResting from "../assets/butterflies/blue/resting.gif";
import OrangeButterflyResting from "../assets/butterflies/orange/resting.gif";
import GreenButterflyResting from "../assets/butterflies/green/resting.gif";

const BUTTERFLY_FLYING = [BlueButterflyFlying, OrangeButterflyFlying, GreenButterflyFlying];
const BUTTERFLY_RESTING = [BlueButterflyResting, OrangeButterflyResting, GreenButterflyResting];

function FlyingButterfly({ x = 0, y = 0, size = 0.5, direction = 1, imageIndex = 0, label = "", isLanded = false }) {
  const butterflyImages = isLanded ? BUTTERFLY_RESTING : BUTTERFLY_FLYING;
  const butterflyImage = butterflyImages[imageIndex % butterflyImages.length] || butterflyImages[0];
  const bobbingOffset = isLanded ? 0 : (x + y) * 0.01; // No bobbing when landed

  return (
    <div
      className="flying-butterfly"
      style={{
        position: "absolute",
        left: x,
        top: y + Math.sin(bobbingOffset) * 5,
        transform: `scale(${size}) scaleX(${direction})`,
        pointerEvents: "none",
        zIndex: Math.round(size * 100),
      }}
    >
      <img src={butterflyImage} alt={label} title={label} />
    </div>
  );
}

export default FlyingButterfly;
