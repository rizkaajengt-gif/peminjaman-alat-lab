import { Router } from "express";
import { asc, and, eq, gte } from "drizzle-orm";
import { GetPublicKetersediaanResponse } from "@workspace/api-zod";
import { db, alatTable, laboratoriumTable, peminjamanRuanganTable } from "@workspace/db";

const router = Router();

function dateOnlyToDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

router.get("/public/ketersediaan", async (req, res): Promise<void> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [laboratorium, alat, jadwal] = await Promise.all([
      db.query.laboratoriumTable.findMany({
        with: { jurusan: true },
        orderBy: [asc(laboratoriumTable.nama)],
      }),
      db.query.alatTable.findMany({
        orderBy: [asc(alatTable.nama)],
      }),
      db.query.peminjamanRuanganTable.findMany({
        where: and(
          eq(peminjamanRuanganTable.status, "disetujui"),
          gte(peminjamanRuanganTable.tanggalSelesai, today),
        ),
        orderBy: [asc(peminjamanRuanganTable.tanggalMulai), asc(peminjamanRuanganTable.waktuMulai)],
      }),
    ]);

    const response = GetPublicKetersediaanResponse.parse({
      generatedAt: new Date(),
      laboratorium: laboratorium.map((lab) => ({
        id: lab.id,
        nama: lab.nama,
        kode: lab.kode,
        lokasi: lab.lokasi,
        kapasitas: lab.kapasitas,
        jurusanNama: lab.jurusan?.nama ?? null,
        alat: alat
          .filter((item) => item.laboratoriumId === lab.id)
          .map((item) => ({
            id: item.id,
            nama: item.nama,
            kode: item.kode,
            kondisi: item.kondisi,
            stok: item.stok,
            stokTersedia: item.stokTersedia,
            satuan: item.satuan,
          })),
        jadwal: jadwal
          .filter((item) => item.laboratoriumId === lab.id)
          .map((item) => ({
            id: item.id,
            tanggalMulai: dateOnlyToDate(item.tanggalMulai),
            tanggalSelesai: dateOnlyToDate(item.tanggalSelesai),
            waktuMulai: item.waktuMulai,
            waktuSelesai: item.waktuSelesai,
            kategori: item.kategori,
            judulKegiatan: item.judulKegiatan,
            jumlahPeserta: item.jumlahPeserta,
          })),
      })),
    });

    res.json(response);
  } catch (error) {
    req.log.error({ err: error }, "Failed to load public laboratory availability");
    res.status(500).json({ message: "Gagal memuat ketersediaan laboratorium" });
  }
});

export default router;