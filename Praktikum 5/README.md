# Textured & Lit Cube Playground (WebGL2)

Aplikasi WebGL2 interaktif 3D untuk memvisualisasikan *texture mapping*, *texture sampling* (filtering & wrapping), serta pencahayaan model Phong (komponen *Ambient*, *Diffuse*, dan *Specular*) dengan panel kontrol interaktif dan HUD real-time.

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

Aplikasi ini dikembangkan menggunakan HTML5, CSS3, JavaScript ES Modules, dan WebGL2 API. Objek 3D dibangun dengan **Position Buffer**, **Normal Buffer** (Flat & Smooth), dan **UV Buffer**. Aplikasi mendukung pemetaan tekstur (*procedural checkerboard* & *custom file upload*), manipulasi UV scale, pengaturan *filtering/wrapping*, serta model pencahayaan Phong interaktif.

### A. Kontrol Keyboard & Hotkeys
* **Posisi Cahaya (Sumbu X/Y)**: Tombol `Arrow Left` / `Arrow Right` / `Arrow Up` / `Arrow Down`
* **Posisi Cahaya (Sumbu Z)**: Tombol `W` (maju) / `S` (mundur)
* **Toggle Shading Mode**: Tombol `F` (FLAT $\leftrightarrow$ SMOOTH)
* **Cycle Texture Filtering**: Tombol `T` (LINEAR $\leftrightarrow$ NEAREST)
* **Cycle Texture Wrapping**: Tombol `G` (REPEAT $\rightarrow$ CLAMP_TO_EDGE $\rightarrow$ MIRRORED_REPEAT)
* **Skala UV Texture**: Tombol `[` (memperkecil UV scale) / `]` (memperbesar UV scale)
* **Shininess (Specular Highlight)**: Tombol `-` / `+`
* **Toggle Komponen Cahaya**:
  * `1` = Ambient Toggle
  * `2` = Diffuse Toggle
  * `3` = Specular Toggle
* **Reset Scene**: Tombol `R`

### B. Kontrol Panel Interaktif (Sidebar)
Selain keyboard, seluruh parameter aplikasi dapat dikontrol melalui sidebar interaktif:
* **Transformasi Cube**: Rotasi otomatis/manual (X/Y), rotasi speed, serta *Non-Uniform Scale Preset* ($1.8, 0.6, 1.0$).
* **Shading & Normal**: Pilihan Flat/Smooth, toggle `normalize(N)` di shader, dan toggle penggunaan **Normal Matrix** (*Inverse-Transpose*).
* **Pencahayaan**: Orbit otomatis cahaya, posisi $X/Y/Z$, warna cahaya, *Ambient Strength*, *Shininess*, serta toggle *Texture Only (No Light)*.
* **Tekstur & UV**: Pilihan *Procedural Checkerboard* atau *Custom Image Upload*, *UV Scale*, *Minification Filter* (termasuk Mipmapping), *Magnification Filter*, dan *Wrap Mode*.
* **Kamera & Proyeksi**: Posisi Kamera ($X/Y/Z$) dan *Field of View* (FOV).

---

## 3. Komponen Lighting, Parameter, & Fitur Pilihan (Challenge)

### A. Model Pencahayaan & Parameter Tekstur
1. **Ambient Lighting**: Menghitung pencahayaan dasar menggunakan `u_ambientStrength * texColor`.
2. **Diffuse Lighting**: Menghitung intensitas cahaya berarah menggunakan perkalian titik normal dan vektor cahaya $\max(\mathbf{N} \cdot \mathbf{L}, 0.0)$.
3. **Specular Lighting (Phong)**: Menghitung kilauan pantulan cahaya menggunakan $\mathbf{R} = \text{reflect}(-\mathbf{L}, \mathbf{N})$ dan $\text{pow}(\max(\mathbf{R} \cdot \mathbf{V}, 0.0), \text{shininess})$.
4. **Normal Matrix (Inverse-Transpose)**: Menggunakan submatriks 3x3 *inverse-transpose* dari *Model Matrix* untuk mempertahankan arah vektor normal saat terjadi *non-uniform scaling*.

### B. Fitur Pilihan (Challenge) yang Dikerjakan
* **Moving Light Otomatis (Orbiting Light)**: Fitur pergerakan cahaya mengorbit objek 3D secara otomatis dengan kecepatan orbit yang teratur.
* **Custom Texture Upload**: Fitur untuk memuat gambar kustom dari perangkat pengguna sebagai tekstur objek.
* **Interactive Control Panel & Dual Shading**: Integrasi sidebar kontrol lengkap dengan dukungan *Flat Shading* dan *Smooth (Phong) Shading*.

---

## 4. Hasil Eksperimen & Pengamatan

| Eksperimen | Nilai / Mode | Pengamatan Singkat |
| :--- | :--- | :--- |
| **Ambient Strength** | $0.0 \rightarrow 0.18 \rightarrow 0.5$ | Pada nilai $0.0$, sisi kubus yang membelakangi cahaya gelap gulita. Semakin tinggi nilainya, detail tekstur pada area bayangan tetap terlihat jelas. |
| **Shininess** | $2.0 \rightarrow 32.0 \rightarrow 128.0$ | Nilai kecil ($2.0$) menghasilkan pantulan *specular* yang melebar dan redup, sedangkan nilai besar ($128.0$) menghasilkan titik kilauan yang tajam dan fokus. |
| **Filtering (MIN/MAG)** | `NEAREST` vs `LINEAR` | `NEAREST` menghasilkan pola kotak-kotak piksel yang tajam (*pixelated/retro*), sedangkan `LINEAR` menghasilkan gradasi tekstur yang halus (*smooth*). |
| **Wrapping Mode** | `REPEAT` / `CLAMP` / `MIRROR` | Saat *UV Scale* $> 1.0$, `REPEAT` mengulang tekstur, `CLAMP_TO_EDGE` menarik piksel pinggir hingga memenuhi permukaan, dan `MIRRORED_REPEAT` mengulang tekstur secara cermin. |
| **Normal Matrix** | Active vs Non-Active | Saat *Non-Uniform Scale* diaktifkan, mematikan Normal Matrix menyebabkan pencahayaan terdistorsi karena vektor normal tidak lagi tegak lurus dengan permukaan. |

---

## 5. Kendala yang Ditemukan

1. **Transformasi Vektor Normal**: Mengatasi distorsi pencahayaan saat kubus di-skala secara *non-uniform* diselesaikan dengan mengimplementasikan kalkulasi *Normal Matrix* (Inverse-Transpose 3x3) di `math3d.js`[cite: 11, 12].
2. **Pengelolaan Mipmap Tekstur Kustom**: Penyesuaian `gl.generateMipmap()` dan parameter *filtering* agar berjalan tanpa *warning* saat pengguna mengunggah gambar kustom.

---

## 6. Tautan Demo & Repositori

* **Live Demo / Deployment**: [Link Web](https://mandytjandra.github.io/Praktikum-Grafika-Komputer/Praktikum%205/index.html)
* **Video Demo / Dokumentasi**: [Video Demo](https://drive.google.com/file/d/xxxxxx/view?usp=sharing)
