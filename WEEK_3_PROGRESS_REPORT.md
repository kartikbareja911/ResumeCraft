# ResumeCraft — Week 3 Progress Report

ResumeCraft is a professional, recruiter-approved web resume builder featuring real-time styling parameters, A4 vector document scaling, dynamic templates, and direct PDF downloads. This document summarizes all features, architectures, and UI/UX implementations completed through the **Week 3 Evaluation**.

---

## 📂 Project Architecture

The project is structured as a full-stack JavaScript application:
```text
resumecraft/
├── backend/
│   ├── routes/              # Authentication and Resume CRUD routing
│   ├── middleware/          # JWT Authentication middleware
│   ├── models.js            # User and Resume Mongoose schemas
│   ├── db.js                # Database connection manager (MongoDB Atlas + file fallback)
│   └── server.js            # Express API server configuration
└── frontend/
    ├── src/
    │   ├── context/         # AuthContext + ThemeContext state managers
    │   ├── pages/           # Dashboard, Editor, Login, and Register pages
    │   ├── App.jsx          # React app routes configuration
    │   └── index.css        # Premium typography & A4 styling declarations
    ├── index.html           # Google Fonts CDN links (36+ families)
    └── vite.config.js       # Vite client compilation parameters
```

---

## 🛠️ Key Milestones & Features Implemented

### 1. Database Foundation (MongoDB Atlas Cloud Integration)
* **Direct Atlas Connection**: Set up standard, direct Mongoose connection handlers connecting to the MongoDB Atlas cluster.
* **Flexible Mixed Resume Model**: Resumes are stored using a `Mixed` MongoDB schema that permits storing arbitrary layout spacing configurations, color highlights, and styling attributes without schema friction.
* **Default Database Migrations**: Resumes are automatically initialized with Projects, Languages, and Certifications sections in the backend router on create, and migrated seamlessly on fetch inside the editor load state.
* **File Fallback System**: `db.js` includes a transparent JSON file fallback (`db.json`) that activates automatically if Atlas is unreachable, exposing the same API to all routes without code changes.
* **Fast-Fail Timeouts**: Added `serverSelectionTimeoutMS: 8000` and `socketTimeoutMS: 10000` to `mongoose.connect` so that mid-session Atlas connection drops fail within 8–10 seconds instead of the 30-second default.

### 2. Recruiter-Approved Visual Layout Templates
We built four highly polished, distinct template designs inspired by modern resume editors like FlowCV:
* **Classic Clear**: Clean, centered top header layout with stacked border separators.
* **Atlantic Blue**: Left-aligned column sidebar (32% solid `primaryColor` theme) displaying Name, Contact details, Skills, and Languages on a dark background; main details (Work Experience, Education, Projects, Certifications) occupy the right 68% column.
* **True Blue**: Modern layout featuring left-aligned header profiles, colored accents, and distinct section spacings.
* **Editorial Rule**: Centered serif academic layout bounded by top-and-bottom structural headers.

### 3. Expanded Resume Sections
Added and fully integrated three new standard resume sections to allow building complete, recruiter-approved CVs:
* **Projects**: Fields for project name, technologies stack, date, demo link, and description.
* **Languages**: Fields for languages and fluency levels.
* **Certifications**: Fields for certificate title, issuing organization, issue date, and a freeform **details / bullet points** field that now renders correctly on the A4 canvas.

### 4. Spacing Sliders Repairs
* Converted previous HTML range inputs from string-px binding variables (which froze standard browser dragging) to clean integer values.
* Programmed the update handler to append unit labels (like `"px"`) dynamically on change, allowing layout margins, spacing dividers, and padding to be dragged smoothly in real-time.

### 5. Typography Engine — 36 Fonts with Live Hover Preview
* **Relative `em` Sizing**: Replaced all hardcoded text sizes (`text-xs`, `text-sm`) with relative modifiers (`text-[0.9em]`, `text-[2.2em]`). Adjusting the font size slider now rescales the entire canvas layout proportionally.
* **36-Font Google CDN**: Added two batched `<link>` tags in `index.html` loading all 36 font families across Serif, Sans-Serif, and Monospace categories. Fonts are loaded at the HTML level to bypass Vite CSS parsing restrictions.
* **Times New Roman**: Added as a system font option (mapped to the OS-native `"Times New Roman", Times, serif` stack — no CDN download required).
* **Interactive Font Picker with Live Hover Preview**: Replaced the native `<select>` dropdowns with a custom scrollable font list where:
  * Every font name is **rendered in its own typeface** inside the picker.
  * **Hovering** a font instantly applies it live to the A4 resume canvas for real-time preview.
  * **Clicking** locks the font in as the saved selection, with a `✓ active` badge.
  * Fonts are grouped under **Serif / Sans / Mono** category headers.
  * Works independently for both **Body Font** and **Name/Heading Font** pickers.

### 6. Resizable Editor Sidebar
* Implemented a **drag-to-resize divider** between the editor sidebar and the resume canvas.
* Sidebar width is tracked via `sidebarWidth` state (default `390px`, min `280px`, max `600px`).
* Mouse event handlers (`onMouseDown`, `mousemove`, `mouseup`) on `document` manage the drag lifecycle with cursor and `userSelect` overrides while dragging.
* The auto-fit canvas scale recalculates correctly when the sidebar is resized.

### 7. A4 Canvas Scaling & Blank Space Fix
* Switched canvas scaling from CSS `transform: scale()` to a **wrapper div with fixed pixel dimensions** (`width: A4_WIDTH_PX * canvasScale`, `height: A4_HEIGHT_PX * canvasScale`) so that the layout footprint collapses correctly and no phantom blank space appears below the resume.
* `min-height: 297mm` is retained on `.a4-canvas` to prevent content from collapsing on sparse resumes.
* The PDF download handler temporarily resets the scale to `1` before `html2pdf.js` captures the canvas, then restores the workspace scale — ensuring pixel-perfect 1:1 PDF exports.

### 8. Persistent Light / Dark Mode
* Added a `ThemeContext` React context (`ThemeContext.jsx`) that reads and persists the user's preferred theme in `localStorage`.
* The `<html>` element's `dark` class is toggled reactively, enabling Tailwind CSS `dark:` variants across every component.
* Theme state is accessible globally via `useTheme()` hook in all pages (Dashboard, Editor, Login, Register).

### 9. Auth Resilience — Fast Loading Resolution
* Added a **5-second `AbortController` timeout** to the `AuthContext` startup token validation fetch.
* If MongoDB is slow or Atlas drops mid-session, the auth check now fails fast, clears the stale session, and redirects the user to the login page — instead of leaving the app stuck on the loading spinner for 30+ seconds.

### 10. Direct Client-Side PDF Downloader
* Integrated the client-side vector renderer `html2pdf.js` into the action bar.
* **Resolution preservation trick**: Before downloading, the renderer temporarily overrides the workspace viewport zoom scale (`transform: none`, `marginBottom: 0px`) to capture the A4 canvas at 100% full quality. Once saved, it immediately restores the active workspace scale.

---

## ⚡ Current Status & Server Configuration

* **Production Build Status**: Passed. `vite build` compiles successfully with **0 compiler warnings and 0 errors**.
* **Servers Configuration**:
  * **Frontend**: Port `3000` (Vite dev server)
  * **Backend**: Port `5000` (Node/Express — connected to MongoDB Atlas Cluster)
* **CORS**: Configured to allow `http://localhost:3000` in development.
* **Rate Limiting**: 300 req/15 min general API limiter; 100 req/15 min stricter auth limiter.
