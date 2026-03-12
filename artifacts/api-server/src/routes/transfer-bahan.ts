import { Router } from "express";
import { db, transferBahanPlpTable, bahanTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

// GET - PLP sees their own requests; Gudang sees all pending; Admin sees all
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    let data = await db.query.transferBahanPlpTable.findMany({
      orderBy: desc(transferBahanPlpTable.createdAt),
      with: {
        bahan: { with: { laboratorium: true } },
        laboratorium: true,
        dimintaOleh: { columns: { id: true, nama: true, email: true } },
        disetujuiOleh: { columns: { id: true, nama: true } },
      },
    });

    // PLP only sees their own lab's requests
    if (role === "plp") {
      data = data.filter((t: any) => t.dimintaOleh?.id === req.user!.id);
    }

    res.json(data);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// POST - PLP requests stock transfer from gudang
router.post("/", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { bahanId, laboratoriumId, jumlah, catatanPlp } = req.body;
    if (!bahanId || !laboratoriumId || !jumlah || jumlah <= 0) {
      res.status(400).json({ message: "Data tidak lengkap atau jumlah tidak valid" }); return;
    }

    // Check gudang stock
    const bahan = await db.query.bahanTable.findFirst({ where: eq(bahanTable.id, Number(bahanId)) });
    if (!bahan) { res.status(404).json({ message: "Bahan tidak ditemukan" }); return; }
    if (bahan.stokGudang < Number(jumlah)) {
      res.status(400).json({ message: `Stok gudang tidak cukup. Stok tersedia: ${bahan.stokGudang} ${bahan.satuan}` }); return;
    }

    const [transfer] = await db.insert(transferBahanPlpTable).values({
      bahanId: Number(bahanId),
      laboratoriumId: Number(laboratoriumId),
      jumlah: Number(jumlah),
      status: "menunggu",
      catatanPlp: catatanPlp || null,
      dimintaOleh: req.user!.id,
    }).returning();

    const result = await db.query.transferBahanPlpTable.findFirst({
      where: eq(transferBahanPlpTable.id, transfer.id),
      with: { bahan: true, laboratorium: true, dimintaOleh: { columns: { id: true, nama: true } } },
    });
    res.status(201).json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /:id/approve - Gudang menyetujui atau menolak transfer
router.put("/:id/approve", requireAuth, requireRole("gudang", "admin"), async (req: AuthRequest, res) => {
  try {
    const { status, catatanGudang } = req.body;
    if (!["disetujui", "ditolak"].includes(status)) {
      res.status(400).json({ message: "Status tidak valid" }); return;
    }

    const transfer = await db.query.transferBahanPlpTable.findFirst({
      where: eq(transferBahanPlpTable.id, Number(req.params.id)),
    });
    if (!transfer) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    if (transfer.status !== "menunggu") { res.status(400).json({ message: "Transfer sudah diproses" }); return; }

    if (status === "disetujui") {
      const bahan = await db.query.bahanTable.findFirst({ where: eq(bahanTable.id, transfer.bahanId) });
      if (!bahan) { res.status(404).json({ message: "Bahan tidak ditemukan" }); return; }
      if (bahan.stokGudang < transfer.jumlah) {
        res.status(400).json({ message: `Stok gudang tidak mencukupi. Tersedia: ${bahan.stokGudang} ${bahan.satuan}` }); return;
      }
      // Deduct from gudang, add to PLP (stok)
      await db.update(bahanTable).set({
        stokGudang: bahan.stokGudang - transfer.jumlah,
        stok: bahan.stok + transfer.jumlah,
        updatedAt: new Date(),
      }).where(eq(bahanTable.id, transfer.bahanId));
    }

    const [updated] = await db.update(transferBahanPlpTable).set({
      status,
      catatanGudang: catatanGudang || null,
      disetujuiOleh: req.user!.id,
      updatedAt: new Date(),
    }).where(eq(transferBahanPlpTable.id, Number(req.params.id))).returning();

    const result = await db.query.transferBahanPlpTable.findFirst({
      where: eq(transferBahanPlpTable.id, updated.id),
      with: { bahan: { with: { laboratorium: true } }, laboratorium: true, dimintaOleh: { columns: { id: true, nama: true } }, disetujuiOleh: { columns: { id: true, nama: true } } },
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
