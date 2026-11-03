/**
 * Backend Invoice Generator - CV Fluir Travelindo (Google Apps Script)
 *
 * CARA PASANG:
 * 1. Buka Google Sheet baru (dari akun Google bisnis), lalu menu Extensions → Apps Script.
 * 2. Hapus isi default, tempel seluruh isi file ini, lalu Save.
 * 3. Jalankan fungsi setupSheets() sekali (Run). Beri izin saat diminta.
 * 4. Project Settings (ikon roda gigi) → Script properties → Add script property:
 *      Property: ACCESS_CODE    Value: (kode akses pilihan Anda)
 * 5. Deploy → New deployment → Select type: Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 *    Klik Deploy, lalu salin URL yang berakhiran /exec ke konstanta API_URL di index.html.
 * 6. Setiap kali kode ini diubah: Deploy → Manage deployments → Edit → Version: New version → Deploy.
 *
 * SHEET "Pengaturan": kolom A = kunci, kolom B = nilai. Ubah nilai di sini untuk data perusahaan dan rekening.
 * Baris "nextInvoiceNo" adalah nomor yang akan dipakai invoice berikutnya.
 * SHEET "Log": mencatat setiap nomor yang diberikan, beserta waktu dan perangkat.
 */

const SHEET_SETTINGS = 'Pengaturan';
const SHEET_LOG = 'Log';
const FIRST_INVOICE_NO = 21873;

const DEFAULT_SETTINGS = [
  ['brand', 'FLUIR'],
  ['tagline', 'YOUR ADVENTURE PARTNER'],
  ['name', 'CV Fluir Travelindo'],
  ['address', 'JL. Situ Cileunca No. 24 Pangalengan, Bandung, Jawa Barat 40378'],
  ['npwp', '91.570.415.9-404.000'],
  ['phone', '081386000797'],
  ['email', 'fluiradventure@gmail.com'],
  ['signer', 'Hanif Padma'],
  ['signerTitle', ''],
  ['bankName', 'BCA'],
  ['accountNo', '7380549926'],
  ['accountName', 'Muhammad Hanif Padma'],
  ['nextInvoiceNo', FIRST_INVOICE_NO]
];

/** Jalankan sekali dari editor. Aman dijalankan ulang: sheet yang sudah ada tidak ditimpa. */
function setupSheets() {
  const ss = SpreadsheetApp.getActive();

  let settings = ss.getSheetByName(SHEET_SETTINGS);
  if (!settings) {
    settings = ss.insertSheet(SHEET_SETTINGS);
    settings.getRange(1, 1, 1, 2).setValues([['Kunci', 'Nilai']]).setFontWeight('bold');
    settings.getRange(2, 1, DEFAULT_SETTINGS.length, 2).setValues(DEFAULT_SETTINGS);
    settings.setColumnWidth(1, 160);
    settings.setColumnWidth(2, 380);
  }

  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG);
    log.getRange(1, 1, 1, 3).setValues([['Waktu', 'Nomor Invoice', 'Perangkat']]).setFontWeight('bold');
  }
}

/* ---------- Endpoint ---------- */

function doGet(e) {
  const p = (e && e.parameter) || {};

  if (!isAuthorized(p.code)) {
    return jsonOut({ ok: false, error: 'Kode akses salah.' });
  }

  try {
    if (p.action === 'settings') {
      return jsonOut({ ok: true, company: readSettings() });
    }
    if (p.action === 'next') {
      return jsonOut(takeNextInvoiceNo(p.device || 'tidak diketahui'));
    }
    return jsonOut({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

/* ---------- Helper ---------- */

function isAuthorized(code) {
  const expected = PropertiesService.getScriptProperties().getProperty('ACCESS_CODE');
  return !!expected && !!code && code === expected;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSettingsSheet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_SETTINGS);
  if (!sh) throw new Error('Sheet Pengaturan belum ada. Jalankan setupSheets() terlebih dahulu.');
  return sh;
}

function readSettings() {
  const rows = getSettingsSheet().getDataRange().getValues();
  const out = {};
  rows.forEach(r => {
    const key = String(r[0]).trim();
    if (key && key !== 'Kunci') out[key] = String(r[1] ?? '');
  });
  return out;
}

/**
 * Mengambil nomor berikutnya lalu menaikkan penghitung 1 angka.
 * LockService memastikan dua perangkat yang meminta bersamaan tidak mendapat nomor yang sama.
 */
function takeNextInvoiceNo(device) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = getSettingsSheet();
    const rows = sh.getDataRange().getValues();

    const idx = rows.findIndex(r => String(r[0]).trim() === 'nextInvoiceNo');
    if (idx < 0) throw new Error('Baris nextInvoiceNo tidak ditemukan di sheet Pengaturan.');

    const current = Number(rows[idx][1]) || FIRST_INVOICE_NO;
    sh.getRange(idx + 1, 2).setValue(current + 1);

    const log = ss.getSheetByName(SHEET_LOG);
    if (log) log.appendRow([new Date(), String(current), device]);

    return { ok: true, invoiceNo: String(current) };
  } finally {
    lock.releaseLock();
  }
}
