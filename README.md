# Portal Praktikum Grafika Komputer

# Textured 3D Cube & Interactive Lighting Playground (WebGL2)

Aplikasi WebGL2 interaktif 3D untuk menguji dan memvisualisasikan *texture mapping*, *texture sampling* (filtering & wrapping), serta pencahayaan model Phong/Blinn-Phong (komponen *Ambient*, *Diffuse*, dan *Specular*) secara dinamis.

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

Aplikasi ini dikembangkan menggunakan HTML5, CSS3, JavaScript ES Modules, dan WebGL2 API. Objek 3D dibangun menggunakan **Position Buffer**, **Normal Buffer**, dan **UV Buffer**. Aplikasi mendukung pemetaan tekstur pada seluruh permukaan objek serta pencahayaan *Ambient*, *Diffuse*, dan *Specular* dengan sudut pantul *specular highlight* yang menyesuaikan posisi kamera secara interaktif.

### Daftar Kontrol Keyboard
* **Posisi Cahaya (Sumbu X)**: Tombol `J` (kiri) / `L` (kanan)
* **Posisi Cahaya (Sumbu Y)**: Tombol `I` (atas) / `K` (bawah)
* **Posisi Cahaya (Sumbu Z)**: Tombol `U` (mendekat) / `O` (menjauh)
* **Moda Pencahayaan**: 
  * `1` = Ambient Only
  * `2` = Diffuse Only
  * `3` = Specular Only
  * *(Opsi kombinasi: Ambient + Diffuse, All Components)*
* **Toggle Filtering Tekstur**: Tombol `F` (LINEAR $\leftrightarrow$ NEAREST)
* **Toggle Wrapping Tekstur**: Tombol `W` (REPEAT $\rightarrow$ CLAMP_TO_EDGE $\rightarrow$ MIRRORED_REPEAT)
* **Reset & Mode Pilihan**: Sesuai dengan tombol fungsi challenge aktif

---

## 3. Komponen Lighting, Parameter, & Fitur Pilihan (Challenge)

### A. Model Pencahayaan & Parameter Tekstur
1. **Ambient Lighting**: Memberikan pencahayaan dasar pada seluruh bagian permukaan tanpa tergantung arah sumber cahaya.
2. **Diffuse Lighting**: Menghitung intensitas cahaya berdasarkan sudut antara vektor normal permukaan dan arah datang cahaya ($\mathbf{N} \cdot \mathbf{L}$).
3. **Specular Lighting**: Menghitung kilauan (*specular highlight*) berdasarkan arah pantulan cahaya terhadap posisi pengamat/kamera ($\mathbf{R} \cdot \mathbf{V}$ atau Blinn-Phong $\mathbf{N} \cdot \mathbf{H}$).
4. **Filtering & Wrapping**:
   * **Filtering (`LINEAR` vs `NEAREST`)**: Membandingkan kehalusan interpolasi warna tekstur piksel.
   * **Wrapping (`REPEAT`, `CLAMP_TO_EDGE`, `MIRRORED_REPEAT`)**: Mengatur perilaku koordinat UV di luar rentang $[0, 1]$.

### B. Fitur Pilihan (Challenge) yang Dikerjakan
* **Moving Light Otomatis / Light Position Marker**: Menampilkan indikator penanda posisi sumber cahaya dan/atau pergerakan cahaya otomatis.
* **Multiple Textures / UV Scrolling / Grayscale / Emission Effect**: *(Sebutkan challenge lain yang Anda pilih dari daftar)*.

---

## 4. Hasil Eksperimen & Pengamatan

| Eksperimen | Nilai / Mode | Pengamatan Singkat |
| :--- | :--- | :--- |
| **Ambient Strength** | $0 \rightarrow 0.2 \rightarrow 0.5$ | Semakin tinggi nilainya, area bayangan menjadi semakin terang dan warna asli tekstur lebih terlihat jelas meskipun tidak terkena cahaya langsung. |
| **Shininess** | $4 \rightarrow 32 \rightarrow 128$ | Nilai shininess kecil (4) menghasilkan pantulan specular yang melebar, sedangkan nilai besar (128) menghasilkan *highlight* kilauan yang fokus dan tajam seperti permukaan licin/logam. |
| **Filtering** | `NEAREST` vs `LINEAR` | `NEAREST` menghasilkan tampilan piksel terpisah (*pixelated/retro*), sedangkan `LINEAR` menghasilkan tekstur yang lebih halus dan renyah (*smooth blur*). |
| **Wrapping** | `REPEAT` / `CLAMP` / `MIRROR` | `REPEAT` mengulang pola tekstur, `CLAMP_TO_EDGE` menarik warna piksel pinggir, dan `MIRRORED_REPEAT` membalik orientasi tekstur saat diulang. |
| **Lighting** | Ambient / Diffuse / Specular / All | Moda `All` memberikan persepsi kedalaman 3D yang paling realistis dengan kombinasi warna dasar, orientasi permukaan, dan kilauan cahaya. |

---

## 5. Kendala yang Ditemukan

1. **Sinkronisasi Vektor Normal**: Menghitung dan mentransformasikan vektor normal permukaan agar tetap akurat saat objek berputar membutuhkan *Normal Matrix* (Inverse-Transpose dari Model-View Matrix).
2. **Koordinat UV & Wrapping**: Penyesuaian koordinat UV untuk memastikan tekstur terpetakan dengan sejajar di keenam sisi kubus tanpa mengalami efek distorsi.

---

## 6. Tautan Demo & Repositori

* **Live Demo / Deployment**: [Link Web](https://mandytjandra.github.io/Praktikum-Grafika-Komputer/Praktikum%204/index.html)
* **Video Demo / Dokumentasi**: [Video Demo](https://drive.google.com/file/d/xxxxxx/view?usp=sharing)

---

## Tautan Proyek

* **Live Demo (GitHub Pages)** : [Link Website Pusat](https://mandytjandra.github.io/Praktikum-Grafika-Komputer/)
* **Repositori GitHub**        : [Link Repo](https://github.com/MandyTjandra/Praktikum-Grafika-Komputer/tree/main)

---
