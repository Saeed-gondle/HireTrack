# HireTrack

Applicant Tracking & Recruitment Automation Platform  
Product Requirements Document (PRD) - v1.0

| Field    | Value                                                                             |
| -------- | --------------------------------------------------------------------------------- |
| Product  | HireTrack - Full-Stack ATS Web Application                                        |
| Stack    | Next.js 14, TypeScript, PostgreSQL, Drizzle ORM, Redis, BullMQ, Zod, Tailwind CSS |
| Audience | Small to mid-size companies hiring in-house without enterprise ATS budgets        |
| Author   | Engineering Team - April 2026                                                     |

---

## 1. Product Overview

HireTrack is a web-based Applicant Tracking System (ATS). Companies use it to post jobs, receive applications, and manage candidates from first application to final offer inside one platform.

HireTrack combines the usability of a public job board, a visual workflow board, and automated candidate communication to replace fragmented email-and-spreadsheet hiring workflows.

### 1.1 Problem Statement

Most small companies manage recruiting with inboxes and spreadsheets. This causes:

- Applications getting lost
- Delayed or missed follow-ups
- No shared, reliable view of candidate status
- High coordination overhead for interview scheduling
- No consistent analytics for hiring performance

### 1.2 Target Users

| Role      | User Type           | Core Capabilities                                      |
| --------- | ------------------- | ------------------------------------------------------ |
| Admin     | Platform owner      | View and manage all platform data, users, analytics    |
| Recruiter | HR / hiring manager | Create jobs, run hiring pipelines, schedule interviews |
| Candidate | Job seeker          | Browse jobs, apply, and track application status       |

---

## 2. Domain Concepts

### 2.1 Company

A hiring organization profile. Recruiters create jobs under their company. One recruiter manages one company. Admins can manage all companies.

### 2.2 Job Listing

An open position with title, description, requirements, location, and status (`DRAFT`, `OPEN`, `CLOSED`). Only `OPEN` jobs are public.

### 2.3 Application

A candidate submission linked to a specific job. Each application progresses through a defined hiring pipeline.

### 2.4 Pipeline Stages

| Stage     | Meaning                                |
| --------- | -------------------------------------- |
| Applied   | Application submitted but not reviewed |
| Screening | Resume reviewed, under consideration   |
| Interview | One or more interviews scheduled       |
| Offer     | Offer extended                         |
| Hired     | Offer accepted                         |
| Rejected  | Candidate not selected                 |

### 2.5 Audit Log

Immutable event history for stage changes (who changed what, from where, to where, and when). Serves compliance and analytics use cases.

### 2.6 Background Jobs and Cron

Long-running or scheduled tasks (resume parsing, email sending, reminders, weekly digests) run asynchronously via BullMQ + Redis and cron schedules.

---

## 3. Functional Requirements

### 3.1 Authentication and Authorization

| Feature             | Description                                                | Priority    |
| ------------------- | ---------------------------------------------------------- | ----------- |
| OAuth Login         | Google/GitHub sign-in via NextAuth v5                      | Must Have   |
| Role Assignment     | Assign `ADMIN`, `RECRUITER`, or `CANDIDATE` on first login | Must Have   |
| Protected Routes    | Enforce auth/session checks at middleware level            | Must Have   |
| JWT Refresh         | Rotate tokens on refresh                                   | Must Have   |
| Role-Based UI       | Role-specific navigation and pages                         | Must Have   |
| Magic Link Login    | Optional email-based login for candidates                  | Should Have |
| Admin Impersonation | Temporary impersonation with audit logging                 | Should Have |

#### Implementation Reference: OAuth Setup

```ts
// app/api/auth/[...nextauth]/route.ts
const handler = NextAuth({
  providers: [GoogleProvider({}), GithubProvider({})],
  callbacks: {
    async signIn({ user }) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      if (!existing) {
        await db.insert(users).values({
          email: user.email,
          name: user.name,
          role: "CANDIDATE",
          avatar_url: user.image,
        });
      }

      return true;
    },
    async session({ session, token }) {
      session.user.role = await getRoleFromDB(token.email);
      return session;
    },
  },
});
```

#### Implementation Reference: Route Protection

```ts
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  if (path.startsWith("/jobs") || path === "/login") return;
  if (!token) return redirect("/login");

  if (path.startsWith("/dashboard/jobs/new")) {
    if (token.role !== "RECRUITER" && token.role !== "ADMIN") {
      return redirect("/unauthorized");
    }
  }
}
```

### 3.2 Job Management (Recruiter)

| Feature       | Description                                         | Priority     |
| ------------- | --------------------------------------------------- | ------------ |
| Create Job    | Create as `DRAFT` with validated fields             | Must Have    |
| Publish Job   | Transition `DRAFT` -> `OPEN`                        | Must Have    |
| Edit Job      | Update listing details anytime                      | Must Have    |
| Close Job     | Transition to `CLOSED` and disable applications     | Must Have    |
| Job Dashboard | View jobs with applicant counts and stage breakdown | Must Have    |
| Soft Delete   | Set `deleted_at` instead of hard delete             | Should Have  |
| Duplicate Job | Clone job into a new `DRAFT`                        | Nice to Have |

#### Implementation Reference: Job Create API

```ts
// app/api/jobs/route.ts
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.user.role !== "RECRUITER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const [job] = await db
    .insert(jobs)
    .values({
      ...parsed.data,
      company_id: session.user.companyId,
      status: "DRAFT",
      created_at: new Date(),
    })
    .returning();

  return Response.json(job, { status: 201 });
}
```

### 3.3 Public Job Board (Candidate)

| Feature          | Description                           | Priority     |
| ---------------- | ------------------------------------- | ------------ |
| Browse Jobs      | Paginated list of `OPEN` jobs         | Must Have    |
| Filter by Type   | Filter by type, location, and keyword | Must Have    |
| Job Detail       | Full job and company details          | Must Have    |
| Full-Text Search | PostgreSQL `pg_trgm` search support   | Should Have  |
| Saved Jobs       | Bookmark for later                    | Nice to Have |

### 3.4 Application Submission (Candidate)

| Feature              | Description                                | Priority    |
| -------------------- | ------------------------------------------ | ----------- |
| Apply to Job         | One application per candidate per job      | Must Have   |
| Resume Upload        | Upload PDF resume and store URL            | Must Have   |
| Application Status   | Candidate-facing live status tracking      | Must Have   |
| Withdraw Application | Withdraw before screening threshold        | Should Have |
| Rate Limiting        | Max 10 applications per hour per candidate | Must Have   |

#### Implementation Reference: Upload + Queue

```ts
// app/api/upload/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("resume") as File;

  if (file.type !== "application/pdf") {
    return error(400, "PDF only");
  }

  if (file.size > 5 * 1024 * 1024) {
    return error(400, "Max 5MB");
  }

  const url = await uploadToStorage(file);
  const app = await db
    .insert(applications)
    .values({ resume_url: url })
    .returning();

  await resumeQueue.add("parse-resume", {
    applicationId: app[0].id,
    resumeUrl: url,
  });

  return Response.json({ applicationId: app[0].id });
}
```

### 3.5 Kanban Pipeline (Recruiter)

| Feature          | Description                           | Priority    |
| ---------------- | ------------------------------------- | ----------- |
| Kanban Board     | Stage columns with candidate cards    | Must Have   |
| Drag and Drop    | Move cards between stages             | Must Have   |
| Stage Change API | Atomic stage update + audit log write | Must Have   |
| Audit Trail View | Full event timeline per application   | Must Have   |
| Bulk Reject      | Multi-select rejection                | Should Have |
| Internal Notes   | Private recruiter notes               | Should Have |
| Filter by Job    | Scope board to selected job           | Should Have |

#### Implementation Reference: Atomic Stage Transition

```ts
// app/api/applications/[id]/stage/route.ts
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { to_stage } = await req.json();
  const appId = params.id;

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, appId),
  });

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ current_stage: to_stage })
      .where(eq(applications.id, appId));

    await tx.insert(auditLogs).values({
      application_id: appId,
      changed_by: session.user.id,
      from_stage: application?.current_stage ?? "APPLIED",
      to_stage,
      changed_at: new Date(),
    });
  });

  return Response.json({ success: true });
}
```

### 3.6 Interview Scheduling

| Feature                | Description                              | Priority    |
| ---------------------- | ---------------------------------------- | ----------- |
| Create Interview       | Set type, date/time, and meeting details | Must Have   |
| Candidate Notification | Queue notification email on creation     | Must Have   |
| Calendar Download      | Provide `.ics` attachments               | Should Have |
| Reminder Cron          | Queue reminders for next-day interviews  | Must Have   |
| Reschedule             | Support interview time changes           | Should Have |

### 3.7 Email Notification System

| Feature              | Description                           | Priority    |
| -------------------- | ------------------------------------- | ----------- |
| Application Received | Confirmation email on apply           | Must Have   |
| Stage Change Email   | Notify on Interview/Offer transitions | Must Have   |
| Interview Scheduled  | Notify both recruiter and candidate   | Must Have   |
| Interview Reminder   | Automated reminder 24 hours before    | Must Have   |
| Weekly Digest        | Recruiter summary email every Monday  | Should Have |
| Rejection Email      | Polite rejection workflow             | Should Have |
| Email Logs           | Persist queue/delivery status         | Must Have   |

### 3.8 Redis: Caching and Rate Limiting

| Feature               | Description                        | Priority    |
| --------------------- | ---------------------------------- | ----------- |
| Job Listing Cache     | Cache public jobs for 5 minutes    | Should Have |
| Cache Invalidation    | Invalidate when jobs change        | Should Have |
| Candidate Apply Limit | 10 applications/hour per candidate | Must Have   |
| Session Cache         | Cache auth/session lookups         | Should Have |
| API Rate Limit        | 100 requests/IP/15 min global cap  | Should Have |

### 3.9 Search

| Feature          | Description                             | Priority     |
| ---------------- | --------------------------------------- | ------------ |
| Job Search       | Trigram keyword search on jobs          | Should Have  |
| Candidate Search | Search by name, email, extracted skills | Should Have  |
| GIN Indexes      | Optimize trigram queries at scale       | Should Have  |
| Suggestions      | Debounced search suggestions            | Nice to Have |

#### Implementation Reference: SQL Indexes

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_jobs_title_trgm
ON jobs USING gin (title gin_trgm_ops);

CREATE INDEX idx_jobs_description_trgm
ON jobs USING gin (description gin_trgm_ops);
```

### 3.10 Analytics Dashboard

| Feature              | Description                         | Priority     |
| -------------------- | ----------------------------------- | ------------ |
| Conversion Funnel    | Applied -> Hired per job            | Should Have  |
| Time-to-Hire         | Avg days from apply to hire         | Should Have  |
| Avg Time Per Stage   | Stage duration bottleneck detection | Should Have  |
| Applicants Over Time | Weekly/monthly trend charting       | Should Have  |
| Source Tracking      | UTM/source attribution              | Nice to Have |
| Global Admin View    | Cross-company platform metrics      | Should Have  |

### 3.11 Admin Panel

| Feature          | Description                              | Priority    |
| ---------------- | ---------------------------------------- | ----------- |
| User Management  | Role changes and account controls        | Must Have   |
| Company Overview | Platform-wide company visibility         | Must Have   |
| Impersonation    | Debug/support impersonation with logs    | Should Have |
| Platform Stats   | Jobs, applications, queue, email metrics | Should Have |
| Queue Monitor    | Failed/pending/retry queue observability | Should Have |

---

## 4. Data Model

All tables use UUID primary keys. Timestamps are timezone-aware where relevant. Foreign keys are explicit. Soft deletes are represented by nullable `deleted_at`.

| Table             | Core Columns                                         | Purpose                           |
| ----------------- | ---------------------------------------------------- | --------------------------------- |
| users             | id, email, role, deleted_at                          | User accounts and roles           |
| companies         | id, owner_id, name, slug                             | Company profile                   |
| jobs              | id, company_id, status, deleted_at                   | Job listings                      |
| applications      | id, job_id, candidate_id, current_stage              | Candidate-job relationships       |
| audit_logs        | id, application_id, from_stage, to_stage, changed_by | Immutable change history          |
| interviews        | id, application_id, scheduled_at, reminder_sent      | Interview scheduling records      |
| interview_slots   | id, application_id, proposed_at, status              | Reschedule/proposal slots         |
| application_notes | id, application_id, author_id, body                  | Internal recruiter notes          |
| email_logs        | id, to_email, template, status, sent_at              | Delivery and troubleshooting logs |

### 4.1 Design Decisions

- UUID primary keys to avoid enumeration and support distributed systems.
- Soft delete strategy for recoverability and auditability.
- Append-only audit logs as source of truth for analytics.
- `reminder_sent` flag to avoid duplicate reminders.
- Parsed resume text is populated asynchronously by workers.

---

## 5. Non-Functional Requirements

| Requirement    | Description                                                  | Priority    |
| -------------- | ------------------------------------------------------------ | ----------- |
| Performance    | Job listing API under 200 ms with cache; indexed FK columns  | Must Have   |
| Security       | Auth checks on all protected APIs; strict request validation | Must Have   |
| Reliability    | Queue retries with exponential backoff and DLQ handling      | Must Have   |
| Observability  | Structured logs and runtime error monitoring                 | Should Have |
| Scalability    | Independent worker process for horizontal scaling            | Should Have |
| Accessibility  | Keyboard support and WCAG AA compliance target               | Should Have |
| Data Integrity | Transactional multi-step writes                              | Must Have   |

---

## 6. Technology Stack

| Layer          | Technology                            | Rationale                                           |
| -------------- | ------------------------------------- | --------------------------------------------------- |
| Frontend       | Next.js 14 (App Router), Tailwind CSS | Fast iteration with server/client rendering support |
| Language       | TypeScript (strict)                   | End-to-end type safety                              |
| Database       | PostgreSQL + Drizzle ORM              | Relational integrity with typed query APIs          |
| Migrations     | drizzle-kit                           | Versioned schema migrations                         |
| Auth           | NextAuth v5                           | OAuth and session workflows                         |
| Validation     | Zod                                   | Shared client/server schemas                        |
| Queue + Cache  | Redis + BullMQ                        | Async jobs, rate limits, caching                    |
| Scheduling     | node-cron                             | Lightweight recurring jobs                          |
| Email          | Resend or Nodemailer                  | Transactional email delivery                        |
| Storage        | Supabase Storage or local disk        | Resume asset storage                                |
| Logging        | Pino                                  | Structured logging                                  |
| Monitoring     | Sentry                                | Error and exception tracking                        |
| Resume Parsing | pdf-parse                             | Background extraction of resume text                |

---

## 7. Recommended Delivery Plan

| Phase | Name         | Scope                                        | Outcome                      |
| ----- | ------------ | -------------------------------------------- | ---------------------------- |
| 1     | Foundation   | Setup, auth, RBAC, DB migrations             | Secure baseline architecture |
| 2     | Core Domain  | Companies, jobs, applications, upload        | End-to-end hiring flow       |
| 3     | Pipeline     | Kanban board and audit log state transitions | Recruiter workflow maturity  |
| 4     | Automation   | Queues, cron, reminders, rate limiting       | Operational reliability      |
| 5     | Intelligence | Search, analytics, admin observability       | Data-driven hiring insights  |

---

## 8. Backend Patterns Reference

### 8.1 Validation Middleware Pattern

```ts
// lib/utils/validate.ts
export function validate<T>(schema: ZodSchema<T>) {
  return async (req: Request): Promise<T | Response> => {
    const body = await req.json().catch(() => ({}));
    const result = schema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 },
      );
    }

    return result.data;
  };
}
```

### 8.2 Queue + Worker Pattern

```ts
// Request path: save and enqueue quickly
await db.insert(applications).values(data);
await resumeQueue.add("parse-resume", payload);

// Worker path: slow operations happen asynchronously
const worker = new Worker("resume", async (job) => {
  await parseResume(job.data.resumeUrl);
  await sendCandidateEmail(job.data.applicationId);
});
```

### 8.3 Audit Log Transaction Pattern

```ts
await db.transaction(async (tx) => {
  await tx
    .update(applications)
    .set({ current_stage: nextStage })
    .where(eq(applications.id, id));
  await tx.insert(auditLogs).values({
    application_id: id,
    from_stage: prevStage,
    to_stage: nextStage,
    changed_by: actorId,
    changed_at: new Date(),
  });
});
```

---

## Appendix A: Environment Variables

All secrets must be managed in `.env.local` and excluded from version control.

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hiretrack

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Redis
REDIS_URL=redis://localhost:6379

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@hiretrack.com

# Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/...
```

---

Document end.  
Estimated build effort: 8 to 12 weeks for a solo developer.
