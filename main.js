/**
 * Data Modul Praktikum Grafika Komputer
 * Tambahkan objek praktikum berikutnya ke dalam array ini ketika ada penambahan modul
 */
const modules = [
    {
        id: "Praktikum 01",
        title: "Canvas 2D Graphics Playground",
        liveUrl: "./Praktikum 1/index.html",
        githubUrl: "https://github.com/MandyTjandra/Praktikum-Grafika-Komputer/tree/main/Praktikum%201",
        desc: "Fondasi rendering pipeline, primitive drawing (Line, Rect, Circle, Triangle), boundary collision check, state-based keyboard movement, event-based action, trail mode, dan kinematika bouncing ball.",
        tags: ["HTML5 Canvas 2D", "State-Based Input", "Primitive Drawing", "Kinematics", "Boundary Check"]
    },
    {
        id: "Praktikum 02",
        title: "WebGL Primitive Playground",
        liveUrl: "./Praktikum 2/index.html",
        githubUrl: "https://github.com/MandyTjandra/Praktikum-Grafika-Komputer/tree/main/Praktikum%202",
        desc: "Implementasi native WebGL pipeline, GLSL vertex & fragment shaders, buffer GPU interleaved (VBO), matriks transformasi manual (MVP), manipulasi camera Z, serta mode rasterisasi dinamis (Triangles, Lines, Points).",
        tags: ["WebGL", "GLSL Shaders", "Matrix MVP", "GPU Buffers", "3D Transforms", "Primitives"]
    },
    {
        id: "Praktikum 03",
        title: "Interactive Transformation Playground (WebGL2)",
        liveUrl: "./Praktikum 3/index.html",
        githubUrl: "https://github.com/MandyTjandra/Praktikum-Grafika-Komputer/tree/main/Praktikum%203",
        desc: "Visualisasi interaktif matriks transformasi geometri 2D (Translasi, Rotasi, Uniform/Non-Uniform Scaling) pada WebGL2 NDC. Komparasi hierarki transform order TRS (Local Pivot) vs RTS (World Pivot Orbit), kontrol mouse-to-NDC, preset matriks, serta animasi dynamic pulsing & orbiting object.",
        tags: ["WebGL2", "2D Transformations", "Matrix Order (TRS vs RTS)", "NDC Coordinates", "Non-Uniform Scaling", "Orbit & Pulsing Animation"]
    }
];

// Inisialisasi DOM Elements
const container = document.getElementById('moduleContainer');
const readyCountEl = document.getElementById('readyCount');

// Update Status Jumlah Modul Aktif (otomatis menjadi 3)
if (readyCountEl) {
    readyCountEl.innerText = modules.length;
}

// Render Kartu Modul secara Dinamis
modules.forEach(mod => {
    const card = document.createElement('article');
    card.className = 'card';

    const tagsHTML = mod.tags
        .map(tag => `<span class="topic-chip">${tag}</span>`)
        .join('');

    card.innerHTML = `
        <div>
            <div class="card-header">
                <span class="modul-tag">${mod.id}</span>
                <span class="status-pill">Tersedia</span>
            </div>
            <h2>${mod.title}</h2>
            <p>${mod.desc}</p>
            <div class="topics-list">${tagsHTML}</div>
        </div>
        <div class="card-footer">
            <a href="${mod.liveUrl}" class="action-link">
                Buka Playground Live ➔
            </a>
            <a href="${mod.githubUrl}" target="_blank" rel="noopener noreferrer" class="repo-link">
                Source Code GitHub ↗
            </a>
        </div>
    `;

    container.appendChild(card);
});