import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { setupGUI } from "./gui.js";

// --- DOM ELEMENTS ---
const app = document.getElementById("app");
const info = document.getElementById("info");

// --- SCENE & SIZES ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4, 3, 6);
scene.add(camera);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

// --- CONTROLS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.8, 0);
controls.enableDamping = true;
controls.saveState();

// --- OBJECTS ---
// 1. Cube
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x22d3ee });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(-1.2, 0.6, 0);
cube.castShadow = true;
scene.add(cube);

// 2. Sphere
const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({
  color: 0x4488ff,
  shininess: 60
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(1.4, 0.75, 0);
sphere.castShadow = true;
scene.add(sphere);

// 3. Ground Plane
const groundGeometry = new THREE.PlaneGeometry(10, 10);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x334155 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// --- LIGHTS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(3, 5, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.left = -5;
directionalLight.shadow.camera.right = 5;
directionalLight.shadow.camera.top = 5;
directionalLight.shadow.camera.bottom = -5;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 20;
scene.add(directionalLight);

// --- ANIMATION PARAMETERS & GUI INIT ---
const animParams = {
  animate: true,
  cubeRotSpeed: 0.8,
  sphereBobSpeed: 2.0,
  sphereBobHeight: 0.15,
  resetCamera: () => controls.reset()
};

// Hubungkan objek ke modul gui.js
setupGUI({
  scene,
  camera,
  renderer,
  controls,
  cube,
  cubeMaterial,
  sphere,
  sphereMaterial,
  groundMaterial,
  ambientLight,
  directionalLight,
  animParams
});

// --- RESIZE HANDLER ---
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (animParams.animate) {
    elapsed += delta;
    cube.rotation.x += animParams.cubeRotSpeed * 0.4 * delta;
    cube.rotation.y += animParams.cubeRotSpeed * delta;
    sphere.rotation.y += 0.5 * delta;
    sphere.position.y =
      0.75 + Math.sin(elapsed * animParams.sphereBobSpeed) * animParams.sphereBobHeight;
  }

  // Update OrbitControls
  controls.update();

  // Update HUD
  info.textContent =
    `Objects: ${scene.children.length} | ` +
    `Camera: ${camera.position.x.toFixed(1)}, ` +
    `${camera.position.y.toFixed(1)}, ` +
    `${camera.position.z.toFixed(1)}`;

  renderer.render(scene, camera);
}

animate();