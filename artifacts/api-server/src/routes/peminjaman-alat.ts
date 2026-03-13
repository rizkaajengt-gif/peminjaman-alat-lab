import { Router } from "express";
import { db, peminjamanAlatTable, peminjamanAlatItemTable, alatTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

function generateNoPeminjaman(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}/${year}/${month}/${rand}`;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, userId, laboratoriumId } = req.query;
    const conditions: SQL[] = [];

    if (req.user!.role === "mahasiswa") {
      conditions.push(eq(peminjamanAlatTable.userId, req.user!.id));
    } else if (userId) {
      conditions.push(eq(peminjamanAlatTable.userId, Number(userId)));
    }

    if (status) conditions.push(eq(peminjamanAlatTable.status, status as any));
    if (laboratoriumId) conditions.push(eq(peminjamanAlatTable.laboratoriumId, Number(laboratoriumId)));

    const data = await db.query.peminjamanAlatTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: { with: { jurusan: true } },
        laboratorium: true,
        items: { with: { alat: true } },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("mahasiswa", "dosen", "plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { laboratoriumId, tanggalPinjam, jamPinjam, tanggalKembali, jamKembali, keperluan, items } = req.body;
    if (!laboratoriumId || !tanggalPinjam || !tanggalKembali || !keperluan || !items?.length) {
      res.status(400).json({ message: "Data tidak lengkap" });
      return;
    }

    const noPeminjaman = generateNoPeminjaman("PA");
    const [peminjaman] = await db.insert(peminjamanAlatTable).values({
      noPeminjaman, userId: req.user!.id, laboratoriumId,
      tanggalPinjam, jamPinjam: jamPinjam || null,
      tanggalKembali, jamKembali: jamKembali || null,
      keperluan, status: "menunggu",
    }).returning();

    for (const item of items) {
      await db.insert(peminjamanAlatItemTable).values({ peminjamanId: peminjaman.id, alatId: item.alatId, jumlah: item.jumlah });
    }

    const result = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, peminjaman.id),
      with: { user: true, laboratorium: true, items: { with: { alat: true } } },
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
      with: { user: { with: { jurusan: true } }, laboratorium: true, items: { with: { alat: true } } },
    });
    if (!item) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { status, catatan } = req.body;
    if (!status) { res.status(400).json({ message: "Status wajib diisi" }); return; }

    const peminjaman = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
      with: { items: true },
    });
    if (!peminjaman) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }

    if (status === "disetujui" || status === "dipinjam") {
      for (const item of peminjaman.items) {
        const alat = await db.query.alatTable.findFirst({ where: eq(alatTable.id, item.alatId) });
        if (alat) {
          await db.update(alatTable).set({ stokTersedia: Math.max(0, alat.stokTersedia - item.jumlah) }).where(eq(alatTable.id, item.alatId));
        }
      }
    }

    if (status === "dikembalikan") {
      for (const item of peminjaman.items) {
        const alat = await db.query.alatTable.findFirst({ where: eq(alatTable.id, item.alatId) });
        if (alat) {
          await db.update(alatTable).set({ stokTersedia: alat.stokTersedia + item.jumlah }).where(eq(alatTable.id, item.alatId));
        }
      }
    }

    const { kondisiKembali } = req.body;
    const [updated] = await db.update(peminjamanAlatTable)
      .set({
        status,
        catatanPlp: catatan || null,
        verifikasiOleh: req.user!.id,
        updatedAt: new Date(),
        tanggalDikembalikan: status === "dikembalikan" ? new Date().toISOString().split("T")[0] : undefined,
        kondisiKembali: status === "dikembalikan" ? (kondisiKembali || null) : undefined,
        requestKembali: status === "dikembalikan" ? "selesai" : undefined,
      })
      .where(eq(peminjamanAlatTable.id, Number(req.params.id))).returning();

    const result = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, updated.id),
      with: { user: true, laboratorium: true, items: { with: { alat: true } } },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/request-kembali", requireAuth, async (req: AuthRequest, res) => {
  try {
    const peminjaman = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
    });
    if (!peminjaman) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    if (peminjaman.userId !== req.user!.id && !["plp", "admin"].includes(req.user!.role)) {
      res.status(403).json({ message: "Tidak diizinkan" }); return;
    }
    if (peminjaman.status !== "dipinjam") { res.status(400).json({ message: "Hanya bisa mengajukan pengembalian saat status dipinjam" }); return; }
    const [updated] = await db.update(peminjamanAlatTable)
      .set({ requestKembali: "menunggu", updatedAt: new Date() })
      .where(eq(peminjamanAlatTable.id, Number(req.params.id))).returning();
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Update jumlah item yang ada
router.put("/:id/items", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) { res.status(400).json({ message: "Data items tidak valid" }); return; }

    const peminjaman = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
    });
    if (!peminjaman) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    if (peminjaman.status !== "menunggu") { res.status(400).json({ message: "Hanya bisa diubah saat status menunggu" }); return; }

    for (const item of items) {
      if (item.id && item.jumlah > 0) {
        await db.update(peminjamanAlatItemTable)
          .set({ jumlah: item.jumlah })
          .where(and(eq(peminjamanAlatItemTable.id, item.id), eq(peminjamanAlatItemTable.peminjamanId, Number(req.params.id))));
      }
    }

    const result = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
      with: { user: true, laboratorium: true, items: { with: { alat: true } } },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Tambah item baru ke peminjaman (saat verifikasi)
router.post("/:id/items/add", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const { alatId, jumlah } = req.body;
    if (!alatId || !jumlah) { res.status(400).json({ message: "alatId dan jumlah wajib diisi" }); return; }

    const peminjaman = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
    });
    if (!peminjaman) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    if (peminjaman.status !== "menunggu") { res.status(400).json({ message: "Hanya bisa diubah saat status menunggu" }); return; }

    await db.insert(peminjamanAlatItemTable).values({
      peminjamanId: Number(req.params.id), alatId: Number(alatId), jumlah: Number(jumlah),
    });

    const result = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
      with: { user: true, laboratorium: true, items: { with: { alat: true } } },
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Hapus item dari peminjaman (saat verifikasi)
router.delete("/:id/items/:itemId", requireAuth, requireRole("plp", "admin"), async (req: AuthRequest, res) => {
  try {
    const peminjaman = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
    });
    if (!peminjaman) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    if (peminjaman.status !== "menunggu") { res.status(400).json({ message: "Hanya bisa diubah saat status menunggu" }); return; }

    await db.delete(peminjamanAlatItemTable)
      .where(and(eq(peminjamanAlatItemTable.id, Number(req.params.itemId)), eq(peminjamanAlatItemTable.peminjamanId, Number(req.params.id))));

    const result = await db.query.peminjamanAlatTable.findFirst({
      where: eq(peminjamanAlatTable.id, Number(req.params.id)),
      with: { user: true, laboratorium: true, items: { with: { alat: true } } },
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
