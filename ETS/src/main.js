import * as THREE from 'three';
import { initScene } from './sceneSetup.js';
import { VFXManager } from './vfxManager.js';
import { Turret, TURRET_SKINS } from './turret.js';
import { MeteorManager } from './meteorManager.js';

const env = initScene();
const vfx = new VFXManager(env.scene);
const turret = new Turret(env.scene);
const meteorMgr = new MeteorManager(env.scene, vfx);

// --- KONFIGURASI SENJATA (Syarat: Variasi Senjata 3 Jenis) ---
const WEAPONS = {
  1: { name: 'Laser',   color: 0x38bdf8, damage: 1.2, cooldown: 170, aoe: 0,   pierce: false, sound: 'shoot_laser',   maxAmmo: Infinity },
  2: { name: 'Missile', color: 0xf97316, damage: 4.2, cooldown: 640, aoe: 8.5, pierce: false, sound: 'shoot_missile', maxAmmo: 7 },
  3: { name: 'Railgun', color: 0xa855f7, damage: 6.5, cooldown: 860, aoe: 0,   pierce: true,  sound: 'shoot_railgun', maxAmmo: 3 }
};

let currentWeapon = 1;
let lastShotTime = 0;
let planetThemeIndex = 0;

// --- STATE PERMAINAN, UPGRADE & POWER-UP ---
let highScore = parseInt(localStorage.getItem('meteor_defense_hi') || '0', 10);

let state = {
  mode: 'Campaign', // 'Campaign' atau 'Endless'
  hp: 100,
  score: 0,
  coins: 100, // Modal awal koin untuk mencoba upgrade/power-up
  combo: 1,
  wave: 1,
  maxWave: 3,
  spawnedInWave: 0,
  targetPerWave: 8,
  isGameOver: false,
  isPaused: false,
  // Amunisi & Reload (Laser: Tak Terbatas, Missile: 7, Railgun: 3)
  ammo: {
    1: Infinity,
    2: 7,
    3: 3
  },
  maxAmmo: {
    1: Infinity,
    2: 7,
    3: 3
  },
  reloading: {
    2: false,
    3: false
  },
  reloadTimers: {
    2: 0,
    3: 0
  },
  reloadDurations: {
    2: 1.6, // Missile: reload taktis 1.6 detik
    3: 3.2  // Railgun: recharge kapasitor berat 3.2 detik (lebih lama)
  },
  // Upgrades
  dmgLevel: 1,
  rateLevel: 1,
  ammoLevel: 1,
  rotLevel: 1,
  // Power-ups
  shieldActive: false,
  timeSlowTimer: 0,
  doubleScoreTimer: 0,
  // Alarm
  alarmCooldown: 0
};

// --- INTERAKSI RAYCASTER (Syarat C.6: THREE.Raycaster Wajib) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const aimTarget = new THREE.Vector3();

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, env.camera);
  raycaster.ray.at(50, aimTarget);
  if (aimTarget) turret.aimAt(aimTarget);
});

window.addEventListener('pointerdown', (e) => {
  // Abaikan klik tombol HUD / saat modal terbuka / saat game over / saat pause
  if (e.target.tagName === 'BUTTON' || e.button !== 0 || state.isGameOver || state.isPaused) return;

  handleShoot();
});

function handleShoot() {
  if (currentWeapon !== 1) {
    if (state.reloading[currentWeapon]) {
      vfx.playSound('reload');
      return;
    }

    if (state.ammo[currentWeapon] <= 0) {
      reloadAmmo(currentWeapon);
      return;
    }
  }

  const now = performance.now();
  const wpn = WEAPONS[currentWeapon];
  const effectiveCooldown = wpn.cooldown * Math.pow(0.86, state.rateLevel - 1);
  if (now - lastShotTime < effectiveCooldown) return;
  lastShotTime = now;

  // Kurangi amunisi (hanya untuk Missile & Railgun, Laser tak terbatas)
  if (currentWeapon !== 1) {
    state.ammo[currentWeapon]--;
  }
  turret.triggerRecoil();
  vfx.playSound(wpn.sound);

  raycaster.setFromCamera(mouse, env.camera);
  const hits = raycaster.intersectObjects(meteorMgr.meteors, false);
  const muzzlePos = turret.getMuzzleWorldPosition();
  const beamColor = currentWeapon === 1 ? TURRET_SKINS[turret.skinIndex].beam : wpn.color;

  const dmgMultiplier = 1 + (state.dmgLevel - 1) * 0.3;

  if (currentWeapon === 2) {
    // [SENJATA 2: PELURU KENDALI MISSILE AOE]
    const targetPos = hits.length > 0 ? hits[0].point : (aimTarget.clone() || new THREE.Vector3(0, 10, -20));
    vfx.createMissile(muzzlePos, targetPos, (impactPos) => {
      vfx.createExplosion(impactPos, 0xf97316, 32, 18);
      vfx.playSound('explosion');
      vfx.triggerScreenShake(0.7);

      // Area of Effect Damage ke seluruh meteor di sekitar titik ledakan
      meteorMgr.meteors.forEach((m) => {
        if (m.position.distanceTo(impactPos) <= wpn.aoe) {
          applyDamage(m, wpn.damage * dmgMultiplier, 0, beamColor);
        }
      });
      checkDestroyedMeteors();
    });

    if (hits.length > 0) incrementCombo();
    else resetCombo();

  } else if (currentWeapon === 3) {
    // [SENJATA 3: RAILGUN PIERCE SEMUA TARGET SEJAJAR]
    const endPoint = aimTarget.clone() || new THREE.Vector3(0, 10, -40);
    vfx.createBeam(muzzlePos, endPoint, beamColor, true);
    vfx.triggerScreenShake(0.5);

    if (hits.length > 0) {
      hits.forEach((h) => {
        applyDamage(h.object, wpn.damage * dmgMultiplier, 0, beamColor);
      });
      incrementCombo();
    } else {
      resetCombo();
    }
  } else {
    // [SENJATA 1: LASER INSTAN CEPAT]
    if (hits.length > 0) {
      const hitObj = hits[0].object;
      vfx.createBeam(muzzlePos, hits[0].point, beamColor, false);
      applyDamage(hitObj, wpn.damage * dmgMultiplier, 0, beamColor);
      incrementCombo();
    } else {
      vfx.createBeam(muzzlePos, aimTarget, beamColor, false);
      resetCombo();
    }
  }

  updateHUD();
}

function incrementCombo() {
  state.combo = Math.min(state.combo + 1, 10);
  triggerComboStreak(state.combo);
}

function resetCombo() {
  state.combo = 1;
}

let streakTimeout = null;
function triggerComboStreak(combo) {
  const streakEl = document.getElementById('combo-streak');
  if (!streakEl) return;
  let title = '';
  if (combo === 3) title = 'COMBO x3! TRIPLE STRIKE!';
  else if (combo === 5) title = 'COMBO x5! MEGA BLAST! 🔥';
  else if (combo === 8) title = 'COMBO x8! UNSTOPPABLE! ⚡';
  else if (combo === 10) title = 'COMBO x10! GODLIKE DEFENDER! 👑';
  else return;

  streakEl.textContent = title;
  streakEl.classList.remove('hidden');
  vfx.playSound('powerup');
  if (streakTimeout) clearTimeout(streakTimeout);
  streakTimeout = setTimeout(() => {
    streakEl.classList.add('hidden');
  }, 1500);
}

function reloadAmmo(targetWeapon = currentWeapon) {
  if (targetWeapon === 1) {
    let triggered = false;
    if (state.ammo[2] < state.maxAmmo[2] && !state.reloading[2]) {
      startWeaponReload(2);
      triggered = true;
    }
    if (state.ammo[3] < state.maxAmmo[3] && !state.reloading[3]) {
      startWeaponReload(3);
      triggered = true;
    }
    if (triggered) {
      vfx.playSound('reload');
      updateHUD();
    }
    return;
  }

  if (state.ammo[targetWeapon] < state.maxAmmo[targetWeapon] && !state.reloading[targetWeapon]) {
    startWeaponReload(targetWeapon);
    vfx.playSound('reload');
    updateHUD();
  }
}

function startWeaponReload(wpnId) {
  state.reloading[wpnId] = true;
  state.reloadTimers[wpnId] = state.reloadDurations[wpnId];
}

function applyDamage(meteor, dmg, aoe, color) {
  meteor.userData.hp -= dmg;
  meteor.userData.flashTime = 0.08;
  meteor.material.emissive.setHex(0xffffff); // Flash putih saat kena tembakan

  vfx.createExplosion(meteor.position, color, 8, 8);

  if (aoe > 0) {
    meteorMgr.meteors.forEach((other) => {
      if (other !== meteor && other.position.distanceTo(meteor.position) <= aoe) {
        other.userData.hp -= dmg * 0.75;
      }
    });
  }
  checkDestroyedMeteors();
}

function checkDestroyedMeteors() {
  for (let i = meteorMgr.meteors.length - 1; i >= 0; i--) {
    const m = meteorMgr.meteors[i];
    if (m.userData.hp <= 0) {
      const isBoss = m.userData.type === 'boss';
      vfx.createExplosion(m.position, isBoss ? 0xa855f7 : 0xf97316, isBoss ? 60 : 25, isBoss ? 24 : 16);
      vfx.playSound('explosion');

      if (isBoss) {
        vfx.triggerScreenShake(1.5);
      }

      if (m.userData.type === 'cluster') {
        meteorMgr.spawnClusterShards(m.position);
      }

      const mult = state.doubleScoreTimer > 0 ? 2 : 1;
      state.score += m.userData.score * state.combo * mult;
      state.coins += m.userData.coins;

      if (state.score > highScore) {
        highScore = state.score;
        localStorage.setItem('meteor_defense_hi', String(highScore));
      }

      env.scene.remove(m);
      meteorMgr.meteors.splice(i, 1);
    }
  }
  updateHUD();
}

// --- SISTEM UPGRADE, POWER-UP & KUSTOMISASI ---
function upgradeDamage() {
  const cost = state.dmgLevel * 50;
  if (state.coins >= cost) {
    state.coins -= cost;
    state.dmgLevel++;
    vfx.playSound('powerup');
    updateHUD();
  }
}

function upgradeFireRate() {
  const cost = state.rateLevel * 50;
  if (state.coins >= cost) {
    state.coins -= cost;
    state.rateLevel++;
    vfx.playSound('powerup');
    updateHUD();
  }
}

function upgradeAmmoCap() {
  const cost = state.ammoLevel * 40;
  if (state.coins >= cost) {
    state.coins -= cost;
    state.ammoLevel++;
    state.maxAmmo[2] += 2; // Missile +2 (7 -> 9 -> 11)
    state.maxAmmo[3] += 1; // Railgun +1 (3 -> 4 -> 5)
    state.ammo[2] = state.maxAmmo[2];
    state.ammo[3] = state.maxAmmo[3];
    vfx.playSound('powerup');
    updateHUD();
  }
}

function upgradeRotSpeed() {
  const cost = state.rotLevel * 40;
  if (state.coins >= cost) {
    state.coins -= cost;
    state.rotLevel++;
    turret.rotationSpeed += 3.0;
    vfx.playSound('powerup');
    updateHUD();
  }
}

function activateShield() {
  if (state.coins >= 80 && !state.shieldActive) {
    state.coins -= 80;
    state.shieldActive = true;
    env.shieldDome.visible = true;
    vfx.playSound('shield');
    updateHUD();
  }
}

function activateEMP() {
  if (state.coins >= 120 && meteorMgr.meteors.length > 0) {
    state.coins -= 120;
    vfx.triggerScreenShake(1.3);
    vfx.playSound('emp');
    meteorMgr.meteors.forEach((m) => { m.userData.hp = 0; });
    checkDestroyedMeteors();
  }
}

function activateTimeSlow() {
  if (state.coins >= 70) {
    state.coins -= 70;
    state.timeSlowTimer = 6.0;
    vfx.playSound('powerup');
    updateHUD();
  }
}

function activateDoubleScore() {
  if (state.coins >= 60) {
    state.coins -= 60;
    state.doubleScoreTimer = 8.0;
    vfx.playSound('powerup');
    updateHUD();
  }
}

// --- SISTEM PAPAN PERINGKAT (LEADERBOARD LOKAL) ---
function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem('meteor_defense_lb') || '[]');
  } catch (_) {
    return [];
  }
}

function saveScoreToLeaderboard(score, wave, mode) {
  const lb = getLeaderboard();
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  lb.push({ score, wave, mode, date: dateStr });
  lb.sort((a, b) => b.score - a.score);
  const top5 = lb.slice(0, 5);
  localStorage.setItem('meteor_defense_lb', JSON.stringify(top5));
  renderLeaderboard();
}

function renderLeaderboard() {
  const tbody = document.getElementById('leaderboard-tbody');
  const lb = getLeaderboard();
  if (!tbody) return;
  if (lb.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:16px;">Belum ada riwayat skor tercatat</td></tr>';
    return;
  }
  tbody.innerHTML = lb.map((entry, idx) => `
    <tr>
      <td style="color:${idx === 0 ? '#facc15' : '#38bdf8'}; font-weight:bold;">#${idx + 1}</td>
      <td>${entry.mode}</td>
      <td>Wave ${entry.wave}</td>
      <td style="font-weight:bold; color:#4ade80;">${entry.score.toLocaleString()}</td>
      <td style="color:#94a3b8; font-size:0.78rem;">${entry.date}</td>
    </tr>
  `).join('');
}

function openLeaderboard() {
  renderLeaderboard();
  document.getElementById('leaderboard-modal').classList.remove('hidden');
}

function closeLeaderboard() {
  document.getElementById('leaderboard-modal').classList.add('hidden');
}

// --- SISTEM AUDIO LATAR BELAKANG (BGM: assets/music/music.mp3) ---
const bgm = document.getElementById('bgm-player');
let isMusicMuted = false;
let wasPlayingBeforePause = false;

if (bgm) {
  bgm.volume = 0.35; // Proporsi volume seimbang agar SFX tembakan/ledakan terdengar jelas
}

function updateMusicHUD() {
  const btn = document.getElementById('btn-music');
  if (!btn) return;
  if (isMusicMuted || !bgm || bgm.paused) {
    btn.textContent = '[N] Musik: 🔇 OFF';
    btn.classList.remove('highlight-btn');
  } else {
    btn.textContent = '[N] Musik: 🔊 ON';
    btn.classList.add('highlight-btn');
  }
}

function toggleMusic(forceState = null) {
  if (!bgm) return;
  if (forceState !== null) isMusicMuted = !forceState;
  else isMusicMuted = !isMusicMuted;

  if (isMusicMuted) {
    bgm.pause();
  } else {
    bgm.play().then(() => updateMusicHUD()).catch(() => {});
  }
  updateMusicHUD();
}

// Mulai musik saat gesture interaksi pertama kali (mematuhi browser autoplay policy)
function initMusicOnGesture() {
  if (bgm && !isMusicMuted && bgm.paused) {
    bgm.play().then(() => {
      updateMusicHUD();
    }).catch(() => {});
  }
}
['pointerdown', 'keydown', 'click'].forEach((evt) => {
  window.addEventListener(evt, initMusicOnGesture, { once: true });
});

// --- SISTEM PAUSE GAME (RESUME & RESTART) ---
function togglePause(forceState = null) {
  if (state.isGameOver) return; // Jika sudah mati/game over, modal game over yang aktif

  const targetState = forceState !== null ? forceState : !state.isPaused;
  state.isPaused = targetState;
  const pauseModal = document.getElementById('pause-modal');
  if (state.isPaused) {
    pauseModal.classList.remove('hidden');
    if (bgm && !bgm.paused) {
      bgm.pause();
      wasPlayingBeforePause = true;
    }
  } else {
    pauseModal.classList.add('hidden');
    clock.getDelta(); // Reset clock delta agar tidak ada lonjakan dt setelah unpause
    if (bgm && wasPlayingBeforePause && !isMusicMuted) {
      bgm.play().then(() => updateMusicHUD()).catch(() => {});
      wasPlayingBeforePause = false;
    }
  }
  updateMusicHUD();
}

document.getElementById('btn-pause').addEventListener('click', () => togglePause(true));
document.getElementById('btn-resume').addEventListener('click', () => togglePause(false));
document.getElementById('btn-pause-restart').addEventListener('click', () => {
  togglePause(false);
  restartGame();
});

// --- EVENT LISTENER TOMBOL HUD & KEYBOARD ---
document.getElementById('btn-upg-dmg').addEventListener('click', upgradeDamage);
document.getElementById('btn-upg-rate').addEventListener('click', upgradeFireRate);
document.getElementById('btn-upg-ammo').addEventListener('click', upgradeAmmoCap);
document.getElementById('btn-upg-rot').addEventListener('click', upgradeRotSpeed);

document.getElementById('btn-pw-shield').addEventListener('click', activateShield);
document.getElementById('btn-pw-emp').addEventListener('click', activateEMP);
document.getElementById('btn-pw-slow').addEventListener('click', activateTimeSlow);
document.getElementById('btn-pw-dbl').addEventListener('click', activateDoubleScore);

document.getElementById('btn-reload').addEventListener('click', reloadAmmo);

document.getElementById('btn-open-leaderboard').addEventListener('click', openLeaderboard);
document.getElementById('btn-view-leaderboard-modal').addEventListener('click', openLeaderboard);
document.getElementById('btn-close-leaderboard').addEventListener('click', closeLeaderboard);

document.getElementById('btn-cam').addEventListener('click', () => {
  const camName = env.nextCameraMode();
  document.getElementById('camera-mode-text').textContent = `Cam: ${camName} [K]`;
  document.getElementById('btn-cam').textContent = `[K] Cam: ${camName.split(' ')[0]}`;
});

document.getElementById('btn-skin').addEventListener('click', () => {
  const s = turret.cycleSkin();
  document.getElementById('btn-skin').textContent = `[T] Skin: ${s.name}`;
});

document.getElementById('btn-planet').addEventListener('click', () => {
  planetThemeIndex++;
  const name = env.applyPlanetTheme(planetThemeIndex);
  document.getElementById('btn-planet').textContent = `[B] Planet: ${name}`;
});

const btnMusicEl = document.getElementById('btn-music');
if (btnMusicEl) {
  btnMusicEl.addEventListener('click', () => toggleMusic());
}

document.getElementById('btn-gamemode').addEventListener('click', () => {
  state.mode = state.mode === 'Campaign' ? 'Endless' : 'Campaign';
  document.getElementById('btn-gamemode').textContent = `[M] Mode: ${state.mode}`;
  restartGame();
});

// Pilihan senjata via klik HUD kartu senjata
[1, 2, 3].forEach((wId) => {
  const el = document.getElementById(`wpn-${wId}`);
  if (el) {
    el.addEventListener('click', () => {
      currentWeapon = wId;
      document.querySelectorAll('.wpn-card').forEach((card, idx) => {
        card.classList.toggle('active', idx + 1 === currentWeapon);
      });
      updateHUD();
    });
  }
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  // Tombol Pause / Resume (P atau Escape)
  if (k === 'p' || k === 'escape') {
    const lbModal = document.getElementById('leaderboard-modal');
    if (!lbModal.classList.contains('hidden')) {
      closeLeaderboard();
      return;
    }
    togglePause();
    return;
  }

  // Jika game sedang di-pause atau sudah game over/mati, cegah input gameplay
  if (state.isPaused || state.isGameOver) return;

  if (['1', '2', '3'].includes(k)) {
    currentWeapon = parseInt(k, 10);
    document.querySelectorAll('.wpn-card').forEach((el, idx) => {
      el.classList.toggle('active', idx + 1 === currentWeapon);
    });
    updateHUD();
  } else if (k === 'r') reloadAmmo();
  else if (k === 'k') document.getElementById('btn-cam').click();
  else if (k === 'z') upgradeDamage();
  else if (k === 'x') upgradeFireRate();
  else if (k === 'c') upgradeAmmoCap();
  else if (k === 'v') upgradeRotSpeed();
  else if (k === 'q') activateShield();
  else if (k === 'e') activateEMP();
  else if (k === 'f') activateTimeSlow();
  else if (k === 'g') activateDoubleScore();
  else if (k === 't') document.getElementById('btn-skin').click();
  else if (k === 'b') document.getElementById('btn-planet').click();
  else if (k === 'n') toggleMusic();
  else if (k === 'm') document.getElementById('btn-gamemode').click();
  else if (k === 'l') openLeaderboard();
});

const keysDown = {};
window.addEventListener('keydown', (e) => {
  keysDown[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
  keysDown[e.key.toLowerCase()] = false;
});

// --- UI HUD & WIN/LOSE STATE ---
function updateHUD() {
  document.getElementById('hp-bar-fill').style.width = `${Math.max(0, state.hp)}%`;
  document.getElementById('score-text').textContent = `${state.score} (x${state.combo})`;
  document.getElementById('highscore-text').textContent = highScore;
  document.getElementById('coin-text').textContent = state.coins;

  // Update Amunisi & Reload Display
  const ammoBarFill = document.getElementById('ammo-bar-fill');
  const ammoText = document.getElementById('ammo-text');
  const ammoLabel = document.getElementById('ammo-label');
  const btnReload = document.getElementById('btn-reload');

  if (currentWeapon === 1) {
    ammoLabel.textContent = 'AMUNISI LASER:';
    ammoText.textContent = '∞ TAK TERBATAS';
    ammoBarFill.style.width = '100%';
    ammoBarFill.style.background = 'linear-gradient(90deg, #38bdf8, #818cf8)';
    btnReload.style.display = 'none'; // Sembunyikan tombol reload untuk Laser agar tidak bertumpukan
  } else {
    btnReload.style.display = 'inline-block';
    const curAmmo = state.ammo[currentWeapon];
    const maxAmmo = state.maxAmmo[currentWeapon];
    const isWpnReloading = state.reloading[currentWeapon];
    const timer = state.reloadTimers[currentWeapon];
    const dur = state.reloadDurations[currentWeapon];

    if (currentWeapon === 2) {
      ammoLabel.textContent = 'AMUNISI MISSILE:';
      if (isWpnReloading) {
        ammoText.textContent = `RELOADING (${timer.toFixed(1)}s)`;
        ammoBarFill.style.width = `${((dur - timer) / dur) * 100}%`;
        btnReload.textContent = 'Reloading...';
      } else {
        ammoText.textContent = `${curAmmo} / ${maxAmmo}`;
        ammoBarFill.style.width = `${(curAmmo / maxAmmo) * 100}%`;
        btnReload.textContent = '[R] Reload (1.6s)';
      }
      ammoBarFill.style.background = 'linear-gradient(90deg, #f97316, #ef4444)';
    } else {
      ammoLabel.textContent = 'AMUNISI RAILGUN:';
      if (isWpnReloading) {
        ammoText.textContent = `RECHARGING (${timer.toFixed(1)}s)`;
        ammoBarFill.style.width = `${((dur - timer) / dur) * 100}%`;
        btnReload.textContent = 'Recharging...';
      } else {
        ammoText.textContent = `${curAmmo} / ${maxAmmo}`;
        ammoBarFill.style.width = `${(curAmmo / maxAmmo) * 100}%`;
        btnReload.textContent = '[R] Reload (3.2s)';
      }
      ammoBarFill.style.background = 'linear-gradient(90deg, #a855f7, #c084fc)';
    }
  }

  // Update badge amunisi pada kartu senjata bawah tanpa menimpa keterangan/deskripsinya
  const w1Ammo = document.getElementById('w1-ammo');
  const w2Ammo = document.getElementById('w2-ammo');
  const w3Ammo = document.getElementById('w3-ammo');
  if (w1Ammo) w1Ammo.textContent = '∞';
  if (w2Ammo) {
    w2Ammo.textContent = state.reloading[2]
      ? `Reload ${state.reloadTimers[2].toFixed(1)}s`
      : `${state.ammo[2]}/${state.maxAmmo[2]}`;
    w2Ammo.style.color = state.reloading[2] ? '#facc15' : '#f97316';
  }
  if (w3Ammo) {
    w3Ammo.textContent = state.reloading[3]
      ? `Recharge ${state.reloadTimers[3].toFixed(1)}s`
      : `${state.ammo[3]}/${state.maxAmmo[3]}`;
    w3Ammo.style.color = state.reloading[3] ? '#facc15' : '#c084fc';
  }

  const waveLabel = state.mode === 'Campaign' ? `Wave ${state.wave}/${state.maxWave}` : `Endless Wave ${state.wave}`;
  document.getElementById('objective-text').textContent = `${state.mode}: ${waveLabel}`;

  const statusParts = [];
  if (state.shieldActive) statusParts.push('SHIELD ON');
  if (state.timeSlowTimer > 0) statusParts.push(`SLOW (${state.timeSlowTimer.toFixed(1)}s)`);
  if (state.doubleScoreTimer > 0) statusParts.push(`2X SCORE (${state.doubleScoreTimer.toFixed(1)}s)`);
  document.getElementById('shield-status-text').textContent = statusParts.length ? statusParts.join(' | ') : 'Active Buffs: None';

  document.getElementById('btn-upg-dmg').textContent = `[Z] Damage Lv.${state.dmgLevel} (${state.dmgLevel * 50}c)`;
  document.getElementById('btn-upg-rate').textContent = `[X] Fire Rate Lv.${state.rateLevel} (${state.rateLevel * 50}c)`;
  document.getElementById('btn-upg-ammo').textContent = `[C] Max Ammo Lv.${state.ammoLevel} (${state.ammoLevel * 40}c)`;
  document.getElementById('btn-upg-rot').textContent = `[V] Rot Speed Lv.${state.rotLevel} (${state.rotLevel * 40}c)`;
}

function endGame(isWin) {
  state.isGameOver = true;
  saveScoreToLeaderboard(state.score, state.wave, state.mode);

  if (bgm) bgm.volume = 0.12; // Kecilkan volume BGM saat layar game over / win muncul

  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');

  overlay.classList.remove('hidden');
  title.textContent = isWin ? 'VICTORY - PLANET TERLINDUNGI!' : 'GAME OVER - MARKAS HANCUR';
  title.style.color = isWin ? '#4ade80' : '#f87171';
  desc.textContent = `Mode: ${state.mode} | Skor Akhir: ${state.score} | High Score: ${highScore}`;
}

function restartGame() {
  meteorMgr.clearAll();
  env.shieldDome.visible = false;
  state = {
    ...state,
    hp: 100,
    score: 0,
    coins: 100,
    combo: 1,
    wave: 1,
    spawnedInWave: 0,
    targetPerWave: 8,
    isGameOver: false,
    ammo: { 1: Infinity, 2: 7, 3: 3 },
    maxAmmo: { 1: Infinity, 2: 7, 3: 3 },
    reloading: { 2: false, 3: false },
    reloadTimers: { 2: 0, 3: 0 },
    dmgLevel: 1,
    rateLevel: 1,
    ammoLevel: 1,
    rotLevel: 1,
    shieldActive: false,
    timeSlowTimer: 0,
    doubleScoreTimer: 0,
    alarmCooldown: 0
  };
  turret.rotationSpeed = 8.0;
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('leaderboard-modal').classList.add('hidden');
  document.getElementById('pause-modal').classList.add('hidden');
  clock.getDelta(); // Bersihkan delta clock setelah restart

  if (bgm && !isMusicMuted) {
    bgm.volume = 0.35;
    bgm.play().catch(() => {});
  }
  updateMusicHUD();
  updateHUD();
}

document.getElementById('btn-restart').addEventListener('click', restartGame);

// --- GAME LOOP UTAMA ---
const clock = new THREE.Clock();
let spawnTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // JIKA GAME OVER (MATI) ATAU DI-PAUSE: GAME BENAR-BENAR BERHENTI PENUH!
  if (state.isGameOver || state.isPaused) {
    env.renderer.render(env.scene, env.camera);
    return;
  }

  // Reload Amunisi Independen (Missile: 1.6s, Railgun: 3.2s)
  let reloadChanged = false;
  [2, 3].forEach((wId) => {
    if (state.reloading[wId]) {
      state.reloadTimers[wId] -= dt;
      reloadChanged = true;
      if (state.reloadTimers[wId] <= 0) {
        state.reloading[wId] = false;
        state.reloadTimers[wId] = 0;
        state.ammo[wId] = state.maxAmmo[wId];
        vfx.playSound('powerup');
      }
    }
  });
  if (reloadChanged) updateHUD();

  // Update Power-up Timers
  if (state.timeSlowTimer > 0) state.timeSlowTimer = Math.max(0, state.timeSlowTimer - dt);
  if (state.doubleScoreTimer > 0) state.doubleScoreTimer = Math.max(0, state.doubleScoreTimer - dt);
  const timeScale = state.timeSlowTimer > 0 ? 0.35 : 1.0;

  // Warning Alarm saat HP Markas Kritis (<= 30%)
  if (state.hp > 0 && state.hp <= 30 && !state.isGameOver) {
    state.alarmCooldown -= dt;
    if (state.alarmCooldown <= 0) {
      vfx.playSound('alarm');
      state.alarmCooldown = 1.8;
    }
  }

  // Spawner Gelombang Meteor
  if (!state.isGameOver) {
    spawnTimer += dt * timeScale;
    const spawnInterval = Math.max(0.55, 1.45 - state.wave * 0.12);

    if (spawnTimer >= spawnInterval && state.spawnedInWave < state.targetPerWave) {
      spawnTimer = 0;
      state.spawnedInWave++;
      const isBoss = state.spawnedInWave === state.targetPerWave && (state.wave === state.maxWave || state.wave % 3 === 0);
      meteorMgr.spawnMeteor(isBoss ? 'boss' : null);
    } else if (state.spawnedInWave >= state.targetPerWave && meteorMgr.meteors.length === 0) {
      if (state.mode === 'Campaign' && state.wave >= state.maxWave) {
        endGame(true);
      } else {
        state.wave++;
        state.spawnedInWave = 0;
        state.targetPerWave += 4;
        state.coins += 45; // Bonus koin setiap wave selesai
        updateHUD();
      }
    }
  }

  // Update Boss Health Bar di HUD
  const bossStatus = meteorMgr.getBossStatus();
  const bossHud = document.getElementById('boss-hud');
  if (bossStatus.active) {
    bossHud.classList.remove('hidden');
    const pct = Math.max(0, (bossStatus.hp / bossStatus.maxHp) * 100);
    document.getElementById('boss-bar-fill').style.width = `${pct}%`;
  } else {
    bossHud.classList.add('hidden');
  }

  // Update Meteor & Benturan Planet
  meteorMgr.update(dt, timeScale, (hitMeteor) => {
    vfx.createExplosion(hitMeteor.position, 0xef4444, 28, 18);
    vfx.playSound('hitPlanet');
    vfx.triggerScreenShake(0.95);

    if (state.shieldActive) {
      // Planet Shield menahan 1 hantaman meteor penuh
      state.shieldActive = false;
      env.shieldDome.visible = false;
    } else {
      state.hp -= hitMeteor.userData.type === 'boss' ? 45 : 15;
      resetCombo();
      if (state.hp <= 0) endGame(false);
    }
    updateHUD();
  });

  // Kontrol Kamera 360 Derajat via Tombol Panah
  if (keysDown['arrowleft']) env.rotateCamera(2.2 * dt, 0);
  if (keysDown['arrowright']) env.rotateCamera(-2.2 * dt, 0);
  if (keysDown['arrowup']) env.rotateCamera(0, -1.6 * dt);
  if (keysDown['arrowdown']) env.rotateCamera(0, 1.6 * dt);

  env.updateCamera(dt);

  // Perbarui bidikan raycaster setiap frame mengikuti orientasi kamera 360 derajat
  raycaster.setFromCamera(mouse, env.camera);
  raycaster.ray.at(50, aimTarget);
  if (aimTarget) turret.aimAt(aimTarget);

  turret.update(dt);
  vfx.update(dt, env.camera, env.baseCamPos, env.baseCamLook);
  env.starField.rotation.y += dt * 0.02;

  env.renderer.render(env.scene, env.camera);
}

renderLeaderboard();
updateHUD();
animate();