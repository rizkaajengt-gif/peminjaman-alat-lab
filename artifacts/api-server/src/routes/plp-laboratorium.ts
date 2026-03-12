import { Router } from "express";
import { db, plpLaboratoriumTable, usersTable, laboratoriumTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

// GET all assignments, or by plpId / laboratoriumId
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { plpId, laboratoriumId } = req.query;
    let data = await db.query.plpLaboratoriumTable.findMany({
      where: plpId
        ? eq(plpLaboratoriumTable.plpId, Number(plpId))
        : laboratoriumId
          ? eq(plpLaboratoriumTable.laboratoriumId, Number(laboratoriumId))
          : undefined,
      with: {
        plp: { columns: { id: true, nama: true, email: true, nip: true } },
        laboratorium: { columns: { id: true, nama: true, kode: true, lokasi: true } },
      },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Assign PLP to lab
router.post("/", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { plpId, laboratoriumId } = req.body;
    if (!plpId || !laboratoriumId) {
      res.status(400).json({ message: "plpId dan laboratoriumId wajib diisi" }); return;
    }
    // Check PLP exists and is role=plp
    const plp = await db.query.usersTable.findFirst({ where: eq(usersTable.id, Number(plpId)) });
    if (!plp || plp.role !== "plp") {
      res.status(400).json({ message: "User yang dipilih bukan PLP" }); return;
    }
    const [item] = await db.insert(plpLaboratoriumTable)
      .values({ plpId: Number(plpId), laboratoriumId: Number(laboratoriumId) })
      .onConflictDoNothing()
      .returning();
    const result = await db.query.plpLaboratoriumTable.findFirst({
      where: eq(plpLaboratoriumTable.id, item?.id || 0),
      with: { plp: true, laboratorium: true },
    });
    res.status(201).json(result || item);
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(400).json({ message: "PLP sudah ditugaskan ke laboratorium ini" }); return;
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Remove PLP from lab
router.delete("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    await db.delete(plpLaboratoriumTable).where(eq(plpLaboratoriumTable.id, Number(req.params.id)));
    res.json({ message: "Penugasan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get labs assigned to current PLP
router.get("/my-labs", requireAuth, requireRole("plp"), async (req: AuthRequest, res) => {
  try {
    const assignments = await db.query.plpLaboratoriumTable.findMany({
      where: eq(plpLaboratoriumTable.plpId, req.user!.id),
      with: { laboratorium: { with: { jurusan: true } } },
    });
    res.json(assignments.map(a => a.laboratorium));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
