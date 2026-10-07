# Three.js Mini 3D Scene

Aplikasi WebGL 3D interaktif yang dibangun menggunakan Three.js dan `lil-gui` untuk memvisualisasikan lingkungan 3D dinamis dengan pencahayaan, bayangan (*shadows*), transformasi objek, serta kontrol kamera *orbit*.

---

## 1. Identitas Kelompok

* **Nama** : Mandy Alphafyn Imanuel Tjandra
* **NRP**  : 5025241173
* **Kelas**: B

* **Nama** : Muhammad Nawfal Alfanni Darussalam
* **NRP**  : 5025241185
* **Kelas**: B

---

## 2. Deskripsi Scene & Fitur Utama

Proyek ini menyajikan lanskap 3D interaktif yang terdiri dari objek geometri dasar di atas bidang landasan (*ground plane*). Aplikasi mendukung animasi pergerakan kontinu, sistem pencahayaan realistis dengan bayangan lembut (*soft shadows*), serta *Control Panel* interaktif menggunakan `lil-gui` untuk manipulasi properti scene secara *real-time*.

### Komponen Scene & Fitur Utama:
* **Pengaturan Scene**: Latar belakang (*background*) berkonsep *dark-mode* dengan kamera `PerspectiveCamera` dan pengontrol `OrbitControls`.
* **Objek 3D (Mesh)**: Kombinasi `BoxGeometry` (Cube), `SphereGeometry` (Sphere), dan `PlaneGeometry` (Ground Plane).
* **Material & Lighting**: Penggunaan material `MeshLambertMaterial` dan `MeshPhongMaterial` yang merespons kombinasi `AmbientLight` dan `DirectionalLight`.
* **Sistem Bayangan**: Render bayangan presisi menggunakan `PCFSoftShadowMap` dengan properti `castShadow` pada objek dan `receiveShadow` pada ground.
* **Animasi Delta Time**: Rotasi otomatis pada Cube serta efek *bouncing/bobbing* pada Sphere berbasis `THREE.Clock`.
* **Responsif**: Penyesuaian otomatis aspek rasio kamera, *projection matrix*, dan batas *pixel ratio* renderer saat ukuran jendela browser berubah.

---

## 3. Daftar Geometri, Material, & Pencahayaan

### A. Geometri (Mesh)
1. **Cube (`BoxGeometry`)**:
   * **Dimensi**: $1 \times 1 \times 1$
   * **Posisi Awal**: `(-1.2, 0.6, 0)`
   * **Shadow**: `castShadow = true`
2. **Sphere (`SphereGeometry`)**:
   * **Radius / Segmen**: Radius $0.7$, $32$ width segments, $16$ height segments
   * **Posisi Awal**: `(1.4, 0.75, 0)`
   * **Shadow**: `castShadow = true`
3. **Ground Plane (`PlaneGeometry`)**:
   * **Dimensi**: $10 \times 10$ (dirotasi $-90^\circ$ pada sumbu X)
   * **Posisi**: `y = 0`
   * **Shadow**: `receiveShadow = true`

### B. Material
* **Cube Material**: `MeshLambertMaterial` (Warna Cyan: `#22d3ee`) — Merespons pencahayaan *diffuse*.
* **Sphere Material**: `MeshPhongMaterial` (Warna Biru: `#4488ff`, *Shininess*: `60`) — Merespons pencahayaan *diffuse* dan menghasilkan kilauan *specular*.
* **Ground Material**: `MeshLambertMaterial` (Warna Slate: `#334155`) — Menyerap bayangan objek di atasnya.

### C. Pencahayaan (Lighting) & Konfigurasi Shadow
* **AmbientLight**: Intensitas `0.35` (pencahayaan dasar menyeluruh).
* **DirectionalLight**: Intensitas `2.0`, Posisi `(3, 5, 2)`.
  * `castShadow = true`
  * `shadow.mapSize`: $1024 \times 1024$
  * `shadow.camera`: Bound orthographic frustum (Left: -5, Right: 5, Top: 5, Bottom: -5, Near: 0.5, Far: 20)
* **Shadow Map Type**: `THREE.PCFSoftShadowMap` pada `WebGLRenderer`.

---

## 4. Fitur Challenge yang Dikerjakan

 Seluruh pilihan challenge telah diimplementasikan dalam proyek ini:

1. **Tambah 2 Geometry**: Implementasi `BoxGeometry`, `SphereGeometry`, dan `PlaneGeometry` dalam satu scene.
2. **Material Gallery**: Penggunaan gabungan material merespons cahaya (`MeshLambertMaterial` & `MeshPhongMaterial`) dengan properti *shininess* dan *wireframe toggle*.
3. **Light Animation / Controls**: Pengaturan posisi, warna latar, serta intensitas *Ambient* dan *Directional Light* melalui GUI.
4. **Shadow Quality & Toggle**: Sakelar aktif/non-aktif bayangan (*Shadow Enabled*) real-time melalui GUI.
5. **Scene Information**: Tampilan HUD real-time berisi koordinat posisi kamera dan jumlah objek aktif di scene.
6. **Toggle Animation**: Kontrol *Play/Pause* animasi serta kecepatan rotasi Cube dan *bobbing speed/height* Sphere.
7. **Object Control & Reset View**: Manipulasi penuh posisi ($X, Y, Z$), rotasi, skala, warna, dan tombol *Reset View* kamera.

---

## 5. Kontrol Interaktif & GUI

### A. Kontrol Mouse & Kamera (`OrbitControls`)
* **Klik Kiri + Drag**: Memutar sudut pandang kamera (*Rotate*).
* **Klik Kanan + Drag**: Menggeser posisi fokus kamera (*Pan*).
* **Scroll Wheel**: Memperdekat / memperjauh kamera (*Zoom*).

### B. Panel GUI (`lil-gui`)
* **Environment**: Ubah warna latar belakang scene secara dinamis.
* **Camera**: Atur sudut pandang *Field of View* (FOV) & tombol *Reset View*.
* **Cube / Sphere**: Ubah Posisi ($X/Y/Z$), Rotasi, Skala, Warna, mode *Wireframe*, dan bayangan.
* **Lighting**: Ubah intensitas cahaya, posisi *Directional Light*, dan toggle *Shadow Enabled*.
* **Animation**: Toggle *Play/Pause*, kecepatan rotasi Cube, serta tinggi & kecepatan membal Sphere.

---

## 6. Tautan Demo & Repositori

* **Live Demo / Deployment**: [Link Web](https://mandytjandra.github.io/Praktikum-Grafika-Komputer/Praktikum%205/index.html)
* **Video Demo / Dokumentasi**: [Video Demo](https://drive.google.com/file/d/1dq2K2MzE2fOJdwotqq182ys1Fz-TJ4xf/view?usp=sharing)
