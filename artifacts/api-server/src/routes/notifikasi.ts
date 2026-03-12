import { Router } from "express";
import { db, notifikasiTable, usersTable } from "@workspace/db";
import { eq, desc, or, isNull } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const all = await db.query.notifikasiTable.findMany({
      orderBy: desc(notifikasiTable.createdAt),
      with: { createdBy: true },
    });
    const filtered = all.filter((n: any) => !n.targetRole || n.targetRole === role);
    res.json(filtered);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { judul, pesan, targetRole, targetJurusanId } = req.body;
    if (!judul || !pesan) { res.status(400).json({ message: "Judul dan pesan wajib diisi" }); return; }
    const [result] = await db.insert(notifikasiTable)
      .values({ judul, pesan, targetRole: targetRole || null, targetJurusanId: targetJurusanId || null, createdBy: req.user!.id })
      .returning();
    res.status(201).json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    await db.delete(notifikasiTable).where(eq(notifikasiTable.id, Number(req.params.id)));
    res.json({ message: "Notifikasi dihapus" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
