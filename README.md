# Kadence Contact Form → Google Sheets Webhook

Receives JSON submissions from the **Kadence Blocks Pro** contact form webhook and appends each submission as a new row in a Google Sheet.

## Quick Start

```bash
cp .env.example .env   # then fill in your values
npm install
npm run dev             # starts on http://localhost:3010
```

## Google Cloud Setup

1. **Create a project** at [console.cloud.google.com](https://console.cloud.google.com)
2. **Enable the Google Sheets API** — APIs & Services → Library → search "Google Sheets API" → Enable
3. **Create a service account** — IAM & Admin → Service Accounts → Create
4. **Download the JSON key** — click the service account → Keys → Add Key → JSON → save as `service-account.json` in this directory
5. **Share your Google Sheet** with the service account email (the `client_email` value in the JSON key) — give it **Editor** access

## Kadence Setup

1. Open your form in the Kadence block editor
2. Go to **Form Settings → Actions After Submit → Webhook**
3. Set the webhook URL to `https://your-server:3010/webhook`
4. Under **Map Fields**, assign a **Webhook Field Name** to each form field (e.g. `name`, `email`, `message`)
5. Make sure the first row of your Google Sheet has headers that match these field names exactly

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3010`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | Path to the service-account JSON key |
| `GOOGLE_SHEET_ID` | The spreadsheet ID from the sheet URL |
| `GOOGLE_SHEET_NAME` | Tab name (default `Sheet1`) |

## Endpoints

- `POST /webhook` — receives Kadence form data, appends a row to the sheet
- `GET /health` — returns `{ "status": "ok" }`
