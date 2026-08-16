import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT || "8000", 10);
const host = process.env.HOST || "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

const app = createApp();

const server = app.listen(port, host, () => {
  console.log(`Smart Telehealth API listening on http://${host}:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing HTTP server`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close server cleanly", error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
