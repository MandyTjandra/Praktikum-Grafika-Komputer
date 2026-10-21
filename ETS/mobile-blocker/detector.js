/**
 * Mobile Detector & Device Guard
 * Digunakan untuk mendeteksi dan melarang pengguna mengakses game dari perangkat mobile / tablet.
 * Mendukung deteksi multi-layer:
 * 1. Navigator UserAgentData API (Modern Client Hints)
 * 2. User Agent String regex (Android, iOS, iPad, dsb)
 * 3. iPadOS 13+ detection (Apple melaporkan diri sebagai Mac dengan multitouch)
 * 4. CSS Media Query Pointer & Hover (@media (pointer: coarse) & (hover: none))
 * 5. Screen dimensions heuristic
 */

const MobileDetector = (function () {
  /**
   * Mengecek apakah perangkat adalah mobile atau tablet
   * @returns {boolean} true jika perangkat mobile/tablet terdeteksi
   */
  function isMobile() {
    // Parameter simulasi (?simulate_mobile=true) untuk pengetesan di browser desktop
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('simulate_mobile') === 'true') {
      return true;
    }

    // 1. Modern Client Hints API (Chrome 90+, Edge, Opera)
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
      if (navigator.userAgentData.mobile) {
        return true;
      }
    }

    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

    // 2. User-Agent regex check (Ponsel & Tablet Umum)
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|silk|kindle/i;
    if (mobileRegex.test(ua)) {
      return true;
    }

    // 3. iPadOS 13+ Detection (Apple melaporkan diri sebagai "Macintosh" di UA, namun memiliki layar sentuh multitouch)
    const isIPad = /macintosh/i.test(ua) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
    if (isIPad) {
      return true;
    }

    // 4. Heuristik Media Query: Perangkat layar sentuh tanpa mouse hover presisi
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const hasNoHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
    const isSmallOrTabletScreen = window.innerWidth <= 1024 || window.innerHeight <= 600;

    if (hasCoarsePointer && hasNoHover && isSmallOrTabletScreen) {
      return true;
    }

    // Default: Dianggap Desktop
    return false;
  }

  /**
   * Mengumpulkan detail diagnostik perangkat untuk ditampilkan di UI
   * @returns {Object} info perangkat
   */
  function getDiagnostics() {
    const ua = navigator.userAgent || 'Unknown';
    const touchPoints = navigator.maxTouchPoints || 0;
    const screenW = window.screen.width;
    const screenH = window.screen.height;
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const isTouch = ('ontouchstart' in window) || touchPoints > 0;
    const hasPointerCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
    const hasHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;

    let deviceType = 'Desktop / PC';
    if (isMobile()) {
      if (/ipad|tablet/i.test(ua) || (touchPoints > 1 && Math.min(screenW, screenH) >= 600)) {
        deviceType = 'Tablet';
      } else {
        deviceType = 'Smartphone / Mobile';
      }
    }

    return {
      isMobile: isMobile(),
      deviceType: deviceType,
      screenResolution: `${screenW} x ${screenH} px (Viewport: ${windowW} x ${windowH})`,
      maxTouchPoints: touchPoints,
      touchCapable: isTouch ? 'Ya (Touchscreen)' : 'Tidak (Mouse/Trackpad)',
      pointerType: hasPointerCoarse ? 'Coarse (Layar Sentuh)' : 'Fine (Kursor Presisi)',
      hoverSupport: hasHover ? 'Mendukung Hover' : 'Tidak Mendukung Hover',
      userAgent: ua,
      platform: navigator.platform || 'Unknown'
    };
  }

  /**
   * Pasang perlindungan pengalihan otomatis (Auto Redirect)
   * Jika dipanggil di halaman game, user mobile otomatis dialihkan ke halaman pemblokir
   * @param {string} blockPageUrl Path ke halaman mobile-blocker (default: 'mobile-blocker/index.html')
   */
  function guardOrRedirect(blockPageUrl = 'mobile-blocker/index.html') {
    if (isMobile()) {
      // Simpan URL asal agar bisa disalin jika diperlukan
      const returnUrl = encodeURIComponent(window.location.href);
      const target = blockPageUrl.includes('?') 
        ? `${blockPageUrl}&from=${returnUrl}` 
        : `${blockPageUrl}?from=${returnUrl}`;
      window.location.replace(target);
    }
  }

  return {
    isMobile: isMobile,
    getDiagnostics: getDiagnostics,
    guardOrRedirect: guardOrRedirect
  };
})();

// Dukungan format modul ES atau Global Scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileDetector;
}
if (typeof window !== 'undefined') {
  window.MobileDetector = MobileDetector;
}
