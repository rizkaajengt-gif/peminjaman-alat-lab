import { Router } from "express";
import { db, permintaanBahanTable, permintaanBahanItemTable, bahanTable, plpLaboratoriumTable, usersTable } from "@workspace/db";
import { eq, and, or, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";
import { kirimNotifWa, formatPesanPermintaanBahan } from "../lib/notifikasi.js";

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
    const { status, tujuan } = req.query;
    const conditions: SQL[] = [];
    const role = req.user!.role;

    if (role === "mahasiswa" || role === "dosen") {
      // Own requests only
      conditions.push(eq(permintaanBahanTable.userId, req.user!.id));
    } else if (role === "plp") {
      // Requests directed to this PLP specifically
      conditions.push(eq(permintaanBahanTable.plpId, req.user!.id));
    } else if (role === "gudang") {
      // Requests directed to gudang
      conditions.push(eq(permintaanBahanTable.tujuan, "gudang"));
    }
    // admin sees all

    if (status) conditions.push(eq(permintaanBahanTable.status, status as any));
    if (tujuan) conditions.push(eq(permintaanBahanTable.tujuan, tujuan as any));

    const data = await db.query.permintaanBahanTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: { with: { jurusan: true } },
        laboratorium: true,
        plp: { columns: { id: true, nama: true, email: true } },
        items: { with: { bahan: { with: { laboratorium: true } } } },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { laboratoriumId, tujuan, plpId, tanggalDibutuhkan, keperluan, items } = req.body;
    if (!tanggalDibutuhkan || !keperluan || !items?.length) {
      res.status(400).json({ message: "Data tidak lengkap" }); return;
    }
    const noPermintaan = generateNo("PB");
    const [permintaan] = await db.insert(permintaanBahanTable).values({
      noPermintaan,
      userId: req.user!.id,
      laboratoriumId: laboratoriumId || null,
      tujuan: (tujuan || "gudang") as any,
      plpId: tujuan === "plp" ? (plpId || null) : null,
      tanggalDibutuhkan,
      keperluan,
      status: "menunggu",
    }).returning();

    for (const item of items) {
      await db.insert(permintaanBahanItemTable).values({
        permintaanId: permintaan.id,
        bahanId: item.bahanId,
        jumlahDiminta: item.jumlahDiminta,
      });
    }

    const result = await db.query.permintaanBahanTable.findFirst({
      where: eq(permintaanBahanTable.id, permintaan.id),
      with: {
        user: true,
        laboratorium: true,
        plp: { columns: { id: true, nama: true, noWa: true, callmebotKey: true } },
        items: { with: { bahan: true } },
      },
    });

    // Kirim notif WA ke PLP yang dituju (non-blocking)
    const targetPlp = result?.plp as any;
    if (tujuan === "plp" && targetPlp?.noWa && targetPlp?.callmebotKey) {
      kirimNotifWa(targetPlp.noWa, targetPlp.callmebotKey, formatPesanPermintaanBahan({
        noPermintaan, namaPemohon: result?.user?.nama || "-",
        keperluan: keperluan || "-",
        jumlahItem: items?.length || 0,
        tanggalDibutuhkan: tanggalDibutuhkan || "-",
      })).catch(() => {});
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await db.query.permintaanBahanTable.findFirst({
      where: eq(permintaanBahanTable.id, Number(req.params.id)),
      with: {
        user: { with: { jurusan: true } },
        laboratorium: { with: { jurusan: true } },
        plp: { columns: { id: true, nama: true, nip: true, email: true } },
        verifikator: { columns: { id: true, nama: true } },
        items: { with: { bahan: { with: { laboratorium: true } } } },
      },
    });
    if (!item) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Status update — PLP can update if directed to them; gudang can update gudang-directed
router.put("/:id/status", requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    if (!["gudang", "plp", "admin"].includes(role)) {
      res.status(403).json({ message: "Tidak diizinkan" }); return;
    }

    const { status, catatan, jumlahDisetujui } = req.body;
    if (!status) { res.status(400).json({ message: "Status wajib diisi" }); return; }

    // Check ownership for plp/gudang
    const existing = await db.query.permintaanBahanTable.findFirst({
      where: eq(permintaanBahanTable.id, Number(req.params.id)),
      with: { items: true },
    });
    if (!existing) { res.status(404).json({ message: "Data tidak ditemukan" }); return; }

    if (role === "plp" && existing.plpId !== req.user!.id) {
      res.status(403).json({ message: "Bukan permintaan yang ditujukan ke Anda" }); return;
    }
    if (role === "gudang" && existing.tujuan !== "gudang") {
      res.status(403).json({ message: "Permintaan ini ditujukan ke PLP, bukan gudang" }); return;
    }

    if (status === "disetujui" && jumlahDisetujui) {
      for (const jd of jumlahDisetujui) {
        await db.update(permintaanBahanItemTable)
          .set({ jumlahDisetujui: jd.jumlah })
          .where(eq(permintaanBahanItemTable.id, jd.itemId));
      }
    }

    if (status === "disiapkan") {
      for (const item of existing.items) {
        const bahan = await db.query.bahanTable.findFirst({ where: eq(bahanTable.id, item.bahanId) });
        if (bahan) {
          const qty = item.jumlahDisetujui || item.jumlahDiminta;
          await db.update(bahanTable).set({ stok: Math.max(0, bahan.stok - qty) }).where(eq(bahanTable.id, item.bahanId));
        }
      }
    }

    const [updated] = await db.update(permintaanBahanTable)
      .set({ status: status as any, catatan: catatan || null, verifikasiOleh: req.user!.id, updatedAt: new Date() })
      .where(eq(permintaanBahanTable.id, Number(req.params.id))).returning();

    const result = await db.query.permintaanBahanTable.findFirst({
      where: eq(permintaanBahanTable.id, updated.id),
      with: { user: true, items: { with: { bahan: true } }, plp: true },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
