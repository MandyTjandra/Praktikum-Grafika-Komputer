# 📂 Source Code Architecture (`src/`)

Direktori ini berisi seluruh logika utama dan kode program dari **Meteor Defense 3D**.
Arsitektur program dibangun dengan pendekatan **Modular ES6 Modules (Clean Architecture)** untuk memisahkan tanggung jawab tiap subsistem secara jelas (*Single Responsibility Principle*).

---

## 🏗️ Struktur & Fungsi Modul

```
src/
├── main.js          # Main Orchestrator, Game Loop, Event Listener & Lifecycle Management
├── sceneSetup.js    # Scene 3D, Mode Kamera (Orbit, FPP, Top-Down), Light PBR & Atmosphere
├── turret.js        # Scene Graph Meriam (Yaw/Pitch/Recoil) & Integration Model GLB Satellite
├── meteorManager.js # Generasi Prosedural 5 Jenis Meteor, Wave Spawner & Hit Detection
├── weaponSystem.js  # Sistem 3 Senjata, Amunisi/Reload, Upgrade Turret & Power-Up Abilities
├── radarManager.js  # Tactical Radar Minimap 360°, Vektor Trajektori & Off-Screen Indicators
├── audioManager.js  # BGM Controller, Sync Volume Audio UI & LocalStorage Settings
├── vfxManager.js    # Particle System, Debris Gravity, Screen Shake & Web Audio Synthesizer
└── uiManager.js     # HUD Render, Modal Start Screen, Settings Intel Codex & Leaderboard
```

## 📑 Rincian Peran Tiap Modul
1. main.js (Main Orchestrator)
Fungsi: Titik masuk (entry point) aplikasi dan pengatur siklus hidup game (game loop via requestAnimationFrame).

Fitur Utama:

Mengordinasikan update frame antar-modul (turret, meteor, weapon, radar, vfx).

Menangani event input kursor mouse untuk raycasting aiming meriam.

Mengelola transisi state permainan (Start Screen, In-Game, Pause, Victory, Game Over).

2. sceneSetup.js (3D Environment & Camera Engine)
Fungsi: Menyiapkan arena pertempuran 3D, sistem pencahayaan PBR, dan 3 mode kamera.

Fitur Utama:

3 Mode Kamera ([K]): Third-Person Orbit, First-Person Cockpit, dan Top-Down Isometric.

Lighting PBR: DirectionalLight (Shadow Map 2048x2048), AmbientLight, dan PointLight dinamis.

Atmosfer: 5 Tema Planet (PLANET_THEMES), kabut eksponensial (THREE.FogExp2), dan Procedural Skybox Starfield (1.600 partikel bintang).

3. turret.js (Scene Graph & GLB Satellite)
Fungsi: Mengelola objek 3D meriam pertahanan dan unit satelit pengintai orbital.

Fitur Utama:

Scene Graph Parent-Child: baseGroup (Parent) → headGroup (Yaw) → cannonGroup (Pitch/Recoil) dan satelliteGroup (Orbit Node).

Aset GLB & Animasi: Memuat assets/models/satellite.glb menggunakan GLTFLoader dan menjalankan 2 klip animasi eksternal via THREE.AnimationMixer (Radar_Scan & Solar_Wings_Deploy).

4. meteorManager.js (Enemies & Wave System)
Fungsi: Mengatur spawning prosedural, pergerakan, dan deteksi benturan meteor dengan planet.

Fitur Utama:

Membangkitkan 5 jenis meteor: Standard, Speedy, Armored, Cluster (Shards), dan Boss Asteroid.

Mengelola progresi gelombang (Wave 1-3) dan eskalasi tingkat kesulitan pada mode Campaign & Endless.

5. weaponSystem.js (Arsenal, Upgrades & Abilities)
Fungsi: Menangani logika persenjataan, amunisi, dan fitur pendukung taktis.

Fitur Utama:

3 Senjata: Meriam Laser (Hitscan), Peluru Kendali Missile (AOE Blast), dan Railgun Magnetik (Pierce Beam).

Sistem Reload: Manajemen amunisi mandiri untuk senjata sekunder.

4 Upgrade Turret: Damage ([Z]), Fire Rate ([X]), Max Ammo ([C]), dan Rotation Speed ([V]).

4 Power-Up Abilities: Planet Shield ([Q]), EMP Nuke ([E]), Time Slow ([F]), dan Double Score ([G]).

6. radarManager.js (Tactical Radar & Off-Screen Threat)
Fungsi: Rendering sistem navigasi dan radar taktis 2D real-time.

Fitur Utama:

Render Canvas 2D (160x160) dengan kompas arah mata angin dinamis (U/T/S/B).

Menampilkan titik asal (origin beacon), garis trajektori lintasan meteor, dan FOV kamera.

Panah peringatan bahaya di tepi layar (off-screen threat indicators) untuk meteor di luar jarak pandang.

7. audioManager.js (Audio System)
Fungsi: Pengendali musik latar belakang (BGM) dan preferensi volume.

Fitur Utama:

Kontrol Mute/Unmute ([N]) dan sinkronisasi slider volume BGM/SFX.

Penyimpanan pengaturan suara secara otomatis ke localStorage.

8. vfxManager.js (Visual Effects & Sound Synthesizer)
Fungsi: Menghasilkan efek visual 3D dan suara sintetis prosedural.

Fitur Utama:

VFX 3D: Semburan partikel ledakan, debris batuan bergravitasi, jejak asap meteor, beam laser, dan guncangan kamera (screen shake).

Audio Synthesizer: Generator efek suara Web Audio API tanpa berkas audio eksternal.

9. uiManager.js (User Interface & Modals)
Fungsi: Manajemen seluruh elemen antarmuka pengguna (HUD & Modal).

Fitur Utama:

Pembaruan HUD real-time (HP, Skor, Combo, Amunisi, Boss Bar).

Modal interaktif: Start Screen, Pause Menu, Game Over / Victory, Leaderboard, dan Settings Intel Codex.
