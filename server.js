import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.disable("x-powered-by");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ==============================
   FAST STATIC FILES (FIRST)
============================== */
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1y",
  etag: false,
  immutable: true,
  lastModified: false
}));

/* ==============================
   HEADERS
============================== */
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

/* ==============================
   BOT BLOCK
============================== */
const botRegex = /(bot|crawl|spider|slurp|bing|ahrefs|semrush|curl|wget|headless)/i;

app.use((req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  if (botRegex.test(ua)) return res.status(403).end();
  next();
});

/* ==============================
   WEBSITE REFERER PROTECTION
============================== */
const ALLOWED_ORIGIN = "https://greencrafter.space";

app.use((req, res, next) => {
  const p = req.path;

  // Allow static assets always
  if (
    p === "/" ||
    p.endsWith(".html") ||
    p.endsWith(".css") ||
    p.endsWith(".js") ||
    p.endsWith(".webp") ||
    p.endsWith(".jpg") ||
    p.endsWith(".png") ||
    p.endsWith(".svg") ||
    p.endsWith(".mp4") ||
    p.endsWith(".mp3")
  ) return next();

  // Allow API
  if (p === "/frontend-loader") return next();

  const referer = (req.headers.referer || "").toLowerCase();

  if (referer.startsWith(ALLOWED_ORIGIN.toLowerCase())) {
    return next();
  }

  // Block direct access
  return res.status(403).send("Direct access blocked");
});

/* ==============================
   API
============================== */
app.get("/frontend-loader", (req, res) => {
  res.json({ allowed: true });
});

/* ==============================
   SPA FALLBACK
============================== */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"), {
    headers: {
      "Cache-Control": "public, max-age=3600"
    }
  });
});

/* ==============================
   START SERVER
============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("⚡ Server running on port " + PORT);
});
