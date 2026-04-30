import { Router, type IRouter } from "express";
import healthRouter from "./health";
import promatchRouter from "./promatch";
import chatbotRouter from "./chatbot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(promatchRouter);
router.use(chatbotRouter);

export default router;
