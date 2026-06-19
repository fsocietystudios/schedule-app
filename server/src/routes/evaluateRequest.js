import { buildImpacts, findBackfillCandidate, getTouchedShifts } from '../scheduling.js';
import { ollamaJson } from '../ollamaClient.js';
import { formatDateShort } from '../shiftUtils.js';

export async function evaluateRequestHandler(req, res) {
  const { request, schedule, team, exemptions, minCoveragePerShift } = req.body;
  const touchedShifts = getTouchedShifts(request, schedule);
  const impacts = buildImpacts(touchedShifts, minCoveragePerShift);
  const understaffed = impacts.filter((i) => !i.ok);

  if (touchedShifts.length === 0) {
    res.json({
      feedback: {
        impacts,
        suggestion: 'לא נמצאו משמרות מושפעות בטווח שנבחר. ניתן לאשר ללא חשש.',
        recommendApprove: true,
      },
    });
    return;
  }

  const candidate = understaffed.length
    ? findBackfillCandidate(team, exemptions, schedule.shifts, understaffed[0].date, understaffed[0].slot, [
        request.memberId,
      ])
    : null;

  let fallbackSuggestion;
  const fallbackRecommend = understaffed.length === 0 || !!candidate;
  if (understaffed.length === 0) {
    fallbackSuggestion = 'ניתן לאשר. אם תאשר, אבצע איזון מחדש כך שהעומס יישאר הוגן לכולם.';
  } else if (candidate) {
    fallbackSuggestion = `ניתן לאשר. אם תאשר, אבצע איזון מחדש ואכסה את ${formatDateShort(understaffed[0].date)} עם ${candidate.name} (הכי מעט משמרות החודש).`;
  } else {
    fallbackSuggestion = 'הבקשה תשאיר איוש חסר ולא נמצא מחליף מתאים. מומלץ לבדוק ידנית לפני אישור.';
  }

  let suggestion = fallbackSuggestion;
  let recommendApprove = fallbackRecommend;

  try {
    const result = await ollamaJson(
      'אתה עוזר AI שמייעץ למנהל משמרות בעברית האם לאשר בקשת היעדרות/החלפה. תקבל את המשמרות שנפגעות ואת המלצת המערכת, והחזר אך ורק JSON בצורה {"suggestion":"...","recommendApprove":true|false} עם המלצה קצרה וברורה בעברית.',
      JSON.stringify({
        impacts,
        systemRecommendation: { suggestion: fallbackSuggestion, recommendApprove: fallbackRecommend },
      })
    );
    if (typeof result?.suggestion === 'string' && result.suggestion.trim() && typeof result?.recommendApprove === 'boolean') {
      suggestion = result.suggestion.trim();
      recommendApprove = result.recommendApprove;
    }
  } catch {
    // Ollama unavailable or returned invalid JSON — keep the deterministic fallback.
  }

  res.json({ feedback: { impacts, suggestion, recommendApprove } });
}
