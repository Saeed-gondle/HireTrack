# HireTrack Backend Debug Guide

Date: 2026-04-14
Scope: backend Node.js/Express/Drizzle/Redis codebase

This guide lists confirmed bugs, refactor opportunities, and improvement suggestions.
Each issue includes:
- What is wrong
- Why it is a problem
- A code example fix

## 1) Critical Bugs To Fix First

## 1.1 Global response cache is applied to all routes and methods
**Where:** `src/index.ts`, `src/redis/redisClient.ts`

**What is wrong**
- `app.use(cache(60))` runs for every route, including auth and write endpoints.
- Cache key is only `req.originalUrl`, not method/user-aware.

**Why it is a problem**
- Can leak user-specific responses between users.
- Can return stale POST/PATCH/DELETE responses.
- Can cache auth response payloads unexpectedly.

**Fix example**
```ts
// src/index.ts
// Cache only safe, public GET endpoints
app.use('/api/jobs', cache(60));

// src/redis/redisClient.ts
export const cache = (ttl = 60) => async (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (res.locals?.user?.id) return next(); // skip user-private endpoints

  const key = `cache:${req.method}:${req.originalUrl}`;
  // ...existing logic
};
```

## 1.2 Redis `set` API is used with legacy args in some places
**Where:** `src/controllers/authController.ts`

**What is wrong**
- `client.set(key, value, "EX", 86400)` is not the modern node-redis v5 style.

**Why it is a problem**
- Can break at runtime depending on client mode/version.

**Fix example**
```ts
await client.set(`user:${currentUser[0].id}`, JSON.stringify(userWithoutPassword), {
  EX: 60 * 60 * 24,
});
```

## 1.3 Redis errors in rate limiter are not handled
**Where:** `src/redis/redisClient.ts`

**What is wrong**
- `rateLimiter` does Redis operations without `try/catch`.

**Why it is a problem**
- If Redis is down, requests can fail with 500 instead of graceful fallback.

**Fix example**
```ts
export const rateLimiter = (limit = 100, windowSec = 60) => async (req, res, next) => {
  try {
    const key = `rate:${req.ip}`;
    const requests = await client.incr(key);
    if (requests === 1) await client.expire(key, windowSec);
    if (requests > limit) {
      const retryAfter = await client.ttl(key);
      return res.status(429).json({ error: 'Too many requests', retryAfter });
    }
    return next();
  } catch {
    return next(); // fail-open or switch to in-memory limiter fallback
  }
};
```

## 1.4 `KEYS` in cache invalidation is dangerous at scale
**Where:** `src/redis/redisClient.ts`

**What is wrong**
- `client.keys(pattern)` blocks Redis for large keyspaces.

**Why it is a problem**
- Performance degradation and request latency spikes.

**Fix example**
```ts
export const invalidateCache = async (pattern: string) => {
  const keys: string[] = [];
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key as string);
  }
  if (keys.length) await client.del(keys);
};
```

## 1.5 Job creation has inverted verification logic
**Where:** `src/controllers/jobController.ts`

**What is wrong**
- Condition blocks verified users instead of unverified users.

**Why it is a problem**
- Verified recruiters cannot create jobs; unverified users can continue.

**Fix example**
```ts
if (!req.user.isVerified) {
  return next(new AppError('You are not verified. Verify your account first.', 401));
}
```

## 1.6 Job insert call is incorrect
**Where:** `src/controllers/jobController.ts`

**What is wrong**
- `db.select().from(jobsTable).create(newJob).returning()` is invalid Drizzle usage.

**Why it is a problem**
- Runtime failure when creating jobs.

**Fix example**
```ts
const createdJob = await db.insert(jobsTable).values(newJob).returning();
```

## 1.7 Wrong field names when creating jobs/companies
**Where:** `src/controllers/jobController.ts`, `src/controllers/companyController.ts`, `src/db/schema.ts`

**What is wrong**
- `newJob` uses `company` while schema uses `company_id`.
- Company update uses `company_id` on users table, but schema has `company`.

**Why it is a problem**
- Broken relational links and invalid writes.

**Fix example**
```ts
// create job
const newJob = { ...result.data, company_id: company[0].id };

// create company transaction
await tx.update(usersTable)
  .set({ company: companyRow.id })
  .where(eq(usersTable.id, req.user.id));
```

## 1.8 Route uses `express()` instead of `express.Router()`
**Where:** `src/routes/jobRoutes.ts`, `src/routes/userRoutes.ts`, `src/routes/jobApplicationsRoute.ts`

**What is wrong**
- A full app instance is created per route file.

**Why it is a problem**
- Middleware/behavior differences and harder debugging.

**Fix example**
```ts
import express from 'express';
const router = express.Router();
export default router;
```

## 1.9 Cookie-based auth expects cookies, but cookie parser is not mounted
**Where:** `src/controllers/authController.ts`, `src/index.ts`

**What is wrong**
- Code reads `req.cookies.jwt`, but `cookie-parser` is not configured.

**Why it is a problem**
- Cookie auth path does not work reliably.

**Fix example**
```ts
// npm i cookie-parser
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

## 1.10 `generateMagicLink` references undefined config path
**Where:** `src/controllers/authController.ts`

**What is wrong**
- Uses `config.app.frontendUrl`, but `config.app` is not defined in env config.

**Why it is a problem**
- Runtime crash when generating magic links.

**Fix example**
```ts
const link = `${config.cors.webAppUrl}/users/login/magic?token=${token}`;
```

## 1.11 `autoLoginTokenExpiry` schema type mismatch
**Where:** `src/db/schema.ts`, `src/controllers/authController.ts`

**What is wrong**
- Schema defines `autoLoginTokenExpiry` as integer, controller stores ISO string.

**Why it is a problem**
- Incorrect comparisons and potential broken login flow.

**Fix example**
```ts
// schema
autoLoginTokenExpiry: timestamp('auto_login_token_expiry', { withTimezone: true, mode: 'date' }),

// controller
const expiry = new Date(Date.now() + 10 * 60 * 1000);
.set({ autoLoginToken: token, autoLoginTokenExpiry: expiry })
```

## 1.12 Create interview marks `reminder_sent` true immediately
**Where:** `src/controllers/interviewController.ts`

**What is wrong**
- New interviews are created with `reminder_sent: true`.

**Why it is a problem**
- Reminder cron job will skip sending reminders.

**Fix example**
```ts
const interview = await tx.insert(interviewsTable).values({
  application: application_id,
  scheduled_at: scheduled_at ?? Math.floor(Date.now() / 1000),
  interview_type,
  reminder_sent: false,
}).returning();
```

## 1.13 Dynamic route ordering conflict in interview routes
**Where:** `src/routes/interviewRoutes.ts`

**What is wrong**
- `/:jobId` is declared before `/:interviewId` and near `/user/:userId`.

**Why it is a problem**
- Ambiguous matching and wrong handler execution.

**Fix example**
```ts
router.get('/user/:userId', restrictTo('ADMIN', 'CANDIDATE'), getInterviewsByUserId);
router.get('/job/:jobId', restrictTo('ADMIN', 'RECRUITER', 'CANDIDATE'), getAllInterviewsByJob);
router.route('/:interviewId').get(getInterview).patch(updateInterview).delete(deleteInterview);
```

## 1.14 Broken generic factory typing/field access
**Where:** `src/controllers/handleFactory.ts`

**What is wrong**
- Uses `eq(table.id, id)` and `eq(column, ColumnId)` with weak typing.

**Why it is a problem**
- Hidden runtime bugs and hard-to-maintain generic handlers.

**Fix example**
```ts
// Prefer explicit handlers per model for reads, keep only simple shared wrappers.
// Or pass typed table columns explicitly:
export const getOne = <T>(table: T, idColumn: AnyColumn) =>
  catchAsync(async (req, res) => {
    const row = await db.select().from(table as any).where(eq(idColumn, req.params.id)).limit(1);
    // ...
  });
```

## 1.15 Candidate can update applications without ownership check
**Where:** `src/routes/jobApplicationsRoute.ts`, `src/controllers/jobApplicationsController.ts`

**What is wrong**
- `CANDIDATE` can PATCH `/:applicationId` if they know another id.

**Why it is a problem**
- Horizontal privilege escalation.

**Fix example**
```ts
const application = await db.query.applicationsTable.findFirst({
  where: eq(applicationsTable.id, req.params.applicationId),
});
if (!application) return next(new AppError('Application not found', 404));
if (req.user.role === 'CANDIDATE' && application.candidate !== req.user.id) {
  return next(new AppError('Forbidden', 403));
}
```

## 1.16 OTP and password reset endpoints missing anti-bruteforce controls
**Where:** `src/controllers/authController.ts`

**What is wrong**
- No attempt counter, no cooldown, no lockout policy.

**Why it is a problem**
- OTP can be brute forced.

**Fix example**
```ts
const attemptsKey = `otp_attempts:${email}`;
const attempts = Number((await client.get(attemptsKey)) ?? '0');
if (attempts >= 5) return next(new AppError('Too many attempts, try later', 429));
await client.set(attemptsKey, String(attempts + 1), { EX: 10 * 60 });
```

## 1.17 File upload has no size limit
**Where:** `src/controllers/userController.ts`

**What is wrong**
- Multer memory storage without `limits.fileSize`.

**Why it is a problem**
- Memory DoS risk.

**Fix example**
```ts
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
```

## 1.18 Redis debug calls execute on startup
**Where:** `src/redis/redisClient.ts`

**What is wrong**
- `client.set('foo','bar')` and `console.log(client.get('foo'))` run in production.

**Why it is a problem**
- Pollution of cache namespace and noisy logs.

**Fix example**
```ts
// Remove startup demo writes from runtime code.
```

---

## 2) Performance Optimization Suggestions

## 2.1 Do filtering/sorting/pagination in SQL, not in-memory
**Where:** `src/controllers/handleFactory.ts`

**Problem**
- `getAll` fetches all rows, then filters/sorts/paginates in memory.

**Impact**
- O(N) memory and CPU per request, slow for large tables.

**Improvement**
- Build Drizzle query with `where`, `orderBy`, `limit`, `offset`.
- Cache only paginated query response, not whole table.

## 2.2 Add DB indexes for common access patterns
**Where:** `src/db/schema.ts`

**Suggested indexes**
- `applications(job, candidate)` unique (also data integrity)
- `applications(candidate)`
- `applications(job)`
- `applications(current_stage)`
- `interviews(application)`
- `audit_logs(application_id, changed_at)`
- `jobs(company_id, status, created_at)`

**Example**
```ts
import { index, uniqueIndex } from 'drizzle-orm/pg-core';

export const applicationsTable = pgTable('applications', {
  // columns...
}, (t) => ({
  uniqJobCandidate: uniqueIndex('applications_job_candidate_uq').on(t.job, t.candidate),
  idxCandidate: index('applications_candidate_idx').on(t.candidate),
  idxJob: index('applications_job_idx').on(t.job),
  idxStage: index('applications_stage_idx').on(t.current_stage),
}));
```

## 2.3 Reduce N+1 queries in cron jobs
**Where:** `src/cron-jobs/emailCron.ts`

**Problem**
- Nested loops issue repeated queries per recruiter/company/job.

**Impact**
- Slow weekly jobs and high DB load.

**Improvement**
- Batch prefetch with joins and aggregate in memory once.
- Use chunks and `Promise.allSettled` for email dispatch.

## 2.4 Add pagination limits and max cap
**Where:** all list endpoints

**Problem**
- Default limit 100, no max enforcement.

**Improvement**
- Cap `limit` at 100 or 200 globally.

---

## 3) Redis Cache Review (Current + Improvements)

## Current state
- Redis used for rate limiting and generic response caching.
- Some controller-level cache keys like `all_<table>`.

## Gaps and risks
- Invalidating wrong keys (`all_jobs_${JSON.stringify(req.query)}`) while reads use `all_<tableName>`.
- User objects (including sensitive fields) cached directly.
- No namespaced key strategy versioning.
- Cache middleware applies too broadly.

## Recommended strategy
1. Namespace keys:
   - `cache:v1:jobs:list:<hash>`
   - `ratelimit:v1:ip:<ip>`
   - `session:v1:user:<id>`
2. Cache only GET + cacheable status 200.
3. Invalidate by domain events (job updated, application status changed).
4. Store sanitized user object only (never password hash).
5. Replace `KEYS` with `SCAN` iterator.

---

## 4) Security Review Improvements

## 4.1 Add security middleware baseline
- Add `helmet`
- Add strict `cors` with allowlist from env
- Add `cookie-parser`
- Add body size limits

**Example**
```ts
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
```

## 4.2 Harden authentication flow
- Do not issue full access token before verification, or issue short-lived `verify-only` token.
- Add refresh token rotation and token revocation strategy.
- Add password update flow requiring current password.

## 4.3 Prevent account enumeration
- Return same message for existing/non-existing email in forgot-password/new-otp.

## 4.4 Hash OTP/magic tokens before storing
- Store hash in DB, compare hashed input.
- Avoid plain token persistence.

---

## 5) Refactor and Reusability Suggestions

## 5.1 Improve handleFactory pattern
- Keep reusable pieces but avoid over-generic DB column guessing.
- Prefer small domain services with explicit query columns.

Suggested split:
- `services/applicationService.ts`
- `services/interviewService.ts`
- `services/jobService.ts`
- `repositories/*Repository.ts` for query abstraction

## 5.2 Create reusable validator middleware
Instead of parsing in each controller, centralize:
```ts
export const validate = (schema: z.ZodTypeAny) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));
  req.body = parsed.data;
  next();
};
```

## 5.3 Centralize authorization checks
Create policies like:
- `canModifyApplication(req.user, application)`
- `canReadInterview(req.user, interview)`

## 5.4 Move email side effects to queue/outbox
- Do not block request on external email provider.
- Insert job into outbox table, process async worker.

---

## 6) Code Structure and Readability Improvements

## 6.1 Suggested folder structure
```txt
src/
  app.ts
  server.ts
  config/
  modules/
    auth/
    users/
    companies/
    jobs/
    applications/
    interviews/
  middleware/
  services/
  repositories/
  jobs/
  lib/
```

## 6.2 Remove dead/legacy code
- Duplicate factory at `src/utils/handlerFactory.ts`
- Unused imports and stale comments
- Temporary logs in production paths

## 6.3 Standardize route patterns
Use explicit prefixes to avoid dynamic collisions:
- `/interviews/id/:interviewId`
- `/interviews/job/:jobId`
- `/interviews/user/:userId`

---

## 7) Priority Roadmap

## P0 (today)
1. Fix global cache scope and Redis keying.
2. Fix create job logic and insert call.
3. Fix auth cookie parser and magic link config path.
4. Fix interview reminder flag and route collisions.
5. Add ownership checks for application update/read.

## P1 (this week)
1. Add indexes and unique constraints.
2. Replace in-memory filtering with SQL query builder.
3. Implement OTP attempt throttling and enumeration-safe responses.
4. Add multer file limits and body limits.

## P2 (next iteration)
1. Move side effects (emails) to queue/outbox.
2. Refactor into module/service/repository layers.
3. Implement structured cache invalidation strategy.

---

## 8) Quick Wins Checklist

- [ ] Replace `express()` with `express.Router()` in route files.
- [ ] Add `cookie-parser`, `helmet`, `cors`.
- [ ] Remove Redis demo writes (`foo` key).
- [ ] Restrict cache middleware to public GET endpoints only.
- [ ] Use `await client.set(..., { EX })` style everywhere.
- [ ] Cap pagination limit and validate query params.
- [ ] Add ownership checks for candidate-accessed resources.
- [ ] Ensure consistent schema field names (`company` vs `company_id`).
