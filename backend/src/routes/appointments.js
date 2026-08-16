import { Router } from "express";

import {
  createAppointment,
  listAppointments,
} from "../controllers/appointmentController.js";

const router = Router();

router.get("/", listAppointments);
router.post("/", createAppointment);

export default router;
