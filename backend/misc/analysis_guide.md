# HireTrack Backend: Analysis & Optimization Guide

This document reviews the codebase of the **HireTrack** backend (focusing on User, Auth, Jobs, Applications, and API features) and outlines security loopholes, bugs, performance flaws, and architectural differences between junior-level code and senior-level production implementations.

---

## 1. Critical Security & Authorization Vulnerabilities

### 🚨 Broken Object Level Authorization (BOLA / IDOR)
**The Issue:** 
Endpoints like deleting a job, duplicating a job, or changing application status only check the user's role (e.g., `restrictTo("RECRUITER")`). They do not verify if the recruiter belongs to the company that owns the resource.
* **Impact:** Any recruiter from Company A can delete Company B's jobs (`DELETE /api/jobs/:jobId`), duplicate Company B's jobs under their own account, or accept/reject candidate applications belonging to Company B (`PATCH /api/applications/status/:applicationId`).
* **Senior Developer Solution:** Implement a validation middleware or helper that verifies the resource's owner/company ID matches the requesting user's company ID before proceeding:
  ```typescript
  // Example verification query:
  const targetJob = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1);
  if (targetJob[0].company !== req.user.company) {
    return next(new AppError("You do not own this resource", 403));
  }
  ```

### 🚨 Sensitive Data Exposure (Leaking Password Hashes)
**The Issue:** 
The endpoints `/api/users/me`, `/api/users/update-me`, and `getUser` return raw database objects directly to the client.
* **Impact:** These responses include the hashed password (`password`), email verification tokens (`verification`), and password reset codes (`passwordReset`). While the password is encrypted, exposing hashes makes the application vulnerable to offline brute-force attacks if data is intercepted or if client-side logs are inspected.
* **Senior Developer Solution:** Explicitly strip passwords and verification objects in queries, or map the response using a utility function before sending it back:
  ```typescript
  // Query-level safety:
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      avatarUrl: usersTable.avatar_url,
      company: usersTable.company
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);
  ```

### 🚨 Unrestricted Reuse of Invitation Tokens
**The Issue:** 
In `invitationController.ts`, when a user accepts an invitation via `joinInvitation`, the code inserts them into `companyMembersTable` and updates their `company` ID. However, the invitation record in the database is never updated or deleted.
* **Impact:** The token remains active until it reaches its `expiresAt` date (and can be reused multiple times). Furthermore, there is no check to see if the invitation has already been accepted.
* **Senior Developer Solution:** Add a check `if (InvitationExist[0].acceptedAt)` to return an error, and update the token to record the acceptance time in the same transaction:
  ```typescript
  await db.transaction(async (tx) => {
    await tx.insert(companyMembersTable).values(newMember);
    await tx.update(usersTable).set({ company: invite.company }).where(eq(usersTable.id, req.user.id));
    await tx.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.token, token));
  });
  ```

---

## 2. Code Bugs & Logic Flaws

### 🐛 Authorization Check Crashes in `updateOne`
**The Issue:** 
In the generic `updateOne` handler factory (`handleFactory.ts`), there is a hardcoded owner check for `jobsTable`:
```typescript
if (table === "jobsTable") {
  const isOwner = await db.select().from(table).where(eq(table.id, id));
  console.log(isOwner[0].user_id, req.user.id);
  if (isOwner[0].user_id !== req.user.id) { ... }
}
```
1. **Property Mismatch:** The column name in the database schema for the job creator is `createdBy`, not `user_id`. Thus, `isOwner[0].user_id` resolves to `undefined`, and `undefined !== req.user.id` is always true, causing all job updates to fail with a `403 Forbidden` error.
2. **Missing Exist Check:** If the job ID does not exist, `isOwner[0]` is undefined, throwing a runtime `TypeError` and crashing the server with a 500 error instead of a clean 404.
* **Senior Developer Solution:** Check if the record exists first, and check the correct column:
  ```typescript
  if (!isOwner.length) return next(new AppError("Job not found", 404));
  if (isOwner[0].createdBy !== req.user.id) {
    return next(new AppError("You are not authorized to edit this job", 403));
  }
  ```

### 🐛 Cache Invalidation Mismatch (Stale Cache)
**The Issue:** 
When modifying jobs (`createJob`, `changeJobVisibility`, `duplicateJob`), the cache is invalidated using:
```typescript
await client.del(`all_jobs_${JSON.stringify(req.query)}`);
```
However, in `handleFactory.ts`, the cache keys created by `getAll` use:
```typescript
let cacheKey = `all_${tableName.split("T")[0]}`; // plus tenant identifiers
```
* **Impact:** The delete query targets a key pattern that never matches the actual keys set in Redis. The cache stays alive for the full 1-hour TTL, causing users to see stale job listings after modifications.
* **Senior Developer Solution:** Standardize cache key structures. For example, if jobs are tenant-specific, invalidate the exact key for that company:
  ```typescript
  await client.del(`all_jobs:company:${req.user.company}`);
  ```

### 🐛 Dynamic Job Duplication Company Mismatch
**The Issue:** 
In `duplicateJob` (`jobController.ts`), the code shallow-copies the job and overrides only `id`, `status`, and `title`:
```typescript
const newJob = {
  ...job[0],
  id: uuid(),
  status: "DRAFT",
  title: `${job[0].title} (Copy)`,
} as typeof jobsTable.$inferInsert;
```
* **Impact:** Because it copies `company` directly from the source job (`job[0].company`), a recruiter from Company A duplicating a job from Company B will create a new job belonging to Company B, even though the recruiter's ID is set as the creator (`createdBy`).
* **Senior Developer Solution:** Explicitly assign the recruiter's own company ID:
  ```typescript
  const newJob = {
    ...job[0],
    id: uuid(),
    createdBy: req.user.id,
    company: req.user.company, // Force request user's company
    status: "DRAFT",
    title: `${job[0].title} (Copy)`,
  };
  ```

---

## 3. Database Operations & Performance Optimizations

### ⚡ Missing Database Indexes on Foreign Keys
**The Issue:** 
While unique constraints (like `email` and `slug`) create implicit indexes, foreign keys do not. As the database scales:
* `jobsTable.company` and `jobsTable.createdBy`
* `applicationsTable.job` and `applicationsTable.candidate`
* `companyMembersTable.company` and `companyMembersTable.user`
* `invitations.company` and `invitations.invitedBy`

Queries joining these tables or filtering by them (e.g., loading all applications for a candidate or company analytics) will degrade to slow, full-table scans.
* **Senior Developer Solution:** Add database-level indexes on foreign key columns in `schema.ts`:
  ```typescript
  // Example for companyMembers:
  export const companyMembersTable = pgTable("companyMembers", {
    company: uuid("company_id").notNull().references(() => companiesTable.id),
    user: uuid("user_id").notNull().references(() => usersTable.id),
  }, (table) => ({
    pk: primaryKey({ columns: [table.company, table.user] }),
    companyIdx: index("cm_company_idx").on(table.company),
    userIdx: index("cm_user_idx").on(table.user),
  }));
  ```

### ⚡ Missing Database Transactions
**The Issue:** 
In `changeApplicationStatus` and `rejectApplication` (`jobApplicationsController.ts`), the code updates the application stage and inserts an audit log sequentially:
```typescript
const application = await db.update(applicationsTable)...
await db.insert(auditLogs).values(...);
```
* **Impact:** If the server crashes or the database connection drops after updating the application but before inserting the audit log, the database gets into an inconsistent state (status changed, but no record of who changed it).
* **Senior Developer Solution:** Always wrap multi-write operations in database transactions:
  ```typescript
  await db.transaction(async (tx) => {
    await tx.update(applicationsTable).set({ current_stage: status }).where(eq(applicationsTable.id, applicationId));
    await tx.insert(auditLogs).values({
      application_id: applicationId,
      changed_by: req.user.id,
      from_stage: existingApp[0].current_stage,
      to_stage: status,
    });
  });
  ```

### ⚡ Fragile Table Coercion to String
**The Issue:** 
In `updateOne` and `deleteOne`, the table names for caching are parsed via:
```typescript
const tableName = `${table}`.split("T")[0];
```
* **Impact:** Coercing a Drizzle table object directly to a string is highly fragile. Depending on the Drizzle version and object structure, it may result in `[object Object]` rather than the table's SQL name, breaking cache key generation entirely.
* **Senior Developer Solution:** Read the table name metadata from the Drizzle object directly or pass an explicit string namespace to the handler factories:
  ```typescript
  import { getTableConfig } from "drizzle-orm/pg-core";
  
  // Read name safely from Drizzle table metadata:
  const tableName = getTableConfig(table).name;
  ```

---

## 4. API & Caching Improvements

### 🔄 Unused Redis Reads (Write-Only Overhead)
**The Issue:** 
In the `protect` middleware, the system writes the active user's details to Redis on every single request:
```typescript
await client.set(`user:${userWithoutPassword.id}`, JSON.stringify(userWithoutPassword), { EX: 86400 });
```
However, the middleware NEVER checks Redis before querying the database; it always queries Postgres:
```typescript
const currentUser = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id)).limit(1);
```
* **Impact:** This introduces significant network and write overhead to Redis on every API request without providing any caching speedups.
* **Senior Developer Solution:** Implement a proper read-through cache strategy:
  ```typescript
  const cacheKey = `user:${decoded.id}`;
  const cachedUser = await client.get(cacheKey);
  if (cachedUser) {
    req.user = JSON.parse(cachedUser);
    return next();
  }
  // Cache miss: query DB and save to cache
  ```
  *Note: If you read from the cache, make sure to delete this key (`client.del(cacheKey)`) in `updateMe` and `updatePassword` to prevent stale profile data!*

### 🔄 SQL Injection & Dynamic Column Queries in `ApiFeatures`
**The Issue:** 
In `apiFeatures.ts`, the filtering and sorting code uses raw template strings using user inputs:
```typescript
conditions.push(sql`${sql.identifier(key)} > ${val}`);
```
While using `sql.identifier(key)` escapes identifiers, accepting arbitrary query keys directly from the client is dangerous. Users can filter or sort on private schema columns like `password`, `verification`, or `autoLoginToken`.
* **Impact:** Potential enumeration of private parameters or database schema details.
* **Senior Developer Solution:** Implement a whitelist of columns that are allowed to be filtered or sorted:
  ```typescript
  const ALLOWED_FILTER_FIELDS = ["title", "status", "category", "job_type", "job_location"];
  
  if (!ALLOWED_FILTER_FIELDS.includes(key)) {
    return next(new AppError(`Filtering by ${key} is not allowed`, 400));
  }
  ```

---

## 5. Summary: Junior vs. Senior Architecture Patterns

| Feature | Junior Developer Approach | Senior Developer Approach |
| :--- | :--- | :--- |
| **Authorization** | Role checks only (`isRecruiter`) | Multi-tenant ownership verification (checks if `companyId` matches resource owner) |
| **Security** | Exposes database rows directly to API | Uses Data Transfer Objects (DTOs) or selects only safe fields |
| **Reliability** | Sequential writes; error crashes | Database transactions (`db.transaction`) with clean error boundaries |
| **Data Types** | Cryptographically weak `Math.random()` | Secure pseudo-random values (`crypto.randomInt` / `crypto.randomBytes`) |
| **Caching** | Caching without invalidation or write-only cache | Read-through caching with clean invalidation on mutations |
| **Performance** | Basic table creation without index planning | Indexes on all Foreign Keys + explicit select limits |
