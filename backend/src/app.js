import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import appointmentRoutes from "./routes/appointments.js";
import healthRoutes from "./routes/health.js";
import providerRoutes from "./routes/providers.js";
import triageRoutes from "./routes/triage.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", (_req, res) => {
    res.json({
      service: "Smart Telehealth API",
      status: "online",
      runtime: "nodejs",
      docs: "See backend/README.md",
    });
  });

  app.use("/health", healthRoutes);
  app.use("/api/providers", providerRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/triage", triageRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
