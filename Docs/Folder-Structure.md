hiretrack/
├── app/
│ ├── (auth)/
│ │ ├── login/page.tsx
│ │ └── register/page.tsx
│ ├── (dashboard)/
│ │ ├── layout.tsx ← auth guard here
│ │ ├── pipeline/page.tsx ← kanban board
│ │ ├── jobs/
│ │ │ ├── page.tsx
│ │ │ └── [id]/page.tsx
│ │ ├── applications/
│ │ │ └── [id]/page.tsx
│ │ └── analytics/page.tsx
│ ├── api/
│ │ ├── auth/[...nextauth]/route.ts
│ │ ├── jobs/
│ │ │ ├── route.ts ← GET list, POST create
│ │ │ └── [id]/route.ts ← GET, PATCH, DELETE
│ │ ├── applications/
│ │ │ ├── route.ts
│ │ │ └── [id]/
│ │ │ ├── route.ts
│ │ │ └── stage/route.ts ← PATCH stage
│ │ └── upload/route.ts
│ └── layout.tsx
│
├── lib/
│ ├── db/
│ │ ├── index.ts ← drizzle client
│ │ ├── schema.ts ← all table definitions
│ │ ├── queries/
│ │ │ ├── jobs.ts
│ │ │ ├── applications.ts
│ │ │ └── users.ts
│ │ └── migrations/ ← drizzle-kit output
│ ├── redis/
│ │ └── index.ts ← ioredis singleton
│ ├── queue/
│ │ ├── index.ts ← BullMQ queue setup
│ │ ├── worker.ts ← worker process entry
│ │ └── jobs/
│ │ ├── parseResume.ts
│ │ └── sendEmail.ts
│ ├── cron/
│ │ ├── index.ts ← register all crons
│ │ ├── interviewReminders.ts
│ │ └── weeklyDigest.ts
│ ├── email/
│ │ ├── index.ts ← Resend/Nodemailer client
│ │ └── templates/
│ │ ├── interviewReminder.tsx
│ │ └── weeklyDigest.tsx
│ ├── validations/
│ │ ├── job.schema.ts
│ │ ├── application.schema.ts
│ │ └── auth.schema.ts
│ └── utils/
│ ├── rateLimit.ts ← Redis sliding window
│ └── cache.ts ← cache helpers
│
├── components/
│ ├── kanban/
│ ├── forms/
│ └── ui/
│
├── middleware.ts ← route protection
├── worker.ts ← separate process: node worker.ts
└── drizzle.config.ts
