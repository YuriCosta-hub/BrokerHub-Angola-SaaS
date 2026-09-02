import { Router, type IRouter } from "express";
import healthRouter from "./health";
import brokerhubRouter from "./brokerhub";

const router: IRouter = Router();

router.use(healthRouter);
router.use(brokerhubRouter);

export default router;
