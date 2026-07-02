import { Router, type IRouter } from "express";
import { db, calcHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/calc-history", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const limitRaw = req.query.limit;
  const limit = limitRaw ? parseInt(String(limitRaw), 10) : 50;
  const rows = await db
    .select()
    .from(calcHistoryTable)
    .where(eq(calcHistoryTable.userId, req.user.id))
    .orderBy(desc(calcHistoryTable.createdAt))
    .limit(limit);
  res.json(rows);
});

router.post("/calc-history", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { calcId, calcName, inputs, results, isFavorite } = req.body as {
    calcId: string;
    calcName: string;
    inputs: Record<string, unknown>;
    results: Record<string, unknown>;
    isFavorite?: string;
  };
  if (!calcId || !calcName) {
    res.status(400).json({ error: "calcId and calcName are required" });
    return;
  }
  const [row] = await db
    .insert(calcHistoryTable)
    .values({
      userId: req.user.id,
      calcId,
      calcName,
      inputs: (inputs ?? {}) as Record<string, number | string>,
      results: (results ?? {}) as Record<string, number | string>,
      isFavorite: isFavorite ?? "false",
    })
    .returning();
  res.status(201).json(row);
});

export default router;
