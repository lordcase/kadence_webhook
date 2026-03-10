import { google } from "googleapis";
import { readFileSync } from "node:fs";

let sheetsClient = null;
let authClient = null;

/**
 * Initialise the Google Sheets API client using a service-account key file.
 * Call once at startup; subsequent calls are no-ops.
 */
export function initSheets(keyFilePath) {
  const keyFileContent = JSON.parse(readFileSync(keyFilePath, "utf-8"));

  authClient = new google.auth.GoogleAuth({
    credentials: keyFileContent,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth: authClient });
}

/**
 * Read the first row of the sheet to discover column headers.
 * Returns an array of strings, e.g. ["name", "email", "message"].
 */
export async function getHeaders(spreadsheetId, sheetName) {
  const res = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  const headers = res.data.values?.[0];
  if (!headers || headers.length === 0) {
    throw new Error(
      `No headers found in row 1 of sheet "${sheetName}". ` +
        "Add column headers that match your Kadence webhook field names."
    );
  }
  return headers;
}

/**
 * Append a single row to the sheet.
 *
 * @param {string}   spreadsheetId  Google Sheet ID (from the URL)
 * @param {string}   sheetName      Tab name, e.g. "Sheet1"
 * @param {Object}   data           Flat key/value object from the webhook
 * @returns {Object}                API response metadata
 */
export async function appendRow(spreadsheetId, sheetName, data) {
  const headers = await getHeaders(spreadsheetId, sheetName);

  // Map the incoming data to the correct column order.
  // Keys that don't match a header are silently ignored.
  // Missing keys produce an empty cell.
  const row = headers.map((header) => {
    const value = data[header];
    return value !== undefined && value !== null ? String(value) : "";
  });

  const res = await sheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });

  return {
    updatedRange: res.data.updates?.updatedRange,
    updatedRows: res.data.updates?.updatedRows,
  };
}
