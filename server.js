// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- CORS (TiinyHost frontend) ---------- //
// FRONTEND_ORIGIN env var can be set to your TiinyHost URL.
// If not set, we fall back to "*".
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? "*" : FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

// Optional: handle OPTIONS explicitly (some browsers do this)
app.options("*", (req, res) => {
  res.sendStatus(200);
});

// ---------- PERSISTENT STORAGE SETUP ---------- //
// On Railway we’ll mount a Volume at /data and set DATA_DIR=/data.
// Locally it falls back to ./data.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------- BODY PARSING ---------- //
app.use(express.json({ limit: "1mb" }));

// ---------- HELPERS TO LOAD / SAVE STATE ---------- //
function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    // file may not exist yet
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
  console.log(`Allowing origin: ${FRONTEND_ORIGIN}`);
});
