import React from 'react';
import BlueButterflyFlying from '../assets/butterflies/blue/flying.gif';
import OrangeButterflyFlying from '../assets/butterflies/orange/flying.gif';
import GreenButterflyFlying from '../assets/butterflies/green/flying.gif';

const BUTTERFLY_COLORS = [BlueButterflyFlying, OrangeButterflyFlying, GreenButterflyFlying];

function FlyingButterfly({ x = 0, y = 0, size = 0.5, direction = 1, imageIndex = 0, label = '' }) {
  const butterflyImage = BUTTERFLY_COLORS[imageIndex % BUTTERFLY_COLORS.length] || BUTTERFLY_COLORS[0];
  const bobbingOffset = (x + y) * 0.01; // visual variety without per-frame state

  return (
    <div
      className="flying-butterfly"
      style={{
        position: 'absolute',
        left: x,
        top: y + Math.sin(bobbingOffset) * 5,
        transform: `scale(${size}) scaleX(${direction})`,
        pointerEvents: 'none',
        zIndex: Math.round(size * 100),
      }}
    >
      <img src={butterflyImage} alt={label} title={label} />
    </div>
  );
}

export default FlyingButterfly;