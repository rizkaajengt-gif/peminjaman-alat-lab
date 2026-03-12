import { Router } from "express";
import { db, alatTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { laboratoriumId, search } = req.query;
    const conditions: SQL[] = [];
    if (laboratoriumId) conditions.push(eq(alatTable.laboratoriumId, Number(laboratoriumId)));
    let data = await db.query.alatTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { laboratorium: { with: { jurusan: true } } },
    });
    if (search) {
      const s = (search as string).toLowerCase();
      data = data.filter(a => a.nama.toLowerCase().includes(s) || a.kode.toLowerCase().includes(s));
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, kondisi, stok, satuan, laboratoriumId } = req.body;
    if (!nama || !kode || !laboratoriumId) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(alatTable).values({ nama, kode, deskripsi: deskripsi || null, kondisi: kondisi || "baik", stok: stok || 0, stokTersedia: stok || 0, satuan: satuan || "unit", laboratoriumId }).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await db.query.alatTable.findFirst({
      where: eq(alatTable.id, Number(req.params.id)),
      with: { laboratorium: true },
    });
    if (!item) { res.status(404).json({ message: "Alat tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, kondisi, stok, satuan, laboratoriumId } = req.body;
    const [item] = await db.update(alatTable)
      .set({ nama, kode, deskripsi: deskripsi || null, kondisi, stok, stokTersedia: stok, satuan, laboratoriumId, updatedAt: new Date() })
      .where(eq(alatTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Alat tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    await db.delete(alatTable).where(eq(alatTable.id, Number(req.params.id)));
    res.json({ message: "Alat berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
