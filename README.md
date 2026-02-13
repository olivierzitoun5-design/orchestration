# ⚡ LabSignal Orchestrator™

**NPI-Level Triggered Touchpoint Orchestration Engine**

A production-grade pharmaceutical HCP orchestration platform that converts lab signals (HbA1c, LDL-C, eGFR, PSA, etc.) into sequenced multi-channel marketing journeys at the individual NPI level.

---

## Features

### Command Center
Real-time dashboard with active journeys, signal volume, touchpoint delivery metrics, and channel performance analytics.

### Journey Builder (CRUD)
Create and configure multi-step orchestration journeys with:
- **Biomarker triggers** — 8 lab markers with configurable thresholds and operators
- **Touchpoint sequencing** — drag/configure 6 channel types (Programmatic Banner, Triggered Email, Endemic Banner, Rep Alert, Retarget Banner, Follow-up Email)
- **Per-journey guardrails** — frequency caps, channel spacing, suppression windows, engagement-based acceleration
- **Asset attachment** — upload and preview banners, email templates, and rep talking points per step

### ⚡ Signal Trigger Engine
- **Single signal** — fire a lab result for any NPI with real-time cascade visualization (journey matching → guardrail evaluation → touchpoint queuing)
- **Batch CSV** — import lab data files from Quest, LabCorp, or EMR exports with fuzzy biomarker name resolution and sequential processing with live progress

### 🎨 Asset Library
Upload, preview, and manage creative assets:
- **Banner creatives** — image upload with dimension detection
- **Email templates** — live HTML rendering in sandboxed iframe with source view
- **Rep talking points** — formatted text documents with compliance guidelines
- Assets linked to specific journey steps with inline thumbnails throughout the UI

### NPI Targeting
- Search, filter, and manage HCP records
- Individual NPI detail modal with journey progress visualization
- Suppress/reactivate HCPs with engagement scoring
- **Bulk CSV import** — upload NPI lists with column mapping, validation, deduplication

### Live Feed
Real-time orchestration event stream showing signals, deliveries, engagements, suppressions, and rep alerts.

---

## Tech Stack

- **React 18** — functional components with hooks
- **Vite 6** — build tooling
- **Zero dependencies** — no UI framework, all custom components
- **IBM Plex Sans/Mono** — typography via Google Fonts

---

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Production Build

```bash
npm run build
npm run preview
```

---

## Deploy to Railway

### Option A: One-click (recommended)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Railway auto-detects the Node.js project and deploys using `railway.json`
4. A public URL is generated automatically

### Option B: Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option C: Docker

```bash
docker build -t labsignal-orchestrator .
docker run -p 3000:3000 labsignal-orchestrator
```

---

## Deploy to GitHub Pages

```bash
# Add to vite.config.js: base: '/your-repo-name/'
npm run build
# Push dist/ to gh-pages branch
```

---

## Project Structure

```
labsignal-orchestrator/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── railway.json            # Railway deployment config
├── Dockerfile              # Container deployment
├── .gitignore
├── README.md
└── src/
    ├── main.jsx            # React entry point
    └── App.jsx             # Full application (single-file)
```

---

## Seed Data

The app ships with pre-loaded demonstration data:

- **3 live journeys** — HbA1c Elevated Protocol (Mounjaro), LDL-C Critical Protocol (Repatha), eGFR Decline Protocol (Farxiga)
- **10 NPI records** — across Endocrinology, Cardiology, Nephrology, Urology, Internal Medicine
- **10 creative assets** — banners, email templates, and rep talking points
- **Live event feed** — auto-generating orchestration events

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Server port (Railway sets this automatically) |

---

*Built by Publicis Health · Powered by LabSignal Orchestrator™*
