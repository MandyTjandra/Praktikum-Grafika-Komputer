# Rotating 3D Cube Camera Playground (WebGL2)

Aplikasi WebGL2 interaktif 3D untuk memvisualisasikan dan menguji konsep kamera (*View Matrix / Look-At*), jenis proyeksi (*Perspective* vs *Orthographic*), Field of View (FOV), *clipping plane* (*Near/Far*), serta efek pengujian kedalaman (*Depth Test*).

---

## 1. Identitas Kelompok

* Nama : Mandy Alphafyn Imanuel Tjandra
* NRP  : 5025241173
* Kelas: B

* Nama : Muhammad Nawfal Alfanni Darussalam
* NRP  : 5025241185
* Kelas: B

---

## 2. Deskripsi Aplikasi & Daftar Kontrol

Aplikasi ini dibangun menggunakan HTML5, CSS3, JavaScript ES Modules, dan WebGL2 API. Aplikasi menampilkan objek Cube 3D berwarna per sisi yang berputar secara otomatis menggunakan *Model Matrix* 4x4. Pengguna dapat mengeksplorasi pergerakan kamera secara *state-based*, merubah moda proyeksi, memanipulasi rentang FOV dan *clipping plane*, serta memantau semua parameter secara real-time melalui tampilan *Heads-Up Display* (HUD).

### Daftar Kontrol Keyboard
* **Posisi Kamera (Sumbu X / Y)**: Tombol `Arrow Left` / `Arrow Right` / `Arrow Up` / `Arrow Down`
* **Posisi Kamera (Sumbu Z)**: Tombol `W` (maju/mendekat) / `S` (mundur/menjauh)
* **Ganti Moda Proyeksi**: Tombol `P` (Perspective / Orthographic)
* **Penyesuaian FOV**: Tombol `[` (mempersepit FOV) / `]` (memperluas FOV)
* **Preset Clipping Plane (Near/Far)**: Tombol `N`
* **Toggle Depth Test**: Tombol `D` (ON / OFF)
* **Reset Tampilan & Kamera**: Tombol `R`

---

## 3. Perbandingan Proyeksi & Fitur Pilihan

### A. Perbandingan Moda Proyeksi
Aplikasi menyediakan dua jenis matriks proyeksi utama:

1. **Perspective Projection**
   * Menggunakan matriks frustum perspektif berbasis FOV, *aspect ratio*, serta plane *near* dan *far*.
   * Objek yang berada lebih jauh dari kamera terlihat lebih kecil (efek *foreshortening*), menciptakan ilusi kedalaman 3D yang realistis.
2. **Orthographic Projection**
   * Menggunakan matriks ortografis sejajar.
   * Ukuran objek tetap konstan tanpa terpengaruh oleh jarak/kedalaman dari kamera, ideal untuk analisis teknis dan presisi dimensi.

### B. Fitur Pilihan (Challenge) yang Dikerjakan
* **Kontrol Kamera Kontinu**: Pergerakan posisi kamera yang halus via *state-based keyboard input* pada sumbu X, Y, dan Z.
* **Toggle & Adaptif Proyeksi**: Perpindahan real-time antara *Perspective* dan *Orthographic* serta penyesuaian *aspect ratio* otomatis saat ukuran kanvas berubah.
* **Preset Near / Far Plane**: Sakelar cepat untuk mengubah batas *clipping plane* (`0.1/100`, `1.0/20`, `2.5/8`) untuk memvisualisasikan pemotongan objek (*clipping*).
* **Interactive FOV Adjuster**: Pengaturan sudut pandang kamera secara dinamis dalam rentang 30°–100°.
* **Dynamic Depth Test Toggle**: Fitur untuk mengaktifkan/deaktifkan `GL_DEPTH_TEST` guna mengamati perbedaan penumpukan piksel dengan atau tanpa *depth buffer*.
* **Interactive HUD & Reset State**: Tampilan overlay yang menyajikan data posisi kamera, proyeksi aktif, FOV, *near/far plane*, dan status *depth test*, dilengkapi tombol *reset* (`R`) untuk mengembalikan kondisi awal scene.

---

## 4. Struktur Berkas

* `index.html` — Elemen antarmuka, kanvas WebGL2, HUD, dan instruksi kontrol.
* `style.css` — Penataan tata letak (*layout*) responsif dan estetika tema *dark-mode*.
* `main.js` — Logika utama aplikasi (shader setup, render loop, event listener, kamera, dan pengelolaan HUD).
* `math3d.js` — Modul utilitas matematika 3D murni untuk operasi `Vec3` dan `Mat4` (*identity, translation, rotation, lookAt, perspective, orthographic*).
* `README.md` — Dokumentasi proyek.

---

## 5. Tautan Demo & Repositori

* **Live Demo / Deployment**: [Link Web](https://mandytjandra.github.io/Praktikum-Grafika-Komputer/Praktikum%204/)
* **Video Demo / Dokumentasi**: [Video Demo](https://drive.google.com/file/d/1WIbd7wRpY4DctRWqkstdSKAeYAM_he3M/view?usp=sharing)
