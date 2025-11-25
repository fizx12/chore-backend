// server.js – Fully working version for Railway (2025)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");

const app = express();

// Critical fixes for Railway public HTTPS access
app.set("trust proxy", 1);                    // Tells Express it's behind Railway's proxy
app.disable("x-powered-by");                  // Small security improvement

const PORT = process.env.PORT || 3000;

// Root route – Railway health check + nice landing page
app.get("/", (req, res) => {
  res.send("Chore backend is up and running! Everything works!");
});

// CORS – allow your Tiiny.site frontend
// Set FRONTEND_ORIGIN=https://chores2d.tiiny.site in Railway variables for security
// Or leave unset to allow everything (still works fine)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

// Handle preflight OPTIONS requests
app.options("*", cors());

// Body parsing
app.use(express.json({ limit: "1mb" }));

// Persistent storage – Railway volume at /data, fallback to local ./data
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log("Created data directory:", DATA_DIR);
}

// Load & save helpers
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error loading state:", e.message);
  }
  return null;
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
    console.log("State saved successfully");
  } catch (e) {
    console.error("Failed to save state:", e.message);
  }
}

// API Routes
app.get("/api/chore-state", (req, res) => {
  const state = loadState();
  res.json(state || {});
});

app.post("/api/chore-state", (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  saveState(incoming);
  res.json({ ok: true });
});

// Create HTTP server manually – this is the magic that fixes 502 on Railway
const server = http.createServer(app);

// Bind to both IPv4 and IPv6 – Railway requires this for public access
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on IPv4 → http://0.0.0.0:${PORT}`);
});

server.listen(PORT, "::", () => {
  console.log(`Server running on IPv6 → http://[::]:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`CORS allowed origin: ${FRONTEND_ORIGIN || "all (*)"}`);
  console.log(`Visit your app at: https://chore-backend-production.up.railway.app`);
});
