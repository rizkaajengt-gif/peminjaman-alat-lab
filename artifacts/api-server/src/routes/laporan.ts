import { Router } from "express";
import { db, laboratoriumTable, alatTable, bahanTable, usersTable, peminjamanAlatTable, peminjamanRuanganTable, permintaanBahanTable } from "@workspace/db";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

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

export default router;
