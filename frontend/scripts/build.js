const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(src)) {
  fs.cpSync(path.join(src, entry), path.join(dist, entry), { recursive: true });
}

fs.writeFileSync(
  path.join(dist, "build-info.json"),
  JSON.stringify(
    {
      app: "Smart Telehealth",
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log("Built frontend/dist");
