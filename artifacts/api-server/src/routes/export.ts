import { Router } from "express";
import { db, alatTable, bahanTable, usersTable, laboratoriumTable, peminjamanAlatTable, permintaanBahanTable, jurusanTable } from "@workspace/db";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape), ...rows.map(r => r.map(escape))].map(r => r.join(",")).join("\n");
}

// Export alat ke CSV
router.get("/alat", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const data = await db.query.alatTable.findMany({
      with: { laboratorium: { with: { jurusan: true } }, penanggungjawab: { columns: { id: true, nama: true } } },
    });
    const csv = toCsv(
      ["ID", "Kode", "Nama", "Kondisi", "Stok", "Stok Tersedia", "Satuan", "Laboratorium", "Jurusan", "Penanggung Jawab"],
      data.map(a => [
        String(a.id), a.kode, a.nama, a.kondisi, String(a.stok), String(a.stokTersedia), a.satuan,
        a.laboratorium?.nama || "", (a.laboratorium as any)?.jurusan?.nama || "",
        (a as any).penanggungjawab?.nama || ""
      ])
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=data_alat_${new Date().toISOString().slice(0,10)}.csv`);
    res.send("\uFEFF" + csv); // BOM for Excel
  } catch (e) {
    res.status(500).json({ message: "Gagal export" });
  }
});

// Export alat template CSV
router.get("/alat/template", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  const labs = await db.query.laboratoriumTable.findMany({ columns: { id: true, nama: true } });
  const plps = await db.query.usersTable.findMany({ where: (u, { eq }) => eq(u.role, "plp"), columns: { id: true, nama: true } });
  let info = `# Daftar Laboratorium:\n` + labs.map(l => `# ${l.id} = ${l.nama}`).join("\n");
  info += `\n# Daftar PLP (Penanggung Jawab):\n` + plps.map(p => `# ${p.id} = ${p.nama}`).join("\n");
  const csv = info + "\nkode,nama,deskripsi,kondisi,stok,satuan,laboratoriumId,penanggungjawabId\nAL-001,Mikroskop Binokuler,,baik,5,unit,1,\nAL-002,Spektrofotometer,,baik,2,unit,1,";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=template_import_alat.csv");
  res.send("\uFEFF" + csv);
});

// Export bahan ke CSV
router.get("/bahan", requireAuth, requireRole("admin", "gudang", "plp"), async (req: AuthRequest, res) => {
  try {
    const data = await db.query.bahanTable.findMany({
      with: { laboratorium: { with: { jurusan: true } }, penanggungjawab: { columns: { id: true, nama: true } } },
    });
    const csv = toCsv(
      ["ID", "Kode", "Nama", "Stok", "Stok Minimal", "Satuan", "Laboratorium", "Jurusan", "Penanggung Jawab"],
      data.map(b => [
        String(b.id), b.kode, b.nama, String(b.stok), String(b.stokMinimal), b.satuan,
        b.laboratorium?.nama || "", (b.laboratorium as any)?.jurusan?.nama || "",
        (b as any).penanggungjawab?.nama || ""
      ])
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=data_bahan_${new Date().toISOString().slice(0,10)}.csv`);
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ message: "Gagal export" });
  }
});

// Export bahan template
router.get("/bahan/template", requireAuth, requireRole("admin", "gudang", "plp"), async (req: AuthRequest, res) => {
  const labs = await db.query.laboratoriumTable.findMany({ columns: { id: true, nama: true } });
  let info = `# Daftar Laboratorium:\n` + labs.map(l => `# ${l.id} = ${l.nama}`).join("\n");
  const csv = info + "\nkode,nama,deskripsi,stok,stokMinimal,satuan,laboratoriumId,penanggungjawabId\nBH-001,Alkohol 70%,Bahan desinfektan,100,20,mL,1,\nBH-002,HCl 1M,,50,10,mL,1,";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=template_import_bahan.csv");
  res.send("\uFEFF" + csv);
});

// Export users ke CSV
router.get("/users", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const data = await db.query.usersTable.findMany({ with: { jurusan: true } });
    const csv = toCsv(
      ["ID", "Nama", "Email", "Peran", "NIM", "NIP", "No HP", "Jurusan", "Status"],
      data.map(u => [String(u.id), u.nama, u.email, u.role, u.nim || "", u.nip || "", u.noHp || "", (u as any).jurusan?.nama || "", u.status])
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=data_pengguna_${new Date().toISOString().slice(0,10)}.csv`);
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ message: "Gagal export" });
  }
});

// Export peminjaman alat
router.get("/peminjaman-alat", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const data = await db.query.peminjamanAlatTable.findMany({
      with: { user: { with: { jurusan: true } }, laboratorium: true, items: { with: { alat: true } } },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    const csv = toCsv(
      ["No. Peminjaman", "Nama Peminjam", "Jurusan", "Laboratorium", "Alat", "Tgl Pinjam", "Tgl Kembali", "Status", "Keperluan"],
      data.map(p => [
        p.noPeminjaman, p.user?.nama || "", (p.user as any)?.jurusan?.nama || "",
        p.laboratorium?.nama || "",
        p.items?.map((i: any) => `${i.alat?.nama}(${i.jumlah})`).join("; ") || "",
        p.tanggalPinjam, p.tanggalKembali, p.status, p.keperluan
      ])
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=laporan_peminjaman_alat_${new Date().toISOString().slice(0,10)}.csv`);
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ message: "Gagal export" });
  }
});

// Export permintaan bahan
router.get("/permintaan-bahan", requireAuth, requireRole("admin", "gudang", "plp"), async (req: AuthRequest, res) => {
  try {
    const data = await db.query.permintaanBahanTable.findMany({
      with: { user: { with: { jurusan: true } }, items: { with: { bahan: true } }, plp: { columns: { id: true, nama: true } } },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    const csv = toCsv(
      ["No. Permintaan", "Nama Pemohon", "Jurusan", "Tujuan", "PLP", "Bahan", "Tgl Dibutuhkan", "Status", "Keperluan"],
      data.map(p => [
        p.noPermintaan, p.user?.nama || "", (p.user as any)?.jurusan?.nama || "",
        p.tujuan || "gudang", (p as any).plp?.nama || "-",
        p.items?.map((i: any) => `${i.bahan?.nama}(${i.jumlahDiminta})`).join("; ") || "",
        p.tanggalDibutuhkan, p.status, p.keperluan
      ])
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=laporan_permintaan_bahan_${new Date().toISOString().slice(0,10)}.csv`);
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ message: "Gagal export" });
  }
});

export default router;
