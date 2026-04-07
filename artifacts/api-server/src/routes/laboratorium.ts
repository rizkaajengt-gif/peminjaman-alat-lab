import { Router } from "express";
import { db, laboratoriumTable, jurusanTable } from "@workspace/db";
import { eq, and, inArray, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { jurusanId, grupJurusan } = req.query;
    const conditions: SQL[] = [];
    if (jurusanId) {
      conditions.push(eq(laboratoriumTable.jurusanId, Number(jurusanId)));
    } else if (grupJurusan) {
      const jurusanDalamGrup = await db.query.jurusanTable.findMany({
        where: eq(jurusanTable.grupJurusan, String(grupJurusan)),
        columns: { id: true },
      });
      const ids = jurusanDalamGrup.map(j => j.id);
      if (ids.length > 0) {
        conditions.push(inArray(laboratoriumTable.jurusanId, ids));
      } else {
        res.json([]);
        return;
      }
    }
    const data = await db.query.laboratoriumTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { jurusan: true },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, lokasi, kapasitas, jurusanId, deskripsi, fasilitas } = req.body;
    if (!nama || !kode || !lokasi) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(laboratoriumTable).values({ nama, kode, lokasi, kapasitas: kapasitas || 0, jurusanId: jurusanId || null, deskripsi: deskripsi || null, fasilitas: fasilitas || null }).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await db.query.laboratoriumTable.findFirst({
      where: eq(laboratoriumTable.id, Number(req.params.id)),
      with: { jurusan: true },
    });
    if (!item) { res.status(404).json({ message: "Laboratorium tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, lokasi, kapasitas, jurusanId, deskripsi, fasilitas } = req.body;
    const [item] = await db.update(laboratoriumTable)
      .set({ nama, kode, lokasi, kapasitas, jurusanId: jurusanId || null, deskripsi: deskripsi || null, fasilitas: fasilitas || null, updatedAt: new Date() })
      .where(eq(laboratoriumTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Laboratorium tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    await db.delete(laboratoriumTable).where(eq(laboratoriumTable.id, Number(req.params.id)));
    res.json({ message: "Laboratorium berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
