const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// When we deploy on Railway, we’ll mount a volume at /data
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(cors()); // you can later restrict origin to your TiinyHost domain
app.use(express.json({ limit: "1mb" }));

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

// GET: page loads state from here
app.get("/api/chore-state", (req, res) => {
  const state = loadState();
  if (!state) return res.json({});
  res.json(state);
});

// POST: browser saves state here
app.post("/api/chore-state", (req, res) => {
  const incoming = req.body || {};
  if (typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid state" });
  }
  saveState(incoming);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Chore server running on port ${PORT}`);
});
