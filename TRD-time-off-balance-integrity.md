# Technical Requirements Document (TRD)

## Title
Time-Off Request Lifecycle and Balance Integrity for ReadyOn + ExampleHR HCM

## 1. Objective
Design and implement a reliable time-off service where:
- Employees see accurate balances and receive immediate request feedback.
- Managers approve/reject requests with validated, trustworthy data.
- ReadyOn remains defensively consistent even when HCM updates happen outside ReadyOn (anniversary grants, year-start refresh, admin corrections, etc.).

## 2. Business Context
ExampleHR uses HCM as the system of record for leave balances, while ReadyOn is the employee/manager workflow interface. Because HCM can be updated by other systems, balance drift is expected unless explicitly handled. The service must therefore support:
- Realtime validation for single request actions.
- Batch synchronization for full balance corpus updates.
- Defensive local validation when downstream guarantees are incomplete.

## 3. Scope
### In Scope
- Time-off request lifecycle: create, review, approve/reject.
- Dimension-aware balances (`employeeId`, `locationId`, `leaveType`).
- Realtime HCM validation gateway and defensive local checks.
- Batch HCM synchronization endpoint.
- Balance reconciliation behavior and lifecycle reservation/release.

### Out of Scope
- AuthN/AuthZ and role-based access controls.
- External HCM HTTP production client (current gateway is internal stub boundary).
- Multi-step approval chains and accrual rules by policy calendar.
- Observability stack (metrics dashboards, tracing, audit UI).

## 4. Functional Requirements
1. **FR-1 Request Creation**
   - Accept request with `employeeId`, `locationId`, `leaveType`, `startDate`, `endDate`, `reason`.
   - Compute `requestedDays` (inclusive date span).
   - Reject invalid date ranges.

2. **FR-2 Defensive Balance Validation**
   - Before reservation, verify ReadyOn balance equals HCM balance for the exact dimension tuple.
   - Reject when out-of-sync (conflict).
   - Reject when requested days exceed available HCM balance.

3. **FR-3 Realtime HCM Verification**
   - Perform realtime request validation through HCM gateway.
   - Reject invalid dimensions or insufficient balance responses from HCM.
   - Still rely on local checks as a fallback defensive layer.

4. **FR-4 Reservation and Lifecycle**
   - On create: reserve (deduct) requested days from ReadyOn balance.
   - Request starts in `PENDING`.
   - Status transitions allowed only from `PENDING` to `APPROVED` or `REJECTED`.
   - On reject: release reserved days back to ReadyOn.

5. **FR-5 Balance Sync**
   - Support single-record HCM sync with optional reconciliation.
   - Support batch HCM sync for corpus refresh.
   - Prevent negative post-reconciliation ReadyOn balances.

## 5. Non-Functional Requirements
- **Data integrity:** no lifecycle transition should bypass validation.
- **Consistency model:** strong defensive consistency within service boundary before state mutation.
- **Performance:** single request validation should be synchronous and fast (<250 ms target excluding external HCM latency).
- **Reliability:** startup must tolerate schema evolution for existing DB rows.
- **Maintainability:** explicit DTO contracts and modular service/gateway separation.

## 6. Data Model Requirements
### `time_off_requests`
- `employeeId`, `locationId`, `leaveType`
- `startDate`, `endDate`, `requestedDays`
- `status`, `reviewComment`, timestamps

### `leave_balances`
- Dimension tuple: (`employeeId`, `locationId`, `leaveType`) with unique constraint
- `readyOnBalance`, `hcmBalance`, `lastSyncedAt`

## 7. API Requirements
- `POST /api/time-off-requests`
- `GET /api/time-off-requests`
- `GET /api/time-off-requests/:id`
- `PATCH /api/time-off-requests/:id/status`
- `GET /api/time-off-requests/balances/:employeeId?locationId=&leaveType=`
- `PATCH /api/time-off-requests/balances/:employeeId`
- `POST /api/time-off-requests/balances/sync-hcm`
- `POST /api/time-off-requests/balances/sync-hcm-batch`

## 8. Key Challenges
1. **Cross-system drift**
   - HCM can be updated by external actors at any time.
2. **Dimension explosion**
   - Balances are not single values; they vary by location/type and potentially other dimensions.
3. **Partial trust in external validation**
   - HCM may report errors, but this cannot be assumed 100% reliable.
4. **Migration safety**
   - Adding non-null columns to SQLite tables with existing data can fail at startup.
5. **Lifecycle correctness**
   - Reservation/release logic must be symmetric and transition-safe.

## 9. Suggested Solution (Chosen Design)
1. **Dimension-aware local source of truth for workflow**
   - Store ReadyOn and mirrored HCM values per (`employeeId`, `locationId`, `leaveType`).
2. **Dual defensive gate before mutation**
   - Gate 1: local consistency + sufficiency checks.
   - Gate 2: realtime HCM validation call boundary (`HcmGateway`).
3. **Deterministic lifecycle invariants**
   - Reserve at create.
   - Only review `PENDING` records.
   - Release on reject.
4. **Realtime + batch sync combination**
   - Realtime: immediate single-dimension updates.
   - Batch: corpus refresh for anniversary/year-start events.
5. **Schema evolution hardening**
   - New required fields introduced with defaults (e.g., `requestedDays`) to avoid startup migration failures on existing rows.

## 10. Alternatives Considered
1. **Alternative A: HCM-only validation, no local defensive checks**
   - Pros: less local logic.
   - Cons: brittle when HCM does not reliably reject invalid dimensions/balance, poor resilience.
   - Decision: rejected.

2. **Alternative B: Eventual consistency only (async reconciliation, allow provisional requests)**
   - Pros: high write throughput.
   - Cons: managers may approve against stale data; employee feedback becomes non-deterministic.
   - Decision: rejected for this workflow-critical domain.

3. **Alternative C: Single undimensioned balance per employee**
   - Pros: simple data model.
   - Cons: invalid for multi-location and leave-type rules; cannot represent HCM reality.
   - Decision: rejected.

4. **Alternative D: Immediate hard fail on any drift without sync capability**
   - Pros: strict integrity.
   - Cons: operational deadlocks during known batch refresh windows.
   - Decision: rejected; replaced with controlled sync endpoints.

## 11. Risks and Mitigations
- **Risk:** Reconciliation can drive ReadyOn negative.
  - **Mitigation:** explicit guard rejects such updates.
- **Risk:** API consumers omit dimensions.
  - **Mitigation:** DTO-level required fields for creation/sync/upsert payloads.
- **Risk:** startup regression from schema changes.
  - **Mitigation:** defaults for new required columns + migration review checklist.
- **Risk:** batch replay duplicates.
  - **Mitigation (next phase):** idempotency key and event ledger.

## 12. Test Cases
### Unit Cases Implemented
1. Create request defaults to `PENDING`.
2. Invalid date range rejected.
3. Create rejected when ReadyOn/HCM out of sync.
4. HCM single sync reconciles by delta.
5. Rejecting request restores reserved days.
6. Non-`PENDING` request cannot be reviewed.
7. Requested day count is included on create path.

### API/E2E Cases Recommended
1. Create with missing dimensions returns `400`.
2. Create with insufficient HCM balance returns `400`.
3. Create while out-of-sync returns `409`.
4. Realtime sync with `reconcileReadyOn=false` preserves ReadyOn.
5. Batch sync updates N records and returns `updated=N`.
6. Duplicate dimension tuple upsert preserves uniqueness behavior.
7. Status update to `PENDING` rejected.
8. Unknown request ID returns `404`.

## 13. Proof of Coverage
Coverage run executed with:
- `npx jest --coverage --runInBand`

Result snapshot:
- Test suites: `2 passed / 2 total`
- Tests: `7 passed / 7 total`
- Overall coverage:
  - Statements: `46.32%`
  - Branches: `37.39%`
  - Functions: `41.93%`
  - Lines: `44.6%`
- `time-off.service.ts` coverage:
  - Statements: `76.31%`
  - Branches: `56.52%`
  - Functions: `69.23%`
  - Lines: `75.67%`

Interpretation:
- Core business logic has moderate-good unit coverage.
- Controller/DTO/module/bootstrap areas remain under-covered and should be improved with E2E tests and focused controller tests.

## 14. Implementation Traceability
- Business rules and orchestration: `src/time-off/time-off.service.ts`
- API contract surface: `src/time-off/time-off.controller.ts`
- Dimension-aware entities: `src/time-off/time-off.entity.ts`, `src/time-off/leave-balance.entity.ts`
- HCM integration boundary: `src/time-off/hcm.gateway.ts`
- Unit evidence: `src/time-off/time-off.service.spec.ts`

## 15. Next-Phase Recommendations
1. Add externalized HCM HTTP client with retry/backoff and circuit breaker.
2. Introduce idempotency/event ledger for sync endpoints.
3. Expand E2E coverage for all endpoints and validation paths.
4. Add audit logging for manager decisions and balance mutations.
5. Add operational alerts for sustained ReadyOn/HCM drift by dimension.
