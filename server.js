// server.js – Guaranteed to work on Railway (November 2025)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("trust proxy", 1);                 // Required for Railway HTTPS

const PORT = process.env.PORT || 3000;

// Root / health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Chore backend is running!" });
});

// CORS – use your exact frontend URL
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://chores2d.tiiny.site";
app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());

// Body parsing
app.use(express.json({ limit: "1mb" }));

// Persistent storage
const DATA_DIR = process.env.DATA_DIR || "/data";
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load/save helpers
const loadState = () => {
  try { return fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : null; }
  catch (e) { console.error("Load error:", e.message); return null; }
};
const saveState = (state) => {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }
  catch (e) { console.error("Save error:", e.message); }
};

// Routes
app.get("/api/chore-state", (req, res) => res.json(loadState() || {}));

app.post("/api/chore-state", (req, res) => {
  if (!req.body || typeof req.body !== "object") return res.status(400).json({ error: "bad" });
  saveState(req.body);
  res.json({ ok: true });
});

// THIS IS THE ONLY LINE THAT MATTERS FOR RAILWAY RIGHT NOW
app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`CORS allowed: ${FRONTEND_ORIGIN}`);
  console.log(`Public URL: https://chore-backend-production.up.railway.app`);
});
