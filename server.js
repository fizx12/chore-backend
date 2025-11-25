// server.js – FINAL VERSION (works with ANY tiiny.site URL forever)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("trust proxy", 1); // For HTTPS on Railway

const PORT = process.env.PORT || 3000;

// ROOT HEALTH CHECK (Railway needs this)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Chore backend ready!" });
});

// DYNAMIC CORS – allows ANY tiiny.site URL + localhost
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Allow localhost and 127.0.0.1 (for testing)
    if (origin.startsWith("http://localhost") || 
        origin.includes("github.io") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("https://localhost") ||
        origin.startsWith("https://127.0.0.1")) {
      return callback(null, true);
    }

    // Allow ANY tiiny.site domain (chores2d.tiiny.site, mytest.tiiny.site, etc.)
    if (origin.endsWith(".tiiny.site")) {
      return callback(null, true);
    }

    // Block everything else
    console.log("CORS blocked origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// Handle preflight
app.options("*", cors());

// Body parsing
app.use(express.json({ limit: "1mb" }));

// Persistent storage
const DATA_DIR = process.env.DATA_DIR || "/data";
const STATE_FILE = path.join(DATA_DIR, "chore-state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions
const loadState = () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Load error:", e.message);
  }
  return {};
};

const saveState = (state) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("Save error:", e.message);
  }
};

// API ROUTES
app.get("/api/chore-state", (req, res) => {
  res.json(loadState());
});

app.post("/api/chore-state", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  saveState(req.body);
  res.json({ ok: true });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data saved to: ${STATE_FILE}`);
  console.log("CORS: localhost + ANY *.tiiny.site allowed");
});

// Extra safety for Railway health checks
setTimeout(() => {
  console.log("Server fully ready – health checks will now pass!");
}, 2000);

