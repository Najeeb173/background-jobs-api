# Background Jobs API

A small API where a slow task (an 8-second report) runs as a background job with Inngest. The API answers instantly, a status endpoint reports progress, and a cron job runs every minute.

## How to run
Terminal 1 (API):
```
npm install
INNGEST_DEV=1 node index.js
```
Terminal 2 (Inngest Dev Server):
```
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```
Dashboard: http://localhost:8288

## Endpoints and functions
| Name | Type | What it does |
|---|---|---|
| GET /health | endpoint | returns `{status: "ok"}` |
| POST /reports | endpoint | returns 202 + id, sends event `report/requested` |
| GET /reports/:id | endpoint | returns pending/done, 404 if unknown |
| say-hello | function (event `test/hello`) | sleeps 5s, returns a greeting |
| make-report | function (event `report/requested`) | sleeps 8s, builds the report |
| heartbeat | function (cron `* * * * *`) | logs how many reports are pending/done/failed |

## Proof
[paste your 202 response, then the pending poll, then the done poll]

## Retry vs bad input (Stage 3)
[write one sentence in your own words: a retry helps with temporary failures, but bad input like a missing topic fails every time, so it is rejected with a 400]

## Cron (Stage 4)
- Every day at 08:00: `0 8 * * *`
- Every Sunday at 22:00: `0 22 * * 0`
