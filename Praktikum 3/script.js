// ==========================================
// 1. SHADER SOURCE GLSL ES 3.00
// ==========================================
const vsSource = `#version 300 es
in vec2 a_position;
uniform mat3 u_matrix;

void main() {
    // Perkalian koordinat homogen 2D (x, y, 1) dengan Model Matrix mat3
    vec3 pos = u_matrix * vec3(a_position, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}
`;

const fsSource = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;

void main() {
    outColor = u_color;
}
`;

// ==========================================
// 2. MAT3 MATH UTILITIES (Column-Major)
// ==========================================
const m3 = {
  identity: function() {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
  },
  translation: function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ];
  },
  rotation: function(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      c, s, 0,
      -s, c, 0,
      0, 0, 1
    ];
  },
  scaling: function(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1
    ];
  },
  multiply: function(a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];

    const b00 = b[0], b01 = b[1], b02 = b[2];
    const b10 = b[3], b11 = b[4], b12 = b[5];
    const b20 = b[6], b21 = b[7], b22 = b[8];

    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22
    ];
  }
};

// ==========================================
// 3. INISIALISASI WEBGL2 CONTEXT & PROGRAM
// ==========================================
const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
  alert('Browser tidak mendukung WebGL2');
  throw new Error('WebGL2 tidak tersedia');
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vsSource));
gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fsSource));
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error(gl.getProgramInfoLog(program));
  throw new Error('Gagal link program');
}

const positionLoc = gl.getAttribLocation(program, "a_position");
const matrixLoc = gl.getUniformLocation(program, "u_matrix");
const colorLoc = gl.getUniformLocation(program, "u_color");

// ==========================================
// 4. SETUP BUFFER GEOMETRI LOKAL (VBO / VAO)
// ==========================================
// Geometri segitiga sama kaki simetris (Puncak atas: +Y)
const objectVertices = new Float32Array([
   0.0,   0.15,  // Titik puncak atas
  -0.12, -0.12,  // Titik alas kiri
   0.12, -0.12   // Titik alas kanan
]);

const vaoObject = gl.createVertexArray();
gl.bindVertexArray(vaoObject);
const objBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, objBuffer);
gl.bufferData(gl.ARRAY_BUFFER, objectVertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

// Buffer Sumbu Koordinat (Origin Axes)
const axesVertices = new Float32Array([
  -1.0,  0.0,   1.0, 0.0,
   0.0, -1.0,   0.0, 1.0
]);

const vaoAxes = gl.createVertexArray();
gl.bindVertexArray(vaoAxes);
const axesBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, axesBuffer);
gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

// ==========================================
// 5. STATE MANAGEMENT & EVENT LISTENERS
// ==========================================
const obj1 = {
  pos: [0.0, 0.0],
  rot: 0.0,
  scale: [1.0, 1.0],
  order: 'TRS'
};

const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  // Challenge A: Reset Transform
  if (e.key === 'r' || e.key === 'R') {
    obj1.pos = [0.0, 0.0];
    obj1.rot = 0.0;
    obj1.scale = [1.0, 1.0];
  }

  // Challenge B: Transform Preset
  if (e.key === '1') {
    obj1.pos = [-0.4, 0.2];
    obj1.rot = 0.0;
    obj1.scale = [1.0, 1.0];
  }
  if (e.key === '2') {
    obj1.pos = [0.0, 0.0];
    obj1.rot = 45 * Math.PI / 180;
    obj1.scale = [1.5, 1.5];
  }
  if (e.key === '3') {
    obj1.pos = [0.3, -0.2];
    obj1.rot = 90 * Math.PI / 180;
    obj1.scale = [1.8, 0.6];
  }

  // Challenge C: Toggle Transform Order
  if (e.key === 't' || e.key === 'T') {
    obj1.order = (obj1.order === 'TRS') ? 'RTS' : 'TRS';
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Challenge D: Mouse Translation via NDC
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Konversi Pixel ke NDC (-1 s.d 1, sumbu Y terbalik)
  const ndcX = (mouseX / canvas.width) * 2.0 - 1.0;
  const ndcY = -((mouseY / canvas.height) * 2.0 - 1.0);

  obj1.pos[0] = ndcX;
  obj1.pos[1] = ndcY;
});

// ==========================================
// 6. UPDATE LOOP (State-Based + DeltaTime)
// ==========================================
let lastTime = 0;
let autoAngle = 0;

function update(deltaTime) {
  const speed = 0.8 * deltaTime;
  const rotSpeed = 2.0 * deltaTime;
  const scaleSpeed = 1.0 * deltaTime;

  // Keyboard Translation
  if (keys['ArrowUp'] || keys['w'] || keys['W']) obj1.pos[1] += speed;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) obj1.pos[1] -= speed;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) obj1.pos[0] -= speed;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) obj1.pos[0] += speed;

  // Keyboard Rotation
  if (keys['q'] || keys['Q']) obj1.rot += rotSpeed;
  if (keys['e'] || keys['E']) obj1.rot -= rotSpeed;

  // Keyboard Uniform Scaling
  if (keys['z'] || keys['Z']) {
    obj1.scale[0] = Math.max(0.1, obj1.scale[0] - scaleSpeed);
    obj1.scale[1] = Math.max(0.1, obj1.scale[1] - scaleSpeed);
  }
  if (keys['x'] || keys['X']) {
    obj1.scale[0] += scaleSpeed;
    obj1.scale[1] += scaleSpeed;
  }

  // Keyboard Non-Uniform Scaling
  if (keys['u'] || keys['U']) obj1.scale[0] = Math.max(0.1, obj1.scale[0] - scaleSpeed);
  if (keys['i'] || keys['I']) obj1.scale[0] += scaleSpeed;
  if (keys['o'] || keys['O']) obj1.scale[1] = Math.max(0.1, obj1.scale[1] - scaleSpeed);
  if (keys['p'] || keys['P']) obj1.scale[1] += scaleSpeed;

  // Automatic Animation Objek 2 (Orbit)
  autoAngle += 1.2 * deltaTime;

  // Update HUD Display
  document.getElementById('val-pos').textContent = `(${obj1.pos[0].toFixed(2)}, ${obj1.pos[1].toFixed(2)})`;
  const deg = (obj1.rot * 180 / Math.PI) % 360;
  document.getElementById('val-rot').textContent = `${(deg < 0 ? deg + 360 : deg).toFixed(1)}°`;
  document.getElementById('val-scale').textContent = `(${obj1.scale[0].toFixed(2)}, ${obj1.scale[1].toFixed(2)})`;
  document.getElementById('val-order').textContent = obj1.order === 'TRS' ? 'T × R × S (Local Pivot)' : 'R × T × S (World Pivot)';
}

// ==========================================
// 7. RENDER LOOP
// ==========================================
function render(now) {
  now *= 0.001; // Konversi ms ke detik
  const deltaTime = Math.min(now - lastTime, 0.1);
  lastTime = now;

  update(deltaTime);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.08, 0.08, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // 1. Gambar Sumbu Koordinat (Origin)
  gl.bindVertexArray(vaoAxes);
  gl.uniformMatrix3fv(matrixLoc, false, m3.identity());
  gl.uniform4f(colorLoc, 0.25, 0.25, 0.3, 1.0);
  gl.drawArrays(gl.LINES, 0, 4);

  // 2. Gambar Objek 1 (User Controlled)
  gl.bindVertexArray(vaoObject);

  const T1 = m3.translation(obj1.pos[0], obj1.pos[1]);
  const R1 = m3.rotation(obj1.rot);
  const S1 = m3.scaling(obj1.scale[0], obj1.scale[1]);

  let modelMatrix1;
  if (obj1.order === 'TRS') {
    // S -> R -> T (Rotasi pada local pivot)
    modelMatrix1 = m3.multiply(T1, m3.multiply(R1, S1));
  } else {
    // S -> T -> R (Mengorbit origin world)
    modelMatrix1 = m3.multiply(R1, m3.multiply(T1, S1));
  }

  gl.uniformMatrix3fv(matrixLoc, false, modelMatrix1);
  gl.uniform4f(colorLoc, 0.0, 0.8, 1.0, 1.0); // Cyan
  gl.drawArrays(gl.TRIANGLES, 0, 3); // 3 Vertices untuk 1 segitiga

  // 3. Gambar Objek 2 (Auto Orbit - Challenge F)
  const T_orbit = m3.translation(0.55, 0.0);
  const R_orbit = m3.rotation(autoAngle);
  const S_orbit = m3.scaling(0.6, 0.6);

  // Matrix Composition: R_orbit * T_orbit * S_orbit
  const modelMatrix2 = m3.multiply(R_orbit, m3.multiply(T_orbit, S_orbit));

  gl.uniformMatrix3fv(matrixLoc, false, modelMatrix2);
  gl.uniform4f(colorLoc, 1.0, 0.6, 0.0, 1.0); // Oranye
  gl.drawArrays(gl.TRIANGLES, 0, 3); // 3 Vertices untuk 1 segitiga

  requestAnimationFrame(render);
}

requestAnimationFrame((time) => {
  lastTime = time * 0.001;
  requestAnimationFrame(render);
});