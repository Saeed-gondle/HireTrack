# HireTrack Database Schema & Relations Analysis

This document provides a comprehensive analysis of the HireTrack database schemas, relations, and configurations. It identifies configuration gaps, architectural issues, and TypeScript compiler errors, and provides solutions to resolve them.

---

## 1. Directory & File Structure Review
The database-related code is structured as follows under `backend/src/`:
- [enums.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/enums.ts): Database `pgEnum` definitions (roles, stages, job categories, etc.).
- [schema.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/schema.ts): Database tables and schemas.
- [relations.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/relations.ts): Drizzle-level table relations.
- [config/db.ts](file:///d:/Code/Projects/hitetrack/backend/src/config/db.ts): Drizzle DB instance initialization and connection pooling using Neon/PostgresJS.
- [drizzle.config.ts](file:///d:/Code/Projects/hitetrack/backend/drizzle.config.ts): Configuration for Drizzle Kit.

---

## 2. Critical Configuration & Structural Gaps

### 🪟 Gap 1: Relations Defined but Not Registered in Drizzle
Although relations are correctly defined in [relations.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/relations.ts), they are **never registered** with the database instance.
- **Where:** In [config/db.ts](file:///d:/Code/Projects/hitetrack/backend/src/config/db.ts), the database is initialized with:
  ```typescript
  import * as schema from "../db/schema";
  export const db = drizzle(client, { schema });
  ```
- **Why it's a problem:** Since `schema.ts` does not export anything from `relations.ts`, the relations are completely hidden from Drizzle. At runtime, relational queries like `db.query.interviewsTable.findMany({ with: { application: true } })` fail or return type errors (`Property 'application' does not exist on type 'never'`).
- **Solution:** Add an export statement in [schema.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/schema.ts) to export all relations:
  ```typescript
  export * from "./relations";
  ```

---

### 🔍 Gap 2: Inconsistent Schema Columns in Queries & Cron Jobs
There are several mismatches between column names defined in the schema and the queries written in the code.

#### A. Company Owner Column Mismatch
- **Schema definition in [schema.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/schema.ts):**
  ```typescript
  export const companiesTable = pgTable("companies", {
    owner: uuid("owner").notNull().references(() => usersTable.id),
    ...
  });
  ```
- **Usage in [emailCron.ts](file:///d:/Code/Projects/hitetrack/backend/src/cron-jobs/emailCron.ts) (line 121):**
  ```typescript
  const companies = await db.query.companiesTable.findMany({ 
    where: eq(companiesTable.owner_id, recruiter.id) 
  });
  ```
- **Problem:** `owner_id` does not exist on `companiesTable`. It must be `owner`.

#### B. Job Company Column Mismatch
- **Schema definition in [schema.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/schema.ts):**
  ```typescript
  export const jobsTable = pgTable("jobs", {
    company: uuid("company").notNull().references(() => companiesTable.id),
    ...
  });
  ```
- **Usage in [emailCron.ts](file:///d:/Code/Projects/hitetrack/backend/src/cron-jobs/emailCron.ts) (line 124):**
  ```typescript
  const jobs = await db.query.jobsTable.findMany({ 
    where: eq(jobsTable.company_id, company.id) 
  });
  ```
- **Problem:** `company_id` does not exist on `jobsTable`. It must be `company`.

#### C. Non-Existent Column in `interviewsTable` Query
- **Usage in [interviewController.ts](file:///d:/Code/Projects/hitetrack/backend/src/controllers/interviewController.ts) (line 146):**
  ```typescript
  export const getInterviewsByUserId = getAllById(interviewsTable, "user_id")
  ```
- **Problem:** `interviewsTable` only has `application` (foreign key to `applicationsTable`). It has no direct relation/column for `user_id` or `user`. Fetching interviews for a user requires joining with the `applicationsTable` where `candidate = userId`.

#### D. Dynamic `eq` Queries in `getAllById`
- **Definition in [handleFactory.ts](file:///d:/Code/Projects/hitetrack/backend/src/controllers/handleFactory.ts) (line 111):**
  ```typescript
  const result = await db.select().from(table).where(eq(column, ColumnId));
  ```
- **Problem:** `column` is passed as a string (e.g., `"job"` or `"candidate"`), but Drizzle's `eq()` expects a Drizzle Column object, not a raw string. 
- **Solution:** Access the column dynamically using bracket notation:
  ```typescript
  const result = await db.select().from(table).where(eq(table[column], ColumnId));
  ```

---

### 🛠️ Gap 3: Syntax and Logic Errors in Controllers

#### A. Invalid Drizzle Call in `interviewController.ts`
- **Usage in [interviewController.ts](file:///d:/Code/Projects/hitetrack/backend/src/controllers/interviewController.ts) (line 136):**
  ```typescript
  await db.from(interviewsTable).where(eq(interviewsTable.id, interview[0].id)).update({
      reminder_sent: true
  })
  ```
- **Problem:** `db.from()` is not a valid method in Drizzle for performing updates. 
- **Solution:** Rewrite it using the standard `.update()` syntax:
  ```typescript
  await db.update(interviewsTable).set({ reminder_sent: true }).where(eq(interviewsTable.id, interview[0].id));
  ```

#### B. Redundant `.where()` Chaining in `jobApplicationsController.ts`
- **Usage in [jobApplicationsController.ts](file:///d:/Code/Projects/hitetrack/backend/src/controllers/jobApplicationsController.ts) (lines 40-41):**
  ```typescript
  .where(eq(applicationsTable.job, jobId))
  .where(eq(applicationsTable.candidate, req.user.id));
  ```
- **Problem:** Calling `.where()` multiple times overrides previous conditions.
- **Solution:** Combine them using the `and()` operator:
  ```typescript
  .where(and(eq(applicationsTable.job, jobId), eq(applicationsTable.candidate, req.user.id)));
  ```

---

### ⚡ Gap 4: Redis Client Type Mismatches
In [redisClient.ts](file:///d:/Code/Projects/hitetrack/backend/src/redis/redisClient.ts):
- **res.json Interceptor (line 50):** Overriding `res.json` as an `async` function mismatches Express's expected return signature (`Response`). This can be resolved by making it a normal function or casting:
  ```typescript
  res.json = (data): any => {
      client.set(key, JSON.stringify(data), { EX: ttl });
      return originalJson(data);
  };
  ```
- **Scan Iterator (line 66):** The Redis `scanIterator` returns string keys in pages/arrays depending on package versions. `key as string` fails if TS expects `string[]`. You should use spread notation or cast the iterator type.

---

## 3. Recommended Database Configurations

### Connection Pooling (Neon / pgBouncer Compatibility)
The settings in [config/db.ts](file:///d:/Code/Projects/hitetrack/backend/src/config/db.ts) are well-configured for hosting on platforms like Neon:
- `ssl: "require"` is enforced (essential for Neon).
- `prepare: false` is set (critical because Neon's connection pooler operates in transaction mode, which does not support prepared statements).
- A self-executing warm-up function is added to avoid cold-start timeouts in serverless functions.

### Drizzle Migrations (`drizzle.config.ts`)
- Explicitly loads `.env.local` which is correct for local development.
- Points to the correct schema file location.
- Dialect is set to `postgresql`.

---

## 4. Verification Checklists & Action Items

To ensure the database and configuration are fully operational, the following changes should be manually executed:

- [ ] **Expose Relations:** Add `export * from "./relations";` at the end of [schema.ts](file:///d:/Code/Projects/hitetrack/backend/src/db/schema.ts).
- [ ] **Fix emailCron.ts Columns:** Change `owner_id` to `owner` and `company_id` to `company` in [emailCron.ts](file:///d:/Code/Projects/hitetrack/backend/src/cron-jobs/emailCron.ts).
- [ ] **Fix Dynamic Queries:** Update `getAllById` in [handleFactory.ts](file:///d:/Code/Projects/hitetrack/backend/src/controllers/handleFactory.ts) to use `table[column]`.
- [ ] **Fix Interview Update Syntax:** Update line 136 in [interviewController.ts](file:///d:/Code/Projects/hitetrack/backend/src/controllers/interviewController.ts) to use standard Drizzle update syntax.
- [ ] **Fix where Chaining:** Combine double `.where()` calls in [jobApplicationsController.ts](file:///d:/Code/Projects/hitetrack/backend/src/controllers/jobApplicationsController.ts) using `and()`.
- [ ] **Fix Parameter Arity:** Provide the missing table name argument in `getAll(applicationsTable, "applicationsTable")` and `getAll(interviewsTable, "interviewsTable")`.
