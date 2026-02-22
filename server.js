import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import generate from "./api/generate.js";
import requestTopup from "./api/request-topup.js";
import approveTopup from "./api/approve-topup.js";
import addCredit from "./api/add-credit.js";

const app = express();

app.use(cors());
app.use(express.json());

// Fix __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend
app.use(express.static(__dirname));

// ================= API ROUTES =================
app.post("/api/generate", generate);
app.post("/api/request-topup", requestTopup);
app.post("/api/approve-topup", approveTopup);
app.post("/api/add-credit", addCredit);

// Health check (penting untuk Railway)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Fallback ke index.html (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ================= START SERVER =================
const PORT = process.env.PORT;

if (!PORT) {
  console.error("PORT not defined");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});