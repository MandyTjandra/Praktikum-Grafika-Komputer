import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// --- 1. DOM REFERENCES ---
const hoverInfo = document.getElementById("hoverInfo");
const selectedInfo = document.getElementById("selectedInfo");
const animationInfo = document.getElementById("animationInfo");
const loadingInfo = document.getElementById("loadingInfo");

const inputPosX = document.getElementById("inputPosX");
const posXVal = document.getElementById("posXVal");
const inputPosY = document.getElementById("inputPosY");
const posYVal = document.getElementById("posYVal");
const inputPosZ = document.getElementById("inputPosZ");
const posZVal = document.getElementById("posZVal");
const btnResetObject = document.getElementById("btnResetObject");

const selectAnimation = document.getElementById("selectAnimation");
const inputAnimSpeed = document.getElementById("inputAnimSpeed");
const animSpeedVal = document.getElementById("animSpeedVal");
const inputRoughness = document.getElementById("inputRoughness");
const roughVal = document.getElementById("roughVal");
const inputMetalness = document.getElementById("inputMetalness");
const metalVal = document.getElementById("metalVal");
const inputColor = document.getElementById("inputColor");
const inputDirLight = document.getElementById("inputDirLight");
const dirLightVal = document.getElementById("dirLightVal");
const inputAmbLight = document.getElementById("inputAmbLight");
const ambLightVal = document.getElementById("ambLightVal");
const inputParentSpeed = document.getElementById("inputParentSpeed");
const parentSpeedVal = document.getElementById("parentSpeedVal");
const inputChildSpeed = document.getElementById("inputChildSpeed");
const childSpeedVal = document.getElementById("childSpeedVal");
const btnToggleEnv = document.getElementById("btnToggleEnv");
const btnResetView = document.getElementById("btnResetView");

// --- 2. SCENE & CAMERA ---
const app = document.getElementById("app");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100);
const defaultCamPos = new THREE.Vector3(5, 3.5, 7);
const defaultCamTarget = new THREE.Vector3(0, 1.2, 0);

camera.position.copy(defaultCamPos);
scene.add(camera);

// --- 3. RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

// --- 4. ORBITCONTROLS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(defaultCamTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;
controls.minDistance = 1;
controls.maxDistance = 40;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;

// --- 5. TRANSFORM CONTROLS ---
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.size = 0.85;
scene.add(transformControls);

transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});

transformControls.addEventListener("change", () => {
  if (selectedObject) {
    syncPositionInputs(selectedObject.position);
  }
});

function syncPositionInputs(pos) {
  if (!pos) return;
  inputPosX.value = pos.x;
  posXVal.textContent = pos.x.toFixed(2);
  inputPosY.value = pos.y;
  posYVal.textContent = pos.y.toFixed(2);
  inputPosZ.value = pos.z;
  posZVal.textContent = pos.z.toFixed(2);
}

// --- 6. ENVIRONMENT & LIGHTING ---
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = environment;
let isEnvEnabled = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(4, 8, 4);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(24, 24);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x263449,
  roughness: 0.85,
  metalness: 0.0,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

// --- 7. HIERARKI MINECRAFT ---
const steveGroup = new THREE.Group();
steveGroup.name = "Steve Minecraft";
steveGroup.position.set(-2.5, 0, 0);
scene.add(steveGroup);

const matSkin = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.8 });
const matShirt = new THREE.MeshStandardMaterial({ color: 0x00a8a8, roughness: 0.7 });
const matPants = new THREE.MeshStandardMaterial({ color: 0x283593, roughness: 0.7 });

const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.4), matShirt);
torso.position.y = 1.3;
torso.castShadow = true;
torso.receiveShadow = true;
steveGroup.add(torso);

const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), matSkin);
head.name = "Head";
head.position.y = 0.85;
head.castShadow = true;
torso.add(head);

const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.95, 0.35), matSkin);
leftArm.name = "Left Arm";
leftArm.position.set(-0.6, 0.0, 0);
leftArm.castShadow = true;
torso.add(leftArm);

const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.95, 0.35), matSkin);
rightArm.name = "Right Arm";
rightArm.position.set(0.6, 0.0, 0);
rightArm.castShadow = true;
torso.add(rightArm);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), matPants);
leftLeg.name = "Left Leg";
leftLeg.position.set(-0.22, -0.9, 0);
leftLeg.castShadow = true;
torso.add(leftLeg);

const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), matPants);
rightLeg.name = "Right Leg";
rightLeg.position.set(0.22, -0.9, 0);
rightLeg.castShadow = true;
torso.add(rightLeg);

// --- 8. PBR SPHERE ---
const pbrMaterial = new THREE.MeshStandardMaterial({
  color: 0x22c55e,
  roughness: 0.25,
  metalness: 0.1,
});
const pbrSphere = new THREE.Mesh(new THREE.SphereGeometry(0.7, 48, 24), pbrMaterial);
pbrSphere.name = "PBR Sphere";
pbrSphere.position.set(0, 0.8, 0);
pbrSphere.castShadow = true;
scene.add(pbrSphere);

// --- 9. SELECTABLE OBJECTS & BASE STATE REGISTRATION ---
const interactiveObjects = [];
let hoveredObject = null;
let selectedObject = null;

function registerSelectable(object, label) {
  object.userData.selectable = true;
  object.userData.label = label;
  object.userData.baseScale = object.scale.clone();
  object.userData.initialPosition = object.position.clone(); // Simpan koordinat awal
  interactiveObjects.push(object);
}

registerSelectable(pbrSphere, "PBR Sphere");
registerSelectable(steveGroup, "Steve (Minecraft)");

function findSelectableRoot(object) {
  let current = object;
  while (current) {
    if (current.userData?.selectable) return current;
    current = current.parent;
  }
  return null;
}

function restoreScale(object) {
  if (!object || !object.userData.baseScale) return;
  object.scale.copy(object.userData.baseScale);
}

function applyVisualState(object) {
  if (!object || !object.userData.baseScale) return;
  const base = object.userData.baseScale;
  let factor = 1.0;
  if (object === selectedObject) factor = 1.12;
  else if (object === hoveredObject) factor = 1.06;
  object.scale.set(base.x * factor, base.y * factor, base.z * factor);
}

// --- 10. GLTF / GLB MODEL ---
const loader = new GLTFLoader();
let importedModel = null;
let mixer = null;
let activeAction = null;
let animations = [];

loadingInfo.textContent = "loading model...";

loader.load(
  "./public/models/model.glb",
  (gltf) => {
    importedModel = gltf.scene;
    importedModel.name = "Imported GLB";
    importedModel.position.set(2.4, 0, 0);
    importedModel.scale.setScalar(1.2);

    importedModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    scene.add(importedModel);
    registerSelectable(importedModel, "Soldier Model");

    if (gltf.animations.length > 0) {
      animations = gltf.animations;
      mixer = new THREE.AnimationMixer(importedModel);
      activeAction = mixer.clipAction(animations[0]);
      activeAction.play();
      animationInfo.textContent = animations[0].name || "Clip 0";

      if (selectAnimation) {
        selectAnimation.innerHTML = "";
        animations.forEach((clip, index) => {
          const opt = document.createElement("option");
          opt.value = index;
          opt.textContent = clip.name || `Clip ${index}`;
          selectAnimation.appendChild(opt);
        });
      }
    } else {
      if (selectAnimation) selectAnimation.innerHTML = `<option>Tidak ada clip</option>`;
      animationInfo.textContent = "No clips";
    }

    loadingInfo.textContent = "model loaded";
  },
  (progress) => {
    if (progress.total > 0) {
      const percent = (progress.loaded / progress.total) * 100;
      loadingInfo.textContent = `${percent.toFixed(0)}%`;
    }
  },
  (error) => {
    console.error("GLTF error:", error);
    loadingInfo.textContent = "load failed";
  }
);

// --- 11. RAYCASTING, HOVER & CLICK SELECTION ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

let selectionGesture = null;
let suppressSelection = false;

renderer.domElement.addEventListener("pointerdown", (event) => {
  suppressSelection = event.button !== 0 || selectionGesture !== null;
  selectionGesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

window.addEventListener(
  "pointermove",
  (event) => {
    if (!selectionGesture || event.pointerId !== selectionGesture.id) return;
    if (Math.hypot(event.clientX - selectionGesture.x, event.clientY - selectionGesture.y) > 5) {
      suppressSelection = true;
    }
  },
  true
);

window.addEventListener("pointerup", (event) => {
  if (event.pointerId === selectionGesture?.id) selectionGesture = null;
});

window.addEventListener("pointercancel", () => {
  selectionGesture = null;
  suppressSelection = true;
});

renderer.domElement.addEventListener("pointermove", (event) => {
  if (selectionGesture || transformControls.dragging) return;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(interactiveObjects, true);
  const nextHover = hits.length > 0 ? findSelectableRoot(hits[0].object) : null;

  if (nextHover !== hoveredObject) {
    restoreScale(hoveredObject);
    hoveredObject = nextHover;
    applyVisualState(hoveredObject);
  }
  hoverInfo.textContent = hoveredObject ? hoveredObject.userData.label : "-";
});

renderer.domElement.addEventListener("click", (event) => {
  if (suppressSelection || event.button !== 0 || transformControls.dragging) return;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(interactiveObjects, true);

  restoreScale(selectedObject);
  selectedObject = hits.length > 0 ? findSelectableRoot(hits[0].object) : null;

  applyVisualState(hoveredObject);
  applyVisualState(selectedObject);
  selectedInfo.textContent = selectedObject ? selectedObject.userData.label : "-";

  if (selectedObject) {
    transformControls.attach(selectedObject);
    syncPositionInputs(selectedObject.position);
  } else {
    transformControls.detach();
  }
});

// --- 12. LOGIKA TOMBOL RESET OBJEK ---
btnResetObject.addEventListener("click", () => {
  if (selectedObject && selectedObject.userData.initialPosition) {
    // Reset objek yang sedang dipilih
    selectedObject.position.copy(selectedObject.userData.initialPosition);
    syncPositionInputs(selectedObject.position);
  } else {
    // Jika tidak ada yang dipilih, reset semua objek interaktif ke posisi awal
    interactiveObjects.forEach((obj) => {
      if (obj.userData.initialPosition) {
        obj.position.copy(obj.userData.initialPosition);
      }
    });
    if (selectedObject) {
      syncPositionInputs(selectedObject.position);
    }
  }
});

// --- 13. KONTROL KEYBOARD (KAMERA & PEMINDAHAN OBJEK) ---
const keyStates = {};
window.addEventListener("keydown", (e) => {
  keyStates[e.code] = true;

  if (selectedObject) {
    const step = 0.2;
    let moved = false;
    if (e.code === "ArrowLeft") { selectedObject.position.x -= step; moved = true; }
    if (e.code === "ArrowRight") { selectedObject.position.x += step; moved = true; }
    if (e.code === "ArrowUp") { selectedObject.position.z -= step; moved = true; }
    if (e.code === "ArrowDown") { selectedObject.position.z += step; moved = true; }
    if (e.code === "PageUp") { selectedObject.position.y += step; moved = true; }
    if (e.code === "PageDown") { selectedObject.position.y = Math.max(0, selectedObject.position.y - step); moved = true; }

    if (moved) {
      syncPositionInputs(selectedObject.position);
      e.preventDefault();
    }
  }

  const keyNum = parseInt(e.key, 10);
  if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= animations.length && selectAnimation) {
    selectAnimation.value = keyNum - 1;
    selectAnimation.dispatchEvent(new Event("change"));
  }
});

window.addEventListener("keyup", (e) => {
  keyStates[e.code] = false;
});

function handleCameraMovement(delta) {
  const moveSpeed = 6.0 * delta;
  const rotateSpeed = 1.8 * delta;

  if (keyStates["KeyQ"]) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed);
    camera.position.copy(controls.target).add(offset);
  }
  if (keyStates["KeyE"]) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotateSpeed);
    camera.position.copy(controls.target).add(offset);
  }

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  const moveVector = new THREE.Vector3();
  if (keyStates["KeyW"]) moveVector.add(forward);
  if (keyStates["KeyS"]) moveVector.sub(forward);
  if (keyStates["KeyD"]) moveVector.add(right);
  if (keyStates["KeyA"]) moveVector.sub(right);
  if (keyStates["Space"]) moveVector.y += 1;
  if (keyStates["ShiftLeft"] || keyStates["ShiftRight"]) moveVector.y -= 1;

  if (moveVector.lengthSq() > 0) {
    moveVector.normalize().multiplyScalar(moveSpeed);
    camera.position.add(moveVector);
    controls.target.add(moveVector);
  }
}

// --- 14. BINDING UI SLIDER POSISI & LAINNYA ---
inputPosX.addEventListener("input", (e) => {
  if (selectedObject) {
    selectedObject.position.x = parseFloat(e.target.value);
    posXVal.textContent = selectedObject.position.x.toFixed(2);
  }
});

inputPosY.addEventListener("input", (e) => {
  if (selectedObject) {
    selectedObject.position.y = parseFloat(e.target.value);
    posYVal.textContent = selectedObject.position.y.toFixed(2);
  }
});

inputPosZ.addEventListener("input", (e) => {
  if (selectedObject) {
    selectedObject.position.z = parseFloat(e.target.value);
    posZVal.textContent = selectedObject.position.z.toFixed(2);
  }
});

if (selectAnimation) {
  selectAnimation.addEventListener("change", (e) => {
    if (!mixer || animations.length === 0) return;
    const index = parseInt(e.target.value, 10);
    const nextClip = animations[index];
    if (!nextClip) return;
    activeAction.fadeOut(0.2);
    activeAction = mixer.clipAction(nextClip);
    activeAction.reset().fadeIn(0.2).play();
    animationInfo.textContent = nextClip.name || `Clip ${index}`;
  });
}

if (inputAnimSpeed) {
  inputAnimSpeed.addEventListener("input", (e) => {
    const speed = parseFloat(e.target.value);
    if (mixer) mixer.timeScale = speed;
    animSpeedVal.textContent = `${speed.toFixed(1)}x`;
  });
}

if (inputRoughness) {
  inputRoughness.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    pbrMaterial.roughness = val;
    roughVal.textContent = val.toFixed(2);
  });
}

if (inputMetalness) {
  inputMetalness.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    pbrMaterial.metalness = val;
    metalVal.textContent = val.toFixed(2);
  });
}

if (inputColor) {
  inputColor.addEventListener("input", (e) => {
    pbrMaterial.color.set(e.target.value);
  });
}

if (inputDirLight) {
  inputDirLight.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    directionalLight.intensity = val;
    dirLightVal.textContent = val.toFixed(1);
  });
}

if (inputAmbLight) {
  inputAmbLight.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    ambientLight.intensity = val;
    ambLightVal.textContent = val.toFixed(2);
  });
}

let parentSpeed = 0.5;
let childSpeed = 2.5;

if (inputParentSpeed) {
  inputParentSpeed.addEventListener("input", (e) => {
    parentSpeed = parseFloat(e.target.value);
    parentSpeedVal.textContent = parentSpeed.toFixed(2);
  });
}

if (inputChildSpeed) {
  inputChildSpeed.addEventListener("input", (e) => {
    childSpeed = parseFloat(e.target.value);
    childSpeedVal.textContent = childSpeed.toFixed(2);
  });
}

if (btnToggleEnv) {
  btnToggleEnv.addEventListener("click", () => {
    isEnvEnabled = !isEnvEnabled;
    scene.environment = isEnvEnabled ? environment : null;
    btnToggleEnv.textContent = `Toggle Environment (${isEnvEnabled ? "ON" : "OFF"})`;
  });
}

if (btnResetView) {
  btnResetView.addEventListener("click", () => {
    camera.position.copy(defaultCamPos);
    controls.target.copy(defaultCamTarget);
    controls.update();
  });
}

// --- 15. ANIMATION LOOP ---
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsedTime = clock.getElapsedTime();

  handleCameraMovement(delta);

  if (mixer) mixer.update(delta);

  torso.rotation.y += parentSpeed * delta;
  const limbSwing = Math.sin(elapsedTime * childSpeed) * 0.45;
  leftArm.rotation.x = limbSwing;
  rightArm.rotation.x = -limbSwing;
  leftLeg.rotation.x = -limbSwing;
  rightLeg.rotation.x = limbSwing;
  head.rotation.y = Math.sin(elapsedTime * (childSpeed * 0.5)) * 0.25;

  controls.update();
  renderer.render(scene, camera);
}

animate();
