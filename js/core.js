'use strict';
/* ═══════════════════════════════════════════════════════════
   REDIRECT NFC — Frontend statis (GitHub Pages)
   - Satu halaman (SPA); backend Google Apps Script dipanggil lewat fetch() — lihat js/api.js
   - Navigasi antar menu = render dari memori (0 ms), tanpa panggilan jaringan
   - Data staf dimuat SEKALI (staffBootstrap), aksi tulis memakai optimistic UI + rollback
   ═══════════════════════════════════════════════════════════ */
/* Konteks halaman: kode kartu dibaca dari URL (?id=KODE&aksi=kelola). Data kartu dimuat dari API saat boot. */
const QS = new URLSearchParams(location.search);
const INIT = {
  code: (function () { const c = String(QS.get('id') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); return /^[A-Z0-9]{6,12}$/.test(c) ? c : ''; })(),
  aksi: QS.get('aksi') === 'kelola' ? 'kelola' : '',
  card: null, waAdmin: lsGet('rnfc-wa') || '', appName: (typeof APP_NAME !== 'undefined' ? APP_NAME : 'Patra Redirect'), appLogo: (typeof APP_LOGO_URL !== 'undefined' ? APP_LOGO_URL : 'assets/logo.png'), error: ''
};
function brandLogo(size, extraClass) {
  size = size || 36;
  extraClass = extraClass || '';
  const url = (typeof APP_LOGO_URL !== 'undefined' && APP_LOGO_URL) ? APP_LOGO_URL : 'assets/logo.png';
  const r = Math.round(size * 0.28);
  return '<img class="brand-logo-img ' + extraClass + '" src="' + esc(url) + '" width="' + size + '" height="' + size + '" alt="' + esc(INIT.appName || 'Patra Redirect') + '" style="border-radius:' + r + 'px" onerror="this.onerror=null;this.src=\'assets/logo.svg\';">';
}
const $ = function (id) { return document.getElementById(id); };
const esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

/* ── Ikon SVG (garis 1.75px, tanpa emoji) ── */
const IC = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>', chevL: '<path d="m15 6-6 6 6 6"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  plusSq: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  bars: '<path d="M5 21V10M12 21V4M19 21v-7"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  star: '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8"/><path d="M21 3v5h-5"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4.2a4 4 0 0 1 0 7.6M22 21a7 7 0 0 0-4-6.3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  ext: '<path d="M14 3h7v7M21 3l-9 9"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m5 5 14 14"/>',
  hourglass: '<path d="M6 2h12M6 22h12M7 2v4l5 6-5 6v4M17 2v4l-5 6 5 6v4"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.5 8 9 4.6-.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M7 3v5h8M7 21v-8h10v8"/>',
  backspace: '<path d="M21 5H9l-7 7 7 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="m15 9-4 4m0-4 4 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  wa: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1.2-1.6-2.2-1.2-1 .8a4 4 0 0 1-2-2l.8-1-1.2-2.2z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M7 7h.01M17 7h.01M7 17h.01M14 14h3v3h-3zm3 3h3v3h-3zm-3 3h3v-3"/>'
};
function ico(n, s) {
  s = s || 20;
  return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';
}

/* ── State global ── */
const S = {
  view: null, role: null, token: null, user: null,
  cards: [], overview: null, settings: null, users: [], baseOverride: '', wa: INIT.waAdmin || '', syncAt: 0,
  f: { q: '', status: 'all', sort: 'recent', page: 1 },
  rp: { q: '', status: 'all', tipe: 'all', periode: 'all', page: 1 },
  sr: { gran: 'day', from: '', to: '', tipe: 'all', data: null, loading: false, cache: {} },
  gen: { jumlah: 100, panjang: 8, aman: true, label: '', result: null },
  setTab: 'umum', pending: 0, placeCache: {}, owner: null, ownerCode: INIT.code || '', reg: null, mng: null, pin: null, done: null, rd: null
};
const T = {};          // timer
const CH = {};         // instance chart
const PK = {};         // registry picker lokasi
const VIEWS = {};
const STATUS = { terhubung: ['Terhubung', 'ok'], belum_setup: ['Belum Setup', 'warn'], nonaktif: ['Nonaktif', 'off'] };

/* ── Utilitas ── */
const nf = new Intl.NumberFormat('id-ID');
const fmtN = function (n) { return nf.format(Number(n) || 0); };
function fmtDT(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
}
function relTime(ms) {
  if (!ms) return '—';
  const d = Date.now() - ms;
  if (d < 60000) return 'baru saja';
  if (d < 3600000) return Math.floor(d / 60000) + ' mnt lalu';
  if (d < 86400000) return Math.floor(d / 3600000) + ' jam lalu';
  if (d < 172800000) return 'Kemarin';
  if (d < 2592000000) return Math.floor(d / 86400000) + ' hari lalu';
  return fmtDT(ms);
}
function debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }
function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
function waLink(msg, num) {
  const n = num || S.wa;
  return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(msg || '') : '';
}
function helpMsg() { return 'Halo Admin, saya butuh bantuan untuk kartu NFC' + (INIT.code ? ' dengan kode ' + INIT.code : '') + '.'; }
/* Alamat situs ini (GitHub Pages) — itulah yang ditulis ke kartu NFC. Override opsional dari menu Pengaturan. */
const AUTO_BASE = location.origin + location.pathname.replace(/index\.html$/, '');
function baseUrl() { return String(S.baseOverride || '').trim().replace(/[?#].*$/, '') || AUTO_BASE; }
function manageUrl(code) { return baseUrl() + '?id=' + code + '&aksi=kelola'; }
function tagUrl(code) { return baseUrl() + '?id=' + code; }
function reviewUrl(id) { return 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(id); }
function setBusy(id, on, txt) {
  const b = $(id); if (!b) return;
  if (on) { b.dataset.h = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spin"></span> ' + esc(txt || 'Memproses…'); }
  else { b.disabled = false; if (b.dataset.h) b.innerHTML = b.dataset.h; }
}
async function copyText(t) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; } } catch (e) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch (e) { return false; }
}
function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function badge(status) { const s = STATUS[status] || STATUS.belum_setup; return '<span class="chip ' + s[1] + '"><i class="dot"></i>' + s[0] + '</span>'; }
function codeChip(c, cls) { return '<span class="code ' + (cls || '') + '">' + esc(c) + '</span>'; }

/* ── Toast ── */
function toast(type, title, msg) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'ok' ? '' : type);
  el.innerHTML = '<span class="ti">' + ico(type === 'ok' ? 'circleCheck' : (type === 'err' ? 'alert' : (type === 'warn' ? 'alert' : 'info')), 20) + '</span><div><b>' + esc(title) + '</b>' + (msg ? '<p>' + esc(msg) + '</p>' : '') + '</div><button aria-label="Tutup notifikasi">' + ico('x', 16) + '</button>';
  el.querySelector('button').onclick = function () { el.remove(); };
  $('toasts').appendChild(el);
  setTimeout(function () { if (el.parentNode) el.remove(); }, type === 'err' ? 6000 : 3800);
}

/* ── Modal ── */
function openModal(html) {
  const r = $('modalRoot');
  S.lastFocus = document.activeElement;
  r.innerHTML = '<div class="backdrop" onclick="closeModal()"></div><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mdT">' + html + '</div>';
  r.hidden = false;
  const f = r.querySelector('[data-af]') || r.querySelector('input,button');
  if (f) f.focus();
}
function closeModal() {
  const r = $('modalRoot'); r.hidden = true; r.innerHTML = '';
  if (S.lastFocus && S.lastFocus.focus) { try { S.lastFocus.focus(); } catch (e) {} }
}
function confirmBox(o) {
  S.cb = o.onOk;
  openModal('<h2 class="h2" id="mdT">' + esc(o.title) + '</h2><p class="sub mt8">' + esc(o.text) + '</p>' +
    '<div class="acts2"><button class="btn btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-af onclick="modalOk()">' + esc(o.okText || 'Ya, lanjutkan') + '</button></div>');
}
function modalOk() { const f = S.cb; S.cb = null; closeModal(); if (f) f(); }
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { if (!$('modalRoot').hidden) closeModal(); else if ($('drawerRoot').innerHTML) closeDrawer(); }
});

/* ── Tema ── */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('rnfc-theme', t); } catch (e) {}
}
function toggleTheme() {
  applyTheme(isDark() ? 'light' : 'dark');
  render(true);
}

/* rpc() didefinisikan di js/api.js (fetch ke Google Apps Script) */

/* ═══════════════ PICKER LOKASI GOOGLE (dipakai registrasi, kelola, drawer staf) ═══════════════ */
function makePicker(id, ctxFn, initial, onChange) {
  const st = { q: initial ? initial.name : '', place: initial || null, res: [], loading: false, err: '', searched: false, rid: 0, timer: 0 };
  const api = {
    st: st,
    html: function () {
      return '<div class="field"><label class="lbl" for="' + id + '-q">Cari lokasi Google Maps</label>' +
        '<div class="inp-wrap"><span class="inp-ico">' + ico('search', 18) + '</span>' +
        '<input id="' + id + '-q" class="inp has-ico has-end" type="text" autocomplete="off" placeholder="Ketik nama bisnis atau lokasi" value="' + esc(st.q) + '" oninput="PK[\'' + id + '\'].input(this.value)" aria-describedby="' + id + '-h">' +
        '<button type="button" class="inp-end" id="' + id + '-x" aria-label="Hapus pencarian" onclick="PK[\'' + id + '\'].clear()"' + (st.q ? '' : ' hidden') + '>' + ico('x', 16) + '</button></div>' +
        '<div id="' + id + '-r" class="pk-res" role="listbox" aria-label="Hasil pencarian"></div><div id="' + id + '-s"></div>' +
        '<p id="' + id + '-h" class="hint">Pilih satu hasil agar Google Review tersambung otomatis, tanpa perlu mencari Place ID.</p></div>';
    },
    mount: function (rootId) { PK[id] = api; $(rootId).innerHTML = api.html(); api.drawSel(); },
    input: function (v) {
      st.q = v; const x = $(id + '-x'); if (x) x.hidden = !v;
      if (st.place && v !== st.place.name) { st.place = null; onChange(null); api.drawSel(); }
      clearTimeout(st.timer);
      const q = v.trim();
      if (q.length < 2) { st.res = []; st.err = ''; st.searched = false; st.loading = false; st.rid++; api.drawRes(); return; }
      st.timer = setTimeout(function () { api.search(q); }, 300);
    },
    search: function (q) {
      const ctx = ctxFn(); const key = JSON.stringify(ctx) + '|' + q.toLowerCase();
      if (S.placeCache[key]) { st.res = S.placeCache[key]; st.err = ''; st.searched = true; st.loading = false; api.drawRes(); return; }
      st.loading = true; st.err = ''; api.drawRes();
      const rid = ++st.rid;
      rpc('searchPlaces', [ctx, q]).then(function (r) {
        if (rid !== st.rid) return;
        st.loading = false; st.searched = true;
        if (!r.success) { st.err = r.message; st.res = []; }
        else { st.res = r.data || []; S.placeCache[key] = st.res; st.err = ''; }
        api.drawRes();
      });
    },
    drawRes: function () {
      const el = $(id + '-r'); if (!el) return;
      if (st.loading) { el.innerHTML = '<div class="pk-row"><div class="skel" style="width:100%;height:36px"></div></div><div class="pk-row"><div class="skel" style="width:100%;height:36px"></div></div>'; return; }
      if (st.err) { el.innerHTML = '<p class="pk-msg err">' + esc(st.err) + '</p>'; return; }
      if (!st.searched || st.place) { el.innerHTML = ''; return; }
      if (!st.res.length) { el.innerHTML = '<p class="pk-msg">Tidak ada hasil. Coba tambah nama kota atau jalan.</p>'; return; }
      el.innerHTML = st.res.map(function (p, i) {
        return '<button type="button" role="option" class="pk-row" onclick="PK[\'' + id + '\'].pick(' + i + ')"><span class="pk-ico">' + ico('store', 18) + '</span>' +
          '<span class="pk-t"><b>' + esc(p.name) + '</b><small>' + esc(p.address) + '</small></span><span class="pk-act">Pilih</span></button>';
      }).join('');
    },
    drawSel: function () {
      const el = $(id + '-s'); if (!el) return;
      el.innerHTML = st.place ? '<div class="sel-chip">' + ico('circleCheck', 22) + '<div><b>' + esc(st.place.name) + '</b><small>' + esc(st.place.address || 'Lokasi terverifikasi Google') + '</small></div>' +
        '<button type="button" class="link-btn" onclick="PK[\'' + id + '\'].clear()">Ubah</button></div>' : '';
    },
    pick: function (i) {
      st.place = st.res[i]; st.q = st.place.name; st.res = []; st.searched = false;
      const inp = $(id + '-q'); if (inp) inp.value = st.q;
      const x = $(id + '-x'); if (x) x.hidden = false;
      api.drawRes(); api.drawSel(); onChange(st.place);
    },
    clear: function () {
      st.q = ''; st.place = null; st.res = []; st.err = ''; st.searched = false; st.rid++; st.loading = false;
      const inp = $(id + '-q'); if (inp) { inp.value = ''; inp.focus(); }
      const x = $(id + '-x'); if (x) x.hidden = true;
      api.drawRes(); api.drawSel(); onChange(null);
    }
  };
  PK[id] = api;
  return api;
}

/* ═══════════════ NAVIGASI & RENDER ═══════════════ */
const STAFF_VIEWS = ['cards', 'generate', 'overview', 'scanreport', 'cardreport', 'settings'];
const MASTER_ONLY = ['overview', 'scanreport', 'cardreport', 'settings'];
function rootOf(v) { return v === 'login' ? 'loginRoot' : (STAFF_VIEWS.indexOf(v) >= 0 ? 'staffRoot' : 'publicRoot'); }

function clearTimers() { Object.keys(T).forEach(function (k) { clearTimeout(T[k]); clearInterval(T[k]); delete T[k]; }); }
function destroyCharts() { Object.keys(CH).forEach(function (k) { try { CH[k].destroy(); } catch (e) {} delete CH[k]; }); }

function go(view) {
  if (MASTER_ONLY.indexOf(view) >= 0 && S.role !== 'master') view = 'cards';
  if (STAFF_VIEWS.indexOf(view) >= 0 && !S.token) view = 'login';
  const was = S.view;
  S.view = view;
  render(was !== view && rootOf(was) !== rootOf(view));
  try { window.scrollTo(0, 0); } catch (e) {}
}
function render(full) {
  const root = rootOf(S.view);
  ['publicRoot', 'loginRoot', 'staffRoot'].forEach(function (id) {
    $(id).hidden = id !== root;
    if (id !== root && id !== 'staffRoot') $(id).innerHTML = '';   /* hindari ID ganda dari ruang yang tersembunyi */
  });
  if (root !== 'staffRoot') { clearTimers(); destroyCharts(); closeDrawer(); }
  if (root === 'staffRoot') renderStaff(full);
  else VIEWS[S.view]();
}
function helpPill() {
  return S.wa
    ? '<a class="help-pill" href="' + esc(waLink(helpMsg())) + '" target="_blank" rel="noopener">' + ico('msg', 18) + '<span>Butuh bantuan? <b>Hubungi Admin WhatsApp</b></span></a>'
    : '<div class="help-pill off">' + ico('msg', 18) + '<span>Kontak admin belum diatur</span></div>';
}
function pubPage(inner, o) {
  o = o || {};
  $('publicRoot').innerHTML = '<div class="pub"><header class="pub-top"><div class="brand">' + brandLogo(32) + '<span>' + esc(INIT.appName || 'Patra Redirect') + '</span></div>' +
    '<button class="btn-icon" onclick="toggleTheme()" aria-label="Ganti tema terang atau gelap">' + ico(isDark() ? 'sun' : 'moon', 18) + '</button></header>' +
    '<main class="pub-main">' + inner + '</main>' + (o.nohelp ? '' : helpPill()) + '</div>';
}
