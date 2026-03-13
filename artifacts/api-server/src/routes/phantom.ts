import { Router } from "express";
import { db, phantomTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { laboratoriumId } = req.query;
    const conditions: SQL[] = [];
    if (laboratoriumId) conditions.push(eq(phantomTable.laboratoriumId, Number(laboratoriumId)));

    const data = await db.query.phantomTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { laboratorium: true },
      orderBy: (t, { asc }) => [asc(t.nama)],
    });
    res.json(data);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, kondisi, stok, satuan, laboratoriumId } = req.body;
    if (!nama) { res.status(400).json({ message: "Nama wajib diisi" }); return; }

    const [data] = await db.insert(phantomTable).values({
      nama, kode, deskripsi: deskripsi || null, kondisi: kondisi || "baik",
      stok: stok || 0, stokTersedia: stok || 0, satuan: satuan || "unit",
      laboratoriumId: laboratoriumId || null,
    }).returning();

    const result = await db.query.phantomTable.findFirst({
      where: eq(phantomTable.id, data.id),
      with: { laboratorium: true },
    });
    res.status(201).json(result);
  } catch (err: any) {
    if (err?.code === "23505") { res.status(400).json({ message: "Kode phantom sudah digunakan" }); return; }
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, kode, deskripsi, kondisi, stok, stokTersedia, satuan, laboratoriumId } = req.body;
    await db.update(phantomTable).set({
      ...(nama && { nama }), ...(kode && { kode }),
      deskripsi: deskripsi ?? undefined, kondisi: kondisi ?? undefined,
      ...(stok !== undefined && { stok }),
      ...(stokTersedia !== undefined && { stokTersedia }),
      ...(satuan && { satuan }),
      laboratoriumId: laboratoriumId ?? undefined,
      updatedAt: new Date(),
    }).where(eq(phantomTable.id, Number(req.params.id)));

    const result = await db.query.phantomTable.findFirst({
      where: eq(phantomTable.id, Number(req.params.id)),
      with: { laboratorium: true },
    });
    res.json(result);
  } catch (err: any) {
    if (err?.code === "23505") { res.status(400).json({ message: "Kode phantom sudah digunakan" }); return; }
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    await db.delete(phantomTable).where(eq(phantomTable.id, Number(req.params.id)));
    res.json({ message: "Phantom berhasil dihapus" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
