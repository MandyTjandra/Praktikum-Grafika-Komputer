import { Mat4, degToRad, normalMatrixFromMat4 } from "./math3d.js";

// ==========================================
// 1. Shaders Source (WebGL2)
// ==========================================
const vertexShaderSource = `#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform int u_useNormalMatrix;
uniform float u_uvScale;

out vec3 v_worldPosition;
out vec3 v_normal;
out vec2 v_texCoord;

void main() {
  vec4 worldPos = u_model * vec4(a_position, 1.0);
  v_worldPosition = worldPos.xyz;

  // Eksperimen 9: Normal Matrix vs Standard linear transform
  if (u_useNormalMatrix == 1) {
    v_normal = u_normalMatrix * a_normal;
  } else {
    v_normal = mat3(u_model) * a_normal;
  }

  v_texCoord = a_texCoord * u_uvScale;
  gl_Position = u_projection * u_view * worldPos;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 v_worldPosition;
in vec3 v_normal;
in vec2 v_texCoord;

uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;

uniform float u_ambientStrength;
uniform float u_shininess;

uniform int u_enableAmbient;
uniform int u_enableDiffuse;
uniform int u_enableSpecular;
uniform int u_normalizeNormal;
uniform int u_textureOnly;

uniform sampler2D u_texture;
out vec4 outColor;

void main() {
  // Eksperimen 1: Normalization check
  vec3 N = (u_normalizeNormal == 1) ? normalize(v_normal) : v_normal;

  vec4 texColor = texture(u_texture, v_texCoord);

  // Eksperimen 10: Tekstur murni tanpa lighting
  if (u_textureOnly == 1) {
    outColor = vec4(texColor.rgb, 1.0);
    return;
  }

  vec3 L = normalize(u_lightPosition - v_worldPosition);
  vec3 V = normalize(u_cameraPosition - v_worldPosition);

  // Diffuse
  float diff = max(dot(N, L), 0.0);

  // Specular (Phong Reflection)
  vec3 R = reflect(-L, N);
  float spec = 0.0;
  if (diff > 0.0) {
    spec = pow(max(dot(R, V), 0.0), u_shininess);
  }

  vec3 ambient = (u_enableAmbient == 1)
    ? (u_ambientStrength * texColor.rgb)
    : vec3(0.0);

  vec3 diffuse = (u_enableDiffuse == 1)
    ? (diff * u_lightColor * texColor.rgb)
    : vec3(0.0);

  vec3 specular = (u_enableSpecular == 1)
    ? (spec * u_lightColor)
    : vec3(0.0);

  vec3 finalColor = ambient + diffuse + specular;
  outColor = vec4(finalColor, 1.0);
}
`;

// ==========================================
// 2. State Aplikasi
// ==========================================
const state = {
  // Transform
  autoRotate: true,
  rotSpeedX: 20.0,
  rotSpeedY: 35.0,
  rotationX: 20.0,
  rotationY: 30.0,
  scaleX: 1.0,
  scaleY: 1.0,
  scaleZ: 1.0,
  nonUniformPreset: false,

  // Camera
  camPos: [0.0, 1.4, 4.0],
  camTarget: [0.0, 0.0, 0.0],
  camUp: [0.0, 1.0, 0.0],
  fov: 60.0,

  // Light
  lightPos: [2.0, 2.0, 2.0],
  lightColor: [1.0, 1.0, 1.0],
  lightOrbit: false,
  orbitSpeed: 1.0,
  orbitAngle: 0.0,
  orbitRadius: 2.8,

  // Shading & Material
  shadingMode: "FLAT", // FLAT | SMOOTH
  normalizeNormal: true,
  useNormalMatrix: true,
  ambientStrength: 0.18,
  shininess: 32.0,
  enableAmbient: true,
  enableDiffuse: true,
  enableSpecular: true,
  textureOnly: false,

  // Texture & UV
  textureSource: "CHECKER",
  uvScale: 1.0,
  minFilter: "LINEAR",
  magFilter: "LINEAR",
  wrapMode: "REPEAT"
};

const wrapModesList = ["REPEAT", "CLAMP_TO_EDGE", "MIRRORED_REPEAT"];
const filterModesList = ["LINEAR", "NEAREST"];

// ==========================================
// 3. Inisialisasi WebGL2 & Buffers
// ==========================================
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
if (!gl) alert("WebGL2 tidak didukung pada browser ini!");

gl.enable(gl.DEPTH_TEST);

function createShader(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(err);
  }
  return s;
}

function createProgram(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(err);
  }
  return p;
}

const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vs, fs);
gl.useProgram(program);

// Locations
const locs = {
  aPosition: gl.getAttribLocation(program, "a_position"),
  aNormal: gl.getAttribLocation(program, "a_normal"),
  aTexCoord: gl.getAttribLocation(program, "a_texCoord"),

  uModel: gl.getUniformLocation(program, "u_model"),
  uView: gl.getUniformLocation(program, "u_view"),
  uProjection: gl.getUniformLocation(program, "u_projection"),
  uNormalMatrix: gl.getUniformLocation(program, "u_normalMatrix"),
  uUseNormalMatrix: gl.getUniformLocation(program, "u_useNormalMatrix"),
  uUvScale: gl.getUniformLocation(program, "u_uvScale"),

  uLightPos: gl.getUniformLocation(program, "u_lightPosition"),
  uLightColor: gl.getUniformLocation(program, "u_lightColor"),
  uCamPos: gl.getUniformLocation(program, "u_cameraPosition"),
  uAmbientStrength: gl.getUniformLocation(program, "u_ambientStrength"),
  uShininess: gl.getUniformLocation(program, "u_shininess"),

  uEnableAmbient: gl.getUniformLocation(program, "u_enableAmbient"),
  uEnableDiffuse: gl.getUniformLocation(program, "u_enableDiffuse"),
  uEnableSpecular: gl.getUniformLocation(program, "u_enableSpecular"),
  uNormalizeNormal: gl.getUniformLocation(program, "u_normalizeNormal"),
  uTextureOnly: gl.getUniformLocation(program, "u_textureOnly"),
  uTexture: gl.getUniformLocation(program, "u_texture")
};

// Geometry Data
const positions = new Float32Array([
  // Front
  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
  -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
  // Back
   0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,
   0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
  // Left
  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
  -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,
  // Right
   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
   0.5,-0.5, 0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
  // Top
  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
  -0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,
  // Bottom
  -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
  -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5
]);

const flatNormals = new Float32Array([
  // Front
   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
  // Back
   0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,
  // Left
  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
  // Right
   1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
  // Top
   0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
  // Bottom
   0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0
]);

const smoothNormals = new Float32Array(positions.length);
for (let i = 0; i < positions.length; i += 3) {
  const x = positions[i], y = positions[i + 1], z = positions[i + 2];
  const len = Math.hypot(x, y, z);
  smoothNormals[i] = x / len;
  smoothNormals[i + 1] = y / len;
  smoothNormals[i + 2] = z / len;
}

const faceUV = [
  0, 0,  1, 0,  1, 1,
  0, 0,  1, 1,  0, 1
];
const uvs = [];
for (let f = 0; f < 6; f++) uvs.push(...faceUV);
const texCoords = new Float32Array(uvs);

function createArrayBuffer(gl, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return b;
}

const posBuffer = createArrayBuffer(gl, positions);
const flatNormBuffer = createArrayBuffer(gl, flatNormals);
const smoothNormBuffer = createArrayBuffer(gl, smoothNormals);
const uvBuffer = createArrayBuffer(gl, texCoords);

function setAttribute(gl, buf, loc, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
}

setAttribute(gl, posBuffer, locs.aPosition, 3);
setAttribute(gl, uvBuffer, locs.aTexCoord, 2);

// ==========================================
// 4. Texture Management
// ==========================================
const glTexture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, glTexture);
gl.uniform1i(locs.uTexture, 0);

function createCheckerboardCanvas() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const cells = 8;
  const step = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = ((x + y) % 2 === 0) ? "#f8fafc" : "#0284c7";
      ctx.fillRect(x * step, y * step, step, step);
    }
  }
  return c;
}

let activeImageSource = createCheckerboardCanvas();

function uploadCurrentTexture() {
  gl.bindTexture(gl.TEXTURE_2D, glTexture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA,
    gl.RGBA, gl.UNSIGNED_BYTE, activeImageSource
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  applyTextureParameters();
}

function getGLFilterConstant(name) {
  switch (name) {
    case "NEAREST": return gl.NEAREST;
    case "LINEAR": return gl.LINEAR;
    case "NEAREST_MIPMAP_NEAREST": return gl.NEAREST_MIPMAP_NEAREST;
    case "LINEAR_MIPMAP_NEAREST": return gl.LINEAR_MIPMAP_NEAREST;
    case "NEAREST_MIPMAP_LINEAR": return gl.NEAREST_MIPMAP_LINEAR;
    case "LINEAR_MIPMAP_LINEAR": return gl.LINEAR_MIPMAP_LINEAR;
    default: return gl.LINEAR;
  }
}

function getGLWrapConstant(name) {
  switch (name) {
    case "REPEAT": return gl.REPEAT;
    case "CLAMP_TO_EDGE": return gl.CLAMP_TO_EDGE;
    case "MIRRORED_REPEAT": return gl.MIRRORED_REPEAT;
    default: return gl.REPEAT;
  }
}

function applyTextureParameters() {
  gl.bindTexture(gl.TEXTURE_2D, glTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, getGLFilterConstant(state.minFilter));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, getGLFilterConstant(state.magFilter));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, getGLWrapConstant(state.wrapMode));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, getGLWrapConstant(state.wrapMode));
}

uploadCurrentTexture();

// ==========================================
// 5. GUI & HUD Binding
// ==========================================
const hud = {
  shading: document.getElementById("hudShading"),
  filter: document.getElementById("hudFilter"),
  wrap: document.getElementById("hudWrap"),
  uv: document.getElementById("hudUv"),
  shininess: document.getElementById("hudShininess"),
  ambient: document.getElementById("hudAmbient"),
  light: document.getElementById("hudLight")
};

const dom = {
  btnReset: document.getElementById("btnReset"),
  ctrlAutoRotate: document.getElementById("ctrlAutoRotate"),
  ctrlRotSpeedX: document.getElementById("ctrlRotSpeedX"),
  ctrlRotSpeedY: document.getElementById("ctrlRotSpeedY"),
  valRotSpeedX: document.getElementById("valRotSpeedX"),
  valRotSpeedY: document.getElementById("valRotSpeedY"),
  ctrlManualRotX: document.getElementById("ctrlManualRotX"),
  ctrlManualRotY: document.getElementById("ctrlManualRotY"),
  valManualRotX: document.getElementById("valManualRotX"),
  valManualRotY: document.getElementById("valManualRotY"),

  ctrlNonUniformScale: document.getElementById("ctrlNonUniformScale"),
  ctrlScaleX: document.getElementById("ctrlScaleX"),
  ctrlScaleY: document.getElementById("ctrlScaleY"),
  ctrlScaleZ: document.getElementById("ctrlScaleZ"),
  valScaleX: document.getElementById("valScaleX"),
  valScaleY: document.getElementById("valScaleY"),
  valScaleZ: document.getElementById("valScaleZ"),

  shadingRadios: document.querySelectorAll("input[name='ctrlShading']"),
  ctrlNormalizeNormal: document.getElementById("ctrlNormalizeNormal"),
  ctrlUseNormalMatrix: document.getElementById("ctrlUseNormalMatrix"),

  ctrlLightOrbit: document.getElementById("ctrlLightOrbit"),
  ctrlOrbitSpeed: document.getElementById("ctrlOrbitSpeed"),
  valOrbitSpeed: document.getElementById("valOrbitSpeed"),
  ctrlLightX: document.getElementById("ctrlLightX"),
  ctrlLightY: document.getElementById("ctrlLightY"),
  ctrlLightZ: document.getElementById("ctrlLightZ"),
  valLightX: document.getElementById("valLightX"),
  valLightY: document.getElementById("valLightY"),
  valLightZ: document.getElementById("valLightZ"),
  ctrlLightColor: document.getElementById("ctrlLightColor"),

  ctrlAmbient: document.getElementById("ctrlAmbient"),
  valAmbient: document.getElementById("valAmbient"),
  ctrlShininess: document.getElementById("ctrlShininess"),
  valShininess: document.getElementById("valShininess"),
  ctrlEnableAmbient: document.getElementById("ctrlEnableAmbient"),
  ctrlEnableDiffuse: document.getElementById("ctrlEnableDiffuse"),
  ctrlEnableSpecular: document.getElementById("ctrlEnableSpecular"),
  ctrlTextureOnly: document.getElementById("ctrlTextureOnly"),

  ctrlTextureSource: document.getElementById("ctrlTextureSource"),
  fileUploadWrapper: document.getElementById("fileUploadWrapper"),
  ctrlTextureFile: document.getElementById("ctrlTextureFile"),
  ctrlUvScale: document.getElementById("ctrlUvScale"),
  valUvScale: document.getElementById("valUvScale"),
  ctrlMinFilter: document.getElementById("ctrlMinFilter"),
  ctrlMagFilter: document.getElementById("ctrlMagFilter"),
  ctrlWrapMode: document.getElementById("ctrlWrapMode"),

  ctrlCamX: document.getElementById("ctrlCamX"),
  ctrlCamY: document.getElementById("ctrlCamY"),
  ctrlCamZ: document.getElementById("ctrlCamZ"),
  valCamX: document.getElementById("valCamX"),
  valCamY: document.getElementById("valCamY"),
  valCamZ: document.getElementById("valCamZ"),
  ctrlFov: document.getElementById("ctrlFov"),
  valFov: document.getElementById("valFov")
};

function hexToRgb(hex) {
  const c = parseInt(hex.slice(1), 16);
  return [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255];
}

function syncUIFromState() {
  dom.ctrlAutoRotate.checked = state.autoRotate;
  dom.ctrlRotSpeedX.value = state.rotSpeedX;
  dom.valRotSpeedX.textContent = state.rotSpeedX;
  dom.ctrlRotSpeedY.value = state.rotSpeedY;
  dom.valRotSpeedY.textContent = state.rotSpeedY;

  dom.ctrlManualRotX.value = Math.round(state.rotationX) % 360;
  dom.valManualRotX.textContent = Math.round(state.rotationX) % 360;
  dom.ctrlManualRotY.value = Math.round(state.rotationY) % 360;
  dom.valManualRotY.textContent = Math.round(state.rotationY) % 360;

  dom.ctrlNonUniformScale.checked = state.nonUniformPreset;
  dom.ctrlScaleX.value = state.scaleX;
  dom.valScaleX.textContent = state.scaleX.toFixed(1);
  dom.ctrlScaleY.value = state.scaleY;
  dom.valScaleY.textContent = state.scaleY.toFixed(1);
  dom.ctrlScaleZ.value = state.scaleZ;
  dom.valScaleZ.textContent = state.scaleZ.toFixed(1);

  dom.shadingRadios.forEach(r => r.checked = (r.value === state.shadingMode));
  dom.ctrlNormalizeNormal.checked = state.normalizeNormal;
  dom.ctrlUseNormalMatrix.checked = state.useNormalMatrix;

  dom.ctrlLightOrbit.checked = state.lightOrbit;
  dom.ctrlOrbitSpeed.value = state.orbitSpeed;
  dom.valOrbitSpeed.textContent = state.orbitSpeed.toFixed(1);
  dom.ctrlLightX.value = state.lightPos[0].toFixed(1);
  dom.valLightX.textContent = state.lightPos[0].toFixed(1);
  dom.ctrlLightY.value = state.lightPos[1].toFixed(1);
  dom.valLightY.textContent = state.lightPos[1].toFixed(1);
  dom.ctrlLightZ.value = state.lightPos[2].toFixed(1);
  dom.valLightZ.textContent = state.lightPos[2].toFixed(1);

  dom.ctrlAmbient.value = state.ambientStrength;
  dom.valAmbient.textContent = state.ambientStrength.toFixed(2);
  dom.ctrlShininess.value = state.shininess;
  dom.valShininess.textContent = state.shininess.toFixed(1);

  dom.ctrlEnableAmbient.checked = state.enableAmbient;
  dom.ctrlEnableDiffuse.checked = state.enableDiffuse;
  dom.ctrlEnableSpecular.checked = state.enableSpecular;
  dom.ctrlTextureOnly.checked = state.textureOnly;

  dom.ctrlTextureSource.value = state.textureSource;
  dom.fileUploadWrapper.style.display = (state.textureSource === "CUSTOM_FILE") ? "block" : "none";
  dom.ctrlUvScale.value = state.uvScale;
  dom.valUvScale.textContent = state.uvScale.toFixed(2);
  dom.ctrlMinFilter.value = state.minFilter;
  dom.ctrlMagFilter.value = state.magFilter;
  dom.ctrlWrapMode.value = state.wrapMode;

  dom.ctrlCamX.value = state.camPos[0];
  dom.valCamX.textContent = state.camPos[0].toFixed(1);
  dom.ctrlCamY.value = state.camPos[1];
  dom.valCamY.textContent = state.camPos[1].toFixed(1);
  dom.ctrlCamZ.value = state.camPos[2];
  dom.valCamZ.textContent = state.camPos[2].toFixed(1);
  dom.ctrlFov.value = state.fov;
  dom.valFov.textContent = state.fov;

  updateHUD();
}

function updateHUD() {
  hud.shading.textContent = state.shadingMode;
  hud.filter.textContent = state.minFilter;
  hud.wrap.textContent = state.wrapMode;
  hud.uv.textContent = state.uvScale.toFixed(2);
  hud.shininess.textContent = state.shininess.toFixed(1);
  hud.ambient.textContent = state.ambientStrength.toFixed(2);
  hud.light.textContent = `(${state.lightPos[0].toFixed(2)}, ${state.lightPos[1].toFixed(2)}, ${state.lightPos[2].toFixed(2)})`;
}

// Pasang Listener Input
dom.ctrlAutoRotate.addEventListener("change", (e) => state.autoRotate = e.target.checked);
dom.ctrlRotSpeedX.addEventListener("input", (e) => {
  state.rotSpeedX = parseFloat(e.target.value);
  dom.valRotSpeedX.textContent = state.rotSpeedX;
});
dom.ctrlRotSpeedY.addEventListener("input", (e) => {
  state.rotSpeedY = parseFloat(e.target.value);
  dom.valRotSpeedY.textContent = state.rotSpeedY;
});
dom.ctrlManualRotX.addEventListener("input", (e) => {
  state.rotationX = parseFloat(e.target.value);
  dom.valManualRotX.textContent = e.target.value;
});
dom.ctrlManualRotY.addEventListener("input", (e) => {
  state.rotationY = parseFloat(e.target.value);
  dom.valManualRotY.textContent = e.target.value;
});

dom.ctrlNonUniformScale.addEventListener("change", (e) => {
  state.nonUniformPreset = e.target.checked;
  if (state.nonUniformPreset) {
    state.scaleX = 1.8;
    state.scaleY = 0.6;
    state.scaleZ = 1.0;
  } else {
    state.scaleX = 1.0;
    state.scaleY = 1.0;
    state.scaleZ = 1.0;
  }
  syncUIFromState();
});

dom.ctrlScaleX.addEventListener("input", (e) => {
  state.scaleX = parseFloat(e.target.value);
  dom.valScaleX.textContent = state.scaleX.toFixed(1);
});
dom.ctrlScaleY.addEventListener("input", (e) => {
  state.scaleY = parseFloat(e.target.value);
  dom.valScaleY.textContent = state.scaleY.toFixed(1);
});
dom.ctrlScaleZ.addEventListener("input", (e) => {
  state.scaleZ = parseFloat(e.target.value);
  dom.valScaleZ.textContent = state.scaleZ.toFixed(1);
});

dom.shadingRadios.forEach(radio => {
  radio.addEventListener("change", (e) => {
    state.shadingMode = e.target.value;
    updateHUD();
  });
});
dom.ctrlNormalizeNormal.addEventListener("change", (e) => state.normalizeNormal = e.target.checked);
dom.ctrlUseNormalMatrix.addEventListener("change", (e) => state.useNormalMatrix = e.target.checked);

dom.ctrlLightOrbit.addEventListener("change", (e) => state.lightOrbit = e.target.checked);
dom.ctrlOrbitSpeed.addEventListener("input", (e) => {
  state.orbitSpeed = parseFloat(e.target.value);
  dom.valOrbitSpeed.textContent = state.orbitSpeed.toFixed(1);
});
dom.ctrlLightX.addEventListener("input", (e) => {
  state.lightPos[0] = parseFloat(e.target.value);
  dom.valLightX.textContent = state.lightPos[0].toFixed(1);
  updateHUD();
});
dom.ctrlLightY.addEventListener("input", (e) => {
  state.lightPos[1] = parseFloat(e.target.value);
  dom.valLightY.textContent = state.lightPos[1].toFixed(1);
  updateHUD();
});
dom.ctrlLightZ.addEventListener("input", (e) => {
  state.lightPos[2] = parseFloat(e.target.value);
  dom.valLightZ.textContent = state.lightPos[2].toFixed(1);
  updateHUD();
});
dom.ctrlLightColor.addEventListener("input", (e) => {
  state.lightColor = hexToRgb(e.target.value);
});

dom.ctrlAmbient.addEventListener("input", (e) => {
  state.ambientStrength = parseFloat(e.target.value);
  dom.valAmbient.textContent = state.ambientStrength.toFixed(2);
  updateHUD();
});
dom.ctrlShininess.addEventListener("input", (e) => {
  state.shininess = parseFloat(e.target.value);
  dom.valShininess.textContent = state.shininess.toFixed(1);
  updateHUD();
});

dom.ctrlEnableAmbient.addEventListener("change", (e) => state.enableAmbient = e.target.checked);
dom.ctrlEnableDiffuse.addEventListener("change", (e) => state.enableDiffuse = e.target.checked);
dom.ctrlEnableSpecular.addEventListener("change", (e) => state.enableSpecular = e.target.checked);
dom.ctrlTextureOnly.addEventListener("change", (e) => state.textureOnly = e.target.checked);

dom.ctrlTextureSource.addEventListener("change", (e) => {
  state.textureSource = e.target.value;
  dom.fileUploadWrapper.style.display = (state.textureSource === "CUSTOM_FILE") ? "block" : "none";
  if (state.textureSource === "CHECKER") {
    activeImageSource = createCheckerboardCanvas();
    uploadCurrentTexture();
  }
});

dom.ctrlTextureFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    activeImageSource = img;
    uploadCurrentTexture();
  };
  img.src = URL.createObjectURL(file);
});

dom.ctrlUvScale.addEventListener("input", (e) => {
  state.uvScale = parseFloat(e.target.value);
  dom.valUvScale.textContent = state.uvScale.toFixed(2);
  updateHUD();
});
dom.ctrlMinFilter.addEventListener("change", (e) => {
  state.minFilter = e.target.value;
  applyTextureParameters();
  updateHUD();
});
dom.ctrlMagFilter.addEventListener("change", (e) => {
  state.magFilter = e.target.value;
  applyTextureParameters();
  updateHUD();
});
dom.ctrlWrapMode.addEventListener("change", (e) => {
  state.wrapMode = e.target.value;
  applyTextureParameters();
  updateHUD();
});

dom.ctrlCamX.addEventListener("input", (e) => {
  state.camPos[0] = parseFloat(e.target.value);
  dom.valCamX.textContent = state.camPos[0].toFixed(1);
});
dom.ctrlCamY.addEventListener("input", (e) => {
  state.camPos[1] = parseFloat(e.target.value);
  dom.valCamY.textContent = state.camPos[1].toFixed(1);
});
dom.ctrlCamZ.addEventListener("input", (e) => {
  state.camPos[2] = parseFloat(e.target.value);
  dom.valCamZ.textContent = state.camPos[2].toFixed(1);
});
dom.ctrlFov.addEventListener("input", (e) => {
  state.fov = parseFloat(e.target.value);
  dom.valFov.textContent = state.fov;
});

function resetToDefault() {
  state.autoRotate = true;
  state.rotSpeedX = 20.0;
  state.rotSpeedY = 35.0;
  state.rotationX = 20.0;
  state.rotationY = 30.0;
  state.scaleX = 1.0;
  state.scaleY = 1.0;
  state.scaleZ = 1.0;
  state.nonUniformPreset = false;

  state.camPos = [0.0, 1.4, 4.0];
  state.fov = 60.0;

  state.lightPos = [2.0, 2.0, 2.0];
  state.lightColor = [1.0, 1.0, 1.0];
  state.lightOrbit = false;
  state.orbitSpeed = 1.0;
  state.orbitAngle = 0.0;

  state.shadingMode = "FLAT";
  state.normalizeNormal = true;
  state.useNormalMatrix = true;
  state.ambientStrength = 0.18;
  state.shininess = 32.0;
  state.enableAmbient = true;
  state.enableDiffuse = true;
  state.enableSpecular = true;
  state.textureOnly = false;

  state.textureSource = "CHECKER";
  state.uvScale = 1.0;
  state.minFilter = "LINEAR";
  state.magFilter = "LINEAR";
  state.wrapMode = "REPEAT";

  activeImageSource = createCheckerboardCanvas();
  uploadCurrentTexture();
  syncUIFromState();
}

dom.btnReset.addEventListener("click", resetToDefault);

// ==========================================
// 6. Keyboard Interactions
// ==========================================
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.startsWith("Arrow")) e.preventDefault();

  if (!e.repeat) {
    const k = e.key.toLowerCase();
    if (k === "f") {
      state.shadingMode = (state.shadingMode === "FLAT") ? "SMOOTH" : "FLAT";
      syncUIFromState();
    } else if (k === "t") {
      const idx = filterModesList.indexOf(state.minFilter);
      state.minFilter = (idx === -1 || idx === filterModesList.length - 1)
        ? filterModesList[0]
        : filterModesList[idx + 1];
      state.magFilter = (state.minFilter.includes("NEAREST")) ? "NEAREST" : "LINEAR";
      applyTextureParameters();
      syncUIFromState();
    } else if (k === "g") {
      const idx = wrapModesList.indexOf(state.wrapMode);
      state.wrapMode = wrapModesList[(idx + 1) % wrapModesList.length];
      applyTextureParameters();
      syncUIFromState();
    } else if (k === "1") {
      state.enableAmbient = !state.enableAmbient;
      syncUIFromState();
    } else if (k === "2") {
      state.enableDiffuse = !state.enableDiffuse;
      syncUIFromState();
    } else if (k === "3") {
      state.enableSpecular = !state.enableSpecular;
      syncUIFromState();
    } else if (k === "r") {
      resetToDefault();
    }
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function handleContinuousKeys(dt) {
  const speed = 2.5;
  let changedLight = false;

  if (keys["arrowleft"])  { state.lightPos[0] -= speed * dt; changedLight = true; }
  if (keys["arrowright"]) { state.lightPos[0] += speed * dt; changedLight = true; }
  if (keys["arrowup"])    { state.lightPos[1] += speed * dt; changedLight = true; }
  if (keys["arrowdown"])  { state.lightPos[1] -= speed * dt; changedLight = true; }
  if (keys["w"])          { state.lightPos[2] -= speed * dt; changedLight = true; }
  if (keys["s"])          { state.lightPos[2] += speed * dt; changedLight = true; }

  if (changedLight) {
    dom.ctrlLightX.value = state.lightPos[0].toFixed(1);
    dom.valLightX.textContent = state.lightPos[0].toFixed(1);
    dom.ctrlLightY.value = state.lightPos[1].toFixed(1);
    dom.valLightY.textContent = state.lightPos[1].toFixed(1);
    dom.ctrlLightZ.value = state.lightPos[2].toFixed(1);
    dom.valLightZ.textContent = state.lightPos[2].toFixed(1);
    updateHUD();
  }

  // Shininess
  if (keys["-"] || keys["_"]) {
    state.shininess = Math.max(2.0, state.shininess - 40.0 * dt);
    dom.ctrlShininess.value = state.shininess;
    dom.valShininess.textContent = state.shininess.toFixed(1);
    updateHUD();
  }
  if (keys["+"] || keys["="]) {
    state.shininess = Math.min(128.0, state.shininess + 40.0 * dt);
    dom.ctrlShininess.value = state.shininess;
    dom.valShininess.textContent = state.shininess.toFixed(1);
    updateHUD();
  }

  // UV Scale
  if (keys["["]) {
    state.uvScale = Math.max(0.25, state.uvScale - 1.5 * dt);
    dom.ctrlUvScale.value = state.uvScale;
    dom.valUvScale.textContent = state.uvScale.toFixed(2);
    updateHUD();
  }
  if (keys["]"]) {
    state.uvScale = Math.min(5.0, state.uvScale + 1.5 * dt);
    dom.ctrlUvScale.value = state.uvScale;
    dom.valUvScale.textContent = state.uvScale.toFixed(2);
    updateHUD();
  }
}

// ==========================================
// 7. Render Loop
// ==========================================
let lastTime = 0;

function render(time) {
  let dt = (time - lastTime) * 0.001;
  lastTime = time;
  dt = Math.min(dt, 0.05);

  handleContinuousKeys(dt);

  // Update Rotasi Cube
  if (state.autoRotate) {
    state.rotationX += state.rotSpeedX * dt;
    state.rotationY += state.rotSpeedY * dt;
    dom.ctrlManualRotX.value = Math.round(state.rotationX) % 360;
    dom.valManualRotX.textContent = Math.round(state.rotationX) % 360;
    dom.ctrlManualRotY.value = Math.round(state.rotationY) % 360;
    dom.valManualRotY.textContent = Math.round(state.rotationY) % 360;
  }

  // Update Light Orbit
  if (state.lightOrbit) {
    state.orbitAngle += state.orbitSpeed * dt;
    state.lightPos[0] = Math.cos(state.orbitAngle) * state.orbitRadius;
    state.lightPos[2] = Math.sin(state.orbitAngle) * state.orbitRadius;
    dom.ctrlLightX.value = state.lightPos[0].toFixed(1);
    dom.valLightX.textContent = state.lightPos[0].toFixed(1);
    dom.ctrlLightZ.value = state.lightPos[2].toFixed(1);
    dom.valLightZ.textContent = state.lightPos[2].toFixed(1);
    updateHUD();
  }

  // Resizing canvas buffer jika dimensi window berubah
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.015, 0.03, 0.06, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  // Switch Normal Buffer berdasarkan Flat/Smooth
  const activeNormBuffer = (state.shadingMode === "FLAT") ? flatNormBuffer : smoothNormBuffer;
  setAttribute(gl, activeNormBuffer, locs.aNormal, 3);

  // Matriks Transformasi
  const mScale = Mat4.scaling(state.scaleX, state.scaleY, state.scaleZ);
  const mRotX = Mat4.rotationX(degToRad(state.rotationX));
  const mRotY = Mat4.rotationY(degToRad(state.rotationY));

  let model = Mat4.identity();
  model = Mat4.multiply(model, mScale);
  model = Mat4.multiply(model, mRotX);
  model = Mat4.multiply(model, mRotY);

  const view = Mat4.lookAt(state.camPos, state.camTarget, state.camUp);
  const aspect = canvas.width / canvas.height;
  const projection = Mat4.perspective(degToRad(state.fov), aspect, 0.1, 100.0);
  const normalMatrix = normalMatrixFromMat4(model);

  // Set Uniforms
  gl.uniformMatrix4fv(locs.uModel, false, model);
  gl.uniformMatrix4fv(locs.uView, false, view);
  gl.uniformMatrix4fv(locs.uProjection, false, projection);
  gl.uniformMatrix3fv(locs.uNormalMatrix, false, normalMatrix);
  gl.uniform1i(locs.uUseNormalMatrix, state.useNormalMatrix ? 1 : 0);
  gl.uniform1f(locs.uUvScale, state.uvScale);

  gl.uniform3fv(locs.uLightPos, state.lightPos);
  gl.uniform3fv(locs.uLightColor, state.lightColor);
  gl.uniform3fv(locs.uCamPos, state.camPos);
  gl.uniform1f(locs.uAmbientStrength, state.ambientStrength);
  gl.uniform1f(locs.uShininess, state.shininess);

  gl.uniform1i(locs.uEnableAmbient, state.enableAmbient ? 1 : 0);
  gl.uniform1i(locs.uEnableDiffuse, state.enableDiffuse ? 1 : 0);
  gl.uniform1i(locs.uEnableSpecular, state.enableSpecular ? 1 : 0);
  gl.uniform1i(locs.uNormalizeNormal, state.normalizeNormal ? 1 : 0);
  gl.uniform1i(locs.uTextureOnly, state.textureOnly ? 1 : 0);

  // Draw 36 vertices (6 faces x 2 triangles)
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  requestAnimationFrame(render);
}

// Inisialisasi awal
syncUIFromState();
requestAnimationFrame(render);