import {
  db,
  reminderWaTable,
  peminjamanAlatTable,
  peminjamanPhantomTable,
  usersTable,
  laboratoriumTable,
} from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import { formatPesanReminderPengembalian, kirimNotifWa } from "./notifikasi.js";

const ACTIVE_STATUSES = ["disetujui", "dipinjam"] as const;
const TIME_ZONE = "Asia/Jakarta";

function jakartaDate(offsetDays = 0) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export async function jalankanReminderWa() {
  const targetDate = jakartaDate(1);
  const [alatLoans, phantomLoans] = await Promise.all([
    db.select({
      id: peminjamanAlatTable.id,
      noPeminjaman: peminjamanAlatTable.noPeminjaman,
      tanggalKembali: peminjamanAlatTable.tanggalKembali,
      namaPeminjam: usersTable.nama,
      noWa: usersTable.noWa,
      callmebotKey: usersTable.callmebotKey,
      laboratorium: laboratoriumTable.nama,
    })
      .from(peminjamanAlatTable)
      .innerJoin(usersTable, eq(usersTable.id, peminjamanAlatTable.userId))
      .leftJoin(laboratoriumTable, eq(laboratoriumTable.id, peminjamanAlatTable.laboratoriumId))
      .where(and(eq(peminjamanAlatTable.tanggalKembali, targetDate), inArray(peminjamanAlatTable.status, [...ACTIVE_STATUSES]))),
    db.select({
      id: peminjamanPhantomTable.id,
      noPeminjaman: peminjamanPhantomTable.noPeminjaman,
      tanggalKembali: peminjamanPhantomTable.tanggalKembali,
      namaPeminjam: usersTable.nama,
      noWa: usersTable.noWa,
      callmebotKey: usersTable.callmebotKey,
      laboratorium: laboratoriumTable.nama,
    })
      .from(peminjamanPhantomTable)
      .innerJoin(usersTable, eq(usersTable.id, peminjamanPhantomTable.userId))
      .leftJoin(laboratoriumTable, eq(laboratoriumTable.id, peminjamanPhantomTable.laboratoriumId))
      .where(and(eq(peminjamanPhantomTable.tanggalKembali, targetDate), inArray(peminjamanPhantomTable.status, [...ACTIVE_STATUSES]))),
  ]);

  const candidates = [
    ...alatLoans.map((loan) => ({ ...loan, jenis: "alat" as const })),
    ...phantomLoans.map((loan) => ({ ...loan, jenis: "phantom" as const })),
  ].filter((loan) => loan.noWa && loan.callmebotKey);
  if (!candidates.length) return { sent: 0, skipped: 0, targetDate };

  const keys = candidates.map((loan) => `${loan.jenis}:${loan.id}:${loan.tanggalKembali}`);
  const sentLogs = await db.query.reminderWaTable.findMany({ where: inArray(reminderWaTable.kunci, keys) });
  const sentKeys = new Set(sentLogs.map((log) => log.kunci));
  let sent = 0;

  for (const loan of candidates) {
    const kunci = `${loan.jenis}:${loan.id}:${loan.tanggalKembali}`;
    if (sentKeys.has(kunci)) continue;
    const success = await kirimNotifWa(
      loan.noWa!,
      loan.callmebotKey!,
      formatPesanReminderPengembalian({
        jenis: loan.jenis,
        noPeminjaman: loan.noPeminjaman,
        namaPeminjam: loan.namaPeminjam,
        laboratorium: loan.laboratorium,
        tanggalKembali: loan.tanggalKembali,
      }),
    );
    if (!success) continue;
    await db.insert(reminderWaTable).values({
      kunci,
      jenis: loan.jenis,
      peminjamanId: loan.id,
      tanggalKembali: loan.tanggalKembali,
    }).onConflictDoNothing({ target: reminderWaTable.kunci });
    sent++;
  }

  return { sent, skipped: candidates.length - sent, targetDate };
}