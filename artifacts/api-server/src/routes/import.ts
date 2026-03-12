/**
 * Import data massal via CSV (pengguna, alat, bahan habis pakai)
 * Format upload: JSON body { csv: "...csv content..." }
 */
import { Router } from "express";
import { db, usersTable, alatTable, bahanTable, laboratoriumTable } from "@workspace/db";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "poltekkes_salt").digest("hex");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim()); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(csv: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csv.replace(/\r\n/g, "\n").split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && !l.startsWith("\uFEFF#"));
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(l => {
    const vals = parseCsvLine(l);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), vals[i]?.trim() || ""]));
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

// ─── IMPORT PENGGUNA ──────────────────────────────────────────────────────────
router.get("/users/template", requireAuth, requireRole("admin"), async (_req, res) => {
  const jurusanList = await db.query.jurusanTable.findMany({ columns: { id: true, nama: true } });
  let info = "# TEMPLATE IMPORT PENGGUNA SIPELAB\n";
  info += "# Kolom wajib: nama, email, role\n";
  info += "# password: jika dikosongkan, akan menggunakan NIM (mahasiswa) atau NIP (staf)\n";
  info += "# role: admin | mahasiswa | plp | gudang | dosen\n";
  info += "# angkatan: tahun masuk (misal: 2021) – digunakan untuk nonaktifkan massal saat lulus\n";
  info += "# Jurusan (isi ID):\n";
  info += jurusanList.map(j => `# ${j.id} = ${j.nama}`).join("\n");
  info += "\nnama,email,password,role,nim,nip,noHp,angkatan,jurusanId\n";
  info += "Budi Santoso,budi2021@poltekkes.ac.id,,mahasiswa,2021001001,,,2021,1\n";
  info += "Siti Rahayu,siti2021@poltekkes.ac.id,,mahasiswa,2021001002,,,2021,1\n";
  info += "Dr. Hendra Wijaya,hendra@poltekkes.ac.id,Password123!,dosen,,197001012000012001,,,1\n";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=template_import_pengguna.csv");
  res.send("\uFEFF" + info);
});

router.post("/users", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { csv } = req.body;
    if (!csv) { res.status(400).json({ message: "Data CSV tidak ada" }); return; }
    const { rows } = parseCsv(csv);
    if (!rows.length) { res.status(400).json({ message: "Tidak ada data valid dalam CSV" }); return; }

    let berhasil = 0, gagal = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const { nama, email, role, nim, nip, noHp, angkatan, jurusanId } = row;
      let { password } = row;
      if (!nama || !email || !role) {
        gagal++; errors.push(`Baris "${nama || email || "?"}" : kolom wajib (nama, email, role) tidak lengkap`); continue;
      }
      if (!password) password = nim || nip || "Password123!";
      const existing = await db.query.usersTable.findFirst({ where: (u, { eq }) => eq(u.email, email) });
      if (existing) { gagal++; errors.push(`Email ${email} sudah terdaftar`); continue; }
      try {
        await db.insert(usersTable).values({
          nama, email, password: hashPassword(password),
          role: role as any,
          nim: nim || null, nip: nip || null, noHp: noHp || null,
          angkatan: angkatan || null,
          jurusanId: jurusanId ? parseInt(jurusanId) : null,
          status: "aktif",
        });
        berhasil++;
      } catch (e: any) {
        gagal++; errors.push(`${email}: ${e.message}`);
      }
    }
    res.json({ success: berhasil, berhasil, gagal, errors, message: `Import selesai: ${berhasil} berhasil, ${gagal} gagal` });
  } catch (e: any) {
    res.status(500).json({ message: "Gagal memproses CSV: " + e.message });
  }
});

// ─── IMPORT ALAT ─────────────────────────────────────────────────────────────
router.get("/alat/template", requireAuth, requireRole("admin", "plp"), async (_req, res) => {
  const labs = await db.query.laboratoriumTable.findMany({ columns: { id: true, nama: true } });
  const plps = await db.query.usersTable.findMany({ where: (u, { eq }) => eq(u.role, "plp"), columns: { id: true, nama: true } });
  let info = "# TEMPLATE IMPORT ALAT LABORATORIUM\n";
  info += "# Kolom wajib: kode, nama, kondisi, stok, satuan, laboratoriumId\n";
  info += "# kondisi: baik | rusak_ringan | rusak_berat\n";
  info += "# Daftar Laboratorium:\n" + labs.map(l => `# ${l.id} = ${l.nama}`).join("\n");
  info += "\n# Daftar PLP (Penanggung Jawab):\n" + plps.map(p => `# ${p.id} = ${p.nama}`).join("\n");
  info += "\nkode,nama,deskripsi,kondisi,stok,satuan,laboratoriumId,penanggungjawabId\n";
  info += "AL-001,Mikroskop Binokuler,Perbesaran 1000x,baik,5,unit,1,\n";
  info += "AL-002,Spektrofotometer,,baik,2,unit,1,\n";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=template_import_alat.csv");
  res.send("\uFEFF" + info);
});

router.post("/alat", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { csv } = req.body;
    if (!csv) { res.status(400).json({ message: "Data CSV tidak ada" }); return; }
    const { rows } = parseCsv(csv);
    if (!rows.length) { res.status(400).json({ message: "Tidak ada data valid" }); return; }

    let berhasil = 0, gagal = 0;
    const errors: string[] = [];
    for (const row of rows) {
      const { kode, nama, deskripsi, kondisi, stok, satuan, laboratoriumId, penanggungjawabId } = row;
      if (!kode || !nama || !laboratoriumId) {
        gagal++; errors.push(`Baris ${nama || kode || "?"}: kode, nama, laboratoriumId wajib`); continue;
      }
      try {
        await db.insert(alatTable).values({
          kode, nama, deskripsi: deskripsi || null,
          kondisi: (kondisi || "baik") as any,
          stok: parseInt(stok) || 0, stokTersedia: parseInt(stok) || 0,
          satuan: satuan || "unit",
          laboratoriumId: parseInt(laboratoriumId),
          penanggungjawabId: penanggungjawabId ? parseInt(penanggungjawabId) : null,
        });
        berhasil++;
      } catch (e: any) {
        gagal++; errors.push(`${kode}: ${e.message}`);
      }
    }
    res.json({ message: `Import alat selesai: ${berhasil} berhasil, ${gagal} gagal`, berhasil, gagal, errors });
  } catch (e: any) {
    res.status(500).json({ message: "Gagal memproses CSV: " + e.message });
  }
});

// ─── IMPORT BAHAN HABIS PAKAI ─────────────────────────────────────────────────
router.get("/bahan/template", requireAuth, requireRole("admin", "plp", "gudang"), async (_req, res) => {
  const labs = await db.query.laboratoriumTable.findMany({ columns: { id: true, nama: true } });
  const plps = await db.query.usersTable.findMany({ where: (u, { eq }) => eq(u.role, "plp"), columns: { id: true, nama: true } });
  let info = "# TEMPLATE IMPORT BAHAN HABIS PAKAI\n";
  info += "# Kolom wajib: kode, nama, stok, satuan, laboratoriumId\n";
  info += "# Daftar Laboratorium:\n" + labs.map(l => `# ${l.id} = ${l.nama}`).join("\n");
  info += "\n# Daftar PLP (Penanggung Jawab):\n" + plps.map(p => `# ${p.id} = ${p.nama}`).join("\n");
  info += "\nkode,nama,deskripsi,stok,stokMinimal,satuan,laboratoriumId,penanggungjawabId\n";
  info += "BH-001,Alkohol 70%,Bahan desinfektan,500,100,mL,1,\n";
  info += "BH-002,HCl 1M,,100,20,mL,1,\n";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=template_import_bahan.csv");
  res.send("\uFEFF" + info);
});

router.post("/bahan", requireAuth, requireRole("admin", "plp", "gudang"), async (req: AuthRequest, res) => {
  try {
    const { csv } = req.body;
    if (!csv) { res.status(400).json({ message: "Data CSV tidak ada" }); return; }
    const { rows } = parseCsv(csv);
    if (!rows.length) { res.status(400).json({ message: "Tidak ada data valid" }); return; }

    let berhasil = 0, gagal = 0;
    const errors: string[] = [];
    for (const row of rows) {
      const { kode, nama, deskripsi, stok, stokMinimal, satuan, laboratoriumId, penanggungjawabId } = row;
      if (!kode || !nama || !laboratoriumId) {
        gagal++; errors.push(`Baris ${nama || kode || "?"}: kode, nama, laboratoriumId wajib`); continue;
      }
      try {
        await db.insert(bahanTable).values({
          kode, nama, deskripsi: deskripsi || null,
          stok: parseInt(stok) || 0,
          stokMinimal: parseInt(stokMinimal) || 0,
          satuan: satuan || "unit",
          laboratoriumId: parseInt(laboratoriumId),
          penanggungjawabId: penanggungjawabId ? parseInt(penanggungjawabId) : null,
        });
        berhasil++;
      } catch (e: any) {
        gagal++; errors.push(`${kode}: ${e.message}`);
      }
    }
    res.json({ message: `Import bahan selesai: ${berhasil} berhasil, ${gagal} gagal`, berhasil, gagal, errors });
  } catch (e: any) {
    res.status(500).json({ message: "Gagal memproses CSV: " + e.message });
  }
});

export default router;
