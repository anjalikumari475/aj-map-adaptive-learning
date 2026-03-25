import { Router, type IRouter } from "express";
import { db, progressTable } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const rows = await db.select().from(progressTable).where(eq(progressTable.userId, userId));
    res.json(rows.map((r) => ({ ...r, completedVideos: JSON.parse(r.completedVideos), updatedAt: r.updatedAt.toISOString() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/progress/:userId/:courseId", async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { completedVideos, totalVideos } = req.body;
    if (!Array.isArray(completedVideos) || typeof totalVideos !== "number") {
      res.status(400).json({ error: "Invalid body" }); return;
    }
    const percentComplete = totalVideos > 0 ? (completedVideos.length / totalVideos) * 100 : 0;
    const completed = completedVideos.length >= totalVideos;
    const completedVideosStr = JSON.stringify(completedVideos);
    const existing = await db.select().from(progressTable).where(and(eq(progressTable.userId, userId), eq(progressTable.courseId, courseId))).limit(1);
    let row;
    if (existing.length > 0) {
      [row] = await db.update(progressTable).set({ completedVideos: completedVideosStr, totalVideos, percentComplete, completed, updatedAt: new Date() }).where(and(eq(progressTable.userId, userId), eq(progressTable.courseId, courseId))).returning();
    } else {
      [row] = await db.insert(progressTable).values({ id: randomUUID(), userId, courseId, completedVideos: completedVideosStr, totalVideos, percentComplete, completed }).returning();
    }
    res.json({ ...row, completedVideos: JSON.parse(row.completedVideos), updatedAt: row.updatedAt.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
