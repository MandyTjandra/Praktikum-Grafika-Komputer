# Meteor Defense 3D - Evaluasi Tengah Semester (ETS) Grafika Komputer

Proyek **Mini Game 3D Interaktif berbasis Browser** menggunakan **JavaScript, HTML5, CSS3, dan Three.js**.
Topik: **Topik 10 - Meteor Defense**.

---

## 🎯 Fitur Lengkap Sesuai Desain Permainan

### 1. Mekanik Utama & Kontrol
- **Variasi Senjata & Sistem Amunisi**:
  - **[1] Meriam Laser**: Serangan tembakan berkecepatan tinggi (*instant pinpoint hitscan*) dengan **Amunisi Tak Terbatas ($\infty$)** tanpa perlu reload.
  - **[2] Peluru Kendali (Missile)**: Proyektil roket 3D berhulu ledak dengan daya hancur area (*AOE blast*), memiliki **Kapasitas 7 Peluru**.
  - **[3] Railgun**: Tembakan berkas energi magnetik tebal yang **menembus (*pierce*) banyak target**, memiliki **Kapasitas 3 Peluru**.
- **Sistem Reload Independen**:
  - **Missile**: Memerlukan waktu reload taktis **1.6 detik**.
  - **Railgun**: Memerlukan waktu recharge kapasitor energi **3.2 detik (2x lebih lama)**.
  - Menekan **`[R]`** (atau otomatis saat amunisi habis) akan mengisi ulang amunisi sekunder secara mandiri.
- **Mode Kamera Bebas 360 Derajat (Semua Mode)**:
  - **Third-Person Orbit 360°**: Kamera dapat diputar mengelilingi pangkalan dan turret 360 derajat secara horizontal maupun vertikal.
  - **First-Person (Turret POV) 360°**: Kamera kokpit meriam yang dapat menoleh bebas 360 derajat ke segala arah antariksa.
  - **Top-Down / Isometric 360°**: Pandangan strategis dari atas yang dapat diorbit 360 derajat mengelilingi seluruh permukaan planet.
  - **Kontrol Kamera**: Klik kanan + drag mouse (atau Alt + klik kiri drag), tombol Panah (`←` `→` `↑` `↓`), serta scroll mouse untuk zoom in/out.
- **5 Jenis Meteor**:
  - **Standard**: Meteor berukuran dan berkecepatan normal.
  - **Speedy**: Meteor kecil berwarna emas dengan laju luncur sangat cepat.
  - **Armored**: Meteor merah berlapis batuan keras dengan HP tebal.
  - **Cluster**: Meteor kristal hijau yang saat hancur **memecah menjadi 3 serpihan (*shards*)** berbahaya.
  - **Boss Asteroid**: Asteroid raksasa bergerigi (*diameter 3x lipat*) dengan HP bar khusus di bagian atas layar HUD!

---

### 2. Sistem Progresi & Power-Up
- **Upgrade Turret (Koin Pertahanan)**:
  - **Damage**: Meningkatkan daya hancur senjata (`[Z]`).
  - **Fire Rate**: Mempercepat laju tembakan / memangkas cooldown (`[X]`).
  - **Kapasitas Amunisi**: Menambah jumlah maksimum peluru meriam (`[C]`).
  - **Kecepatan Rotasi**: Mempercepat laju putar meriam (*turret traversal*) mengikuti mouse (`[V]`).
- **Power-Up In-Game**:
  - **Perisai Planet (Planet Shield)**: Memunculkan kubah energi pelindung transparan (*Shield Dome VFX*) yang menyerap 1 hantaman meteor penuh (`[Q]`).
  - **Nuklir / EMP**: Gelombang kejut elektromagnetik pembersih layar (*screen clear*) yang menghancurkan seluruh meteor yang sedang terbang seketika (`[E]`).
  - **Time Slow**: Memperlambat aliran waktu kosmik hingga 65% selama beberapa detik (`[F]`).
  - **Double Score**: Menggandakan perolehan poin skor sebanyak 2x lipat (`[G]`).

---

### 3. Mode Permainan & Sistem Skor
- **Mode Permainan**:
  - **Mode Level / Campaign**: 3 gelombang penyerangan dengan klimaks pertempuran melawan **Boss Asteroid** di Wave 3 untuk meraih **Victory**.
  - **Mode Endless / Survival**: Gelombang meteor tanpa henti dengan eskalasi musuh bertahap untuk mencetak rekor skor tertinggi.
- **Sistem Skor & Combo**:
  - Tembakan akurat beruntun menghasilkan **Combo Multiplier (hingga 10x)**.
  - Banner animasi notifikasi streak combo (`COMBO x3!`, `x5 MEGA BLAST!`, `x10 GODLIKE!`).
- **Papan Peringkat (Leaderboard) Lokal**:
  - Pencatatan Top 5 Skor terbaik tersimpan otomatis di `localStorage` peramban.
  - Tombol modal interaktif untuk melihat peringkat kapan saja (`[L]`).
- **Radar & Minimap Taktis 360° (Aktif di Semua Mode Kamera)**:
  - **Tersedia di Seluruh Mode Pandang**: Bekerja otomatis di mode *Third-Person*, *First-Person (Turret)*, maupun *Top-Down*.
  - **Visualisasi Vektor & Titik Asal Meteor (Map Inbound Trajectory)**: Menampilkan titik awal kemunculan meteor dengan gelombang sinyal pulsa (*origin beacon*), garis putus-putus lintasan dari titik asal ke posisi saat ini, serta vektor prediksi tabrakan menuju markas.
  - **Kompas Arah Mata Angin Dinamis**: Indikator arah `U` (Utara), `T` (Timur), `S` (Selatan), dan `B` (Barat) yang berputar dinamis mengikuti hadap kamera 360°.
  - **Sudut Pandang Kamera (FOV Cone)**: Menampilkan bidang kerucut pandangan kamera pemain untuk memudahkan orientasi.
  - **Panah Peringatan Tepi Layar (Off-Screen Threat Indicators)**: Panah penunjuk arah di batas tepi layar yang mengarahkan pandangan pemain ke meteor yang berada di luar jarak pandang / di belakang kamera.
- **Penyeimbangan Tingkat Kesulitan Awal (Early-Game Balance)**:
  - **Wave 1 Ramah Pemula**: Komposisi musuh 85% Standard Meteor dan 15% Speedy Meteor (tanpa Armored ber-HP tebal atau Cluster yang memecah di awal).
  - **Kecepatan & Jarak Spawn Terkalibrasi**: Kecepatan meteor Wave 1 dipangkas ~30%, jarak muncul diperluas hingga 52-74m, dan interval spawn lebih santai (2.5 - 2.8 detik).
  - **Kekuatan Awal Pemain**: Modal awal koin dinaikkan menjadi 150 koin, damage Laser ditingkatkan menjadi 1.5, putaran turret lebih responsif (10.0 rad/s), dan penalti tabrakan planet di Wave 1 hanya 8 HP.
- **Start Screen (Title Screen) & Menu Pengaturan Lengkap**:
  - **Start Screen Sinematik**: Kamera melakukan rotasi orbit 360° yang elegan mengelilingi turret pangkalan di latar belakang saat menu awal terbuka sebelum permainan dimulai.
  - **Pilihan Mode Awal**: Pemain dapat memilih mode *Campaign* atau *Endless Survival* langsung di layar awal.
  - **Menu Pengaturan (Settings & Intel Codex)**:
    - *Audio & Suara*: Pengaturan Musik BGM (On/Off + slider volume 0-100%) dan Suara Efek SFX (On/Off + slider volume 0-100% + tombol uji suara).
    - *Panduan Kontrol*: Tabel referensi lengkap semua tombol kontrol mouse & keyboard.
    - *Intelijen Musuh*: Rincian karakteristik, HP, kecepatan, dan taktik jitu melawan 5 jenis meteor (Standard, Speedy, Armored, Cluster, Boss).
    - *Senjata, Upgrade & Kemampuan*: Panduan lengkap 3 senjata (Laser, Missile, Railgun), 4 upgrade turret, dan 4 abilities khusus (Shield, EMP, Slow, Double Score).
  - **Papan Peringkat (Leaderboard)**: Dapat diakses langsung dari Start Screen, HUD permainan, serta saat jeda (*Pause*).

---

### 4. Audio Visual & Kosmetik
- **Audio Visual & Kosmetik**:
  - **Efek Visual (VFX)**:
    - **Partikel Ledakan**: Semburan partikel warna-warni saat meteor meledak.
    - **Pecahan Batuan (Debris)**: Serpihan batu 3D yang berhamburan dengan simulasi gaya gravitasi dan rotasi tumbling.
    - **Jejak Api (Fire Trail)**: Ekor partikel berasap menyala di belakang setiap meteor yang meluncur.
    - **Kilatan Meriam (Muzzle Flash)**: Pancaran cahaya dinamis dan animasi recoil hentakan laras meriam ganda.
    - **Latar Belakang Kosmik Procedural**: 3D Procedural Starfield Skybox (1.600 partikel bintang) dengan atmosfer kabut dinamis (`THREE.FogExp2`).
  - **Sensori Umpan Balik & Audio**:
    - **Background Music (BGM)**: Trek musik tema antariksa sci-fi [`music.mp3`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/assets/music/music.mp3) dengan kontrol tombol HUD / pintasan keyboard `[N]`, dukungan pause otomatis, dan kepatuhan browser autoplay policy.
    - **Screen Shake**: Kamera berguncang dinamis saat pangkalan tertabrak, saat menembakkan misil, dan saat nuklir EMP meledak.
    - **Sound Effects (Web Audio API Procedural)**: Suara tembakan laser, peluncuran misil bergemuruh, ledakan railgun magnetik, dentuman ledakan meteor, alarm peringatan saat HP kritis (< 30%), dan bunyi reload mekanik.
  - **Kustomisasi**:
    - **5 Skin Meriam**: Cyber Cyan, Crimson Mecha, Gold Prime, Neon Emerald, dan Void Purple (`[T]`).
    - **5 Tema Planet & Atmosfer**: Lunar Slate, Mars Red, Ice Europa, Toxic Alien, dan Volcanic Ash (`[B]`).

---

## ⌨️ Daftar Kontrol Permainan

| Tombol / Aksi | Fungsi |
| :--- | :--- |
| **Gerakan Mouse** | Mengarahkan bidikan meriam (*Aiming Turret*) |
| **Klik Kiri Mouse** | Menembak meteor pada posisi kursor (menggunakan `THREE.Raycaster`) |
| **Klik Kanan Drag / Alt + Drag** | **Rotasi Kamera 360 Derajat Bebas** (Horizontal & Vertikal) |
| **Tombol Panah (`←` `→` `↑` `↓`)** | Rotasi kamera 360 derajat halus via keyboard |
| **Scroll Wheel Mouse** | Memperbesar / memperkecil jarak kamera (*Zoom In / Out*) |
| **`1` / `2` / `3`** | Memilih senjata: **[1] Laser**, **[2] Missile (AOE)**, **[3] Railgun (Tembus)** |
| **`R`** | Reload Amunisi Meriam |
| **`K`** | Mengganti mode kamera (*Third-Person*, *First-Person Turret*, *Top-Down*) |
| **`N`** | **Mute / Unmute Background Music (BGM)** |
| **`B`** | Mengganti **Tema Planet & Atmosfer** |
| **`T`** | Mengganti **Skin Meriam** |
| **`Z`** | Upgrade Damage Senjata (Koin) |
| **`X`** | Upgrade Kecepatan Tembak (*Fire Rate*) |
| **`C`** | Upgrade Kapasitas Amunisi (*Max Ammo*) |
| **`V`** | Upgrade Kecepatan Rotasi Meriam (*Rotation Speed*) |
| **`Q`** | Aktivasi **Planet Shield** (Perisai Pelindung) |
| **`E`** | Aktivasi **EMP Nuke** (Pembersih Layar) |
| **`F`** | Aktivasi **Time Slow** (Perlambat Waktu) |
| **`G`** | Aktivasi **Double Score** (Pengali Skor 2x) |
| **`M`** | Mengganti **Mode Permainan** (*Campaign* / *Endless*) |
| **`P` / `Escape`** | **Pause & Resume Game** (Menjeda / Melanjutkan Permainan) |
| **`L`** | Membuka **Papan Peringkat (Leaderboard)** |

---

## 📋 Pemenuhan Rubrik Penilaian Mata Kuliah

| Requirement Modul | Implementasi Kode | File Sumber |
| :--- | :--- | :--- |
| **Scene Graph Parent-Child** | `baseGroup` (Parent) &rarr; `headGroup` (Yaw) &rarr; `cannonGroup` (Pitch & Recoil) dan `satelliteGroup` (Orbit 360°) | [`src/turret.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/turret.js) |
| **Asset GLTF/GLB** | Model Satelit Orbital [`satellite.glb`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/assets/models/satellite.glb) dimuat via `GLTFLoader` (dengan fallback procedural GLB exporter jika via `file://`) | [`src/turret.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/turret.js) |
| **PBR Material & Shadows** | `MeshStandardMaterial` dengan metalness & roughness. `castShadow` pada turret, meteor, debris batuan, dan satelit; `receiveShadow` pada permukaan tanah dan batuan | [`src/sceneSetup.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/sceneSetup.js) |
| **Pencahayaan (Min. 2 Light)** | 1. `DirectionalLight` dengan bayangan 2048x2048<br>2. `AmbientLight`<br>3. `PointLight` pangkalan & muzzle flash dinamis | [`src/sceneSetup.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/sceneSetup.js) |
| **Environment & Fog** | 5 Tema Planet (`PLANET_THEMES`), atmosfer `THREE.FogExp2`, dan Procedural Starfield (1.600 partikel bintang) | [`src/sceneSetup.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/sceneSetup.js) |
| **Animasi & Interaksi Raycaster** | Raycaster mouse aiming & clicking, animasi orbit satelit, animasi recoil laras, animasi tumbling meteor, animasi debris gravitasi | [`src/main.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/main.js)<br>[`src/vfxManager.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/vfxManager.js) |
| **VFX & Audio Feedback** | 5 jenis VFX (Laser beam, Missile 3D, Particle explosion, Debris gravity, Fire trail, Shield dome, Screen shake) + BGM Soundtrack [`music.mp3`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/assets/music/music.mp3) + 10 efek suara sintetis | [`src/vfxManager.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/vfxManager.js) |
| **Objective, Win/Lose, Restart** | Mode Campaign 3 Wave dengan Boss raksasa, Mode Endless, modal Game Over/Victory, tombol restart instan | [`src/main.js`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/src/main.js) |

---

## 🚀 Cara Menjalankan Project

### Opsi 1: Menggunakan Python (Direkomendasikan)
Buka terminal di folder project dan jalankan:
```bash
python -m http.server 8000
```
Buka peramban di `http://localhost:8000`.

### Opsi 2: Menggunakan VS Code Live Server
Buka folder `ETS` di VS Code, klik kanan [`index.html`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/index.html) dan pilih **"Open with Live Server"**.

---

## 📜 Asset Credits & Attribution
- **3D Engine**: Three.js (MIT License) oleh Ricardo Cabello (mrdoob).
- **Model 3D GLB**: Model pertahanan satelit orbital GLTF 2.0 binary ([`satellite.glb`](file:///e:/GitHub's%20Repositories/Praktikum-Grafika-Komputer/ETS/assets/models/satellite.glb)).
- **Musik Latar Belakang (BGM)**: Sci-Fi Space Defense Soundtrack (`assets/music/music.mp3` via YouTube Audio).
- **Audio Synthesizer & SFX**: Procedural Web Audio API sound generator (Laser, Missile, Railgun, Explode, Alarm, Reload, Power-Up).
- **VFX & Shader**: Custom procedural particle system dan dynamic standard material.
