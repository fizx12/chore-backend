

// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- PERSISTENT STORAGE SETUP ---------- //
// On Railway, create a Volume and mount it at /data,
// then set env var: DATA_DIR=/data
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------- CORS (TIINYHOST FRONTEND) ---------- //
// If you change your TiinyHost URL, update the origin string below.
const FRONTEND_ORIGIN = "https://chores2d.tiiny.site";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ---------- BODY PARSING ---------- //
app.use(express.json({ limit: "1mb" }));

// ---------- HELPERS TO LOAD / SAVE STATE ---------- //
function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    // file might not exist yet, or be invalid
    return null;
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

// ---------- API ROUTES ---------- //

// GET: front-end loads the full chore state
app.get("/api/chore-state", (req, res) => {
  const state = loadState();
  res.json(state || {});
});

// POST: front-end sends the updated full state
app.post("/api/chore-state", (req, res) => {
  const incoming = req.body || {};
  if (typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid state payload" });
  }

  saveState(incoming);
  res.json({ ok: true });
});

// ---------- START SERVER ---------- //
app.listen(PORT, () => {
  console.log(`Chore server running on port ${PORT}`);
  console.log(`Using data directory: ${DATA_DIR}`);
});
