import { historyBaseline, assignSchedule, buildFairness } from '../scheduling.js';
import { ollamaJson } from '../ollamaClient.js';

const FALLBACK_STEPS = [
  { label: 'קריאת תפקידים, שחרורים וזמינות' },
  { label: 'החלת איוש מינימלי לכל משמרת' },
  { label: 'איזון מול חודשים קודמים (היסטוריה)' },
  { label: 'חלוקת לילות וסופי שבוע באופן הוגן' },
];

export async function generateScheduleHandler(req, res) {
  const { month, team, exemptions, history, minCoveragePerShift } = req.body;
  const baseline = historyBaseline(team, history);
  const { shifts, monthCounts } = assignSchedule(month, team, exemptions, minCoveragePerShift, baseline);
  const fairness = buildFairness(team, monthCounts);

  let steps = FALLBACK_STEPS;
  try {
    const result = await ollamaJson(
      'אתה עוזר AI שמסביר בקצרה ובעברית את שלבי בניית סידור משמרות. החזר אך ורק JSON תקין בצורה {"steps":[{"label":"..."}]} עם 3 עד 5 שלבים קצרים, בלי טקסט נוסף.',
      `נבנה סידור לחודש ${month} עבור ${team.length} אנשי צוות, עם איוש מינימלי של ${minCoveragePerShift} לכל משמרת. תאר בקצרה את שלבי הבנייה.`
    );
    if (Array.isArray(result?.steps) && result.steps.length && result.steps.every((s) => typeof s?.label === 'string')) {
      steps = result.steps;
    }
  } catch {
    // Ollama unavailable or returned invalid JSON — keep the deterministic fallback steps.
  }

  res.json({ shifts, fairness, steps });
}
