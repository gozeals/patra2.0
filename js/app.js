'use strict';
/* ============================================================
   BOOT — menentukan halaman pertama dari URL (?id=KODE&aksi=kelola)
   ============================================================ */
function hideBoot() { const b = $('boot'); if (b) { b.classList.add('out'); setTimeout(function () { if (b.parentNode) b.remove(); }, 300); } }

/* Perbarui nomor WhatsApp admin tanpa merender ulang form yang sedang diisi */
function refreshHelp() { const el = document.querySelector('.help-pill'); if (el) el.outerHTML = helpPill(); }
function setWa(wa) { wa = wa || ''; if (wa !== S.wa) { S.wa = wa; lsSet('rnfc-wa', wa); refreshHelp(); } }

async function loadConfig() {
  const r = await apiGet({ action: 'config' });
  if (r && r.success && r.data) setWa(r.data.wa);
}
/* Batas tunggu pemulihan sesi saat boot. Lewat dari ini portal ditampilkan agar tidak terjebak di layar loading. */
const RESTORE_WAIT_MS = 15000;

/* Mengembalikan true HANYA bila backend memverifikasi token dan dashboard sudah ditampilkan.
   Selain itu → false (portal yang tampil):
   - tanpa token
   - AUTH (backend menyatakan sesi tidak valid) → token DIHAPUS
   - NET / BADRESP / SECURITY_UNVERIFIED / gangguan lain → token DIPERTAHANKAN agar bisa dicoba lagi dengan refresh
   - lewat RESTORE_WAIT_MS → permintaan DIBATALKAN: jawabannya nanti (valid atau tidak) diabaikan sepenuhnya,
     tidak mengubah tampilan, state, maupun token. */
async function restoreSession() {
  let t = null; try { t = sessionStorage.getItem('rnfc-tok'); } catch (e) {}
  if (!t) return false;
  let cancelled = false, timer;
  /* apiPost langsung (bukan rpc): jawaban AUTH dari pemeriksaan ini tidak boleh memicu forceLogout() global,
     yang bisa mengeluarkan sesi BARU bila pengguna sudah login manual setelah timeout. */
  const check = apiPost('bootstrap', { token: t }).then(function (r) {
    if (cancelled) return false;                                  /* jawaban terlambat: tidak punya hak mengubah apa pun */
    if (!r || !r.success) {
      if (r && r.code === 'AUTH') { try { sessionStorage.removeItem('rnfc-tok'); } catch (e) {} return false; }
      toast('warn', 'Sesi staf belum dapat diverifikasi', ((r && r.message) || 'Terjadi gangguan.') + ' Muat ulang halaman setelah koneksi pulih untuk masuk kembali.');
      return false;
    }
    if (S.view && S.view !== 'portal' && S.view !== 'login') return false;   /* pengguna sudah pindah halaman */
    S.token = t; applyBoot(r.data); startAuto();
    go(S.role === 'master' ? 'overview' : 'cards');
    return true;
  }).catch(function () { if (!cancelled) S.token = null; return false; });   /* galat tak terduga → tetap ke portal */
  /* Penanda pembatalan dipasang DI DALAM callback timer, sebelum hasil race diteruskan, sehingga
     jawaban yang datang setelahnya pasti melihat cancelled = true (tidak ada celah race). */
  const timeout = new Promise(function (res) { timer = setTimeout(function () { cancelled = true; res('timeout'); }, RESTORE_WAIT_MS); });
  const res = await Promise.race([check, timeout]);
  clearTimeout(timer);
  if (res === 'timeout') {
    toast('warn', 'Server lambat merespons', 'Sesi staf belum dapat diverifikasi. Muat ulang halaman setelah koneksi membaik, atau masuk kembali.');
    return false;
  }
  return res === true;
}

(async function boot() {
  if (!gasReady()) { go('setup'); hideBoot(); return; }

  if (!INIT.code) {                                         /* tanpa kode kartu → portal kelola */
    loadConfig();
    /* Layar loading tetap tampil selama sesi staf diperiksa; portal hanya muncul bila tidak ada sesi yang valid */
    const restored = await restoreSession();
    if (!restored && !S.token) go('portal');
    hideBoot();
    return;
  }

  /* Jika mode kelola kartu, tampilkan antarmuka resolving */
  if (INIT.aksi === 'kelola') {
    go('resolving'); hideBoot();
  }

  /* Ambil data kartu dari promise prefetch di <head> atau panggil API */
  let r = window.__cardP ? await window.__cardP : null;
  if (!r || r.success === undefined) r = await apiGet({ action: 'card', id: INIT.code, log: INIT.aksi ? 0 : 1 });
  if (!r || !r.success) {
    INIT.error = (r && r.message) || 'Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba pindai ulang.';
    go('info'); hideBoot(); return;
  }
  INIT.card = r.data.card;
  setWa(r.data.waAdmin);
  const c = INIT.card;

  /* INSTANT REDIRECT jika kartu terhubung dan bukan mode kelola */
  if (c && c.status === 'terhubung') {
    if (INIT.aksi === 'kelola') {
      S.pin = { val: '', err: '', locked: false };
      go('pin'); hideBoot(); return;
    }
    if (/^https?:\/\//i.test(c.url || '')) {
      window.location.replace(c.url);
      /* Cadangan bila navigasi browser tertahan (mis. data saver) */
      setTimeout(function () { go('redirect'); hideBoot(); }, 800);
      return;
    }
  }

  let v = 'info';
  if (c && c.status === 'belum_setup') v = 'register';
  go(v);
  hideBoot();
})();
window.addEventListener('offline', function () { toast('warn', 'Anda sedang offline', 'Perubahan akan gagal sampai koneksi kembali.'); });
