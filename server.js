import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.disable("x-powered-by");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ==============================
   ULTRA FAST STATIC DELIVERY
============================== */
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1y",
  etag: false,
  immutable: true,
  lastModified: false
}));

/* ==============================
   LIGHT SECURITY HEADERS
============================== */
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

/* ==============================
   ULTRA FAST BOT BLOCK (REGEX)
============================== */
const botRegex = /(bot|crawl|spider|slurp|bing|ahrefs|semrush|curl|wget|headless)/i;

app.use((req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  if (botRegex.test(ua)) {
    return res.status(403).end();
  }
  next();
});

/* ==============================
   FAST ACCESS CONTROL
============================== */
const ALLOWED_ORIGIN = "https://greencrafter.space";

app.use((req, res, next) => {
  const p = req.path;

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

  if (p === "/frontend-loader") return next();

  const referer = req.headers.referer || "";
  if (referer.startsWith(ALLOWED_ORIGIN)) return next();

  return res.status(403).end();
});

/* ==============================
   API
============================== */
app.get("/frontend-loader", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.end('{"allowed":true}');
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
  console.log("⚡ Superfast server running on port " + PORT);
});
