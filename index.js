import "dotenv/config";
import express from "express";
import { initSheets, appendRow } from "./sheets.js";

const PORT = process.env.PORT || 3010;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Sheet1";
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

// ── Validate required config ────────────────────────────────────────
if (!SHEET_ID) {
  console.error("❌  GOOGLE_SHEET_ID is not set. Check your .env file.");
  process.exit(1);
}
if (!KEY_FILE) {
  console.error(
    "❌  GOOGLE_SERVICE_ACCOUNT_KEY_FILE is not set. Check your .env file."
  );
  process.exit(1);
}

// ── Init Google Sheets client ───────────────────────────────────────
try {
  initSheets(KEY_FILE);
  console.log("✅  Google Sheets client initialised");
} catch (err) {
  console.error("❌  Failed to initialise Google Sheets client:", err.message);
  process.exit(1);
}

// ── Express app ─────────────────────────────────────────────────────
const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health-check endpoint.
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Webhook endpoint — receives Kadence form submissions.
 *
 * Kadence Blocks Pro sends a flat JSON object whose keys are the
 * "Webhook Field Name" values you configured in the form settings.
 */
app.post("/webhook", async (req, res) => {
  const data = req.body;

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Empty or invalid payload" });
  }

  // Auto-inject timestamp (Budapest time)
  const now = new Date().toLocaleString("hu-HU", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  data["Dátum"] = now;

  console.log("📩  Received webhook:", JSON.stringify(data));

  try {
    const result = await appendRow(SHEET_ID, SHEET_NAME, data);
    console.log("✅  Row appended:", result.updatedRange);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌  Failed to append row:", err.message);
    return res.status(500).json({ error: "Failed to write to Google Sheet" });
  }
});

// ── Start server ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Webhook server listening on http://localhost:${PORT}`);
  console.log(`    POST /webhook   — receive form data`);
  console.log(`    GET  /health    — health check`);
});
