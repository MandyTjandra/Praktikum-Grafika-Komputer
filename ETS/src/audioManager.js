// ============================================================================
// AUDIO MANAGER - SISTEM PENGATURAN BGM & SFX PROSEDURAL
// ============================================================================

export class AudioManager {
  constructor(vfxManager) {
    this.vfx = vfxManager;
    this.bgm = document.getElementById('bgm-player');

    // Ambil preferensi volume dari localStorage
    this.musicVolume = parseFloat(localStorage.getItem('meteor_defense_music_vol') || '0.35');
    this.isMusicMuted = localStorage.getItem('meteor_defense_music_mute') === 'true';
    this.sfxVolume = parseFloat(localStorage.getItem('meteor_defense_sfx_vol') || '0.8');
    this.isSfxMuted = localStorage.getItem('meteor_defense_sfx_mute') === 'true';
    this.wasPlayingBeforePause = false;

    if (this.bgm) {
      this.bgm.volume = this.isMusicMuted ? 0 : this.musicVolume;
    }
    if (this.vfx) {
      this.vfx.setSfxVolume(this.sfxVolume);
      this.vfx.setSfxMuted(this.isSfxMuted);
    }

    this.bindEvents();
    this.updateAudioUI();
  }

  bindEvents() {
    // Autoplay unlock via gesture pertama pengguna
    const unlockAudio = () => {
      if (this.vfx) this.vfx.initAudio();
      ['pointerdown', 'keydown', 'click'].forEach((evt) => {
        window.removeEventListener(evt, unlockAudio);
      });
    };
    ['pointerdown', 'keydown', 'click'].forEach((evt) => {
      window.addEventListener(evt, unlockAudio, { once: true });
    });

    // Binding Slider & Tombol Pengaturan BGM
    const settingMusicBtn = document.getElementById('setting-music-toggle');
    if (settingMusicBtn) settingMusicBtn.addEventListener('click', () => this.toggleMusic());

    const settingMusicSlider = document.getElementById('setting-music-slider');
    if (settingMusicSlider) {
      settingMusicSlider.addEventListener('input', (e) => {
        this.setMusicVolume(parseFloat(e.target.value) / 100);
      });
    }

    // Binding Slider & Tombol Pengaturan SFX
    const settingSfxBtn = document.getElementById('setting-sfx-toggle');
    if (settingSfxBtn) settingSfxBtn.addEventListener('click', () => this.toggleSfx());

    const settingSfxSlider = document.getElementById('setting-sfx-slider');
    if (settingSfxSlider) {
      settingSfxSlider.addEventListener('input', (e) => {
        this.setSfxVolume(parseFloat(e.target.value) / 100);
      });
    }

    // Tombol Uji Suara
    const btnTestSound = document.getElementById('btn-test-sound');
    if (btnTestSound) {
      btnTestSound.addEventListener('click', () => {
        if (this.vfx) {
          this.vfx.initAudio();
          this.vfx.playSound('shoot_laser');
          setTimeout(() => this.vfx.playSound('explosion'), 160);
        }
      });
    }

    // Tombol Musik HUD
    const btnMusicEl = document.getElementById('btn-music');
    if (btnMusicEl) {
      btnMusicEl.addEventListener('click', () => this.toggleMusic());
    }
  }

  toggleMusic(forceState = null) {
    if (!this.bgm) return;
    if (forceState !== null) this.isMusicMuted = !forceState;
    else this.isMusicMuted = !this.isMusicMuted;

    localStorage.setItem('meteor_defense_music_mute', String(this.isMusicMuted));

    if (this.isMusicMuted) {
      this.bgm.pause();
    } else {
      this.bgm.volume = this.musicVolume;
      this.bgm.play().then(() => this.updateAudioUI()).catch(() => {});
    }
    this.updateAudioUI();
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('meteor_defense_music_vol', String(this.musicVolume));
    if (this.bgm) {
      this.bgm.volume = this.isMusicMuted ? 0 : this.musicVolume;
    }
    this.updateAudioUI();
  }

  toggleSfx(forceState = null) {
    if (forceState !== null) this.isSfxMuted = !forceState;
    else this.isSfxMuted = !this.isSfxMuted;

    localStorage.setItem('meteor_defense_sfx_mute', String(this.isSfxMuted));
    if (this.vfx) this.vfx.setSfxMuted(this.isSfxMuted);
    this.updateAudioUI();
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('meteor_defense_sfx_vol', String(this.sfxVolume));
    if (this.vfx) this.vfx.setSfxVolume(this.sfxVolume);
    this.updateAudioUI();
  }

  playBGM() {
    if (this.bgm && !this.isMusicMuted) {
      this.bgm.volume = this.musicVolume;
      this.bgm.play().then(() => this.updateAudioUI()).catch(() => {});
    }
  }

  pauseBGM() {
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause();
      this.wasPlayingBeforePause = true;
    }
  }

  resumeBGM() {
    if (this.bgm && this.wasPlayingBeforePause && !this.isMusicMuted) {
      this.bgm.volume = this.musicVolume;
      this.bgm.play().then(() => this.updateAudioUI()).catch(() => {});
      this.wasPlayingBeforePause = false;
    }
  }

  setDuckVolume(val) {
    if (this.bgm && !this.isMusicMuted) {
      this.bgm.volume = val;
    }
  }

  updateAudioUI() {
    const isBgmPlaying = this.bgm && !this.bgm.paused && !this.isMusicMuted;

    // Update Tombol HUD
    const hudBtn = document.getElementById('btn-music');
    if (hudBtn) {
      hudBtn.textContent = isBgmPlaying ? '[N] Musik: 🔊 ON' : '[N] Musik: 🔇 OFF';
      hudBtn.classList.toggle('highlight-btn', Boolean(isBgmPlaying));
    }

    // Update Panel Pengaturan BGM
    const settingMusicBtn = document.getElementById('setting-music-toggle');
    const settingMusicSlider = document.getElementById('setting-music-slider');
    const settingMusicVal = document.getElementById('setting-music-val');

    if (settingMusicBtn) {
      settingMusicBtn.textContent = this.isMusicMuted ? '🔇 Musik: OFF' : '🔊 Musik: ON';
      settingMusicBtn.classList.toggle('active', !this.isMusicMuted);
    }
    if (settingMusicSlider) settingMusicSlider.value = Math.round(this.musicVolume * 100);
    if (settingMusicVal) settingMusicVal.textContent = `${Math.round(this.musicVolume * 100)}%`;

    // Update Panel Pengaturan SFX
    const settingSfxBtn = document.getElementById('setting-sfx-toggle');
    const settingSfxSlider = document.getElementById('setting-sfx-slider');
    const settingSfxVal = document.getElementById('setting-sfx-val');

    if (settingSfxBtn) {
      settingSfxBtn.textContent = this.isSfxMuted ? '🔇 SFX: OFF' : '🔊 SFX: ON';
      settingSfxBtn.classList.toggle('active', !this.isSfxMuted);
    }
    if (settingSfxSlider) settingSfxSlider.value = Math.round(this.sfxVolume * 100);
    if (settingSfxVal) settingSfxVal.textContent = `${Math.round(this.sfxVolume * 100)}%`;
  }
}
