export const voiceReportPrompt = `Generate the complete Voice Report for this manuscript.

Follow this exact structure:
1. Executive Voice Verdict (3-5 sentences, blunt summary)
2. Voice Scorecard (score each: Distinctiveness / Human Texture / Emotional Authority / Rhythm and Cadence / Voice Consistency / AI-Stink Risk — score 1-5 with one-line evidence)
3. Voice DNA (2-4 core traits of the manuscript's best voice)
4. Strongest Voice Zones (specific passages or sections with explanation)
5. Voice Drift Zones (where the manuscript stops sounding like itself)
6. AI-Stink Markers (patterns that feel artificial — do not accuse the writer of using AI, diagnose the prose effect)
7. Human Texture Opportunities (specific places to add human detail)
8. Voice Preservation Notes (what must not be cut)
9. Priority Voice Fixes (ranked 1-5, impact-based not ease-based)

Output as clean markdown with headers.
Scores as: **Category — Score/5:** Evidence sentence.`;