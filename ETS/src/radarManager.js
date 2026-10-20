// ============================================================================
// RADAR MANAGER - SISTEM MINIMAP & RADAR TAKTIS 360 DERAJAT
// ============================================================================

import * as THREE from 'three';

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

export class RadarManager {
  constructor() {
    this.fppOverlay = document.getElementById('fpp-overlay');
    this.radarCanvas = document.getElementById('fpp-radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;
    this.radarThreatCount = document.getElementById('radar-threat-count');
    this.indicatorsContainer = document.getElementById('fpp-indicators-container');

    this.radarSweepAngle = 0;
    this._fppCamFwd = new THREE.Vector3();
    this._fppCamRight = new THREE.Vector3();
    this._fppUp = new THREE.Vector3(0, 1, 0);
    this._fppToTarget = new THREE.Vector3();
    this._fppProj = new THREE.Vector3();
    this._cam3dFwd = new THREE.Vector3();
    this.baseCenter = new THREE.Vector3(0, 0, 0);
  }

  clear() {
    if (this.indicatorsContainer) this.indicatorsContainer.innerHTML = '';
    if (this.fppOverlay) this.fppOverlay.classList.add('hidden');
  }

  update(dt, camera, meteors, shieldActive, isGameStarted, isGameOver) {
    if (!this.fppOverlay || !this.indicatorsContainer) return;

    // Hanya tampil saat game sedang berjalan aktif
    if (!isGameStarted || isGameOver) {
      if (!this.fppOverlay.classList.contains('hidden')) {
        this.fppOverlay.classList.add('hidden');
        this.indicatorsContainer.innerHTML = '';
      }
      return;
    }

    // Tampilkan Radar & Minimap di SEMUA mode kamera
    if (this.fppOverlay.classList.contains('hidden')) {
      this.fppOverlay.classList.remove('hidden');
    }

    const count = meteors.length;
    if (this.radarThreatCount) {
      this.radarThreatCount.textContent = count === 0 ? 'AMAN' : `${count} TARGET`;
      this.radarThreatCount.classList.toggle('safe', count === 0);
    }

    // Vektor Arah Pandang Kamera Planar di bidang XZ
    camera.getWorldDirection(this._cam3dFwd);
    this._fppCamFwd.copy(this._cam3dFwd);
    this._fppCamFwd.y = 0;
    if (this._fppCamFwd.lengthSq() > 0.0001) this._fppCamFwd.normalize();
    else this._fppCamFwd.set(0, 0, -1);
    this._fppCamRight.crossVectors(this._fppCamFwd, this._fppUp).normalize();

    // 1. RENDER TACTICAL RADAR & MAP (Resolusi 160x160)
    if (this.radarCtx) {
      const size = 160;
      const center = size * 0.5; // 80
      const radarR = 64;
      const maxRange = 65; // meter jangkauan radar/map

      this.radarCtx.clearRect(0, 0, size, size);

      // Lingkaran Konsentris Jangkauan Radar (20m, 40m, 60m)
      this.radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      this.radarCtx.lineWidth = 1;
      [0.31, 0.62, 0.92].forEach((ratio) => {
        this.radarCtx.beginPath();
        this.radarCtx.arc(center, center, radarR * ratio, 0, Math.PI * 2);
        this.radarCtx.stroke();
      });

      // Label Jarak Meter pada Lingkaran Radar
      this.radarCtx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      this.radarCtx.font = '7px sans-serif';
      this.radarCtx.textAlign = 'center';
      this.radarCtx.fillText('20m', center, center - radarR * 0.31 + 8);
      this.radarCtx.fillText('40m', center, center - radarR * 0.62 + 8);

      // Garis Silang Pembantu Sektor
      this.radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      this.radarCtx.setLineDash([2, 4]);
      this.radarCtx.beginPath();
      this.radarCtx.moveTo(center, center - radarR * 0.92);
      this.radarCtx.lineTo(center, center + radarR * 0.92);
      this.radarCtx.moveTo(center - radarR * 0.92, center);
      this.radarCtx.lineTo(center + radarR * 0.92, center);
      this.radarCtx.stroke();
      this.radarCtx.setLineDash([]);

      // Arah Mata Angin Dinamis (U = Utara, T = Timur, S = Selatan, B = Barat)
      const camAngle = Math.atan2(this._fppCamFwd.x, -this._fppCamFwd.z);
      const compassDirs = [
        { label: 'U', angle: -camAngle - Math.PI / 2, color: '#38bdf8' },
        { label: 'T', angle: -camAngle,               color: '#94a3b8' },
        { label: 'S', angle: -camAngle + Math.PI / 2, color: '#94a3b8' },
        { label: 'B', angle: -camAngle + Math.PI,     color: '#94a3b8' }
      ];

      this.radarCtx.font = 'bold 8px sans-serif';
      this.radarCtx.textBaseline = 'middle';
      compassDirs.forEach((d) => {
        const dirDist = radarR * 0.92 - 6;
        const lx = center + Math.cos(d.angle) * dirDist;
        const ly = center + Math.sin(d.angle) * dirDist;
        this.radarCtx.fillStyle = d.color;
        this.radarCtx.fillText(d.label, lx, ly);
      });

      // Vision Cone Bidang Pandang Kamera (FOV ~60° mengarah ke DEPAN)
      this.radarCtx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      this.radarCtx.beginPath();
      this.radarCtx.moveTo(center, center);
      this.radarCtx.arc(center, center, radarR * 0.92, -Math.PI / 2 - 0.52, -Math.PI / 2 + 0.52);
      this.radarCtx.closePath();
      this.radarCtx.fill();

      // Radar Sweep Line (Animasi Pemindaian Taktis)
      this.radarSweepAngle += dt * 3.0;
      const sweepX = center + Math.cos(this.radarSweepAngle) * (radarR * 0.92);
      const sweepY = center + Math.sin(this.radarSweepAngle) * (radarR * 0.92);
      this.radarCtx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      this.radarCtx.lineWidth = 1.2;
      this.radarCtx.beginPath();
      this.radarCtx.moveTo(center, center);
      this.radarCtx.lineTo(sweepX, sweepY);
      this.radarCtx.stroke();

      // Titik Pusat Pangkalan & Perisai Aktif
      if (shieldActive) {
        this.radarCtx.strokeStyle = '#38bdf8';
        this.radarCtx.lineWidth = 1.5;
        this.radarCtx.beginPath();
        this.radarCtx.arc(center, center, 7, 0, Math.PI * 2);
        this.radarCtx.stroke();
      }
      this.radarCtx.fillStyle = '#0284c7';
      this.radarCtx.beginPath();
      this.radarCtx.arc(center, center, 4, 0, Math.PI * 2);
      this.radarCtx.fill();
      this.radarCtx.strokeStyle = '#ffffff';
      this.radarCtx.lineWidth = 1.2;
      this.radarCtx.stroke();

      const now = performance.now();

      // RENDER LINTASAN ASAL METEOR & BLIP PADA MAP
      meteors.forEach((m) => {
        this._fppToTarget.subVectors(m.position, this.baseCenter);
        const fwd = this._fppToTarget.dot(this._fppCamFwd);
        const rgt = this._fppToTarget.dot(this._fppCamRight);
        const flatDist = Math.hypot(rgt, fwd);
        const distRatio = Math.min(flatDist, maxRange) / maxRange;
        const angle = Math.atan2(-fwd, rgt);

        const dotX = center + Math.cos(angle) * (distRatio * radarR * 0.92);
        const dotY = center + Math.sin(angle) * (distRatio * radarR * 0.92);
        const color = RADAR_COLORS[m.userData.type] || '#ef4444';

        // Titik asal kemunculan meteor (spawn origin)
        const spawnPos = m.userData.spawnPos || m.position;
        this._fppToTarget.subVectors(spawnPos, this.baseCenter);
        const origFwd = this._fppToTarget.dot(this._fppCamFwd);
        const origRgt = this._fppToTarget.dot(this._fppCamRight);
        const origDist = Math.hypot(origRgt, origFwd);
        const origRatio = Math.min(origDist, maxRange) / maxRange;
        const origAngle = Math.atan2(-origFwd, origRgt);

        const origX = center + Math.cos(origAngle) * (origRatio * radarR * 0.92);
        const origY = center + Math.sin(origAngle) * (origRatio * radarR * 0.92);

        // 1. Garis Vektor Lintasan Asal ke Titik Sekarang
        this.radarCtx.strokeStyle = color;
        this.radarCtx.lineWidth = 1;
        this.radarCtx.setLineDash([2, 3]);
        this.radarCtx.beginPath();
        this.radarCtx.moveTo(origX, origY);
        this.radarCtx.lineTo(dotX, dotY);
        this.radarCtx.stroke();
        this.radarCtx.setLineDash([]);

        // Garis lintasan prediksi ke arah pangkalan
        this.radarCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.radarCtx.setLineDash([1, 4]);
        this.radarCtx.beginPath();
        this.radarCtx.moveTo(dotX, dotY);
        this.radarCtx.lineTo(center, center);
        this.radarCtx.stroke();
        this.radarCtx.setLineDash([]);

        // 2. Beacon Indikator Titik Asal (Pulse Effect)
        const age = (now - (m.userData.spawnTime || now)) / 1000;
        if (age < 3.5) {
          const pulseR = 3 + (age % 1.2) * 5;
          this.radarCtx.strokeStyle = color;
          this.radarCtx.lineWidth = 1.2;
          this.radarCtx.beginPath();
          this.radarCtx.arc(origX, origY, pulseR, 0, Math.PI * 2);
          this.radarCtx.stroke();
        }
        this.radarCtx.fillStyle = color;
        this.radarCtx.beginPath();
        this.radarCtx.arc(origX, origY, 2, 0, Math.PI * 2);
        this.radarCtx.fill();

        // 3. Blip Titik Meteor Saat Ini
        const isDanger = flatDist < 22;
        const dotRadius = m.userData.type === 'boss' ? 5.5 : (isDanger ? 4.2 : 3.2);

        this.radarCtx.fillStyle = color;
        this.radarCtx.beginPath();
        this.radarCtx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.radarCtx.fill();

        if (isDanger) {
          this.radarCtx.strokeStyle = '#ffffff';
          this.radarCtx.lineWidth = 1.2;
          this.radarCtx.stroke();
        }
      });
    }

    // 2. INDIKATOR ARAH TEPI LAYAR (OFF-SCREEN THREAT ARROWS)
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
      const dist = camera.position.distanceTo(mPos);

      this._fppToTarget.subVectors(mPos, camera.position);
      const dotFwd = this._fppToTarget.dot(this._cam3dFwd);
      const isBehind = dotFwd <= 0;

      this._fppProj.copy(mPos).project(camera);

      if (isBehind) {
        this._fppProj.x = -this._fppProj.x;
        this._fppProj.y = -this._fppProj.y;
      }

      const typeKey = m.userData.type || 'standard';
      const typeLabel = METEOR_NAMES[typeKey] || 'METEOR';
      const isCritical = dist < 24;

      const isOnScreen = !isBehind && Math.abs(this._fppProj.x) <= 0.88 && Math.abs(this._fppProj.y) <= 0.88;

      if (!isOnScreen) {
        let dirX = this._fppProj.x;
        let dirY = -this._fppProj.y;
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

    this.indicatorsContainer.innerHTML = html;
  }
}
