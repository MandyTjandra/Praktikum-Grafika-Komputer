// ============================================================================
// METEOR DEFENSE 3D - MAIN ORCHESTRATOR
// ============================================================================

import * as THREE from 'three';
import { initScene } from './sceneSetup.js';
import { VFXManager } from './vfxManager.js';
import { Turret } from './turret.js';
import { MeteorManager } from './meteorManager.js';
import { AudioManager } from './audioManager.js';
import { RadarManager } from './radarManager.js';
import { UIManager } from './uiManager.js';
import { WeaponSystem } from './weaponSystem.js';

// --- INISIALISASI SUBSISTEM UTAMA ---
const env = initScene();
const vfx = new VFXManager(env.scene);
const turret = new Turret(env.scene);
const meteorMgr = new MeteorManager(env.scene, vfx);
const audioMgr = new AudioManager(vfx);
const radarMgr = new RadarManager();

let planetThemeIndex = 0;
let highScore = parseInt(localStorage.getItem('meteor_defense_hi') || '0', 10);

// --- STATE PERMAINAN ---
let state = {
  isGameStarted: false,
  mode: 'Campaign', // 'Campaign' atau 'Endless'
  hp: 100,
  score: 0,
  coins: 150, // Modal awal ramah pemula
  combo: 1,
  wave: 1,
  maxWave: 3,
  spawnedInWave: 0,
  targetPerWave: 6, // Wave 1 hanya 6 meteor agar awal game lebih mudah
  isGameOver: false,
  isPaused: false,
  // Amunisi & Reload (Laser: Tak Terbatas, Missile: 7, Railgun: 3)
  ammo: { 1: Infinity, 2: 7, 3: 3 },
  maxAmmo: { 1: Infinity, 2: 7, 3: 3 },
  reloading: { 2: false, 3: false },
  reloadTimers: { 2: 0, 3: 0 },
  reloadDurations: { 2: 1.6, 3: 3.2 },
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

// --- INISIALISASI SENJATA & UI MANAGER ---
const weaponSys = new WeaponSystem(env, turret, vfx, meteorMgr);

const uiMgr = new UIManager({
  onStartGame: () => startGame(),
  onRestartGame: () => restartGame(),
  onReturnToStart: () => returnToStartScreen(),
  onTogglePause: (force) => togglePause(force),
  onSetMode: (mode) => setGameMode(mode),
  onSwitchWeapon: (wId) => {
    weaponSys.setWeapon(wId, () => updateHUD());
  },
  onOpenSettings: () => audioMgr.updateAudioUI()
});

function updateHUD() {
  uiMgr.updateHUD(state, weaponSys.currentWeapon, highScore);
}

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
  if (
    e.target.tagName === 'BUTTON' ||
    e.target.closest('button') ||
    e.target.closest('.modal-box') ||
    e.target.closest('.start-content-box') ||
    e.button !== 0 ||
    !state.isGameStarted ||
    state.isGameOver ||
    state.isPaused
  ) {
    return;
  }

  weaponSys.shoot(raycaster, mouse, aimTarget, state, {
    onUpdateHUD: () => updateHUD(),
    onIncrementCombo: () => {
      state.combo = Math.min(state.combo + 1, 10);
      uiMgr.triggerComboStreak(state.combo);
      if (state.combo >= 3) vfx.playSound('powerup');
    },
    onResetCombo: () => {
      state.combo = 1;
    },
    onSaveHighScore: (newScore) => {
      if (newScore > highScore) {
        highScore = newScore;
        localStorage.setItem('meteor_defense_hi', String(highScore));
      }
    }
  });
});

// --- SISTEM START SCREEN & GAME LIFECYCLE ---
function setGameMode(mode) {
  state.mode = mode;
  uiMgr.setModeUI(mode);
  updateHUD();
}

function startGame() {
  state.isGameStarted = true;
  state.isGameOver = false;
  state.isPaused = false;

  uiMgr.showHUD();
  clock.getDelta();
  spawnTimer = 0;

  vfx.initAudio();
  audioMgr.playBGM();
  updateHUD();
}

function returnToStartScreen() {
  meteorMgr.clearAll();
  env.shieldDome.visible = false;
  radarMgr.clear();

  state = {
    ...state,
    isGameStarted: false,
    hp: 100,
    score: 0,
    coins: 150,
    combo: 1,
    wave: 1,
    spawnedInWave: 0,
    targetPerWave: 6,
    isGameOver: false,
    isPaused: false,
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
  turret.rotationSpeed = 10.0;

  uiMgr.showStartScreen(state.mode);
}

function restartGame() {
  meteorMgr.clearAll();
  env.shieldDome.visible = false;
  radarMgr.clear();

  state = {
    ...state,
    isGameStarted: true,
    hp: 100,
    score: 0,
    coins: 150,
    combo: 1,
    wave: 1,
    spawnedInWave: 0,
    targetPerWave: 6,
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
  turret.rotationSpeed = 10.0;

  uiMgr.showHUD();
  clock.getDelta();
  spawnTimer = 0;

  audioMgr.playBGM();
  updateHUD();
}

function endGame(isWin) {
  state.isGameOver = true;
  uiMgr.saveScore(state.score, state.wave, state.mode);
  radarMgr.clear();
  audioMgr.setDuckVolume(0.12);

  uiMgr.showEndGameModal(isWin, state.score, highScore, state.mode);
}

function togglePause(forceState = null) {
  if (!state.isGameStarted || state.isGameOver) return;

  const target = forceState !== null ? forceState : !state.isPaused;
  state.isPaused = target;
  uiMgr.setPauseModal(state.isPaused);

  if (state.isPaused) {
    audioMgr.pauseBGM();
  } else {
    clock.getDelta();
    audioMgr.resumeBGM();
  }
}

// --- EVENT LISTENER KONTROL & KEYBOARD ---
document.getElementById('btn-upg-dmg').addEventListener('click', () => weaponSys.upgradeDamage(state, updateHUD));
document.getElementById('btn-upg-rate').addEventListener('click', () => weaponSys.upgradeFireRate(state, updateHUD));
document.getElementById('btn-upg-ammo').addEventListener('click', () => weaponSys.upgradeAmmoCap(state, updateHUD));
document.getElementById('btn-upg-rot').addEventListener('click', () => weaponSys.upgradeRotSpeed(state, updateHUD));

document.getElementById('btn-pw-shield').addEventListener('click', () => weaponSys.activateShield(state, updateHUD));
document.getElementById('btn-pw-emp').addEventListener('click', () => weaponSys.activateEMP(state, {
  onUpdateHUD: () => updateHUD(),
  onSaveHighScore: (s) => {
    if (s > highScore) {
      highScore = s;
      localStorage.setItem('meteor_defense_hi', String(highScore));
    }
  }
}));
document.getElementById('btn-pw-slow').addEventListener('click', () => weaponSys.activateTimeSlow(state, updateHUD));
document.getElementById('btn-pw-dbl').addEventListener('click', () => weaponSys.activateDoubleScore(state, updateHUD));

document.getElementById('btn-reload').addEventListener('click', () => weaponSys.reload(weaponSys.currentWeapon, state, updateHUD));

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

document.getElementById('btn-gamemode').addEventListener('click', () => {
  setGameMode(state.mode === 'Campaign' ? 'Endless' : 'Campaign');
  restartGame();
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (k === 'escape') {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
      uiMgr.closeSettings();
      return;
    }
    const lbModal = document.getElementById('leaderboard-modal');
    if (lbModal && !lbModal.classList.contains('hidden')) {
      uiMgr.closeLeaderboard();
      return;
    }
    if (state.isGameStarted && !state.isGameOver) {
      togglePause();
      return;
    }
    return;
  }

  if (!state.isGameStarted || state.isPaused || state.isGameOver) {
    if (k === 'l') uiMgr.openLeaderboard();
    return;
  }

  if (k === 'p') {
    togglePause();
    return;
  }

  if (['1', '2', '3'].includes(k)) {
    weaponSys.setWeapon(parseInt(k, 10), updateHUD);
  } else if (k === 'r') weaponSys.reload(weaponSys.currentWeapon, state, updateHUD);
  else if (k === 'k') document.getElementById('btn-cam').click();
  else if (k === 'z') weaponSys.upgradeDamage(state, updateHUD);
  else if (k === 'x') weaponSys.upgradeFireRate(state, updateHUD);
  else if (k === 'c') weaponSys.upgradeAmmoCap(state, updateHUD);
  else if (k === 'v') weaponSys.upgradeRotSpeed(state, updateHUD);
  else if (k === 'q') weaponSys.activateShield(state, updateHUD);
  else if (k === 'e') weaponSys.activateEMP(state, {
    onUpdateHUD: () => updateHUD(),
    onSaveHighScore: (s) => {
      if (s > highScore) {
        highScore = s;
        localStorage.setItem('meteor_defense_hi', String(highScore));
      }
    }
  });
  else if (k === 'f') weaponSys.activateTimeSlow(state, updateHUD);
  else if (k === 'g') weaponSys.activateDoubleScore(state, updateHUD);
  else if (k === 't') document.getElementById('btn-skin').click();
  else if (k === 'b') document.getElementById('btn-planet').click();
  else if (k === 'n') audioMgr.toggleMusic();
  else if (k === 'm') document.getElementById('btn-gamemode').click();
  else if (k === 'l') uiMgr.openLeaderboard();
});

const keysDown = {};
window.addEventListener('keydown', (e) => { keysDown[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keysDown[e.key.toLowerCase()] = false; });

// --- GAME LOOP UTAMA ---
const clock = new THREE.Clock();
let spawnTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // Layar Start Screen: Rotasi sinematik orbit pangkalan
  if (!state.isGameStarted) {
    env.rotateCamera(0.18 * dt, 0);
    env.updateCamera(dt);
    turret.update(dt);
    env.starField.rotation.y += dt * 0.02;
    env.renderer.render(env.scene, env.camera);
    return;
  }

  // Jika Game Over atau Pause: Berhenti penuh
  if (state.isGameOver || state.isPaused) {
    env.renderer.render(env.scene, env.camera);
    return;
  }

  // Reload Amunisi Independen
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

  // Spawner Gelombang Meteor yang Terkalibrasi
  if (!state.isGameOver) {
    spawnTimer += dt * timeScale;
    const spawnInterval = state.wave === 1
      ? Math.max(2.2, 2.8 - state.spawnedInWave * 0.1)
      : Math.max(0.65, 1.6 - state.wave * 0.15);

    if (spawnTimer >= spawnInterval && state.spawnedInWave < state.targetPerWave) {
      spawnTimer = 0;
      state.spawnedInWave++;
      const isBoss = state.spawnedInWave === state.targetPerWave && (state.wave === state.maxWave || (state.mode === 'Endless' && state.wave % 3 === 0));
      meteorMgr.spawnMeteor(isBoss ? 'boss' : null, null, state.wave);
    } else if (state.spawnedInWave >= state.targetPerWave && meteorMgr.meteors.length === 0) {
      if (state.mode === 'Campaign' && state.wave >= state.maxWave) {
        endGame(true);
      } else {
        state.wave++;
        state.spawnedInWave = 0;
        state.targetPerWave = state.wave === 2 ? 10 : (state.wave === 3 ? 14 : state.targetPerWave + 4);
        state.coins += 50;
        updateHUD();
      }
    }
  }

  // Update Boss Health Bar di HUD
  uiMgr.updateBossHUD(meteorMgr.getBossStatus());

  // Update Meteor & Benturan Planet
  meteorMgr.update(dt, timeScale, (hitMeteor) => {
    vfx.createExplosion(hitMeteor.position, 0xef4444, 28, 18);
    vfx.playSound('hitPlanet');
    vfx.triggerScreenShake(0.95);

    if (state.shieldActive) {
      state.shieldActive = false;
      env.shieldDome.visible = false;
    } else {
      const impactDmg = hitMeteor.userData.type === 'boss'
        ? 40
        : (state.wave === 1 ? 8 : (state.wave === 2 ? 12 : 15));
      state.hp -= impactDmg;
      state.combo = 1;
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

  // Perbarui bidikan raycaster setiap frame
  raycaster.setFromCamera(mouse, env.camera);
  raycaster.ray.at(50, aimTarget);
  if (aimTarget) turret.aimAt(aimTarget);

  turret.update(dt);
  vfx.update(dt, env.camera, env.baseCamPos, env.baseCamLook);
  env.starField.rotation.y += dt * 0.02;

  // Perbarui Indikator Arah & Radar/Map Taktis 360° di SEMUA mode kamera
  radarMgr.update(dt, env.camera, meteorMgr.meteors, state.shieldActive, state.isGameStarted, state.isGameOver);

  env.renderer.render(env.scene, env.camera);
}

// Inisialisasi awal
setGameMode('Campaign');
updateHUD();
animate();
