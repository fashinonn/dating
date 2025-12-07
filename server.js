import express from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.disable("x-powered-by");

// Enable gzip compression
app.use(compression());

// CORS (keep lightweight)
app.use(cors({ origin: "*" }));

app.use(express.json({ limit: "10kb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =============================
   FAST STATIC DELIVERY
============================= */
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1y",          // strong caching
  etag: true,
  immutable: true,
  lastModified: true
}));

/* =============================
   SECURITY HEADERS
============================= */
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

/* =============================
   FAST BOT BLOCK
============================= */
const blockedBots = /(bot|crawl|spider|slurp|bing|ahrefs|semrush|facebookexternalhit|python-requests|curl|wget|java|headless|node)/i;

app.use((req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  if (blockedBots.test(ua)) {
    return res.status(403).send("Bots not allowed");
  }
  next();
});

/* =============================
   COUNTRY BLOCK (FASTER)
============================= */
const ALLOWED_COUNTRIES = new Set(["JP"]);

app.use((req, res, next) => {
  const country = (req.headers["cf-ipcountry"] || "UNKNOWN").toUpperCase();
  if (country === "UNKNOWN") return next();
  if (!ALLOWED_COUNTRIES.has(country)) {
    return res.status(403).send("Access blocked by country");
  }
  next();
});

/* =============================
   ACCESS CONTROL (FAST)
============================= */
const ALLOWED_ORIGIN = "https://greencrafter.space";

app.use((req, res, next) => {
  const p = req.path;

  // Always allow static assets
  if (
    p === "/" ||
    p.endsWith(".html") ||
    p.endsWith(".css") ||
    p.endsWith(".js") ||
    p.endsWith(".webp") ||
    p.endsWith(".jpg") ||
    p.endsWith(".png") ||
    p.endsWith(".svg") ||
    p.endsWith(".mp3") ||
    p.endsWith(".mp4")
  ) return next();

  if (p === "/frontend-loader") return next();

  const referer = req.headers.referer || "";
  if (referer.startsWith(ALLOWED_ORIGIN)) return next();

  if (req.query.loader === "true") {
    return res.status(403).send("Direct loader access blocked");
  }

  return res.status(403).send("Direct access not allowed");
});

/* =============================
   FRONTEND LOADER API
============================= */
app.get("/frontend-loader", (req, res) => {
  res.json({ allowed: true });
});

/* =============================
   SPA FALLBACK
============================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =============================
   START SERVER
============================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Fast server running on port " + PORT);
});
