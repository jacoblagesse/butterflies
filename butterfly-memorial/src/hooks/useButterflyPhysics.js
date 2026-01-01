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

    console.log("Container dimensions:", { width, height });

    butterfliesStateRef.current = butterflies.map((b, i) => {
      const startFromLeft = Math.random() > 0.5;
      let x, y, vx, vy;

      if (startFromLeft) {
        x = -(100 + Math.random() * 200); // -100 to -300 pixels off-screen
        y = Math.random() * height;
        vx = 1 + Math.random() * 1;
        vy = (Math.random() - 0.5) * 0.5;
      } else {
        x = width + (100 + Math.random() * 200); // +100 to +300 pixels off-screen
        y = Math.random() * height;
        vx = -(1 + Math.random() * 1);
        vy = (Math.random() - 0.5) * 0.5;
      }

      const imageIndex = Math.floor(Math.random() * 3);
      const bobbingSpeed = 0.03 + Math.random() * 0.02; // Variation in bobbing speed

      return {
        id: b.id || i,
        label: `${b.gifter || b.from || "Someone"}: ${b.message || ""}`,
        x,
        y,
        vx,
        vy,
        size: calculateSize(y, height),
        imageIndex,
        direction: vx > 0 ? -1 : 1,
        isLanded: false,
        isLanding: false,
        isTakingOff: false,
        landUntil: 0,
        targetLandY: 0,
        takeoffStartY: 0,
        isWaiting: false,
        nextSpawnTime: 0,
        bobbingOffset: Math.random() * Math.PI * 2, // Random start phase
        bobbingSpeed,
        width,
        height,
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

      // Throttle React updates to ~10Hz
      if (now - lastRenderTick > 100) {
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

  // Handle taking off animation
  if (b.isTakingOff) {
    b.x += b.vx * (dt / 16);
    b.y -= 2 * (dt / 16); // Move up

    // Check if finished taking off (moved up 30-50 pixels)
    if (b.takeoffStartY - b.y > 80) {
      b.isTakingOff = false;
      // Resume normal flight
    }
    return;
  }

  // Check if butterfly should take off
  if (b.isLanded && now >= b.landUntil) {
    b.isLanded = false;
    b.isTakingOff = true;
    b.takeoffStartY = b.y;
    return;
  }

  // If landed, don't move
  if (b.isLanded) {
    return;
  }

  // Handle landing animation
  if (b.isLanding) {
    b.x += b.vx * (dt / 16);
    b.y += 2 * (dt / 16); // Dip down

    // Check if reached landing position
    if (b.y >= b.targetLandY) {
      b.y = b.targetLandY;
      b.isLanding = false;
      b.isLanded = true;
      const restDuration = 5000 + Math.random() * 25000; // 5-30 seconds
      b.landUntil = now + restDuration;
    }
    return;
  }

  // If waiting to respawn, check if it's time
  if (b.isWaiting) {
    if (now >= b.nextSpawnTime) {
      // Time to respawn - move to edge and start flying
      const startFromLeft = Math.random() > 0.5;

      if (startFromLeft) {
        b.x = -(100 + Math.random() * 200); // -100 to -300 pixels off-screen
        b.y = Math.random() * b.height;
        b.vx = 1 + Math.random() * 1;
        b.vy = (Math.random() - 0.5) * 0.5;
      } else {
        b.x = b.width + (100 + Math.random() * 200); // +100 to +300 pixels off-screen
        b.y = Math.random() * b.height;
        b.vx = -(1 + Math.random() * 1);
        b.vy = (Math.random() - 0.5) * 0.5;
      }

      b.direction = b.vx > 0 ? -1 : 1;
      b.isWaiting = false;
    }
    return; // Don't move while waiting
  }

  // Update bobbing offset
  b.bobbingOffset += b.bobbingSpeed;

  // Simple linear motion with bobbing
  b.x += b.vx * (dt / 16);
  b.y += b.vy * (dt / 16) + Math.sin(b.bobbingOffset) * 0.5; // Add gentle bobbing

  // Keep butterflies from going below the bottom with a buffer
  const bottomBuffer = 400;
  const maxY = b.height - bottomBuffer;
  if (b.y > maxY) {
    b.y = maxY;
    // If moving down, stop or reverse slightly
    if (b.vy > 0) {
      b.vy = -Math.abs(b.vy) * 0.5;
    }
  }

  // Update size based on y position for depth effect
  b.size = calculateSize(b.y, b.height);

  // Check if butterfly is in bottom 40% and should land (small random chance)
  const bottomThreshold = b.height * 0.5; // Bottom 40% starts at 60% down
  if (!b.isLanded && !b.isLanding && b.y > bottomThreshold && Math.random() < 0.003) {
    b.isLanding = true;
    b.targetLandY = b.y + 80; // Dip down 40 pixels
    return;
  }

  // Check if butterfly has left the screen
  const margin = 150;
  const isOffScreen = b.x < -margin || b.x > b.width + margin || b.y < -margin || b.y > b.height + margin;

  if (isOffScreen && !b.isWaiting) {
    // Start waiting period with delay up to 30 seconds
    const spawnDelay = Math.random() * 30000; // 0-30 seconds in milliseconds
    b.nextSpawnTime = now + spawnDelay;
    b.isWaiting = true;
    b.isLanded = false;

    // Move butterfly far off-screen while waiting
    b.x = -10000;
    b.y = -10000;
  }
}

function calculateSize(y, height) {
  // Butterflies at bottom (y close to height) are larger (closer)
  // Butterflies at top (y close to 0) are smaller (farther)
  const normalizedY = Math.max(0, Math.min(1, y / height));
  const minSize = 0.2;
  const maxSize = 0.6;
  return minSize + normalizedY * (maxSize - minSize);
}
