
/* ═══════════════ HALAMAN PUBLIK (konsumen) ═══════════════ */
function hostOf(u) { const m = String(u).match(/^https?:\/\/([^\/?#:]+)/i); return m ? m[1].replace(/^www\./i, '') : 'Link Lain'; }
function backBtn(to, label) { return '<button class="btn-icon bd" onclick="go(\'' + to + '\')" aria-label="' + label + '">' + ico('arrowL', 20) + '</button>'; }
function togglePw(id, btn) {
  const i = $(id); const show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  btn.innerHTML = ico(show ? 'eyeOff' : 'eye', 18);
  btn.setAttribute('aria-label', show ? 'Sembunyikan' : 'Tampilkan');
}
function pwField(id, label, val, oninput, ph) {
  return '<div class="field"><label class="lbl" for="' + id + '">' + label + '</label><div class="inp-wrap">' +
    '<input id="' + id + '" class="inp has-end" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="' + (ph || '••••') + '" value="' + esc(val) + '" oninput="' + oninput + '">' +
    '<button type="button" class="inp-end" aria-label="Tampilkan" onclick="togglePw(\'' + id + '\',this)">' + ico('eye', 18) + '</button></div></div>';
}

/* ── W-01 Redirect ── */
/* ── W-01 Redirect (Fallback Navigasi Cepat) ── */
VIEWS.redirect = function () {
  const c = INIT.card || {};
  if (!/^https?:\/\//i.test(c.url || '')) { VIEWS.info(); return; }
  try { window.location.replace(c.url); } catch (e) {}
  pubPage(
    '<div class="center" style="padding:48px 0">' +
    '<span class="spin spin-lg"></span>' +
    '<h1 class="h2 mt16">Mengarahkan ke tujuan…</h1>' +
    '<p class="sub mt8 mono trunc" style="max-width:320px;margin:8px auto 0">' + esc(c.url) + '</p>' +
    '<a class="btn btn-primary btn-block mt24" href="' + esc(c.url) + '" rel="noopener">Buka Link Sekarang ' + ico('arrowR', 18) + '</a>' +
    '<div class="center mt16"><button class="link-btn" onclick="toPin(INIT.code)">Kelola kartu ' + ico('chevR', 16) + '</button></div>' +
    '</div>', { nohelp: true }
  );
};
function rdManage() { toPin(INIT.code); }
function rdGo() {
  const url = (INIT.card || {}).url || '';
  if (/^https?:\/\//i.test(url)) { try { window.location.replace(url); } catch (e) {} }
}

/* ── W-02 Registrasi ── */
function regState() {
  if (!S.reg || S.reg.code !== INIT.code) S.reg = { code: INIT.code, tipe: 'google_review', url: '', wa: '', pin: '', pin2: '', place: null };
  return S.reg;
}
VIEWS.register = function () {
  const r = regState();
  pubPage(
    '<div class="center">' + brandLogo(56, 'mb12') + '<h1 class="h1">Registrasi Kartu Anda</h1>' +
    '<div class="mt8">' + '<span class="code mintbg">' + ico('lock', 14) + esc(INIT.code) + '</span></div>' +
    '<p class="sub mt12">Hubungkan kartu fisik NFC Anda ke tautan Google Review atau website bisnis.</p></div>' +
    '<form class="card card-pad" onsubmit="event.preventDefault();regSubmit()" novalidate>' +
    '<div class="seg" role="tablist" aria-label="Tipe tujuan">' +
    '<button type="button" role="tab" id="sgG" class="seg-b" aria-selected="' + (r.tipe === 'google_review') + '" onclick="regTipe(\'google_review\')">' + ico('star', 18) + 'Google Review</button>' +
    '<button type="button" role="tab" id="sgL" class="seg-b" aria-selected="' + (r.tipe === 'link_lain') + '" onclick="regTipe(\'link_lain\')">' + ico('link', 18) + 'Link Lain</button></div>' +
    '<div id="regDest"></div>' +
    '<div class="field"><label class="lbl" for="regWa">Nomor WhatsApp pemilik</label><div class="phone"><span class="prefix">+62</span>' +
    '<input id="regWa" class="inp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="812-3456-7890" value="' + esc(r.wa) + '" oninput="S.reg.wa=this.value"></div>' +
    '<p class="hint">Digunakan admin untuk membantu jika ada kendala dengan kartu.</p></div>' +
    '<div class="row2">' + pwField('regPin', 'Buat PIN (4-6 digit)', r.pin, "S.reg.pin=this.value;regPinHint()") + pwField('regPin2', 'Konfirmasi PIN', r.pin2, "S.reg.pin2=this.value;regPinHint()") + '</div>' +
    '<p id="regPinHint" class="hint">PIN mencegah perubahan tujuan oleh pihak tidak berwenang. Hanya Anda yang perlu tahu.</p>' +
    '<button id="regBtn" type="submit" class="btn btn-primary btn-block mt24">Daftarkan Kartu ' + ico('arrowR', 18) + '</button></form>');
  regDest(); regPinHint();
};
function regTipe(t) {
  S.reg.tipe = t;
  $('sgG').setAttribute('aria-selected', t === 'google_review'); $('sgL').setAttribute('aria-selected', t === 'link_lain');
  regDest();
}
function regDest() {
  const r = S.reg, el = $('regDest');
  if (r.tipe === 'google_review') {
    el.innerHTML = '<div id="pkReg"></div>';
    makePicker('pkReg', function () { return { code: INIT.code }; }, r.place, function (p) { r.place = p; }).mount('pkReg');
  } else {
    el.innerHTML = '<div class="field"><label class="lbl" for="regUrl">URL tujuan</label><div class="inp-wrap"><span class="inp-ico">' + ico('link', 18) + '</span>' +
      '<input id="regUrl" class="inp has-ico" type="url" inputmode="url" autocomplete="off" placeholder="https://contoh.com/halaman" value="' + esc(r.url) + '" oninput="S.reg.url=this.value"></div>' +
      '<p class="hint">Awali dengan http:// atau https://</p></div>';
  }
}
function regPinHint() {
  const r = S.reg, el = $('regPinHint'); if (!el) return;
  if (r.pin && r.pin2) {
    if (r.pin === r.pin2) { el.className = 'hint'; el.style.color = 'var(--ok-tx)'; el.textContent = 'PIN cocok.'; }
    else { el.className = 'err'; el.style.color = ''; el.textContent = 'PIN belum sama.'; }
  } else { el.className = 'hint'; el.style.color = ''; el.textContent = 'PIN mencegah perubahan tujuan oleh pihak tidak berwenang. Hanya Anda yang perlu tahu.'; }
}
function regCheck() {
  const r = S.reg;
  if (r.tipe === 'google_review' && !r.place) return 'Pilih lokasi dari hasil pencarian Google.';
  if (r.tipe === 'link_lain' && !/^https?:\/\/[^\s\/]+\.[^\s]+$/i.test(r.url.trim())) return 'URL harus diawali http:// atau https:// dan valid.';
  if (r.wa.replace(/\D/g, '').length < 9) return 'Nomor WhatsApp belum lengkap.';
  if (!/^\d{4,6}$/.test(r.pin)) return 'PIN harus 4-6 digit angka.';
  if (r.pin !== r.pin2) return 'Konfirmasi PIN belum sama.';
  return '';
}
async function regSubmit() {
  const r = S.reg, e = regCheck();
  if (e) { toast('warn', 'Periksa isian Anda', e); return; }
  setBusy('regBtn', true, 'Mendaftarkan…');
  const payload = { tipe: r.tipe, whatsapp: r.wa, pin: r.pin, url: r.url.trim(), place: r.place ? { id: r.place.id, name: r.place.name } : null };
  const res = await rpc('registerCard', [INIT.code, payload]);
  setBusy('regBtn', false);
  if (!res.success) { toast('err', 'Pendaftaran gagal', res.message); return; }
  res.data.manageLink = manageUrl(INIT.code);
  S.done = res.data;
  INIT.card = { code: INIT.code, status: 'terhubung', tipe: res.data.tipe, nama: res.data.nama, url: res.data.url };
  S.reg = null;
  go('success');
}

/* ── W-03 Sukses ── */
VIEWS.success = function () {
  const d = S.done; if (!d) { go('portal'); return; }
  const gr = d.tipe === 'google_review';
  pubPage(
    '<div class="center"><div class="big-ico">' + ico('circleCheck', 44) + '</div><h1 class="h1 mt16">Kartu Berhasil Terdaftar!</h1>' +
    '<p class="sub mt8">Kartu NFC Anda kini aktif dan siap digunakan.</p></div>' +
    '<section class="card card-pad"><div class="kv"><span>Kode Kartu</span><span>' + codeChip(d.code, 'mintbg') + '</span></div>' +
    '<div class="kv"><span>Status</span><span>' + badge('terhubung') + '</span></div>' +
    '<div class="kv"><span>Tipe Tujuan</span><span>' + (gr ? 'Google Review' : 'Link Lain') + '</span></div>' +
    '<div class="kv"><span>Tujuan</span><span class="trunc" style="max-width:55%">' + esc(d.nama) + '</span></div>' +
    '<div class="kv"><span>Waktu Registrasi</span><span>' + fmtDT(d.regTs) + '</span></div></section>' +
    '<section class="card card-pad"><h2 class="h3 row">' + ico('shield', 20) + ' Link Kelola Pribadi Anda</h2>' +
    '<p class="sub mt8">Tautan rahasia untuk mengubah tujuan kartu tanpa perlu memindai kartu fisik.</p>' +
    '<div class="link-row mt12"><span class="trunc">' + esc(d.manageLink) + '</span></div>' +
    '<button class="btn btn-primary btn-block mt12" onclick="copyManage()">' + ico('copy', 18) + ' Salin Link Kelola</button></section>' +
    '<div class="note">' + ico('shield', 20) + '<span>Simpan kode dan link ini (screenshot atau bookmark). Anda membutuhkan PIN yang baru dibuat untuk mengelola kartu.</span></div>' +
    '<a class="btn btn-primary btn-block" href="' + esc(d.url) + '" target="_blank" rel="noopener">Tes Kartu Saya ' + ico('ext', 18) + '</a>' +
    '<div class="center"><button class="link-btn" onclick="go(\'portal\')">Kembali ke Beranda</button></div>');
};
async function copyManage() {
  const ok = await copyText(S.done.manageLink);
  toast(ok ? 'ok' : 'warn', ok ? 'Link tersalin' : 'Gagal menyalin', ok ? 'Simpan link ini baik-baik.' : 'Tekan lama pada link untuk menyalin manual.');
}

/* ── W-04 PIN ── */
function toPin(code) { S.ownerCode = code || S.ownerCode; S.pin = { val: '', err: '', locked: false }; go('pin'); }
VIEWS.pin = function () {
  if (!S.pin) S.pin = { val: '', err: '', locked: false };
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button type="button" class="key" onclick="pinKey(\'' + n + '\')" aria-label="' + n + '">' + n + '</button>'; }).join('');
  pubPage(
    '<div class="row">' + backBtn('portal', 'Kembali') + '<h1 class="h2 grow">Kelola Kartu</h1>' + codeChip(S.ownerCode) + '</div>' +
    '<section class="card card-pad center"><span class="logo" style="margin:0 auto;width:56px;height:56px">' + ico('lock', 26) + '</span>' +
    '<h2 class="h2 mt12">Masukkan PIN Pengaman</h2><p class="sub mt8">Masukkan 4-6 digit PIN yang Anda buat saat registrasi kartu ini.</p>' +
    '<div id="pinBoxes" class="pin-boxes" aria-label="PIN"></div><div id="pinErr" aria-live="polite"></div>' +
    '<div class="keypad">' + keys + '<button type="button" class="key fn" onclick="pinClear()">Reset</button>' +
    '<button type="button" class="key" onclick="pinKey(\'0\')" aria-label="0">0</button>' +
    '<button type="button" class="key fn" onclick="pinDel()" aria-label="Hapus satu digit">' + ico('backspace', 24) + '</button></div>' +
    '<button id="pinGo" class="btn btn-primary btn-block mt16" onclick="pinSubmit()">Lanjutkan ' + ico('arrowR', 18) + '</button></section>' +
    '<section class="card card-pad"><div class="row"><span class="tile">' + ico('msg', 20) + '</span><div class="grow"><b>Lupa PIN kartu Anda?</b><p class="small muted">Hubungi admin untuk bantuan verifikasi dan reset kartu.</p></div>' +
    (S.wa ? '<a class="btn btn-secondary btn-sm" href="' + esc(waLink('Halo Admin, saya lupa PIN untuk kartu NFC kode ' + S.ownerCode + '.')) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') + '</div></section>', { nohelp: true });
  pinDraw();
};
function pinDraw() {
  const p = S.pin; if (!p) return;
  const b = $('pinBoxes'); if (!b) return;
  let h = '';
  for (let i = 0; i < 6; i++) h += '<div class="pin-box ' + (i === p.val.length && !p.locked ? 'cur' : '') + '">' + (i < p.val.length ? '<i></i>' : '') + '</div>';
  b.innerHTML = h;
  const e = $('pinErr');
  e.innerHTML = p.locked ? '<div class="note warn mt12">' + ico('alert', 18) + '<span>' + esc(p.err) + ' Atau hubungi admin untuk reset PIN kartu.</span></div>'
    : (p.err ? '<div class="err mt8" style="justify-content:center;font-size:13px">' + ico('alert', 16) + esc(p.err) + '</div>' : '');
  const go_ = $('pinGo'); if (go_) go_.disabled = p.locked || p.val.length < 4;
}
function pinKey(d) { const p = S.pin; if (!p || p.locked || p.val.length >= 6) return; p.val += d; p.err = ''; pinDraw(); }
function pinDel() { const p = S.pin; if (!p || p.locked) return; p.val = p.val.slice(0, -1); pinDraw(); }
function pinClear() { const p = S.pin; if (!p || p.locked) return; p.val = ''; p.err = ''; pinDraw(); }
document.addEventListener('keydown', function (e) {
  if (S.view !== 'pin' || !$('modalRoot').hidden) return;
  const t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
  if (/^\d$/.test(e.key)) pinKey(e.key); else if (e.key === 'Backspace') pinDel(); else if (e.key === 'Enter') pinSubmit();
});
async function pinSubmit() {
  const p = S.pin; if (!p || p.locked) return;
  if (p.val.length < 4) { toast('warn', 'PIN belum lengkap', 'Masukkan 4-6 digit PIN.'); return; }
  setBusy('pinGo', true, 'Memeriksa…');
  const res = await rpc('verifyPin', [S.ownerCode, p.val]);
  setBusy('pinGo', false);
  if (res.success) { S.owner = res.data; S.mng = null; go('manage'); return; }
  if (res.code === 'UNREG') { INIT.code = S.ownerCode; INIT.card = { code: S.ownerCode, status: 'belum_setup' }; toast('info', 'Kartu belum diregistrasi', 'Silakan daftarkan kartu Anda terlebih dahulu.'); go('register'); return; }
  p.val = ''; p.err = res.message; p.locked = res.code === 'LOCKED'; pinDraw();
}

/* ── W-05 Kelola kartu ── */
function mngHero() {
  const c = S.owner.card, gr = c.tipe === 'google_review';
  return '<section class="hero" style="padding:22px"><span class="chip" style="background:rgba(255,255,255,.18);color:#fff"><i class="dot"></i>Kartu aktif · ' + (gr ? 'Google Review' : 'Link Lain') + '</span>' +
    '<h2 class="h2 mt12" style="overflow-wrap:anywhere">' + esc(c.nama) + '</h2><p class="small mono trunc" style="opacity:.8">' + esc(c.url) + '</p>' +
    '<div class="mt16 small" style="opacity:.8">Total pengunjung scan</div><div style="font:700 40px/46px var(--f-head)">' + fmtN(c.scans) + '</div>' +
    '<a class="btn btn-block mt12" style="background:rgba(255,255,255,.18);color:#fff" href="' + esc(c.url) + '" target="_blank" rel="noopener">Uji Link Langsung ' + ico('ext', 16) + '</a></section>';
}
VIEWS.manage = function () {
  const o = S.owner; if (!o) { toPin(S.ownerCode); return; }
  const c = o.card;
  if (!S.mng || S.mng.code !== c.code) S.mng = { code: c.code, tipe: c.tipe || 'google_review', url: c.tipe === 'link_lain' ? c.url : '', place: c.tipe === 'google_review' && c.placeId ? { id: c.placeId, name: c.nama, address: '' } : null };
  const m = S.mng;
  pubPage(
    '<div class="row"><h1 class="h2 grow">Pengaturan Kartu</h1>' + codeChip(c.code) + badge('terhubung') + '</div>' +
    '<div id="mngHero">' + mngHero() + '</div>' +
    '<form class="card card-pad" onsubmit="event.preventDefault();mngSave()" novalidate><h2 class="h3 row">' + ico('link', 20) + ' Ubah Tujuan Redirect</h2>' +
    '<div class="seg mt12" role="tablist" aria-label="Tipe tujuan">' +
    '<button type="button" role="tab" id="mgG" class="seg-b" aria-selected="' + (m.tipe === 'google_review') + '" onclick="mngTipe(\'google_review\')">' + ico('star', 18) + 'Google Review</button>' +
    '<button type="button" role="tab" id="mgL" class="seg-b" aria-selected="' + (m.tipe === 'link_lain') + '" onclick="mngTipe(\'link_lain\')">' + ico('link', 18) + 'Link Lain</button></div>' +
    '<div id="mngDest"></div><button id="mngBtn" type="submit" class="btn btn-primary btn-block mt24">' + ico('save', 18) + ' Simpan Perubahan Tujuan</button></form>' +
    '<section class="danger-z"><h2 class="h3 row" style="color:var(--danger)">' + ico('alert', 20) + ' Zona Berbahaya</h2>' +
    '<p class="sub mt8">Mereset kartu akan menghapus tujuan dan PIN, lalu mengembalikan status ke "Belum Setup".</p>' +
    '<button class="btn btn-danger-o btn-block mt12" onclick="mngResetAsk()">' + ico('reset', 18) + ' Reset Kartu Ini</button></section>');
  mngDest();
};
function mngTipe(t) { S.mng.tipe = t; $('mgG').setAttribute('aria-selected', t === 'google_review'); $('mgL').setAttribute('aria-selected', t === 'link_lain'); mngDest(); }
function mngDest() {
  const m = S.mng, el = $('mngDest');
  if (m.tipe === 'google_review') {
    el.innerHTML = '<div id="pkMng"></div>';
    makePicker('pkMng', function () { return { cardToken: S.owner.token }; }, m.place, function (p) { m.place = p; }).mount('pkMng');
  } else {
    el.innerHTML = '<div class="field"><label class="lbl" for="mngUrl">URL tujuan</label><div class="inp-wrap"><span class="inp-ico">' + ico('link', 18) + '</span>' +
      '<input id="mngUrl" class="inp has-ico" type="url" inputmode="url" placeholder="https://contoh.com/halaman" value="' + esc(m.url) + '" oninput="S.mng.url=this.value"></div></div>';
  }
}
async function mngSave() {
  const m = S.mng, o = S.owner; let patch, next;
  if (m.tipe === 'google_review') {
    if (!m.place) { toast('warn', 'Pilih lokasi', 'Pilih lokasi dari hasil pencarian Google.'); return; }
    patch = { tipe: 'google_review', place: { id: m.place.id, name: m.place.name } };
    next = { tipe: 'google_review', nama: m.place.name, placeId: m.place.id, url: reviewUrl(m.place.id) };
  } else {
    const u = m.url.trim();
    if (!/^https?:\/\/[^\s\/]+\.[^\s]+$/i.test(u)) { toast('warn', 'URL tidak valid', 'Awali dengan http:// atau https://'); return; }
    patch = { tipe: 'link_lain', url: u }; next = { tipe: 'link_lain', nama: hostOf(u), placeId: '', url: u };
  }
  const prev = o.card;
  o.card = Object.assign({}, prev, next);                  /* optimistic: langsung terlihat */
  $('mngHero').innerHTML = mngHero();
  toast('ok', 'Tujuan diperbarui', 'Perubahan langsung berlaku untuk kartu Anda.');
  S.pending++;
  const r = await rpc('updateCardOwner', [o.token, patch]);
  S.pending--;
  if (!r.success) {
    if (r.code === 'AUTH') { S.owner = null; toast('warn', 'Sesi berakhir', 'Masukkan PIN kembali.'); toPin(S.ownerCode); return; }
    o.card = prev; const h = $('mngHero'); if (h) h.innerHTML = mngHero();
    toast('err', 'Gagal menyimpan', r.message + ' Perubahan dibatalkan.'); return;
  }
  o.card = Object.assign({}, o.card, r.data);
  const h = $('mngHero'); if (h) h.innerHTML = mngHero();
}
function mngResetAsk() {
  confirmBox({ title: 'Reset kartu ini?', text: 'Tujuan dan PIN akan dihapus. Kartu kembali berstatus Belum Setup dan harus didaftarkan ulang.', okText: 'Ya, reset kartu', danger: true, onOk: mngReset });
}
async function mngReset() {
  const o = S.owner, code = o.card.code, prevCard = INIT.card;
  INIT.code = code; INIT.card = { code: code, status: 'belum_setup', tipe: '', nama: '', url: '', scans: 0, lastTs: 0 };
  S.owner = null; S.reg = null; S.mng = null;
  toast('ok', 'Kartu direset', 'Anda bisa mendaftarkan ulang kartu ini kapan saja.');
  go('register');                                          /* optimistic: langsung pindah halaman */
  S.pending++;
  const r = await rpc('resetCardOwner', [o.token]);
  S.pending--;
  if (!r.success) { INIT.card = prevCard; S.owner = o; toast('err', 'Reset gagal', r.message); go('manage'); }
}

/* ── W-06 Info ── */
VIEWS.info = function () {
  const c = INIT.card, code = INIT.code;
  let title = 'Kartu Ini Tidak Tersedia', text = 'Kartu ini sedang nonaktif, atau belum terdaftar di sistem.', chip = '<span class="chip off"><i class="dot"></i>Tidak dikenal</span>';
  if (INIT.error) { title = 'Terjadi Gangguan'; text = INIT.error; chip = ''; }
  else if (c && c.status === 'nonaktif') chip = badge('nonaktif');
  pubPage(
    '<section class="card card-pad center"><div class="big-ico warn">' + ico('alert', 44) + '</div>' +
    (code ? '<div class="mt16 row" style="justify-content:center">' + codeChip(code) + chip + '</div>' : '') +
    '<h1 class="h1 mt16">' + esc(title) + '</h1><p class="sub mt8">' + esc(text) + '</p>' +
    (S.wa ? '<div class="note mt16" style="text-align:left">' + ico('msg', 18) + '<span>Pemilik kartu ini? Hubungi admin dan kami bantu mengaktifkan kembali dalam beberapa menit.</span></div>' : '') +
    (S.wa ? '<a class="btn btn-primary btn-block mt16" href="' + esc(waLink(helpMsg())) + '" target="_blank" rel="noopener">' + ico('msg', 18) + ' Hubungi Admin via WhatsApp</a>' : '') +
    '<button class="btn btn-secondary btn-block mt12" onclick="location.reload()">' + ico('refresh', 18) + ' Coba Pindai Ulang</button></section>', { nohelp: true });
};

/* ── W-07 Portal kelola umum ── */
VIEWS.portal = function () {
  pubPage(
    '<div class="center"><span class="logo" style="margin:0 auto 12px;width:56px;height:56px">' + ico('card', 28) + '</span><h1 class="h1">Kelola Kartu Anda</h1>' +
    '<p class="sub mt8">Portal untuk pemilik kartu NFC mengubah tujuan atau mereset kartu.</p></div>' +
    '<form class="card card-pad" onsubmit="event.preventDefault();portalSubmit()" novalidate>' +
    '<div class="field" style="margin-top:0"><label class="lbl" for="ptCode">Kode kartu</label><div class="inp-wrap"><span class="inp-ico">' + ico('card', 18) + '</span>' +
    '<input id="ptCode" class="inp has-ico mono" style="text-transform:uppercase;letter-spacing:.08em" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="K7M2QX9A" value="' + esc(S.ownerCode || '') + '" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,\'\')"></div>' +
    '<p class="hint">Lihat kode di kartu atau di layar sukses registrasi.</p></div>' +
    pwField('ptPin', 'PIN keamanan (4-6 digit)', '', '') +
    '<button id="ptBtn" type="submit" class="btn btn-primary btn-block mt24">Lanjut ke Pengaturan Kartu ' + ico('arrowR', 18) + '</button></form>' +
    '<div class="center"><button class="link-btn" onclick="go(\'login\')">Login Petugas</button></div>');
};
async function portalSubmit() {
  const code = $('ptCode').value.trim().toUpperCase(), pin = $('ptPin').value;
  if (!/^[A-Z0-9]{6,12}$/.test(code)) { toast('warn', 'Kode kartu belum benar', 'Kode terdiri dari 6-12 huruf/angka.'); return; }
  if (!/^\d{4,6}$/.test(pin)) { toast('warn', 'PIN belum benar', 'PIN terdiri dari 4-6 digit angka.'); return; }
  setBusy('ptBtn', true, 'Memeriksa…');
  const res = await rpc('verifyPin', [code, pin]);
  setBusy('ptBtn', false);
  if (res.success) { S.ownerCode = code; INIT.code = code; S.owner = res.data; S.mng = null; go('manage'); return; }
  if (res.code === 'UNREG') { INIT.code = code; S.ownerCode = code; INIT.card = { code: code, status: 'belum_setup' }; toast('info', 'Kartu belum diregistrasi', 'Silakan daftarkan kartu Anda.'); go('register'); return; }
  toast('err', res.code === 'LOCKED' ? 'Akses dikunci sementara' : 'Gagal masuk', res.message);
}

/* ── Tampilan perantara saat data kartu dimuat dari server ── */
VIEWS.resolving = function () {
  pubPage('<div class="rd-ring" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="54"/><circle class="ring-spin" cx="60" cy="60" r="54"/></svg><div class="ring-core">' + ico('radio', 44) + '</div></div>' +
    '<div class="center"><h1 class="h1">Memeriksa kartu…</h1><p class="sub mt8">Sebentar ya, kami menyiapkan tujuan Anda.</p></div>', { nohelp: true });
};
/* ── Pengingat bila GAS_URL belum diisi ── */
VIEWS.setup = function () {
  pubPage('<section class="card card-pad center"><div class="big-ico warn">' + ico('alert', 44) + '</div><h1 class="h1 mt16">Backend Belum Tersambung</h1>' +
    '<p class="sub mt8">Isi <b>GAS_URL</b> di berkas <span class="mono">js/config.js</span> dengan URL Web App Apps Script (berakhiran <span class="mono">/exec</span>), lalu push ulang ke GitHub.</p></section>', { nohelp: true });
};
