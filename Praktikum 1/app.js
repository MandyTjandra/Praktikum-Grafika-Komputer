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

/*
Checklist Pemenuhan:
1. Canvas minimal 800 x 500 (width=800, height=500)
2. Minimal tiga primitive (Rect, Line/Grid, Circle, Triangle)
3. Minimal empat warna (Array palette & custom object colors)
4. Triangle dari tiga vertex (moveTo + 2x lineTo + closePath)
5. Objek bergerak dan bouncing (Kinematika vx/vy & boundary bounce)
6. Translasi keyboard (State-based input continuous)
7. Koordinat mouse (Pelacakan real-time mouse.x & mouse.y)
8. Pause, reset, dan parameter speed (Keyboard Space, R, [ / ])
9. Challenge A-E lengkap
10. Challenge tambahan (Click create circle, Trail mode, Multiple moving objects)
*/

// =============================================================================
// 1. INISIALISASI CANVAS & KONTEKS
// =============================================================================
const canvas = document.getElementById('glCanvas');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('statusDisplay');

// =============================================================================
// 2. DATA LAYER (STATE APLIKASI & OBJEK)
// =============================================================================

// Minimal 4 warna terpenuhi (tersedia 6 palet)
const palette = ['#00e676', '#ff007f', '#00e5ff', '#ffea00', '#ab47bc', '#ff9100'];
let paletteIndex = 0;

// State Player (Segitiga 3 Vertex)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 4,               // Parameter speed awal
    rotation: 0,
    color: palette[paletteIndex]
};

// State Mouse Follower & Real-time Coordinate
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    color: 'rgba(0, 229, 255, 0.35)'
};

// Multiple Moving & Bouncing Objects
const bouncingBalls = [
    { x: 120, y: 100, vx: 3.5, vy: 2.5, radius: 15, color: '#ff5252' },
    { x: 400, y: 220, vx: -3.0, vy: 3.0, radius: 20, color: '#ffea00' },
    { x: 650, y: 350, vx: 4.0,  vy: -2.5, radius: 12, color: '#ab47bc' },
    { x: 250, y: 420, vx: -3.5, vy: -3.0, radius: 18, color: '#00e676' }
];

// Array Lingkaran Tambahan Hasil Klik
const spawnedCircles = [];

// Parameter Simulasi
let isPaused = false;       // Fitur Pause
let enableTrail = false;    // Fitur Trail Mode

// State-Based Keyboard Map
const keys = {};

// =============================================================================
// 3. INPUT HANDLING (EVENT-BASED & STATE-BASED)
// =============================================================================

// Pelacakan Koordinat Mouse secara Real-Time
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = Math.round(e.clientX - rect.left);
    mouse.y = Math.round(e.clientY - rect.top);
});

// Event Klik: Ganti Warna & Spawn Lingkaran Baru
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(e.clientY - rect.top);

    // Ganti warna player (Challenge C)
    paletteIndex = (paletteIndex + 1) % palette.length;
    player.color = palette[paletteIndex];

    // Spawn circle baru (Challenge 34.1)
    spawnedCircles.push({
        x: clickX,
        y: clickY,
        radius: Math.floor(Math.random() * 10) + 10,
        color: palette[(paletteIndex + 2) % palette.length]
    });
});

// Keyboard Listener: Event-Based Action & State-Based Tracking
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (!e.repeat) {
        // Pause Toggle
        if (e.code === 'Space') {
            isPaused = !isPaused;
        }
        // Parameter Speed Controls
        else if (key === '[') {
            player.speed = Math.max(1, player.speed - 1);
        } else if (key === ']') {
            player.speed = Math.min(12, player.speed + 1);
        }
        // Reset State
        else if (key === 'r') {
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            player.speed = 4;
            spawnedCircles.length = 0;
            isPaused = false;
        }
        // Ganti Warna Manual
        else if (key === 'c') {
            paletteIndex = (paletteIndex + 1) % palette.length;
            player.color = palette[paletteIndex];
        }
        // Toggle Trail Mode
        else if (key === 't') {
            enableTrail = !enableTrail;
        }
    }

    // Catat tombol yang ditahan untuk pergerakan kontinu
    keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// =============================================================================
// 4. UPDATE DATA & KINEMATIKA
// =============================================================================

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

    // Translasi posisi berdasarkan parameter speed
    player.x += dx * player.speed;
    player.y += dy * player.speed;

    // Hitung orientasi sudut rotasi
    if (dx !== 0 || dy !== 0) {
        player.rotation = Math.atan2(dy, dx);
    }

    // Boundary check player
    if (player.x - player.size < 0) player.x = player.size;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
    if (player.y - player.size < 0) player.y = player.size;
    if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
}

function updateBouncingBalls() {
    for (const ball of bouncingBalls) {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Boundary Check Horizontal
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx;
        } else if (ball.x + ball.radius >= canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.vx = -ball.vx;
        }

        // Boundary Check Vertikal
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy;
        } else if (ball.y + ball.radius >= canvas.height) {
            ball.y = canvas.height - ball.radius;
            ball.vy = -ball.vy;
        }
    }
}

function updateUI() {
    statusDisplay.innerHTML = `
        Status : <span>${isPaused ? 'PAUSED' : 'RUNNING'}</span><br>
        Speed  : <span>${player.speed} px/frame</span><br>
        Player : (X: <span>${Math.round(player.x)}</span>, Y: <span>${Math.round(player.y)}</span>)<br>
        Mouse  : (X: <span>${mouse.x}</span>, Y: <span>${mouse.y}</span>)<br>
        Circles: <span>${spawnedCircles.length}</span> spawned<br>
        Trail  : <span>${enableTrail ? 'ON' : 'OFF'}</span>
    `;
}

// =============================================================================
// 5. PRIMITIVE DRAWING (DATA -> VISUAL)
// =============================================================================

// Clear Screen / Trail Handler
function clearCanvas() {
    if (enableTrail) {
        ctx.fillStyle = 'rgba(26, 26, 30, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Primitive: Grid Lines
function drawGrid() {
    ctx.strokeStyle = '#25252b';
    ctx.lineWidth = 1;
    const size = 50;

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

// Primitive: Triangle dari TEPAT 3 VERTEX
function drawPlayerTriangle() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation);

    ctx.beginPath();
    // Vertex 1: Ujung depan
    ctx.moveTo(player.size, 0);
    // Vertex 2: Sudut kiri belakang
    ctx.lineTo(-player.size, -player.size * 0.75);
    // Vertex 3: Sudut kanan belakang
    ctx.lineTo(-player.size, player.size * 0.75);
    ctx.closePath(); // Menghubungkan vertex 3 kembali ke vertex 1

    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

// Primitive: Bouncing Circles
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

// Primitive: Spawned Circles
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

// Primitive: Mouse Circle & Dashed Guide Line
function drawMouseInteractions() {
    // Garis bantu (Line)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = '#444455';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Lingkaran mouse (Circle)
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
    ctx.fillStyle = mouse.color;
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// =============================================================================
// 6. ANIMATION LOOP
// =============================================================================

function render() {
    // 1. UPDATE DATA (Hanya jika tidak sedang di-pause)
    if (!isPaused) {
        updatePlayer();
        updateBouncingBalls();
    }
    updateUI();

    // 2. CLEAR FRAME
    clearCanvas();

    // 3. DRAW PRIMITIVES
    if (!enableTrail) {
        drawGrid();
    }
    drawSpawnedCircles();
    drawBouncingBalls();
    drawMouseInteractions();
    drawPlayerTriangle();

    // 4. REPEAT
    requestAnimationFrame(render);
}

// Inisialisasi Loop
requestAnimationFrame(render);
