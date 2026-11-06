# Brag Plan: Freelancer Finance

## What is this app?
Freelancer Finance is an accounting and financial operations app for independent professionals, with a ledger that keeps invoices, settled income, expenses, transfers, currencies, and tax reserves distinct and reconcilable.

## The angle
Make financial honesty feel like the product's superpower. The hook states the rule freelancers most need to trust: an issued invoice is not money received. Then the video shows the payment settling into the ledger and the dashboard reflecting the real cash position. Every beat uses the app's actual labels and visual language; the figures and invoice are fictional demo data.

## Hook (first 2-3 seconds)
On the app's pale slate canvas, a crisp invoice marked SENT slides in beside the title “Invoice issued ≠ cash received.” A fine indigo line keeps the two ideas visibly separate. The line closes only when payment is recorded.

## Key moments (the middle)
- An outstanding invoice remains a receivable while “Net Cash Received” stays separate.
- “Record Payment” settles the balance and creates the matching income ledger entry.
- The real dashboard's six-month income-versus-expenses chart and Net Cash Flow card make the reconciled position tangible.
- A brief closing detail nods to transaction-date exchange-rate snapshots and a profit-based tax reserve.

## Outro / punchline
Land on “Freelancer Finance” with “Built for the money behind independent work.” The payoff is calm confidence: the numbers mean what they say.

## User flow worth showing
Issue an invoice → record its payment → see the settled amount in received income and the dashboard. The six-month cash-flow view reinforces the result.

## Tone
- Preset: polished
- Creative direction: a quietly meticulous product film for freelancers who want the books to add up
- Interpretation: restrained movement, clean typography, generous holds, and a warm music bed; no jokes or inflated claims.

## Format: landscape — 1920x1080
## Duration: 20 seconds

## Visual identity (from the project)
- Background: `#f8fafc` (Tailwind `slate-50`)
- Accent: `#4f46e5` (Tailwind `indigo-600`); supportive status colors `#10b981` (emerald) and `#ef4444` (rose)
- Text: `#1e293b` body and `#0f172a` primary headings
- Display font: system UI sans-serif (Tailwind `font-sans`)
- Body font: system UI sans-serif
- Strongest visual element: the real Financial Overview dashboard, especially the separate Net Cash Received, Outstanding Invoices, Net Cash Flow, and six-month Income vs Expenses modules.

## Share copy (draft)
Freelancer Finance keeps the books honest: an invoice stays a receivable until payment lands, and every real cash movement has a place in the ledger.

## Audio direction
- Role: warm, understated professional bed with a few motion-matched details.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady, clean, polished).
- Music treatment: start at 0s, 0.28 volume with a short fade-in and fade-out; let the music sit under the interface sounds.
- Music cue guidance: bundled preset `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; 109.96 BPM. Optional strong-cue targets near 8.74s (payment posts), 9.29s (cash-flow view arrives), and 17.47s (wordmark lands). Keep the copy readable if natural pacing overrides a cue.
- Audio-reactive treatment: subtle only; if supported, let the dashboard accent glow breathe slightly with the music. No equalizer, particles, or pulsing text.
- SFX posture: sparse and soft; use `interface/click_003.ogg` for the payment action, `impact/impactSoft_medium_001.ogg` for its confirmation, and `interface/bong_001.ogg` for the final wordmark.
- Audio-coupled moments: invoice separation, payment confirmation, dashboard/chart reveal, final wordmark.
- Restraint rule: no per-character typing sounds, cash-register clichés, or loud stingers.

## Storyboard

### Scene 1 — The rule — 2.4s
Start on a close, immaculate invoice detail, marked SENT. “Invoice issued ≠ cash received.” resolves clearly over the familiar slate-and-indigo palette. Keep the difference legible; the payment has not happened yet.
Sequential/interaction: invoice label arrives, then the statement; no simulated click.
Audio intent: quiet confidence from the first frame.
Audio-coupled idea: one soft paper/UI arrival.
Music: steady bed begins with a short fade-in.
Transition mood: clean, deliberate → Scene 2.

### Scene 2 — Receivable — 3.1s
Pull back to a recreation of the real Financial Overview layout. Show an illustrative invoice #2408 for $4,800 with SENT status and an Outstanding Invoices metric; keep Net Cash Received in a separate card. Caption: “Issued. Still a receivable.”
Sequential/interaction: invoice card and dashboard metrics settle in; no fictional live customer identity.
Audio intent: precise and calm.
Audio-coupled idea: a single subtle card arrival.
Music: unchanged, low under the interface.
Transition mood: soft focus shift → Scene 3.

### Scene 3 — Payment posts — 3.5s
The invoice detail opens to “Record Payment.” A restrained click confirms; status changes to PAID and the $4,800 balance moves into received income. Supporting line: “One payment. One confirmed ledger entry.” This depicts the product's atomic payment behavior.
Sequential/interaction: show the payment action, then the settled state; hold the completed state long enough to read.
Audio intent: a small, earned confirmation.
Audio-coupled idea: click at the visible action; soft confirmation on the posted ledger entry, near the 8.74s music cue.
Music: allow the reveal to sit on the beat if timing permits.
Transition mood: crisp, quiet handoff → Scene 4.

### Scene 4 — Cash flow, reconciled — 4.1s
Reveal the real “Income vs Expenses (6 Months)” area-chart treatment alongside “Net Cash Flow” and “Net Cash Received.” A thin indicator traces the two series and resolves on the current position. Caption: “Cash flow that means what it says.”
Sequential/interaction: chart lines draw in; the two metrics appear in sequence, then hold together.
Audio intent: reassuring, with no extra flourish.
Audio-coupled idea: chart reveal may land near the 13.11s cue; avoid fast numeric counting.
Music: same warm bed.
Transition mood: measured dissolve → Scene 5.

### Scene 5 — Keep the details honest — 4.4s
Two compact details from the real product resolve side by side: multi-currency activity with “Rate saved on transaction date,” and “Estimated Tax Reserve” with “Target based on net profit.” Avoid inventing a live exchange rate or treating an estimate as tax advice.
Sequential/interaction: rate-preservation detail, then reserve card; both remain visible for a readable hold.
Audio intent: understated polish.
Audio-coupled idea: subtle paired reveals; the completed detail may sit near the 17.47s cue.
Music: begin a gentle fade only after the final caption settles.
Transition mood: soft, restrained → Scene 6.

### Scene 6 — Wordmark — 2.5s
The interface clears to the light slate background. “Freelancer Finance” lands with “Built for the money behind independent work.” Leave a clean end hold; music fades out.
Sequential/interaction: single wordmark and one line; no extra call to action.
Audio intent: quiet resolution.
Audio-coupled idea: optional soft logo accent, not a hard sting.
Music: fade to silence by 20s.
Transition mood: fade to the end.

**Timing check:** 2.4 + 3.1 + 3.5 + 4.1 + 4.4 + 2.5 = 20.0 seconds.

## Planning rubric
1. **What is the app?** Freelancer Finance is a financial operations and accounting app for independent professionals.
2. **Most impressive claim:** an issued invoice does not inflate cash received; confirmed payment settles the receivable and posts income.
3. **Visual hook:** the actual Financial Overview dashboard, its pale slate canvas, indigo controls, distinct metric cards, and income/expense chart.
4. **What UI should be shown?** The dashboard, a fictional invoice/payment sequence, and the existing currency and estimated-tax-reserve concepts.
5. **Shortest satisfying video:** about 20 seconds to show the invoice rule, payment, reconciled dashboard, and detail cards without rushing labels.
6. **Tone:** polished; a quietly meticulous product film.
7. **Audio:** warm, understated instrumental bed and sparse, soft UI accents.
8. **Share caption:** “Freelancer Finance keeps the books honest: an invoice stays a receivable until payment lands, and every real cash movement has a place in the ledger.”
9. **User flow:** issue invoice → record payment → see settled income and its effect in the dashboard.

## Source and privacy notes
Read `README.md`, `frontend/index.html`, `frontend/src/App.jsx`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/layouts/MainLayout.jsx`, `frontend/src/components/MetricCard.jsx`, `frontend/src/index.css`, and `backend/app/api/v1/dashboard.py`. All invoice numbers and amounts shown in the video are invented demo data; no account, client, or user data is used.
