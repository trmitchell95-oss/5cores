export const surgicalReportPrompt = `Generate the complete Surgical Fix Report for this manuscript.
This report turns diagnosis into action. Be specific. No vague gestures.

Follow this exact structure:
1. Executive Surgical Verdict
2. Revision Severity Scorecard (score each: Developmental Risk / Line-Level Risk / Reader Confusion Risk / Voice Damage Risk / Cut Potential / Publication Readiness — score 1-5 with one-line evidence)
3. Fix Priority Tiers
   - Tier 1 Must Fix
   - Tier 2 Should Fix
   - Tier 3 Optional Polish
4. Exact Cut List (Cut/Reduce: [problem] / Why: [effect] / Suggested Action: [fix])
5. Exact Strengthen List (Strengthen: [area] / Why: [reason] / Suggested Action: [fix])
6. Exact Rewrite Targets
7. Before / After Examples (demonstrate fix patterns, not rewrites)
8. Revision Order (numbered sequence — structure before line polish)
9. Do Not Touch List
10. Final Surgical Plan

Output as clean markdown with headers.
Scores as: **Category — Score/5:** Evidence sentence.`;