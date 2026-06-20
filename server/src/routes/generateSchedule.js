import { historyBaseline, assignSchedule, buildFairness } from '../scheduling.js';
import { ollamaJson } from '../ollamaClient.js';

const FALLBACK_STEPS = [
  { label: 'קריאת תפקידים, שחרורים וזמינות' },
  { label: 'שיבוץ עובדי לילה בבלוקים שבועיים' },
  { label: 'שיבוץ מנהל ועובד למשמרות יום, כולל סופי שבוע' },
  { label: 'שיבוץ כונן לילה תוך הימנעות מהמנהל של היום הבא' },
  { label: 'איזון מול חודשים קודמים (היסטוריה)' },
];

export async function generateScheduleHandler(req, res) {
  const { month, team, exemptions, history } = req.body;
  const baseline = historyBaseline(team, history);
  const { shifts, counts } = assignSchedule(month, team, exemptions, baseline);
  const fairness = buildFairness(team, counts);

  let steps = FALLBACK_STEPS;
  try {
    const result = await ollamaJson(
      'אתה עוזר AI שמסביר בקצרה ובעברית את שלבי בניית סידור משמרות. החזר אך ורק JSON תקין בצורה {"steps":[{"label":"..."}]} עם 3 עד 5 שלבים קצרים, בלי טקסט נוסף.',
      `נבנה סידור לחודש ${month} עבור ${team.length} אנשי צוות. כל משמרת יום דורשת מנהל אחד ועובד אחד, כל משמרת לילה דורשת שני עובדים ומנהל כונן אחד. תאר בקצרה את שלבי הבנייה.`
    );
    if (Array.isArray(result?.steps) && result.steps.length && result.steps.every((s) => typeof s?.label === 'string')) {
      steps = result.steps;
    }
  } catch {
    // Ollama unavailable or returned invalid JSON — keep the deterministic fallback steps.
  }

  res.json({ shifts, fairness, steps });
}
