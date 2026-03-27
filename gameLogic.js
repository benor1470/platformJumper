// ============================================================
//  PLATFORM JUMPER — Game Logic (shared between game & tests)
// ============================================================

const GRAVITY          = 700;
const PLAYER_R         = 18;
const BOARD_H          = 13;
const RESTITUTION_TOP  = 0.78;
const RESTITUTION_SIDE = 0.10;
const JUMP_VY          = 760;   // px/s upward on manual jump (~415px height)

// ── Horizontal movement tunables ──────────────────────────────
const MOVE_MAX_SPEED = 0.22;   // max speed as fraction of screen width (input only)
const MOVE_ACCEL     = 2.2;    // acceleration (× W per s²)
const MOVE_DECEL     = 0.09;   // coast deceleration on release (~2.5 s to stop)
const MOVE_BRAKE     = 2.5;    // counter-steer deceleration (~0.09 s to stop)

// ── Collision ─────────────────────────────────────────────────
function resolveCircleOBB(p, b) {
  const ca = Math.cos(b.angle), sa = Math.sin(b.angle);
  const dx = p.x - b.x,  dy = p.y - b.y;

  // World → local (rotate by -angle)
  const lx =  dx * ca + dy * sa;
  const ly = -dx * sa + dy * ca;

  const hw = b.w / 2, hh = b.h / 2;
  const cx = Math.max(-hw, Math.min(hw, lx));
  const cy = Math.max(-hh, Math.min(hh, ly));

  const ex = lx - cx, ey = ly - cy;
  const dist2 = ex * ex + ey * ey;
  if (dist2 >= p.r * p.r) return false;   // no collision

  const dist = Math.sqrt(dist2);
  let nx, ny;
  if (dist < 0.001) {
    const ox = hw - Math.abs(lx), oy = hh - Math.abs(ly);
    if (ox < oy) { nx = lx < 0 ? -1 : 1; ny = 0; }
    else         { nx = 0; ny = ly < 0 ? -1 : 1; }
  } else {
    nx = ex / dist; ny = ey / dist;
  }

  // Local → world
  const wnx = nx * ca - ny * sa;
  const wny = nx * sa + ny * ca;

  // Push out of overlap
  const pen = p.r - dist;
  p.x += wnx * pen;
  p.y += wny * pen;

  // Contact point in world space relative to board center (from local cx, cy)
  const wCpx = cx * ca - cy * sa;
  const wCpy = cx * sa + cy * ca;

  // Include board's rotational velocity at the contact point (2D rigid body)
  const angVel = b.angVel || 0;
  const relVx  = p.vx - (b.vx - wCpy * angVel);
  const relVy  = p.vy - (b.vy + wCpx * angVel);
  const relDot = relVx * wnx + relVy * wny;

  const vyBefore = p.vy;

  if (relDot < 0) {
    const rest = wny < -0.5 ? RESTITUTION_TOP : RESTITUTION_SIDE;
    p.vx -= (1 + rest) * relDot * wnx;
    p.vy -= (1 + rest) * relDot * wny;
  }

  // Auto-bounce guarantee: top hit always bounces at least MIN_BOUNCE_VY upward
  const MIN_BOUNCE_VY = 500 * RESTITUTION_TOP;
  if (wny < -0.5 && p.vy > -MIN_BOUNCE_VY) {
    p.vy = -Math.max(Math.abs(vyBefore), 500) * RESTITUTION_TOP;
  }

  // Extra horizontal fling from tilt — scales with angle (wnx) and impact speed
  if (wny < -0.5 && relDot < 0 && Math.abs(wnx) > 0.05) {
    p.vx += wnx * Math.abs(relDot) * 1.4;
  }

  // Mark grounded so the jump powerup can fire a bigger jump
  if (wny < -0.5) p.grounded = true;

  return true;  // collision occurred
}

// ── Gravity ────────────────────────────────────────────────────
function applyGravity(player, dt) {
  player.vy += GRAVITY * dt;
}

// ── Horizontal movement (acceleration-based) ──────────────────
// Only updates velocity — position integration is the caller's responsibility
function applyMovement(player, dt, moveLeft, moveRight, W, speedMult = 1) {
  const maxVx = W * MOVE_MAX_SPEED * speedMult;
  const accel  = W * MOVE_ACCEL * dt;
  const decel  = W * MOVE_DECEL * dt;
  const brake  = W * MOVE_BRAKE * dt;

  if (moveRight && !moveLeft) {
    if (player.vx < 0) {
      // Counter-steering: brake hard toward 0, then begin accelerating right
      player.vx = Math.min(player.vx + brake, 0);
    } else if (player.vx < maxVx) {
      // Below cap: accelerate normally
      player.vx = Math.min(player.vx + accel, maxVx);
    } else {
      // Above cap (platform boost): coast back down to max, don't snap
      player.vx = Math.max(player.vx - decel, maxVx);
    }
  } else if (moveLeft && !moveRight) {
    if (player.vx > 0) {
      // Counter-steering: brake hard toward 0, then begin accelerating left
      player.vx = Math.max(player.vx - brake, 0);
    } else if (player.vx > -maxVx) {
      // Below cap: accelerate normally
      player.vx = Math.max(player.vx - accel, -maxVx);
    } else {
      // Above cap (platform boost): coast back to max, don't snap
      player.vx = Math.min(player.vx + decel, -maxVx);
    }
  } else {
    // No input (or both): coast to a stop
    if      (player.vx > 0) player.vx = Math.max(0, player.vx - decel);
    else if (player.vx < 0) player.vx = Math.min(0, player.vx + decel);
  }
}

// ── Wall bounds ────────────────────────────────────────────────
function applyWallBounds(player, W) {
  if (player.x < player.r)     { player.x = player.r;     player.vx =  Math.abs(player.vx) * 0.4; }
  if (player.x > W - player.r) { player.x = W - player.r; player.vx = -Math.abs(player.vx) * 0.4; }
}

// ── Game over ──────────────────────────────────────────────────
function isGameOver(player, H) {
  return player.y > H + player.r * 3;
}

// ── Pickup ─────────────────────────────────────────────────────
function isPickupCollected(player, pickup) {
  const dx = player.x - pickup.x, dy = player.y - pickup.y;
  return dx * dx + dy * dy < (player.r + pickup.r) ** 2;
}

// ── Factories ──────────────────────────────────────────────────
function createPlayer(W, H) {
  // Scale ball down on narrow (mobile) screens; cap at desktop default
  const r = Math.max(10, Math.min(PLAYER_R, Math.round(W * 0.035)));
  return { x: W / 2, y: H * 0.22, vx: 0, vy: 0, r };
}

function createBoard({ x, y, w, angle = 0, rotSpeed = 0, vx = 0, vy = 0, hue = 0 } = {}) {
  return { x, y, w, h: BOARD_H, angle, rotSpeed, vx, vy, hue };
}

// ── Export (Node / Jest) ───────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    GRAVITY, PLAYER_R, BOARD_H, RESTITUTION_TOP, RESTITUTION_SIDE, JUMP_VY,
    MOVE_MAX_SPEED, MOVE_ACCEL, MOVE_DECEL, MOVE_BRAKE,
    resolveCircleOBB,
    applyGravity, applyMovement, applyWallBounds,
    isGameOver, isPickupCollected,
    createPlayer, createBoard,
  };
}
