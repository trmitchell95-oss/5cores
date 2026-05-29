export const structureReportPrompt = `Generate the complete Structure Report for this manuscript.

Follow this exact structure:
1. Executive Structure Verdict
2. Structure Scorecard (score each: Opening Hook / Narrative Spine / Chapter Purpose / Pacing / Escalation / Scene Balance / Ending Payoff — score 1-5 with one-line evidence)
3. Manuscript Spine (1-3 sentences identifying actual through-line)
4. Section / Chapter Function Map (assign a job to each section, flag unclear or duplicate function)
5. Pacing Diagnosis (too fast / too slow / wrong intensity — be specific)
6. Escalation Map (does pressure genuinely rise or simply repeat)
7. Structural Redundancy (sections performing the same dramatic function)
8. Missing Bridges (abrupt jumps, unearned shifts)
9. Priority Structure Fixes (ranked 1-5)

Output as clean markdown with headers.
Scores as: **Category — Score/5:** Evidence sentence.`;