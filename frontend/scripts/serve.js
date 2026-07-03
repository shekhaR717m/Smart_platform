const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.PORT || 5173);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

http
  .createServer((req, res) => {
    const cleanPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.join(root, cleanPath === "/" ? "index.html" : cleanPath);
    const safePath = filePath.startsWith(root) ? filePath : path.join(root, "index.html");
    const target = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(root, "index.html");
    res.writeHead(200, { "Content-Type": contentTypes[path.extname(target)] || "application/octet-stream" });
    fs.createReadStream(target).pipe(res);
  })
  .listen(port, () => {
    console.log(`Frontend running at http://localhost:${port}`);
  });
