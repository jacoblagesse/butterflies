import { useEffect, useRef, useState } from "react";

export function useButterflyPhysics(butterflies, containerRef) {
  const butterfliesStateRef = useRef([]);
  const [, setTick] = useState(0);

  // Initialize butterfly states
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    butterfliesStateRef.current = butterflies.map((b, i) => {
      const startFromLeft = Math.random() > 0.5;
      let x, y, heading;

      if (startFromLeft) {
        x = -(100 + Math.random() * 200);
        y = Math.random() * height;
        heading = (Math.random() - 0.5) * 0.6; // roughly rightward
      } else {
        x = width + (100 + Math.random() * 200);
        y = Math.random() * height;
        heading = Math.PI + (Math.random() - 0.5) * 0.6; // roughly leftward
      }

      const speed = 0.8 + Math.random() * 0.8; // base speed
      const imageIndex = Math.floor(Math.random() * 3);

      return {
        id: b.id || i,
        label: `${b.gifter || b.from || "Someone"}: ${b.message || ""}`,
        x,
        y,
        // Heading-based movement for smooth curves
        heading,
        speed,
        baseSpeed: speed,
        turnRate: 0, // current angular velocity
        // Derived for rendering
        vx: Math.cos(heading) * speed,
        vy: Math.sin(heading) * speed,
        size: calculateSize(y, height),
        imageIndex,
        direction: Math.cos(heading) > 0 ? -1 : 1,
        // Landing state
        isLanded: false,
        isLanding: false,
        isTakingOff: false,
        landUntil: 0,
        targetLandY: 0,
        takeoffStartY: 0,
        takeoffProgress: 0,
        landingProgress: 0,
        // Respawn
        isWaiting: false,
        nextSpawnTime: 0,
        // Organic motion
        bobbingPhase: Math.random() * Math.PI * 2,
        bobbingPhase2: Math.random() * Math.PI * 2,
        bobbingSpeed: 0.04 + Math.random() * 0.02,
        // Wandering — slow random steering
        wanderAngle: 0,
        wanderSpeed: 0.3 + Math.random() * 0.4, // how fast wander target drifts
        // Flutter bursts
        nextFlutterTime: Date.now() + 2000 + Math.random() * 8000,
        flutterUntil: 0,
        // Container
        width,
        height,
        color: b.color || null,
        raw: b,
      };
    });

    setTick((t) => t + 1);
  }, [butterflies, containerRef.current]);

  // Animation loop
  useEffect(() => {
    let rafId = null;
    let lastTime = performance.now();
    let lastRenderTick = performance.now();

    const step = (now) => {
      const dt = Math.min(100, now - lastTime);
      lastTime = now;

      const list = butterfliesStateRef.current;
      for (let i = 0; i < list.length; i++) {
        updateButterflyPosition(list[i], dt);
      }

      // Render at ~30Hz for smoother motion
      if (now - lastRenderTick > 33) {
        lastRenderTick = now;
        setTick((t) => t + 1);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return butterfliesStateRef.current;
}

function updateButterflyPosition(b, dt) {
  const now = Date.now();
  const f = dt / 16; // frame factor (1.0 at 60fps)

  // --- TAKING OFF ---
  if (b.isTakingOff) {
    b.takeoffProgress += 0.02 * f;
    const ease = easeOutCubic(Math.min(1, b.takeoffProgress));

    b.x += b.vx * f * (0.3 + ease * 0.7);
    b.y -= (1.5 + ease * 1.5) * f;

    if (b.takeoffProgress >= 1) {
      b.isTakingOff = false;
      b.takeoffProgress = 0;
    }
    return;
  }

  // --- CHECK TAKE OFF ---
  if (b.isLanded && now >= b.landUntil) {
    b.isLanded = false;
    b.isTakingOff = true;
    b.takeoffStartY = b.y;
    b.takeoffProgress = 0;
    // Pick a new random heading away from ground
    b.heading = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    b.speed = b.baseSpeed;
    b.vx = Math.cos(b.heading) * b.speed;
    b.vy = Math.sin(b.heading) * b.speed;
    b.direction = b.vx > 0 ? -1 : 1;
    return;
  }

  // --- LANDED ---
  if (b.isLanded) {
    return;
  }

  // --- LANDING ---
  if (b.isLanding) {
    b.landingProgress += 0.015 * f;
    const ease = easeInOutCubic(Math.min(1, b.landingProgress));

    // Slow horizontal, smooth vertical descent
    b.x += b.vx * f * (1 - ease * 0.9);
    b.y += (1.0 + ease * 1.5) * f;

    if (b.y >= b.targetLandY || b.landingProgress >= 1) {
      b.y = b.targetLandY;
      b.isLanding = false;
      b.isLanded = true;
      b.landingProgress = 0;
      b.landUntil = now + 5000 + Math.random() * 25000;
    }
    return;
  }

  // --- WAITING TO RESPAWN ---
  if (b.isWaiting) {
    if (now >= b.nextSpawnTime) {
      const startFromLeft = Math.random() > 0.5;
      if (startFromLeft) {
        b.x = -(100 + Math.random() * 200);
        b.y = Math.random() * b.height;
        b.heading = (Math.random() - 0.5) * 0.6;
      } else {
        b.x = b.width + (100 + Math.random() * 200);
        b.y = Math.random() * b.height;
        b.heading = Math.PI + (Math.random() - 0.5) * 0.6;
      }
      b.speed = b.baseSpeed;
      b.vx = Math.cos(b.heading) * b.speed;
      b.vy = Math.sin(b.heading) * b.speed;
      b.direction = b.vx > 0 ? -1 : 1;
      b.isWaiting = false;
    }
    return;
  }

  // --- NORMAL FLIGHT ---

  // Wandering: gently steer using a drifting target angle
  b.wanderAngle += (Math.random() - 0.5) * b.wanderSpeed * f;
  b.wanderAngle *= 0.98; // dampen so it doesn't spiral

  // Apply wander as gradual turn
  b.turnRate += b.wanderAngle * 0.002 * f;
  b.turnRate *= 0.92; // friction on turning
  b.heading += b.turnRate * f;

  // Soft boundary steering — gently turn away from edges
  const edgeMargin = 120;
  let steerX = 0;
  let steerY = 0;

  if (b.x < edgeMargin) steerX = (edgeMargin - b.x) / edgeMargin;
  else if (b.x > b.width - edgeMargin) steerX = -(b.x - (b.width - edgeMargin)) / edgeMargin;

  if (b.y < edgeMargin) steerY = (edgeMargin - b.y) / edgeMargin;
  else if (b.y > b.height - 400) steerY = -(b.y - (b.height - 400)) / (edgeMargin);

  // Convert edge avoidance to heading adjustment
  const desiredAngle = Math.atan2(steerY, steerX);
  const edgeStrength = Math.min(1, Math.sqrt(steerX * steerX + steerY * steerY));
  if (edgeStrength > 0.05) {
    let angleDiff = desiredAngle - b.heading;
    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    b.heading += angleDiff * edgeStrength * 0.03 * f;
  }

  // Flutter bursts — brief speed increases
  if (now >= b.nextFlutterTime && now > b.flutterUntil) {
    b.flutterUntil = now + 300 + Math.random() * 600;
    b.nextFlutterTime = now + 3000 + Math.random() * 10000;
  }

  const isFluttering = now < b.flutterUntil;
  const speedMult = isFluttering ? 1.6 + Math.random() * 0.4 : 1.0;
  b.speed = b.baseSpeed * speedMult;

  // Compute velocity from heading
  b.vx = Math.cos(b.heading) * b.speed;
  b.vy = Math.sin(b.heading) * b.speed;

  // Update position
  b.x += b.vx * f;
  b.y += b.vy * f;

  // Multi-layered bobbing for organic vertical motion
  b.bobbingPhase += b.bobbingSpeed * f;
  b.bobbingPhase2 += b.bobbingSpeed * 0.6 * f;
  const bob = Math.sin(b.bobbingPhase) * 1.8 + Math.sin(b.bobbingPhase2 * 1.7) * 1.0;
  b.y += bob * f * 0.3;

  // Update direction for sprite flipping
  if (Math.abs(b.vx) > 0.2) {
    b.direction = b.vx > 0 ? -1 : 1;
  }

  // Bottom boundary
  const maxY = b.height - 400;
  if (b.y > maxY) {
    b.y = maxY;
    if (b.vy > 0) b.vy = -Math.abs(b.vy) * 0.5;
    b.heading = -Math.abs(b.heading); // steer upward
  }

  // Top boundary
  if (b.y < 0) {
    b.y = 0;
    if (b.vy < 0) b.vy = Math.abs(b.vy) * 0.5;
    b.heading = Math.abs(b.heading);
  }

  // Depth-based size
  b.size = calculateSize(b.y, b.height);

  // Random landing chance in lower half
  const bottomThreshold = b.height * 0.5;
  if (!b.isLanded && !b.isLanding && b.y > bottomThreshold && Math.random() < 0.002) {
    b.isLanding = true;
    b.landingProgress = 0;
    b.targetLandY = b.y + 60 + Math.random() * 40;
    return;
  }

  // Off-screen → respawn
  const margin = 250;
  const isOffScreen = b.x < -margin || b.x > b.width + margin || b.y < -margin || b.y > b.height + margin;
  if (isOffScreen && !b.isWaiting) {
    b.nextSpawnTime = now + Math.random() * 20000;
    b.isWaiting = true;
    b.isLanded = false;
    b.x = -10000;
    b.y = -10000;
  }
}

function calculateSize(y, height) {
  const normalizedY = Math.max(0, Math.min(1, y / height));
  const minSize = 0.2;
  const maxSize = 0.6;
  return minSize + normalizedY * (maxSize - minSize);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
