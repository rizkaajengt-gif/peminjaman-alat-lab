import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: typeof usersTable.$inferSelect;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ message: "Tidak terautentikasi" });
    return;
  }
  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });
    if (!user || user.status !== "aktif") {
      res.status(401).json({ message: "Akun tidak aktif atau tidak ditemukan" });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Akses ditolak" });
      return;
    }
    next();
  };
}
