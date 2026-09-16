/**
 * Layanan notifikasi WhatsApp via Callmebot (gratis)
 * Cara aktivasi untuk setiap PLP:
 * 1. Simpan nomor +34 644 44 53 84 di WA
 * 2. Kirim pesan: "I allow callmebot to send me messages"
 * 3. Simpan API key yang diterima ke profil akun SIPELAB
 */

export async function kirimNotifWa(noWa: string, callmebotKey: string, pesan: string): Promise<boolean> {
  if (!noWa || !callmebotKey) return false;
  try {
    const encoded = encodeURIComponent(pesan);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${noWa}&text=${encoded}&apikey=${callmebotKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch (e) {
    console.error("[Notif WA] Gagal kirim ke", noWa, ":", e);
    return false;
  }
}

export function formatPesanPermintaanBahan(opts: {
  noPermintaan: string;
  namaPemohon: string;
  keperluan: string;
  jumlahItem: number;
  tanggalDibutuhkan: string;
}): string {
  return `🔔 *SIPELAB - Permintaan Bahan Baru*\n\nNo: ${opts.noPermintaan}\nPemohon: ${opts.namaPemohon}\nKeperluan: ${opts.keperluan}\nJumlah item: ${opts.jumlahItem} bahan\nTgl dibutuhkan: ${opts.tanggalDibutuhkan}\n\nSilakan verifikasi di SIPELAB.`;
}

export function formatPesanPeminjamanAlat(opts: {
  noPeminjaman: string;
  namaPeminjam: string;
  laboratorium: string;
  keperluan: string;
  tanggalPinjam: string;
}): string {
  return `🔔 *SIPELAB - Pengajuan Peminjaman Alat*\n\nNo: ${opts.noPeminjaman}\nPeminjam: ${opts.namaPeminjam}\nLaboratorium: ${opts.laboratorium}\nKeperluan: ${opts.keperluan}\nTgl pinjam: ${opts.tanggalPinjam}\n\nSilakan verifikasi di SIPELAB.`;
}

export function formatPesanStatusPeminjaman(opts: {
  jenis: "alat" | "phantom" | "ruangan";
  noPeminjaman: string;
  namaPeminjam: string;
  status: string;
  catatan?: string | null;
  laboratorium?: string;
}): string {
  const statusLabel: Record<string, string> = {
    disetujui: "✅ DISETUJUI",
    ditolak: "❌ DITOLAK",
    dipinjam: "📦 DIPINJAM",
    dikembalikan: "✔️ DIKEMBALIKAN",
  };
  const jenisLabel: Record<string, string> = {
    alat: "Peminjaman Alat",
    phantom: "Peminjaman Phantom",
    ruangan: "Peminjaman Ruangan",
  };
  const label = statusLabel[opts.status] || opts.status.toUpperCase();
  let msg = `🔔 *SIPELAB - Update ${jenisLabel[opts.jenis]}*\n\nNo: ${opts.noPeminjaman}\nPeminjam: ${opts.namaPeminjam}\nStatus: ${label}`;
  if (opts.laboratorium) msg += `\nLaboratorium: ${opts.laboratorium}`;
  if (opts.catatan) msg += `\nCatatan PLP: ${opts.catatan}`;
  msg += `\n\nSilakan cek riwayat di SIPELAB untuk detail lengkap.`;
  return msg;
}

export function formatPesanReminderPengembalian(opts: {
  jenis: "alat" | "phantom";
  noPeminjaman: string;
  namaPeminjam: string;
  laboratorium?: string | null;
  tanggalKembali: string;
}): string {
  const jenisLabel = opts.jenis === "alat" ? "alat" : "phantom";
  return `⏰ *SIPELAB - Pengingat Pengembalian*\n\nHalo ${opts.namaPeminjam}, peminjaman ${jenisLabel} dengan nomor ${opts.noPeminjaman} jatuh tempo besok (${opts.tanggalKembali}).${opts.laboratorium ? `\nLaboratorium: ${opts.laboratorium}` : ""}\n\nMohon siapkan dan kembalikan sesuai prosedur SIPELAB.`;
}

export function formatPesanPeminjamanRuangan(opts: {
  noPeminjaman: string;
  namaPeminjam: string;
  laboratorium: string;
  kategori: string;
  judulKegiatan: string | null;
  tanggalMulai: string;
}): string {
  const katLabel: Record<string, string> = {
    pembelajaran: "Pembelajaran/Praktikum",
    penelitian: "Penelitian",
    pengabdian_masyarakat: "Pengabdian Masyarakat",
  };
  return `🔔 *SIPELAB - Permohonan Peminjaman Ruangan*\n\nNo: ${opts.noPeminjaman}\nPemohon: ${opts.namaPeminjam}\nLaboratorium: ${opts.laboratorium}\nKategori: ${katLabel[opts.kategori] || opts.kategori}\n${opts.judulKegiatan ? `Judul: ${opts.judulKegiatan}\n` : ""}Tanggal: ${opts.tanggalMulai}\n\nSilakan verifikasi di SIPELAB.`;
}
