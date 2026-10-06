import GUI from "lil-gui";

export function setupGUI(context) {
  const {
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
  } = context;

  const gui = new GUI({ title: "Scene Controller" });

  // 1. Environment Folder
  const envFolder = gui.addFolder("Environment");
  envFolder
    .addColor({ bg: "#0b1020" }, "bg")
    .name("Background")
    .onChange((val) => scene.background.set(val));

  // 2. Camera Folder
  const camFolder = gui.addFolder("Camera");
  camFolder
    .add(camera, "fov", 20, 120, 1)
    .name("FOV")
    .onChange(() => camera.updateProjectionMatrix());
  camFolder.add(animParams, "resetCamera").name("Reset View");

  // 3. Cube Folder
  const cubeFolder = gui.addFolder("Cube");
  cubeFolder.add(cube.position, "x", -5, 5, 0.1).name("Pos X");
  cubeFolder.add(cube.position, "y", 0, 5, 0.1).name("Pos Y");
  cubeFolder.add(cube.position, "z", -5, 5, 0.1).name("Pos Z");
  cubeFolder.add(cube.rotation, "x", 0, Math.PI * 2, 0.1).name("Rot X");
  cubeFolder.add(cube.rotation, "y", 0, Math.PI * 2, 0.1).name("Rot Y");
  cubeFolder.add(cube.rotation, "z", 0, Math.PI * 2, 0.1).name("Rot Z");
  cubeFolder.add(cube.scale, "x", 0.1, 3, 0.1).name("Scale X");
  cubeFolder.add(cube.scale, "y", 0.1, 3, 0.1).name("Scale Y");
  cubeFolder.add(cube.scale, "z", 0.1, 3, 0.1).name("Scale Z");
  cubeFolder
    .addColor({ col: "#22d3ee" }, "col")
    .name("Color")
    .onChange((val) => cubeMaterial.color.set(val));
  cubeFolder.add(cubeMaterial, "wireframe").name("Wireframe");
  cubeFolder.add(cube, "castShadow").name("Cast Shadow");

  // 4. Sphere Folder
  const sphereFolder = gui.addFolder("Sphere");
  sphereFolder.add(sphere.position, "x", -5, 5, 0.1).name("Pos X");
  sphereFolder.add(sphere.position, "z", -5, 5, 0.1).name("Pos Z");
  sphereFolder.add(sphere.scale, "x", 0.1, 3, 0.1).name("Scale");
  sphereFolder
    .addColor({ col: "#4488ff" }, "col")
    .name("Color")
    .onChange((val) => sphereMaterial.color.set(val));
  sphereFolder.add(sphereMaterial, "shininess", 0, 200, 1).name("Shininess");
  sphereFolder.add(sphereMaterial, "wireframe").name("Wireframe");
  sphereFolder.add(sphere, "castShadow").name("Cast Shadow");

  // 5. Lighting & Shadows Folder
  const lightFolder = gui.addFolder("Lighting");
  lightFolder.add(ambientLight, "intensity", 0, 2, 0.05).name("Ambient Int.");
  lightFolder.add(directionalLight, "intensity", 0, 5, 0.1).name("Dir Light Int.");
  lightFolder.add(directionalLight.position, "x", -10, 10, 0.5).name("Dir X");
  lightFolder.add(directionalLight.position, "y", 1, 15, 0.5).name("Dir Y");
  lightFolder.add(directionalLight.position, "z", -10, 10, 0.5).name("Dir Z");
  lightFolder
    .add(renderer.shadowMap, "enabled")
    .name("Shadow Enabled")
    .onChange(() => {
      cubeMaterial.needsUpdate = true;
      sphereMaterial.needsUpdate = true;
      groundMaterial.needsUpdate = true;
    });

  // 6. Animation Folder
  const animFolder = gui.addFolder("Animation");
  animFolder.add(animParams, "animate").name("Play / Pause");
  animFolder.add(animParams, "cubeRotSpeed", 0, 5, 0.1).name("Cube Speed");
  animFolder.add(animParams, "sphereBobSpeed", 0, 5, 0.1).name("Bob Speed");
  animFolder.add(animParams, "sphereBobHeight", 0, 1, 0.05).name("Bob Height");

  return gui;
}