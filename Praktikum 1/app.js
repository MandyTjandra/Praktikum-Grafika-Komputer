/*
Praktikum Grafika Komputer - Pertemuan 1
Graphics Playground

Nama : Mandy Alphafyn Imanuel Tjandra
NRP  : 5025241173
Kelas: B

Nama : Muhammad Nawfal Alfanni Darussalam
NRP  : 5025241185
Kelas: B

Challenge:
- Challenge A : Bouncing Object (Position + Velocity + Boundary Check)
- Challenge B : Follow Mouse (Circle mengikuti koordinat kursor mouse)
- Challenge C : Click to Change Color (Klik kanvas mengubah warna objek secara dinamis)
- Challenge D : Keyboard Movement (State-based input W, A, S, D / Arrow Keys)
- Challenge E : Mouse Coordinate (Pelacakan koordinat kursor mouse secara real-time)
- Challenge 34.1 : Click to Create Circle (Spawn objek baru bertipe circle ke dalam array)
- Challenge 34.2 : Trail Mode (Bandingkan clear canvas vs semi-transparent / persistent canvas)
- Challenge 34.3 : Multiple Moving Objects (Render kumpulan objek dengan posisi, warna, dan kecepatan unik)
*/

// =============================================================================
// 1. INISIALISASI CANVAS DAN KONTEKS
// =============================================================================
const canvas = document.getElementById('glCanvas');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('statusDisplay');

// =============================================================================
// 2. DATA LAYER (APPLICATION STATE & OBJECTS)
// =============================================================================

// Palet warna untuk variasi visual
const palette = ['#00e676', '#ff007f', '#00e5ff', '#ffea00', '#ab47bc', '#ff9100'];
let paletteIndex = 0;

// [Challenge D] Player Object (Controlled via Keyboard)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 18,
    speed: 4,
    rotation: 0,
    color: palette[paletteIndex]
};

// [Challenge B & E] Mouse State (Follower Circle & Real-Time Coordinate)
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    color: 'rgba(0, 229, 255, 0.4)'
};

// [Challenge 34.1] Static Spawned Circles
const spawnedCircles = [];

// [Challenge A & 34.3] Multiple Moving & Bouncing Objects
const bouncingBalls = [
    { x: 100, y: 80,  vx: 3,  vy: 2.5, radius: 14, color: '#ff5252' },
    { x: 300, y: 200, vx: -2.5, vy: 3.5, radius: 20, color: '#ffea00' },
    { x: 500, y: 350, vx: 4,  vy: -2, radius: 10, color: '#ab47bc' },
    { x: 200, y: 400, vx: -3, vy: -3, radius: 16, color: '#00e676' }
];

// [Challenge 34.2] Trail Mode Flag
let enableTrail = false;

// State-Based Keyboard Input Tracker
const keys = {};

// =============================================================================
// 3. INPUT HANDLING (EVENT-BASED & STATE-BASED)
// =============================================================================

// [Challenge E] Pelacakan Koordinat Mouse
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = Math.round(e.clientX - rect.left);
    mouse.y = Math.round(e.clientY - rect.top);
});

// [Challenge C & 34.1] Event Klik Mouse: Ganti Warna & Spawn Circle
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(e.clientY - rect.top);

    // Challenge C: Ganti warna player
    paletteIndex = (paletteIndex + 1) % palette.length;
    player.color = palette[paletteIndex];

    // Challenge 34.1: Tambah circle baru pada posisi klik
    spawnedCircles.push({
        x: clickX,
        y: clickY,
        radius: Math.floor(Math.random() * 12) + 8,
        color: palette[(paletteIndex + 2) % palette.length]
    });
});

// Listener Tombol (Keyboard Down)
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // Event-Based Actions
    if (!e.repeat) {
        if (key === 't') {
            // Challenge 34.2: Toggle Trail Mode
            enableTrail = !enableTrail;
        } else if (key === 'r') {
            // Reset state
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            spawnedCircles.length = 0;
        }
    }

    // Challenge D: Simpan keyboard state aktif
    keys[key] = true;
});

// Listener Tombol (Keyboard Up)
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// =============================================================================
// 4. UPDATE DATA (LOGIC, KINEMATICS, & COLLISION)
// =============================================================================

// Update Player Movement & Boundary Check
function updatePlayer() {
    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalisasi vektor diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
    }

    // Translasi
    player.x += dx * player.speed;
    player.y += dy * player.speed;

    // Hitung sudut rotasi menghadap arah gerak
    if (dx !== 0 || dy !== 0) {
        player.rotation = Math.atan2(dy, dx);
    }

    // Boundary check player
    if (player.x - player.size < 0) player.x = player.size;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
    if (player.y - player.size < 0) player.y = player.size;
    if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
}

// [Challenge A & 34.3] Update Bouncing Objects (Position + Velocity + Bounce)
function updateBouncingBalls() {
    for (const ball of bouncingBalls) {
        // Translasi posisi berdasarkan vektor kecepatan
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Boundary Check Horizontal (Sumbu X)
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx; // Pantul arah
        } else if (ball.x + ball.radius >= canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.vx = -ball.vx;
        }

        // Boundary Check Vertikal (Sumbu Y)
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy; // Pantul arah
        } else if (ball.y + ball.radius >= canvas.height) {
            ball.y = canvas.height - ball.radius;
            ball.vy = -ball.vy;
        }
    }
}

// Update Informasi UI
function updateUI() {
    statusDisplay.innerHTML = `
        Mouse  : (X: <span>${mouse.x}</span>, Y: <span>${mouse.y}</span>)<br>
        Player : (X: <span>${Math.round(player.x)}</span>, Y: <span>${Math.round(player.y)}</span>)<br>
        Circles: <span>${spawnedCircles.length}</span> spawned<br>
        Trail  : <span>${enableTrail ? 'ON (Persistent/Alpha)' : 'OFF (Clear Every Frame)'}</span>
    `;
}

// =============================================================================
// 5. PRIMITIVE DRAWING (COORDINATES -> PIXELS)
// =============================================================================

// Clear Screen / Trail Handler
function handleClearCanvas() {
    if (enableTrail) {
        // [Challenge 34.2] Efek Jejak: Timpa kanvas dengan background semi-transparan
        ctx.fillStyle = 'rgba(26, 26, 30, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Pembersihan total setiap frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Grid Primitive
function drawGrid() {
    ctx.strokeStyle = '#25252b';
    ctx.lineWidth = 1;
    const size = 40;

    for (let x = 0; x < canvas.width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// [Challenge 34.1] Draw Semua Lingkaran Hasil Spawn
function drawSpawnedCircles() {
    for (const circle of spawnedCircles) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

// [Challenge A & 34.3] Draw Multiple Bouncing Balls
function drawBouncingBalls() {
    for (const ball of bouncingBalls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

// [Challenge B] Draw Mouse Follower Circle & Guide Line
function drawMouseFollower() {
    // Garis bantu dari Player menuju Mouse
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = '#444455';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Lingkaran yang menempel pada mouse
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
    ctx.fillStyle = mouse.color;
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Draw Player (Triangle with local transformation)
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation);

    ctx.beginPath();
    ctx.moveTo(player.size, 0);
    ctx.lineTo(-player.size, -player.size * 0.7);
    ctx.lineTo(-player.size * 0.5, 0);
    ctx.lineTo(-player.size, player.size * 0.7);
    ctx.closePath();

    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

// =============================================================================
// 6. ANIMATION LOOP (FRAME PIPELINE)
// =============================================================================
function render() {
    // STEP 1: UPDATE DATA
    updatePlayer();
    updateBouncingBalls();
    updateUI();

    // STEP 2: CLEAR / PREPARE FRAME
    handleClearCanvas();

    // STEP 3: DRAW PRIMITIVES
    if (!enableTrail) {
        drawGrid();
    }
    drawSpawnedCircles();
    drawBouncingBalls();
    drawMouseFollower();
    drawPlayer();

    // STEP 4: REPEAT (Jadwalkan frame berikutnya)
    requestAnimationFrame(render);
}

// Inisialisasi Loop Pertama Kali
requestAnimationFrame(render);
