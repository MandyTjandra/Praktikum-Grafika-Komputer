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
  1: { name: 'Laser',   color: 0x38bdf8, damage: 1.5, cooldown: 160, aoe: 0,   pierce: false, sound: 'shoot_laser',   maxAmmo: Infinity },
  2: { name: 'Missile', color: 0xf97316, damage: 4.5, cooldown: 620, aoe: 8.5, pierce: false, sound: 'shoot_missile', maxAmmo: 7 },
  3: { name: 'Railgun', color: 0xa855f7, damage: 7.0, cooldown: 840, aoe: 0,   pierce: true,  sound: 'shoot_railgun', maxAmmo: 3 }
};

let currentWeapon = 1;
let lastShotTime = 0;
let planetThemeIndex = 0;

// --- STATE PERMAINAN, UPGRADE & POWER-UP ---
let highScore = parseInt(localStorage.getItem('meteor_defense_hi') || '0', 10);

let state = {
  isGameStarted: false,
  mode: 'Campaign', // 'Campaign' atau 'Endless'
  hp: 100,
  score: 0,
  coins: 150, // Modal awal koin ramah pemula (150c) untuk upgrade/power-up awal
  combo: 1,
  wave: 1,
  maxWave: 3,
  spawnedInWave: 0,
  targetPerWave: 6, // Wave 1 hanya butuh 6 meteor agar awal game lebih mudah & cepat adaptasi
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
  // Abaikan klik jika belum mulai, klik tombol, saat modal terbuka, game over, atau pause
  if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.modal-box') || e.target.closest('.start-content-box') || e.button !== 0 || !state.isGameStarted || state.isGameOver || state.isPaused) return;

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

// --- SISTEM AUDIO & VOLUME (BGM & SFX PROSEDURAL) ---
const bgm = document.getElementById('bgm-player');
let musicVolume = parseFloat(localStorage.getItem('meteor_defense_music_vol') || '0.35');
let isMusicMuted = localStorage.getItem('meteor_defense_music_mute') === 'true';
let sfxVolume = parseFloat(localStorage.getItem('meteor_defense_sfx_vol') || '0.8');
let isSfxMuted = localStorage.getItem('meteor_defense_sfx_mute') === 'true';
let wasPlayingBeforePause = false;

if (bgm) {
  bgm.volume = isMusicMuted ? 0 : musicVolume;
}
vfx.setSfxVolume(sfxVolume);
vfx.setSfxMuted(isSfxMuted);

function updateAudioUI() {
  const isBgmPlaying = bgm && !bgm.paused && !isMusicMuted;

  // Update HUD BGM Button
  const hudBtn = document.getElementById('btn-music');
  if (hudBtn) {
    hudBtn.textContent = isBgmPlaying ? '[N] Musik: 🔊 ON' : '[N] Musik: 🔇 OFF';
    hudBtn.classList.toggle('highlight-btn', Boolean(isBgmPlaying));
  }

  // Update Settings BGM Toggle & Slider
  const settingMusicBtn = document.getElementById('setting-music-toggle');
  const settingMusicSlider = document.getElementById('setting-music-slider');
  const settingMusicVal = document.getElementById('setting-music-val');

  if (settingMusicBtn) {
    settingMusicBtn.textContent = isMusicMuted ? '🔇 Musik: OFF' : '🔊 Musik: ON';
    settingMusicBtn.classList.toggle('active', !isMusicMuted);
  }
  if (settingMusicSlider) settingMusicSlider.value = Math.round(musicVolume * 100);
  if (settingMusicVal) settingMusicVal.textContent = `${Math.round(musicVolume * 100)}%`;

  // Update Settings SFX Toggle & Slider
  const settingSfxBtn = document.getElementById('setting-sfx-toggle');
  const settingSfxSlider = document.getElementById('setting-sfx-slider');
  const settingSfxVal = document.getElementById('setting-sfx-val');

  if (settingSfxBtn) {
    settingSfxBtn.textContent = isSfxMuted ? '🔇 SFX: OFF' : '🔊 SFX: ON';
    settingSfxBtn.classList.toggle('active', !isSfxMuted);
  }
  if (settingSfxSlider) settingSfxSlider.value = Math.round(sfxVolume * 100);
  if (settingSfxVal) settingSfxVal.textContent = `${Math.round(sfxVolume * 100)}%`;
}

function toggleMusic(forceState = null) {
  if (!bgm) return;
  if (forceState !== null) isMusicMuted = !forceState;
  else isMusicMuted = !isMusicMuted;

  localStorage.setItem('meteor_defense_music_mute', String(isMusicMuted));

  if (isMusicMuted) {
    bgm.pause();
  } else {
    bgm.volume = musicVolume;
    bgm.play().then(() => updateAudioUI()).catch(() => {});
  }
  updateAudioUI();
}

function setMusicVolume(val) {
  musicVolume = Math.max(0, Math.min(1, val));
  localStorage.setItem('meteor_defense_music_vol', String(musicVolume));
  if (bgm) {
    bgm.volume = isMusicMuted ? 0 : musicVolume;
  }
  updateAudioUI();
}

function toggleSfx(forceState = null) {
  if (forceState !== null) isSfxMuted = !forceState;
  else isSfxMuted = !isSfxMuted;

  localStorage.setItem('meteor_defense_sfx_mute', String(isSfxMuted));
  vfx.setSfxMuted(isSfxMuted);
  updateAudioUI();
}

function setSfxVolume(val) {
  sfxVolume = Math.max(0, Math.min(1, val));
  localStorage.setItem('meteor_defense_sfx_vol', String(sfxVolume));
  vfx.setSfxVolume(sfxVolume);
  updateAudioUI();
}

function initMusicOnGesture() {
  if (bgm && !isMusicMuted && bgm.paused && state.isGameStarted) {
    bgm.play().then(() => updateAudioUI()).catch(() => {});
  }
}
['pointerdown', 'keydown', 'click'].forEach((evt) => {
  window.addEventListener(evt, initMusicOnGesture, { once: true });
});

// --- SISTEM MODAL PENGATURAN (SETTINGS) & INTELIJEN ---
function openSettings(initialTab = null) {
  updateAudioUI();
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.remove('hidden');
    if (initialTab) switchSettingsTab(initialTab);
  }
}

function closeSettings() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.classList.add('hidden');
}

function switchSettingsTab(tabId) {
  document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.settings-tab-content').forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

// Event listener tab pengaturan
document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    if (tabId) switchSettingsTab(tabId);
  });
});

const btnCloseSettingsX = document.getElementById('btn-close-settings-x');
if (btnCloseSettingsX) btnCloseSettingsX.addEventListener('click', closeSettings);

const btnCloseSettings = document.getElementById('btn-close-settings');
if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);

const settingMusicToggleBtn = document.getElementById('setting-music-toggle');
if (settingMusicToggleBtn) settingMusicToggleBtn.addEventListener('click', () => toggleMusic());

const settingMusicSlider = document.getElementById('setting-music-slider');
if (settingMusicSlider) {
  settingMusicSlider.addEventListener('input', (e) => {
    setMusicVolume(parseFloat(e.target.value) / 100);
  });
}

const settingSfxToggleBtn = document.getElementById('setting-sfx-toggle');
if (settingSfxToggleBtn) settingSfxToggleBtn.addEventListener('click', () => toggleSfx());

const settingSfxSlider = document.getElementById('setting-sfx-slider');
if (settingSfxSlider) {
  settingSfxSlider.addEventListener('input', (e) => {
    setSfxVolume(parseFloat(e.target.value) / 100);
  });
}

const btnTestSound = document.getElementById('btn-test-sound');
if (btnTestSound) {
  btnTestSound.addEventListener('click', () => {
    vfx.initAudio();
    vfx.playSound('shoot_laser');
    setTimeout(() => vfx.playSound('explosion'), 160);
  });
}

// Tombol Settings dari HUD
const btnHudSettings = document.getElementById('btn-hud-settings');
if (btnHudSettings) btnHudSettings.addEventListener('click', () => openSettings());

// --- SISTEM START SCREEN & GAME LIFECYCLE ---
function setStartMode(mode) {
  state.mode = mode;
  const btnCampaign = document.getElementById('btn-start-mode-campaign');
  const btnEndless = document.getElementById('btn-start-mode-endless');
  const hudModeBtn = document.getElementById('btn-gamemode');

  if (btnCampaign) btnCampaign.classList.toggle('active', mode === 'Campaign');
  if (btnEndless) btnEndless.classList.toggle('active', mode === 'Endless');
  if (hudModeBtn) hudModeBtn.textContent = `[M] Mode: ${mode}`;
  updateHUD();
}

function startGame() {
  state.isGameStarted = true;
  state.isGameOver = false;
  state.isPaused = false;

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');

  clock.getDelta(); // Reset delta clock
  spawnTimer = 0;

  vfx.initAudio();
  if (bgm && !isMusicMuted) {
    bgm.volume = musicVolume;
    bgm.play().then(() => updateAudioUI()).catch(() => {});
  }
  updateAudioUI();
  updateHUD();
}

function returnToStartScreen() {
  meteorMgr.clearAll();
  env.shieldDome.visible = false;
  if (indicatorsContainer) indicatorsContainer.innerHTML = '';

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

  // Sembunyikan semua modal & HUD
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('leaderboard-modal').classList.add('hidden');
  document.getElementById('pause-modal').classList.add('hidden');
  document.getElementById('settings-modal').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  if (fppOverlay) fppOverlay.classList.add('hidden');

  // Tampilkan start screen
  document.getElementById('start-screen').classList.remove('hidden');
  setStartMode(state.mode);
}

// Event listener tombol-tombol Start Screen
const btnStartModeCampaign = document.getElementById('btn-start-mode-campaign');
if (btnStartModeCampaign) {
  btnStartModeCampaign.addEventListener('click', () => setStartMode('Campaign'));
}

const btnStartModeEndless = document.getElementById('btn-start-mode-endless');
if (btnStartModeEndless) {
  btnStartModeEndless.addEventListener('click', () => setStartMode('Endless'));
}

const btnStartGame = document.getElementById('btn-start-game');
if (btnStartGame) {
  btnStartGame.addEventListener('click', startGame);
}

const btnStartSettings = document.getElementById('btn-start-settings');
if (btnStartSettings) {
  btnStartSettings.addEventListener('click', () => openSettings());
}

const btnStartLeaderboard = document.getElementById('btn-start-leaderboard');
if (btnStartLeaderboard) {
  btnStartLeaderboard.addEventListener('click', openLeaderboard);
}

// --- SISTEM PAUSE GAME (RESUME & RESTART) ---
function togglePause(forceState = null) {
  if (!state.isGameStarted || state.isGameOver) return;

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
      bgm.play().then(() => updateAudioUI()).catch(() => {});
      wasPlayingBeforePause = false;
    }
  }
  updateAudioUI();
}

document.getElementById('btn-pause').addEventListener('click', () => togglePause(true));
document.getElementById('btn-resume').addEventListener('click', () => togglePause(false));
document.getElementById('btn-pause-restart').addEventListener('click', () => {
  togglePause(false);
  restartGame();
});

const btnPauseSettings = document.getElementById('btn-pause-settings');
if (btnPauseSettings) btnPauseSettings.addEventListener('click', () => openSettings());

const btnPauseMainMenu = document.getElementById('btn-pause-mainmenu');
if (btnPauseMainMenu) btnPauseMainMenu.addEventListener('click', returnToStartScreen);

const btnGameoverMainMenu = document.getElementById('btn-gameover-mainmenu');
if (btnGameoverMainMenu) btnGameoverMainMenu.addEventListener('click', returnToStartScreen);

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
  setStartMode(state.mode);
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

  // Tombol Escape: Tutup modal terbuka atau Jeda/Lanjutkan game
  if (k === 'escape') {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
      closeSettings();
      return;
    }
    const lbModal = document.getElementById('leaderboard-modal');
    if (lbModal && !lbModal.classList.contains('hidden')) {
      closeLeaderboard();
      return;
    }
    if (state.isGameStarted && !state.isGameOver) {
      togglePause();
      return;
    }
    return;
  }

  // Jika game belum dimulai atau sedang pause/game over, batasi kontrol gameplay
  if (!state.isGameStarted || state.isPaused || state.isGameOver) {
    if (k === 'l') openLeaderboard();
    return;
  }

  if (k === 'p') {
    togglePause();
    return;
  }

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

  if (indicatorsContainer) indicatorsContainer.innerHTML = '';
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
  if (indicatorsContainer) indicatorsContainer.innerHTML = '';
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
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('leaderboard-modal').classList.add('hidden');
  document.getElementById('pause-modal').classList.add('hidden');
  document.getElementById('settings-modal').classList.add('hidden');
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  clock.getDelta(); // Bersihkan delta clock setelah restart
  spawnTimer = 0;

  if (bgm && !isMusicMuted) {
    bgm.volume = musicVolume;
    bgm.play().catch(() => {});
  }
  updateAudioUI();
  updateHUD();
}

document.getElementById('btn-restart').addEventListener('click', restartGame);

// --- SISTEM INDIKATOR ARAH & RADAR TAKTIS FPP 360 DERAJAT ---
const fppOverlay = document.getElementById('fpp-overlay');
const radarCanvas = document.getElementById('fpp-radar-canvas');
const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;
const radarThreatCount = document.getElementById('radar-threat-count');
const indicatorsContainer = document.getElementById('fpp-indicators-container');

let radarSweepAngle = 0;
const _fppCamFwd = new THREE.Vector3();
const _fppCamRight = new THREE.Vector3();
const _fppUp = new THREE.Vector3(0, 1, 0);
const _fppToTarget = new THREE.Vector3();
const _fppProj = new THREE.Vector3();
const _cam3dFwd = new THREE.Vector3();

const METEOR_NAMES = {
  standard: 'METEOR',
  speedy: 'SPEEDY',
  armored: 'ARMORED',
  cluster: 'CLUSTER',
  shard: 'SHARD',
  boss: 'BOSS'
};

const RADAR_COLORS = {
  standard: '#38bdf8',
  speedy: '#facc15',
  armored: '#ef4444',
  cluster: '#34d399',
  shard: '#38bdf8',
  boss: '#c084fc'
};

function updateTacticalRadar(dt) {
  if (!fppOverlay || !indicatorsContainer) return;

  // Hanya tampil saat game sedang berjalan aktif
  if (!state.isGameStarted || state.isGameOver) {
    if (!fppOverlay.classList.contains('hidden')) {
      fppOverlay.classList.add('hidden');
      indicatorsContainer.innerHTML = '';
    }
    return;
  }

  // Tampilkan Radar & Minimap di SEMUA mode kamera!
  if (fppOverlay.classList.contains('hidden')) {
    fppOverlay.classList.remove('hidden');
  }

  const meteors = meteorMgr.meteors;
  const count = meteors.length;

  if (radarThreatCount) {
    radarThreatCount.textContent = count === 0 ? 'AMAN' : `${count} TARGET`;
    radarThreatCount.classList.toggle('safe', count === 0);
  }

  // Vektor Arah Pandang Kamera Planar di bidang XZ
  env.camera.getWorldDirection(_cam3dFwd);
  _fppCamFwd.copy(_cam3dFwd);
  _fppCamFwd.y = 0;
  if (_fppCamFwd.lengthSq() > 0.0001) _fppCamFwd.normalize();
  else _fppCamFwd.set(0, 0, -1);
  _fppCamRight.crossVectors(_fppCamFwd, _fppUp).normalize();

  const baseCenter = new THREE.Vector3(0, 0, 0);

  // 1. RENDER TACTICAL RADAR & MAP (Resolusi Tajam 160x160)
  if (radarCtx) {
    const size = 160;
    const center = size * 0.5; // 80
    const radarR = 64;
    const maxRange = 65; // meter jangkauan radar/map

    radarCtx.clearRect(0, 0, size, size);

    // Lingkaran Konsentris Jangkauan Radar & Map (20m, 40m, 60m)
    radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    radarCtx.lineWidth = 1;
    [0.31, 0.62, 0.92].forEach((ratio) => {
      radarCtx.beginPath();
      radarCtx.arc(center, center, radarR * ratio, 0, Math.PI * 2);
      radarCtx.stroke();
    });

    // Label Jarak Meter pada Lingkaran Radar
    radarCtx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    radarCtx.font = '7px sans-serif';
    radarCtx.textAlign = 'center';
    radarCtx.fillText('20m', center, center - radarR * 0.31 + 8);
    radarCtx.fillText('40m', center, center - radarR * 0.62 + 8);

    // Garis Silang Pembantu Sektor
    radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    radarCtx.setLineDash([2, 4]);
    radarCtx.beginPath();
    radarCtx.moveTo(center, center - radarR * 0.92);
    radarCtx.lineTo(center, center + radarR * 0.92);
    radarCtx.moveTo(center - radarR * 0.92, center);
    radarCtx.lineTo(center + radarR * 0.92, center);
    radarCtx.stroke();
    radarCtx.setLineDash([]);

    // ARAH MATA ANGIN DINAMIS (U = Utara, T = Timur, S = Selatan, B = Barat)
    // Berputar otomatis mengikuti orientasi kamera 360 derajat
    const camAngle = Math.atan2(_fppCamFwd.x, -_fppCamFwd.z);
    const compassDirs = [
      { label: 'U', angle: -camAngle - Math.PI / 2, color: '#38bdf8' },
      { label: 'T', angle: -camAngle,               color: '#94a3b8' },
      { label: 'S', angle: -camAngle + Math.PI / 2, color: '#94a3b8' },
      { label: 'B', angle: -camAngle + Math.PI,     color: '#94a3b8' }
    ];

    radarCtx.font = 'bold 8px sans-serif';
    radarCtx.textBaseline = 'middle';
    compassDirs.forEach((d) => {
      const dirDist = radarR * 0.92 - 6;
      const lx = center + Math.cos(d.angle) * dirDist;
      const ly = center + Math.sin(d.angle) * dirDist;
      radarCtx.fillStyle = d.color;
      radarCtx.fillText(d.label, lx, ly);
    });

    // Vision Cone Bidang Pandang Kamera (FOV ~60° mengarah ke DEPAN / Atas)
    radarCtx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    radarCtx.beginPath();
    radarCtx.moveTo(center, center);
    radarCtx.arc(center, center, radarR * 0.92, -Math.PI / 2 - 0.52, -Math.PI / 2 + 0.52);
    radarCtx.closePath();
    radarCtx.fill();

    // Radar Sweep Line (Animasi Pemindaian Taktis)
    radarSweepAngle += dt * 3.0;
    const sweepX = center + Math.cos(radarSweepAngle) * (radarR * 0.92);
    const sweepY = center + Math.sin(radarSweepAngle) * (radarR * 0.92);
    radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    radarCtx.lineWidth = 1.2;
    radarCtx.beginPath();
    radarCtx.moveTo(center, center);
    radarCtx.lineTo(sweepX, sweepY);
    radarCtx.stroke();

    // Titik Pusat Pangkalan Markas Planet & Perisai Aktif
    if (state.shieldActive) {
      radarCtx.strokeStyle = '#38bdf8';
      radarCtx.lineWidth = 1.5;
      radarCtx.beginPath();
      radarCtx.arc(center, center, 7, 0, Math.PI * 2);
      radarCtx.stroke();
    }
    radarCtx.fillStyle = '#0284c7';
    radarCtx.beginPath();
    radarCtx.arc(center, center, 4, 0, Math.PI * 2);
    radarCtx.fill();
    radarCtx.strokeStyle = '#ffffff';
    radarCtx.lineWidth = 1.2;
    radarCtx.stroke();

    const now = performance.now();

    // RENDER LINTASAN ASAL METEOR & BLIP PADA MAP
    meteors.forEach((m) => {
      _fppToTarget.subVectors(m.position, baseCenter);
      const fwd = _fppToTarget.dot(_fppCamFwd);
      const rgt = _fppToTarget.dot(_fppCamRight);
      const flatDist = Math.hypot(rgt, fwd);
      const distRatio = Math.min(flatDist, maxRange) / maxRange;
      const angle = Math.atan2(-fwd, rgt);

      const dotX = center + Math.cos(angle) * (distRatio * radarR * 0.92);
      const dotY = center + Math.sin(angle) * (distRatio * radarR * 0.92);
      const color = RADAR_COLORS[m.userData.type] || '#ef4444';

      // Titik asal kemunculan meteor (spawn origin)
      const spawnPos = m.userData.spawnPos || m.position;
      _fppToTarget.subVectors(spawnPos, baseCenter);
      const origFwd = _fppToTarget.dot(_fppCamFwd);
      const origRgt = _fppToTarget.dot(_fppCamRight);
      const origDist = Math.hypot(origRgt, origFwd);
      const origRatio = Math.min(origDist, maxRange) / maxRange;
      const origAngle = Math.atan2(-origFwd, origRgt);

      const origX = center + Math.cos(origAngle) * (origRatio * radarR * 0.92);
      const origY = center + Math.sin(origAngle) * (origRatio * radarR * 0.92);

      // 1. GARIS VEKTOR ASAL & LINTASAN MENUJU PANGKALAN (Fitur Map Utama)
      radarCtx.strokeStyle = color;
      radarCtx.lineWidth = 1;
      radarCtx.setLineDash([2, 3]);
      radarCtx.beginPath();
      radarCtx.moveTo(origX, origY);
      radarCtx.lineTo(dotX, dotY);
      radarCtx.stroke();
      radarCtx.setLineDash([]);

      // Garis lintasan prediksi ke arah pangkalan
      radarCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      radarCtx.setLineDash([1, 4]);
      radarCtx.beginPath();
      radarCtx.moveTo(dotX, dotY);
      radarCtx.lineTo(center, center);
      radarCtx.stroke();
      radarCtx.setLineDash([]);

      // 2. BEACON INDIKATOR TITIK ASAL (PULSE EFFECT)
      const age = (now - (m.userData.spawnTime || now)) / 1000;
      if (age < 3.5) {
        // Efek gelombang pulse melingkar di titik asal kemunculan
        const pulseR = 3 + (age % 1.2) * 5;
        radarCtx.strokeStyle = color;
        radarCtx.lineWidth = 1.2;
        radarCtx.beginPath();
        radarCtx.arc(origX, origY, pulseR, 0, Math.PI * 2);
        radarCtx.stroke();
      }
      radarCtx.fillStyle = color;
      radarCtx.beginPath();
      radarCtx.arc(origX, origY, 2, 0, Math.PI * 2);
      radarCtx.fill();

      // 3. BLIP TITIK METEOR SAAT INI
      const isDanger = flatDist < 22;
      const dotRadius = m.userData.type === 'boss' ? 5.5 : (isDanger ? 4.2 : 3.2);

      radarCtx.fillStyle = color;
      radarCtx.beginPath();
      radarCtx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      radarCtx.fill();

      if (isDanger) {
        radarCtx.strokeStyle = '#ffffff';
        radarCtx.lineWidth = 1.2;
        radarCtx.stroke();
      }
    });
  }

  // 2. INDIKATOR ARAH TEPI LAYAR & LOCK-ON RETICLE (SEMUA MODE KAMERA)
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const cx = winW * 0.5;
  const cy = winH * 0.5;
  const margin = 50;
  const boundW = cx - margin;
  const boundH = cy - margin;

  let html = '';

  for (let i = 0; i < meteors.length; i++) {
    const m = meteors[i];
    const mPos = m.position;
    const dist = env.camera.position.distanceTo(mPos);

    _fppToTarget.subVectors(mPos, env.camera.position);
    const dotFwd = _fppToTarget.dot(_cam3dFwd);
    const isBehind = dotFwd <= 0;

    _fppProj.copy(mPos).project(env.camera);

    if (isBehind) {
      _fppProj.x = -_fppProj.x;
      _fppProj.y = -_fppProj.y;
    }

    const typeKey = m.userData.type || 'standard';
    const typeLabel = METEOR_NAMES[typeKey] || 'METEOR';
    const isCritical = dist < 24;

    const isOnScreen = !isBehind && Math.abs(_fppProj.x) <= 0.88 && Math.abs(_fppProj.y) <= 0.88;

    // Hanya tampilkan panah pemandu jika meteor berada di luar sudut pandang kamera (off-screen / di belakang)
    // Simbol kotak bracket dan label di atas meteor dalam layar telah dihapus agar pandangan tetap bersih
    if (!isOnScreen) {
      // Panah Arah di Tepi Layar untuk meteor di luar pandangan
      let dirX = _fppProj.x;
      let dirY = -_fppProj.y;
      const len = Math.hypot(dirX, dirY) || 1;
      dirX /= len;
      dirY /= len;

      const scaleX = boundW / Math.max(Math.abs(dirX), 0.0001);
      const scaleY = boundH / Math.max(Math.abs(dirY), 0.0001);
      const scale = Math.min(scaleX, scaleY);

      const ax = cx + dirX * scale;
      const ay = cy + dirY * scale;

      const angleDeg = Math.atan2(dirY, dirX) * (180 / Math.PI) + 90;

      html += `
        <div class="fpp-edge-arrow threat-${typeKey} ${isCritical ? 'threat-critical' : ''}" style="left:${ax.toFixed(1)}px; top:${ay.toFixed(1)}px;">
          <div class="fpp-arrow-pointer" style="transform: rotate(${angleDeg.toFixed(1)}deg);">▲</div>
          <div class="fpp-arrow-tag">${typeLabel} ${Math.round(dist)}m</div>
        </div>
      `;
    }
  }

  indicatorsContainer.innerHTML = html;
}

// --- GAME LOOP UTAMA ---
const clock = new THREE.Clock();
let spawnTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // JIKA BERADA DI START SCREEN (BELUM MULAI):
  if (!state.isGameStarted) {
    env.rotateCamera(0.18 * dt, 0);
    env.updateCamera(dt);
    turret.update(dt);
    env.starField.rotation.y += dt * 0.02;
    env.renderer.render(env.scene, env.camera);
    return;
  }

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

  // Spawner Gelombang Meteor yang Terkalibrasi Ramah di Awal Game
  if (!state.isGameOver) {
    spawnTimer += dt * timeScale;
    // Di Wave 1 jeda spawn 2.5 - 2.8s (jauh lebih santai dan bersahabat)
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
        state.coins += 50; // Bonus koin setiap wave selesai
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

  // Update Meteor & Benturan Planet (Kerusakan Lebih Ringan di Wave Awal)
  meteorMgr.update(dt, timeScale, (hitMeteor) => {
    vfx.createExplosion(hitMeteor.position, 0xef4444, 28, 18);
    vfx.playSound('hitPlanet');
    vfx.triggerScreenShake(0.95);

    if (state.shieldActive) {
      // Planet Shield menahan 1 hantaman meteor penuh
      state.shieldActive = false;
      env.shieldDome.visible = false;
    } else {
      // Kerusakan planet lebih ringan di wave awal (Wave 1: hanya 8 HP)
      const impactDmg = hitMeteor.userData.type === 'boss'
        ? 40
        : (state.wave === 1 ? 8 : (state.wave === 2 ? 12 : 15));
      state.hp -= impactDmg;
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

  // Perbarui Indikator Arah & Radar/Map Taktis 360° di SEMUA mode kamera
  updateTacticalRadar(dt);

  env.renderer.render(env.scene, env.camera);
}

setStartMode('Campaign');
updateAudioUI();
renderLeaderboard();
updateHUD();
animate();