import { Router } from "express";

import { evaluateTriage } from "../controllers/triageController.js";

const router = Router();

router.post("/", evaluateTriage);

export default router;
