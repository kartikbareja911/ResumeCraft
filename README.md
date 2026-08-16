# ResumeCraft — Rich-Formatting Resume Builder with ATS Score Engine
ResumeCraft is a full-stack MERN application that provides a rich-text resume builder (offering styling freedom like Word/Docs) combined with a real-time **ATS (Applicant Tracking System) Score Engine** powered by Google's **Gemini AI API** (utilizing the free Gemini API key) for deep semantic analysis, keyword matching, section grading, and actionable feedback.

---

## 🚀 Key Differentiator
Most resume editors lock users into rigid templates. ResumeCraft gives students full styling freedom (fonts, margins, spacing, inline bolding/lists) while providing real-time sidebar diagnostics that warn them if their aesthetic choices will break standard ATS scanning parsers using AI power. Additionally, the application incorporates a tier-based access control system: post-deployment, users receive **2 to 3 free ATS checks**, after which payment is required to unlock further scans.

---

## 🛠️ Group Project Division of Labor (Group of 3)
To ensure high marks during the project viva evaluation, tasks have been divided into distinct engineering domains:

### 1. Frontend & Design Console (Student 1)
*   **Technologies**: React.js, Tailwind CSS, Lucide-React.
*   **Key Deliverables**:
    *   Responsive dashboard portal for saved documents and version duplicates.
    *   Interactive A4 visual canvas with layout state mapping (custom paddings and heights).
    *   Inline rich-text formatting binding (Quill.js container scopes).
    *   Client-side DOM export rendering engine (`html2pdf.js`).

### 2. Backend Architecture & Security (Student 2)
*   **Technologies**: Node.js, Express.js, JWT, Bcrypt.js, Mongoose.
*   **Key Deliverables**:
    *   REST API controller routers for user credentials authentication and document CRUD.
    *   JWT signature parsing middleware.
    *   **Fail-Safe DB Fallback**: Programmed connection triggers that check if MongoDB is active. If MongoDB isn't running, the backend automatically instantiates and syncs to a local JSON database file (`db.json`) keeping the app fully operational without code modification.
    *   Puppeteer PDF compilation endpoint.

### 3. ATS Algorithmic & AI Engine (Student 3)
*   **Technologies**: Google Gemini AI API (`@google/generative-ai`), Free Tier API Key integration, usage counter logic.
*   **Key Deliverables**:
    *   **Gemini AI ATS Scanner**: AI-driven analysis prompt pipeline comparing resume content against target job descriptions for keyword relevance, impact metrics, and section completeness.
    *   **Parsability & Formatting Auditor**: Evaluates layout formatting, font choices, and section structure compatibility for ATS readability.
    *   **Freemium & Quota System (Post-Deployment)**: Tracks check counters per user (granting 2-3 free scans upon sign-up), restricting further API evaluations behind a paywall / credit purchase system.

---

## 💻 Tech Stack Summary
*   **Frontend**: React.js, Vite, Tailwind CSS, Quill
*   **Backend**: Node.js, Express.js
*   **AI Engine**: Google Gemini API (Free Tier API Key)
*   **Database**: MongoDB (with local file fallback `db.json`)
*   **Authentication**: JSON Web Tokens (JWT), BcryptJS
*   **PDF Printing**: Headless Puppeteer (server-side) & HTML2PDF (client-side fallback)
*   **Monetization & Usage Control**: Post-deployment freemium model (2-3 free ATS checks, paid credits thereafter)

---

## ⚙️ Running Locally

### Prerequisites
*   Node.js (v18+) and NPM installed on your machine.
*   MongoDB (optional - if running, backend connects automatically; if absent, the app falls back to `db.json`).
*   Gemini API Key (free API key set in `GEMINI_API_KEY` environment variable).

### Step-by-Step Launch
1.  **Clone / Download the project files.**
2.  **Configure environment**: copy `backend/.env.example` to `backend/.env` and fill in `MONGODB_URI` (optional) and a strong `JWT_SECRET`.
3.  **Install dependencies and start the app**:
    From the root directory (`ResumeCraft`), simply run:
    ```bash
    # Install dependencies for root, backend, and frontend
    npm run install-all
    
    # Run backend and frontend concurrently in development mode
    npm run dev
    ```
4.  **Access the application**:
    *   Frontend Dashboard: [http://localhost:3000](http://localhost:3000)
    *   Express Backend server: [http://localhost:5000](http://localhost:5000)

### Production (single-server) deployment
Build the frontend and run the backend with `NODE_ENV=production` — Express then serves the built frontend, so one server handles everything:
```bash
npm run build
npm run start        # NODE_ENV=production JWT_SECRET=<strong-secret> node backend/server.js
```
> Production fails fast if `JWT_SECRET` is missing. Set `CORS_ORIGIN` to your frontend domain (comma-separated). Behind an HTTPS reverse proxy (e.g. Nginx), set `TRUST_PROXY=true` so rate limiting sees real client IPs.

### Production hardening built in
*   **Security headers** via Helmet (`X-Frame-Options`, CSP, `Referrer-Policy`, …) and `X-Powered-By` disabled.
*   **Rate limiting**: 100 requests/15 min on auth endpoints, 300/15 min on all `/api` (per IP).
*   **Input validation**: email format, name/password length on signup; title/content types on resume create/update.
*   **Request body limit** (1 MB → `413`), JSON 404s for unknown API paths, and a public `/api/health` endpoint.
*   **Graceful shutdown** on `SIGTERM`/`SIGINT` (closes HTTP server + DB) for container/process-manager workloads.
*   **Database fail-safe**: if MongoDB is unreachable, the app switches to `db.json` instead of crashing.

### Process management (PM2)
```bash
npm install -g pm2
npm run build
pm2 start ecosystem.config.js   # runs backend/server.js with NODE_ENV=production
pm2 save && pm2 startup         # auto-restart on reboot
```

### Docker (one-command deployment)
```bash
docker compose up -d --build     # serves frontend + API on port 5000, auto-restarts
```
Configuration comes from `backend/.env` (optional — without it, `db.json` fallback is used). The `Dockerfile` is multi-stage: the frontend is built, then only production backend deps + the built assets are copied into a slim `node:20-alpine` image.

### Security / audit notes
`npm audit` on the backend reports **0 vulnerabilities**. The frontend reports 4 advisories, all non-exploitable for this app: `esbuild`/`vite` are dev-only build tooling (advisory affects only the dev server, never shipped), and `react-router` advisories target SSR/RSC hydration paths and open redirects — this is a client-only SPA with no SSR/RSC and no user-controlled link targets.

---

## 🎓 Viva Q&A Presentation Prep Cheat Sheet

#### Q1: How does the ATS Score Engine work and how is Gemini AI integrated?
> **Answer**: We integrated Google's **Gemini AI API** using a free API key tier. The backend sends the extracted resume text along with the targeted job description into a structured prompt engineered for Gemini. The model analyzes keyword density, soft/hard skill matching, quantified impact, and readability formatting, returning a granular score breakdown (0-100%) and actionable improvement suggestions.

#### Q2: How does the post-deployment freemium check limit work?
> **Answer**: To manage API call volume and monetize the application post-deployment, each registered user is allocated **2 to 3 free ATS checks**. The user model tracks `atsScanCount`. Once the limit is reached, the backend rejects further evaluation requests with a 402/403 status until the user completes a payment to unlock additional ATS checks.

#### Q3: What happens if MongoDB is not running on the examiner's computer?
> **Answer**: In `backend/db.js`, we implemented an automated fallback adaptor. The system checks if `MONGODB_URI` environment variable is defined. If MongoDB connection is unavailable, it fallbacks to a local file system database `db.json` using synchronous reading and writing. The authentication and resume creation CRUD will work identically.

#### Q4: Why use both Puppeteer and html2pdf for PDF export?
> **Answer**: Headless Puppeteer on the server yields high-fidelity prints using exact margins and A4 sizes. However, Puppeteer requires downloading a chromium package which can fail in offline or restricted grading environments. If the server PDF request returns an error, the React frontend immediately detects this and uses client-side canvas compilation (`html2pdf.js`) as a failover, ensuring the save feature never fails.

