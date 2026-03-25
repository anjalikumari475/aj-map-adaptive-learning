import { Router, type IRouter } from "express";
import { db, usersTable } from "../db/index.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) { res.status(400).json({ error: "name and email are required" }); return; }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.json({ ...existing[0], createdAt: existing[0].createdAt.toISOString() });
      return;
    }
    const id = randomUUID();
    const [user] = await db.insert(usersTable).values({ id, name, email }).returning();
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
