# Hyperframes Composition Brief: Freelancer Finance

## Objective
Create a polished, 20-second product brag film for Freelancer Finance. Show that it distinguishes invoices issued from cash received, then follow a payment into the reconciled ledger and dashboard.

## Output
- Composition directory: `brag/composition/`
- Rendered video: `brag/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: the current Freelancer Finance app workspace.
- Primary files read: `README.md`, `frontend/index.html`, `frontend/src/App.jsx`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/layouts/MainLayout.jsx`, `frontend/src/components/MetricCard.jsx`, `frontend/src/index.css`, `backend/app/api/v1/dashboard.py`.
- Product name: Freelancer Finance (the product UI title).
- Strongest claim: “Invoice Issuance ≠ Cash Received.” A sent invoice creates a receivable; a recorded payment settles it and posts confirmed income.
- Key UI to recreate: the light Financial Overview dashboard with separate Net Cash Received, Outstanding Invoices, Net Cash Flow, and Income vs Expenses (6 Months) modules.
- Copy that must appear verbatim: “Invoice issued ≠ cash received.”; “Net Cash Received”; “Outstanding Invoices”; “Net Cash Flow”; “Income vs Expenses (6 Months)”; “Estimated Tax Reserve”.
- Fictional content: invoice #2408, $4,800, and all visualized transaction figures are illustrative only; no real client/account information.

## Creative Direction
- Tone preset: polished.
- Creative direction: a quietly meticulous product film for freelancers who want the books to add up.
- Interpretation: deliberate, readable motion; restrained interface sounds; calm, confident finish.
- Angle: financial honesty is the feature. Show an invoice staying in receivables until payment is recorded, then show the matching income and reconciled cash-flow dashboard.
- Hook: “Invoice issued ≠ cash received.” beside a crisp SENT invoice.
- Outro: “Freelancer Finance” / “Built for the money behind independent work.”
- Avoid: generic SaaS language, abstract filler, inflated claims, unverified tax or exchange-rate figures, and unrelated redesign.

## Visual Identity
- Background: `#f8fafc` (`slate-50`).
- Text: `#1e293b` (`slate-800`) and `#0f172a` (`slate-900`).
- Accent: `#4f46e5` (`indigo-600`); supporting status colors `#10b981` and `#ef4444`.
- Display and body font: system UI sans-serif, matching Tailwind `font-sans`.
- Visual references: the source dashboard's white rounded metric cards, thin slate borders, indigo controls, green income and rose expense chart lines.
- LOOK: airy, precise financial UI; pale slate ground, white rounded panels, crisp indigo controls, green income and rose expense accents, system sans typography, soft borders, deliberate motion, and generous readable holds.

## Storyboard
Follow the full storyboard in `brag/brag-plan.md` as the creative contract.

1. **The rule — 2.4s:** SENT invoice beside “Invoice issued ≠ cash received.”
2. **Receivable — 3.1s:** dashboard with fictional invoice #2408, Outstanding Invoices, and separate Net Cash Received.
3. **Payment posts — 3.5s:** record payment, settle balance, post confirmed income.
4. **Cash flow, reconciled — 4.1s:** real six-month area-chart concept with Net Cash Flow and Net Cash Received.
5. **Keep the details honest — 4.4s:** transaction-date rate snapshot and profit-based estimated tax reserve.
6. **Wordmark — 2.5s:** Freelancer Finance and the closing line.

## Audio
- Audio role: warm, understated bed with sparse motion-matched accents.
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`.
- Music treatment: 0.28 volume, brief fade-in, sit below UI sounds, gentle fade to silence by 20s.
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; use 8.74s, 9.29s, and 17.47s as optional strong-cue targets only when the story and reading time allow.
- Audio-reactive treatment: none; the installed workflow does not include the media-use extraction helper. Keep the existing interface motion restrained.
- Audio-coupled moments: soft interaction click on Record Payment; quiet confirmation when the ledger entry lands; optional gentle wordmark accent.
- SFX selection guidance: consult `assets/sfx/sfx-analysis.md`; choose a coherent, low-intensity interface palette and leave space around copy.
- Exact SFX choice: `interface/click_003.ogg` at the payment action, `impact/impactSoft_medium_001.ogg` when the ledger entry lands, and `interface/bong_001.ogg` on the wordmark; 0.42–0.62 volume, with no other hits.
- Voiceover: off.
- Audio files: place the chosen track and SFX under `brag/composition/assets/`.

## Hyperframes Instructions
Use the installed Hyperframes CLI's current composition and animation conventions. Keep every composition artifact and render inside `brag/`. Do not create a `SPEC.md`, publish, or use remote render services. Run `hyperframes check` before rendering, inspect the video, choose a settled poster frame, and make that poster frame 0 of the MP4.
