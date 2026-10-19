import * as THREE from 'three';

export const SPACE_BACKGROUND_COLOR = 0x05070f; // Warna background antariksa tetap sama (hitam kosmik konstan)

export const PLANET_THEMES = [
  { name: 'Lunar Slate',  ground: 0x1e293b, crater: 0x0f172a },
  { name: 'Mars Red',     ground: 0x881337, crater: 0x4c0519 },
  { name: 'Ice Europa',   ground: 0x0284c7, crater: 0x082f49 },
  { name: 'Toxic Alien',  ground: 0x15803d, crater: 0x14532d },
  { name: 'Volcanic Ash', ground: 0x78350f, crater: 0x291404 }
];

export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SPACE_BACKGROUND_COLOR);
  scene.fog = new THREE.FogExp2(SPACE_BACKGROUND_COLOR, 0.004);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);

  // --- PENCAHAYAAN (Syarat C.4: Min. 2 Light + Shadows) ---
  const ambientLight = new THREE.AmbientLight(0x475569, 1.3);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
  dirLight.position.set(28, 50, 22);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 160;
  const d = 45;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  const basePointLight = new THREE.PointLight(0x38bdf8, 5, 30);
  basePointLight.position.set(0, 5, 0);
  scene.add(basePointLight);

  // --- GROUND PERMUKAAN PLANET & KAWAH (Syarat C.2 & C.4) ---
  const groundMat = new THREE.MeshStandardMaterial({
    color: PLANET_THEMES[0].ground,
    roughness: 0.85,
    metalness: 0.15
  });
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(42, 48, 4, 64), groundMat);
  ground.position.y = -2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Ornamen batuan/kawah di sekitar markas (Object tambahan untuk cast/receive shadow)
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.1 });
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 14 + Math.random() * 14;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 1.5, 0), rockMat);
    rock.position.set(Math.cos(angle) * dist, 0.3, Math.sin(angle) * dist);
    rock.scale.y = 0.6;
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // --- KUBAH PERISAI PLANET (SHIELD DOME VFX) ---
  const shieldGeo = new THREE.SphereGeometry(11, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.28,
    wireframe: false,
    side: THREE.DoubleSide
  });
  const shieldDome = new THREE.Mesh(shieldGeo, shieldMat);
  shieldDome.visible = false;
  scene.add(shieldDome);

  // --- PROCEDURAL STARFIELD SKYBOX (Syarat C.5) ---
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1600;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPos[i] = (Math.random() - 0.5) * 380;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starField = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.55 })
  );
  scene.add(starField);

  // --- SISTEM KAMERA 360 DERAJAT SEMUA MODE (TPS, FPS, TOP-DOWN) ---
  const CAMERA_MODES = [
    { name: 'Third-Person',         defaultDist: 27, defaultElev: 0.38, minElev: 0.05, maxElev: 1.35, isFPS: false },
    { name: 'First-Person (Turret)', defaultDist: 0.1, defaultElev: 0.12, minElev: -0.45, maxElev: 1.25, isFPS: true },
    { name: 'Top-Down / Isometric', defaultDist: 45, defaultElev: 1.15, minElev: 0.65, maxElev: 1.48, isFPS: false }
  ];

  let camModeIndex = 0;
  let azimuth = 0;            // Rotasi horisontal 360 derajat (bebas penuh)
  let elevation = 0.38;       // Sudut elevasi / pitch vertikal
  let distance = 27;          // Jarak kamera ke pivot target
  let targetAzimuth = 0;
  let targetElevation = 0.38;
  let targetDistance = 27;

  const baseCamPos = new THREE.Vector3();
  const baseCamLook = new THREE.Vector3();
  const pivotPoint = new THREE.Vector3(0, 3, 0);

  function setCameraMode(index) {
    camModeIndex = (index % CAMERA_MODES.length + CAMERA_MODES.length) % CAMERA_MODES.length;
    const mode = CAMERA_MODES[camModeIndex];
    targetElevation = mode.defaultElev;
    targetDistance = mode.defaultDist;
    elevation = targetElevation;
    distance = targetDistance;
    updateCameraVectors();
    return mode.name;
  }

  function rotateCamera(deltaAzimuth, deltaElevation) {
    targetAzimuth += deltaAzimuth;
    const mode = CAMERA_MODES[camModeIndex];
    targetElevation = Math.max(mode.minElev, Math.min(mode.maxElev, targetElevation + deltaElevation));
  }

  function zoomCamera(deltaDist) {
    if (CAMERA_MODES[camModeIndex].isFPS) return;
    targetDistance = Math.max(10, Math.min(75, targetDistance + deltaDist));
  }

  function updateCameraVectors() {
    const mode = CAMERA_MODES[camModeIndex];
    if (mode.isFPS) {
      // First-person: posisi di turret head
      baseCamPos.set(0, 3.8, 0);
      const lookDist = 50;
      baseCamLook.set(
        baseCamPos.x + Math.sin(azimuth) * Math.cos(elevation) * lookDist,
        baseCamPos.y + Math.sin(elevation) * lookDist,
        baseCamPos.z - Math.cos(azimuth) * Math.cos(elevation) * lookDist
      );
    } else {
      // Third-person & Top-down: orbit 360 derajat mengelilingi planet/markas
      pivotPoint.set(0, mode.name.includes('Top-Down') ? 0 : 3, 0);
      const x = pivotPoint.x + Math.sin(azimuth) * Math.cos(elevation) * distance;
      const y = pivotPoint.y + Math.sin(elevation) * distance;
      const z = pivotPoint.z + Math.cos(azimuth) * Math.cos(elevation) * distance;
      baseCamPos.set(x, y, z);
      baseCamLook.copy(pivotPoint);
    }
  }

  function updateCamera(dt) {
    // Interpolasi halus (lerp) pergerakan kamera 360 derajat
    azimuth += (targetAzimuth - azimuth) * Math.min(1, dt * 14);
    elevation += (targetElevation - elevation) * Math.min(1, dt * 14);
    distance += (targetDistance - distance) * Math.min(1, dt * 14);
    updateCameraVectors();
  }

  setCameraMode(0);

  // Mouse Drag Kanan untuk Rotasi Bebas 360 Derajat
  let isRightDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  window.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('mousedown', (e) => {
    // Klik Kanan (button 2) atau Alt+Klik Kiri untuk drag rotasi 360 derajat
    if (e.button === 2 || (e.button === 0 && e.altKey)) {
      isRightDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isRightDragging) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      const sens = 0.0055;
      rotateCamera(-dx * sens, dy * sens);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 2 || e.button === 0) {
      isRightDragging = false;
    }
  });

  // Mouse Wheel untuk Zoom In / Out
  window.addEventListener('wheel', (e) => {
    zoomCamera(e.deltaY * 0.035);
  }, { passive: true });

  function applyPlanetTheme(themeIdx) {
    const t = PLANET_THEMES[themeIdx % PLANET_THEMES.length];
    groundMat.color.setHex(t.ground);
    rockMat.color.setHex(t.crater);
    // Warna background antariksa tetap sama (hitam kosmik konstan)
    scene.background.setHex(SPACE_BACKGROUND_COLOR);
    scene.fog.color.setHex(SPACE_BACKGROUND_COLOR);
    return t.name;
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    camera,
    renderer,
    basePointLight,
    shieldDome,
    starField,
    baseCamPos,
    baseCamLook,
    getCamModeIndex: () => camModeIndex,
    isFPS: () => CAMERA_MODES[camModeIndex].isFPS,
    getAzimuth: () => azimuth,
    nextCameraMode: () => setCameraMode(camModeIndex + 1),
    setCameraMode,
    rotateCamera,
    zoomCamera,
    updateCamera,
    applyPlanetTheme
  };
}