# Invoice Generator - CV Fluir Travelindo

Aplikasi pembuat invoice dan tagihan DP. Berjalan di browser, bisa dipasang di layar utama HP (PWA).

## Struktur

- `index.html`: aplikasi (satu file, Tailwind via CDN, JavaScript murni)
- `sw.js`: service worker agar aplikasi bisa dibuka offline. Ubah `CACHE_VERSION` setiap kali `index.html` diperbarui.
- `manifest.json`, `icons/`, `logo.png`: pemasangan ke layar utama HP
- `apps-script/Code.gs`: backend di Google Apps Script (nomor invoice berurutan, data perusahaan, kode akses)

## Data rahasia tidak ada di repositori

Nomor rekening, NPWP, dan kontak perusahaan disimpan di Google Sheet (sheet **Pengaturan**), bukan di kode ini. Kode akses disimpan sebagai Script property di Apps Script.

## Pemasangan

1. Ikuti langkah di bagian atas `apps-script/Code.gs` (buat Sheet, jalankan `setupSheets()`, isi `ACCESS_CODE`, lalu deploy sebagai Web app).
2. Salin URL `/exec` ke konstanta `API_URL` di `index.html`, lalu commit.
3. Aktifkan GitHub Pages: Settings → Pages → Source: *Deploy from a branch* → branch `main`, folder `/ (root)`.
4. Buka URL GitHub Pages di HP, masukkan kode akses, lalu pasang ke layar utama.

## Catatan

- Nomor invoice baru diambil dari server saat **Buat Invoice Baru** ditekan. Perangkat harus online untuk membuat nomor baru.
- Jika draf lama di browser sudah memakai nomor 21873, ubah nilai `nextInvoiceNo` di sheet Pengaturan menjadi 21874 agar tidak kembar.
