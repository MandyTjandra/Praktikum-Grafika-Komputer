import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export const TURRET_SKINS = [
  { name: 'Cyber Cyan',    head: 0x0284c7, barrel: 0x94a3b8, beam: 0x38bdf8 },
  { name: 'Crimson Mecha', head: 0xdc2626, barrel: 0xfca5a5, beam: 0xf43f5e },
  { name: 'Gold Prime',    head: 0xd97706, barrel: 0xfde047, beam: 0xfacc15 },
  { name: 'Neon Emerald',  head: 0x059669, barrel: 0x6ee7b7, beam: 0x10b981 },
  { name: 'Void Purple',   head: 0x7c3aed, barrel: 0xc084fc, beam: 0xa855f7 }
];

export class Turret {
  constructor(scene) {
    this.scene = scene;
    this.skinIndex = 0;
    this.recoilOffset = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.rotationSpeed = 10.0; // Responsif sejak awal, bisa di-upgrade lebih lanjut

    // --- SCENE GRAPH PARENT-CHILD (Syarat C.3) ---
    // Parent: baseGroup -> Child 1: headGroup -> Child 2: cannonGroup
    this.baseGroup = new THREE.Group();
    scene.add(this.baseGroup);

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 3.0, 1.6, 16), baseMat);
    baseMesh.position.y = 0.8;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.baseGroup.add(baseMesh);

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.9;
    this.baseGroup.add(this.headGroup); // Child 1

    this.headMat = new THREE.MeshStandardMaterial({
      color: TURRET_SKINS[0].head,
      metalness: 0.6,
      roughness: 0.25
    });
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1.45, 20, 20), this.headMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    this.cannonGroup = new THREE.Group();
    this.headGroup.add(this.cannonGroup); // Child 2

    this.barrelMat = new THREE.MeshStandardMaterial({
      color: TURRET_SKINS[0].barrel,
      metalness: 0.85,
      roughness: 0.2
    });
    const leftBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 3.8, 12), this.barrelMat);
    leftBarrel.rotation.x = Math.PI / 2;
    leftBarrel.position.set(-0.65, 0.2, -1.9);
    leftBarrel.castShadow = true;

    const rightBarrel = leftBarrel.clone();
    rightBarrel.position.set(0.65, 0.2, -1.9);

    // Muzzle Flash Light
    this.muzzleLight = new THREE.PointLight(0x38bdf8, 0, 12);
    this.muzzleLight.position.set(0, 0.2, -3.8);

    this.cannonGroup.add(leftBarrel, rightBarrel, this.muzzleLight);

    // --- PEMUATAN ASSET GLTF/GLB (Syarat: Asset Luar + 2 Animasi) ---
    this.satelliteGroup = new THREE.Group();
    this.satelliteGroup.position.set(0, 6.5, 0);
    this.baseGroup.add(this.satelliteGroup);

    this.mixer = null;
    this.actions = [];
    this.satelliteMesh = null;
    this.satAnimTime = 0;
    this.loadGLBAsset();
  }

  loadGLBAsset() {
    const loader = new GLTFLoader();

    // Muat file model 3D GLTF/GLB dari folder assets/models/satellite.glb
    loader.load(
      './assets/models/satellite.glb',
      (gltf) => {
        const model = gltf.scene;
        model.position.set(5.5, 0, 0);
        model.scale.setScalar(0.9);
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.satelliteMesh = model;
        this.satelliteGroup.add(model);

        // --- DUKUNGAN ANIMASI EMBEDDED DARI FILE GLB (THREE.AnimationMixer) ---
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          this.actions = gltf.animations.map((clip) => this.mixer.clipAction(clip));
          // Mainkan semua animasi yang tersimpan dalam file GLTF/GLB
          this.actions.forEach((act) => act.play());
          console.log(`[GLTF Model] Berhasil memuat ${gltf.animations.length} animasi:`, gltf.animations.map(a => a.name));
        }
      },
      undefined,
      () => {
        // Fallback procedural GLB jika dibuka langsung tanpa web server (file:// CORS policy)
        this.loadProceduralGLB(loader);
      }
    );
  }

  loadProceduralGLB(loader) {
    const tempSat = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.8, 0),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 })
    );
    core.name = 'Core';

    const dishGroup = new THREE.Group();
    dishGroup.name = 'RadarDish';
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.2, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, side: THREE.DoubleSide })
    );
    dish.rotation.x = Math.PI;
    dishGroup.position.y = 0.9;
    dishGroup.add(dish);

    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.1 })
    );
    wingL.name = 'SolarWing_L';
    wingL.position.x = -1.2;

    const wingR = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.1 })
    );
    wingR.name = 'SolarWing_R';
    wingR.position.x = 1.2;

    tempSat.add(core, dishGroup, wingL, wingR);

    // Animasi fallback 1 & 2
    const q0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2);
    const clip1 = new THREE.AnimationClip('Radar_Scan', 3, [
      new THREE.QuaternionKeyframeTrack('RadarDish.quaternion', [0, 1.5, 3], [q0.x, q0.y, q0.z, q0.w, q1.x, q1.y, q1.z, q1.w, q2.x, q2.y, q2.z, q2.w])
    ]);

    const qZ1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.25);
    const qZ2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.25);
    const qZ0 = new THREE.Quaternion();
    const clip2 = new THREE.AnimationClip('Solar_Pulse', 2, [
      new THREE.QuaternionKeyframeTrack('SolarWing_L.quaternion', [0, 1, 2], [qZ0.x, qZ0.y, qZ0.z, qZ0.w, qZ1.x, qZ1.y, qZ1.z, qZ1.w, qZ0.x, qZ0.y, qZ0.z, qZ0.w]),
      new THREE.QuaternionKeyframeTrack('SolarWing_R.quaternion', [0, 1, 2], [qZ0.x, qZ0.y, qZ0.z, qZ0.w, qZ2.x, qZ2.y, qZ2.z, qZ2.w, qZ0.x, qZ0.y, qZ0.z, qZ0.w])
    ]);

    const exporter = new GLTFExporter();
    exporter.parse(
      tempSat,
      (glbBuffer) => {
        const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        loader.load(url, (gltf) => {
          const model = gltf.scene;
          model.position.set(5.5, 0, 0);
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.satelliteMesh = model;
          this.satelliteGroup.add(model);

          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            this.actions = gltf.animations.map((clip) => this.mixer.clipAction(clip));
            this.actions.forEach((act) => act.play());
          }

          URL.revokeObjectURL(url);
        });
      },
      undefined,
      { binary: true, animations: [clip1, clip2] }
    );
  }

  aimAt(targetPoint) {
    const dx = targetPoint.x - this.baseGroup.position.x;
    const dy = targetPoint.y - this.headGroup.position.y;
    const dz = targetPoint.z - this.baseGroup.position.z;

    this.targetYaw = Math.atan2(dx, dz) + Math.PI;
    const distXZ = Math.sqrt(dx * dx + dz * dz);
    this.targetPitch = Math.atan2(dy, distXZ);
  }

  triggerRecoil() {
    this.recoilOffset = 0.75;
    this.muzzleLight.intensity = 8;
  }

  cycleSkin() {
    this.skinIndex = (this.skinIndex + 1) % TURRET_SKINS.length;
    const s = TURRET_SKINS[this.skinIndex];
    this.headMat.color.setHex(s.head);
    this.barrelMat.color.setHex(s.barrel);
    this.muzzleLight.color.setHex(s.beam);
    return s;
  }

  getMuzzleWorldPosition() {
    const pos = new THREE.Vector3();
    this.muzzleLight.getWorldPosition(pos);
    return pos;
  }

  update(dt) {
    // Interpolasi rotasi meriam 360 derajat (Shortest angular path)
    let diffYaw = (this.targetYaw - this.headGroup.rotation.y) % (Math.PI * 2);
    if (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
    if (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
    this.headGroup.rotation.y += diffYaw * Math.min(1, dt * this.rotationSpeed);

    const diffPitch = (this.targetPitch - this.cannonGroup.rotation.x);
    this.cannonGroup.rotation.x += diffPitch * Math.min(1, dt * this.rotationSpeed);

    // Animasi Recoil Laras
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 3.5);
      this.cannonGroup.position.z = this.recoilOffset;
    }

    if (this.muzzleLight.intensity > 0) {
      this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 45);
    }

    // Animasi 1: Orbit Satelit GLB 360 Derajat
    this.satelliteGroup.rotation.y += dt * 1.4;

    // Animasi 2: Floating Hover & Tilt Kosmik
    if (this.satelliteMesh) {
      this.satAnimTime += dt;
      this.satelliteMesh.position.y = Math.sin(this.satAnimTime * 2.2) * 0.35;
      this.satelliteMesh.rotation.z = Math.sin(this.satAnimTime * 1.8) * 0.12;
    }

    // Update THREE.AnimationMixer jika file GLB memiliki embedded keyframe/skeletal animation
    if (this.mixer) {
      this.mixer.update(dt);
    }
  }
}