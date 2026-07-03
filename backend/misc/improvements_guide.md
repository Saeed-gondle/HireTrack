# HireTrack Backend: Implementation Guide for Senior-Level Improvements

This guide provides concrete code blueprints and instructions to refactor the **HireTrack** backend codebase. Implementing these patterns fixes critical security flaws, prevents database corruption, improves speed, and structures the code like a production-grade senior-level application.

---

## 1. Security & Authorization Improvements

### A. Resource Ownership (Tenant Isolation) Middleware
Instead of allowing any logged-in recruiter to modify any resource, write a generic ownership validation helper.

**Before (Vulnerable Route):**
```typescript
router.route("/:jobId").delete(protect, restrictTo("ADMIN", "RECRUITER"), deleteJob);
```

**After (Secure Implementation):**
Create a new middleware or check inside the handler. Here is a reusable middleware builder for checking ownership:
```typescript
// Create this in src/middlewares/checkOwnership.ts
import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { eq } from "drizzle-orm";
import AppError from "../utils/appError";

export const checkCompanyResourceOwnership = (table: any, idParamName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role === "ADMIN") return next(); // Admins bypass ownership checks

    const resourceId = req.params[idParamName];
    const record = await db.select().from(table).where(eq(table.id, resourceId)).limit(1);

    if (record.length === 0) {
      return next(new AppError("Resource not found", 404));
    }

    // Check if the resource belongs to the recruiter's company
    if (record[0].company !== req.user.company) {
      return next(new AppError("You do not have permission to access this resource", 403));
    }

    next();
  };
};
```
**Usage in `jobRoutes.ts`:**
```typescript
import { checkCompanyResourceOwnership } from "../middlewares/checkOwnership";
import { jobsTable } from "../db/schema";

router
  .route("/:jobId")
  .delete(
    protect,
    restrictTo("ADMIN", "RECRUITER"),
    checkCompanyResourceOwnership(jobsTable, "jobId"),
    deleteJob
  );
```

---

### B. Stripping Sensitive Fields (DTO Pattern)
Never return password hashes and OTP verification objects in responses.

**Before (Vulnerable Controller):**
```typescript
export const me = catchAsync(async (req: Request, res: Response) => {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  res.status(200).json({ status: "success", data: { user: user[0] } });
});
```

**After (Secure Implementation):**
Create a utility to scrub user objects or explicitly select columns:
```typescript
export const getSafeUserObject = (user: any) => {
  const { password, verification, passwordReset, autoLoginToken, autoLoginTokenExpiry, ...safeUser } = user;
  return safeUser;
};

// In your controllers:
res.status(200).json({
  status: "success",
  data: {
    user: getSafeUserObject(user[0]),
  },
});
```

---

### C. Safe & Single-Use Invitation Acceptance
Update `joinInvitation` to check and invalidate tokens to prevent token reuse.

**Before (Vulnerable code):**
```typescript
await db.transaction(async (tx) => {
  await tx.insert(companyMembersTable).values(newMemer);
  await tx.update(usersTable).set({ company: invite.company }).where(eq(usersTable.id, req.user.id));
});
```

**After (Secure code):**
```typescript
// 1. Check if already accepted
if (InvitationExist[0].acceptedAt) {
  return next(new AppError("This invitation has already been accepted", 400));
}

// 2. Accept and update in one transaction
await db.transaction(async (tx) => {
  await tx.insert(companyMembersTable).values(newMemer);
  await tx.update(usersTable).set({ company: InvitationExist[0].company }).where(eq(usersTable.id, req.user.id));
  await tx
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, InvitationExist[0].id));
});
```

---

## 2. Logical Bug & Stability Fixes

### A. Fix `updateOne` Factory Bug
Fix the crash on `user_id` and handle nonexistent records cleanly.

**Before (Vulnerable):**
```typescript
if (table === "jobsTable") {
  const isOwner = await db.select().from(table).where(eq(table.id, id));
  if (isOwner[0].user_id !== req.user.id) { ... }
}
```

**After (Fixed & Hardened):**
```typescript
if (table === "jobsTable") {
  const records = await db.select().from(table).where(eq(table.id, id)).limit(1);
  if (records.length === 0) {
    return next(new AppError("Job not found", 404));
  }
  if (records[0].createdBy !== req.user.id) {
    return next(new AppError("You are not authorized to update this job", 403));
  }
}
```

---

### B. Secure Cryptographic OTP Generation
Replace insecure `Math.random()` with `crypto` for high-security OTP codes.

**Before (Vulnerable):**
```typescript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
```

**After (Secure):**
```typescript
import crypto from "node:crypto";

// Generates a cryptographically strong random 6-digit number string
const otp = crypto.randomInt(100000, 999999).toString();
```

---

## 3. Database & Performance Optimizations

### A. Adding Database Indexes on Foreign Keys
Optimize join performance and avoid database slowdowns under load by indexing keys.

**Implementation (Update `src/db/schema.ts`):**
```typescript
import { index } from "drizzle-orm/pg-core";

// 1. jobsTable indexes
export const jobsTable = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  company: uuid("company").notNull().references(() => companiesTable.id),
  createdBy: uuid("createdBy").notNull().references(() => usersTable.id),
  // ... rest of columns
}, (table) => ({
  companyIdx: index("jobs_company_idx").on(table.company),
  createdByIdx: index("jobs_created_by_idx").on(table.createdBy),
}));

// 2. applicationsTable indexes
export const applicationsTable = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  job: uuid("job").notNull().references(() => jobsTable.id),
  candidate: uuid("candidate").notNull().references(() => usersTable.id),
  // ... rest of columns
}, (table) => ({
  jobIdx: index("apps_job_idx").on(table.job),
  candidateIdx: index("apps_candidate_idx").on(table.candidate),
}));
```

---

### B. Wrapping State Changes in Transactions
Ensure consistency by atomic writes when changing statuses and writing audit logs.

**Before:**
```typescript
const application = await db.update(applicationsTable).set(...);
await db.insert(auditLogs).values(...);
```

**After (Transactional):**
```typescript
const application = await db.transaction(async (tx) => {
  const updated = await tx
    .update(applicationsTable)
    .set({ current_stage: status })
    .where(eq(applicationsTable.id, applicationId))
    .returning();
  
  await tx.insert(auditLogs).values({
    application_id: applicationId,
    changed_by: req.user.id,
    from_stage: existingApp[0].current_stage,
    to_stage: status,
  });

  return updated;
});
```

---

## 4. API & Caching Improvements

### A. Read-Through Redis Caching for `protect` Middleware
Check Redis cache first before executing a database select query on every request.

**Before (Write-only Overhead):**
```typescript
const currentUser = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id)).limit(1);
// ...
await client.set(`user:${userWithoutPassword.id}`, JSON.stringify(userWithoutPassword), { EX: 86400 });
```

**After (Read-Through Optimization):**
```typescript
const cacheKey = `user:${decoded.id}`;
const cachedUser = await client.get(cacheKey);

let user;
if (cachedUser) {
  user = JSON.parse(cachedUser);
} else {
  const dbUser = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id)).limit(1);
  if (dbUser.length === 0) {
    return next(new AppError("User no longer exists", 401));
  }
  user = dbUser[0];
  const { password, ...safeUser } = user;
  await client.set(cacheKey, JSON.stringify(safeUser), { EX: 60 * 60 * 24 });
}

req.user = user;
res.locals.user = user;
next();
```

*Don't forget to invalidate the cache in `userController.ts` when a user updates their profile details:*
```typescript
// In updateMe and updatePassword
await client.del(`user:${req.user.id}`);
```

---

### B. Query Whitelisting in `ApiFeatures`
Protect private parameters and internal database columns from user-facing query parameters.

**Implementation (Update `src/utils/apiFeatures.ts`):**
```typescript
// Define allowed fields per table inside apiFeatures or controllers
const ALLOWED_QUERY_FIELDS: Record<string, string[]> = {
  jobs: ["title", "status", "category", "job_type", "job_location", "location"],
  applications: ["current_stage", "job", "candidate"],
};

class ApiFeatures {
  // ... constructor
  
  filter(entityName: string) {
    const queryObj: QueryOptions = { ...this.queryString };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    const conditions: SQL[] = [];
    const allowedFields = ALLOWED_QUERY_FIELDS[entityName] || [];

    for (const key of Object.keys(queryObj)) {
      // Whitelist filter check
      if (!allowedFields.includes(key)) {
        console.warn(`⚠️ Blocked attempts to query restricted field: ${key}`);
        continue; 
      }

      const value = queryObj[key];
      // Build conditions as usual...
    }
  }
}
```
