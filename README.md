# Redirect NFC — Frontend (GitHub Pages)

Frontend statis untuk sistem kartu NFC. Backend: Google Apps Script (REST API) — **tidak termasuk** di repo ini.

```
index.html          ← harus berada di root repository
css/style.css
js/config.js        ← ISI GAS_URL dulu sebelum push
js/api.js           ← klien fetch() ke Apps Script
js/core.js · public.js · staff.js · reports.js · app.js
.nojekyll
PANDUAN-INSTALASI.md
```

**Mulai cepat:** isi `GAS_URL` di `js/config.js` → push ke GitHub → Settings → Pages → *main / (root)*.
Panduan lengkap langkah demi langkah: **PANDUAN-INSTALASI.md**.
