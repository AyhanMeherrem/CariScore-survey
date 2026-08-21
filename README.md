# Caricature Evaluation Survey

Survey app comparing AI-generated caricatures to reference photos.

**Live site:** _(add the Vercel URL here once deployed)_

## Run locally

```bash
npm install
cp .env.example .env   # add the Google Apps Script URL (results endpoint)
npm run dev
```

Open the printed `localhost` URL in the browser.

## Where results go

Answers are sent to a Google Sheet via the Apps Script Web App configured in `.env` (`VITE_RESULTS_ENDPOINT`). Setup code is in `google-apps-script/Code.gs`.
