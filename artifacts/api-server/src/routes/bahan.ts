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
      with: {
        laboratorium: { with: { jurusan: true } },
        penanggungjawab: { columns: { id: true, nama: true, email: true } },
      },
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

router.post("/", requireAuth, requireRole("admin", "gudang", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, stok, stokGudang, stokMinimal, satuan, laboratoriumId, penanggungjawabId } = req.body;
    if (!nama || !kode || !laboratoriumId) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(bahanTable).values({
      nama, kode, deskripsi: deskripsi || null, stok: stok || 0, stokGudang: stokGudang || 0, stokMinimal: stokMinimal || 0,
      satuan: satuan || "unit", laboratoriumId, penanggungjawabId: penanggungjawabId || null
    }).returning();
    const result = await db.query.bahanTable.findFirst({ where: eq(bahanTable.id, item.id), with: { laboratorium: true, penanggungjawab: { columns: { id: true, nama: true } } } });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "gudang", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, stok, stokGudang, stokMinimal, satuan, laboratoriumId, penanggungjawabId } = req.body;
    const updateSet: any = { nama, kode, deskripsi: deskripsi || null, stok, stokMinimal, satuan, laboratoriumId, penanggungjawabId: penanggungjawabId || null, updatedAt: new Date() };
    if (stokGudang !== undefined) updateSet.stokGudang = stokGudang;
    const [item] = await db.update(bahanTable)
      .set(updateSet)
      .where(eq(bahanTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Bahan tidak ditemukan" }); return; }
    const result = await db.query.bahanTable.findFirst({ where: eq(bahanTable.id, item.id), with: { laboratorium: true, penanggungjawab: { columns: { id: true, nama: true } } } });
    res.json(result);
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

// Import template download
router.get("/template", (req, res) => {
  const csv = "kode,nama,deskripsi,stok,stokMinimal,satuan,laboratoriumId,penanggungjawabId\nBH-001,Alkohol 70%,Bahan desinfektan,100,20,mL,1,\nBH-002,HCl 1M,Larutan asam klorida,50,10,mL,1,";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=template_bahan.csv");
  res.send(csv);
});

export default router;
