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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(__dirname));

// API routes
app.post("/api/generate", generate);
app.post("/api/request-topup", requestTopup);
app.post("/api/approve-topup", approveTopup);
app.post("/api/add-credit", addCredit);

// Fallback ke index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});