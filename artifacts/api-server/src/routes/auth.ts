import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AuthRequest, requireAuth } from "../lib/auth.js";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "poltekkes_salt").digest("hex");
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email dan password wajib diisi" });
      return;
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
      with: { jurusan: true },
    });

    if (!user || user.password !== hashPassword(password)) {
      res.status(401).json({ message: "Email atau password salah" });
      return;
    }

    if (user.status === "menunggu") {
      res.status(401).json({ message: "Akun Anda sedang menunggu verifikasi" });
      return;
    }

    if (user.status === "ditolak") {
      res.status(401).json({ message: "Akun Anda telah ditolak" });
      return;
    }

    if (user.status === "nonaktif") {
      res.status(401).json({ message: "Akun Anda telah dinonaktifkan" });
      return;
    }

    (req.session as any).userId = user.id;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, message: "Login berhasil" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: "Gagal logout" });
      return;
    }
    res.json({ message: "Logout berhasil" });
  });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, req.user!.id),
      with: { jurusan: true },
    });
    if (!user) {
      res.status(404).json({ message: "User tidak ditemukan" });
      return;
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { nama, noHp, noWa, tandaTangan } = req.body;
    if (!nama) { res.status(400).json({ message: "Nama wajib diisi" }); return; }
    await db.update(usersTable).set({
      nama,
      noHp: noHp || null,
      noWa: noWa || null,
      tandaTangan: tandaTangan || null,
    }).where(eq(usersTable.id, req.user!.id));
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.id), with: { jurusan: true } });
    const { password: _, ...rest } = user!;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/me/password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { passwordLama, passwordBaru } = req.body;
    if (!passwordLama || !passwordBaru) { res.status(400).json({ message: "Password lama dan baru wajib diisi" }); return; }
    if (passwordBaru.length < 6) { res.status(400).json({ message: "Password baru minimal 6 karakter" }); return; }
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.id) });
    if (!user || user.password !== hashPassword(passwordLama)) {
      res.status(401).json({ message: "Password lama tidak sesuai" }); return;
    }
    await db.update(usersTable).set({ password: hashPassword(passwordBaru) }).where(eq(usersTable.id, req.user!.id));
    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { nama, email, password, role, nim, nip, noHp, jurusanId } = req.body;
    if (!nama || !email || !password) {
      res.status(400).json({ message: "Data tidak lengkap" });
      return;
    }

    const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (existing) {
      res.status(400).json({ message: "Email sudah terdaftar" });
      return;
    }

    const allowedRoles = ["mahasiswa", "dosen"];
    const finalRole = allowedRoles.includes(role) ? role : "mahasiswa";
    const status = "menunggu";

    const [newUser] = await db.insert(usersTable).values({
      nama,
      email,
      password: hashPassword(password),
      role: finalRole,
      nim: nim || null,
      nip: nip || null,
      noHp: noHp || null,
      jurusanId: jurusanId || null,
      status,
    }).returning();

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword, message: "Registrasi berhasil. Menunggu verifikasi." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
