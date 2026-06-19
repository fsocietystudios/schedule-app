import { useAppStore } from '@/store/useAppStore';
import {
  AiEngine,
  EvaluateRequestInput,
  EvaluateRequestOutput,
  GenerateScheduleInput,
  GenerateScheduleOutput,
  RebalanceInput,
  RebalanceOutput,
} from './types';

async function post<TOut>(path: string, body: unknown): Promise<TOut> {
  const { serverUrl, serverToken } = useAppStore.getState().settings;
  if (!serverUrl) {
    throw new Error('כתובת שרת הבית לא הוגדרה. עברו להגדרות וקבעו כתובת שרת.');
  }
  const url = serverUrl.replace(/\/+$/, '') + path;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(serverToken ? { Authorization: `Bearer ${serverToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('לא ניתן להתחבר לשרת הבית. בדקו את הכתובת ושהשרת פעיל.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`שרת הבית החזיר שגיאה (${res.status}). ${text.slice(0, 200)}`);
  }
  return (await res.json()) as TOut;
}

async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  return post<GenerateScheduleOutput>('/generate-schedule', input);
}

async function evaluateRequest(input: EvaluateRequestInput): Promise<EvaluateRequestOutput> {
  return post<EvaluateRequestOutput>('/evaluate-request', input);
}

async function rebalance(input: RebalanceInput): Promise<RebalanceOutput> {
  return post<RebalanceOutput>('/rebalance', input);
}

export const remoteEngine: AiEngine = { generateSchedule, evaluateRequest, rebalance };
