# Praktikum Grafika Komputer — Pertemuan 1: 2D Graphics Playground

Dokumentasi implementasi modul praktikum mandiri mengenai fondasi *rendering pipeline*, sistem koordinat 2D, *primitive drawing*, penanganan *input* (*event-based* vs *state-based*), serta simulasi kinematika dasar menggunakan **HTML5 Canvas 2D API**.

---

## Ringkasan Konsep & Arsitektur

Aplikasi interaktif ini dibangun di atas paradigma siklus hidup grafika komputer:

```text
USER INPUT ──> UPDATE DATA ──> CLEAR FRAME ──> DRAW PRIMITIVES ──> DISPLAY ──> REPEAT
```

### 1. Rendering Pipeline

* **Data Layer:** State aplikasi disimpan dalam variabel numerik murni (`player.x`, `player.y`, `mouse.x`, array `bouncingBalls`, dsb.).
* **Coordinate Transformation:** Kanvas mengadopsi sistem koordinat layar dengan titik $(0,0)$ di kiri atas, sumbu $+X$ ke kanan, dan $+Y$ ke bawah.
* **Primitive Assembly:** Pembentukan bentuk dasar geometri:
* `Rectangle` / Bidang latar via `fillRect()` & `clearRect()`.
* `Circle` via `arc(x, y, radius, 0, Math.PI * 2)`.
* `Line` & `Grid` via `moveTo()` dan `lineTo()`.
* `Triangle / Polygon` via path tertutup dengan translasi matriks `translate()` dan `rotate()`.


* **Rasterization & Output:** Pengisian warna fragmen piksel menggunakan properti `fillStyle` / `strokeStyle` sebelum ditampilkan pada monitor via `requestAnimationFrame()`.

### 2. Pola Penanganan Input Keyboard

* **State-Based Input (Continuous):**
Status tombol disimpan dalam struktur data objek/map `keys = {}`. Logika translasi `updatePlayer()` memeriksa status ini di setiap frame, memungkinkan pergerakan halus (*continuous translation*) dan dukungan *multi-key* secara simultan (misal: diagonal $W+D$).
* **Event-Based Input (Discrete):**
Event `keydown` dengan filter `!e.repeat` digunakan untuk mengeksekusi aksi diskrit tepat satu kali per penekanan tombol (ganti warna, toggle opsi, reset posisi).

---

## Daftar Fitur & Challenge yang Diimplementasikan

| Kode Challenge | Nama Fitur | Deskripsi Teknis |
| --- | --- | --- |
| **Challenge A** | *Bouncing Object* | Pembaruan vektor kinematika $\text{Posisi} = \text{Posisi} + \text{Kecepatan}$ disertai pembalikan arah vektor ($\text{v} = -\text{v}$) saat memotong batas canvas. |
| **Challenge B** | *Follow Mouse* | Lingkaran kursor yang secara real-time mengikuti pergerakan koordinat mouse (`mouse.x`, `mouse.y`). |
| **Challenge C** | *Click to Change Color* | Event klik mouse (`mousedown`) yang memicu pergantian indeks warna objek dari palet yang tersedia. |
| **Challenge D** | *Keyboard Movement* | Kontrol pergerakan segitiga pesawat secara bebas menggunakan tombol WASD atau Arrow Keys dengan normalisasi vektor diagonal. |
| **Challenge E** | *Mouse Coordinate* | Pelacakan dan transformasi koordinat viewport browser ke koordinat lokal canvas yang ditampilkan pada panel status. |
| **Challenge 34.1** | *Click to Create Circle* | Instansiasi objek lingkaran baru ke dalam array `spawnedCircles` setiap kali pengguna mengklik area canvas. |
| **Challenge 34.2** | *Trail Mode* | Fitur komparasi antara pembersihan frame total (`clearRect()`) dengan pelapisan latar semi-transparan (`rgba() fillRect()`) untuk efek jejak visual. |
| **Challenge 34.3** | *Multiple Moving Objects* | Array of objects `bouncingBalls` yang merepresentasikan independensi data tiap entitas (posisi, radius, warna, dan vektor kecepatan unik). |

---

## Panduan Kontrol & Penggunaan

### Keyboard

* W / ↑ : Bergerak ke Atas
* S / ↓ : Bergerak ke Bawah
* A / ← : Bergerak ke Kiri
* D / → : Bergerak ke Kanan
* T : Mengaktifkan / Menonaktifkan **Trail Mode**
* R : Reset posisi player dan menghapus semua objek circle yang di-spawn

### Mouse

* **Hover Canvas:** Mengarahkan circle follower dan menampilkan koordinat real-time.
* **Klik Kiri:** Mengubah warna pesawat player sekaligus membuat satu circle statis pada titik klik.

---
