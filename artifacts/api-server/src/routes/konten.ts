import { Router } from "express";
import { db, beritaTable, galeriTable, dokumenTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

// Berita routes
router.get("/berita", async (req, res) => {
  try {
    const { kategori, search } = req.query;
    let data = await db.query.beritaTable.findMany({
      where: kategori ? eq(beritaTable.kategori, kategori as string) : undefined,
      with: { penulis: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    if (search) {
      const s = (search as string).toLowerCase();
      data = data.filter(b => b.judul.toLowerCase().includes(s));
    }
    res.json(data.map(b => { const { penulis, ...rest } = b; const { password: _, ...pWithout } = penulis || {} as any; return { ...rest, penulis: pWithout }; }));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/berita", requireAuth, requireRole("admin", "dosen", "plp"), async (req: AuthRequest, res) => {
  try {
    const { judul, konten, kategori, thumbnail } = req.body;
    if (!judul || !konten) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(beritaTable).values({ judul, konten, kategori: kategori || null, thumbnail: thumbnail || null, penulisId: req.user!.id }).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/berita/:id", async (req, res) => {
  try {
    const item = await db.query.beritaTable.findFirst({
      where: eq(beritaTable.id, Number(req.params.id)),
      with: { penulis: true },
    });
    if (!item) { res.status(404).json({ message: "Berita tidak ditemukan" }); return; }
    const { penulis, ...rest } = item;
    const { password: _, ...pWithout } = penulis || {} as any;
    res.json({ ...rest, penulis: pWithout });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/berita/:id", requireAuth, requireRole("admin", "dosen", "plp"), async (req: AuthRequest, res) => {
  try {
    const { judul, konten, kategori, thumbnail } = req.body;
    const [item] = await db.update(beritaTable)
      .set({ judul, konten, kategori: kategori || null, thumbnail: thumbnail || null, updatedAt: new Date() })
      .where(eq(beritaTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Berita tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/berita/:id", requireAuth, requireRole("admin", "dosen", "plp"), async (req: AuthRequest, res) => {
  try {
    await db.delete(beritaTable).where(eq(beritaTable.id, Number(req.params.id)));
    res.json({ message: "Berita berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Galeri routes
router.get("/galeri", async (req, res) => {
  try {
    const { tipe } = req.query;
    const data = await db.query.galeriTable.findMany({
      where: tipe ? eq(galeriTable.tipe, tipe as any) : undefined,
      with: { uploader: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    res.json(data.map(g => { const { uploader, ...rest } = g; const { password: _, ...uWithout } = uploader || {} as any; return { ...rest, uploader: uWithout }; }));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/galeri", requireAuth, requireRole("admin", "dosen", "plp"), async (req: AuthRequest, res) => {
  try {
    const { judul, deskripsi, tipe, url } = req.body;
    if (!judul || !url) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(galeriTable).values({ judul, deskripsi: deskripsi || null, tipe: tipe || "foto", url, uploaderId: req.user!.id }).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/galeri/:id", requireAuth, requireRole("admin", "dosen", "plp"), async (req: AuthRequest, res) => {
  try {
    const { judul, deskripsi, tipe, url } = req.body;
    if (!judul || !url || !["foto", "video"].includes(tipe)) { res.status(400).json({ message: "Judul, tipe, dan URL wajib diisi" }); return; }
    const [item] = await db.update(galeriTable)
      .set({ judul, deskripsi: deskripsi || null, tipe, url })
      .where(eq(galeriTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Galeri tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/galeri/:id", requireAuth, requireRole("admin", "dosen", "plp"), async (req: AuthRequest, res) => {
  try {
    await db.delete(galeriTable).where(eq(galeriTable.id, Number(req.params.id)));
    res.json({ message: "Galeri berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Dokumen routes
router.get("/dokumen", async (req, res) => {
  try {
    const { laboratoriumId } = req.query;
    const data = await db.query.dokumenTable.findMany({
      where: laboratoriumId ? eq(dokumenTable.laboratoriumId, Number(laboratoriumId)) : undefined,
      with: { uploader: true, laboratorium: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    res.json(data.map(d => { const { uploader, ...rest } = d; const { password: _, ...uWithout } = uploader || {} as any; return { ...rest, uploader: uWithout }; }));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/dokumen", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, deskripsi, url, tipe, laboratoriumId } = req.body;
    if (!nama || !url) { res.status(400).json({ message: "Data tidak lengkap" }); return; }
    const [item] = await db.insert(dokumenTable).values({ nama, deskripsi: deskripsi || null, url, tipe: tipe || null, laboratoriumId: laboratoriumId || null, uploaderId: req.user!.id }).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/dokumen/:id", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { nama, deskripsi, url, tipe, laboratoriumId } = req.body;
    if (!nama || !url) { res.status(400).json({ message: "Nama dan URL wajib diisi" }); return; }
    const [item] = await db.update(dokumenTable)
      .set({ nama, deskripsi: deskripsi || null, url, tipe: tipe || null, laboratoriumId: laboratoriumId || null })
      .where(eq(dokumenTable.id, Number(req.params.id))).returning();
    if (!item) { res.status(404).json({ message: "Dokumen tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/dokumen/:id", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    await db.delete(dokumenTable).where(eq(dokumenTable.id, Number(req.params.id)));
    res.json({ message: "Dokumen berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
