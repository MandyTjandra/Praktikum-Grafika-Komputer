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

    // --- PEMUATAN ASSET GLTF/GLB (Syarat C.3 & C.10: Bebas Console Error) ---
    this.satelliteGroup = new THREE.Group();
    this.satelliteGroup.position.set(0, 6.5, 0);
    this.baseGroup.add(this.satelliteGroup);
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
        this.satelliteGroup.add(model);
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
    const wingGeo = new THREE.BoxGeometry(3.2, 0.08, 0.7);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.1 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    tempSat.add(core, wing);

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
          this.satelliteGroup.add(model);
          URL.revokeObjectURL(url);
        });
      },
      undefined,
      { binary: true }
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

    // Animasi Orbit Satelit GLB
    this.satelliteGroup.rotation.y += dt * 1.4;
  }
}