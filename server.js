// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- ROOT ROUTE (REQUIRED FOR RAILWAY HEALTH CHECK) ----------
app.get("/", (req, res) => {
  res.send("Chore server is up and running! 🚀");
});

// ---------- CORS (TiinyHost frontend) ----------
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? "*" : FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.options("*", (req, res) => {
  res.sendStatus(200);
});

// ---------- PERSISTENT STORAGE SETUP ----------
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------- BODY PARSING ----------
app.use(express.json({ limit: "1mb" }));

// ---------- HELPERS TO LOAD / SAVE STATE ----------
function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return null; // file may not exist yet
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

// ---------- API ROUTES ----------
app.get("/api/chore-state", (req, res) => {
  const state = loadState();
  res.json(state || {});
});

app.post("/api/chore-state", (req, res) => {
  const incoming = req.body || {};
  if (typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid state payload" });
  }
  saveState(incoming);
  res.json({ ok: true });
});

// ---------- START SERVER (RAILWAY FIX: bind to 0.0.0.0) ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chore server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`CORS origin: ${FRONTEND_ORIGIN}`);
});
