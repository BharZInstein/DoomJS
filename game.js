// DOOM.js — a DOOM-style raycasting FPS in pure JS. All art & audio procedural.
'use strict';

const W = 640, H = 400, HUD_H = 80, VIEW_H = H - HUD_H;
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const FOV = Math.PI / 3;
const TEX = 64;

// ---------------------------------------------------------------- MAP
// 0 empty | 1 brick | 2 stone | 3 tech | 4 hell | 5 door | 9 exit
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [1,0,0,0,0,0,0,0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [1,0,0,0,0,0,0,0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [1,0,0,1,1,0,1,1,0,1,2,0,0,2,2,2,2,0,0,2,2,0,0,2],
  [1,0,0,1,0,0,0,1,0,5,0,0,0,2,0,0,0,0,0,0,2,0,0,2],
  [1,0,0,1,0,0,0,1,0,1,2,0,0,2,0,0,0,0,0,0,2,0,0,2],
  [1,0,0,1,1,5,1,1,0,1,2,0,0,2,0,0,0,0,0,0,2,0,0,2],
  [1,0,0,0,0,0,0,0,0,1,2,0,0,2,2,0,0,2,2,2,2,0,0,2],
  [1,0,0,0,0,0,0,0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [1,1,1,1,1,5,1,1,1,1,2,2,2,2,2,2,5,2,2,2,2,0,0,2],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2],
  [3,0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0,3,3,0,2,0,0,2],
  [3,0,0,3,4,4,4,4,4,4,4,4,4,4,3,0,0,3,3,0,2,0,0,2],
  [3,0,0,3,4,0,0,0,0,0,0,0,0,4,3,0,0,3,3,0,2,0,0,2],
  [3,0,0,5,0,0,0,0,0,0,0,0,0,4,3,0,0,0,0,0,5,0,0,2],
  [3,0,0,3,4,0,0,4,4,4,4,0,0,4,3,0,0,3,3,2,2,0,0,2],
  [3,0,0,3,4,0,0,4,9,9,4,0,0,4,3,0,0,3,3,2,2,0,0,2],
  [3,0,0,3,4,0,0,4,9,9,4,0,0,4,3,0,0,3,3,2,2,2,5,2],
  [3,0,0,3,4,0,0,5,0,0,4,0,0,4,3,0,0,3,3,2,0,0,0,2],
  [3,0,0,3,4,0,0,4,4,4,4,0,0,4,3,0,0,0,0,0,0,0,0,2],
  [3,0,0,3,4,4,4,4,4,4,4,4,0,4,3,3,3,3,3,2,0,0,0,2],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,2],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2],
];
const MH = MAP.length, MW = MAP[0].length;
const doors = {}; // "x,y" -> {t: 0..1 open amount, opening}
const at = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? 1 : MAP[y | 0][x | 0];
const doorAt = (x, y) => doors[(x | 0) + ',' + (y | 0)];
const solid = (x, y) => {
  const t = at(x, y);
  if (t === 0) return false;
  if (t === 5) { const d = doorAt(x, y); return !(d && d.t > 0.85); }
  return t !== 9 ? true : false;
};

// ---------------------------------------------------------------- TEXTURES (procedural)
function makeTex(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = TEX;
  const g = c.getContext('2d');
  draw(g);
  return c;
}
function noise(g, base, amt, n = 900) {
  for (let i = 0; i < n; i++) {
    const v = base + (Math.random() - 0.5) * amt;
    g.fillStyle = `rgb(${v|0},${(v*0.8)|0},${(v*0.7)|0})`;
    g.fillRect(Math.random() * TEX | 0, Math.random() * TEX | 0, 2, 2);
  }
}
const texBrick = makeTex(g => {
  g.fillStyle = '#5a2b20'; g.fillRect(0, 0, TEX, TEX);
  g.fillStyle = '#3a1a12';
  for (let r = 0; r < 8; r++) {
    g.fillRect(0, r * 8, TEX, 2);
    const off = (r % 2) * 8;
    for (let c = 0; c < 5; c++) g.fillRect((off + c * 16) % TEX, r * 8, 2, 8);
  }
  noise(g, 90, 50);
});
const texStone = makeTex(g => {
  g.fillStyle = '#4c4f52'; g.fillRect(0, 0, TEX, TEX);
  g.strokeStyle = '#2c2e30'; g.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    g.beginPath();
    g.moveTo(Math.random() * TEX, 0);
    g.lineTo(Math.random() * TEX, TEX);
    g.stroke();
  }
  noise(g, 80, 40);
});
const texTech = makeTex(g => {
  g.fillStyle = '#31414a'; g.fillRect(0, 0, TEX, TEX);
  g.fillStyle = '#22303a';
  g.fillRect(4, 4, TEX - 8, TEX - 8);
  g.fillStyle = '#4fd66a'; g.fillRect(10, 10, 10, 6);
  g.fillStyle = '#d64f4f'; g.fillRect(26, 10, 6, 6);
  g.fillStyle = '#556'; g.fillRect(10, 26, 44, 4);
  g.fillRect(10, 36, 44, 4); g.fillRect(10, 46, 44, 4);
  g.fillStyle = '#889'; for (let i = 0; i < 6; i++) g.fillRect(8 + i * 9, 56, 4, 4);
  noise(g, 60, 30, 300);
});
const texHell = makeTex(g => {
  g.fillStyle = '#3b0d0d'; g.fillRect(0, 0, TEX, TEX);
  g.strokeStyle = '#7a1c10'; g.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    let x = Math.random() * TEX;
    g.moveTo(x, 0);
    for (let y = 8; y <= TEX; y += 8) { x += (Math.random() - 0.5) * 14; g.lineTo(x, y); }
    g.stroke();
  }
  g.fillStyle = '#c8451a';
  for (let i = 0; i < 60; i++) g.fillRect(Math.random() * TEX | 0, Math.random() * TEX | 0, 2, 2);
});
const texDoor = makeTex(g => {
  g.fillStyle = '#6e6a5a'; g.fillRect(0, 0, TEX, TEX);
  g.fillStyle = '#4a473c';
  g.fillRect(0, 0, 6, TEX); g.fillRect(TEX - 6, 0, 6, TEX);
  g.fillRect(6, 28, TEX - 12, 8);
  g.fillStyle = '#8a8672';
  g.fillRect(10, 6, TEX - 20, 18); g.fillRect(10, 40, TEX - 20, 18);
  g.fillStyle = '#c9a94a'; g.fillRect(28, 30, 8, 4);
  noise(g, 100, 30, 300);
});
const texExit = makeTex(g => {
  g.fillStyle = '#101418'; g.fillRect(0, 0, TEX, TEX);
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grad.addColorStop(0, '#aef2ff'); grad.addColorStop(0.5, '#1f8fbf'); grad.addColorStop(1, '#101418');
  g.fillStyle = grad; g.fillRect(0, 0, TEX, TEX);
  g.fillStyle = '#eaffff';
  g.font = 'bold 18px monospace'; g.textAlign = 'center';
  g.fillText('EXIT', 32, 38);
});
const wallTex = { 1: texBrick, 2: texStone, 3: texTech, 4: texHell, 5: texDoor, 9: texExit };

// ---------------------------------------------------------------- SPRITES (procedural pixel art)
function makeSprite(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  draw(g, size);
  return c;
}
function drawDemon(g, s, pose) { // pose: 0 stand, 1 walk, 2 attack, 3 pain
  const u = s / 32;
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x * u, y * u, w * u, h * u); };
  const skin = pose === 3 ? '#e08a8a' : '#a8674f', dark = '#6e3f2e', eye = '#ffd34d';
  // legs
  const spread = pose === 1 ? 2 : 0;
  px(11 - spread, 24, 4, 8, dark); px(17 + spread, 24, 4, 8, dark);
  px(10 - spread, 30, 6, 2, '#333'); px(16 + spread, 30, 6, 2, '#333');
  // torso
  px(9, 12, 14, 13, skin);
  px(11, 14, 10, 8, dark);
  px(13, 15, 6, 6, pose === 2 ? '#ff5a1f' : '#7e4a36'); // belly glows when attacking
  // arms
  if (pose === 2) { px(4, 10, 5, 4, skin); px(23, 10, 5, 4, skin); px(2, 8, 4, 4, '#ff8c1f'); px(26, 8, 4, 4, '#ff8c1f'); }
  else { px(5, 14, 4, 9, skin); px(23, 14, 4, 9, skin); }
  // head + horns
  px(11, 4, 10, 9, skin);
  px(8, 1, 3, 5, '#ddd'); px(21, 1, 3, 5, '#ddd');
  px(13, 7, 2, 2, eye); px(17, 7, 2, 2, eye);
  px(13, 11, 6, 1, '#2a0d05');
  if (pose === 2 || pose === 3) px(13, 10, 6, 3, '#5c0f0f'); // mouth open
}
const spDemon = [0, 1, 2, 3].map(p => makeSprite(64, (g, s) => drawDemon(g, s, p)));
const spDemonDead = makeSprite(64, (g, s) => {
  const u = s / 32, px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * u, y * u, w * u, h * u); };
  px(4, 26, 24, 5, '#5c1010'); px(7, 24, 8, 4, '#a8674f'); px(19, 25, 6, 3, '#6e3f2e');
  px(9, 23, 2, 2, '#ddd');
});
const spHealth = makeSprite(64, (g, s) => {
  const u = s / 32, px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * u, y * u, w * u, h * u); };
  px(8, 18, 16, 12, '#e8e4d8'); px(9, 19, 14, 10, '#2f7d3a');
  px(14, 20, 4, 8, '#fff'); px(12, 22, 8, 4, '#fff');
  px(8, 30, 16, 1, '#555');
});
const spAmmo = makeSprite(64, (g, s) => {
  const u = s / 32, px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * u, y * u, w * u, h * u); };
  px(9, 20, 14, 10, '#39511f'); px(10, 21, 12, 3, '#5a7c33');
  g.fillStyle = '#c9a94a';
  for (let i = 0; i < 4; i++) g.fillRect((11 + i * 3) * u, 24 * u, 2 * u, 5 * u);
});

// ---------------------------------------------------------------- AUDIO (synth)
let AC = null;
function audio() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function sfx(kind) {
  try {
    const ac = audio(), t = ac.currentTime;
    const g = ac.createGain(); g.connect(ac.destination);
    if (kind === 'shot') {
      const len = 0.25, buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      src.connect(f); f.connect(g); g.gain.setValueAtTime(0.5, t);
      src.start();
    } else if (kind === 'hurt') {
      const o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.3);
      g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); o.start(t); o.stop(t + 0.3);
    } else if (kind === 'demonDie') {
      const o = ac.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(g); o.start(t); o.stop(t + 0.5);
    } else if (kind === 'demonHit') {
      const o = ac.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.12);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g); o.start(t); o.stop(t + 0.12);
    } else if (kind === 'door') {
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(140, t + 0.6);
      g.gain.setValueAtTime(0.2, t); g.gain.linearRampToValueAtTime(0.001, t + 0.6);
      o.connect(g); o.start(t); o.stop(t + 0.6);
    } else if (kind === 'pickup') {
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(500, t); o.frequency.setValueAtTime(750, t + 0.08);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); o.start(t); o.stop(t + 0.2);
    } else if (kind === 'win') {
      [262, 330, 392, 523].forEach((f, i) => {
        const o = ac.createOscillator(); o.type = 'triangle';
        o.frequency.value = f;
        const gg = ac.createGain(); gg.connect(ac.destination);
        gg.gain.setValueAtTime(0.15, t + i * 0.15);
        gg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.4);
        o.connect(gg); o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.4);
      });
    }
  } catch (e) { /* audio blocked; ignore */ }
}

// ---------------------------------------------------------------- STATE
let player, demons, pickups, keys, state, mouseLocked = false;
let flash = 0, hurtFlash = 0, weaponFrame = 0, bobPhase = 0, faceTimer = 0, faceState = 'idle';
let killCount = 0, totalDemons = 0, winTime = 0;

function reset() {
  player = { x: 2.5, y: 2.5, a: 0.9, hp: 100, ammo: 24, cooldown: 0 };
  for (const k in doors) delete doors[k];
  demons = [
    { x: 6.5, y: 4.5 }, { x: 4.5, y: 7.8 }, { x: 12.0, y: 7.0 },
    { x: 16.5, y: 5.0 }, { x: 21.5, y: 5.5 }, { x: 21.5, y: 12.5 },
    { x: 5.0, y: 11.0 }, { x: 12.0, y: 11.0 }, { x: 16.0, y: 15.5 },
    { x: 6.0, y: 15.5 }, { x: 9.0, y: 19.5 }, { x: 11.5, y: 15.0 },
    { x: 6.0, y: 20.0 }, { x: 21.0, y: 20.0 }, { x: 17.0, y: 22.5 },
  ].map(p => ({ ...p, hp: 40, state: 'idle', anim: 0, atkT: 0, painT: 0, deadT: 0 }));
  totalDemons = demons.length; killCount = 0;
  pickups = [
    { x: 8.5, y: 2.0, kind: 'ammo' }, { x: 2.0, y: 8.5, kind: 'health' },
    { x: 14.5, y: 2.0, kind: 'ammo' }, { x: 22.5, y: 2.0, kind: 'health' },
    { x: 2.0, y: 11.5, kind: 'ammo' }, { x: 18.0, y: 10.5, kind: 'health' },
    { x: 15.5, y: 13.0, kind: 'ammo' }, { x: 2.0, y: 22.5, kind: 'health' },
    { x: 12.5, y: 22.5, kind: 'ammo' }, { x: 22.0, y: 16.0, kind: 'ammo' },
    { x: 5.5, y: 14.5, kind: 'health' }, { x: 12.5, y: 19.5, kind: 'ammo' },
  ];
  keys = {};
  state = 'play';
  flash = hurtFlash = weaponFrame = 0;
}

// ---------------------------------------------------------------- INPUT
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') e.preventDefault();
  if ((e.code === 'KeyE' || e.code === 'Space') && state === 'play') useDoor();
  if (e.code === 'ControlLeft' && state === 'play') fire();
  if (e.code === 'KeyR' && (state === 'dead' || state === 'win')) { reset(); }
});
document.addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('click', () => {
  if (state !== 'play') { if (state !== 'menu') reset(); return; }
  if (!mouseLocked) canvas.requestPointerLock();
  fire();
});
document.addEventListener('pointerlockchange', () => { mouseLocked = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', e => {
  if (mouseLocked && state === 'play') player.a += e.movementX * 0.0022;
});

// ---------------------------------------------------------------- HELPERS
function lineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, dist = Math.hypot(dx, dy);
  const steps = Math.ceil(dist * 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (solid(x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

function castRay(px, py, ang) {
  // DDA — returns {dist, tile, texX, side, mx, my}
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let mx = px | 0, my = py | 0;
  const ddx = Math.abs(1 / (dx || 1e-9)), ddy = Math.abs(1 / (dy || 1e-9));
  let sx, sy, sdx, sdy;
  if (dx < 0) { sx = -1; sdx = (px - mx) * ddx; } else { sx = 1; sdx = (mx + 1 - px) * ddx; }
  if (dy < 0) { sy = -1; sdy = (py - my) * ddy; } else { sy = 1; sdy = (my + 1 - py) * ddy; }
  let side = 0;
  for (let i = 0; i < 128; i++) {
    if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
    const t = at(mx, my);
    if (t > 0) {
      if (t === 5) {
        const d = doorAt(mx, my);
        if (d && d.t >= 1) continue; // fully open, ray passes
      }
      const dist = side === 0 ? sdx - ddx : sdy - ddy;
      let wallX = side === 0 ? py + dist * dy : px + dist * dx;
      wallX -= wallX | 0;
      if (t === 5) {
        const d = doorAt(mx, my);
        const open = d ? d.t : 0;
        if (wallX < open) { // slid-open part: ray continues
          continue;
        }
      }
      return { dist, tile: t, texX: wallX, side, mx, my };
    }
  }
  return { dist: 64, tile: 1, texX: 0, side: 0, mx: 0, my: 0 };
}

function tryMove(nx, ny) {
  const r = 0.25;
  if (!solid(nx + r, player.y) && !solid(nx - r, player.y)) player.x = nx;
  if (!solid(player.x, ny + r) && !solid(player.x, ny - r)) player.y = ny;
}

function useDoor() {
  const fx = player.x + Math.cos(player.a) * 1.1;
  const fy = player.y + Math.sin(player.a) * 1.1;
  for (const [cx, cy] of [[fx, fy], [player.x + Math.cos(player.a) * 0.6, player.y + Math.sin(player.a) * 0.6]]) {
    if (at(cx, cy) === 5) {
      const key = (cx | 0) + ',' + (cy | 0);
      if (!doors[key]) { doors[key] = { t: 0 }; sfx('door'); }
      return;
    }
  }
}

function fire() {
  if (player.cooldown > 0 || player.ammo <= 0 || state !== 'play') return;
  player.cooldown = 0.55;
  player.ammo--;
  weaponFrame = 0.001;
  flash = 0.1;
  faceState = 'fire'; faceTimer = 0.4;
  sfx('shot');
  // 3-pellet hitscan with slight spread
  for (const spread of [-0.03, 0, 0.03]) {
    const ang = player.a + spread;
    const wall = castRay(player.x, player.y, ang);
    let best = null, bestD = wall.dist;
    for (const d of demons) {
      if (d.state === 'dead') continue;
      const dx = d.x - player.x, dy = d.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > bestD) continue;
      // perpendicular distance from ray to demon center
      const cross = Math.abs(dx * Math.sin(ang) - dy * Math.cos(ang));
      const along = dx * Math.cos(ang) + dy * Math.sin(ang);
      if (along > 0 && cross < 0.35 && (!best || dist < Math.hypot(best.x - player.x, best.y - player.y))) best = d;
    }
    if (best) {
      best.hp -= 15;
      best.painT = 0.25;
      if (best.state === 'idle') best.state = 'chase';
      if (best.hp <= 0) {
        best.state = 'dead'; best.deadT = 0;
        killCount++;
        sfx('demonDie');
        if (Math.random() < 0.4) pickups.push({ x: best.x, y: best.y, kind: Math.random() < 0.5 ? 'ammo' : 'health' });
      } else sfx('demonHit');
    }
  }
}

// ---------------------------------------------------------------- UPDATE
function update(dt) {
  if (state !== 'play') return;

  // movement
  const sp = 3.2 * dt, rot = 2.4 * dt;
  let mvx = 0, mvy = 0;
  if (keys['KeyW'] || keys['ArrowUp']) { mvx += Math.cos(player.a); mvy += Math.sin(player.a); }
  if (keys['KeyS'] || keys['ArrowDown']) { mvx -= Math.cos(player.a); mvy -= Math.sin(player.a); }
  if (keys['KeyA']) { mvx += Math.sin(player.a); mvy -= Math.cos(player.a); }
  if (keys['KeyD']) { mvx -= Math.sin(player.a); mvy += Math.cos(player.a); }
  if (keys['ArrowLeft']) player.a -= rot;
  if (keys['ArrowRight']) player.a += rot;
  const ml = Math.hypot(mvx, mvy);
  if (ml > 0) {
    tryMove(player.x + (mvx / ml) * sp, player.y + (mvy / ml) * sp);
    bobPhase += dt * 9;
  }
  player.cooldown = Math.max(0, player.cooldown - dt);
  if (weaponFrame > 0) { weaponFrame += dt; if (weaponFrame > 0.45) weaponFrame = 0; }
  flash = Math.max(0, flash - dt);
  hurtFlash = Math.max(0, hurtFlash - dt * 2);
  faceTimer -= dt; if (faceTimer <= 0) faceState = 'idle';

  // doors
  for (const k in doors) {
    const d = doors[k];
    if (d.t < 1) d.t = Math.min(1, d.t + dt * 1.2);
  }

  // exit check
  if (at(player.x, player.y) === 9) { state = 'win'; winTime = 0; sfx('win'); document.exitPointerLock?.(); return; }

  // pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    if (Math.hypot(p.x - player.x, p.y - player.y) < 0.5) {
      if (p.kind === 'health') { if (player.hp >= 100) continue; player.hp = Math.min(100, player.hp + 25); }
      else player.ammo = Math.min(99, player.ammo + 8);
      pickups.splice(i, 1);
      sfx('pickup');
    }
  }

  // demons
  for (const d of demons) {
    if (d.state === 'dead') { d.deadT += dt; continue; }
    d.painT = Math.max(0, d.painT - dt);
    const dx = player.x - d.x, dy = player.y - d.y;
    const dist = Math.hypot(dx, dy);
    const sees = dist < 12 && lineOfSight(d.x, d.y, player.x, player.y);
    if (d.state === 'idle' && sees && dist < 9) d.state = 'chase';
    if (d.state === 'chase') {
      d.anim += dt * 6;
      if (dist > 1.1 && d.painT <= 0) {
        const s = 1.6 * dt;
        const nx = d.x + (dx / dist) * s, ny = d.y + (dy / dist) * s;
        if (!solid(nx, d.y)) d.x = nx;
        if (!solid(d.x, ny)) d.y = ny;
      }
      d.atkT -= dt;
      if (dist < 4.5 && sees && d.atkT <= 0) {
        d.atkT = 1.3;
        d.attackFlash = 0.3;
        // melee/spit damage scaled by distance
        const dmg = dist < 1.6 ? 14 : 7;
        player.hp -= dmg;
        hurtFlash = 1;
        faceState = 'hurt'; faceTimer = 0.6;
        sfx('hurt');
        if (player.hp <= 0) {
          player.hp = 0; state = 'dead';
          document.exitPointerLock?.();
        }
      }
    }
    if (d.attackFlash > 0) d.attackFlash -= dt;
  }
}

// ---------------------------------------------------------------- RENDER
const depth = new Float32Array(W);

function render(now) {
  // ceiling & floor
  ctx.fillStyle = '#33272a'; ctx.fillRect(0, 0, W, VIEW_H / 2);
  ctx.fillStyle = '#3d3a33'; ctx.fillRect(0, VIEW_H / 2, W, VIEW_H / 2);
  // distance-darkened floor/ceiling bands
  for (let i = 0; i < 8; i++) {
    const a = 0.34 - i * 0.045;
    if (a <= 0) break;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    const band = (VIEW_H / 2) * (1 - i / 8) * 0.25;
    ctx.fillRect(0, VIEW_H / 2 - band - i * band, W, band * 1.02);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, VIEW_H / 2 - 14, W, 28);

  const bob = weaponFrame === 0 ? Math.sin(bobPhase) * 3 : 0;

  // walls
  const COL = 2; // render every 2px column for speed
  for (let sx = 0; sx < W; sx += COL) {
    const rayA = player.a + Math.atan((sx / W - 0.5) * 2 * Math.tan(FOV / 2));
    const r = castRay(player.x, player.y, rayA);
    const corr = r.dist * Math.cos(rayA - player.a);
    depth[sx] = corr; if (COL > 1) depth[sx + 1] = corr;
    const h = Math.min(VIEW_H * 3, VIEW_H / corr);
    const y0 = (VIEW_H - h) / 2 + bob;
    const tex = wallTex[r.tile] || texBrick;
    let tx = (r.texX * TEX) | 0;
    if (r.tile === 5) {
      const d = doorAt(r.mx, r.my);
      if (d) tx = ((r.texX - d.t) * TEX) | 0; // door slides sideways
      if (tx < 0) tx = 0;
    }
    ctx.drawImage(tex, tx, 0, 1, TEX, sx, y0, COL, h);
    // shading: side + distance
    const shade = Math.min(0.85, (r.side ? 0.18 : 0) + corr * 0.055);
    if (shade > 0.02) {
      ctx.fillStyle = `rgba(0,0,0,${shade})`;
      ctx.fillRect(sx, y0, COL, h);
    }
    if (r.tile === 9) { // exit glow pulse
      ctx.fillStyle = `rgba(80,200,255,${0.15 + 0.1 * Math.sin(now / 200)})`;
      ctx.fillRect(sx, y0, COL, h);
    }
  }

  // sprites (demons + pickups), sorted far→near
  const sprites = [];
  for (const d of demons) sprites.push({ x: d.x, y: d.y, d });
  for (const p of pickups) sprites.push({ x: p.x, y: p.y, p });
  for (const s of sprites) s.dist = Math.hypot(s.x - player.x, s.y - player.y);
  sprites.sort((a, b) => b.dist - a.dist);

  for (const s of sprites) {
    const dx = s.x - player.x, dy = s.y - player.y;
    let ang = Math.atan2(dy, dx) - player.a;
    while (ang > Math.PI) ang -= 2 * Math.PI;
    while (ang < -Math.PI) ang += 2 * Math.PI;
    if (Math.abs(ang) > FOV / 2 + 0.4 || s.dist < 0.3) continue;
    const corr = s.dist * Math.cos(ang);
    if (corr < 0.2) continue;
    const size = VIEW_H / corr;
    const sxc = W / 2 + Math.tan(ang) / Math.tan(FOV / 2) * (W / 2);
    let img, drawSize = size, yOff = 0;
    if (s.d) {
      const d = s.d;
      if (d.state === 'dead') img = spDemonDead;
      else if (d.painT > 0) img = spDemon[3];
      else if (d.attackFlash > 0) img = spDemon[2];
      else if (d.state === 'chase') img = spDemon[(d.anim | 0) % 2 === 0 ? 1 : 0];
      else img = spDemon[0];
    } else {
      img = s.p.kind === 'health' ? spHealth : spAmmo;
      drawSize = size * 0.7; yOff = size * 0.3;
    }
    const x0 = sxc - drawSize / 2;
    const y0 = (VIEW_H - size) / 2 + bob + yOff + (size - drawSize);
    // per-column depth clip
    const step = Math.max(1, COL);
    for (let cx = Math.max(0, x0 | 0); cx < Math.min(W, x0 + drawSize); cx += step) {
      const di = Math.min(W - 1, cx) & ~(COL - 1);
      if (depth[di] <= corr) continue;
      const u = (cx - x0) / drawSize;
      ctx.drawImage(img, (u * img.width) | 0, 0, Math.max(1, (step / drawSize) * img.width), img.height,
        cx, y0, step, drawSize);
    }
    // distance shade on sprite
    const shade = Math.min(0.6, corr * 0.05);
    if (shade > 0.03 && s.d && s.d.state !== 'dead') { /* skip per-pixel; cheap global ok */ }
  }

  // muzzle flash light
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,200,80,${flash * 2.5})`;
    ctx.fillRect(0, 0, W, VIEW_H);
  }

  drawWeapon(now);
  drawHUD(now);

  // hurt flash
  if (hurtFlash > 0) {
    ctx.fillStyle = `rgba(200,0,0,${hurtFlash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (state === 'dead') drawEndScreen('YOU DIED', '#f22', 'The demons feast tonight.');
  if (state === 'win') {
    winTime += 1 / 60;
    drawEndScreen('LEVEL COMPLETE', '#5cf', `Kills: ${killCount} / ${totalDemons}`);
  }
}

function drawWeapon(now) {
  const cx = W / 2, baseY = VIEW_H;
  const bob = Math.sin(bobPhase) * 4, bobX = Math.cos(bobPhase * 0.5) * 6;
  let kick = 0;
  if (weaponFrame > 0) kick = Math.sin(Math.min(1, weaponFrame / 0.45) * Math.PI) * 26;
  const x = cx + bobX, y = baseY + bob + kick;
  // muzzle flash sprite
  if (flash > 0) {
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + now / 50;
      const r = i % 2 ? 18 : 42;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y - 118 + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y - 118, 12, 0, 7); ctx.fill();
  }
  // shotgun: barrel + pump + stock, simple shapes
  ctx.fillStyle = '#2b2b2e';
  ctx.fillRect(x - 14, y - 120, 28, 70); // barrel
  ctx.fillStyle = '#1c1c1f';
  ctx.fillRect(x - 14, y - 120, 28, 8);
  ctx.fillStyle = '#54341f';
  ctx.fillRect(x - 20, y - 52, 40, 26); // pump (wood)
  ctx.fillStyle = '#3c2413';
  ctx.fillRect(x - 20, y - 52, 40, 6);
  ctx.fillStyle = '#5f3d22';
  ctx.beginPath();
  ctx.moveTo(x - 26, y - 26); ctx.lineTo(x + 26, y - 26);
  ctx.lineTo(x + 44, y + 2); ctx.lineTo(x - 44, y + 2);
  ctx.closePath(); ctx.fill();
  // hand
  ctx.fillStyle = '#c48b62';
  ctx.fillRect(x - 16, y - 44, 32, 14);
}

function drawHUD(now) {
  const y = VIEW_H;
  ctx.fillStyle = '#3a3a3d'; ctx.fillRect(0, y, W, HUD_H);
  ctx.fillStyle = '#232326'; ctx.fillRect(0, y, W, 4);
  ctx.fillStyle = '#2c2c2f';
  for (let i = 0; i < W; i += 8) ctx.fillRect(i, y + 4, 4, HUD_H); // texture stripes

  ctx.textBaseline = 'alphabetic';
  const label = (t, lx) => { ctx.fillStyle = '#b8342a'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.fillText(t, lx, y + 22); };
  const big = (t, lx, col = '#e8d24a') => { ctx.fillStyle = col; ctx.font = 'bold 34px monospace'; ctx.textAlign = 'center'; ctx.fillText(t, lx, y + 60); };

  label('AMMO', 80); big(String(player.ammo), 80, player.ammo === 0 ? '#f44' : '#e8d24a');
  label('HEALTH', 220); big(player.hp + '%', 220, player.hp < 30 ? '#f44' : '#e8d24a');
  label('KILLS', 470); big(`${killCount}/${totalDemons}`, 470);
  label('ARMS', 560); big('2', 560, '#8ac');

  drawFace(330, y + 12, now);
}

function drawFace(fx, fy, now) {
  const hp = player.hp;
  ctx.fillStyle = '#232326'; ctx.fillRect(fx - 4, fy - 4, 64, 64);
  // skin gets bloodier as hp drops
  const blood = 1 - hp / 100;
  ctx.fillStyle = `rgb(${196 + blood * 40 | 0},${139 - blood * 80 | 0},${98 - blood * 60 | 0})`;
  ctx.fillRect(fx + 6, fy + 4, 44, 52);
  // hair
  ctx.fillStyle = '#6e4a22'; ctx.fillRect(fx + 4, fy, 48, 12);
  // eyes look around
  const look = state === 'play' ? Math.sin(now / 700) * 4 : 0;
  ctx.fillStyle = '#fff';
  ctx.fillRect(fx + 12, fy + 20, 12, 8); ctx.fillRect(fx + 32, fy + 20, 12, 8);
  ctx.fillStyle = '#223';
  if (faceState === 'hurt') { // squint
    ctx.fillStyle = `rgb(${196 + blood * 40 | 0},${139 - blood * 80 | 0},${98 - blood * 60 | 0})`;
    ctx.fillRect(fx + 12, fy + 20, 12, 4); ctx.fillRect(fx + 32, fy + 20, 12, 4);
    ctx.fillStyle = '#223';
    ctx.fillRect(fx + 14 + look, fy + 24, 5, 4); ctx.fillRect(fx + 34 + look, fy + 24, 5, 4);
  } else {
    ctx.fillRect(fx + 14 + look, fy + 22, 5, 5); ctx.fillRect(fx + 34 + look, fy + 22, 5, 5);
  }
  // mouth
  ctx.fillStyle = '#3a1512';
  if (state === 'dead') { ctx.fillRect(fx + 20, fy + 42, 16, 10); }
  else if (faceState === 'fire') { ctx.fillRect(fx + 16, fy + 42, 24, 4); } // grit teeth
  else if (faceState === 'hurt') { ctx.fillRect(fx + 22, fy + 40, 12, 8); }
  else ctx.fillRect(fx + 18, fy + 44, 20, 4);
  if (faceState === 'fire') { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(fx + 17, fy + 42, 22, 2); }
  // blood streaks
  if (blood > 0.3) { ctx.fillStyle = '#8a1410'; ctx.fillRect(fx + 10, fy + 12, 3, 20 * blood + 10); ctx.fillRect(fx + 44, fy + 16, 3, 16 * blood + 8); }
  if (state === 'dead') { ctx.fillStyle = '#8a1410'; ctx.fillRect(fx + 6, fy + 4, 44, 52 * 0.2); }
}

function drawEndScreen(title, col, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = col; ctx.font = 'bold 52px monospace';
  ctx.fillText(title, W / 2, H / 2 - 20);
  ctx.fillStyle = '#ccc'; ctx.font = '20px monospace';
  ctx.fillText(sub, W / 2, H / 2 + 18);
  ctx.fillStyle = '#888'; ctx.font = '16px monospace';
  ctx.fillText('Press R or click to restart', W / 2, H / 2 + 52);
}

// ---------------------------------------------------------------- LOOP
let last = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  update(dt);
  render(now);
  requestAnimationFrame(loop);
}

state = 'menu';
document.getElementById('start').addEventListener('click', () => {
  document.getElementById('overlay').classList.add('hidden');
  audio(); // unlock on gesture
  reset();
  canvas.requestPointerLock();
});
reset(); state = 'menu';
requestAnimationFrame(loop);
