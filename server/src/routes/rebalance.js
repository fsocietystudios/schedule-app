import { applyRebalance, buildLoad } from '../scheduling.js';
import { ollamaJson } from '../ollamaClient.js';

export async function rebalanceHandler(req, res) {
  const { request, schedule, team, exemptions } = req.body;
  const { shifts, beforeCounts, afterCounts } = applyRebalance(request, schedule, team, exemptions);
  const load = buildLoad(team, beforeCounts, afterCounts);

  const values = Object.values(afterCounts);
  const gap = values.length ? Math.max(...values) - Math.min(...values) : 0;
  const requesterName = team.find((m) => m.id === request.memberId)?.name ?? '';
  const fallbackSummary = `המשמרות של ${requesterName} פוזרו מחדש. בהתחשב בחודשים קודמים, הפער ירד ל-±${gap} — הוגן לכולם.`;

  let summary = fallbackSummary;
  try {
    const result = await ollamaJson(
      'אתה עוזר AI שמסכם בעברית, במשפט אחד קצר, איך סידור משמרות אוזן מחדש בעקבות בקשה שאושרה. החזר אך ורק JSON בצורה {"summary":"..."}.',
      JSON.stringify({ requesterName, load, gap })
    );
    if (typeof result?.summary === 'string' && result.summary.trim()) {
      summary = result.summary.trim();
    }
  } catch {
    // Ollama unavailable or returned invalid JSON — keep the deterministic fallback summary.
  }

  res.json({ shifts, rebalance: { scheduleId: schedule.id, load, summary } });
}
