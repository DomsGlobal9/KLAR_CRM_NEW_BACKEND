import { Router } from "express";
import { StageController } from "../controllers/stage.controller";

const router = Router();
const controller = new StageController();

router.post("/", controller.create.bind(controller));
router.get("/", controller.list.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;
