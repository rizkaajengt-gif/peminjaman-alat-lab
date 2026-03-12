import { Router } from "express";
import { db, laboratoriumTable, alatTable, bahanTable, usersTable, peminjamanAlatTable, peminjamanRuanganTable, permintaanBahanTable, plpLaboratoriumTable } from "@workspace/db";
import { eq, and, gte, lte, count, inArray } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

async function getPlpLabIds(userId: number): Promise<number[]> {
  const assignments = await db.query.plpLaboratoriumTable.findMany({
    where: eq(plpLaboratoriumTable.plpId, userId),
  });
  return assignments.map(a => a.laboratoriumId);
}

const router = Router();

router.get("/statistik", requireAuth, async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [labs] = await db.select({ count: count() }).from(laboratoriumTable);
    const [alat] = await db.select({ count: count() }).from(alatTable);
    const [bahan] = await db.select({ count: count() }).from(bahanTable);
    const [users] = await db.select({ count: count() }).from(usersTable);
    const [paMonth] = await db.select({ count: count() }).from(peminjamanAlatTable).where(gte(peminjamanAlatTable.tanggalPinjam, firstOfMonth));
    const [prMonth] = await db.select({ count: count() }).from(peminjamanRuanganTable).where(gte(peminjamanRuanganTable.tanggalMulai, firstOfMonth));
    const [pbMonth] = await db.select({ count: count() }).from(permintaanBahanTable).where(gte(permintaanBahanTable.tanggalDibutuhkan, firstOfMonth));
    const [paWaiting] = await db.select({ count: count() }).from(peminjamanAlatTable).where(eq(peminjamanAlatTable.status, "menunggu"));
    const [prWaiting] = await db.select({ count: count() }).from(peminjamanRuanganTable).where(eq(peminjamanRuanganTable.status, "menunggu"));
    const [pbWaiting] = await db.select({ count: count() }).from(permintaanBahanTable).where(eq(permintaanBahanTable.status, "menunggu"));

    res.json({
      totalLaboratorium: Number(labs.count),
      totalAlat: Number(alat.count),
      totalBahan: Number(bahan.count),
      totalUser: Number(users.count),
      peminjamanAlatBulanIni: Number(paMonth.count),
      peminjamanRuanganBulanIni: Number(prMonth.count),
      permintaanBahanBulanIni: Number(pbMonth.count),
      peminjamanAlatMenunggu: Number(paWaiting.count),
      peminjamanRuanganMenunggu: Number(prWaiting.count),
      permintaanBahanMenunggu: Number(pbWaiting.count),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/peminjaman", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { periode, tahun } = req.query;
    const year = Number(tahun) || new Date().getFullYear();

    const allPA = await db.select().from(peminjamanAlatTable);
    const allPR = await db.select().from(peminjamanRuanganTable);
    const allPB = await db.select().from(permintaanBahanTable);

    let dataAlat: any[] = [];
    let dataRuangan: any[] = [];
    let dataBahan: any[] = [];

    if (periode === "bulanan" || !periode) {
      for (let m = 1; m <= 12; m++) {
        const monthStr = String(m).padStart(2, "0");
        const prefix = `${year}-${monthStr}`;
        dataAlat.push({ tanggal: prefix, total: allPA.filter(p => p.tanggalPinjam?.startsWith(prefix)).length });
        dataRuangan.push({ tanggal: prefix, total: allPR.filter(p => p.tanggalMulai?.startsWith(prefix)).length });
        dataBahan.push({ tanggal: prefix, total: allPB.filter(p => p.tanggalDibutuhkan?.startsWith(prefix)).length });
      }
    } else if (periode === "tahunan") {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear - 4; y <= currentYear; y++) {
        dataAlat.push({ tanggal: String(y), total: allPA.filter(p => p.tanggalPinjam?.startsWith(String(y))).length });
        dataRuangan.push({ tanggal: String(y), total: allPR.filter(p => p.tanggalMulai?.startsWith(String(y))).length });
        dataBahan.push({ tanggal: String(y), total: allPB.filter(p => p.tanggalDibutuhkan?.startsWith(String(y))).length });
      }
    } else if (periode === "harian") {
      const now = new Date();
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
        dataAlat.push({ tanggal: dayStr, total: allPA.filter(p => p.tanggalPinjam === dayStr).length });
        dataRuangan.push({ tanggal: dayStr, total: allPR.filter(p => p.tanggalMulai === dayStr).length });
        dataBahan.push({ tanggal: dayStr, total: allPB.filter(p => p.tanggalDibutuhkan === dayStr).length });
      }
    }

    res.json({
      periode: periode || "bulanan",
      totalPeminjamanAlat: allPA.length,
      totalPeminjamanRuangan: allPR.length,
      totalPermintaanBahan: allPB.length,
      dataAlat,
      dataRuangan,
      dataBahan,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Statistik per laboratorium: jam terpakai, jumlah transaksi per kategori
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), labId (number, optional)
 */
router.get("/statistik-plp", requireAuth, requireRole("plp"), async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const labIds = await getPlpLabIds(req.user!.id);
    if (!labIds.length) { res.json({ labIds: [], peminjamanAlatBulanIni: 0, peminjamanRuanganBulanIni: 0, permintaanBahanBulanIni: 0, menungguVerifikasi: 0 }); return; }

    const [paMonth] = await db.select({ count: count() }).from(peminjamanAlatTable)
      .where(and(gte(peminjamanAlatTable.tanggalPinjam, firstOfMonth), inArray(peminjamanAlatTable.laboratoriumId, labIds)));
    const [prMonth] = await db.select({ count: count() }).from(peminjamanRuanganTable)
      .where(and(gte(peminjamanRuanganTable.tanggalMulai, firstOfMonth), inArray(peminjamanRuanganTable.laboratoriumId, labIds)));
    const [pbMonth] = await db.select({ count: count() }).from(permintaanBahanTable)
      .where(and(gte(permintaanBahanTable.tanggalDibutuhkan, firstOfMonth), inArray(permintaanBahanTable.laboratoriumId, labIds)));
    const [paWaiting] = await db.select({ count: count() }).from(peminjamanAlatTable)
      .where(and(eq(peminjamanAlatTable.status, "menunggu"), inArray(peminjamanAlatTable.laboratoriumId, labIds)));
    const [prWaiting] = await db.select({ count: count() }).from(peminjamanRuanganTable)
      .where(and(eq(peminjamanRuanganTable.status, "menunggu"), inArray(peminjamanRuanganTable.laboratoriumId, labIds)));

    const labs = await db.query.laboratoriumTable.findMany({
      where: inArray(laboratoriumTable.id, labIds),
      with: { jurusan: true },
    });

    res.json({
      labIds,
      labs: labs.map(l => ({ id: l.id, nama: l.nama, jurusan: (l as any).jurusan?.nama || "-" })),
      peminjamanAlatBulanIni: Number(paMonth.count),
      peminjamanRuanganBulanIni: Number(prMonth.count),
      permintaanBahanBulanIni: Number(pbMonth.count),
      menungguVerifikasi: Number(paWaiting.count) + Number(prWaiting.count),
    });
  } catch (e: any) {
    res.status(500).json({ message: "Server error: " + e.message });
  }
});

router.get("/statistik-lab", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, labId } = req.query;
    const start = (startDate as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const end = (endDate as string) || new Date().toISOString().split("T")[0];

    let allowedLabIds: number[] | null = null;
    if (req.user!.role === "plp") {
      allowedLabIds = await getPlpLabIds(req.user!.id);
      if (!allowedLabIds.length) { res.json({ periode: { start, end }, labs: [], totalJamSeluruhLab: 0, totalTransaksiRuangan: 0, totalTransaksiAlat: 0 }); return; }
    }

    let labWhere: any = undefined;
    if (labId && labId !== "_all_") {
      const requestedId = Number(labId);
      if (allowedLabIds && !allowedLabIds.includes(requestedId)) {
        res.status(403).json({ message: "Lab ini bukan lab yang Anda tangani" }); return;
      }
      labWhere = eq(laboratoriumTable.id, requestedId);
    } else if (allowedLabIds) {
      labWhere = inArray(laboratoriumTable.id, allowedLabIds);
    }

    const labs = await db.query.laboratoriumTable.findMany({
      where: labWhere,
      with: { jurusan: true },
    });

    const allRuangan = await db.query.peminjamanRuanganTable.findMany({
      where: and(gte(peminjamanRuanganTable.tanggalMulai, start), lte(peminjamanRuanganTable.tanggalMulai, end)),
      with: { laboratorium: true },
    });

    const allAlat = await db.query.peminjamanAlatTable.findMany({
      where: and(gte(peminjamanAlatTable.tanggalPinjam, start), lte(peminjamanAlatTable.tanggalPinjam, end)),
      with: { laboratorium: true },
    });

    function hitungJam(waktuMulai: string, waktuSelesai: string, tanggalMulai: string, tanggalSelesai: string): number {
      try {
        const [h1, m1] = waktuMulai.split(":").map(Number);
        const [h2, m2] = waktuSelesai.split(":").map(Number);
        const d1 = new Date(tanggalMulai);
        const d2 = new Date(tanggalSelesai);
        const hariSelisih = Math.max(0, (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        const jamPerHari = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
        return Math.max(0, hariSelisih > 0 ? hariSelisih * 8 + jamPerHari : jamPerHari);
      } catch { return 0; }
    }

    const labStats = labs.map(lab => {
      const ruanganLab = allRuangan.filter(r => r.laboratoriumId === lab.id && r.status !== "ditolak");
      const alatLab = allAlat.filter(a => a.laboratoriumId === lab.id && a.status !== "ditolak");

      const totalJam = ruanganLab.reduce((sum, r) => {
        return sum + hitungJam(r.waktuMulai || "08:00", r.waktuSelesai || "09:00", r.tanggalMulai, r.tanggalSelesai);
      }, 0);

      const perKategori = {
        pembelajaran: ruanganLab.filter(r => (r as any).kategori === "pembelajaran"),
        penelitian: ruanganLab.filter(r => (r as any).kategori === "penelitian"),
        pengabdian_masyarakat: ruanganLab.filter(r => (r as any).kategori === "pengabdian_masyarakat"),
      };

      const jamPerKategori = {
        pembelajaran: perKategori.pembelajaran.reduce((s, r) => s + hitungJam(r.waktuMulai || "08:00", r.waktuSelesai || "09:00", r.tanggalMulai, r.tanggalSelesai), 0),
        penelitian: perKategori.penelitian.reduce((s, r) => s + hitungJam(r.waktuMulai || "08:00", r.waktuSelesai || "09:00", r.tanggalMulai, r.tanggalSelesai), 0),
        pengabdian_masyarakat: perKategori.pengabdian_masyarakat.reduce((s, r) => s + hitungJam(r.waktuMulai || "08:00", r.waktuSelesai || "09:00", r.tanggalMulai, r.tanggalSelesai), 0),
      };

      return {
        laboratorium: { id: lab.id, nama: lab.nama, jurusan: (lab as any).jurusan?.nama || "-" },
        totalPeminjamanRuangan: ruanganLab.length,
        totalPeminjamanAlat: alatLab.length,
        totalJamTerpakai: Math.round(totalJam * 10) / 10,
        perKategori: {
          pembelajaran: { jumlah: perKategori.pembelajaran.length, jam: Math.round(jamPerKategori.pembelajaran * 10) / 10 },
          penelitian: { jumlah: perKategori.penelitian.length, jam: Math.round(jamPerKategori.penelitian * 10) / 10 },
          pengabdian_masyarakat: { jumlah: perKategori.pengabdian_masyarakat.length, jam: Math.round(jamPerKategori.pengabdian_masyarakat * 10) / 10 },
        },
      };
    });

    res.json({
      periode: { start, end },
      labs: labStats,
      totalJamSeluruhLab: Math.round(labStats.reduce((s, l) => s + l.totalJamTerpakai, 0) * 10) / 10,
      totalTransaksiRuangan: labStats.reduce((s, l) => s + l.totalPeminjamanRuangan, 0),
      totalTransaksiAlat: labStats.reduce((s, l) => s + l.totalPeminjamanAlat, 0),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Export CSV statistik lab per rentang waktu
 */
router.get("/statistik-lab/export", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, labId } = req.query;
    const start = (startDate as string) || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    const end = (endDate as string) || new Date().toISOString().split("T")[0];

    let allowedLabIds: number[] | null = null;
    if (req.user!.role === "plp") {
      allowedLabIds = await getPlpLabIds(req.user!.id);
    }

    const allRuangan = await db.query.peminjamanRuanganTable.findMany({
      where: and(gte(peminjamanRuanganTable.tanggalMulai, start), lte(peminjamanRuanganTable.tanggalMulai, end)),
      with: { laboratorium: true, user: { with: { jurusan: true } } },
    });

    let filtered = labId ? allRuangan.filter(r => r.laboratoriumId === Number(labId)) : allRuangan;
    if (allowedLabIds) filtered = filtered.filter(r => allowedLabIds!.includes(r.laboratoriumId!));

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const headers = ["No. Peminjaman", "Laboratorium", "Pemohon", "Jurusan Pemohon", "Kategori", "Judul Kegiatan", "Tanggal Mulai", "Tanggal Selesai", "Waktu Mulai", "Waktu Selesai", "Jumlah Peserta", "Keperluan", "Status"];
    const rows = filtered.map(r => [
      r.noPeminjaman, r.laboratorium?.nama || "", r.user?.nama || "",
      (r.user as any)?.jurusan?.nama || "",
      { pembelajaran: "Pembelajaran", penelitian: "Penelitian", pengabdian_masyarakat: "Pengabdian Masyarakat" }[(r as any).kategori] || (r as any).kategori || "",
      (r as any).judulKegiatan || "", r.tanggalMulai, r.tanggalSelesai,
      r.waktuMulai || "", r.waktuSelesai || "", String(r.jumlahPeserta), r.keperluan, r.status
    ]);

    const csv = [headers.map(escape), ...rows.map(r => r.map(escape))].map(r => r.join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=laporan_ruangan_${start}_${end}.csv`);
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ message: "Gagal export" });
  }
});

export default router;
