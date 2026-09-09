# WebGL Primitive Playground

Aplikasi web interaktif berbasis WebGL native murni (tanpa pustaka eksternal seperti Three.js) untuk mengeksplorasi rendering pipeline grafika 3D, GLSL shaders, manipulasi buffer GPU, dan berbagai mode primitive drawing.

---

## Fitur Utama

* **Pure WebGL & GLSL Shaders**: Menggunakan Vertex Shader dan Fragment Shader custom untuk memproses koordinat posisi 3D serta pewarnaan berbasis vertex attribute (`varying vec3 vColor`).
* **Matrix Math Engine**: Implementasi manual untuk perhitungan aljabar linier meliputi perkalian matriks 4x4, proyeksi perspektif, translasi, dan rotasi (Euler X & Y).
* **Multiple Primitives**: Menampilkan empat geometri dasar sekaligus dalam satu scene:
  * Segitiga (*Triangle*)
  * Kotak (*Square / 2 Triangles*)
  * Lingkaran (*Circle / Triangle Fan approximation*)
  * Kubus Wireframe (*3D Lines Cube*)
* **Dynamic Draw Modes**: Mengubah metode rasterisasi GPU secara instan antara `gl.TRIANGLES`, `gl.LINES`, dan `gl.POINTS`.
* **Kontrol Interaktif**: Navigasi rotasi 3D bebas via drag mouse, zoom kamera, serta pause/resume animasi.
* **Modern HUD / Dashboard**: Panel samping dengan telemetry real-time untuk status rendering, rotasi, zoom kamera, dan mode aktif.

---

## Struktur Berkas

Aplikasi ini bersifat mandiri (*standalone single-file application*):

```text
.
└── index.html       # Berisi struktur HTML, styling CSS, dan implementasi WebGL JS

```

---

## Panduan Penggunaan & Kontrol

Buka file `index.html` langsung pada peramban web modern yang mendukung WebGL (Google Chrome, Firefox, Safari, Edge).

### Kontrol Keyboard & Mouse

| Aksi / Tombol | Deskripsi |
| --- | --- |
| **Drag Mouse (Klik & Geser)** | Memutar objek/scene secara bebas pada sumbu X dan Y |
| W / S | Mengatur jarak zoom kamera mendekat/menjauh (`Camera Z`) |
| A / D | Memutar rotasi scene manual pada sumbu Y |
| Space | Pause atau Resume rotasi otomatis |
| 1 | Ubah Draw Mode ke `TRIANGLES` |
| 2 | Ubah Draw Mode ke `LINES` |
| 3 | Ubah Draw Mode ke `POINTS` |

---

## Arsitektur Teknis

* **Vertex Buffer Object (VBO)**: Mengombinasikan data atribut posisi `(x, y, z)` dan warna `(r, g, b)` dalam format *interleaved array* dengan stride sebesar `6 * sizeof(Float32)`.
* **Transformasi Model-View-Projection (MVP)**:
Matriks akhir dihitung sebelum dikirimkan ke shader via uniform `uMatrix`:

$$\text{MVP} = \text{Matrix}_{\text{proj}} \times \text{Matrix}_{\text{view}} \times \text{Matrix}_{\text{rotasi}} \times \text{Matrix}_{\text{translasi}}$$


* **Depth Testing**: Mengaktifkan `gl.DEPTH_TEST` untuk menangani urutan kedalaman objek di ruang 3D secara presisi.
---

## Tautan & Demo

* 🌐 **Live Demo**: [Link Web](https://mandytjandra.github.io/Praktikum-Grafika-Komputer/Praktikum%202/)
* 📂 **Video Demo**: [Video Demo](https://drive.google.com/file/d/1Ho8qDMwKmjfoRhZRXq-lY2TpNkcLKBxF/view?usp=sharing)
---
