# 🛡️ Mobile Access Guard & Blocker

Modul independen untuk mendeteksi dan membatasi akses pengguna dari perangkat seluler (**Smartphone & Tablet**) ke game 3D *Meteor Defense 3D*, karena sistem kontrol permainan membutuhkan terminal komputer desktop (**Mouse & Keyboard fisik** serta akselerasi grafis WebGL).

---

## 📁 Struktur Berkas

```text
mobile-blocker/
├── 📄 index.html      # Halaman blokir bertema Sci-Fi cyberpunk dengan diagnosa hardware
├── 📄 style.css       # Desain UI mandiri responsif khusus tampilan mobile
├── 📄 detector.js     # Script deteksi multi-layer (User-Agent, Touch Points, Pointer Query)
└── 📄 README.md       # Panduan integrasi dan pengujian
```

---

## 🔍 Cara Kerja Sistem Deteksi (`detector.js`)

Deteksi dilakukan dengan pendekatan **Multi-Layer Detection** untuk menjamin akurasi tinggi tanpa *false positive* pada komputer desktop dengan monitor layar sentuh:

1. **Parameter Simulasi**:
   - `?simulate_mobile=true` &rarr; Mensimulasikan perilaku mobile pada browser desktop untuk testing.
2. **Modern Navigator Client Hints API**:
   - Mengecek `navigator.userAgentData.mobile` (didukung di Chromium 90+, Edge, Opera).
3. **User-Agent Regex Heuristic**:
   - Mendeteksi string *Android, iPhone, iPad, iPod, BlackBerry, IEMobile, Opera Mini, Silk, Kindle*, dll.
4. **iPadOS 13+ Spoofing Protection**:
   - Apple iPad modern menyamarkan User-Agent sebagai `Macintosh`. Skrip memvalidasi kombinasi `Macintosh` + `navigator.maxTouchPoints > 1`.
5. **CSS Media Query Pointer & Hover**:
   - Mengecek `window.matchMedia('(pointer: coarse)')` dan `(hover: none)` bersamaan dengan batas resolusi layar.

---

## 🚀 Cara Integrasi ke Game Utama (`../index.html`)

Proteksi ini aktif pada game utama dengan menyisipkan script pada tag `<head>` di file [`index.html`](../index.html):

```html
<head>
  <!-- Proteksi Akses Mobile -->
  <script src="mobile-blocker/detector.js"></script>
  <script>
    if (window.MobileDetector) {
      MobileDetector.guardOrRedirect('mobile-blocker/index.html');
    }
  </script>

  <!-- Kode Three.js & Game selanjutnya -->
  ...
</head>
```

---

## 🧪 Cara Pengujian (Testing)

### 1. Uji Coba Cepat di Desktop (Simulasi)
Buka URL game dengan menambahkan parameter `?simulate_mobile=true`:
```text
http://localhost:8000/index.html?simulate_mobile=true
```
Sistem akan otomatis mengenali browser seolah-olah adalah perangkat mobile dan mengalihkan Anda ke halaman `mobile-blocker/index.html`.

### 2. Uji Coba Menggunakan Google Chrome DevTools
1. Buka game di Chrome / Edge di PC (`http://localhost:8000`).
2. Buka DevTools (`F12` atau `Ctrl + Shift + I`).
3. Tekan `Ctrl + Shift + M` (atau klik ikon **Toggle device toolbar** 📱).
4. Pilih perangkat seperti **iPhone 14 Pro Max** atau **Samsung Galaxy S20 Ultra**.
5. Refresh halaman (`F5`). Anda akan langsung dialihkan ke halaman pemblokir.

---

## 💡 Fitur Halaman Pemblokir (`mobile-blocker/index.html`)
- **Tampilan Sci-Fi Futuristik**: Selaras dengan visual *Planetary Defense Initiative*.
- **Live Hardware Diagnostics**: Menampilkan status perangkat, resolusi layar, tipe pointer, dan multitouch points yang terdeteksi.
- **Salin Tautan Game Instan**: Tombol untuk menyalin URL game ke clipboard agar pengguna bisa langsung mengirimkannya via chat ke PC/Laptop mereka.
- **Pemeriksaan Ulang Real-time**: Tombol tes ulang jika pengguna beralih mode.
