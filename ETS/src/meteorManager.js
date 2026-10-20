import * as THREE from 'three';

export const METEOR_TYPES = {
  standard: { radius: 1.2, speed: 8.5, hp: 2,  color: 0x64748b, emissive: 0x000000, score: 100, coins: 12 },
  speedy:   { radius: 0.85, speed: 15, hp: 1,  color: 0xfacc15, emissive: 0x713f12, score: 150, coins: 18 },
  armored:  { radius: 1.9, speed: 5.2, hp: 7,  color: 0xef4444, emissive: 0x450a0a, score: 300, coins: 30 },
  cluster:  { radius: 1.5, speed: 6.8, hp: 3,  color: 0x10b981, emissive: 0x064e3b, score: 220, coins: 25 },
  shard:    { radius: 0.65, speed: 11, hp: 1,  color: 0x34d399, emissive: 0x065f46, score: 70,  coins: 8  },
  boss:     { radius: 4.2, speed: 2.8, hp: 35, color: 0x7e22ce, emissive: 0x3b0764, score: 2000, coins: 200 }
};

export class MeteorManager {
  constructor(scene, vfx) {
    this.scene = scene;
    this.vfx = vfx;
    this.meteors = [];
    this.trailTimer = 0;
    this.bossMeteor = null;
  }

  spawnMeteor(forcedType = null, customOrigin = null, wave = 1) {
    let typeKey = forcedType;
    if (!typeKey) {
      const r = Math.random();
      if (wave === 1) {
        // Wave 1 (Awal Game): Sangat ramah pemula, dominan Standard (85%) & sedikit Speedy (15%)
        // Tanpa Armored (HP tebal) dan tanpa Cluster yang memecah!
        if (r < 0.85) typeKey = 'standard';
        else typeKey = 'speedy';
      } else if (wave === 2) {
        // Wave 2: Mulai perkenalkan variasi Cluster dan sedikit Armored
        if (r < 0.50) typeKey = 'standard';
        else if (r < 0.75) typeKey = 'speedy';
        else if (r < 0.90) typeKey = 'cluster';
        else typeKey = 'armored';
      } else {
        // Wave 3+: Komposisi penuh tantangan
        if (r < 0.35) typeKey = 'standard';
        else if (r < 0.60) typeKey = 'speedy';
        else if (r < 0.80) typeKey = 'cluster';
        else typeKey = 'armored';
      }
    }

    const cfg = METEOR_TYPES[typeKey];
    let geo;
    if (typeKey === 'cluster') {
      geo = new THREE.OctahedronGeometry(cfg.radius, 1);
    } else if (typeKey === 'boss') {
      geo = new THREE.DodecahedronGeometry(cfg.radius, 2);
    } else {
      geo = new THREE.DodecahedronGeometry(cfg.radius, 1);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.emissive,
      roughness: 0.7,
      metalness: 0.3
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Untuk Boss Asteroid, tambahkan tonjolan kawah ornamen
    if (typeKey === 'boss') {
      for (let i = 0; i < 6; i++) {
        const subGeo = new THREE.DodecahedronGeometry(0.9 + Math.random() * 0.6, 0);
        const subMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.9 });
        const bump = new THREE.Mesh(subGeo, subMat);
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        bump.position.set(
          Math.sin(theta) * Math.cos(phi) * (cfg.radius * 0.9),
          Math.sin(theta) * Math.sin(phi) * (cfg.radius * 0.9),
          Math.cos(theta) * (cfg.radius * 0.9)
        );
        bump.castShadow = true;
        mesh.add(bump);
      }
      this.bossMeteor = mesh;
    }

    if (customOrigin) {
      mesh.position.copy(customOrigin);
    } else {
      // Jarak kemunculan di awal game dibuat lebih jauh (52-74m) agar pemain memiliki waktu reaksi cukup
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnRadius = (wave === 1 ? 52 : 46) + Math.random() * 22; // 52-74m di wave 1
      const spawnHeight = 24 + Math.random() * 20;
      mesh.position.set(
        Math.cos(spawnAngle) * spawnRadius,
        spawnHeight,
        Math.sin(spawnAngle) * spawnRadius
      );
    }

    // Skala kecepatan musuh dibuat lebih bersahabat di wave awal
    const waveSpeedScale = wave === 1 ? 0.70 : (wave === 2 ? 0.86 : 1.0);
    const effectiveSpeed = cfg.speed * waveSpeedScale;

    // Target pangkalan / turret di tengah planet dengan sedikit variasi acak
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      0.5,
      (Math.random() - 0.5) * 6
    );
    const velocity = target.sub(mesh.position).normalize().multiplyScalar(effectiveSpeed);

    // Tambahan sebaran gerak lateral untuk pecahan cluster shard
    if (typeKey === 'shard') {
      velocity.x += (Math.random() - 0.5) * 3.0;
      velocity.z += (Math.random() - 0.5) * 3.0;
    }

    // Di Wave 1, Standard Meteor hanya butuh 1-2 tembakan laser ringan
    const initialHp = (wave === 1 && typeKey === 'standard') ? 1.5 : cfg.hp;

    mesh.userData = {
      type: typeKey,
      hp: initialHp,
      maxHp: initialHp,
      score: cfg.score,
      coins: cfg.coins,
      velocity,
      rotSpeed: new THREE.Vector3(Math.random() * 2.2, Math.random() * 2.2, Math.random() * 2.2),
      flashTime: 0,
      spawnPos: mesh.position.clone(), // Menyimpan titik asal kemunculan meteor untuk garis lintasan pada Map
      spawnTime: performance.now()
    };

    this.scene.add(mesh);
    this.meteors.push(mesh);
    return mesh;
  }

  // Mekanik Cluster: Memecah jadi 3 meteor kecil saat hancur
  spawnClusterShards(originPos, wave = 2) {
    for (let i = 0; i < 3; i++) {
      const offset = new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3);
      this.spawnMeteor('shard', originPos.clone().add(offset), wave);
    }
  }

  getBossStatus() {
    if (this.bossMeteor && this.meteors.includes(this.bossMeteor)) {
      return {
        active: true,
        hp: this.bossMeteor.userData.hp,
        maxHp: this.bossMeteor.userData.maxHp
      };
    }
    return { active: false, hp: 0, maxHp: 1 };
  }

  clearAll() {
    this.meteors.forEach((m) => this.scene.remove(m));
    this.meteors.length = 0;
    this.bossMeteor = null;
  }

  update(dt, timeScale, onPlanetImpact) {
    this.trailTimer += dt;
    const emitTrail = this.trailTimer > 0.055;
    if (emitTrail) this.trailTimer = 0;

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.position.addScaledVector(m.userData.velocity, dt * timeScale);
      m.rotation.x += m.userData.rotSpeed.x * dt * timeScale;
      m.rotation.y += m.userData.rotSpeed.y * dt * timeScale;

      // Handle hit flash decay
      if (m.userData.flashTime > 0) {
        m.userData.flashTime -= dt;
        if (m.userData.flashTime <= 0) {
          m.material.emissive.setHex(METEOR_TYPES[m.userData.type].emissive);
        }
      }

      if (emitTrail) {
        const trailColor = m.userData.type === 'boss'
          ? 0xa855f7
          : (m.userData.type === 'cluster'
            ? 0x10b981
            : (m.userData.type === 'speedy' ? 0xfacc15 : 0xf97316));
        this.vfx.spawnFireTrail(m.position, trailColor);
      }

      if (m.position.y <= 1.0) {
        if (m === this.bossMeteor) this.bossMeteor = null;
        onPlanetImpact(m);
        this.scene.remove(m);
        this.meteors.splice(i, 1);
      }
    }
  }
}