# 🚀 Meteor Defense 3D: Planetary Defense Initiative

Game 3D Sci-Fi Interaktif Berbasis Web yang dibangun menggunakan **JavaScript (ES6 Modules), HTML5, CSS3, dan Three.js (WebGL2)**.
Pemain mengendalikan pangkalan pertahanan planetary meriam ganda untuk menghancurkan badai meteor kosmik, mengelola persenjataan taktis, dan menghadapi Boss Asteroid raksasa.
![Uploading image.png…]()

---

## 👥 Anggota Kelompok & Pembagian Kontribusi

| Nama Anggota | NRP | Pembagian Kontribusi & Tanggung Jawab |
| :--- | :--- | :--- |
| **Mandy Alphafyn Imanuel Tjandra** | 5025241173 | **Lead Core Developer**: Arsitektur modular Three.js (`main.js`, `turret.js`), konfigurasi Scene Graph, integrasi model `satellite.glb` + `AnimationMixer`, serta sistem senjata raycasting (`weaponSystem.js`). |
| **Muhammad Nawfal Alfanni Darussalam** | 5025241185 | **3D Environment & VFX Specialist**: Penyiapan pencahayaan PBR, 5 tema planet/atmosfer (`sceneSetup.js`), sistem partikel ledakan, debris gravitasi, & Web Audio API synthesizer (`vfxManager.js`). |

---

## 📖 Deskripsi Project
**Meteor Defense 3D** adalah game pertahanan planet sci-fi di mana pemain bertugas melindungi pangkalan utama dari ancaman badai meteor dan asteroid raksasa. Dengan grafis 3D PBR, pencahayaan dinamis, bayangan nyata, serta efek suara sintetis prosedural, game ini memberikan pengalaman aksi taktis interaktif berbasis web tanpa menggunakan engine game komersial instan.

---

## 🎮 Gameplay & Fitur Interaksi

### 1. Sistem Persenjataan & Amunisi
- **[1] Meriam Laser**: Serangan tembakan berkecepatan tinggi (*instant pinpoint hitscan*) dengan **Amunisi Tak Terbatas ($\infty$)**. Efektif menghancurkan meteor cepat.
- **[2] Peluru Kendali (Missile)**: Proyektil roket 3D berhulu ledak dengan daya hancur area (*AOE blast*), memiliki **Kapasitas 7 Peluru** (Reload 1.6s).
- **[3] Railgun Magnetik**: Tembakan berkas energi tebal yang **menembus (*pierce*) seluruh target segaris**, memiliki **Kapasitas 3 Peluru** (Recharge 3.2s).

### 2. Jenis Musuh (Meteor)
- **Standard**: Meteor batuan umum dengan kecepatan dan HP normal.
- **Speedy**: Meteor komet kecil berwarna emas yang meluncur sangat cepat.
- **Armored**: Meteor merah berlapis batuan keras dengan HP tebal.
- **Cluster**: Meteor kristal hijau yang saat hancur **memecah menjadi 3 serpihan (*shards*)** cepat.
- **Boss Asteroid**: Asteroid raksasa berkawah magma dengan HP Bar khusus di HUD pada Wave 3.

### 3. Upgrade Turret & Power-Up Abilities
- **Upgrade Turret**: Meningkatkan *Damage* (`[Z]`), *Fire Rate* (`[X]`), *Max Ammo* (`[C]`), dan *Rotation Speed* (`[V]`) menggunakan koin yang didapatkan dari menghancurkan meteor.
- **Power-Up Abilities**:
  - **Planet Shield (`[Q]`)**: Kubah energi transparan yang menyerap 1 hantaman meteor.
  - **EMP Nuke (`[E]`)**: Gelombang elektromagnetik pembersih layar (*screen clear*).
  - **Time Slow (`[F]`)**: Memperlambat aliran waktu kosmik sebesar 65% selama 6 detik.
  - **Double Score (`[G]`)**: Menggandakan perolehan skor (2x) selama 8 detik.

### 4. Sistem Kamera & Radar Taktis 360°
- **3 Mode Kamera (`[K]`)**: *Third-Person Orbit 360°*, *First-Person Cockpit 360°*, dan *Top-Down Isometric 360°*.
- **Radar Taktis 360°**: Menampilkan indikator posisi meteor, kompas arah mata angin (U/T/S/B), vektor lintasan asal meteor, dan panah peringatan bahaya di tepi layar (*off-screen indicator*).

---

## ⌨️ Daftar Kontrol Permainan

| Tombol / Input | Fungsi & Tindakan |
| :--- | :--- |
| **Gerakan Mouse** | Mengarahkan bidikan meriam (*Aiming Turret*) |
| **Klik Kiri Mouse** | Menembak meteor menggunakan `THREE.Raycaster` |
| **Klik Kanan Drag / Alt + Drag** | **Rotasi Kamera 360° Bebas** (Horizontal & Vertikal) |
| **Tombol Panah (`←` `→` `↑` `↓`)** | Rotasi kamera 360° via keyboard |
| **Scroll Mouse** | Zoom In / Zoom Out jarak kamera |
| **`1` / `2` / `3`** | Ganti Senjata: [1] Laser, [2] Missile (AOE), [3] Railgun (Pierce) |
| **`R`** | Isi ulang amunisi sekunder (*Reload*) |
| **`K`** | Ganti Mode Kamera (*Third-Person*, *First-Person*, *Top-Down*) |
| **`T` / `B`** | Kustomisasi Skin Meriam (`[T]`) & Tema Planet (`[B]`) |
| **`Z` `X` `C` `V`** | Upgrade Turret (Damage, Fire Rate, Max Ammo, Rot Speed) |
| **`Q` `E` `F` `G`** | Aktivasi Power-Up (Shield, EMP Nuke, Time Slow, Double Score) |
| **`M`** | Ganti Mode Permainan (*Campaign 3 Wave* / *Endless Survival*) |
| **`P` / `Escape`** | Menjeda / Melanjutkan permainan (*Pause / Resume*) |
| **`L`** | Membuka Papan Peringkat (*Leaderboard* lokal) |

---

## 🎨 Fitur Grafika 3D (Engine Specification)

- **Scene Graph Parent-Child**: Hierarki objek `baseGroup` (Parent) &rarr; `headGroup` (Yaw) &rarr; `cannonGroup` (Pitch/Recoil) dan `satelliteGroup` (Orbiting Node).
- **Aset GLTF/GLB & 2 Animasi**: Model `assets/models/satellite.glb` di-load menggunakan `GLTFLoader` dengan **2 animasi internal** yang dijalankan via `THREE.AnimationMixer` (`Radar_Scan` & `Solar_Wings_Deploy`).
- **Material PBR & Shadows**: Menggunakan `MeshStandardMaterial` dengan kalkulasi metalness/roughness; `castShadow` diaktifkan pada turret, meteor, dan debris; `receiveShadow` pada planet ground.
- **Pencahayaan Dinamis**: Kombinasi `DirectionalLight` (dengan shadow map 2048x2048), `AmbientLight`, dan `PointLight` untuk efek muzzle flash dinamis.
- **Environment & Atmosphere**: 5 variasi tema planet dengan efek kabut eksponensial (`THREE.FogExp2`) dan *3D Procedural Starfield Skybox* (1.600 partikel bintang).
- **Raycasting & Interaction**: Menggunakan `THREE.Raycaster` untuk memproyeksikan kursor 2D mouse ke dunia 3D guna mengarahkan bidikan dan menghitung titik hantam peluru.
- **VFX & Audio Feedback**: System partikel ledakan 3D, debris batuan bergravitasi, jejak asap meteor, guncangan kamera (*screen shake*), musik BGM, dan 10 efek suara sintetis via Web Audio API.

---

## ⚡ Challenge / Tantangan dalam Pengembangan

1. **Sinkronisasi Matriks Scene Graph & Raycasting**: Menjaga koordinat bidikan meriam ganda agar tetap presisi mengikuti kursor mouse dari 3 mode kamera yang berbeda (Orbit, FPP, dan Top-Down).
2. **Manajemen Animasi Aset 3D External**: Mengintegrasikan `THREE.AnimationMixer` untuk menjalankan 2 klip animasi bawaan dari file `.glb` secara simultan tanpa mengganggu *performance frame rate* (60 FPS).
3. **Kalkulasi Radar 360° Real-Time**: Menerjemahkan koordinat ruang 3D (World Space) ke sistem koordinat polar 2D canvas radar dan proyeksi panah tepi layar (*off-screen threat indicators*).

---

## 🚀 Cara Menjalankan Project

### Opsi 1: Menggunakan Python (Direkomendasikan)
Buka terminal di folder project dan jalankan:
```bash
python -m http.server 8000
```
Buka peramban di `http://localhost:8000`.

### Opsi 2: Menggunakan VS Code Live Server
Buka folder project di VS Code, klik kanan [`index.html`](./index.html) dan pilih **"Open with Live Server"**.

---

## 📜 Asset Credits & Attribution
- **3D Engine**: Three.js (MIT License) oleh Ricardo Cabello (mrdoob).
- **Model 3D GLB**: Model pertahanan satelit orbital GLTF 2.0 binary ([`satellite.glb`](./assets/models/satellite.glb)).
- **Musik Latar Belakang (BGM)**: Sci-Fi Space Defense Soundtrack (`assets/music/music.mp3` via YouTube Audio).
- **Audio Synthesizer & SFX**: Procedural Web Audio API sound generator (Laser, Missile, Railgun, Explode, Alarm, Reload, Power-Up).
- **VFX & Shader**: Custom procedural particle system dan dynamic standard material.
