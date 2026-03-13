import { db, plpLaboratoriumTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getPlpLabIds(plpUserId: number): Promise<number[]> {
  const assignments = await db.query.plpLaboratoriumTable.findMany({
    where: eq(plpLaboratoriumTable.plpId, plpUserId),
  });
  return assignments.map(a => a.laboratoriumId);
}
