### 📂 2. `scripts/README.md` (atau `script/README.md`)

## 📜 Daftar Skrip

```
scripts/
├── generate_satellite.mjs  # Buat & ekspor model 3D satelit + 2 animasi ke .glb
└── verify_satellite.mjs    # Validasi file .glb (ukuran, mesh, dan animasi)
```
## 📑 Penjelasan Skrip
### 1. generate_satellite.mjs
Fungsi: Membangun hierarki mesh 3D Satelit Orbital (Fuselage, Solar Wings, Radar Dish, Thruster) secara prosedural menggunakan Three.js di lingkungan Node.js, mengompilasi 2 klip animasi keyframe, dan mengespor hasilnya ke file biner assets/models/satellite.glb.

Klip Animasi yang Dihasilkan:

Radar_Scan: Rotasi sapuan 360° piringan radar dan elevasi naik-turun.

Solar_Wings_Deploy: Fleksi kepakan panel surya kiri-kanan & denyut semburan plasma ion jet.

### 2. verify_satellite.mjs
Fungsi: Memuat ulang file assets/models/satellite.glb hasil ekspor untuk memverifikasi ukuran berkas, struktur nodus mesh, serta keterSEDIAAN dan durasi klip animasi.

Output Verifikasi:

Ukuran file (KB).

Jumlah total animasi dan nama track.

Pohon hierarki elemen 3D.
