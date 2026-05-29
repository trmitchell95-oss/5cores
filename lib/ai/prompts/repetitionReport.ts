export const repetitionReportPrompt = `Generate the complete Repetition Report for this manuscript.

Follow this exact structure:
1. Executive Repetition Verdict
2. Repetition Scorecard (score each: Motif Control / Language Variety / Emotional Freshness / Sentence Pattern Variety / Scene Function Variety / Cut Readiness — score 1-5 with one-line evidence)
3. Top Repeated Words and Phrases (grouped: body / emotion / setting / thought verbs / dialogue tags / intensifiers)
4. Repeated Images and Motifs (each labeled: Keep / Strengthen / Reduce / Retire)
5. Emotional Beat Repetition (repeated emotional moves with no new consequence)
6. Sentence and Paragraph Rhythm Loops (structural habits)
7. Dialogue Repetition (repeated dialogue patterns)
8. Intentional Refrain vs Accidental Tic (clearly separate these)
9. Priority Repetition Fixes (ranked 1-5)

Output as clean markdown with headers.
Scores as: **Category — Score/5:** Evidence sentence.`;