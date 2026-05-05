import { useEffect, useRef, useState } from "react";

export function useButterflyPhysics(butterflies, containerRef, frozenRef, maxOnScreen = Infinity) {
  const butterfliesStateRef = useRef([]);
  const [, setTick] = useState(0);

  // Initialize butterfly states
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    butterfliesStateRef.current = butterflies.map((b, i) => {
      // Each butterfly gets a "cruising altitude" biased toward the upper
      // portion of the scene. Lower ratio = higher in the sky.
      // Range 0.03–0.53 — some butterflies hover near the very top of
      // the scene, others cruise around the middle.
      const preferredYRatio = 0.03 + Math.random() * 0.5;
      const speed = 0.8 + Math.random() * 0.8; // base speed
      const imageIndex = Math.floor(Math.random() * 3);
      const pinned = !!b.pinned;

      // All butterflies spawn off-screen and fly inward. Anti-clump comes
      // from staggered timing: ~half enter immediately from an edge, the
      // other half are held off-screen briefly and trickle in over the
      // first ~10 seconds via the regular respawn path.
      // Pinned butterflies (garden's purchased + spirit butterfly) skip
      // the delay so they're always present in the scene.
      const spawnMode = pinned ? "edge" : (Math.random() < 0.5 ? "edge" : "delayed");

      let x, y, heading;
      let isWaiting = false;
      let nextSpawnTime = 0;

      if (spawnMode === "edge") {
        const startFromLeft = Math.random() > 0.5;
        y = preferredYRatio * height + (Math.random() - 0.5) * 120;
        if (startFromLeft) {
          x = -(100 + Math.random() * 200);
          heading = (Math.random() - 0.5) * 0.6;
        } else {
          x = width + (100 + Math.random() * 200);
          heading = Math.PI + (Math.random() - 0.5) * 0.6;
        }
      } else {
        // Held off-screen; the respawn loop will pick them up shortly.
        x = -10000;
        y = -10000;
        heading = 0;
        isWaiting = true;
        nextSpawnTime = Date.now() + Math.random() * 10000;
      }

      return {
        id: b.id || i,
        label: b.color === "white"
          ? `${b.gifter || b.from || "Garden"}'s butterfly`
          : `${b.gifter || b.from || "Someone"}: ${b.message || ""}`,
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
        isWaiting,
        nextSpawnTime,
        // Organic motion
        bobbingPhase: Math.random() * Math.PI * 2,
        bobbingPhase2: Math.random() * Math.PI * 2,
        bobbingSpeed: 0.04 + Math.random() * 0.02,
        // Per-butterfly preferred altitude (0–1, lower = higher in sky)
        preferredYRatio,
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
        // Pinned butterflies (garden's spirit + purchased) never leave the
        // viewport once they've flown in — see the flight loop below.
        pinned,
        hasEnteredView: false,
        // Pooled butterflies are excluded from the visible scene because
        // we're at the maxOnScreen cap. They sit at (-10000, -10000) and
        // are rotated in when an active unpinned butterfly leaves the
        // screen. See partitioning below.
        isPooled: false,
        raw: b,
      };
    });

    // Cap: pinned butterflies always stay; unpinned compete for the
    // remaining slots. Excess unpinned ones are sent to the pool.
    const all = butterfliesStateRef.current;
    const pinnedCount = all.reduce((n, b) => n + (b.pinned ? 1 : 0), 0);
    const unpinnedSlots = Math.max(0, maxOnScreen - pinnedCount);
    const unpinned = all.filter((b) => !b.pinned);
    if (unpinned.length > unpinnedSlots) {
      // Random selection so it's not always the first N
      const shuffled = [...unpinned].sort(() => Math.random() - 0.5);
      const toPool = shuffled.slice(unpinnedSlots);
      for (const b of toPool) {
        b.isPooled = true;
        b.isWaiting = true;
        b.x = -10000;
        b.y = -10000;
        b.nextSpawnTime = 0; // ignored while isPooled is true
      }
    }

    setTick((t) => t + 1);
  }, [butterflies, containerRef.current, maxOnScreen]);

  // Animation loop
  useEffect(() => {
    let rafId = null;
    let lastTime = performance.now();
    let lastRenderTick = performance.now();

    const step = (now) => {
      const dt = Math.min(100, now - lastTime);
      lastTime = now;

      const list = butterfliesStateRef.current;
      const frozen = frozenRef?.current;
      for (let i = 0; i < list.length; i++) {
        if (frozen && frozen.has(list[i].id)) continue;
        updateButterflyPosition(list[i], dt, list);
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

function updateButterflyPosition(b, dt, list) {
  // Pooled butterflies are excluded from the visible scene — skip them
  // entirely until the rotation logic activates them.
  if (b.isPooled) return;

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
      // ~35% of resting butterflies face the opposite direction so they
      // don't all rest oriented the same way. Direction is naturally
      // restored on takeoff (recomputed from the new heading).
      if (Math.random() < 0.35) b.direction = -b.direction;
    }
    return;
  }

  // --- WAITING TO RESPAWN ---
  if (b.isWaiting) {
    if (now >= b.nextSpawnTime) {
      const startFromLeft = Math.random() > 0.5;
      const spawnY = b.preferredYRatio * b.height + (Math.random() - 0.5) * 120;
      if (startFromLeft) {
        b.x = -(100 + Math.random() * 200);
        b.y = spawnY;
        b.heading = (Math.random() - 0.5) * 0.6;
      } else {
        b.x = b.width + (100 + Math.random() * 200);
        b.y = spawnY;
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

  // Soft boundary steering — gently turn away from edges.
  // Top margin is small so butterflies can fly near the top of the sky;
  // side and bottom margins stay larger to keep them on-screen and out
  // of the landing reserve at the bottom.
  const sideEdgeMargin = 120;
  const topEdgeMargin = 40;
  const bottomReserve = 400;
  let steerX = 0;
  let steerY = 0;

  if (b.x < sideEdgeMargin) steerX = (sideEdgeMargin - b.x) / sideEdgeMargin;
  else if (b.x > b.width - sideEdgeMargin) steerX = -(b.x - (b.width - sideEdgeMargin)) / sideEdgeMargin;

  if (b.y < topEdgeMargin) steerY = (topEdgeMargin - b.y) / topEdgeMargin;
  else if (b.y > b.height - bottomReserve) steerY = -(b.y - (b.height - bottomReserve)) / sideEdgeMargin;

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

  // Altitude preference — gently drift toward this butterfly's cruising altitude.
  // The pull is asymmetric so butterflies feel free to climb higher than
  // their preferred altitude (giving the impression of a real sky), but
  // are gently nudged back up if they sink below it.
  //   y < 0          (above viewport): strong pull back into view
  //   y < preferredY (above preferred): weak pull, lets them wander upward
  //   y > preferredY (below preferred): normal pull upward
  const preferredY = b.height * b.preferredYRatio;
  let pullStrength;
  if (b.y < 0) pullStrength = 0.005;
  else if (b.y < preferredY) pullStrength = 0.0005;
  else pullStrength = 0.0015;
  b.y += (preferredY - b.y) * pullStrength * f;

  // Multi-layered bobbing for organic vertical motion
  b.bobbingPhase += b.bobbingSpeed * f;
  b.bobbingPhase2 += b.bobbingSpeed * 0.6 * f;
  const bob = Math.sin(b.bobbingPhase) * 1.8 + Math.sin(b.bobbingPhase2 * 1.7) * 1.0;
  b.y += bob * f * 0.3;

  // Update direction for sprite flipping
  if (Math.abs(b.vx) > 0.2) {
    b.direction = b.vx > 0 ? -1 : 1;
  }

  // Bottom boundary — reserved for landing zone, butterflies don't enter it
  const maxY = b.height - 400;
  if (b.y > maxY) {
    b.y = maxY;
    if (b.vy > 0) b.vy = -Math.abs(b.vy) * 0.5;
    b.heading = -Math.abs(b.heading); // steer upward
  }

  // Top is intentionally open: butterflies can briefly fly above y=0 (out of
  // view) and then drift back down via the altitude pull above.

  // Pinned butterflies (e.g. a garden's purchased + spirit butterflies) must
  // always stay visible once they've flown in. They spawn off-screen and
  // approach from the side; once any part is on-screen, hard walls at the
  // left, right, and top keep them inside the viewport.
  if (b.pinned) {
    if (!b.hasEnteredView && b.x > 0 && b.x < b.width && b.y > 0) {
      b.hasEnteredView = true;
    }
    if (b.hasEnteredView) {
      if (b.x < 0) {
        b.x = 0;
        b.heading = Math.PI - b.heading; // reflect horizontally
      } else if (b.x > b.width) {
        b.x = b.width;
        b.heading = Math.PI - b.heading;
      }
      if (b.y < 0) {
        b.y = 0;
        b.heading = -b.heading; // reflect vertically (face downward)
      }
    }
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

  // Off-screen → respawn.
  // Note: we deliberately allow b.y < -margin (butterflies that have drifted
  // above the viewport). The altitude pull will bring them back down on its
  // own — respawning would erase that natural return.
  // Pinned butterflies never trigger this path: they're walled in once
  // they enter view, and shouldn't disappear from a garden scene.
  if (!b.pinned) {
    const margin = 250;
    const isOffScreen = b.x < -margin || b.x > b.width + margin || b.y > b.height + margin;
    if (isOffScreen && !b.isWaiting) {
      b.isLanded = false;
      b.x = -10000;
      b.y = -10000;
      // Rotation: if any unpinned butterflies are sitting in the pool,
      // swap one of them in instead of waiting to respawn this same one.
      // The current butterfly joins the pool; the chosen pool butterfly
      // is queued to spawn immediately from an edge.
      const swap = list && list.find((x) => x.isPooled);
      if (swap) {
        swap.isPooled = false;
        swap.nextSpawnTime = now;
        swap.isWaiting = true;
        b.isPooled = true;
        b.isWaiting = true;
        b.nextSpawnTime = 0;
      } else {
        // No pool — original behavior: this butterfly waits and respawns.
        b.isWaiting = true;
        b.nextSpawnTime = now + Math.random() * 20000;
      }
    }
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
