# Kadence Contact Form → Google Sheets Webhook

A lightweight Node.js server that receives contact form submissions from the [Kadence Blocks Pro](https://www.kadencewp.com/kadence-blocks/) WordPress plugin and appends each entry as a new row in a Google Sheet.

## Features

- **Dynamic column mapping** — matches incoming field names to the header row of your Google Sheet automatically
- **Auto-timestamp** — injects a `Date` column with the submission time
- **Accepts both** `application/json` and `application/x-www-form-urlencoded` payloads
- **Health check** endpoint at `GET /health`

---

## Setup

### 1. Google Cloud — Service Account

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Google Sheets API** — APIs & Services → Library → "Google Sheets API" → Enable
3. Create a **Service Account** — IAM & Admin → Service Accounts → Create
4. Download the **JSON key** — click the service account → Keys → Add Key → JSON
5. Save the downloaded file as `service-account.json` in the project root

### 2. Google Sheet

1. Create a Google Sheet (or open an existing one)
2. **Share it** with the service account email (`client_email` from the JSON key) — grant **Editor** access
3. Add a **header row** with column names that match the **Webhook Field Names** you'll configure in Kadence. For example:

| name | email | phone | message | Date |
|------|-------|-------|---------|------|

> The `Date` column is auto-filled by the server. All other columns must match the Webhook Field Names you set in Kadence exactly (case-sensitive).

### 3. Install & Configure

```bash
git clone https://github.com/lordcase/kadence_webhook.git
cd kadence_webhook
cp .env.example .env
npm install
```

Edit `.env` with your values:

```
PORT=3010
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account.json
GOOGLE_SHEET_ID=your-spreadsheet-id-here
GOOGLE_SHEET_NAME=Sheet1
```

> The **Spreadsheet ID** is the long string in your Google Sheet URL:
> `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

### 4. Run

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3010` by default (configurable via `PORT`).

### 5. Kadence WordPress Setup

1. Open your form in the Kadence block editor
2. **Actions After Submit** → enable **Webhook**
3. Set the **Webhook URL** to your server's address followed by `/webhook`, e.g. `https://your-server.com/webhook`
4. Under **Map Fields**, assign a **Webhook Field Name** to each form field — these must match your Google Sheet column headers exactly

---

## Deployment Options

### Option A: Direct access (IP or domain + port)

If your server is directly accessible, point Kadence to:

```
http://your-server-ip:3010/webhook
```

Make sure port `3010` (or your chosen port) is open in your firewall.

### Option B: Behind a reverse proxy (recommended for production)

Place the Node.js server behind a reverse proxy (e.g. nginx, Caddy, Apache) that handles SSL and routes traffic from a domain or subdomain to `127.0.0.1:3010`. This way, your webhook URL is a clean HTTPS address:

```
https://webhook.yourdomain.com/webhook
```

Using a reverse proxy also lets you add SSL via Let's Encrypt / Certbot without modifying the Node server.

### Keeping the server alive

For production, use a process manager to keep the server running and auto-restart on reboot. Popular options:

- [PM2](https://pm2.keymetrics.io/) — `pm2 start index.js --name kadence-webhook`
- [systemd](https://nodesource.com/blog/running-your-node-js-app-with-systemd-part-1/) — create a service unit file
- [Docker](https://docs.docker.com/get-started/) — containerise the app

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3010` |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | Path to the service-account JSON key | — |
| `GOOGLE_SHEET_ID` | Spreadsheet ID from the Google Sheet URL | — |
| `GOOGLE_SHEET_NAME` | Sheet tab name | `Sheet1` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/webhook` | Receives form data and appends a row to the sheet |
| `GET` | `/health` | Returns `{ "status": "ok" }` |

## Testing

```bash
curl -X POST http://localhost:3010/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hello from the webhook!"}'
```

Expected response:

```json
{ "success": true, "updatedRange": "Sheet1!A2:D2", "updatedRows": 1 }
```

## License

MIT
