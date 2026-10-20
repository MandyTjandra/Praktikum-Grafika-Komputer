import fs from 'fs';
import path from 'path';

// FileReader polyfill for GLTFExporter in Node.js
class FileReaderShim {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    if (this.onloadend) this.onloadend();
  }
}
globalThis.FileReader = FileReaderShim;

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function buildSatellite() {
  const root = new THREE.Group();
  root.name = 'SatelliteRoot';

  // --- 1. MAIN FUSELAGE / CORE BUS ---
  const hullGroup = new THREE.Group();
  hullGroup.name = 'HullGroup';

  // Titanium main body (Hexagonal Prism)
  const hullGeo = new THREE.CylinderGeometry(0.5, 0.55, 1.1, 6);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  });
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.name = 'Fuselage';
  hullGroup.add(hullMesh);

  // MLI Gold Foil Thermal Insulation Belt
  const foilGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.45, 6);
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });
  const foilMesh = new THREE.Mesh(foilGeo, foilMat);
  foilMesh.name = 'GoldFoilWrap';
  hullGroup.add(foilMesh);

  // Upper & Lower Titanium Rings
  const ringGeo = new THREE.TorusGeometry(0.51, 0.04, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2,
  });
  const ringTop = new THREE.Mesh(ringGeo, ringMat);
  ringTop.rotation.x = Math.PI / 2;
  ringTop.position.y = 0.5;
  const ringBottom = ringTop.clone();
  ringBottom.position.y = -0.5;
  hullGroup.add(ringTop, ringBottom);

  // Recon Targeting Sensor Lens (Forward Facing)
  const lensGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
    metalness: 0.9,
    roughness: 0.1,
  });
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.name = 'ReconCameraLens';
  lens.position.set(0, 0.2, 0.45);
  hullGroup.add(lens);

  // Secondary Sensor Pods
  const podGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
  const podMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0369a1,
    emissiveIntensity: 0.8,
  });
  const pod1 = new THREE.Mesh(podGeo, podMat);
  pod1.rotation.x = Math.PI / 2;
  pod1.position.set(-0.25, 0.2, 0.42);
  const pod2 = pod1.clone();
  pod2.position.x = 0.25;
  hullGroup.add(pod1, pod2);

  root.add(hullGroup);

  // --- 2. RADAR SCANNING DISH & MAST (ANIMATED PART 1) ---
  const radarMount = new THREE.Group();
  radarMount.name = 'RadarMount';
  radarMount.position.set(0, 0.65, 0);

  // Turret Mast / Base Stem
  const mastGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.25, 12);
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.8,
    roughness: 0.3,
  });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.y = 0.12;
  radarMount.add(mast);

  // Tilting Dish Pivot Group
  const radarDish = new THREE.Group();
  radarDish.name = 'RadarDish';
  radarDish.position.set(0, 0.25, 0);

  // Parabolic Dish Basin
  const dishGeo = new THREE.SphereGeometry(0.48, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.85,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });
  const dishMesh = new THREE.Mesh(dishGeo, dishMat);
  dishMesh.rotation.x = -Math.PI / 2;
  radarDish.add(dishMesh);

  // Gold Inner Reflector Mesh
  const subDishGeo = new THREE.SphereGeometry(0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const subDishMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.15,
    side: THREE.DoubleSide,
  });
  const subDish = new THREE.Mesh(subDishGeo, subDishMat);
  subDish.rotation.x = -Math.PI / 2;
  subDish.position.z = 0.08;
  radarDish.add(subDish);

  // Antenna Feed Horn Arm
  const hornArmGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.38, 8);
  const hornArmMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
  const hornArm = new THREE.Mesh(hornArmGeo, hornArmMat);
  hornArm.position.set(0, 0.2, 0);
  radarDish.add(hornArm);

  // Active Scanner Emitter Tip (Cyan Glow)
  const tipGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00ffff,
    emissiveIntensity: 1.8,
  });
  const tipMesh = new THREE.Mesh(tipGeo, tipMat);
  tipMesh.position.set(0, 0.39, 0);
  radarDish.add(tipMesh);

  radarMount.add(radarDish);
  root.add(radarMount);

  // --- 3. DUAL SOLAR WINGS (ANIMATED PART 2) ---
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x082f49,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.15,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    metalness: 0.85,
    roughness: 0.3,
  });

  function createSolarWing(name, sideMultiplier) {
    const wingGroup = new THREE.Group();
    wingGroup.name = name;
    wingGroup.position.set(0.55 * sideMultiplier, 0, 0);

    // Boom Strut
    const boomGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8);
    boomGeo.rotateZ(Math.PI / 2);
    const boom = new THREE.Mesh(boomGeo, mastMat);
    boom.position.x = 0.22 * sideMultiplier;
    wingGroup.add(boom);

    // Panel 1
    const p1Geo = new THREE.BoxGeometry(0.7, 0.03, 0.45);
    const p1Frame = new THREE.Mesh(p1Geo, frameMat);
    p1Frame.position.x = 0.65 * sideMultiplier;
    const p1Cells = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.032, 0.42), panelMat);
    p1Frame.add(p1Cells);
    wingGroup.add(p1Frame);

    // Panel 2 (Outer Segment)
    const p2Frame = new THREE.Mesh(p1Geo, frameMat);
    p2Frame.position.x = 1.4 * sideMultiplier;
    const p2Cells = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.032, 0.42), panelMat);
    p2Frame.add(p2Cells);
    wingGroup.add(p2Frame);

    // Wingtip Status Beacon Light
    const beaconGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: sideMultiplier < 0 ? 0xef4444 : 0x22c55e,
      emissive: sideMultiplier < 0 ? 0xdc2626 : 0x16a34a,
      emissiveIntensity: 1.5,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(1.8 * sideMultiplier, 0, 0.22);
    wingGroup.add(beacon);

    return wingGroup;
  }

  const wingLeft = createSolarWing('SolarWing_Left', -1);
  const wingRight = createSolarWing('SolarWing_Right', 1);
  root.add(wingLeft, wingRight);

  // --- 4. ION THRUSTER ENGINE & PLASMA JET ---
  const thrusterGroup = new THREE.Group();
  thrusterGroup.name = 'ThrusterMount';
  thrusterGroup.position.set(0, -0.6, 0);

  // Engine Bell Nozzle
  const nozzleGeo = new THREE.ConeGeometry(0.28, 0.35, 16, 1, true);
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.95,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });
  const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzle.rotation.x = Math.PI;
  nozzle.position.y = -0.15;
  thrusterGroup.add(nozzle);

  // Pulsing Plasma Jet Core (Scales in Animation Clip 2)
  const plumeGroup = new THREE.Group();
  plumeGroup.name = 'ThrusterPlume';
  plumeGroup.position.set(0, -0.3, 0);

  const plumeGeo = new THREE.ConeGeometry(0.18, 0.55, 16);
  const plumeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.85,
  });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.rotation.x = Math.PI;
  plume.position.y = -0.25;
  plumeGroup.add(plume);

  thrusterGroup.add(plumeGroup);
  root.add(thrusterGroup);

  return { root, radarMount, radarDish, wingLeft, wingRight, plumeGroup };
}

function createAnimations() {
  // ==========================================
  // CLIP 1: 'Radar_Scan' (360 Sweep & Nodding)
  // ==========================================
  const scanDuration = 4.0;
  const scanTimes = [0, 1.0, 2.0, 3.0, 4.0];
  const scanQuats = [];
  const axisY = new THREE.Vector3(0, 1, 0);
  const qY = new THREE.Quaternion();

  for (let i = 0; i < scanTimes.length; i++) {
    const angle = (scanTimes[i] / scanDuration) * Math.PI * 2;
    qY.setFromAxisAngle(axisY, angle);
    scanQuats.push(qY.x, qY.y, qY.z, qY.w);
  }

  const radarRotTrack = new THREE.QuaternionKeyframeTrack(
    'RadarMount.quaternion',
    scanTimes,
    scanQuats
  );

  // Radar Dish Nodding Elevation (±15 degrees pitch)
  const nodTimes = [0, 1.0, 2.0, 3.0, 4.0];
  const nodQuats = [];
  const axisX = new THREE.Vector3(1, 0, 0);
  const qX = new THREE.Quaternion();
  const pitchAngles = [0, THREE.MathUtils.degToRad(14), 0, THREE.MathUtils.degToRad(-14), 0];

  for (let i = 0; i < nodTimes.length; i++) {
    qX.setFromAxisAngle(axisX, pitchAngles[i]);
    nodQuats.push(qX.x, qX.y, qX.z, qX.w);
  }

  const radarNodTrack = new THREE.QuaternionKeyframeTrack(
    'RadarDish.quaternion',
    nodTimes,
    nodQuats
  );

  const clipRadarScan = new THREE.AnimationClip('Radar_Scan', scanDuration, [
    radarRotTrack,
    radarNodTrack,
  ]);

  // ==========================================
  // CLIP 2: 'Solar_Wings_Deploy' (Breathing Wings + Thruster Pulse)
  // ==========================================
  const wingDuration = 3.0;
  const wingTimes = [0, 0.75, 1.5, 2.25, 3.0];
  const leftWingQuats = [];
  const rightWingQuats = [];
  const axisZ = new THREE.Vector3(0, 0, 1);
  const qZ = new THREE.Quaternion();

  // Angular oscillation angles for wings
  const wingAngles = [0, THREE.MathUtils.degToRad(16), 0, THREE.MathUtils.degToRad(-16), 0];

  for (let i = 0; i < wingTimes.length; i++) {
    // Left wing rotates around Z
    qZ.setFromAxisAngle(axisZ, wingAngles[i]);
    leftWingQuats.push(qZ.x, qZ.y, qZ.z, qZ.w);

    // Right wing mirrors rotation
    qZ.setFromAxisAngle(axisZ, -wingAngles[i]);
    rightWingQuats.push(qZ.x, qZ.y, qZ.z, qZ.w);
  }

  const wingLeftTrack = new THREE.QuaternionKeyframeTrack(
    'SolarWing_Left.quaternion',
    wingTimes,
    leftWingQuats
  );
  const wingRightTrack = new THREE.QuaternionKeyframeTrack(
    'SolarWing_Right.quaternion',
    wingTimes,
    rightWingQuats
  );

  // Thruster Jet Scale Pulse Track
  const plumeScales = [
    1.0, 1.0, 1.0,   // t=0
    1.3, 1.6, 1.3,   // t=0.75 (peak flare)
    0.85, 0.85, 0.85,// t=1.5
    1.4, 1.7, 1.4,   // t=2.25 (second pulse)
    1.0, 1.0, 1.0    // t=3.0
  ];
  const plumeScaleTrack = new THREE.VectorKeyframeTrack(
    'ThrusterPlume.scale',
    wingTimes,
    plumeScales
  );

  const clipSolarDeploy = new THREE.AnimationClip('Solar_Wings_Deploy', wingDuration, [
    wingLeftTrack,
    wingRightTrack,
    plumeScaleTrack,
  ]);

  return [clipRadarScan, clipSolarDeploy];
}

async function exportSatelliteGLB() {
  console.log('[1/4] Building 3D Satellite Model Hierarchy...');
  const { root } = buildSatellite();

  console.log('[2/4] Generating Keyframe Animation Tracks (Clip 1 & Clip 2)...');
  const animations = createAnimations();
  console.log('      Animations generated:', animations.map(a => `${a.name} (${a.duration}s, ${a.tracks.length} tracks)`));

  console.log('[3/4] Exporting to Binary GLTF (.glb)...');
  const exporter = new GLTFExporter();

  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (result) => resolve(result),
      (error) => reject(error),
      {
        binary: true,
        animations: animations,
      }
    );
  });

  const outPath = path.resolve('assets/models/satellite.glb');
  fs.writeFileSync(outPath, Buffer.from(glbBuffer));
  console.log(`[4/4] Successfully written to: ${outPath} (${(glbBuffer.byteLength / 1024).toFixed(2)} KB)`);

  // Verify roundtrip parse
  console.log('[Verify] Loading exported GLB back with GLTFLoader...');
  const loader = new GLTFLoader();
  loader.parse(
    glbBuffer,
    '',
    (gltf) => {
      console.log('✓ Model loaded successfully!');
      console.log('✓ Scene children count:', gltf.scene.children.length);
      console.log('✓ Detected animations:', gltf.animations.map(a => `${a.name} (duration: ${a.duration}s)`));
      if (gltf.animations.length === 2) {
        console.log('>>> ALL CHECKS PASSED: Model & 2 Animations are 100% Valid! <<<');
      } else {
        console.error('Mismatch in animation count!');
      }
    },
    (err) => {
      console.error('Failed to parse exported glb:', err);
    }
  );
}

exportSatelliteGLB().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
