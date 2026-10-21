
/* ═══════════════ LOGIN & SESI STAF ═══════════════ */
VIEWS.login = function () {
  $('loginRoot').innerHTML =
    '<div class="login"><div class="login-l"><div class="brand" style="margin-bottom:28px">' + brandLogo(36) + '<span>' + esc(INIT.appName || 'Patra Redirect') + '</span></div>' +
    '<h1 class="h1">Login Petugas</h1><p class="sub mt8">Masuk dengan akun Master atau Admin Anda untuk mengelola kartu dan analitik pengalihan.</p>' +
    '<form class="mt16" onsubmit="event.preventDefault();loginSubmit()" novalidate><div id="loginErr" aria-live="polite"></div>' +
    '<div class="field"><label class="lbl" for="lgUser">Username</label><div class="inp-wrap"><span class="inp-ico">' + ico('user', 18) + '</span>' +
    '<input id="lgUser" class="inp has-ico" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="mis. rian.master"></div></div>' +
    '<div class="field"><label class="lbl" for="lgPass">Kata sandi</label><div class="inp-wrap"><span class="inp-ico">' + ico('lock', 18) + '</span>' +
    '<input id="lgPass" class="inp has-ico has-end" type="password" autocomplete="current-password" placeholder="Kata sandi">' +
    '<button type="button" class="inp-end" aria-label="Tampilkan" onclick="togglePw(\'lgPass\',this)">' + ico('eye', 18) + '</button></div></div>' +
    '<button id="lgBtn" type="submit" class="btn btn-primary btn-block mt24">Masuk ke Dashboard ' + ico('arrowR', 18) + '</button>' +
    '<div class="note mt16">' + ico('shield', 18) + '<span>Sesi berakhir otomatis setelah <b>60 menit</b> tidak aktif.</span></div>' +
    '<p class="small muted center mt16">Lupa kata sandi? Hubungi Master.</p>' +
    '<div class="center"><button type="button" class="link-btn" onclick="go(\'portal\')">' + ico('arrowL', 16) + ' Kembali ke portal kartu</button></div></form></div>' +
    '<aside class="hero login-r"><span class="chip" style="background:rgba(255,255,255,.16);color:#fff;align-self:flex-start">' + ico('shield', 14) + ' Master & Admin Workspace</span>' +
    '<h2 style="font:800 34px/42px var(--f-head);letter-spacing:-.02em">Kelola ratusan kartu NFC dalam satu platform terpadu</h2>' +
    '<div class="feat"><span class="tile">' + ico('zap', 20) + '</span><div><b>Pengalihan instan</b><span>Pengunjung langsung diarahkan ke Google Review atau website bisnis, tanpa konfigurasi manual per kartu.</span></div></div>' +
    '<div class="feat"><span class="tile">' + ico('shield', 20) + '</span><div><b>Hak akses berlapis</b><span>Master untuk laporan dan pengaturan, Admin untuk operasional kartu harian.</span></div></div>' +
    '<div class="feat"><span class="tile">' + ico('file', 20) + '</span><div><b>Data di Google Sheets</b><span>Database hemat biaya tanpa server tambahan, dengan laporan PDF siap unduh.</span></div></div></aside></div>';
  const u = $('lgUser'); if (u) u.focus();
};
async function loginSubmit() {
  const u = $('lgUser').value.trim(), p = $('lgPass').value;
  const box = $('loginErr');
  if (!u || !p) { box.innerHTML = '<div class="note bad" role="alert">' + ico('alert', 18) + '<span>Isi username dan kata sandi.</span></div>'; return; }
  setBusy('lgBtn', true, 'Masuk…');
  const r = await rpc('doLogin', [u, p]);
  setBusy('lgBtn', false);
  if (!r.success) { box.innerHTML = '<div class="note bad" role="alert">' + ico('alert', 18) + '<span><b>Autentikasi gagal.</b> ' + esc(r.message) + '</span></div>'; $('lgPass').value = ''; return; }
  S.token = r.data.token;
  try { sessionStorage.setItem('rnfc-tok', S.token); } catch (e) {}   /* bertahan selama tab terbuka */
  applyBoot(r.data.boot);
  startAuto();
  go(S.role === 'master' ? 'overview' : 'cards');
  toast('ok', 'Selamat datang, ' + S.user.nama, 'Anda masuk sebagai ' + (S.role === 'master' ? 'Master' : 'Admin') + '.');
}
function applyBoot(b) {
  S.user = b.user; S.role = b.user.role; S.cards = b.cards || []; S.baseOverride = b.baseUrl || ''; S.wa = b.waAdmin || '';
  S.overview = b.overview || null; S.settings = b.settings || null; S.users = b.users || []; S.syncAt = Date.now();
}
function resetStaffState() {
  S.token = null; S.role = null; S.user = null; S.cards = []; S.overview = null; S.settings = null; S.users = [];
  S.sr.data = null; S.sr.cache = {}; S.gen.result = null; S.f = { q: '', status: 'all', sort: 'recent', page: 1 };
  clearInterval(T.auto); delete T.auto; $('staffRoot').innerHTML = ''; closeDrawer();
  try { sessionStorage.removeItem('rnfc-tok'); } catch (e) {}
}
function forceLogout(msg) { resetStaffState(); go('login'); toast('warn', 'Sesi berakhir', msg); }
function doLogoutUi() {
  const t = S.token; resetStaffState();
  if (t) rpc('doLogout', [t]);
  go('login'); toast('ok', 'Anda telah keluar', 'Sampai jumpa lagi.');
}
function startAuto() {
  clearInterval(T.auto);
  T.auto = setInterval(function () { refreshStaff(false); }, 90000);
}
async function refreshStaff(manual) {
  if (!S.token) return;
  if (!manual && (S.pending > 0 || document.visibilityState === 'hidden')) return;
  const b = $('syncBtn'); if (manual && b) b.disabled = true;
  const r = await rpc('staffBootstrap', [S.token]);
  if (b) b.disabled = false;
  if (!r.success) { if (manual) toast('err', 'Sinkron gagal', r.message); return; }
  if (S.pending > 0 && !manual) return;
  applyBoot(r.data);
  const busy = $('drawerRoot').innerHTML || !$('modalRoot').hidden || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
  if (!busy && STAFF_VIEWS.indexOf(S.view) >= 0 && S.view !== 'generate' && S.view !== 'settings') renderStaff(false); else drawSync();
  if (manual) toast('ok', 'Data tersinkron', 'Data terbaru dari Google Sheets sudah dimuat.');
}
function drawSync() { const e = $('syncTxt'); if (e) e.textContent = 'Tersinkron ' + new Date(S.syncAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'); }

/* ═══════════════ SHELL STAF ═══════════════ */
const STAFF = {};
function navDefs() {
  const main = [{ id: 'cards', ic: 'card', l: 'Daftar Kartu' }, { id: 'generate', ic: 'plusSq', l: 'Buat Kode Masal' }];
  const master = S.role === 'master' ? [{ id: 'overview', ic: 'grid', l: 'Ringkasan' }, { id: 'scanreport', ic: 'bars', l: 'Laporan Scan' }, { id: 'cardreport', ic: 'file', l: 'Laporan Kartu' }, { id: 'settings', ic: 'sliders', l: 'Pengaturan' }] : [];
  return { main: main, master: master };
}
function navGroup(label, items) {
  return '<div class="nav-g">' + label + '</div>' + items.map(function (i) {
    return '<button class="nav-i" data-v="' + i.id + '" onclick="navTo(\'' + i.id + '\')">' + ico(i.ic, 20) + '<span>' + i.l + '</span></button>';
  }).join('');
}
function buildShell() {
  const nav = navDefs(), init = (S.user.nama || 'U').trim().charAt(0).toUpperCase();
  $('staffRoot').innerHTML =
    '<div class="shell" id="stShell"><aside class="side" id="side" aria-label="Navigasi utama">' +
    '<div class="side-brand">' + brandLogo(36) + '<div><b>' + esc(INIT.appName || 'Patra Redirect') + '</b><span>' + (S.role === 'master' ? 'Panel Master' : 'Panel Admin') + '</span></div></div>' +
    navGroup('Menu Utama', nav.main) + (nav.master.length ? navGroup('Master Panel', nav.master) : '') +
    '<div class="side-foot"><button class="nav-i" onclick="doLogoutUi()">' + ico('logout', 20) + '<span>Keluar</span></button></div></aside>' +
    '<div><header class="top"><button class="btn-icon bd burger" onclick="toggleSide(true)" aria-label="Buka menu">' + ico('menu', 20) + '</button>' +
    '<div class="search inp-wrap"><span class="inp-ico">' + ico('search', 18) + '</span><input id="gSearch" class="inp has-ico" type="search" placeholder="Cari kode kartu, WhatsApp, tujuan…" aria-label="Cari kartu" value="' + esc(S.f.q) + '" oninput="globalSearch(this.value)"></div>' +
    '<div class="top-r"><span class="chip mint sync-t"><i class="dot"></i><span id="syncTxt">Tersinkron</span></span>' +
    '<button id="syncBtn" class="btn-icon sm bd" onclick="refreshStaff(true)" aria-label="Sinkronkan data sekarang">' + ico('refresh', 18) + '</button>' +
    '<button class="btn-icon sm bd" onclick="toggleTheme()" aria-label="Ganti tema terang atau gelap">' + ico(isDark() ? 'sun' : 'moon', 18) + '</button>' +
    '<button class="user-chip" onclick="openProfile()" aria-label="Profil dan kata sandi"><span class="avatar">' + esc(init) + '</span><span class="who"><b>' + esc(S.user.nama) + '</b><br><small>' + esc(S.user.username) + '</small></span>' +
    '<span class="chip ' + (S.role === 'master' ? 'master' : 'mint') + '">' + (S.role === 'master' ? 'Master' : 'Admin') + '</span></button></div></header>' +
    '<main class="main" id="stMain" tabindex="-1"></main></div></div><div id="scrim" class="scrim" onclick="toggleSide(false)"></div>';
}
function toggleSide(on) { const s = $('side'), c = $('scrim'); if (!s) return; s.classList.toggle('open', on); c.classList.toggle('on', on); }
function navTo(v) { toggleSide(false); go(v); }
function markNav() {
  document.querySelectorAll('.nav-i[data-v]').forEach(function (b) {
    if (b.dataset.v === S.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}
function renderStaff(full) {
  if (full || !$('stShell')) buildShell();
  markNav(); drawSync(); destroyCharts();
  const m = $('stMain'); STAFF[S.view](m);
}
function globalSearch(v) {
  S.f.q = v; S.f.page = 1;
  if (S.view !== 'cards') { go('cards'); return; }
  const i = $('cSearch'); if (i && i.value !== v) i.value = v;
  renderCardsTable();
}
function openProfile() {
  openModal('<h2 class="h2" id="mdT">Profil Saya</h2><div class="row mt12"><span class="avatar">' + esc((S.user.nama || 'U').charAt(0).toUpperCase()) + '</span><div><b>' + esc(S.user.nama) + '</b><div class="small muted">' + esc(S.user.username) + ' · ' + (S.role === 'master' ? 'Master' : 'Admin') + '</div></div></div>' +
    '<h3 class="h3 mt24">Ganti kata sandi</h3>' +
    '<div class="field"><label class="lbl" for="pwOld">Kata sandi lama</label><input id="pwOld" class="inp" type="password" autocomplete="current-password"></div>' +
    '<div class="field"><label class="lbl" for="pwNew">Kata sandi baru (min. 8 karakter)</label><input id="pwNew" class="inp" type="password" autocomplete="new-password"></div>' +
    '<div class="acts2"><button class="btn btn-secondary" onclick="closeModal()">Tutup</button><button id="pwBtn" class="btn btn-primary" onclick="changePw()">Simpan kata sandi</button></div>');
}
async function changePw() {
  const o = $('pwOld').value, n = $('pwNew').value;
  if (n.length < 8) { toast('warn', 'Kata sandi terlalu pendek', 'Minimal 8 karakter.'); return; }
  setBusy('pwBtn', true, 'Menyimpan…');
  const r = await rpc('changeOwnPassword', [S.token, o, n]);
  setBusy('pwBtn', false);
  if (!r.success) { toast('err', 'Gagal mengganti kata sandi', r.message); return; }
  closeModal(); toast('ok', 'Kata sandi diganti', 'Gunakan kata sandi baru saat login berikutnya.');
}

/* ═══════════════ DAFTAR KARTU (W-09) ═══════════════ */
function cardCounts() {
  const c = { all: S.cards.length, terhubung: 0, belum_setup: 0, nonaktif: 0 };
  S.cards.forEach(function (x) { c[x.status] = (c[x.status] || 0) + 1; });
  return c;
}
function statCard(k, v, sub, ic, o) {
  o = o || {};
  return '<div class="card stat ' + (o.hero ? 'hero' : '') + '"><div class="k"><span>' + k + '</span><span class="ic">' + ico(ic, 18) + '</span></div><div class="v">' + v + '</div>' + (sub || '') + (o.bar !== undefined ? '<div class="bar"><i style="width:' + o.bar + '%"></i></div>' : '') + '</div>';
}
function drawCardStats() {
  const el = $('cardStats'); if (!el) return;
  const n = cardCounts(), p = function (x) { return n.all ? Math.round(x / n.all * 100) : 0; };
  el.innerHTML = statCard('Total Kartu', fmtN(n.all), '<div class="small" style="opacity:.85">Seluruh kartu dalam sistem</div>', 'radio', { hero: true }) +
    statCard('Terhubung', fmtN(n.terhubung), '<div><span class="chip ok"><i class="dot"></i>' + p(n.terhubung) + '% aktif</span></div><div class="small muted">Mengarahkan ke tujuan live</div>', 'link') +
    statCard('Belum Setup', fmtN(n.belum_setup), '<div><span class="chip warn"><i class="dot"></i>' + p(n.belum_setup) + '%</span></div><div class="small muted">Menunggu registrasi pemilik</div>', 'hourglass') +
    statCard('Nonaktif', fmtN(n.nonaktif), '<div><span class="chip off"><i class="dot"></i>' + p(n.nonaktif) + '%</span></div><div class="small muted">Ditangguhkan / dinonaktifkan</div>', 'ban');
}
STAFF.cards = function (m) {
  const n = cardCounts();
  const tabs = [['all', 'Semua'], ['terhubung', 'Terhubung'], ['belum_setup', 'Belum Setup'], ['nonaktif', 'Nonaktif']].map(function (t) {
    return '<button class="tab" role="tab" data-s="' + t[0] + '" aria-selected="' + (S.f.status === t[0]) + '" onclick="setCardFilter(\'' + t[0] + '\')">' + t[1] + ' (' + fmtN(n[t[0]]) + ')</button>';
  }).join('');
  m.innerHTML =
    '<div class="page-h"><div><div class="eyebrow">Manajemen tag operasional</div><h1 class="h1">Daftar Kartu NFC</h1><p class="sub">Kelola semua kartu, pantau status redirect, dan salin tautan kelola untuk pemilik.</p></div>' +
    '<button class="btn btn-primary" onclick="navTo(\'generate\')">' + ico('plus', 18) + ' Buat Kode Baru</button></div>' +
    '<div class="stats" id="cardStats"></div>' +
    '<div class="card toolbar"><div class="inp-wrap"><span class="inp-ico">' + ico('search', 18) + '</span><input id="cSearch" class="inp has-ico" type="search" placeholder="Cari kode kartu, WhatsApp, nama tujuan…" aria-label="Cari kartu" value="' + esc(S.f.q) + '" oninput="cardSearch(this.value)"></div>' +
    '<div class="tabs" role="tablist" aria-label="Filter status">' + tabs + '</div>' +
    '<select class="inp" style="width:auto" aria-label="Urutkan" onchange="S.f.sort=this.value;S.f.page=1;renderCardsTable()"><option value="recent"' + (S.f.sort === 'recent' ? ' selected' : '') + '>Terbaru</option><option value="scans"' + (S.f.sort === 'scans' ? ' selected' : '') + '>Scan terbanyak</option><option value="code"' + (S.f.sort === 'code' ? ' selected' : '') + '>Kode A-Z</option></select></div>' +
    '<div class="card" id="cardsBox"></div>';
  drawCardStats(); renderCardsTable();
};
const cardSearch = debounce(function (v) { S.f.q = v; S.f.page = 1; const g = $('gSearch'); if (g && g.value !== v) g.value = v; renderCardsTable(); }, 160);
function setCardFilter(s) {
  S.f.status = s; S.f.page = 1;
  document.querySelectorAll('.tab[data-s]').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.s === s); });
  renderCardsTable();
}
function filteredCards() {
  const q = S.f.q.trim().toLowerCase(), qd = q.replace(/\D/g, '');
  let a = S.cards.filter(function (c) {
    if (S.f.status !== 'all' && c.status !== S.f.status) return false;
    if (!q) return true;
    return c.code.toLowerCase().indexOf(q) >= 0 || c.nama.toLowerCase().indexOf(q) >= 0 || c.url.toLowerCase().indexOf(q) >= 0 || (qd.length >= 3 && c.wa.indexOf(qd) >= 0);
  });
  if (S.f.sort === 'scans') a.sort(function (x, y) { return y.scans - x.scans; });
  else if (S.f.sort === 'code') a.sort(function (x, y) { return x.code < y.code ? -1 : 1; });
  else a.sort(function (x, y) { return (y.regTs || y.createdTs) - (x.regTs || x.createdTs); });
  return a;
}
function pagerHtml(total, page, per, fn) {
  const pages = Math.max(1, Math.ceil(total / per)); page = Math.min(page, pages);
  const set = {}; [1, pages, page - 1, page, page + 1].forEach(function (p) { if (p >= 1 && p <= pages) set[p] = 1; });
  const list = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  let btns = '', prev = 0;
  list.forEach(function (p) {
    if (prev && p - prev > 1) btns += '<span class="muted" aria-hidden="true">…</span>';
    btns += '<button class="pg-b" ' + (p === page ? 'aria-current="page"' : '') + ' onclick="' + fn + '(' + p + ')" aria-label="Halaman ' + p + '">' + p + '</button>'; prev = p;
  });
  const from = total ? (page - 1) * per + 1 : 0, to = Math.min(total, page * per);
  return '<div class="pager"><span class="small muted">Menampilkan <b>' + from + '-' + to + '</b> dari <b>' + fmtN(total) + '</b> kartu</span>' +
    '<nav class="pg" aria-label="Halaman"><button class="pg-b" ' + (page <= 1 ? 'disabled' : '') + ' onclick="' + fn + '(' + (page - 1) + ')" aria-label="Sebelumnya">' + ico('chevL', 18) + '</button>' + btns +
    '<button class="pg-b" ' + (page >= pages ? 'disabled' : '') + ' onclick="' + fn + '(' + (page + 1) + ')" aria-label="Berikutnya">' + ico('chevR', 18) + '</button></nav></div>';
}
function cardsPage(p) { S.f.page = p; renderCardsTable(); }
function fmtWa(n) {
  n = String(n || ''); if (!n) return '';
  if (n.indexOf('62') !== 0) return '+' + n;
  const r = n.slice(2);
  return '+62 ' + r.slice(0, 3) + '-' + r.slice(3, 7) + (r.length > 7 ? '-' + r.slice(7) : '');
}
function dstCell(c) {
  if (c.status === 'belum_setup') return '<i class="muted">Belum ada tujuan terdaftar</i>';
  return '<div><b class="trunc">' + esc(c.nama) + '</b><small class="trunc">' + esc(c.url) + '</small></div>';
}
function typeCell(c) { return c.tipe === 'google_review' ? '<span class="row" style="gap:6px">' + ico('star', 16) + 'Google Review</span>' : (c.tipe === 'link_lain' ? '<span class="row" style="gap:6px">' + ico('globe', 16) + 'Link Lain</span>' : '<span class="muted">—</span>'); }
function waCell(c) { return c.wa ? '<a class="row" style="gap:6px" href="https://wa.me/' + esc(c.wa) + '" target="_blank" rel="noopener" aria-label="Chat WhatsApp pemilik ' + esc(c.code) + '">' + esc(fmtWa(c.wa)) + ' ' + ico('wa', 16) + '</a>' : '<span class="muted">—</span>'; }
function renderCardsTable() {
  const box = $('cardsBox'); if (!box) return;
  const list = filteredCards(), per = 10, pages = Math.max(1, Math.ceil(list.length / per));
  S.f.page = Math.min(S.f.page, pages);
  const rows = list.slice((S.f.page - 1) * per, S.f.page * per);
  if (!rows.length) {
    box.innerHTML = '<div class="empty"><span class="tile">' + ico('card', 28) + '</span><b>' + (S.cards.length ? 'Tidak ada kartu yang cocok' : 'Belum ada kartu') + '</b><span>' + (S.cards.length ? 'Ubah kata kunci atau filter status.' : 'Buat kode kartu pertama Anda lewat menu Buat Kode Masal.') + '</span>' +
      (S.cards.length ? '' : '<button class="btn btn-primary mt8" onclick="navTo(\'generate\')">Buat Kode Masal</button>') + '</div>'; return;
  }
  box.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kode kartu</th><th>Status</th><th>Tipe tujuan</th><th>Tujuan redirect</th><th>WhatsApp</th><th class="num">Scan</th><th>Scan terakhir</th><th><span class="sr">Aksi</span></th></tr></thead><tbody>' +
    rows.map(function (c) {
      const dim = c.status === 'nonaktif', un = c.status === 'belum_setup';
      return '<tr class="' + (dim ? 'dim' : '') + '"><td data-label="Kode">' + codeChip(c.code) + '</td><td data-label="Status">' + badge(c.status) + '</td><td data-label="Tipe">' + typeCell(c) + '</td>' +
        '<td class="dst" data-label="Tujuan">' + dstCell(c) + '</td>' +
        '<td data-label="WhatsApp">' + waCell(c) + '</td><td class="num" data-label="Scan"><b>' + fmtN(c.scans) + '</b></td><td data-label="Terakhir" class="muted">' + relTime(c.lastTs) + '</td>' +
        '<td class="nolabel"><div class="acts">' +
        '<button class="btn-icon sm" title="Detail & ubah" aria-label="Detail dan ubah kartu ' + esc(c.code) + '" onclick="openDrawer(\'' + c.code + '\')">' + ico('pencil', 18) + '</button>' +
        '<button class="btn-icon sm" title="' + (dim ? 'Aktifkan' : 'Nonaktifkan') + '" aria-label="' + (dim ? 'Aktifkan' : 'Nonaktifkan') + ' kartu ' + esc(c.code) + '" onclick="quickToggle(\'' + c.code + '\')">' + ico('power', 18) + '</button>' +
        '<button class="btn-icon sm" title="Reset kartu" aria-label="Reset kartu ' + esc(c.code) + '" ' + (un ? 'disabled style="opacity:.35"' : '') + ' onclick="quickReset(\'' + c.code + '\')">' + ico('reset', 18) + '</button>' +
        '<button class="btn-icon sm" title="Salin tautan kelola" aria-label="Salin tautan kelola kartu ' + esc(c.code) + '" ' + (un ? 'disabled style="opacity:.35"' : '') + ' onclick="copyLink(\'' + c.code + '\')">' + ico('link', 18) + '</button>' +
        '<button class="btn-icon sm text-danger" title="Hapus kartu" aria-label="Hapus kartu ' + esc(c.code) + '" onclick="quickDelete(\'' + c.code + '\')">' + ico('trash', 18) + '</button>' +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>' + pagerHtml(list.length, S.f.page, per, 'cardsPage');
}
async function copyLink(code) {
  const ok = await copyText(manageUrl(code));
  toast(ok ? 'ok' : 'warn', ok ? 'Tautan tersalin' : 'Gagal menyalin', ok ? 'Link kelola ' + code + ' siap dibagikan lewat WhatsApp.' : 'Salin manual dari kolom alamat.');
}
function refreshCardViews() {
  if (S.view === 'cards') { drawCardStats(); renderCardsTable(); const tb = document.querySelectorAll('.tab[data-s]'); const n = cardCounts(); tb.forEach(function (t) { t.firstChild.textContent = ({ all: 'Semua', terhubung: 'Terhubung', belum_setup: 'Belum Setup', nonaktif: 'Nonaktif' })[t.dataset.s] + ' (' + fmtN(n[t.dataset.s]) + ')'; }); }
  else if (S.view !== 'generate' && S.view !== 'settings' && STAFF_VIEWS.indexOf(S.view) >= 0) renderStaff(false);
}
/* Optimistic UI: ubah lokal dulu → kirim ke server → rollback bila gagal */
async function mutateCard(code, change, call, okTitle, okMsg) {
  const i = S.cards.findIndex(function (x) { return x.code === code; }); if (i < 0) return false;
  const prev = S.cards[i];
  S.cards[i] = Object.assign({}, prev, change); refreshCardViews();
  S.pending++; const r = await call(); S.pending--;
  const j = S.cards.findIndex(function (x) { return x.code === code; });
  if (!r.success) { if (j >= 0) S.cards[j] = prev; refreshCardViews(); if (r.code !== 'AUTH') toast('err', 'Perubahan dibatalkan', r.message); return false; }
  if (j >= 0 && r.data && r.data.code) S.cards[j] = Object.assign({}, S.cards[j], r.data);
  refreshCardViews(); if (okTitle) toast('ok', okTitle, okMsg); return true;
}
function quickToggle(code) {
  const c = S.cards.find(function (x) { return x.code === code; }); if (!c) return;
  const off = c.status !== 'nonaktif';
  const status = off ? 'nonaktif' : (c.url ? 'terhubung' : 'belum_setup');
  mutateCard(code, { status: status }, function () { return rpc('updateCardStaff', [S.token, code, { aktif: !off }]); }, off ? 'Kartu dinonaktifkan' : 'Kartu diaktifkan', code);
}
function quickReset(code) {
  confirmBox({ title: 'Reset kartu ' + code + '?', text: 'Tujuan dan PIN pemilik akan dihapus, dan jumlah scan direset ke 0. Kartu kembali berstatus Belum Setup.', okText: 'Ya, reset kartu', danger: true, onOk: function () { resetNow(code); } });
}
function resetNow(code) {
  mutateCard(code, { status: 'belum_setup', tipe: '', nama: '', placeId: '', url: '', wa: '', regTs: 0, scans: 0, lastTs: 0 }, function () { return rpc('resetCardStaff', [S.token, code]); }, 'Kartu direset', code);
}
function quickDelete(code) {
  confirmBox({
    title: 'Hapus kartu ' + code + '?',
    text: 'Kartu ini akan dihapus secara permanen dari sistem dan Google Sheets. Tindakan ini tidak dapat dibatalkan.',
    okText: 'Ya, hapus kartu',
    danger: true,
    onOk: function () { deleteNow(code); }
  });
}
async function deleteNow(code) {
  const i = S.cards.findIndex(function (x) { return x.code === code; });
  if (i < 0) return;
  const prevCard = S.cards[i];
  S.cards.splice(i, 1);
  if (S.drw && S.drw.code === code) closeDrawer();
  refreshCardViews();
  S.pending++;
  const r = await rpc('deleteCardStaff', [S.token, code]);
  S.pending--;
  if (!r.success) {
    S.cards.splice(i, 0, prevCard);
    refreshCardViews();
    if (r.code !== 'AUTH') toast('err', 'Gagal menghapus kartu', r.message);
    return;
  }
  toast('ok', 'Kartu dihapus', 'Kartu ' + code + ' berhasil dihapus.');
}

/* ═══════════════ DRAWER EDIT KARTU (W-10) ═══════════════ */
function closeDrawer() {
  const r = $('drawerRoot'); if (!r || !r.innerHTML) return; r.innerHTML = '';
  if (S.lastFocus && S.lastFocus.focus) { try { S.lastFocus.focus(); } catch (e) {} }
}
function openDrawer(code) {
  const c = S.cards.find(function (x) { return x.code === code; }); if (!c) return;
  S.lastFocus = document.activeElement;
  S.drw = { code: code, tipe: c.tipe || 'google_review', url: c.tipe === 'link_lain' ? c.url : '', place: c.tipe === 'google_review' && c.placeId ? { id: c.placeId, name: c.nama, address: '' } : null, aktif: c.status !== 'nonaktif' };
  const un = c.status === 'belum_setup';
  $('drawerRoot').innerHTML = '<div class="backdrop" onclick="closeDrawer()"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Pengaturan kartu ' + esc(code) + '">' +
    '<div class="drawer-h"><div class="grow row">' + codeChip(code, 'mintbg') + badge(c.status) + '</div><button class="btn-icon sm" onclick="closeDrawer()" aria-label="Tutup panel">' + ico('x', 20) + '</button></div><div class="drawer-b">' +
    '<div class="panel"><div class="kv"><span>Tanggal registrasi</span><span>' + fmtDT(c.regTs) + '</span></div><div class="kv"><span>WhatsApp pemilik</span><span>' + (c.wa ? esc(fmtWa(c.wa)) : '—') + '</span></div>' +
    '<div class="kv"><span>Total scan</span><span>' + fmtN(c.scans) + '</span></div><div class="kv"><span>Scan terakhir</span><span>' + relTime(c.lastTs) + '</span></div>' + (c.batch ? '<div class="kv"><span>Batch</span><span class="trunc" style="max-width:60%">' + esc(c.batch) + '</span></div>' : '') + '</div>' +
    (un ? '<div class="note warn mt16">' + ico('hourglass', 18) + '<span>Kartu belum diregistrasi pemilik. Tujuan hanya bisa diisi pemilik lewat halaman registrasi. Anda tetap dapat menonaktifkan kartu ini.</span></div>'
      : '<div class="seg mt16" role="tablist" aria-label="Tipe tujuan"><button type="button" role="tab" id="dwG" class="seg-b" aria-selected="' + (S.drw.tipe === 'google_review') + '" onclick="drwTipe(\'google_review\')">' + ico('star', 18) + 'Google Review</button>' +
      '<button type="button" role="tab" id="dwL" class="seg-b" aria-selected="' + (S.drw.tipe === 'link_lain') + '" onclick="drwTipe(\'link_lain\')">' + ico('link', 18) + 'Link Lain</button></div><div id="drwDest"></div>') +
    '<div class="field mt16"><span class="lbl">URL untuk ditulis ke tag NFC</span><div class="link-row"><span class="trunc">' + esc(tagUrl(code)) + '</span><button class="btn-icon sm" onclick="copyTag(\'' + code + '\')" aria-label="Salin URL tag">' + ico('copy', 16) + '</button></div></div>' +
    '<div class="qr-box">' +
      '<div class="qr-frame"><canvas id="drwQrCanvas" width="180" height="180" aria-label="QR Code ' + esc(code) + '"></canvas></div>' +
      '<div class="small muted mt8">Pindai QR ini atau dekatkan ke chip NFC kartu</div>' +
      '<div class="qr-acts">' +
        '<button type="button" class="btn btn-secondary btn-sm" onclick="downloadQrPng(\'' + code + '\')">' + ico('download', 16) + ' Unduh PNG</button>' +
        '<button type="button" id="btnQrPdf" class="btn btn-secondary btn-sm" onclick="downloadQrPdf(\'' + code + '\')">' + ico('file', 16) + ' Unduh PDF</button>' +
      '</div>' +
    '</div>' +
    '<label class="chk mt16" style="align-items:center"><span class="switch"><input id="drwAktif" type="checkbox" ' + (S.drw.aktif ? 'checked' : '') + ' onchange="S.drw.aktif=this.checked"><i></i></span><span class="grow"><b>Kartu aktif</b><br><span class="small muted">Kartu nonaktif menampilkan halaman informasi saat dipindai.</span></span></label>' +
    '<div class="danger-z">' +
      (un ? '' : '<b style="color:var(--danger)">Reset kartu</b><p class="small muted mt8">Hapus tujuan dan PIN pemilik. Jumlah scan akan direset ke 0 dan status kembali Belum Setup.</p><button class="btn btn-danger-o btn-sm mt12" onclick="drwReset()">' + ico('reset', 16) + ' Reset kartu ini</button><hr style="border:0;border-top:1px solid var(--danger-bd);margin:14px 0">') +
      '<b style="color:var(--danger)">Hapus kartu</b><p class="small muted mt8">Hapus kartu ini secara permanen dari sistem dan Google Sheets.</p><button class="btn btn-danger-o btn-sm mt12" onclick="drwDelete()">' + ico('trash', 16) + ' Hapus kartu ini</button>' +
    '</div>' +
    '</div><div class="drawer-f"><button class="btn btn-secondary" onclick="closeDrawer()">Batal</button><button class="btn btn-primary" onclick="drwSave()">' + ico('save', 18) + ' Simpan Perubahan</button></div></aside>';
  if (!un) drwDest();
  renderDrawerQr(code);
  const f = $('drawerRoot').querySelector('.drawer button'); if (f) f.focus();
}
async function copyTag(code) { const ok = await copyText(tagUrl(code)); toast(ok ? 'ok' : 'warn', ok ? 'URL tag tersalin' : 'Gagal menyalin', ok ? code : ''); }
function drwTipe(t) { S.drw.tipe = t; $('dwG').setAttribute('aria-selected', t === 'google_review'); $('dwL').setAttribute('aria-selected', t === 'link_lain'); drwDest(); }
function drwDest() {
  const d = S.drw, el = $('drwDest');
  if (d.tipe === 'google_review') {
    el.innerHTML = '<div id="pkDrw"></div>';
    makePicker('pkDrw', function () { return { staffToken: S.token }; }, d.place, function (p) { d.place = p; }).mount('pkDrw');
  } else {
    el.innerHTML = '<div class="field"><label class="lbl" for="drwUrl">URL tujuan</label><div class="inp-wrap"><span class="inp-ico">' + ico('link', 18) + '</span><input id="drwUrl" class="inp has-ico" type="url" inputmode="url" placeholder="https://contoh.com/halaman" value="' + esc(d.url) + '" oninput="S.drw.url=this.value"></div></div>';
  }
}
function drwReset() { const code = S.drw.code; closeDrawer(); quickReset(code); }
function drwDelete() { const code = S.drw.code; quickDelete(code); }

function renderDrawerQr(code) {
  const canvas = $('drwQrCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const url = tagUrl(code);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.onerror = function () {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#14532D';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR Tag NFC: ' + code, canvas.width / 2, canvas.height / 2);
  };
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=0&data=' + encodeURIComponent(url);
}

function downloadQrPng(code) {
  const url = tagUrl(code);
  const size = 600;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = size;
  offCanvas.height = size + 110;
  const ctx = offCanvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    ctx.drawImage(img, 40, 40, size - 80, size - 80);
    ctx.fillStyle = '#14532D';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, size / 2, size - 10);
    ctx.fillStyle = '#5E6E66';
    ctx.font = '500 16px sans-serif';
    ctx.fillText('Tag NFC · Redirect', size / 2, size + 22);

    offCanvas.toBlob(function (blob) {
      if (blob) {
        downloadBlob('QR-Tag-' + code + '.png', blob);
        toast('ok', 'QR PNG diunduh', 'Berkas QR-Tag-' + code + '.png siap digunakan.');
      } else {
        toast('err', 'Gagal', 'Gagal memproses gambar PNG.');
      }
    }, 'image/png');
  };
  img.onerror = function () {
    const src = $('drwQrCanvas');
    if (src) {
      src.toBlob(function (blob) {
        if (blob) {
          downloadBlob('QR-Tag-' + code + '.png', blob);
          toast('ok', 'QR PNG diunduh', 'QR Code berhasil diunduh.');
        }
      });
    } else {
      toast('err', 'Gagal', 'Tidak dapat mengunduh gambar QR.');
    }
  };
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=720x720&margin=0&data=' + encodeURIComponent(url);
}

async function downloadQrPdf(code) {
  setBusy('btnQrPdf', true, 'Membuat PDF…');
  const r = await rpc('exportCardQrPdf', [S.token, code]);
  setBusy('btnQrPdf', false);
  if (!r.success) {
    toast('err', 'Gagal membuat PDF', r.message);
    return;
  }
  const bin = atob(r.data.base64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  downloadBlob(r.data.filename, new Blob([u8], { type: 'application/pdf' }));
  toast('ok', 'PDF diunduh', 'Dokumen PDF kartu ' + code + ' siap dicetak.');
}
function drwSave() {
  const d = S.drw, c = S.cards.find(function (x) { return x.code === d.code; }); if (!c) return;
  const patch = { aktif: d.aktif }, change = {};
  if (c.status !== 'belum_setup') {
    if (d.tipe === 'google_review') {
      if (!d.place) { toast('warn', 'Pilih lokasi', 'Pilih lokasi dari hasil pencarian Google.'); return; }
      patch.tipe = 'google_review'; patch.place = { id: d.place.id, name: d.place.name };
      Object.assign(change, { tipe: 'google_review', nama: d.place.name, placeId: d.place.id, url: reviewUrl(d.place.id) });
    } else {
      const u = d.url.trim();
      if (!/^https?:\/\/[^\s\/]+\.[^\s]+$/i.test(u)) { toast('warn', 'URL tidak valid', 'Awali dengan http:// atau https://'); return; }
      patch.tipe = 'link_lain'; patch.url = u; Object.assign(change, { tipe: 'link_lain', nama: hostOf(u), placeId: '', url: u });
    }
  }
  if (d.aktif !== (c.status !== 'nonaktif')) change.status = d.aktif ? ((change.url || c.url) ? 'terhubung' : 'belum_setup') : 'nonaktif';
  closeDrawer();
  mutateCard(d.code, change, function () { return rpc('updateCardStaff', [S.token, d.code, patch]); }, 'Perubahan disimpan', d.code);
}

/* ═══════════════ BUAT KODE MASAL (W-11) ═══════════════ */
STAFF.generate = function (m) {
  const g = S.gen;
  m.innerHTML =
    '<div class="page-h"><div><div class="eyebrow">Produksi & flashing · Batch generator</div><h1 class="h1">Buat Kode Kartu Masal</h1><p class="sub">Hasilkan kode acak unik untuk di-flash ke kartu NFC fisik, lalu unduh sebagai CSV.</p></div></div>' +
    '<div class="grid2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);align-items:start"><form class="card card-pad" onsubmit="event.preventDefault();genRun()" novalidate>' +
    '<h2 class="h3">Konfigurasi Batch Baru</h2><p class="small muted">Tentukan parameter pembuatan kode unik.</p>' +
    '<div class="field"><label class="lbl" for="genN">Jumlah kode kartu <span class="muted" style="font-weight:400">(maks. 1.000 per batch)</span></label><div class="stepper">' +
    '<button type="button" class="btn-icon bd" onclick="genStep(-10)" aria-label="Kurangi 10">' + ico('minus', 18) + '</button><input id="genN" class="inp" type="number" min="1" max="1000" inputmode="numeric" value="' + g.jumlah + '" oninput="S.gen.jumlah=Math.floor(+this.value)||0">' +
    '<button type="button" class="btn-icon bd" onclick="genStep(10)" aria-label="Tambah 10">' + ico('plus', 18) + '</button></div>' +
    '<div class="presets">' + [50, 100, 250, 500].map(function (n) { return '<button type="button" class="chip mint" style="min-height:32px;cursor:pointer" onclick="genSet(' + n + ')">' + n + (n === 100 ? ' (disarankan)' : '') + '</button>'; }).join('') + '</div></div>' +
    '<div class="field"><span class="lbl">Panjang karakter kode</span><div class="rc">' + [8, 10].map(function (n) { return '<label><input type="radio" name="gl" value="' + n + '" ' + (g.panjang === n ? 'checked' : '') + ' onchange="S.gen.panjang=' + n + '"><b>' + n + ' karakter</b><small>' + (n === 8 ? 'K7M2QX9A' : 'K7M2QX9A4B') + '</small></label>'; }).join('') + '</div></div>' +
    '<label class="chk mt16"><input id="genSafe" type="checkbox" ' + (g.aman ? 'checked' : '') + ' onchange="S.gen.aman=this.checked"><span><b>Hilangkan karakter membingungkan</b><br><span class="small muted">Tanpa O, 0, I, 1, L agar mudah dibaca dan diketik manual.</span></span></label>' +
    '<div class="note mt12">' + ico('info', 18) + '<span>Status awal semua kode otomatis <b>Belum Setup</b>, siap diregistrasi pemiliknya.</span></div>' +
    '<div class="field"><label class="lbl" for="genLbl">Label batch / catatan <span class="muted" style="font-weight:400">(opsional)</span></label><input id="genLbl" class="inp" maxlength="60" placeholder="mis. Batch Resto & Cafe Senopati" value="' + esc(g.label) + '" oninput="S.gen.label=this.value"></div>' +
    '<button id="genBtn" type="submit" class="btn btn-primary btn-block mt24">' + ico('zap', 18) + ' Hasilkan Kode Baru</button>' +
    '<p class="small muted center mt8">Kode dijamin unik dan belum pernah dipakai di database.</p></form><div id="genPrev"></div></div>';
  drawGen();
};
function genSet(n) { S.gen.jumlah = n; const i = $('genN'); if (i) i.value = n; }
function genStep(d) { genSet(Math.max(1, Math.min(1000, (S.gen.jumlah || 0) + d))); }
function genGuide() {
  return '<div class="card card-pad mt16" style="background:var(--mint);box-shadow:none"><h3 class="h3 row">' + ico('radio', 20) + ' Panduan singkat flashing kartu NFC</h3><div class="steps mt12">' +
    '<div><b>01 KOMPATIBILITAS</b><span class="small">Berkas CSV dapat dipakai di aplikasi NFC Tools atau NFC Batch Writer untuk penulisan massal.</span></div>' +
    '<div><b>02 FORMAT NDEF</b><span class="small">Tulis kolom <span class="mono">url_tag</span> sebagai record NDEF bertipe URL, persis seperti di CSV.</span></div>' +
    '<div><b>03 ALUR KONSUMEN</b><span class="small">Saat pemilik pertama kali menempelkan HP, otomatis terbuka form registrasi.</span></div></div>' +
    '<p class="small mt12">URL aplikasi cukup panjang (±120 karakter). Pilih chip <b>NTAG215/216</b> agar aman; NTAG213 hanya muat bila URL lebih pendek dari ±130 karakter.</p></div>';
}
function drawGen() {
  const el = $('genPrev'); if (!el) return;
  const r = S.gen.result;
  if (!r) { el.innerHTML = '<div class="card"><div class="empty"><span class="tile">' + ico('plusSq', 28) + '</span><b>Belum ada batch</b><span>Atur parameter di samping lalu klik "Hasilkan Kode Baru". Hasilnya muncul di sini dan siap diunduh.</span></div></div>' + genGuide(); return; }
  const rows = r.codes.slice(0, 5).map(function (c, i) {
    return '<tr><td data-label="No" class="muted">' + String(i + 1).padStart(3, '0') + '</td><td data-label="Kode">' + codeChip(c) + '</td><td data-label="Status awal">' + badge('belum_setup') + '</td><td data-label="URL tag" class="mono small trunc" style="max-width:320px">' + esc(tagUrl(c)) + '</td></tr>';
  }).join('');
  el.innerHTML = '<div class="card"><div class="card-pad"><div class="ch-h" style="margin:0"><div><h2 class="h3">Pratinjau batch</h2><div class="row mt8" style="flex-wrap:wrap"><span class="code mintbg">' + esc(r.batch) + '</span><span class="chip ok"><i class="dot"></i>Siap diunduh</span></div>' +
    '<p class="small muted mt8">' + fmtN(r.codes.length) + ' kode dibuat · ' + fmtDT(r.createdTs) + '</p></div><button class="btn btn-primary" onclick="genCsv()">' + ico('download', 18) + ' Unduh CSV (' + fmtN(r.codes.length) + ' kode)</button></div></div>' +
    '<div class="tbl-wrap"><table class="tbl" style="min-width:640px"><thead><tr><th>No</th><th>Kode kartu</th><th>Status awal</th><th>URL penulisan tag</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="pager"><span class="small muted">Menampilkan 5 dari ' + fmtN(r.codes.length) + ' kode. Seluruh kode ada di berkas CSV.</span></div></div>' + genGuide();
}
async function genRun() {
  const g = S.gen;
  if (!(g.jumlah >= 1 && g.jumlah <= 1000)) { toast('warn', 'Jumlah tidak valid', 'Isi jumlah kode antara 1 sampai 1.000.'); return; }
  setBusy('genBtn', true, 'Membuat kode…');
  const r = await rpc('generateCodes', [S.token, g.jumlah, g.panjang, g.aman, g.label]);
  setBusy('genBtn', false);
  if (!r.success) { toast('err', 'Gagal membuat kode', r.message); return; }
  g.result = r.data;
  r.data.codes.forEach(function (c) { S.cards.unshift({ code: c, status: 'belum_setup', tipe: '', nama: '', placeId: '', url: '', wa: '', regTs: 0, scans: 0, lastTs: 0, createdTs: r.data.createdTs, batch: r.data.batch }); });
  drawGen(); toast('ok', fmtN(r.data.codes.length) + ' kode berhasil dibuat', 'Unduh CSV lalu flash ke kartu NFC.');
}
function genCsv() {
  const r = S.gen.result; if (!r) return;
  const lines = ['no,kode,url_tag,status'];
  r.codes.forEach(function (c, i) { lines.push([i + 1, c, tagUrl(c), 'belum_setup'].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',')); });
  downloadBlob('kode-kartu-' + r.batch.split(' ')[0].toLowerCase() + '.csv', new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  toast('ok', 'CSV diunduh', fmtN(r.codes.length) + ' kode siap di-flash.');
}
