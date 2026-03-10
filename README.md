# Kadence Contact Form → Google Sheets Webhook

A lightweight Node.js server that receives contact form submissions from the **Kadence Blocks Pro** WordPress plugin and appends each entry as a new row in a Google Sheet.

## Features

- **Dynamic column mapping** — matches incoming field names to the header row of your Google Sheet
- **Auto-timestamp** — injects a `Dátum` column with the submission time (Europe/Budapest timezone)
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
3. Add **header row** columns that match your Kadence webhook field names, e.g.:

| Név | Email | Telefon | Tárgy | Úszástudás | Tapasztalat | Üzenet | Dátum |
|-----|-------|---------|-------|------------|-------------|--------|-------|

> The `Dátum` column is auto-filled by the server. All other columns must match the **Webhook Field Names** you configure in Kadence.

### 3. Server

```bash
git clone https://github.com/lordcase/kadence_webhook.git
cd kadence_webhook
cp .env.example .env    # edit with your values
npm install
npm start
```

### 4. Nginx Reverse Proxy (production)

Create an nginx config (e.g. `/etc/nginx/conf.d/webhook.yourdomain.conf`):

```nginx
server {
    listen 443 ssl;
    server_name webhook.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/webhook.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webhook.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name webhook.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

To generate the SSL certificate:

```bash
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d webhook.yourdomain.com
```

### 5. Process Manager (PM2)

Keep the server alive and auto-restart on reboot:

```bash
npm install -g pm2
pm2 start index.js --name kadence-webhook
pm2 save
pm2 startup    # follow the printed command to enable auto-start
```

### 6. Kadence WordPress Setup

1. Open your form in the Kadence block editor
2. **Actions After Submit** → enable **Webhook**
3. Set the Webhook URL to `https://webhook.yourdomain.com/webhook`
4. Under **Map Fields**, assign a **Webhook Field Name** to each form field — these must match your Google Sheet headers exactly

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
curl -X POST https://webhook.yourdomain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"Név":"Test","Email":"test@example.com","Telefon":"+36301234567","Üzenet":"Hello"}'
```
