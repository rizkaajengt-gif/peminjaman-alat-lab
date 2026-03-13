import { Router } from "express";
import { db, peminjamanPhantomTable, peminjamanPhantomItemTable, phantomTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

function generateNoPeminjaman(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PP/${year}/${month}/${rand}`;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, userId } = req.query;
    const conditions: SQL[] = [];

    const nonAdminRoles = ["mahasiswa", "dosen"];
    if (nonAdminRoles.includes(req.user!.role)) {
      conditions.push(eq(peminjamanPhantomTable.userId, req.user!.id));
    } else if (userId) {
      conditions.push(eq(peminjamanPhantomTable.userId, Number(userId)));
    }

    if (status) conditions.push(eq(peminjamanPhantomTable.status, status as any));

    const data = await db.query.peminjamanPhantomTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: { with: { jurusan: true } },
        laboratorium: true,
        items: { with: { phantom: true } },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    res.json(data);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { laboratoriumId, tanggalPinjam, jamPinjam, tanggalKembali, jamKembali, keperluan, items } = req.body;
    if (!tanggalPinjam || !tanggalKembali || !keperluan || !items?.length) {
      res.status(400).json({ message: "Data tidak lengkap" }); return;
    }

    const noPeminjaman = generateNoPeminjaman();
    const [peminjaman] = await db.insert(peminjamanPhantomTable).values({
      noPeminjaman, userId: req.user!.id,
      laboratoriumId: laboratoriumId || null,
      tanggalPinjam, jamPinjam: jamPinjam || null,
      tanggalKembali, jamKembali: jamKembali || null,
      keperluan, status: "menunggu",
    }).returning();

    for (const item of items) {
      await db.insert(peminjamanPhantomItemTable).values({
        peminjamanId: peminjaman.id, phantomId: item.phantomId, jumlah: item.jumlah,
      });
    }

    const result = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, peminjaman.id),
      with: { user: true, laboratorium: true, items: { with: { phantom: true } } },
    });
    res.status(201).json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, Number(req.params.id)),
      with: { user: { with: { jurusan: true } }, laboratorium: true, items: { with: { phantom: true } }, verifikator: true },
    });
    if (!item) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.json(item);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { status, catatan, kondisiKembali } = req.body;
    if (!status) { res.status(400).json({ message: "Status wajib diisi" }); return; }

    const peminjaman = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, Number(req.params.id)),
      with: { items: true },
    });
    if (!peminjaman) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }

    if (status === "disetujui" || status === "dipinjam") {
      for (const item of peminjaman.items) {
        const ph = await db.query.phantomTable.findFirst({ where: eq(phantomTable.id, item.phantomId) });
        if (ph) {
          await db.update(phantomTable).set({ stokTersedia: Math.max(0, ph.stokTersedia - item.jumlah) }).where(eq(phantomTable.id, item.phantomId));
        }
      }
    }

    if (status === "dikembalikan") {
      for (const item of peminjaman.items) {
        const ph = await db.query.phantomTable.findFirst({ where: eq(phantomTable.id, item.phantomId) });
        if (ph) {
          await db.update(phantomTable).set({ stokTersedia: ph.stokTersedia + item.jumlah }).where(eq(phantomTable.id, item.phantomId));
        }
      }
    }

    await db.update(peminjamanPhantomTable).set({
      status,
      catatanPlp: catatan || null,
      verifikasiOleh: req.user!.id,
      updatedAt: new Date(),
      tanggalDikembalikan: status === "dikembalikan" ? new Date().toISOString().split("T")[0] : undefined,
      kondisiKembali: status === "dikembalikan" ? (kondisiKembali || null) : undefined,
      requestKembali: status === "dikembalikan" ? "selesai" : undefined,
    }).where(eq(peminjamanPhantomTable.id, Number(req.params.id)));

    const result = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, Number(req.params.id)),
      with: { user: true, laboratorium: true, items: { with: { phantom: true } } },
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/request-kembali", requireAuth, async (req: AuthRequest, res) => {
  try {
    const peminjaman = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, Number(req.params.id)),
    });
    if (!peminjaman) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    if (peminjaman.userId !== req.user!.id && !["plp", "admin"].includes(req.user!.role)) {
      res.status(403).json({ message: "Tidak diizinkan" }); return;
    }
    if (peminjaman.status !== "dipinjam" && peminjaman.status !== "disetujui") { res.status(400).json({ message: "Hanya bisa mengajukan pengembalian saat status disetujui/dipinjam" }); return; }

    const [updated] = await db.update(peminjamanPhantomTable)
      .set({ requestKembali: "menunggu", updatedAt: new Date() })
      .where(eq(peminjamanPhantomTable.id, Number(req.params.id))).returning();
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Edit items (update quantity, add new, delete)
router.put("/:id/items", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) { res.status(400).json({ message: "Data items tidak valid" }); return; }

    for (const item of items) {
      if (item.id && item.jumlah > 0) {
        await db.update(peminjamanPhantomItemTable)
          .set({ jumlah: item.jumlah })
          .where(and(eq(peminjamanPhantomItemTable.id, item.id), eq(peminjamanPhantomItemTable.peminjamanId, Number(req.params.id))));
      }
    }

    const result = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, Number(req.params.id)),
      with: { user: true, laboratorium: true, items: { with: { phantom: true } } },
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/items/add", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { phantomId, jumlah } = req.body;
    if (!phantomId || !jumlah) { res.status(400).json({ message: "phantomId dan jumlah wajib diisi" }); return; }

    await db.insert(peminjamanPhantomItemTable).values({
      peminjamanId: Number(req.params.id), phantomId: Number(phantomId), jumlah: Number(jumlah),
    });

    const result = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, Number(req.params.id)),
      with: { user: true, laboratorium: true, items: { with: { phantom: true } } },
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id/items/:itemId", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    await db.delete(peminjamanPhantomItemTable)
      .where(and(eq(peminjamanPhantomItemTable.id, Number(req.params.itemId)), eq(peminjamanPhantomItemTable.peminjamanId, Number(req.params.id))));

    const result = await db.query.peminjamanPhantomTable.findFirst({
      where: eq(peminjamanPhantomTable.id, Number(req.params.id)),
      with: { user: true, laboratorium: true, items: { with: { phantom: true } } },
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
