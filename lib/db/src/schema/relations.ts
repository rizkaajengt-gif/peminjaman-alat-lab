import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { jurusanTable } from "./jurusan";
import { laboratoriumTable } from "./laboratorium";
import { alatTable } from "./alat";
import { bahanTable } from "./bahan";
import { plpLaboratoriumTable } from "./plp-laboratorium";
import { peminjamanAlatTable, peminjamanAlatItemTable, peminjamanRuanganTable, phantomTable, peminjamanPhantomTable, peminjamanPhantomItemTable } from "./peminjaman";
import { permintaanBahanTable, permintaanBahanItemTable } from "./permintaan";
import { beritaTable, galeriTable, dokumenTable } from "./konten";
import { notifikasiTable } from "./notifikasi";
import { transferBahanPlpTable } from "./transfer-bahan";

export const jurusanRelations = relations(jurusanTable, ({ many }) => ({
  users: many(usersTable),
  laboratorium: many(laboratoriumTable),
}));

export const laboratoriumRelations = relations(laboratoriumTable, ({ one, many }) => ({
  jurusan: one(jurusanTable, { fields: [laboratoriumTable.jurusanId], references: [jurusanTable.id] }),
  alat: many(alatTable),
  bahan: many(bahanTable),
  phantom: many(phantomTable),
  dokumen: many(dokumenTable),
  peminjamanAlat: many(peminjamanAlatTable),
  peminjamanRuangan: many(peminjamanRuanganTable),
  peminjamanPhantom: many(peminjamanPhantomTable),
  permintaanBahan: many(permintaanBahanTable),
  plpAssignments: many(plpLaboratoriumTable),
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  jurusan: one(jurusanTable, { fields: [usersTable.jurusanId], references: [jurusanTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [usersTable.laboratoriumId], references: [laboratoriumTable.id] }),
  peminjamanAlat: many(peminjamanAlatTable),
  peminjamanRuangan: many(peminjamanRuanganTable),
  peminjamanPhantom: many(peminjamanPhantomTable),
  permintaanBahan: many(permintaanBahanTable),
  berita: many(beritaTable),
  galeri: many(galeriTable),
  dokumen: many(dokumenTable),
  plpLaboratorium: many(plpLaboratoriumTable),
  alatDikelola: many(alatTable),
  bahanDikelola: many(bahanTable),
}));

export const plpLaboratoriumRelations = relations(plpLaboratoriumTable, ({ one }) => ({
  plp: one(usersTable, { fields: [plpLaboratoriumTable.plpId], references: [usersTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [plpLaboratoriumTable.laboratoriumId], references: [laboratoriumTable.id] }),
}));

export const alatRelations = relations(alatTable, ({ one, many }) => ({
  laboratorium: one(laboratoriumTable, { fields: [alatTable.laboratoriumId], references: [laboratoriumTable.id] }),
  penanggungjawab: one(usersTable, { fields: [alatTable.penanggungjawabId], references: [usersTable.id] }),
  peminjamanItems: many(peminjamanAlatItemTable),
}));

export const bahanRelations = relations(bahanTable, ({ one, many }) => ({
  laboratorium: one(laboratoriumTable, { fields: [bahanTable.laboratoriumId], references: [laboratoriumTable.id] }),
  penanggungjawab: one(usersTable, { fields: [bahanTable.penanggungjawabId], references: [usersTable.id] }),
  permintaanItems: many(permintaanBahanItemTable),
}));

export const phantomRelations = relations(phantomTable, ({ one, many }) => ({
  laboratorium: one(laboratoriumTable, { fields: [phantomTable.laboratoriumId], references: [laboratoriumTable.id] }),
  peminjamanItems: many(peminjamanPhantomItemTable),
}));

export const peminjamanAlatRelations = relations(peminjamanAlatTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [peminjamanAlatTable.userId], references: [usersTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [peminjamanAlatTable.laboratoriumId], references: [laboratoriumTable.id] }),
  verifikator: one(usersTable, { fields: [peminjamanAlatTable.verifikasiOleh], references: [usersTable.id] }),
  items: many(peminjamanAlatItemTable),
}));

export const peminjamanAlatItemRelations = relations(peminjamanAlatItemTable, ({ one }) => ({
  peminjaman: one(peminjamanAlatTable, { fields: [peminjamanAlatItemTable.peminjamanId], references: [peminjamanAlatTable.id] }),
  alat: one(alatTable, { fields: [peminjamanAlatItemTable.alatId], references: [alatTable.id] }),
}));

export const peminjamanRuanganRelations = relations(peminjamanRuanganTable, ({ one }) => ({
  user: one(usersTable, { fields: [peminjamanRuanganTable.userId], references: [usersTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [peminjamanRuanganTable.laboratoriumId], references: [laboratoriumTable.id] }),
}));

export const peminjamanPhantomRelations = relations(peminjamanPhantomTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [peminjamanPhantomTable.userId], references: [usersTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [peminjamanPhantomTable.laboratoriumId], references: [laboratoriumTable.id] }),
  verifikator: one(usersTable, { fields: [peminjamanPhantomTable.verifikasiOleh], references: [usersTable.id] }),
  items: many(peminjamanPhantomItemTable),
}));

export const peminjamanPhantomItemRelations = relations(peminjamanPhantomItemTable, ({ one }) => ({
  peminjaman: one(peminjamanPhantomTable, { fields: [peminjamanPhantomItemTable.peminjamanId], references: [peminjamanPhantomTable.id] }),
  phantom: one(phantomTable, { fields: [peminjamanPhantomItemTable.phantomId], references: [phantomTable.id] }),
}));

export const permintaanBahanRelations = relations(permintaanBahanTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [permintaanBahanTable.userId], references: [usersTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [permintaanBahanTable.laboratoriumId], references: [laboratoriumTable.id] }),
  plp: one(usersTable, { fields: [permintaanBahanTable.plpId], references: [usersTable.id] }),
  verifikator: one(usersTable, { fields: [permintaanBahanTable.verifikasiOleh], references: [usersTable.id] }),
  items: many(permintaanBahanItemTable),
}));

export const permintaanBahanItemRelations = relations(permintaanBahanItemTable, ({ one }) => ({
  permintaan: one(permintaanBahanTable, { fields: [permintaanBahanItemTable.permintaanId], references: [permintaanBahanTable.id] }),
  bahan: one(bahanTable, { fields: [permintaanBahanItemTable.bahanId], references: [bahanTable.id] }),
}));

export const beritaRelations = relations(beritaTable, ({ one }) => ({
  penulis: one(usersTable, { fields: [beritaTable.penulisId], references: [usersTable.id] }),
}));

export const galeriRelations = relations(galeriTable, ({ one }) => ({
  uploader: one(usersTable, { fields: [galeriTable.uploaderId], references: [usersTable.id] }),
}));

export const dokumenRelations = relations(dokumenTable, ({ one }) => ({
  uploader: one(usersTable, { fields: [dokumenTable.uploaderId], references: [usersTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [dokumenTable.laboratoriumId], references: [laboratoriumTable.id] }),
}));

export const notifikasiRelations = relations(notifikasiTable, ({ one }) => ({
  createdBy: one(usersTable, { fields: [notifikasiTable.createdBy], references: [usersTable.id] }),
}));

export const transferBahanPlpRelations = relations(transferBahanPlpTable, ({ one }) => ({
  bahan: one(bahanTable, { fields: [transferBahanPlpTable.bahanId], references: [bahanTable.id] }),
  laboratorium: one(laboratoriumTable, { fields: [transferBahanPlpTable.laboratoriumId], references: [laboratoriumTable.id] }),
  dimintaOleh: one(usersTable, { fields: [transferBahanPlpTable.dimintaOleh], references: [usersTable.id] }),
  disetujuiOleh: one(usersTable, { fields: [transferBahanPlpTable.disetujuiOleh], references: [usersTable.id] }),
}));
