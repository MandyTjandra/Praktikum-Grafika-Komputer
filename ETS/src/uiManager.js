// ============================================================================
// UI MANAGER - SISTEM MODAL, START SCREEN, LEADERBOARD & HUD INTERAKTIF
// ============================================================================

export class UIManager {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // onStartGame, onRestartGame, onReturnToStart, onTogglePause, onSetMode, onSwitchWeapon
    this.streakTimeout = null;

    this.cacheDOMElements();
    this.bindEvents();
    this.renderLeaderboard();
  }

  cacheDOMElements() {
    this.startScreen = document.getElementById('start-screen');
    this.hud = document.getElementById('hud');
    this.pauseModal = document.getElementById('pause-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.modalOverlay = document.getElementById('modal-overlay');

    // HUD Elements
    this.hpBarFill = document.getElementById('hp-bar-fill');
    this.scoreText = document.getElementById('score-text');
    this.highScoreText = document.getElementById('highscore-text');
    this.coinText = document.getElementById('coin-text');
    this.ammoLabel = document.getElementById('ammo-label');
    this.ammoText = document.getElementById('ammo-text');
    this.ammoBarFill = document.getElementById('ammo-bar-fill');
    this.btnReload = document.getElementById('btn-reload');
    this.objectiveText = document.getElementById('objective-text');
    this.shieldStatusText = document.getElementById('shield-status-text');
    this.bossHud = document.getElementById('boss-hud');
    this.bossBarFill = document.getElementById('boss-bar-fill');
    this.comboStreakEl = document.getElementById('combo-streak');

    // Weapon Cards & Badges
    this.w1Ammo = document.getElementById('w1-ammo');
    this.w2Ammo = document.getElementById('w2-ammo');
    this.w3Ammo = document.getElementById('w3-ammo');

    // Upgrade Buttons
    this.btnUpgDmg = document.getElementById('btn-upg-dmg');
    this.btnUpgRate = document.getElementById('btn-upg-rate');
    this.btnUpgAmmo = document.getElementById('btn-upg-ammo');
    this.btnUpgRot = document.getElementById('btn-upg-rot');

    // Win/Lose Modal Elements
    this.modalTitle = document.getElementById('modal-title');
    this.modalDesc = document.getElementById('modal-desc');
  }

  bindEvents() {
    // Tombol Start Screen
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) btnStartGame.addEventListener('click', () => this.callbacks.onStartGame && this.callbacks.onStartGame());

    const btnStartCampaign = document.getElementById('btn-start-mode-campaign');
    if (btnStartCampaign) btnStartCampaign.addEventListener('click', () => this.callbacks.onSetMode && this.callbacks.onSetMode('Campaign'));

    const btnStartEndless = document.getElementById('btn-start-mode-endless');
    if (btnStartEndless) btnStartEndless.addEventListener('click', () => this.callbacks.onSetMode && this.callbacks.onSetMode('Endless'));

    const btnStartSettings = document.getElementById('btn-start-settings');
    if (btnStartSettings) btnStartSettings.addEventListener('click', () => this.openSettings());

    const btnStartLb = document.getElementById('btn-start-leaderboard');
    if (btnStartLb) btnStartLb.addEventListener('click', () => this.openLeaderboard());

    // Tombol Settings Modal
    const btnCloseSettingsX = document.getElementById('btn-close-settings-x');
    if (btnCloseSettingsX) btnCloseSettingsX.addEventListener('click', () => this.closeSettings());

    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => this.closeSettings());

    const btnHudSettings = document.getElementById('btn-hud-settings');
    if (btnHudSettings) btnHudSettings.addEventListener('click', () => this.openSettings());

    // Tab switcher settings
    document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        if (tabId) this.switchSettingsTab(tabId);
      });
    });

    // Tombol Pause Modal
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.addEventListener('click', () => this.callbacks.onTogglePause && this.callbacks.onTogglePause(true));

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) btnResume.addEventListener('click', () => this.callbacks.onTogglePause && this.callbacks.onTogglePause(false));

    const btnPauseRestart = document.getElementById('btn-pause-restart');
    if (btnPauseRestart) {
      btnPauseRestart.addEventListener('click', () => {
        this.callbacks.onTogglePause && this.callbacks.onTogglePause(false);
        this.callbacks.onRestartGame && this.callbacks.onRestartGame();
      });
    }

    const btnPauseSettings = document.getElementById('btn-pause-settings');
    if (btnPauseSettings) btnPauseSettings.addEventListener('click', () => this.openSettings());

    const btnPauseMainMenu = document.getElementById('btn-pause-mainmenu');
    if (btnPauseMainMenu) btnPauseMainMenu.addEventListener('click', () => this.callbacks.onReturnToStart && this.callbacks.onReturnToStart());

    // Tombol Leaderboard
    const btnOpenLb = document.getElementById('btn-open-leaderboard');
    if (btnOpenLb) btnOpenLb.addEventListener('click', () => this.openLeaderboard());

    const btnViewLbModal = document.getElementById('btn-view-leaderboard-modal');
    if (btnViewLbModal) btnViewLbModal.addEventListener('click', () => this.openLeaderboard());

    const btnCloseLb = document.getElementById('btn-close-leaderboard');
    if (btnCloseLb) btnCloseLb.addEventListener('click', () => this.closeLeaderboard());

    // Tombol Game Over / Win
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => this.callbacks.onRestartGame && this.callbacks.onRestartGame());

    const btnGameoverMainMenu = document.getElementById('btn-gameover-mainmenu');
    if (btnGameoverMainMenu) btnGameoverMainMenu.addEventListener('click', () => this.callbacks.onReturnToStart && this.callbacks.onReturnToStart());

    // Tombol Kartu Senjata di Bawah
    [1, 2, 3].forEach((wId) => {
      const el = document.getElementById(`wpn-${wId}`);
      if (el) {
        el.addEventListener('click', () => {
          if (this.callbacks.onSwitchWeapon) this.callbacks.onSwitchWeapon(wId);
        });
      }
    });
  }

  // --- START SCREEN & MODES ---
  setModeUI(mode) {
    const btnCampaign = document.getElementById('btn-start-mode-campaign');
    const btnEndless = document.getElementById('btn-start-mode-endless');
    const hudModeBtn = document.getElementById('btn-gamemode');

    if (btnCampaign) btnCampaign.classList.toggle('active', mode === 'Campaign');
    if (btnEndless) btnEndless.classList.toggle('active', mode === 'Endless');
    if (hudModeBtn) hudModeBtn.textContent = `[M] Mode: ${mode}`;
  }

  showStartScreen(mode) {
    this.modalOverlay.classList.add('hidden');
    this.leaderboardModal.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.settingsModal.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.setModeUI(mode);
  }

  showHUD() {
    this.startScreen.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.modalOverlay.classList.add('hidden');
    this.hud.classList.remove('hidden');
  }

  // --- SETTINGS MODAL ---
  openSettings(initialTab = null) {
    if (this.callbacks.onOpenSettings) this.callbacks.onOpenSettings();
    if (this.settingsModal) {
      this.settingsModal.classList.remove('hidden');
      if (initialTab) this.switchSettingsTab(initialTab);
    }
  }

  closeSettings() {
    if (this.settingsModal) this.settingsModal.classList.add('hidden');
  }

  switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.settings-tab-content').forEach((panel) => {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  // --- LEADERBOARD MODAL ---
  getLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem('meteor_defense_lb') || '[]');
    } catch (_) {
      return [];
    }
  }

  saveScore(score, wave, mode) {
    const lb = this.getLeaderboard();
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    lb.push({ score, wave, mode, date: dateStr });
    lb.sort((a, b) => b.score - a.score);
    const top5 = lb.slice(0, 5);
    localStorage.setItem('meteor_defense_lb', JSON.stringify(top5));
    this.renderLeaderboard();
  }

  renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    const lb = this.getLeaderboard();
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

  openLeaderboard() {
    this.renderLeaderboard();
    if (this.leaderboardModal) this.leaderboardModal.classList.remove('hidden');
  }

  closeLeaderboard() {
    if (this.leaderboardModal) this.leaderboardModal.classList.add('hidden');
  }

  // --- PAUSE MODAL ---
  setPauseModal(isPaused) {
    if (!this.pauseModal) return;
    if (isPaused) {
      this.pauseModal.classList.remove('hidden');
    } else {
      this.pauseModal.classList.add('hidden');
    }
  }

  // --- GAME OVER & WIN MODAL ---
  showEndGameModal(isWin, score, highScore, mode) {
    this.modalOverlay.classList.remove('hidden');
    this.modalTitle.textContent = isWin ? 'VICTORY - PLANET TERLINDUNGI!' : 'GAME OVER - MARKAS HANCUR';
    this.modalTitle.style.color = isWin ? '#4ade80' : '#f87171';
    this.modalDesc.textContent = `Mode: ${mode} | Skor Akhir: ${score} | High Score: ${highScore}`;
  }

  hideEndGameModal() {
    this.modalOverlay.classList.add('hidden');
  }

  // --- COMBO BANNER POPUP ---
  triggerComboStreak(combo) {
    if (!this.comboStreakEl) return;
    let title = '';
    if (combo === 3) title = 'COMBO x3! TRIPLE STRIKE!';
    else if (combo === 5) title = 'COMBO x5! MEGA BLAST! 🔥';
    else if (combo === 8) title = 'COMBO x8! UNSTOPPABLE! ⚡';
    else if (combo === 10) title = 'COMBO x10! GODLIKE DEFENDER! 👑';
    else return;

    this.comboStreakEl.textContent = title;
    this.comboStreakEl.classList.remove('hidden');

    if (this.streakTimeout) clearTimeout(this.streakTimeout);
    this.streakTimeout = setTimeout(() => {
      this.comboStreakEl.classList.add('hidden');
    }, 1500);
  }

  // --- UPDATE SELURUH HUD SETIAP FRAME ---
  updateHUD(state, currentWeapon, highScore) {
    if (this.hpBarFill) this.hpBarFill.style.width = `${Math.max(0, state.hp)}%`;
    if (this.scoreText) this.scoreText.textContent = `${state.score} (x${state.combo})`;
    if (this.highScoreText) this.highScoreText.textContent = highScore;
    if (this.coinText) this.coinText.textContent = state.coins;

    // Update Amunisi & Reload Display
    if (currentWeapon === 1) {
      this.ammoLabel.textContent = 'AMUNISI LASER:';
      this.ammoText.textContent = '∞ TAK TERBATAS';
      this.ammoBarFill.style.width = '100%';
      this.ammoBarFill.style.background = 'linear-gradient(90deg, #38bdf8, #818cf8)';
      this.btnReload.style.display = 'none';
    } else {
      this.btnReload.style.display = 'inline-block';
      const curAmmo = state.ammo[currentWeapon];
      const maxAmmo = state.maxAmmo[currentWeapon];
      const isWpnReloading = state.reloading[currentWeapon];
      const timer = state.reloadTimers[currentWeapon];
      const dur = state.reloadDurations[currentWeapon];

      if (currentWeapon === 2) {
        this.ammoLabel.textContent = 'AMUNISI MISSILE:';
        if (isWpnReloading) {
          this.ammoText.textContent = `RELOADING (${timer.toFixed(1)}s)`;
          this.ammoBarFill.style.width = `${((dur - timer) / dur) * 100}%`;
          this.btnReload.textContent = 'Reloading...';
        } else {
          this.ammoText.textContent = `${curAmmo} / ${maxAmmo}`;
          this.ammoBarFill.style.width = `${(curAmmo / maxAmmo) * 100}%`;
          this.btnReload.textContent = '[R] Reload (1.6s)';
        }
        this.ammoBarFill.style.background = 'linear-gradient(90deg, #f97316, #ef4444)';
      } else {
        this.ammoLabel.textContent = 'AMUNISI RAILGUN:';
        if (isWpnReloading) {
          this.ammoText.textContent = `RECHARGING (${timer.toFixed(1)}s)`;
          this.ammoBarFill.style.width = `${((dur - timer) / dur) * 100}%`;
          this.btnReload.textContent = 'Recharging...';
        } else {
          this.ammoText.textContent = `${curAmmo} / ${maxAmmo}`;
          this.ammoBarFill.style.width = `${(curAmmo / maxAmmo) * 100}%`;
          this.btnReload.textContent = '[R] Reload (3.2s)';
        }
        this.ammoBarFill.style.background = 'linear-gradient(90deg, #a855f7, #c084fc)';
      }
    }

    // Update Badge Kartu Senjata di Bawah
    if (this.w1Ammo) this.w1Ammo.textContent = '∞';
    if (this.w2Ammo) {
      this.w2Ammo.textContent = state.reloading[2]
        ? `Reload ${state.reloadTimers[2].toFixed(1)}s`
        : `${state.ammo[2]}/${state.maxAmmo[2]}`;
      this.w2Ammo.style.color = state.reloading[2] ? '#facc15' : '#f97316';
    }
    if (this.w3Ammo) {
      this.w3Ammo.textContent = state.reloading[3]
        ? `Recharge ${state.reloadTimers[3].toFixed(1)}s`
        : `${state.ammo[3]}/${state.maxAmmo[3]}`;
      this.w3Ammo.style.color = state.reloading[3] ? '#facc15' : '#c084fc';
    }

    // Highlight kartu senjata aktif
    document.querySelectorAll('.wpn-card').forEach((card, idx) => {
      card.classList.toggle('active', idx + 1 === currentWeapon);
    });

    // Objective text
    const waveLabel = state.mode === 'Campaign' ? `Wave ${state.wave}/${state.maxWave}` : `Endless Wave ${state.wave}`;
    if (this.objectiveText) this.objectiveText.textContent = `${state.mode}: ${waveLabel}`;

    // Active buffs status
    const statusParts = [];
    if (state.shieldActive) statusParts.push('SHIELD ON');
    if (state.timeSlowTimer > 0) statusParts.push(`SLOW (${state.timeSlowTimer.toFixed(1)}s)`);
    if (state.doubleScoreTimer > 0) statusParts.push(`2X SCORE (${state.doubleScoreTimer.toFixed(1)}s)`);
    if (this.shieldStatusText) this.shieldStatusText.textContent = statusParts.length ? statusParts.join(' | ') : 'Active Buffs: None';

    // Upgrade buttons cost
    if (this.btnUpgDmg) this.btnUpgDmg.textContent = `[Z] Damage Lv.${state.dmgLevel} (${state.dmgLevel * 50}c)`;
    if (this.btnUpgRate) this.btnUpgRate.textContent = `[X] Fire Rate Lv.${state.rateLevel} (${state.rateLevel * 50}c)`;
    if (this.btnUpgAmmo) this.btnUpgAmmo.textContent = `[C] Max Ammo Lv.${state.ammoLevel} (${state.ammoLevel * 40}c)`;
    if (this.btnUpgRot) this.btnUpgRot.textContent = `[V] Rot Speed Lv.${state.rotLevel} (${state.rotLevel * 40}c)`;
  }

  updateBossHUD(bossStatus) {
    if (!this.bossHud || !this.bossBarFill) return;
    if (bossStatus.active) {
      this.bossHud.classList.remove('hidden');
      const pct = Math.max(0, (bossStatus.hp / bossStatus.maxHp) * 100);
      this.bossBarFill.style.width = `${pct}%`;
    } else {
      this.bossHud.classList.add('hidden');
    }
  }
}
