# 📋 PANDUAN INSTALASI — Redirect NFC
**Backend:** Google Apps Script (REST API JSON) · **Frontend:** GitHub Pages (statis)

```
Kartu NFC ──tap──► https://USERNAME.github.io/NAMA-REPO/?id=KODE   (GitHub Pages, cepat)
                          │ fetch() JSON
                          ▼
                   Google Apps Script  /exec   ──►  Google Sheets (database)
```

> ⚠️ **Perubahan penting dari versi sebelumnya:** alamat yang ditulis ke kartu NFC sekarang adalah
> **alamat GitHub Pages**, bukan lagi alamat `script.google.com`. Kartu yang sudah ditulis dengan
> alamat lama harus ditulis ulang (CSV baru dibuat dari menu *Buat Kode Masal*).

---

## BAGIAN A — Backend (Google Apps Script)

File backend (`Kode.gs`, `appsscript.json`) **tidak ada di dalam ZIP ini** — disalin langsung ke editor Apps Script.

### A1. Sudah pernah memasang versi sebelumnya (yang tampil di script.google.com)?
Data Anda aman; tidak perlu setup ulang.
1. Buka proyek Apps Script lama.
2. **Hapus** file `Index`, `Stylesheet`, `JavaScript` (tiga file HTML).
3. Ganti seluruh isi `Kode.gs` dengan `Kode.gs` yang baru.
4. **Setelan proyek** (ikon roda gigi) → centang *Tampilkan file manifes "appsscript.json"* → ganti isinya dengan `appsscript.json` yang baru.
5. **Deploy → Kelola deployment → ikon pensil → Versi: *Versi baru* → Deploy.**
   (Jangan buat "Deployment baru" — URL akan berubah.)
6. Lompat ke **A3**.

### A2. Instalasi baru
1. https://script.google.com → **Proyek baru**.
2. Ubah nama `Code.gs` menjadi `Kode.gs`, hapus isinya, tempel `Kode.gs` yang baru.
3. **Setelan proyek** → centang *Tampilkan file manifes "appsscript.json"* → tempel isi `appsscript.json`.
4. Dropdown fungsi → **`setupAppEnvironment`** → ▶ **Jalankan** (HANYA SEKALI) → *Review permissions* → izinkan.
5. Buka **Log eksekusi**. **Catat password akun `master`** (hanya tampil sekali).
6. **Deploy → Deployment baru → Aplikasi web** → *Jalankan sebagai:* **Saya** · *Yang memiliki akses:* **Siapa saja** → Deploy.
7. **Salin URL yang berakhiran `/exec`.**

### A3. Uji backend
Tempel URL `/exec` di browser. Harus tampil teks JSON seperti ini (bukan halaman web / bukan error):
```
{"success":true,"data":{"app":"Redirect NFC","time":1790000000000}}
```

---

## BAGIAN B — Isi alamat backend di frontend  ⚠️ SEBELUM push pertama

Buka berkas **`js/config.js`** dengan Notepad, ganti tulisan `ISI_URL_EXEC_DI_SINI` dengan URL `/exec` dari A2/A3:
```js
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec';
```
Simpan. (Alamat ini memang publik; tidak ada rahasia di frontend. API key Google dan password tersimpan di server.)

---

## BAGIAN C — Pasang ke GitHub Pages (lewat terminal)

> **Jangan** memakai tombol *Add file → Upload files* di web GitHub: struktur folder `css/` dan `js/` akan hilang dan situs tampil tanpa tampilan.

### C1. Pasang Git
- **Windows:** https://git-scm.com/download/win → install dengan pengaturan default → buka **PowerShell**.
- **Mac:** buka Terminal, ketik `git --version` (macOS menawarkan instalasi otomatis).
- **Linux:** `sudo apt install git`.

Cek: `git --version`

### C2. Akun GitHub
Daftar di https://github.com. Username Anda akan menjadi bagian alamat situs (`USERNAME.github.io`).

### C3. Identitas Git (sekali seumur komputer)
```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@akun-github-anda.com"
```

### C4. Buat repository
github.com → **+** → **New repository** → nama (mis. `redirect-nfc`) → **Public** → **JANGAN** centang README / .gitignore / license → **Create repository**.

### C5. Masuk ke folder yang BENAR  ⚠️ langkah paling sering salah
Setelah ZIP diekstrak, Anda punya folder bernama **`redirect-nfc`**. **Folder itulah** (yang langsung berisi `index.html`) tempat `git init` dijalankan — jangan masuk lebih dalam, jangan naik satu level.

Windows: buka folder `redirect-nfc` di File Explorer → klik address bar → ketik `powershell` → Enter.

Verifikasi (wajib sebelum `git init`):
```powershell
dir
```
Harus terlihat: **`index.html`**, folder **`css`**, folder **`js`** (dan `PANDUAN-INSTALASI.md`, `README.md`).
Jika yang terlihat justru folder `redirect-nfc` lagi → `cd redirect-nfc` dulu. **Tidak boleh ada file `.gs`** di folder ini.

### C6. Push pertama (satu per satu)
```bash
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
(`git add .` — ada **titik** di akhir.) Saat diminta *Username* → username GitHub; *Password* → **Personal Access Token** (C7). Layar tidak menampilkan apa pun saat Anda mengetik/paste token — itu normal.
Berhasil jika muncul `* [new branch]  main -> main`.

### C7. Personal Access Token
https://github.com/settings/tokens → **Generate new token (classic)** → Note bebas, Expiration 90 days → centang **repo** → **Generate token** → salin `ghp_...` (hanya tampil sekali) → paste sebagai password saat `git push`.
Alternatif visual: **GitHub Desktop** (https://desktop.github.com) → Add Local Repository → Publish.

### C8. Aktifkan GitHub Pages
Repo → **Settings** → **Pages** → *Source:* **Deploy from a branch** → *Branch:* **main** · **/ (root)** → **Save** → tunggu 1–2 menit → centang **Enforce HTTPS**.
Situs aktif di: `https://USERNAME.github.io/NAMA-REPO/`

---

## BAGIAN D — Hubungkan & atur
1. Buka `https://USERNAME.github.io/NAMA-REPO/` → **Login Petugas** → `master` + password dari A2.
2. Menu **Pengaturan**: tempel **Google Places API key** (Cloud Console: aktifkan *Places API (New)* + penagihan; batasi key ke Places API (New) saja), isi **WhatsApp admin**, lalu **Simpan**.
3. Alamat situs terdeteksi otomatis. Kolom *Override alamat situs* hanya diisi bila memakai domain sendiri.

## BAGIAN E — Tulis kartu NFC
Menu **Buat Kode Masal** → *Hasilkan* → **Unduh CSV**. Kolom `url_tag` berisi `https://USERNAME.github.io/NAMA-REPO/?id=KODE` — tulis ke kartu sebagai record NDEF *URL* dengan NFC Tools / NFC Batch Writer. Chip **NTAG215/216** paling aman (NTAG213 cukup bila URL < ±130 karakter).

## BAGIAN F — Uji menyeluruh
1. Tap kartu belum terdaftar → form registrasi muncul.
2. Daftarkan (cari lokasi → pilih → WhatsApp → PIN) → layar sukses.
3. Tap lagi → "Mengarahkan Anda…" lalu langsung ke Google Review.
4. Tap → tekan **Kelola kartu** → PIN → ubah tujuan.
5. DevTools (F12) → Network: tidak ada error merah / CORS.

## BAGIAN G — Memperbarui
- **Frontend:** dari folder `redirect-nfc`:
  ```bash
  git add .
  git commit -m "Deskripsi perubahan"
  git push
  ```
  Tunggu 1–2 menit; bila tampilan lama, tekan **Ctrl+Shift+R**.
- **Backend:** ubah `Kode.gs` → **Deploy → Kelola deployment → pensil → Versi baru → Deploy** (URL tetap).

---

## 🔧 Troubleshooting
| Gejala | Penyebab | Solusi |
|---|---|---|
| Layar **"Backend Belum Tersambung"** | `GAS_URL` belum diisi | Isi `js/config.js` → `git add . && git commit -m "isi config" && git push` |
| Pesan **"Backend tidak membalas dengan benar"** | Akses deployment bukan *Siapa saja*, atau URL salah | Deploy ulang: *Yang memiliki akses = Siapa saja*; cek A3 |
| Console: **CORS / blocked by CORS policy** | Sama seperti di atas, atau deployment lama belum diperbarui | Pastikan URL `/exec` (bukan `/dev`), buat **Versi baru** |
| Perubahan `Kode.gs` tidak berpengaruh | Belum dibuat versi deployment baru | Deploy → Kelola deployment → Versi baru |
| Halaman GitHub **404** | `index.html` tidak di root repo | Buka repo di browser: harus terlihat `index.html`, `css/`, `js/`. Jika yang terlihat folder `redirect-nfc/`, `git init` terlalu tinggi → push ulang dari folder yang benar (`git push -u origin main --force`) |
| Halaman polos tanpa warna / 404 CSS & JS | Struktur folder rata (upload via web) | Push ulang dari terminal; jangan upload via web |
| `Password authentication is not supported` | GitHub menolak password biasa | Pakai Personal Access Token (C7) |
| `remote origin already exists` | Sudah pernah `git remote add` | Lewati; `git push -u origin main` |
| `Updates were rejected…` | Repo berisi file yang tidak ada di lokal | `git pull --rebase origin main` lalu `git push` |
| `LF will be replaced by CRLF` | Peringatan format baris Windows | Abaikan |
| Pencarian lokasi: "belum diaktifkan" | API key belum diisi | Menu Pengaturan → tempel API key |
| Kartu lama tidak terbuka | Tertulis alamat `script.google.com` lama | Tulis ulang dengan CSV baru (alamat GitHub Pages) |
