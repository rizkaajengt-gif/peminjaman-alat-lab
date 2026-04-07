import { Router } from "express";
import { db, jurusanTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const data = await db.query.jurusanTable.findMany({ orderBy: (t, { asc }) => [asc(t.nama)] });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, grupJurusan } = req.body;
    if (!nama || !kode) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(jurusanTable).values({ nama, kode, grupJurusan: grupJurusan?.trim() || null }).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, grupJurusan } = req.body;
    const [item] = await db.update(jurusanTable).set({ nama, kode, grupJurusan: grupJurusan?.trim() || null, updatedAt: new Date() }).where(eq(jurusanTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Jurusan tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    await db.delete(jurusanTable).where(eq(jurusanTable.id, Number(req.params.id)));
    res.json({ message: "Jurusan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
