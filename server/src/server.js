import 'dotenv/config';
import express from 'express';
import { bearerAuth } from './auth.js';
import { generateScheduleHandler } from './routes/generateSchedule.js';
import { evaluateRequestHandler } from './routes/evaluateRequest.js';
import { rebalanceHandler } from './routes/rebalance.js';

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(bearerAuth);

app.post('/generate-schedule', generateScheduleHandler);
app.post('/evaluate-request', evaluateRequestHandler);
app.post('/rebalance', rebalanceHandler);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'שגיאה לא צפויה בשרת' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`ShiftMind AI server listening on port ${port}`);
});
