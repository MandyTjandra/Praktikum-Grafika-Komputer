# Interactive Transformation Playground (WebGL2)

Aplikasi WebGL2 interaktif 2D untuk menguji dan memvisualisasikan matriks transformasi geometri linear (Translasi, Rotasi, dan Skala) serta efek hierarki *transform order*.

---

## 1. Identitas Kelompok

* **Nama Kelompok**: [Isi Nama Kelompok]
* **Anggota Kelompok**:
  * [Nama Anggota 1] - [NRP 1]
  * [Nama Anggota 2] - [NRP 2]
  * [Nama Anggota 3] - [NRP 3]

---

## 2. Deskripsi Aplikasi & Daftar Kontrol

Aplikasi ini dibangun menggunakan HTML5, CSS3, JavaScript murni, dan WebGL2 API. Aplikasi menyajikan dua objek 2D berbasis segitiga homogen di atas bidang koordinat NDC (Normalized Device Coordinates). Objek pertama dikontrol secara penuh oleh pengguna via keyboard/mouse, sedangkan objek kedua bergerak secara dinamis dan otomatis (animasi orbit & efek *pulsing scale*).

### Daftar Kontrol Keyboard & Mouse
* **Translasi X / Y**: Tombol `Arrow Left` / `Arrow Right` / `Arrow Up` / `Arrow Down` (atau `W` / `A` / `S` / `D`)[cite: 1, 2]
* **Translasi via Mouse**: Klik pada area kanvas WebGL (koordinat piksel dikonversi langsung ke NDC)[cite: 1, 2]
* **Rotasi**: Tombol `Q` (berlawanan arah jarum jam) / `E` (searah jarum jam)[cite: 1, 2]
* **Uniform Scale**: Tombol `+` (memperbesar) / `-` (memperkecil)[cite: 1, 2]
* **Non-Uniform Scale X**: Tombol `Z` (memperkecil X) / `X` (memperbesar X)[cite: 1, 2]
* **Non-Uniform Scale Y**: Tombol `C` (memperkecil Y) / `V` (memperbesar Y)[cite: 1, 2]
* **Reset Transformasi**: Tombol `R`[cite: 1, 2]
* **Preset Transformasi**: Tombol `1`, `2`, atau `3`[cite: 1, 2]
* **Toggle Order Transformasi**: Tombol `T`[cite: 1, 2]

---

## 3. Perbandingan Transform Order & Fitur Pilihan

### A. Perbandingan Transform Order
Aplikasi membandingkan dua urutan perkalian matriks kolom-utama (*Column-Major*) pada Objek 1:

1. **TRS ($T \times R \times S$) — Local Pivot Transformation**
   * Matriks dibentuk dari $M = T \cdot R \cdot S$.
   * Objek di-skala, diputar terhadap pusat (*origin*) lokalnya sendiri, lalu ditranslasikan ke posisi tujuan. Objek berputar pada poros dirinya sendiri.[cite: 2]
2. **RTS ($R \times T \times S$) — World Pivot Transformation**
   * Matriks dibentuk dari $M = R \cdot T \cdot S$.
   * Objek di-skala, ditranslasikan terlebih dahulu, kemudian diputar terhadap titik *origin* dunia $(0,0)$. Objek akan mengorbit pusat layar.[cite: 2]

### B. Fitur Pilihan (Challenge) yang Dikerjakan
* **Challenge A (Reset Transform)**: Mengembalikan posisi, rotasi, dan skala ke kondisi awal via tombol `R`.[cite: 2]
* **Challenge B (Transform Preset)**: Menyediakan 3 konfigurasi matriks preset yang dapat diakses melalui tombol `1`, `2`, dan `3`.[cite: 2]
* **Challenge C (Toggle Transform Order)**: Mengubah urutan matriks secara real-time dari $T \times R \times S$ ke $R \times T \times S$ via tombol `T`.[cite: 2]
* **Challenge D (Mouse Translation)**: Translasi posisi objek ke titik koordinat klik pengguna dengan konversi sistem koordinat layar piksel ke NDC WebGL $[-1, 1]$.[cite: 2]
* **Challenge E (Non-Uniform Scaling)**: Manipulasi skala independen untuk sumbu X (`Z`/`X`) dan sumbu Y (`C`/`V`).[cite: 1, 2]
* **Challenge F (Animated Scaling / Orbiting Object)**: Objek 2 yang mengorbit origin secara otomatis disertai efek perubahan skala (*pulsing scale*) dinamis berbasis fungsi sinusoide.[cite: 1, 2]

---

## 4. Petunjuk Menjalankan Aplikasi

Aplikasi ini menggunakan teknologi WebGL2 *client-side* murni tanpa dependensi *library* eksternal maupun *build tool*.

1. *Clone* atau unduh repositori ini ke komputer Anda:
   ```bash
   git clone <LINK_REPOSITORY_GITHUB>
