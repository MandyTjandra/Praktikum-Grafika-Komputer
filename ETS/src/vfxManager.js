import * as THREE from 'three';

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.debris = [];
    this.beams = [];
    this.missiles = [];
    this.shakeIntensity = 0;
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.audioCtx = new AudioContextClass();
    }
  }

  playSound(type) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'shoot_laser' || type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'shoot_missile') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'shoot_railgun') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'reload') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(480, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'explosion') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(24, now + 0.32);
        gain.gain.setValueAtTime(0.26, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'hitPlanet') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(18, now + 0.48);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.48);
        osc.start(now);
        osc.stop(now + 0.48);
      } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.28);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'emp') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'alarm') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (_) {
      // Abaikan jika browser memblokir autoplay audio
    }
  }

  triggerScreenShake(amount = 0.6) {
    this.shakeIntensity = Math.max(this.shakeIntensity, amount);
  }

  // --- LEDAKAN PARTIKEL & DEBRIS PECAHAN BATUAN ---
  createExplosion(position, color = 0xf97316, count = 22, speedScale = 14) {
    // 1. Partikel Energi Menyala
    const geo = new THREE.DodecahedronGeometry(0.24, 0);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(position);
      p.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * speedScale,
          (Math.random() - 0.5) * speedScale,
          (Math.random() - 0.5) * speedScale
        ),
        life: 0.55 + Math.random() * 0.25
      };
      this.scene.add(p);
      this.particles.push(p);
    }

    // 2. Pecahan Batuan (Debris) yang berputar dengan gravitasi
    const debrisCount = Math.floor(count * 0.45);
    const debrisMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1
    });

    for (let i = 0; i < debrisCount; i++) {
      const dGeo = new THREE.TetrahedronGeometry(0.2 + Math.random() * 0.25, 0);
      const deb = new THREE.Mesh(dGeo, debrisMat);
      deb.position.copy(position);
      deb.castShadow = true;
      deb.receiveShadow = true;
      deb.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * (speedScale * 0.8),
          Math.random() * (speedScale * 0.6),
          (Math.random() - 0.5) * (speedScale * 0.8)
        ),
        rotSpeed: new THREE.Vector3(
          Math.random() * 8,
          Math.random() * 8,
          Math.random() * 8
        ),
        life: 1.0 + Math.random() * 0.4
      };
      this.scene.add(deb);
      this.debris.push(deb);
    }
  }

  spawnFireTrail(position, color = 0xf97316) {
    const geo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(position).add(
      new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6)
    );
    p.userData = {
      velocity: new THREE.Vector3(0, 1.6, 0),
      life: 0.26
    };
    this.scene.add(p);
    this.particles.push(p);
  }

  // --- SINAR LASER & RAILGUN PIERCE ---
  createBeam(startPos, endPos, color = 0x38bdf8, isRailgun = false) {
    const dir = new THREE.Vector3().subVectors(endPos, startPos);
    const len = dir.length();
    const radius = isRailgun ? 0.28 : 0.08;

    const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
    geo.translate(0, len / 2, 0);
    geo.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({ color });
    const beam = new THREE.Mesh(geo, mat);
    beam.position.copy(startPos);
    beam.lookAt(endPos);
    beam.userData = { life: isRailgun ? 0.22 : 0.12 };

    this.scene.add(beam);
    this.beams.push(beam);

    // Shockwave ring untuk Railgun
    if (isRailgun) {
      const ringGeo = new THREE.RingGeometry(0.6, 1.1, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(startPos).addScaledVector(dir.normalize(), 3.5);
      ring.lookAt(endPos);
      ring.userData = { life: 0.2 };
      this.scene.add(ring);
      this.beams.push(ring);
    }
  }

  // --- PROYEKTIL PELURU KENDALI (MISSILE 3D) ---
  createMissile(startPos, targetPos, onHit) {
    const group = new THREE.Group();
    group.position.copy(startPos);

    // Bodi roket
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);

    // Moncong kerucut roket
    const noseGeo = new THREE.ConeGeometry(0.18, 0.45, 8);
    noseGeo.rotateX(Math.PI / 2);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.z = 0.8;

    group.add(body, nose);
    this.scene.add(group);

    const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
    group.lookAt(targetPos);

    this.missiles.push({
      mesh: group,
      target: targetPos.clone(),
      velocity: dir.multiplyScalar(32),
      onHit,
      life: 3.0
    });
  }

  update(dt, camera, baseCamPos, baseCamLook) {
    // 1. Partikel Energi
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.addScaledVector(p.userData.velocity, dt);
      p.userData.life -= dt;
      p.scale.setScalar(Math.max(0.01, p.userData.life * 1.8));
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
      }
    }

    // 2. Pecahan Batuan (Debris) dengan Gravitasi
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const deb = this.debris[i];
      deb.userData.velocity.y -= 18.0 * dt; // Gravitasi
      deb.position.addScaledVector(deb.userData.velocity, dt);
      deb.rotation.x += deb.userData.rotSpeed.x * dt;
      deb.rotation.y += deb.userData.rotSpeed.y * dt;
      deb.rotation.z += deb.userData.rotSpeed.z * dt;
      deb.userData.life -= dt;
      if (deb.userData.life <= 0 || deb.position.y < -2) {
        this.scene.remove(deb);
        this.debris.splice(i, 1);
      }
    }

    // 3. Sinar Beam & Shockwave Rings
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.userData.life -= dt;
      if (b.userData.life <= 0) {
        this.scene.remove(b);
        this.beams.splice(i, 1);
      }
    }

    // 4. Update Peluru Kendali (Missile Projectiles)
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.mesh.position.addScaledVector(m.velocity, dt);
      m.life -= dt;

      // Jejak asap roket
      this.spawnFireTrail(m.mesh.position, 0xf97316);

      const dist = m.mesh.position.distanceTo(m.target);
      if (dist < 1.6 || m.life <= 0) {
        if (m.onHit) m.onHit(m.mesh.position);
        this.scene.remove(m.mesh);
        this.missiles.splice(i, 1);
      }
    }

    // 5. Screen Shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.8);
      camera.position.set(
        baseCamPos.x + (Math.random() - 0.5) * this.shakeIntensity,
        baseCamPos.y + (Math.random() - 0.5) * this.shakeIntensity,
        baseCamPos.z + (Math.random() - 0.5) * this.shakeIntensity
      );
    } else {
      camera.position.copy(baseCamPos);
    }
    camera.lookAt(baseCamLook);
  }
}