import { Router, type IRouter } from "express";
import { db, certificatesTable, progressTable, usersTable } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const COURSE_NAMES: Record<string, string> = {
  "data-analyst": "Data Analyst",
  "web-developer": "Web Developer",
  "cyber-security": "Cyber Security",
};

const router: IRouter = Router();

router.get("/certificates/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const rows = await db.select().from(certificatesTable).where(eq(certificatesTable.userId, userId));
    res.json(rows.map((r) => ({ ...r, issuedAt: r.issuedAt.toISOString() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/certificates/:userId/:courseId", async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const [progress] = await db.select().from(progressTable).where(and(eq(progressTable.userId, userId), eq(progressTable.courseId, courseId))).limit(1);
    if (!progress || !progress.completed) { res.status(400).json({ error: "Course not completed yet" }); return; }
    const existing = await db.select().from(certificatesTable).where(and(eq(certificatesTable.userId, userId), eq(certificatesTable.courseId, courseId))).limit(1);
    if (existing.length > 0) { res.json({ ...existing[0], issuedAt: existing[0].issuedAt.toISOString() }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const [cert] = await db.insert(certificatesTable).values({ id: randomUUID(), userId, courseId, courseName: COURSE_NAMES[courseId] ?? courseId, userName: user?.name ?? "Student" }).returning();
    res.json({ ...cert, issuedAt: cert.issuedAt.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
