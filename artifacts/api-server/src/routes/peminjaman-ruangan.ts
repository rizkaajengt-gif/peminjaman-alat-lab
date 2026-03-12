import { Router } from "express";
import { db, peminjamanRuanganTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

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
    const { laboratoriumId, tanggalMulai, tanggalSelesai, waktuMulai, waktuSelesai, keperluan, jumlahPeserta } = req.body;
    if (!laboratoriumId || !tanggalMulai || !tanggalSelesai || !waktuMulai || !waktuSelesai || !keperluan) {
      res.status(400).json({ message: "Data tidak lengkap" }); return;
    }
    const noPeminjaman = generateNo("PR");
    const [item] = await db.insert(peminjamanRuanganTable).values({
      noPeminjaman, userId: req.user!.id, laboratoriumId,
      tanggalMulai, tanggalSelesai, waktuMulai, waktuSelesai,
      keperluan, jumlahPeserta: jumlahPeserta || 1, status: "menunggu",
    }).returning();
    const result = await db.query.peminjamanRuanganTable.findFirst({
      where: eq(peminjamanRuanganTable.id, item.id),
      with: { user: true, laboratorium: true },
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await db.query.peminjamanRuanganTable.findFirst({
      where: eq(peminjamanRuanganTable.id, Number(req.params.id)),
      with: { user: { with: { jurusan: true } }, laboratorium: true },
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
      .set({ status, catatanPlp: catatan || null, verifikasiOleh: req.user!.id, updatedAt: new Date() })
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
