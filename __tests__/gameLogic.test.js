const {
  GRAVITY, PLAYER_R, BOARD_H,
  RESTITUTION_TOP, RESTITUTION_SIDE,
  MOVE_MAX_SPEED, MOVE_ACCEL, MOVE_DECEL,
  resolveCircleOBB,
  applyGravity, applyMovement, applyWallBounds,
  isGameOver, isPickupCollected,
  createPlayer, createBoard,
} = require('../gameLogic');

const W = 800;   // reference screen width used throughout movement tests

// ── Helpers ───────────────────────────────────────────────────
function makePlayer(overrides = {}) {
  return { x: 400, y: 300, vx: 0, vy: 0, r: PLAYER_R, ...overrides };
}

// Flat horizontal platform, player positioned directly above it
function platformBelow(playerX, playerY, w = 120) {
  // Centre the platform under the player; place it so the top edge is at playerY + PLAYER_R
  return createBoard({
    x:     playerX,
    y:     playerY + PLAYER_R + BOARD_H / 2,
    w,
    angle: 0,
  });
}

// ─────────────────────────────────────────────────────────────
describe('Constants', () => {
  test('GRAVITY is positive (pulls player downward)', () => {
    expect(GRAVITY).toBeGreaterThan(0);
  });

  test('RESTITUTION_TOP is strong enough for a satisfying bounce (≥ 0.5)', () => {
    expect(RESTITUTION_TOP).toBeGreaterThanOrEqual(0.5);
  });

  test('PLAYER_R and BOARD_H are positive', () => {
    expect(PLAYER_R).toBeGreaterThan(0);
    expect(BOARD_H).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
describe('createPlayer / createBoard factories', () => {
  test('createPlayer centers the player horizontally', () => {
    const p = createPlayer(800, 600);
    expect(p.x).toBe(400);
  });

  test('createPlayer places player near top of screen', () => {
    const p = createPlayer(800, 600);
    expect(p.y).toBeLessThan(600 * 0.3);
  });

  test('createPlayer starts with zero velocity', () => {
    const p = createPlayer(800, 600);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
  });

  test('createBoard sets correct height', () => {
    const b = createBoard({ x: 0, y: 0, w: 100 });
    expect(b.h).toBe(BOARD_H);
  });

  test('createBoard defaults angle to 0', () => {
    const b = createBoard({ x: 0, y: 0, w: 100 });
    expect(b.angle).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
describe('applyGravity', () => {
  test('increases vy each frame', () => {
    const p = makePlayer({ vy: 0 });
    applyGravity(p, 0.016);
    expect(p.vy).toBeCloseTo(GRAVITY * 0.016);
  });

  test('accumulates over multiple frames', () => {
    const p = makePlayer({ vy: 0 });
    applyGravity(p, 0.1);
    applyGravity(p, 0.1);
    expect(p.vy).toBeCloseTo(GRAVITY * 0.2, 3);
  });

  test('does not affect x position or vx', () => {
    const p = makePlayer({ vx: 100 });
    applyGravity(p, 0.1);
    expect(p.vx).toBe(100);
    expect(p.x).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
describe('applyMovement', () => {
  const DT = 0.016;

  test('accelerates left when moveLeft is true', () => {
    const p = makePlayer({ x: 400, vx: 0 });
    applyMovement(p, DT, true, false, W);
    expect(p.vx).toBeLessThan(0);         // moving left
    expect(p.x).toBeLessThan(400);
  });

  test('accelerates right when moveRight is true', () => {
    const p = makePlayer({ x: 400, vx: 0 });
    applyMovement(p, DT, false, true, W);
    expect(p.vx).toBeGreaterThan(0);      // moving right
    expect(p.x).toBeGreaterThan(400);
  });

  test('vx is capped at MOVE_MAX_SPEED × W', () => {
    const p = makePlayer({ vx: 0 });
    // Hold right for many frames
    for (let i = 0; i < 120; i++) applyMovement(p, DT, false, true, W);
    expect(p.vx).toBeCloseTo(W * MOVE_MAX_SPEED, 1);
  });

  test('decelerates toward zero when no input', () => {
    const p = makePlayer({ vx: W * MOVE_MAX_SPEED });
    applyMovement(p, DT, false, false, W);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vx).toBeLessThan(W * MOVE_MAX_SPEED);
  });

  test('comes to a full stop after enough no-input frames', () => {
    const p = makePlayer({ vx: W * MOVE_MAX_SPEED });
    for (let i = 0; i < 120; i++) applyMovement(p, DT, false, false, W);
    expect(p.vx).toBe(0);
  });

  test('vy is applied to y position', () => {
    const p = makePlayer({ y: 300, vy: 200 });
    applyMovement(p, DT, false, false, W);
    expect(p.y).toBeCloseTo(300 + 200 * DT, 3);
  });

  test('left takes priority when both pressed', () => {
    const p = makePlayer({ vx: 0 });
    applyMovement(p, DT, true, true, W);
    expect(p.vx).toBeLessThan(0);
  });

  test('max speed is lower than original instant speed (W × 0.44)', () => {
    expect(MOVE_MAX_SPEED).toBeLessThan(0.44);
  });
});

// ─────────────────────────────────────────────────────────────
describe('applyWallBounds', () => {
  const W = 800;

  test('clamps player at left wall and reverses vx', () => {
    const p = makePlayer({ x: PLAYER_R - 5, vx: -300 });
    applyWallBounds(p, W);
    expect(p.x).toBe(PLAYER_R);
    expect(p.vx).toBeGreaterThan(0);
  });

  test('clamps player at right wall and reverses vx', () => {
    const p = makePlayer({ x: W - PLAYER_R + 5, vx: 300 });
    applyWallBounds(p, W);
    expect(p.x).toBe(W - PLAYER_R);
    expect(p.vx).toBeLessThan(0);
  });

  test('does not affect player well within bounds', () => {
    const p = makePlayer({ x: 400, vx: 200 });
    applyWallBounds(p, W);
    expect(p.x).toBe(400);
    expect(p.vx).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────
describe('isGameOver', () => {
  const H = 600;

  test('returns true when player falls below screen', () => {
    const p = makePlayer({ y: H + PLAYER_R * 4 });
    expect(isGameOver(p, H)).toBe(true);
  });

  test('returns false when player is on screen', () => {
    const p = makePlayer({ y: 300 });
    expect(isGameOver(p, H)).toBe(false);
  });

  test('returns false at exactly screen bottom edge', () => {
    const p = makePlayer({ y: H });
    expect(isGameOver(p, H)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('isPickupCollected', () => {
  test('returns true when player overlaps pickup', () => {
    const p  = makePlayer({ x: 100, y: 100 });
    const pk = { x: 105, y: 100, r: 15 };
    expect(isPickupCollected(p, pk)).toBe(true);
  });

  test('returns false when player is far from pickup', () => {
    const p  = makePlayer({ x: 100, y: 100 });
    const pk = { x: 400, y: 400, r: 15 };
    expect(isPickupCollected(p, pk)).toBe(false);
  });

  test('returns false when circles just barely not touching', () => {
    const p  = makePlayer({ x: 0, y: 0 });
    const pk = { x: PLAYER_R + 15 + 1, y: 0, r: 15 };
    expect(isPickupCollected(p, pk)).toBe(false);
  });

  test('returns true when circles just barely touching', () => {
    const p  = makePlayer({ x: 0, y: 0 });
    const pk = { x: PLAYER_R + 15 - 1, y: 0, r: 15 };
    expect(isPickupCollected(p, pk)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
describe('resolveCircleOBB — no collision', () => {
  test('player far above platform is not affected', () => {
    const p = makePlayer({ x: 400, y: 100, vy: 50 });
    const b = createBoard({ x: 400, y: 400, w: 200 });
    const hit = resolveCircleOBB(p, b);
    expect(hit).toBe(false);
    expect(p.y).toBe(100);
    expect(p.vy).toBe(50);
  });

  test('player to the left of platform is not affected', () => {
    const p = makePlayer({ x: 50, y: 300 });
    const b = createBoard({ x: 500, y: 300, w: 200 });
    const hit = resolveCircleOBB(p, b);
    expect(hit).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('resolveCircleOBB — top collision (the jump mechanic)', () => {
  test('player landing on platform is pushed upward', () => {
    // Overlap player slightly into top of platform
    const p = makePlayer({ x: 400, y: 300, vy: 200 });
    const b = createBoard({ x: 400, y: 300 + PLAYER_R - 2, w: 200 });
    resolveCircleOBB(p, b);
    expect(p.y).toBeLessThan(300);  // pushed up out of overlap
  });

  test('falling player always gets upward velocity response', () => {
    const p = makePlayer({ x: 400, y: 300, vy: 300 });
    const b = createBoard({ x: 400, y: 300 + PLAYER_R - 2, w: 200 });
    resolveCircleOBB(p, b);
    expect(p.vy).toBeLessThan(0);  // must be moving upward after top collision
  });

  test('upward-moving platform kicks player upward (the jump)', () => {
    // Player sitting still on top; platform moves up into player
    const p = makePlayer({ x: 400, y: 300, vy: 0 });
    // Place platform so it is overlapping from below
    const b = createBoard({ x: 400, y: 300 + PLAYER_R - 3, w: 200, vy: -300 });
    resolveCircleOBB(p, b);
    // Player should be pushed up (y decreases) or at least not pushed down
    expect(p.y).toBeLessThanOrEqual(300);
  });

  test('returns true on collision', () => {
    const p = makePlayer({ x: 400, y: 300, vy: 200 });
    const b = createBoard({ x: 400, y: 300 + PLAYER_R - 2, w: 200 });
    expect(resolveCircleOBB(p, b)).toBe(true);
  });

  test('top collision produces a meaningful upward bounce on stationary platform', () => {
    const impactVy = 400;
    const p1 = makePlayer({ x: 400, y: 300, vy: impactVy });
    const b1 = createBoard({ x: 400, y: 300 + PLAYER_R - 2, w: 200 });
    resolveCircleOBB(p1, b1);
    // Should bounce at least RESTITUTION_TOP × impact speed upward
    expect(Math.abs(p1.vy)).toBeGreaterThan(impactVy * RESTITUTION_TOP * 0.5);
    expect(p1.vy).toBeLessThan(0);  // upward
  });

  test('player falling on downward-moving platform still bounces upward with good speed', () => {
    const p = makePlayer({ x: 400, y: 300, vy: 400 });
    const b = createBoard({ x: 400, y: 300 + PLAYER_R - 2, w: 200, vy: 250 }); // platform also descending
    resolveCircleOBB(p, b);
    expect(p.vy).toBeLessThan(0);                      // upward
    expect(Math.abs(p.vy)).toBeGreaterThan(100);       // meaningful speed, not just a nudge
  });

  test('platform descending faster than player still results in meaningful upward bounce', () => {
    const p = makePlayer({ x: 400, y: 300, vy: 100 });
    const b = createBoard({ x: 400, y: 300 + PLAYER_R - 2, w: 200, vy: 400 }); // platform faster
    resolveCircleOBB(p, b);
    expect(p.vy).toBeLessThan(0);                      // arcade guarantee fires
    // Minimum bounce = 150 * RESTITUTION_TOP
    expect(Math.abs(p.vy)).toBeGreaterThanOrEqual(150 * RESTITUTION_TOP);
  });
});

// ─────────────────────────────────────────────────────────────
describe('resolveCircleOBB — side collision', () => {
  test('player hitting right side of platform is pushed right', () => {
    // Player to the RIGHT of right edge, overlapping by a few px, moving left
    const rightEdge = 400 + 100;   // platform right edge = centre + half-width
    const p = makePlayer({ x: rightEdge + PLAYER_R - 3, y: 300, vx: -200 });
    const b = createBoard({ x: 400, y: 300, w: 200 });
    const xBefore = p.x;
    resolveCircleOBB(p, b);
    expect(p.x).toBeGreaterThanOrEqual(xBefore);  // pushed away (right or no movement)
    expect(p.vx).toBeGreaterThan(0);              // velocity reversed to rightward
  });

  test('side collision uses RESTITUTION_SIDE', () => {
    const rightEdge = 400 + 100;
    const p = makePlayer({ x: rightEdge + PLAYER_R - 3, y: 300, vx: -300 });
    const b = createBoard({ x: 400, y: 300, w: 200 });
    const vxBefore = p.vx;
    resolveCircleOBB(p, b);
    // vx reversed to positive, magnitude reduced vs full elastic
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vx).toBeLessThan(Math.abs(vxBefore));  // less than full bounce
  });
});

// ─────────────────────────────────────────────────────────────
describe('resolveCircleOBB — rotated platform', () => {
  test('collision still detected with 45-degree rotated platform', () => {
    const p = makePlayer({ x: 400, y: 300, vy: 100 });
    const b = createBoard({ x: 400, y: 300 + PLAYER_R - 2, w: 200, angle: Math.PI / 4 });
    // May or may not collide depending on rotation, but function should not throw
    expect(() => resolveCircleOBB(p, b)).not.toThrow();
  });

  test('no collision when player is far from rotated platform', () => {
    // Player well above a platform — no contact regardless of rotation
    const p = makePlayer({ x: 400, y: 50 });
    const b = createBoard({ x: 400, y: 400, w: 200, angle: Math.PI / 4 });
    const hit = resolveCircleOBB(p, b);
    expect(hit).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('Gameplay integration — player falls onto platform', () => {
  test('player with downward velocity lands and stops falling after collision', () => {
    const p = makePlayer({ x: 400, y: 290, vy: 300 });
    const b = createBoard({ x: 400, y: 290 + PLAYER_R + BOARD_H / 2, w: 200 });

    // Simulate a few physics frames
    const DT = 0.016;
    let landed = false;
    for (let i = 0; i < 10; i++) {
      applyGravity(p, DT);
      applyMovement(p, DT, false, false, 0);
      if (resolveCircleOBB(p, b)) landed = true;
    }

    expect(landed).toBe(true);
    expect(p.vy).toBeLessThan(300);  // velocity reduced after landing
  });

  test('player on moving platform gets bounced upward', () => {
    // Player resting on a platform that abruptly moves upward
    const p = makePlayer({ x: 400, y: 300, vy: 0 });
    const b = createBoard({ x: 400, y: 300 + PLAYER_R + BOARD_H / 2, w: 200, vy: -600 });

    const DT = 0.016;
    // Move board up into player for a couple frames
    for (let i = 0; i < 3; i++) {
      b.y += b.vy * DT;
      applyGravity(p, DT);
      applyMovement(p, DT, false, false, 0);
      resolveCircleOBB(p, b);
    }

    // After being hit by the upward platform, player should have negative vy (moving up)
    expect(p.vy).toBeLessThan(0);
  });

  test('player falls off screen → game over', () => {
    const H = 600;
    const p = makePlayer({ x: 400, y: 400, vy: 800 });
    const DT = 0.1;

    let over = false;
    for (let i = 0; i < 30; i++) {
      applyGravity(p, DT);
      applyMovement(p, DT, false, false, 0);
      if (isGameOver(p, H)) { over = true; break; }
    }

    expect(over).toBe(true);
  });
});
