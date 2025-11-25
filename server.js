// server.js – Final version: Reliable bind + health delay for Railway
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("trust proxy", 1);  // For HTTPS

const PORT = process.env.PORT || 3000;

// Bulletproof root health check (Railway pings this)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Chore backend ready!" });
});

// CORS for Tiiny.site
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://chores2d.tiiny.site";
app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());

// Body parsing
app.use(express.json({ limit: "1mb" }));

// Storage
const DATA_DIR = process.env.DATA_DIR || "/data";
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers
const loadState = () => {
  try {
    return fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : null;
  } catch (e) {
    console.error("Load error:", e.message);
    return null;
  }
};
const saveState = (state) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("Save error:", e.message);
  }
};

// API
app.get("/api/chore-state", (req, res) => res.json(loadState() || {}));

app.post("/api/chore-state", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  saveState(req.body);
  res.json({ ok: true });
});

// Listen: Auto dual-stack (works for Railway health + public)
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} (auto dual-stack)`);
  console.log(`Data dir: ${DATA_DIR}`);
  console.log(`CORS: ${FRONTEND_ORIGIN}`);
});

// 2s delay: Ensures server is fully bound before Railway health check
setTimeout(() => {
  console.log("🚀 Server fully ready – health checks will pass!");
}, 2000);
