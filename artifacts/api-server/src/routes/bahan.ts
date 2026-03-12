import { Router } from "express";
import { db, bahanTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { laboratoriumId, search } = req.query;
    const conditions: SQL[] = [];
    if (laboratoriumId) conditions.push(eq(bahanTable.laboratoriumId, Number(laboratoriumId)));
    let data = await db.query.bahanTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { laboratorium: { with: { jurusan: true } } },
    });
    if (search) {
      const s = (search as string).toLowerCase();
      data = data.filter(b => b.nama.toLowerCase().includes(s) || b.kode.toLowerCase().includes(s));
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin", "gudang"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, stok, stokMinimal, satuan, laboratoriumId } = req.body;
    if (!nama || !kode || !laboratoriumId) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(bahanTable).values({ nama, kode, deskripsi: deskripsi || null, stok: stok || 0, stokMinimal: stokMinimal || 0, satuan: satuan || "unit", laboratoriumId }).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "gudang"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, stok, stokMinimal, satuan, laboratoriumId } = req.body;
    const [item] = await db.update(bahanTable)
      .set({ nama, kode, deskripsi: deskripsi || null, stok, stokMinimal, satuan, laboratoriumId, updatedAt: new Date() })
      .where(eq(bahanTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Bahan tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "gudang"), async (req: AuthRequest, res) => {
  try {
    await db.delete(bahanTable).where(eq(bahanTable.id, Number(req.params.id)));
    res.json({ message: "Bahan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
