import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.disable("x-powered-by");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ==============================
   CONFIG
============================== */
const MAIN_SITE = "https://greencrafter.space";
const BLOCK_RENDER_DIRECT = true;

/* ==============================
   FAST STATIC
============================== */
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1y",
  etag: false,
  immutable: true
}));

/* ==============================
   SECURITY HEADERS
============================== */
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

/* ==============================
   BOT BLOCK
============================== */
const botRegex = /(bot|crawl|spider|ahrefs|semrush|curl|wget|headless)/i;

app.use((req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  if (botRegex.test(ua)) return res.status(403).end();
  next();
});

/* ==============================
   HARD PROTECTION – IMPORTANT
============================== */
app.use((req, res, next) => {
  const referer = (req.headers.referer || "").toLowerCase();
  const host = (req.headers.host || "").toLowerCase();
  const pathReq = req.path;

  // Allow only if coming from your main website
  const validReferer = referer.startsWith(MAIN_SITE.toLowerCase());

  // Block direct Render domain access
  if (
    BLOCK_RENDER_DIRECT &&
    !validReferer &&
    host.includes("onrender.com")
  ) {
    return res.status(403).send("Direct access blocked");
  }

  // Block direct access to frontend-loader
  if (pathReq === "/frontend-loader" && !validReferer) {
    return res.status(403).send("Loader direct access blocked");
  }

  next();
});

/* ==============================
   FRONTEND LOADER API (ONLY VIA WEBSITE)
============================== */
app.get("/frontend-loader", (req, res) => {
  res.json({ allowed: true });
});

/* ==============================
   SPA
============================== */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ==============================
   START
============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Protected server running on port " + PORT);
});
