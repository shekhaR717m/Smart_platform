import { Router } from "express";

import { listProviders } from "../controllers/providerController.js";

const router = Router();

router.get("/", listProviders);

export default router;
