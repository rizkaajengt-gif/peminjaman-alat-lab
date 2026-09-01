import { Router } from "express";
import {
  db,
  laboratoriumTable,
  perpanjanganPeminjamanTable,
  peminjamanAlatTable,
  peminjamanPhantomTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, inArray, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";
import { getPlpLabIds } from "../lib/plp-labs.js";

const router = Router();
const REVIEW_ROLES = ["admin", "plp", "kepala_laboratorium"] as const;
const ACTIVE_LOAN_STATUSES = ["disetujui", "dipinjam"] as const;

type LoanKind = "alat" | "phantom";

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getRequest(id: number) {
  const [row] = await db.select({
    request: perpanjanganPeminjamanTable,
    pemohonNama: usersTable.nama,
    pemohonNim: usersTable.nim,
    alatNo: peminjamanAlatTable.noPeminjaman,
    alatTanggalPinjam: peminjamanAlatTable.tanggalPinjam,
    alatLaboratoriumId: peminjamanAlatTable.laboratoriumId,
    phantomNo: peminjamanPhantomTable.noPeminjaman,
    phantomTanggalPinjam: peminjamanPhantomTable.tanggalPinjam,
    phantomLaboratoriumId: peminjamanPhantomTable.laboratoriumId,
  })
    .from(perpanjanganPeminjamanTable)
    .innerJoin(usersTable, eq(usersTable.id, perpanjanganPeminjamanTable.pemohonId))
    .leftJoin(peminjamanAlatTable, eq(peminjamanAlatTable.id, perpanjanganPeminjamanTable.peminjamanAlatId))
    .leftJoin(peminjamanPhantomTable, eq(peminjamanPhantomTable.id, perpanjanganPeminjamanTable.peminjamanPhantomId))
    .where(eq(perpanjanganPeminjamanTable.id, id))
    .limit(1);

  if (!row) return null;
  const labId = row.request.jenis === "alat" ? row.alatLaboratoriumId : row.phantomLaboratoriumId;
  const lab = labId
    ? await db.query.laboratoriumTable.findFirst({ where: eq(laboratoriumTable.id, labId) })
    : null;

  return {
    id: row.request.id,
    jenis: row.request.jenis,
    peminjamanId: row.request.jenis === "alat" ? row.request.peminjamanAlatId : row.request.peminjamanPhantomId,
    noPeminjaman: row.request.jenis === "alat" ? row.alatNo : row.phantomNo,
    pemohonId: row.request.pemohonId,
    pemohonNama: row.pemohonNama,
    pemohonNim: row.pemohonNim,
    laboratoriumNama: lab?.nama ?? null,
    tanggalPinjam: row.request.jenis === "alat" ? row.alatTanggalPinjam : row.phantomTanggalPinjam,
    tanggalKembaliLama: row.request.tanggalKembaliLama,
    tanggalKembaliBaru: row.request.tanggalKembaliBaru,
    alasan: row.request.alasan,
    status: row.request.status,
    disetujuiOleh: row.request.disetujuiOleh,
    catatan: row.request.catatan,
    createdAt: row.request.createdAt,
    updatedAt: row.request.updatedAt,
  };
}

async function getLoan(kind: LoanKind, id: number) {
  if (kind === "alat") {
    return db.query.peminjamanAlatTable.findFirst({ where: eq(peminjamanAlatTable.id, id) });
  }
  return db.query.peminjamanPhantomTable.findFirst({ where: eq(peminjamanPhantomTable.id, id) });
}

async function hasReviewAccess(user: NonNullable<AuthRequest["user"]>, laboratoriumId: number | null) {
  if (user.role === "admin") return true;
  if (!laboratoriumId) return false;
  if (user.role === "kepala_laboratorium") return user.laboratoriumId === laboratoriumId;
  if (user.role === "plp") return (await getPlpLabIds(user.id)).includes(laboratoriumId);
  return false;
}

router.get("/", requireAuth, requireRole(...REVIEW_ROLES), async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(perpanjanganPeminjamanTable.status, status as any));

    if (req.user!.role === "plp") {
      const labIds = await getPlpLabIds(req.user!.id);
      if (labIds.length === 0) conditions.push(eq(perpanjanganPeminjamanTable.id, -1));
      else {
        const loans = await db.select({ id: peminjamanAlatTable.id }).from(peminjamanAlatTable).where(inArray(peminjamanAlatTable.laboratoriumId, labIds));
        const phantomLoans = await db.select({ id: peminjamanPhantomTable.id }).from(peminjamanPhantomTable).where(inArray(peminjamanPhantomTable.laboratoriumId, labIds));
        const ids = [
          ...(loans.length ? (await db.select({ id: perpanjanganPeminjamanTable.id }).from(perpanjanganPeminjamanTable).where(inArray(perpanjanganPeminjamanTable.peminjamanAlatId, loans.map((l) => l.id)))).map((r) => r.id) : []),
          ...(phantomLoans.length ? (await db.select({ id: perpanjanganPeminjamanTable.id }).from(perpanjanganPeminjamanTable).where(inArray(perpanjanganPeminjamanTable.peminjamanPhantomId, phantomLoans.map((l) => l.id)))).map((r) => r.id) : []),
        ];
        if (ids.length === 0) conditions.push(eq(perpanjanganPeminjamanTable.id, -1));
        else conditions.push(inArray(perpanjanganPeminjamanTable.id, ids));
      }
    } else if (req.user!.role === "kepala_laboratorium") {
      if (!req.user!.laboratoriumId) conditions.push(eq(perpanjanganPeminjamanTable.id, -1));
      else {
        const [alatIds, phantomIds] = await Promise.all([
          db.select({ id: peminjamanAlatTable.id }).from(peminjamanAlatTable).where(eq(peminjamanAlatTable.laboratoriumId, req.user!.laboratoriumId)),
          db.select({ id: peminjamanPhantomTable.id }).from(peminjamanPhantomTable).where(eq(peminjamanPhantomTable.laboratoriumId, req.user!.laboratoriumId)),
        ]);
        const [alatRequests, phantomRequests] = await Promise.all([
          alatIds.length ? db.select({ id: perpanjanganPeminjamanTable.id }).from(perpanjanganPeminjamanTable).where(inArray(perpanjanganPeminjamanTable.peminjamanAlatId, alatIds.map((l) => l.id))) : Promise.resolve([]),
          phantomIds.length ? db.select({ id: perpanjanganPeminjamanTable.id }).from(perpanjanganPeminjamanTable).where(inArray(perpanjanganPeminjamanTable.peminjamanPhantomId, phantomIds.map((l) => l.id))) : Promise.resolve([]),
        ]);
        const ids = [...alatRequests, ...phantomRequests].map((r) => r.id);
        if (ids.length === 0) conditions.push(eq(perpanjanganPeminjamanTable.id, -1));
        else conditions.push(inArray(perpanjanganPeminjamanTable.id, ids));
      }
    }

    const requests = await db.query.perpanjanganPeminjamanTable.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: (table) => [desc(table.createdAt)],
    });
    const result = await Promise.all(requests.map((request) => getRequest(request.id)));
    res.json(result.filter(Boolean));
  } catch (error) {
    console.error("Get extension requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("mahasiswa", "dosen"), async (req: AuthRequest, res) => {
  try {
    const { jenis, peminjamanId, tanggalKembaliBaru, alasan } = req.body as {
      jenis?: LoanKind;
      peminjamanId?: number;
      tanggalKembaliBaru?: string;
      alasan?: string;
    };
    if ((jenis !== "alat" && jenis !== "phantom") || !Number.isInteger(Number(peminjamanId)) || !isValidDate(tanggalKembaliBaru) || !alasan?.trim()) {
      res.status(400).json({ message: "Jenis, peminjaman, tanggal baru, dan alasan wajib diisi dengan benar" });
      return;
    }
    const loan = await getLoan(jenis, Number(peminjamanId));
    if (!loan) { res.status(404).json({ message: "Peminjaman tidak ditemukan" }); return; }
    if (loan.userId !== req.user!.id) { res.status(403).json({ message: "Anda hanya dapat memperpanjang peminjaman sendiri" }); return; }
    if (!(ACTIVE_LOAN_STATUSES as readonly string[]).includes(loan.status)) {
      res.status(400).json({ message: "Perpanjangan hanya tersedia untuk peminjaman yang sedang aktif" });
      return;
    }
    if (tanggalKembaliBaru <= loan.tanggalKembali) {
      res.status(400).json({ message: "Tanggal kembali baru harus setelah tanggal kembali saat ini" });
      return;
    }
    const existing = await db.query.perpanjanganPeminjamanTable.findFirst({
      where: jenis === "alat"
        ? and(eq(perpanjanganPeminjamanTable.peminjamanAlatId, Number(peminjamanId)), eq(perpanjanganPeminjamanTable.status, "menunggu"))
        : and(eq(perpanjanganPeminjamanTable.peminjamanPhantomId, Number(peminjamanId)), eq(perpanjanganPeminjamanTable.status, "menunggu")),
    });
    if (existing) { res.status(409).json({ message: "Masih ada pengajuan perpanjangan yang menunggu persetujuan" }); return; }

    const [created] = await db.insert(perpanjanganPeminjamanTable).values({
      jenis,
      peminjamanAlatId: jenis === "alat" ? Number(peminjamanId) : null,
      peminjamanPhantomId: jenis === "phantom" ? Number(peminjamanId) : null,
      pemohonId: req.user!.id,
      tanggalKembaliLama: loan.tanggalKembali,
      tanggalKembaliBaru,
      alasan: alasan.trim(),
    }).returning();
    res.status(201).json(await getRequest(created.id));
  } catch (error) {
    console.error("Create extension request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", requireAuth, requireRole(...REVIEW_ROLES), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, catatan } = req.body as { status?: "disetujui" | "ditolak"; catatan?: string };
    if (status !== "disetujui" && status !== "ditolak") { res.status(400).json({ message: "Status harus disetujui atau ditolak" }); return; }

    const request = await db.query.perpanjanganPeminjamanTable.findFirst({ where: eq(perpanjanganPeminjamanTable.id, id) });
    if (!request) { res.status(404).json({ message: "Pengajuan perpanjangan tidak ditemukan" }); return; }
    if (request.status !== "menunggu") { res.status(409).json({ message: "Pengajuan ini sudah diproses sebelumnya" }); return; }
    const kind = request.jenis;
    const loanId = kind === "alat" ? request.peminjamanAlatId : request.peminjamanPhantomId;
    if (!loanId) { res.status(400).json({ message: "Peminjaman terkait tidak valid" }); return; }
    const loan = await getLoan(kind, loanId);
    if (!loan) { res.status(404).json({ message: "Peminjaman terkait tidak ditemukan" }); return; }
    if (!(await hasReviewAccess(req.user!, loan.laboratoriumId))) { res.status(403).json({ message: "Anda tidak memiliki akses ke laboratorium ini" }); return; }
    if (status === "disetujui" && !(ACTIVE_LOAN_STATUSES as readonly string[]).includes(loan.status)) {
      res.status(400).json({ message: "Peminjaman sudah tidak aktif sehingga tidak dapat diperpanjang" });
      return;
    }

    await db.transaction(async (tx) => {
      const [updated] = await tx.update(perpanjanganPeminjamanTable)
        .set({ status, disetujuiOleh: req.user!.id, catatan: catatan?.trim() || null, updatedAt: new Date() })
        .where(and(eq(perpanjanganPeminjamanTable.id, id), eq(perpanjanganPeminjamanTable.status, "menunggu")))
        .returning({ id: perpanjanganPeminjamanTable.id });
      if (!updated) throw new Error("REQUEST_ALREADY_PROCESSED");
      if (status === "disetujui") {
        const table = kind === "alat" ? peminjamanAlatTable : peminjamanPhantomTable;
        await tx.update(table).set({ tanggalKembali: request.tanggalKembaliBaru, updatedAt: new Date() }).where(eq(table.id, loanId));
      }
    });

    res.json(await getRequest(id));
  } catch (error: any) {
    if (error?.message === "REQUEST_ALREADY_PROCESSED") { res.status(409).json({ message: "Pengajuan ini sudah diproses sebelumnya" }); return; }
    console.error("Update extension request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;