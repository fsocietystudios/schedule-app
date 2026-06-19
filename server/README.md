# ShiftMind AI Server

Home-server bridge for ShiftMind's "remote" AI engine. Wraps a local [Ollama](https://ollama.com)
model behind three endpoints that mirror the app's `AiEngine` contract
(`app/src/ai/types.ts`). Shift assignment, fairness math, and rebalancing are computed
deterministically on the server so the data the app receives is always structurally valid;
Ollama is called only to produce the human-facing Hebrew text (step descriptions, approval
suggestions, rebalance summaries). If Ollama is unreachable or returns malformed JSON, each
route falls back to a deterministic message so the app keeps working.

## Setup

```bash
ollama pull qwen3.6   # or whichever model you set as MODEL_NAME
cp .env.example .env  # edit OLLAMA_URL / MODEL_NAME / API_TOKEN / PORT as needed
npm install
npm start
```

## Endpoints

- `POST /generate-schedule`
- `POST /evaluate-request`
- `POST /rebalance`

All three expect/return the same JSON shapes as `localEngine`/`remoteEngine` in the app.
If `API_TOKEN` is set in `.env`, requests must include `Authorization: Bearer <API_TOKEN>` —
this should match the "טוקן גישה" field in the app's Settings screen. Leave it empty to
accept unauthenticated requests (fine if the server is only reachable through your own
private tunnel).

In the app, set Settings → AI Engine to "שרת בית" and point "כתובת שרת" at wherever this
server is reachable from your phone (your own tunnel/reverse-proxy URL).
