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
   * **Dimensi**: $10 \times 10$ (dirotasi $-90^\circ$ pada
