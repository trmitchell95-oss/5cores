export const marketReportPrompt = `Generate the complete Market / Reader Report for this manuscript.

Follow this exact structure:
1. Executive Market Verdict
2. Market / Reader Scorecard (score each: Reader Promise Clarity / Genre Alignment / Audience Fit / Hook Strength / Positioning Strength / Commercial Friction — score 1-5 with one-line evidence)
3. Best-Fit Reader (plain language description)
4. Wrong-Fit Reader (who may not enjoy this — be honest)
5. Shelf / Genre Diagnosis (primary shelf / secondary shelf / avoided shelf / why)
6. Reader Promise (what the manuscript promises)
7. Hook Diagnosis (one-sentence / emotional / genre / thematic / visual hook)
8. Reader Confusion Risks (where readers may misunderstand)
9. Positioning Language (usable marketing language — honest, not inflated)
10. Priority Market / Reader Fixes (ranked 1-5)

Output as clean markdown with headers.
Scores as: **Category — Score/5:** Evidence sentence.`;