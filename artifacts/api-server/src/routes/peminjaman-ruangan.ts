import { Router } from "express";
import { db, peminjamanRuanganTable, usersTable } from "@workspace/db";
import { eq, and, inArray, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";
import { getPlpLabIds } from "../lib/plp-labs.js";
import { kirimNotifWa, formatPesanPeminjamanRuangan } from "../lib/notifikasi.js";

const router = Router();

function generateNo(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}/${year}/${month}/${rand}`;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, userId, laboratoriumId } = req.query;
    const conditions: SQL[] = [];

    if (req.user!.role === "mahasiswa" || req.user!.role === "dosen") {
      conditions.push(eq(peminjamanRuanganTable.userId, req.user!.id));
    } else if (req.user!.role === "plp") {
      const labIds = await getPlpLabIds(req.user!.id);
      if (labIds.length > 0) {
        conditions.push(inArray(peminjamanRuanganTable.laboratoriumId, labIds));
      }
      if (userId) conditions.push(eq(peminjamanRuanganTable.userId, Number(userId)));
    } else if (userId) {
      conditions.push(eq(peminjamanRuanganTable.userId, Number(userId)));
    }

    if (status) conditions.push(eq(peminjamanRuanganTable.status, status as any));
    if (laboratoriumId) conditions.push(eq(peminjamanRuanganTable.laboratoriumId, Number(laboratoriumId)));

    const data = await db.query.peminjamanRuanganTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { user: { with: { jurusan: true } }, laboratorium: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { laboratoriumId, tanggalMulai, tanggalSelesai, waktuMulai, waktuSelesai, keperluan, kategori, judulKegiatan, jumlahPeserta } = req.body;
    if (!laboratoriumId || !tanggalMulai || !tanggalSelesai || !waktuMulai || !waktuSelesai || !keperluan || !kategori) {
      res.status(400).json({ message: "Data tidak lengkap" }); return;
    }
    const noPeminjaman = generateNo("PR");
    const [item] = await db.insert(peminjamanRuanganTable).values({
      noPeminjaman, userId: req.user!.id, laboratoriumId,
      tanggalMulai, tanggalSelesai, waktuMulai, waktuSelesai,
      keperluan, kategori: (kategori || "pembelajaran") as any,
      judulKegiatan: judulKegiatan || null,
      jumlahPeserta: jumlahPeserta || 1, status: "menunggu",
    }).returning();
    const result = await db.query.peminjamanRuanganTable.findFirst({
      where: eq(peminjamanRuanganTable.id, item.id),
      with: { user: true, laboratorium: true },
    });

    // Notif WA ke semua PLP aktif yang punya callmebotKey (non-blocking)
    const plps = await db.query.usersTable.findMany({
      where: (u, { eq, and }) => and(eq(u.role, "plp"), eq(u.status, "aktif")),
    });
    for (const plp of plps) {
      if (plp.noWa && plp.callmebotKey) {
        kirimNotifWa(plp.noWa, plp.callmebotKey, formatPesanPeminjamanRuangan({
          noPeminjaman, namaPeminjam: result?.user?.nama || "-",
          laboratorium: result?.laboratorium?.nama || "-",
          kategori: kategori || "pembelajaran",
          judulKegiatan: judulKegiatan || null,
          tanggalMulai,
        })).catch(() => {});
      }
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/jadwal", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { laboratoriumId } = req.query;
    const conditions: SQL[] = [
      eq(peminjamanRuanganTable.status, "disetujui" as any),
    ];
    if (laboratoriumId) conditions.push(eq(peminjamanRuanganTable.laboratoriumId, Number(laboratoriumId)));

    const data = await db.query.peminjamanRuanganTable.findMany({
      where: and(...conditions),
      with: { user: { with: { jurusan: true } }, laboratorium: true },
      orderBy: (t, { asc }) => [asc(t.tanggalMulai)],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await db.query.peminjamanRuanganTable.findFirst({
      where: eq(peminjamanRuanganTable.id, Number(req.params.id)),
      with: { user: { with: { jurusan: true } }, laboratorium: { with: { jurusan: true } } },
    });
    if (!item) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { status, catatan } = req.body;
    if (!status) { res.status(400).json({ message: "Status wajib diisi" }); return; }
    const [updated] = await db.update(peminjamanRuanganTable)
      .set({ status: status as any, catatanPlp: catatan || null, verifikasiOleh: req.user!.id, updatedAt: new Date() })
      .where(eq(peminjamanRuanganTable.id, Number(req.params.id))).returning();
    if (!updated) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    const result = await db.query.peminjamanRuanganTable.findFirst({
      where: eq(peminjamanRuanganTable.id, updated.id),
      with: { user: true, laboratorium: true },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
