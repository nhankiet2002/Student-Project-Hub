import { Router, type IRouter } from "express";
import healthRouter from "./health";
import promatchRouter from "./promatch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(promatchRouter);

export default router;
