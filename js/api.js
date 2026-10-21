'use strict';
/* ============================================================
   KLIEN API — semua komunikasi ke Google Apps Script lewat fetch()
   - GET  : data publik (status kartu)            → GAS_URL?action=...
   - POST : semua aksi lain, body JSON dikirim sebagai text/plain
            (WAJIB text/plain agar browser tidak melakukan CORS preflight yang ditolak GAS)
   ============================================================ */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

const API_TIMEOUT_MS = 30000;
function gasReady() { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(GAS_URL); }

async function apiFetch(url, opts, retries) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, API_TIMEOUT_MS);
    try {
      const res = await fetch(url, Object.assign({ signal: ctrl.signal }, opts));
      const txt = await res.text();
      try { return JSON.parse(txt); }
      catch (e) { return { success: false, code: 'BADRESP', message: 'Backend tidak membalas dengan benar. Pastikan Web App di-deploy dengan akses "Siapa saja" dan URL /exec sudah benar.' }; }
    } catch (e) {
      if (attempt === retries) {
        return { success: false, code: 'NET', message: e && e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Koneksi bermasalah. Periksa jaringan Anda lalu coba lagi.' };
      }
    } finally { clearTimeout(timer); }
  }
}
/* GET aman diulang 1x bila jaringan putus; POST TIDAK diulang (hindari data ganda) */
function apiGet(params) { return apiFetch(GAS_URL + '?' + new URLSearchParams(params).toString(), { method: 'GET' }, 1); }
function apiPost(action, body) {
  return apiFetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: action }, body || {})) }, 0);
}

/* Pemetaan nama fungsi lama → aksi REST. Dengan ini seluruh kode tampilan tidak perlu diubah. */
const RPC_MAP = {
  searchPlaces:      function (ctx, query) { return ['searchPlaces', { ctx: ctx, query: query }]; },
  registerCard:      function (code, payload) { return ['register', { code: code, payload: payload }]; },
  verifyPin:         function (code, pin) { return ['verifyPin', { code: code, pin: pin }]; },
  updateCardOwner:   function (cardToken, patch) { return ['ownerUpdate', { cardToken: cardToken, patch: patch }]; },
  resetCardOwner:    function (cardToken) { return ['ownerReset', { cardToken: cardToken }]; },
  doLogin:           function (username, password) { return ['login', { username: username, password: password }]; },
  doLogout:          function (token) { return ['logout', { token: token }]; },
  staffBootstrap:    function (token) { return ['bootstrap', { token: token }]; },
  updateCardStaff:   function (token, code, patch) { return ['staffUpdate', { token: token, code: code, patch: patch }]; },
  resetCardStaff:    function (token, code) { return ['staffReset', { token: token, code: code }]; },
  deleteCardStaff:   function (token, code) { return ['staffDelete', { token: token, code: code }]; },
  generateCodes:     function (token, jumlah, panjang, aman, label) { return ['generate', { token: token, jumlah: jumlah, panjang: panjang, aman: aman, label: label }]; },
  getScanReport:     function (token, params) { return ['scanReport', { token: token, params: params }]; },
  exportCardReportPdf: function (token, codes, meta) { return ['exportPdf', { token: token, codes: codes, meta: meta }]; },
  exportCardQrPdf:   function (token, code) { return ['exportQrPdf', { token: token, code: code }]; },
  saveSettings:      function (token, settings) { return ['saveSettings', { token: token, settings: settings }]; },
  createUser:        function (token, user) { return ['createUser', { token: token, user: user }]; },
  setUserActive:     function (token, username, aktif) { return ['setUserActive', { token: token, username: username, aktif: aktif }]; },
  resetUserPassword: function (token, username, password) { return ['resetUserPassword', { token: token, username: username, password: password }]; },
  changeOwnPassword: function (token, oldPw, newPw) { return ['changePassword', { token: token, oldPw: oldPw, newPw: newPw }]; }
};
function rpc(fn, args) {
  const m = RPC_MAP[fn];
  if (!m) return Promise.resolve({ success: false, message: 'Fungsi tidak dikenal: ' + fn });
  const r = m.apply(null, args || []);
  return apiPost(r[0], r[1]).then(function (res) {
    if (res && res.code === 'AUTH' && S.token) forceLogout('Sesi berakhir. Silakan masuk kembali.');
    return res;
  });
}
