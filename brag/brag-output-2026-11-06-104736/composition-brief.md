# Hyperframes Composition Brief: Freelancer Finance

## Objective
Create a polished, 20-second launch-style brag video for Freelancer Finance, focused on one source-verified workflow: an invoice remains a receivable until its payment is recorded, then the dashboard reflects the ledger result.

## Output
- Composition directory: `brag/brag-output-2026-11-06-104736/composition/`
- Rendered video: `brag/brag-output-2026-11-06-104736/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `C:\Users\IT-HOME\Downloads\Projects\Program Files\Expense Tracker v1`
- Primary files read: `README.md`, `frontend/index.html`, `frontend/src/index.css`, `frontend/src/pages/Invoices.jsx`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/layouts/MainLayout.jsx`, `frontend/src/components/Sidebar.jsx`
- Product name: Freelancer Finance
- Tagline / strongest claim: “Complete Financial Operations” and “Invoice Issuance ≠ Cash Received.”
- Key UI moment to recreate: Invoices → “Record Payment” → “Payment recorded.” → dashboard cash-flow metrics.
- Copy that must appear verbatim:
  - “Invoice Issuance ≠ Cash Received”
  - “Record Payment”
  - “Payment recorded.”
  - “Financial Overview”
  - “Net Cash Flow”
  - “Complete Financial Operations”
- All client names, transaction records, dates, and amounts shown in the composition are fictional sample data, labeled “SAMPLE DATA.” No `.env` files, database contents, real account names, or personal data are to be used.

## Creative Direction
- Tone preset: app-store
- Creative direction: quietly confident, premium product demo with clean app-store clarity
- Interpretation: clean feature-forward framing, readable UI, precise motion, and restrained sound; no exaggerated claims or decorative tech graphics.
- Angle: make the app's “Invoice Issuance ≠ Cash Received” principle tangible by following a fictional invoice from outstanding receivable through payment settlement to the dashboard.
- Hook: open immediately on “INVOICE ISSUANCE ≠ CASH RECEIVED.”
- Outro: “Freelancer Finance” / “Complete Financial Operations.”
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - Any use or modification of the pre-existing `brag/composition/` draft; this run has its own composition directory.

## Visual Identity
- Background: #f6f8fa; surfaces: #ffffff
- Text: #0f172a; secondary text: #475569
- Accent: #2563eb; supporting success green: #059669
- Display and body font: the frontend's system sans stack; do not fetch fonts.
- Visual references from the project: light dashboard, grouped metrics, cash-flow trend chart, invoice/payment screens, categorized sidebar.
- LOOK: system sans on off-white (#f6f8fa), navy (#0f172a) type, analytics blue (#2563eb) and restrained green (#059669), generous spacing and flat white cards with fine slate borders.

## Storyboard
Use the full storyboard in `brag-plan.md` as the creative contract. Scenes must tile without gaps:
1. Invoice ≠ cash — 2.73s — source principle shown as the hook.
2. The receivable — 3.83s — realistic but fictional invoice in the app's Invoices UI; visibly labeled sample data.
3. Settlement — 4.37s — simulate “Record Payment,” show “Payment recorded.” and status Paid.
4. The ledger view — 6.00s — recreate the Dashboard structure with sample metrics and the “Income vs Expenses (6 Months)” trend chart.
5. Brand — 3.07s — Freelancer Finance end card and exact page tagline.

## Audio
- Audio role: warm, low-profile music with two quiet interface accents.
- Audio arc: music opens gently; one click marks the payment action, one warm impact marks settlement; music fades with the end card.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (Sascha Ende, ende.app, CC BY 4.0), local asset.
- Music treatment: start 0s at 0.22 gain, fade-in 0.4s, fade-out 0.8s at the end.
- Music cue guidance: use the bundled preset at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.md`. Optional major cue targets: 8.74s (settlement), 13.11s (chart reveal), 17.47s (brand lockup); prioritize legibility over beat sync.
- Audio-reactive treatment: not used because the local `media-use` extraction helper is unavailable; `hyperframes skills check` failed with “fetch failed.” A static, restrained brand glow is acceptable.
- Audio-coupled moments:
  - Record Payment click — short, quiet UI click on press.
  - Paid state — warm, short success accent on the visual landing.
- SFX selection guidance: source the low-risk `interface/click_003.ogg` and `impact/impactSoft_medium_001.ogg` from the bundled `/brag` SFX library; see its `sfx-analysis.md`.
- Audio files: copy music and the two chosen SFX into the new composition's local `assets/` tree. Never reference assets from the existing `brag/composition/` draft.

## Hyperframes Instructions
- Build a fresh Hyperframes composition under this run's `composition/` folder.
- Use the current root/clip timing contract and a finite, paused GSAP timeline registered on the root composition ID. Keep the composition deterministic and seek-safe.
- Use the real source files named above for visual and copy choices; reproduce only the relevant UI and fictional sample data.
- Do not use the pre-existing `brag/composition/` HTML, assets, or metadata as a base or reference.
- Do not add voiceover, captions, remote media, or network font dependencies.
- Run `npx hyperframes check` as the pre-render gate; resolve any errors before rendering locally to this run folder.
- Audio-reactive extraction is unavailable; do not create a pseudo visualizer in its place.
