# Time-Off Microservice (NestJS + SQLite)

A RESTful microservice for managing employee time-off requests. It supports creating requests, listing/filtering them, reading details, updating request status (approve/reject), and keeping leave balances aligned with HCM.

## Technical Requirements

- Runtime: Node.js `>=20.11` (recommended by Nest 11 ecosystem)
- Framework: NestJS
- Database: SQLite (file-based local persistence)
- ORM: TypeORM
- Validation: `class-validator` and `class-transformer`
- Testing: Jest and Supertest
- API style: JSON over HTTP REST

## Solution Structure

```text
src/
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts
  common/
    enums/
      time-off-status.enum.ts
  time-off/
    dto/
      create-time-off.dto.ts
      update-time-off-status.dto.ts
    time-off.controller.ts
    time-off.entity.ts
    time-off.module.ts
    time-off.service.ts
    time-off.service.spec.ts
test/
  app.e2e-spec.ts
```

## Domain Rules Implemented

- A request always starts with `PENDING` status.
- `endDate` cannot be earlier than `startDate`.
- Status can be updated only to `APPROVED` or `REJECTED` from `PENDING`.
- Optional review comments can be attached while updating status.
- Request creation validates balance parity between ReadyOn and HCM before reserving requested days.
- Rejecting a request restores the reserved days to ReadyOn.
- HCM-originated balance changes (anniversary/year-start refreshes) can be reconciled through sync endpoints.

## API Endpoints

Base URL: `http://localhost:3000/api`

- `GET /health` - Service health check.
- `POST /time-off-requests` - Create a request.
- `GET /time-off-requests` - List requests, optional `?status=PENDING|APPROVED|REJECTED`.
- `GET /time-off-requests/:id` - Get one request by ID.
- `PATCH /time-off-requests/:id/status` - Update request status.
- `GET /time-off-requests/balances/:employeeId?locationId=X&leaveType=Y` - Get current ReadyOn/HCM balances by dimensions.
- `PATCH /time-off-requests/balances/:employeeId` - Set balances directly for a dimension tuple.
- `POST /time-off-requests/balances/sync-hcm` - Realtime HCM sync for one dimension tuple.
- `POST /time-off-requests/balances/sync-hcm-batch` - Batch HCM sync for full balance corpus.

### Sample Payloads

Create request:

```json
{
  "employeeId": "EMP-101",
  "locationId": "LOC-1",
  "leaveType": "ANNUAL",
  "startDate": "2026-05-01",
  "endDate": "2026-05-03",
  "reason": "Family event"
}
```

Update status:

```json
{
  "status": "APPROVED",
  "reviewComment": "Approved by manager"
}
```

Batch sync:

```json
{
  "reconcileReadyOn": true,
  "records": [
    {
      "employeeId": "EMP-101",
      "locationId": "LOC-1",
      "leaveType": "ANNUAL",
      "hcmBalance": 14
    }
  ]
}
```

## Setup and Run

1. Install dependencies:

```bash
npm install
```

2. Optional environment variables:

- `PORT` (default: `3000`)
- `DB_PATH` (default: `data/time-off.sqlite`)

PowerShell example:

```powershell
$env:PORT=3000
$env:DB_PATH="data/time-off.sqlite"
```

3. Run in development mode:

```bash
npm run start:dev
```

4. Build and run in production mode:

```bash
npm run build
npm run start:prod
```

## Test Strategy

### Unit Tests

- Focus on service-level business rules.
- Current tests validate:
  - request creation defaults to `PENDING`
  - invalid date range is rejected

Run:

```bash
npm run test
```

### End-to-End Tests

- Focus on API behavior and app bootstrap.
- Current smoke test validates `GET /api/health`.

Run:

```bash
npm run test:e2e
```

### Recommended Next Tests

- Status transition scenarios (`APPROVED`, `REJECTED`, invalid transitions)
- Request listing with status filters
- Validation failures for malformed payloads
- 404 cases for unknown request IDs
