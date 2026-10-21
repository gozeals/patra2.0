
/* ═══════════════ GRAFIK (Chart.js dimuat malas, hanya untuk staf) ═══════════════ */
let chartP = null;
function ensureChart() {
  if (window.Chart) return Promise.resolve(true);
  if (chartP) return chartP;
  chartP = new Promise(function (res) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
    s.onload = function () { res(true); };
    s.onerror = function () { chartP = null; res(false); };
    document.head.appendChild(s);
  });
  return chartP;
}
function cssv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function palette() { return isDark() ? { dk: '#46B07A', md: '#2E8B57', rgb: '70,176,122' } : { dk: '#14532D', md: '#1E7A46', rgb: '30,122,70' }; }
function chartBase() {
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = cssv('--muted');
  Chart.defaults.borderColor = cssv('--border');
}
function hatchPattern(color) {
  const c = document.createElement('canvas'); c.width = c.height = 10;
  const x = c.getContext('2d'); x.strokeStyle = color; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(-2, 12); x.lineTo(12, -2); x.moveTo(-2, 2); x.lineTo(2, -2); x.moveTo(8, 12); x.lineTo(12, 8); x.stroke();
  return x.createPattern(c, 'repeat');
}
function chartFail(id) { const e = $(id); if (e && e.parentNode) e.parentNode.innerHTML = '<div class="empty"><span class="tile">' + ico('alert', 26) + '</span><b>Grafik tidak dapat dimuat</b><span>Periksa koneksi internet lalu muat ulang data.</span></div>'; }
function drawBar(id, labels, subs, values) {
  const c = $(id); if (!c) return;
  const p = palette(), max = Math.max.apply(null, values.concat([1]));
  const order = values.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return a[0] - b[0]; }).slice(0, 2).map(function (x) { return x[1]; });
  const ctx = c.getContext('2d'), hatch = hatchPattern(isDark() ? 'rgba(155,175,163,.6)' : 'rgba(94,110,102,.55)');
  const colors = values.map(function (v, i) {
    if (v === max && max > 1) return p.dk;
    if (order.indexOf(i) >= 0 && v < max * 0.6) return hatch;
    return 'rgba(' + p.rgb + ',' + (0.3 + 0.55 * (v / max)).toFixed(2) + ')';
  });
  CH[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels.map(function (l, i) { return subs[i] ? [subs[i], l] : l; }), datasets: [{ data: values, backgroundColor: colors, borderRadius: 999, borderSkipped: false, maxBarThickness: 36 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 450 },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (x) { return fmtN(x.parsed.y) + ' scan'; } } } },
      scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, border: { display: false }, grid: { color: cssv('--border'), borderDash: [4, 4] }, ticks: { callback: function (v) { return fmtN(v); }, precision: 0 } } } }
  });
}
function drawDonut(id, vals) {
  const c = $(id); if (!c) return;
  const p = palette();
  CH[id] = new Chart(c.getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['Terhubung', 'Belum Setup', 'Nonaktif'], datasets: [{ data: vals, backgroundColor: [p.dk, '#D97706', '#64748B'], borderWidth: 0, spacing: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '74%', animation: { duration: 450 }, plugins: { legend: { display: false } } }
  });
}
function drawLine(id, labels, subs, values) {
  const c = $(id); if (!c) return;
  const p = palette();
  CH[id] = new Chart(c.getContext('2d'), {
    type: 'line',
    data: { labels: labels.map(function (l, i) { return subs[i] ? [subs[i], l] : l; }), datasets: [{ data: values, borderColor: p.dk, borderWidth: 2.5, tension: 0.35, fill: true,
      backgroundColor: function (cx) { const a = cx.chart.chartArea; if (!a) return 'transparent'; const g = cx.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom); g.addColorStop(0, 'rgba(' + p.rgb + ',.28)'); g.addColorStop(1, 'rgba(' + p.rgb + ',0)'); return g; },
      pointRadius: values.length > 40 ? 0 : 4, pointHoverRadius: 6, pointBackgroundColor: cssv('--card'), pointBorderColor: p.dk, pointBorderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, animation: { duration: 450 },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (x) { return fmtN(x.parsed.y) + ' scan'; } } } },
      scales: { x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { beginAtZero: true, border: { display: false }, grid: { color: cssv('--border'), borderDash: [4, 4] }, ticks: { callback: function (v) { return fmtN(v); }, precision: 0 } } } }
  });
}

/* ═══════════════ RINGKASAN MASTER (W-12) ═══════════════ */
STAFF.overview = function (m) {
  const ov = S.overview;
  if (!ov) { m.innerHTML = '<div class="skel" style="height:240px"></div>'; return; }
  const n = cardCounts(), pc = function (x) { return n.all ? Math.round(x / n.all * 100) : 0; };
  const tr = ov.trendPct === null ? '' : '<span class="trend ' + (ov.trendPct < 0 ? 'dn' : '') + '">' + ico('trend', 14) + (ov.trendPct > 0 ? '+' : '') + ov.trendPct + '% vs kemarin</span>';
  const latest = (ov.latest || []).map(function (c) {
    return '<tr><td data-label="Kode">' + codeChip(c.code) + '</td><td data-label="Status">' + badge(c.status) + '</td><td data-label="Tipe">' + typeCell(c) + '</td>' +
      '<td class="dst" data-label="Tujuan">' + dstCell(c) + '</td><td data-label="WhatsApp">' + waCell(c) + '</td><td data-label="Registrasi" class="muted">' + relTime(c.regTs) + '</td></tr>';
  }).join('');
  m.innerHTML =
    '<div class="page-h"><div><div class="eyebrow">Master overview</div><h1 class="h1">Ringkasan Eksekutif</h1><p class="sub">Pantauan performa scan NFC harian, distribusi status kartu, dan aktivitas registrasi terkini.</p></div>' +
    '<button class="btn btn-primary" onclick="navTo(\'cardreport\')">' + ico('download', 18) + ' Unduh Laporan</button></div>' +
    '<div class="stats">' + statCard('Total Kartu', fmtN(n.all), '<div class="small" style="opacity:.85">Seluruh kartu dalam sistem</div>', 'radio', { hero: true }) +
    statCard('Terhubung', fmtN(n.terhubung), '<div><span class="chip ok"><i class="dot"></i>' + pc(n.terhubung) + '% aktif</span></div>', 'link') +
    statCard('Belum Setup', fmtN(n.belum_setup), '<div><span class="chip warn"><i class="dot"></i>Siap digunakan</span></div>', 'hourglass') +
    statCard('Nonaktif', fmtN(n.nonaktif), '<div><span class="chip off"><i class="dot"></i>Perlu ditinjau</span></div>', 'ban') +
    statCard('Scan Hari Ini', fmtN(ov.scansToday), '<div>' + tr + '</div>', 'trend') + '</div>' +
    '<div class="grid2"><section class="card card-pad"><div class="ch-h"><div><h2 class="h3">Jumlah Scan per Hari</h2><p class="small muted">Volume tap NFC selama 7 hari terakhir</p></div></div>' +
    '<div class="ch-box"><canvas id="cvBar" role="img" aria-label="Grafik batang jumlah scan 7 hari terakhir. Total ' + fmtN(ov.total7) + ' scan."></canvas></div>' +
    '<div class="ch-foot"><span>Puncak: <b>' + fmtN(ov.peak.value) + '</b> scan (' + esc(ov.peak.sub + ' ' + ov.peak.label) + ')</span><span>Rata-rata: <b>' + fmtN(ov.avg7) + '</b> / hari</span><span>Total 7 hari: <b>' + fmtN(ov.total7) + '</b></span></div></section>' +
    '<section class="card card-pad"><div class="ch-h"><div><h2 class="h3">Komposisi Status Kartu</h2><p class="small muted">' + fmtN(n.all) + ' kartu total</p></div></div>' +
    '<div class="donut"><canvas id="cvDonut" role="img" aria-label="Diagram donat status kartu: ' + n.terhubung + ' terhubung, ' + n.belum_setup + ' belum setup, ' + n.nonaktif + ' nonaktif"></canvas><div class="mid"><b>' + pc(n.terhubung) + '%</b><span>Aktif</span></div></div>' +
    '<div class="legend">' + [['Terhubung', n.terhubung, 'var(--btn-h)'], ['Belum Setup', n.belum_setup, '#D97706'], ['Nonaktif', n.nonaktif, '#64748B']].map(function (x) {
      return '<div class="lg"><div class="row"><span class="row" style="gap:8px"><i class="dot" style="width:10px;height:10px;color:' + x[2] + '"></i>' + x[0] + '</span><span>' + fmtN(x[1]) + ' <span class="muted" style="font-weight:400">(' + pc(x[1]) + '%)</span></span></div><div class="bar"><i style="width:' + pc(x[1]) + '%;background:' + x[2] + '"></i></div></div>';
    }).join('') + '</div></section></div>' +
    '<section class="card"><div class="card-pad ch-h" style="margin:0"><div><h2 class="h3">Kartu Terdaftar Terbaru</h2><p class="small muted">5 registrasi terbaru</p></div><button class="link-btn" onclick="navTo(\'cards\')">Lihat semua di Daftar Kartu ' + ico('arrowR', 16) + '</button></div>' +
    (latest ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kode kartu</th><th>Status</th><th>Tipe</th><th>Tujuan</th><th>WhatsApp</th><th>Registrasi</th></tr></thead><tbody>' + latest + '</tbody></table></div>'
      : '<div class="empty"><span class="tile">' + ico('card', 28) + '</span><b>Belum ada registrasi</b><span>Kartu yang didaftarkan pemilik akan muncul di sini.</span></div>') + '</section>';
  ensureChart().then(function (ok) {
    if (S.view !== 'overview') return;
    if (!ok) { chartFail('cvBar'); chartFail('cvDonut'); return; }
    chartBase(); drawBar('cvBar', ov.series.labels, ov.series.subs, ov.series.values); drawDonut('cvDonut', [n.terhubung, n.belum_setup, n.nonaktif]);
  });
};

/* ═══════════════ LAPORAN SCAN (W-13) ═══════════════ */
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtYmd(s) { const p = String(s).split('-'); return p.length === 3 ? Number(p[2]) + ' ' + BLN[Number(p[1]) - 1] + ' ' + p[0] : s; }
function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function initRange(g) {
  const to = new Date(), from = new Date(); from.setDate(to.getDate() - (g === 'day' ? 6 : (g === 'week' ? 55 : 179)));
  S.sr.gran = g; S.sr.from = ymd(from); S.sr.to = ymd(to);
}
STAFF.scanreport = function (m) {
  const sr = S.sr; if (!sr.from) initRange('day');
  m.innerHTML =
    '<div class="page-h"><div><div class="eyebrow">Master analytics hub</div><h1 class="h1">Laporan Jumlah Scan</h1><p class="sub">Frekuensi pengalihan NFC pengunjung per hari, minggu, dan bulan.</p></div>' +
    '<div class="row" style="flex-wrap:wrap;gap:10px"><div class="seg" role="tablist" aria-label="Rentang waktu">' + [['day', 'Hari'], ['week', 'Minggu'], ['month', 'Bulan']].map(function (g) { return '<button class="seg-b" style="padding:0 16px" role="tab" data-g="' + g[0] + '" aria-selected="' + (sr.gran === g[0]) + '" onclick="srGran(\'' + g[0] + '\')">' + g[1] + '</button>'; }).join('') + '</div>' +
    '<input type="date" class="inp" style="width:auto;border-radius:999px" id="srFrom" aria-label="Dari tanggal" value="' + sr.from + '" max="' + sr.to + '" onchange="srRange()"><span class="muted">–</span>' +
    '<input type="date" class="inp" style="width:auto;border-radius:999px" id="srTo" aria-label="Sampai tanggal" value="' + sr.to + '" onchange="srRange()">' +
    '<button class="btn btn-secondary" onclick="loadReport(true)">' + ico('refresh', 18) + ' Perbarui</button></div></div><div id="srBody"></div>';
  drawReport(); loadReport();
};
function srGran(g) { initRange(g); document.querySelectorAll('[data-g]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.g === g); }); $('srFrom').value = S.sr.from; $('srTo').value = S.sr.to; $('srFrom').max = S.sr.to; loadReport(); }
function srRange() {
  const f = $('srFrom').value, t = $('srTo').value;
  if (!f || !t) return;
  if (t < f) { toast('warn', 'Rentang tidak valid', 'Tanggal akhir harus setelah tanggal awal.'); $('srTo').value = S.sr.to; return; }
  S.sr.from = f; S.sr.to = t; $('srFrom').max = t; loadReport();
}
function srTipe(t) { S.sr.tipe = t; loadReport(); }
function srKey() { const s = S.sr; return [s.gran, s.from, s.to, s.tipe].join('|'); }
async function loadReport(force) {
  const sr = S.sr, key = srKey(), hit = sr.cache[key];
  if (hit && !force && Date.now() - hit.t < 60000) { sr.data = hit.d; sr.err = ''; sr.loading = false; drawReport(); return; }
  sr.loading = true; sr.err = ''; drawReport();
  const r = await rpc('getScanReport', [S.token, { gran: sr.gran, from: sr.from, to: sr.to, tipe: sr.tipe }]);
  if (key !== srKey() || S.view !== 'scanreport') return;
  sr.loading = false;
  if (!r.success) { sr.err = r.message; sr.data = null; drawReport(); return; }
  sr.cache[key] = { t: Date.now(), d: r.data }; sr.data = r.data; drawReport();
}
function drawReport() {
  const el = $('srBody'); if (!el) return;
  const sr = S.sr, d = sr.data;
  if (CH.cvLine) { try { CH.cvLine.destroy(); } catch (e) {} delete CH.cvLine; }
  if (sr.err) { el.innerHTML = '<div class="card"><div class="empty"><span class="tile">' + ico('alert', 26) + '</span><b>Laporan gagal dimuat</b><span>' + esc(sr.err) + '</span><button class="btn btn-secondary mt8" onclick="loadReport(true)">Coba lagi</button></div></div>'; return; }
  if (!d) { el.innerHTML = '<div class="skel" style="height:56px;margin-bottom:16px"></div><div class="skel" style="height:340px;margin-bottom:16px"></div><div class="grid3"><div class="skel" style="height:140px"></div><div class="skel" style="height:140px"></div><div class="skel" style="height:140px"></div></div>'; return; }
  const all = (d.tipe.google_review || 0) + (d.tipe.link_lain || 0), pc = function (x) { return all ? Math.round(x / all * 100) : 0; };
  const chips = [['all', 'Semua Scan', all], ['google_review', 'Google Review', d.tipe.google_review], ['link_lain', 'Link Lain', d.tipe.link_lain]].map(function (c) {
    return '<button class="chip ' + (sr.tipe === c[0] ? 'master' : 'mint') + '" style="min-height:36px;padding:6px 14px;text-transform:none;letter-spacing:0;font-size:13px;cursor:pointer" onclick="srTipe(\'' + c[0] + '\')" aria-pressed="' + (sr.tipe === c[0]) + '">' + c[1] + (c[0] === 'all' ? ' · ' + fmtN(c[2]) : ' · ' + pc(c[2]) + '%') + '</button>';
  }).join('');
  const ch = d.changePct === null ? '<span class="small muted">Belum ada data periode sebelumnya</span>' : '<span class="trend ' + (d.changePct < 0 ? 'dn' : '') + '">' + ico('trend', 14) + (d.changePct > 0 ? '+' : '') + d.changePct + '%</span> <span class="small muted">vs periode sebelumnya (' + fmtN(d.prev) + ')</span>';
  const ratio = d.activeCards ? Math.min(100, Math.round(d.distinct / d.activeCards * 100)) : 0;
  el.innerHTML = '<div class="row" style="flex-wrap:wrap;margin-bottom:16px">' + chips + '<span class="small muted" style="margin-left:auto">Rata-rata ' + fmtN(d.avg) + ' scan per ' + ({ day: 'hari', week: 'minggu', month: 'bulan' })[sr.gran] + '</span></div>' +
    '<section class="card card-pad" style="margin-bottom:20px"><div class="ch-h"><div><h2 class="h3">Aktivitas Pemindaian</h2><p class="small muted">Scan berhasil per ' + ({ day: 'hari', week: 'minggu', month: 'bulan' })[sr.gran] + ' (' + esc(fmtYmd(sr.from)) + ' s/d ' + esc(fmtYmd(sr.to)) + ')</p></div></div>' +
    '<div class="ch-box tall"><canvas id="cvLine" role="img" aria-label="Grafik garis aktivitas scan. Total ' + fmtN(d.total) + ' scan, puncak ' + esc(d.peak.long) + ' sebanyak ' + fmtN(d.peak.value) + '."></canvas></div></section>' +
    '<div class="grid3"><section class="card card-pad metric hero" style="color:#fff"><div class="t" style="color:rgba(255,255,255,.85)">Total scan dalam rentang</div><div class="v">' + fmtN(d.total) + '</div><div>' + ch.replace('class="small muted"', 'class="small" style="opacity:.85"') + '</div></section>' +
    '<section class="card card-pad metric"><div class="t">Hari / periode tersibuk</div><div class="v" style="font-size:26px;line-height:34px">' + esc(d.peak.long) + '</div><div><span class="chip mint">' + fmtN(d.peak.value) + ' scan</span></div></section>' +
    '<section class="card card-pad metric"><div class="t">Kartu aktif terpindai</div><div class="v">' + fmtN(d.distinct) + ' <span class="muted" style="font-size:18px;font-weight:600">/ ' + fmtN(d.activeCards) + '</span></div><div class="bar"><i style="width:' + ratio + '%"></i></div><div class="small muted mt8">' + ratio + '% kartu aktif terpakai dalam rentang ini</div></section></div>';
  ensureChart().then(function (ok) {
    if (S.view !== 'scanreport' || S.sr.data !== d) return;
    if (!ok) { chartFail('cvLine'); return; }
    chartBase(); drawLine('cvLine', d.labels, d.subs, d.values);
  });
}

/* ═══════════════ LAPORAN KARTU + PDF (W-14) ═══════════════ */
function reportFiltered() {
  const r = S.rp, q = r.q.trim().toLowerCase(), qd = q.replace(/\D/g, '');
  const lim = r.periode === 'all' ? 0 : Date.now() - Number(r.periode) * 86400000;
  return S.cards.filter(function (c) {
    if (r.status !== 'all' && c.status !== r.status) return false;
    if (r.tipe !== 'all' && c.tipe !== r.tipe) return false;
    if (lim && (c.regTs || c.createdTs) < lim) return false;
    if (!q) return true;
    return c.code.toLowerCase().indexOf(q) >= 0 || c.nama.toLowerCase().indexOf(q) >= 0 || c.url.toLowerCase().indexOf(q) >= 0 || (qd.length >= 3 && c.wa.indexOf(qd) >= 0);
  }).sort(function (a, b) { return b.scans - a.scans; });
}
function filterText() {
  const r = S.rp, p = [];
  if (r.status !== 'all') p.push('Status ' + STATUS[r.status][0]);
  if (r.tipe !== 'all') p.push(r.tipe === 'google_review' ? 'Google Review' : 'Link Lain');
  if (r.periode !== 'all') p.push(r.periode + ' hari terakhir');
  if (r.q.trim()) p.push('"' + r.q.trim() + '"');
  return p.join(' · ');
}
function sel(id, opts, cur, fn) {
  return '<select class="inp" style="width:auto" id="' + id + '" aria-label="' + id + '" onchange="' + fn + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
}
STAFF.cardreport = function (m) {
  const r = S.rp;
  m.innerHTML =
    '<div class="page-h"><div><div class="eyebrow">Master panel › Laporan & arsip</div><h1 class="h1">Laporan Kartu NFC</h1><p class="sub">Tinjau performa kartu, saring datanya, lalu unduh sebagai dokumen PDF.</p></div>' +
    '<button id="pdfBtn" class="btn btn-primary" onclick="reportPdf()">' + ico('download', 18) + ' Unduh PDF</button></div>' +
    '<div class="stats" id="rpStats"></div>' +
    '<div class="card toolbar"><div class="inp-wrap"><span class="inp-ico">' + ico('search', 18) + '</span><input class="inp has-ico" type="search" placeholder="Cari kode kartu, WhatsApp, tujuan…" aria-label="Cari" value="' + esc(r.q) + '" oninput="rpSearch(this.value)"></div>' +
    sel('rpStatus', [['all', 'Status: Semua'], ['terhubung', 'Terhubung'], ['belum_setup', 'Belum Setup'], ['nonaktif', 'Nonaktif']], r.status, "S.rp.status=this.value;S.rp.page=1;drawReportTable()") +
    sel('rpTipe', [['all', 'Tipe: Semua'], ['google_review', 'Google Review'], ['link_lain', 'Link Lain']], r.tipe, "S.rp.tipe=this.value;S.rp.page=1;drawReportTable()") +
    sel('rpPer', [['all', 'Registrasi: Semua'], ['7', '7 hari terakhir'], ['30', '30 hari terakhir'], ['90', '90 hari terakhir']], r.periode, "S.rp.periode=this.value;S.rp.page=1;drawReportTable()") + '</div>' +
    '<div class="card" id="rpBox"></div>';
  drawReportTable();
};
const rpSearch = debounce(function (v) { S.rp.q = v; S.rp.page = 1; drawReportTable(); }, 160);
function rpPage(p) { S.rp.page = p; drawReportTable(); }
function drawReportTable() {
  const box = $('rpBox'); if (!box) return;
  const list = reportFiltered(), per = 10, pages = Math.max(1, Math.ceil(list.length / per));
  S.rp.page = Math.min(S.rp.page, pages);
  let t = 0, b = 0, n = 0, sc = 0;
  list.forEach(function (c) { sc += c.scans; if (c.status === 'terhubung') t++; else if (c.status === 'belum_setup') b++; else n++; });
  $('rpStats').innerHTML = statCard('Total Kartu (hasil filter)', fmtN(list.length), '<div class="small" style="opacity:.85">Dari ' + fmtN(S.cards.length) + ' kartu</div>', 'card', { hero: true }) +
    statCard('Terhubung', fmtN(t), '', 'link') + statCard('Belum Setup', fmtN(b), '', 'hourglass') + statCard('Akumulasi Scan', fmtN(sc), '<div class="small muted">' + fmtN(n) + ' kartu nonaktif</div>', 'bars');
  const rows = list.slice((S.rp.page - 1) * per, S.rp.page * per);
  if (!rows.length) { box.innerHTML = '<div class="empty"><span class="tile">' + ico('file', 28) + '</span><b>Tidak ada data</b><span>Ubah filter untuk melihat kartu lain.</span></div>'; return; }
  box.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kode kartu</th><th>Status</th><th>Tipe</th><th>Tujuan</th><th>Tanggal registrasi</th><th class="num">Total scan</th></tr></thead><tbody>' +
    rows.map(function (c) {
      return '<tr class="' + (c.status === 'nonaktif' ? 'dim' : '') + '"><td data-label="Kode">' + codeChip(c.code) + '</td><td data-label="Status">' + badge(c.status) + '</td><td data-label="Tipe">' + typeCell(c) + '</td>' +
        '<td class="dst" data-label="Tujuan">' + (c.status === 'belum_setup' ? '<span class="muted">—</span>' : dstCell(c)) + '</td>' +
        '<td data-label="Registrasi" class="muted">' + (c.regTs ? fmtDT(c.regTs) : '—') + '</td><td class="num" data-label="Scan"><b>' + fmtN(c.scans) + '</b></td></tr>';
    }).join('') + '</tbody></table></div>' + pagerHtml(list.length, S.rp.page, per, 'rpPage');
}
async function reportPdf() {
  const list = reportFiltered();
  if (!list.length) { toast('warn', 'Tidak ada data', 'Tidak ada kartu untuk dicetak. Ubah filter terlebih dahulu.'); return; }
  setBusy('pdfBtn', true, 'Membuat PDF…');
  const r = await rpc('exportCardReportPdf', [S.token, list.map(function (c) { return c.code; }), { filter: filterText() }]);
  setBusy('pdfBtn', false);
  if (!r.success) { toast('err', 'Gagal membuat PDF', r.message); return; }
  const bin = atob(r.data.base64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  downloadBlob(r.data.filename, new Blob([u8], { type: 'application/pdf' }));
  toast('ok', 'PDF diunduh', fmtN(list.length) + ' kartu dalam laporan.');
}

/* ═══════════════ PENGATURAN (W-15) ═══════════════ */
STAFF.settings = function (m) {
  const st = S.settings || {};
  const tabs = [['umum', 'Pengaturan Umum'], ['admin', 'Akun Admin (' + (S.users.filter(function (u) { return u.role !== 'master'; }).length) + ')']].map(function (t) {
    return '<button class="tab" role="tab" aria-selected="' + (S.setTab === t[0]) + '" onclick="setTab(\'' + t[0] + '\')">' + t[1] + '</button>';
  }).join('');
  m.innerHTML = '<div class="page-h"><div><div class="eyebrow">Master governance</div><h1 class="h1">Pengaturan Sistem</h1><p class="sub">Konfigurasi pencarian lokasi Google, kontak bantuan WhatsApp, tautan tag, dan akun admin.</p></div>' +
    '<div class="tabs" role="tablist">' + tabs + '</div></div><div id="setBody"></div>';
  drawSettings();
};
function setTab(t) { S.setTab = t; renderStaff(false); }
function drawSettings() {
  const el = $('setBody'); if (!el) return;
  const st = S.settings || {};
  if (S.setTab === 'admin') { drawAdmins(el); return; }
  const dev = /^(https?:\/\/(localhost|127\.|0\.0\.0\.0)|file:)/.test(baseUrl());
  el.innerHTML =
    '<section class="card card-pad" style="margin-bottom:20px"><div class="row"><span class="tile">' + ico('search', 22) + '</span><div class="grow"><h2 class="h3">Pencarian Lokasi Otomatis</h2><p class="small muted">Google Places API (Text Search). Dipakai pada form registrasi konsumen.</p></div>' + (st.apiKeySet ? '<span class="chip ok"><i class="dot"></i>API key terpasang</span>' : '<span class="chip warn"><i class="dot"></i>Belum diatur</span>') + '</div>' +
    '<div class="field"><label class="lbl" for="stKey">Google Places API key</label><div class="inp-wrap"><span class="inp-ico">' + ico('key', 18) + '</span><input id="stKey" class="inp has-ico has-end" type="password" autocomplete="off" spellcheck="false" placeholder="' + (st.apiKeySet ? '•••••••••••••••••••• (kosongkan jika tidak diganti)' : 'Tempel API key di sini') + '">' +
    '<button type="button" class="inp-end" aria-label="Tampilkan" onclick="togglePw(\'stKey\',this)">' + ico('eye', 18) + '</button></div>' +
    '<p class="hint">Disimpan aman di Script Properties dan tidak pernah dikirim ke browser konsumen.</p></div>' +
    '<div class="note mt12">' + ico('info', 18) + '<span>Pemakaian bulan ini (hitungan aplikasi): <b>' + fmtN(st.placesUse) + '</b> permintaan. Pantau kuota resmi di Google Cloud Console.</span></div></section>' +
    '<section class="card card-pad" style="margin-bottom:20px"><div class="row"><span class="tile">' + ico('msg', 22) + '</span><div class="grow"><h2 class="h3">Kontak Bantuan WhatsApp</h2><p class="small muted">Menjadi tujuan tombol "Hubungi Admin" di semua halaman konsumen.</p></div></div>' +
    '<div class="field"><label class="lbl" for="stWa">Nomor WhatsApp admin</label><div class="phone"><span class="prefix">+62</span><input id="stWa" class="inp" type="tel" inputmode="tel" placeholder="812-3456-7890" value="' + esc((st.waAdmin || '').replace(/^62/, '')) + '"></div></div>' +
    (st.waAdmin ? '<a class="btn btn-secondary btn-sm mt12" href="' + esc(waLink('Tes tautan WhatsApp dari Redirect NFC.', st.waAdmin)) + '" target="_blank" rel="noopener">' + ico('ext', 16) + ' Uji coba tautan WhatsApp</a>' : '') + '</section>' +
    '<section class="card card-pad"><div class="row"><span class="tile">' + ico('link', 22) + '</span><div class="grow"><h2 class="h3">Tautan Dasar Tag NFC</h2><p class="small muted">Alamat situs ini (GitHub Pages) yang ditulis ke kartu NFC, diikuti ?id=KODE.</p></div></div>' +
    '<div class="field"><label class="lbl" for="stBase">Override alamat situs <span class="muted" style="font-weight:400">(opsional, mis. domain sendiri)</span></label><input id="stBase" class="inp" type="url" placeholder="' + esc(AUTO_BASE) + '" value="' + esc(st.baseUrl || '') + '"></div>' +
    '<div class="link-row mt12"><span class="trunc">' + esc(baseUrl()) + '</span><button class="btn-icon sm" onclick="copyBase()" aria-label="Salin tautan dasar">' + ico('copy', 16) + '</button></div>' +
    (dev ? '<div class="note warn mt12">' + ico('alert', 18) + '<span>Alamat ini hanya untuk uji lokal. Buka situs lewat <b>https://USERNAME.github.io/…</b> sebelum menulis kartu NFC.</span></div>' : '') + '</section>' +
    '<div class="row" style="justify-content:flex-end;margin-top:20px;position:sticky;bottom:12px"><button id="stSave" class="btn btn-primary" onclick="saveSettingsUi()">' + ico('save', 18) + ' Simpan Pengaturan</button></div>';
}
async function copyBase() { const ok = await copyText(baseUrl()); toast(ok ? 'ok' : 'warn', ok ? 'Tautan tersalin' : 'Gagal menyalin', ''); }
async function saveSettingsUi() {
  const body = { waAdmin: $('stWa').value.trim(), baseUrl: $('stBase').value.trim() }, k = $('stKey').value.trim();
  if (k) body.apiKey = k;
  setBusy('stSave', true, 'Menyimpan…');
  const r = await rpc('saveSettings', [S.token, body]);
  setBusy('stSave', false);
  if (!r.success) { toast('err', 'Pengaturan gagal disimpan', r.message); return; }
  S.settings = r.data.settings; S.baseOverride = r.data.baseUrl || ''; S.wa = r.data.waAdmin || '';
  drawSettings(); toast('ok', 'Pengaturan tersimpan', 'Perubahan langsung berlaku untuk semua halaman.');
}
function drawAdmins(el) {
  const rows = S.users.map(function (u) {
    const me = u.username === S.user.username, ms = u.role === 'master';
    return '<tr><td data-label="Pengguna"><div class="row"><span class="avatar" style="width:40px;height:40px">' + esc((u.nama || u.username).charAt(0).toUpperCase()) + '</span><div><b>' + esc(u.username) + '</b><div class="small muted">' + esc(u.nama) + '</div></div></div></td>' +
      '<td data-label="Peran">' + (ms ? '<span class="chip master">Master</span>' : '<span class="chip mint">Admin</span>') + '</td>' +
      '<td data-label="Status">' + (ms ? '<span class="chip ok"><i class="dot"></i>Aktif</span>' : '<label class="row" style="gap:8px"><span class="switch"><input type="checkbox" ' + (u.aktif ? 'checked' : '') + ' aria-label="Aktifkan ' + esc(u.username) + '" onchange="toggleUser(\'' + esc(u.username) + '\',this.checked)"><i></i></span><span class="small">' + (u.aktif ? 'Aktif' : 'Nonaktif') + '</span></label>') + '</td>' +
      '<td data-label="Login terakhir" class="muted">' + relTime(u.lastTs) + '</td>' +
      '<td class="nolabel"><div class="acts">' + (me && ms ? '<span class="chip off">Akun utama</span>' : '<button class="btn btn-secondary btn-sm" onclick="resetPwAsk(\'' + esc(u.username) + '\')">' + ico('key', 16) + ' Reset sandi</button>') + '</div></td></tr>';
  }).join('');
  el.innerHTML = '<section class="card"><div class="card-pad ch-h" style="margin:0"><div><h2 class="h3">Akun Admin & Tim Petugas</h2><p class="small muted">Kelola hak akses pengguna dashboard.</p></div><button class="btn btn-primary" onclick="addAdminAsk()">' + ico('plus', 18) + ' Tambah Admin Baru</button></div>' +
    '<div class="tbl-wrap"><table class="tbl" style="min-width:680px"><thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Login terakhir</th><th><span class="sr">Aksi</span></th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}
async function toggleUser(username, aktif) {
  const prev = S.users.map(function (u) { return Object.assign({}, u); });
  S.users.forEach(function (u) { if (u.username === username) u.aktif = aktif; }); drawSettings();
  S.pending++; const r = await rpc('setUserActive', [S.token, username, aktif]); S.pending--;
  if (!r.success) { S.users = prev; drawSettings(); toast('err', 'Perubahan dibatalkan', r.message); return; }
  S.users = r.data; drawSettings(); toast('ok', aktif ? 'Akun diaktifkan' : 'Akun dinonaktifkan', username);
}
function addAdminAsk() {
  openModal('<h2 class="h2" id="mdT">Tambah Admin Baru</h2><div class="field"><label class="lbl" for="nuU">Username</label><input id="nuU" data-af class="inp" autocomplete="off" autocapitalize="none" placeholder="mis. budi.operasional"></div>' +
    '<div class="field"><label class="lbl" for="nuN">Nama tampilan</label><input id="nuN" class="inp" autocomplete="off" placeholder="mis. Budi"></div>' +
    '<div class="field"><label class="lbl" for="nuP">Kata sandi awal (min. 8 karakter)</label><input id="nuP" class="inp" type="text" autocomplete="off"></div>' +
    '<div class="acts2"><button class="btn btn-secondary" onclick="closeModal()">Batal</button><button id="nuBtn" class="btn btn-primary" onclick="addAdmin()">Buat Akun</button></div>');
}
async function addAdmin() {
  setBusy('nuBtn', true, 'Membuat…');
  const r = await rpc('createUser', [S.token, { username: $('nuU').value, nama: $('nuN').value, password: $('nuP').value }]);
  setBusy('nuBtn', false);
  if (!r.success) { toast('err', 'Akun gagal dibuat', r.message); return; }
  S.users = r.data; closeModal(); renderStaff(false); toast('ok', 'Admin ditambahkan', 'Bagikan kata sandi awal secara aman.');
}
function resetPwAsk(u) {
  openModal('<h2 class="h2" id="mdT">Reset kata sandi</h2><p class="sub mt8">Atur kata sandi baru untuk <b>' + esc(u) + '</b>. Sesi aktif pengguna akan berakhir.</p>' +
    '<div class="field"><label class="lbl" for="rpP">Kata sandi baru (min. 8 karakter)</label><input id="rpP" data-af class="inp" type="text" autocomplete="off"></div>' +
    '<div class="acts2"><button class="btn btn-secondary" onclick="closeModal()">Batal</button><button id="rpBtn" class="btn btn-primary" onclick="resetPw(\'' + esc(u) + '\')">Simpan</button></div>');
}
async function resetPw(u) {
  setBusy('rpBtn', true, 'Menyimpan…');
  const r = await rpc('resetUserPassword', [S.token, u, $('rpP').value]);
  setBusy('rpBtn', false);
  if (!r.success) { toast('err', 'Gagal reset kata sandi', r.message); return; }
  S.users = r.data; closeModal(); toast('ok', 'Kata sandi direset', 'Bagikan kata sandi baru ke ' + u + ' secara aman.');
}
