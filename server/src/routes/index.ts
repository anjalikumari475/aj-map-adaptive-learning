import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import usersRouter from "./users.js";
import progressRouter from "./progress.js";
import certificatesRouter from "./certificates.js";

const router: IRouter = Router();
router.use(healthRouter);
router.use(usersRouter);
router.use(progressRouter);
router.use(certificatesRouter);

export default router;
