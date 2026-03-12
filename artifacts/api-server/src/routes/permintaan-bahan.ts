import { Router } from "express";
import { db, permintaanBahanTable, permintaanBahanItemTable, bahanTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

function generateNo(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}/${year}/${month}/${rand}`;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, userId } = req.query;
    const conditions: SQL[] = [];

    if (req.user!.role === "mahasiswa" || req.user!.role === "dosen" || req.user!.role === "plp") {
      conditions.push(eq(permintaanBahanTable.userId, req.user!.id));
    } else if (userId) {
      conditions.push(eq(permintaanBahanTable.userId, Number(userId)));
    }

    if (status) conditions.push(eq(permintaanBahanTable.status, status as any));

    const data = await db.query.permintaanBahanTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { user: { with: { jurusan: true } }, items: { with: { bahan: true } } },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { laboratoriumId, tanggalDibutuhkan, keperluan, items } = req.body;
    if (!tanggalDibutuhkan || !keperluan || !items?.length) {
      res.status(400).json({ message: "Data tidak lengkap" }); return;
    }
    const noPermintaan = generateNo("PB");
    const [permintaan] = await db.insert(permintaanBahanTable).values({
      noPermintaan, userId: req.user!.id, laboratoriumId: laboratoriumId || null,
      tanggalDibutuhkan, keperluan, status: "menunggu",
    }).returning();

    for (const item of items) {
      await db.insert(permintaanBahanItemTable).values({ permintaanId: permintaan.id, bahanId: item.bahanId, jumlahDiminta: item.jumlahDiminta });
    }

    const result = await db.query.permintaanBahanTable.findFirst({
      where: eq(permintaanBahanTable.id, permintaan.id),
      with: { user: true, items: { with: { bahan: true } } },
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await db.query.permintaanBahanTable.findFirst({
      where: eq(permintaanBahanTable.id, Number(req.params.id)),
      with: { user: { with: { jurusan: true } }, items: { with: { bahan: true } } },
    });
    if (!item) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", requireAuth, requireRole("gudang", "admin"), async (req: AuthRequest, res) => {
  try {
    const { status, catatan, jumlahDisetujui } = req.body;
    if (!status) { res.status(400).json({ message: "Status wajib diisi" }); return; }

    if (status === "disetujui" && jumlahDisetujui) {
      for (const jd of jumlahDisetujui) {
        await db.update(permintaanBahanItemTable)
          .set({ jumlahDisetujui: jd.jumlah })
          .where(eq(permintaanBahanItemTable.id, jd.itemId));
      }
    }

    if (status === "disiapkan") {
      const permintaan = await db.query.permintaanBahanTable.findFirst({
        where: eq(permintaanBahanTable.id, Number(req.params.id)),
        with: { items: true },
      });
      if (permintaan) {
        for (const item of permintaan.items) {
          const bahan = await db.query.bahanTable.findFirst({ where: eq(bahanTable.id, item.bahanId) });
          if (bahan) {
            const qty = item.jumlahDisetujui || item.jumlahDiminta;
            await db.update(bahanTable).set({ stok: Math.max(0, bahan.stok - qty) }).where(eq(bahanTable.id, item.bahanId));
          }
        }
      }
    }

    const [updated] = await db.update(permintaanBahanTable)
      .set({ status, catatanGudang: catatan || null, verifikasiOleh: req.user!.id, updatedAt: new Date() })
      .where(eq(permintaanBahanTable.id, Number(req.params.id))).returning();
    if (!updated) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    const result = await db.query.permintaanBahanTable.findFirst({
      where: eq(permintaanBahanTable.id, updated.id),
      with: { user: true, items: { with: { bahan: true } } },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
