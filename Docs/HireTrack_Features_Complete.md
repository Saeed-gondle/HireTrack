# HireTrack - Complete Feature List & Page Structure

**Product:** HireTrack - Applicant Tracking & Recruitment Automation Platform  
**Last Updated:** April 7, 2026  
**Version:** 1.0

---

## Executive Summary

HireTrack is organized into **11 main pages/sections** serving **3 user roles** (Admin, Recruiter, Candidate). This document provides a complete breakdown of all required features, organized by page and functionality category.

---

## User Roles & Access Matrix

| Role          | Primary Pages                                                  | Permissions                                 |
| ------------- | -------------------------------------------------------------- | ------------------------------------------- |
| **Admin**     | Dashboard, Users, Companies, Platform Stats, Queue Monitor     | Full system access, user/company management |
| **Recruiter** | Dashboard, Jobs, Kanban Board, Interviews, Analytics, Settings | Company & job data, candidate management    |
| **Candidate** | Public Jobs, Job Detail, Applications, Application Status      | Browse jobs, apply, track status            |

---

## Page Structure & Features

### 🔐 **1. Authentication & Login**

**Roles:** All  
**Purpose:** Secure user entry point

#### Features:

- [ ] OAuth Login (Google & GitHub)
- [ ] Magic Link Login (optional, for candidates)
- [ ] Email/Password Login (fallback)
- [ ] Session Management with JWT
- [ ] Token Refresh on Expiry
- [ ] Auto-redirect by Role
- [ ] Remember Me (optional)
- [ ] Forgot Password Flow
- [ ] Email Verification
- [ ] Rate Limiting on Login (5 attempts/15 min)

**Operations:**

- POST `/api/auth/signin` - Initiate login
- POST `/api/auth/verify` - Email verification
- POST `/api/auth/refresh` - Refresh JWT token
- POST `/api/auth/signout` - Logout

---

### 📊 **2. Admin Dashboard**

**Role:** Admin only  
**Purpose:** Platform-wide visibility and control

#### Features:

- [ ] Platform Overview Cards (Total users, companies, jobs, applications, pending interviews)
- [ ] Active Users Chart (daily/weekly)
- [ ] New Applications Trend (line chart)
- [ ] Top Performing Jobs (by applications)
- [ ] Queue Health Status (BullMQ metrics)
- [ ] Email Delivery Status (success/failed rates)
- [ ] System Health Indicators (database, Redis, background jobs)
- [ ] Real-time Alerts Panel

**Operations:**

- GET `/api/admin/stats` - Fetch platform metrics
- GET `/api/admin/health` - System health check
- GET `/api/admin/queue/stats` - Queue metrics
- GET `/api/admin/email-logs` - Email delivery logs

---

### 👥 **3. User Management (Admin)**

**Role:** Admin only  
**Purpose:** Manage all platform users

#### Features:

- [ ] User List Table (with search, filter, pagination)
- [ ] User Details View (email, role, company, created date, last login)
- [ ] Role Assignment Modal (Admin, Recruiter, Candidate)
- [ ] Account Status Toggle (active/suspended)
- [ ] Impersonation with Audit Logging
- [ ] Bulk Actions (suspend, delete, change role)
- [ ] User Activity Timeline
- [ ] Password Reset (admin-initiated)

**Operations:**

- GET `/api/admin/users` - List all users
- GET `/api/admin/users/:id` - User details
- PATCH `/api/admin/users/:id/role` - Change role
- PATCH `/api/admin/users/:id/status` - Suspend/activate
- POST `/api/admin/users/:id/impersonate` - Start impersonation
- DELETE `/api/admin/users/:id` - Soft delete user

---

### 🏢 **4. Company Management (Admin)**

**Role:** Admin only  
**Purpose:** Oversee all hiring organizations

#### Features:

- [ ] Company List with Stats (job count, applicant count, hiring stage breakdown)
- [ ] Company Detail View
- [ ] Company Contact Info
- [ ] Associated Users (owner and recruiters)
- [ ] Subscription/Plan Info
- [ ] Soft Delete Company
- [ ] Company Verification Status

**Operations:**

- GET `/api/admin/companies` - List companies
- GET `/api/admin/companies/:id` - Company details
- PATCH `/api/admin/companies/:id` - Update company
- GET `/api/admin/companies/:id/users` - Staff list
- GET `/api/admin/companies/:id/stats` - Company metrics

---

### 💼 **5. Recruiter Dashboard**

**Role:** Recruiter  
**Purpose:** Quick overview of hiring pipeline

#### Features:

- [ ] Jobs Quick Stats (open, closed, draft, total applicants)
- [ ] Recent Applications Widget (last 10, with stage)
- [ ] Upcoming Interviews Widget (next 7 days)
- [ ] Pipeline Overview (stage distribution across all jobs)
- [ ] Quick Actions Panel (create job, view kanban)
- [ ] Pending Tasks (follow-ups, reminders)
- [ ] Company Switcher (multi-company support, if applicable)

**Operations:**

- GET `/api/dashboard/stats` - Recruiter metrics
- GET `/api/dashboard/recent-applications` - Latest apps
- GET `/api/dashboard/upcoming-interviews` - Scheduled interviews
- GET `/api/dashboard/tasks` - Pending actions

---

### 📝 **6. Job Management**

**Role:** Recruiter  
**Purpose:** Create, edit, and manage job listings

#### Features:

**Create/Edit Job:**

- [ ] Job Title Input
- [ ] Job Description (rich text editor)
- [ ] Location Field (with autocomplete)
- [ ] Job Type Dropdown (Full-time, Part-time, Contract, Freelance)
- [ ] Salary Range (optional min/max)
- [ ] Required Skills (tag input with autocomplete)
- [ ] Qualifications/Requirements (rich text)
- [ ] Benefits (tag input)
- [ ] Seniority Level (Junior, Mid, Senior)
- [ ] Close Date Picker (optional)
- [ ] application_deadline Date Picker
- [ ] Draft Save (auto-save every 30s)
- [ ] Form Validation Feedback

**Job Listing:**

- [ ] Jobs Table/List (with search, sort, filter)
- [ ] Status Indicators (Draft, Open, Closed, Archived)
- [ ] Applicant Count Per Job
- [ ] Stage Breakdown (Applied, Screening, Interview, Offer, Hired, Rejected)
- [ ] Created/Updated Timestamps
- [ ] Bulk Actions (publish, close, delete)

**Job Actions:**

- [ ] Publish Job (Draft → Open)
- [ ] Close Job (Open → Closed)
- [ ] Reopen Job (Closed → Open)
- [ ] Duplicate Job (Clone to Draft)
- [ ] Archive Job (soft delete)
- [ ] Edit Published Job
- [ ] View Job as Public (preview)
- [ ] Share Job Link (via email/social)

**Operations:**

- POST `/api/jobs` - Create job
- GET `/api/jobs` - List jobs (with filters)
- GET `/api/jobs/:id` - Job details
- PATCH `/api/jobs/:id` - Update job
- POST `/api/jobs/:id/publish` - Change to Open
- POST `/api/jobs/:id/close` - Change to Closed
- POST `/api/jobs/:id/duplicate` - Clone job
- DELETE `/api/jobs/:id` - Soft delete

---

### 🌐 **7. Public Job Board (Candidate)**

**Role:** Candidate (unauthenticated accessible)  
**Purpose:** Browse and discover open positions

#### Features:

- [ ] Job Listing Grid/List View (toggle views)
- [ ] Search Bar (keyword search with debounce)
- [ ] Filter Panel:
  - [ ] Job Type (multiselect)
  - [ ] Location (multiselect)
  - [ ] Salary Range Slider
  - [ ] Seniority Level (multiselect)
  - [ ] Posted Date (last 7 days, month, any)
  - [ ] Company Filter (multiselect)
- [ ] Sort Options (relevance, newest, closing soon)
- [ ] Pagination (20 results per page)
- [ ] Job Card Preview (title, company, location, type, salary snippet)
- [ ] Saved Jobs Bookmark (if authenticated)
- [ ] Job Recommendations (based on saved/applied jobs)
- [ ] Zero-State (no results) with suggestions

**Operations:**

- GET `/api/public/jobs` - Public job list (cached 5 min)
- GET `/api/public/jobs/:id` - Job details page
- POST `/api/public/jobs/:id/save` - Bookmark job (authenticated only)
- GET `/api/public/saved-jobs` - Candidate's saved jobs
- GET `/api/public/jobs/search` - Full-text trigram search

---

### 📄 **8. Job Detail & Application Page (Candidate)**

**Role:** Candidate  
**Purpose:** View full job details and apply

#### Features:

**Job Detail Section:**

- [ ] Full Job Title, Description (rendered HTML)
- [ ] Company Logo & Name
- [ ] Location, Job Type, Salary Info
- [ ] Required Skills (badges)
- [ ] Benefits List
- [ ] Application Deadline (countdown timer if < 7 days)
- [ ] Posted Date & Times Updated
- [ ] Share Job Buttons (LinkedIn, Twitter, email)
- [ ] Report Job Link (spam/inappropriate)

**Application Form:**

- [ ] Resume Upload (PDF, drag-drop support)
- [ ] Resume Preview
- [ ] Cover Letter Textarea (optional)
- [ ] Custom Questions (if job has them)
- [ ] Email Confirmation Checkbox
- [ ] Phone Number (optional)
- [ ] LinkedIn Profile URL (optional)
- [ ] Form Validation (required fields, file size 5MB max)
- [ ] Rate Limit Warning (max 10 applications/hour)
- [ ] Submit Button (disabled if limit reached)
- [ ] Success Toast + Redirect to Status Page

**Application Rules:**

- [ ] Prevent Duplicate Application (same candidate + job)
- [ ] Rate Limiting: 10 applications per hour per candidate
- [ ] Require Resume PDF

**Operations:**

- POST `/api/applications` - Submit application
- POST `/api/applications/:id/withdraw` - Withdraw application
- GET `/api/public/jobs/:id` - Full job details
- GET `/api/applications/check-limit` - Rate limit check

---

### 📊 **9. Application Tracking (Candidate)**

**Role:** Candidate  
**Purpose:** Monitor application status

#### Features:

- [ ] My Applications List (table/cards)
- [ ] Filter by Status (Applied, Screening, Interview, Offer, Hired, Rejected, Withdrawn)
- [ ] Sort (newest, company, status)
- [ ] Application Status Badge (color-coded)
- [ ] Timeline View per Application:
  - [ ] Application Submitted Date
  - [ ] Stage History (when moved, by whom)
  - [ ] Interview Dates (if scheduled)
  - [ ] Last Updated Timestamp
- [ ] Withdraw Application Button (before screening)
- [ ] Email Notifications Toggle
- [ ] Export Applications (CSV, PDF)

**Operations:**

- GET `/api/applications/my` - Candidate's applications
- GET `/api/applications/:id` - Application details
- GET `/api/applications/:id/timeline` - Stage history
- POST `/api/applications/:id/withdraw` - Withdraw

---

### 🎯 **10. Kanban Board (Recruiter)**

**Role:** Recruiter  
**Purpose:** Visual pipeline management

#### Features:

**Board Structure:**

- [ ] 6 Stage Columns (Applied, Screening, Interview, Offer, Hired, Rejected)
- [ ] Candidate Card Preview (name, email, avatar, job title, applied date)
- [ ] Card Hover Shows (resume preview, custom notes snippet, interview dates)
- [ ] Drag-and-Drop Between Columns (with optimistic update)
- [ ] Undo Last Move (within session)

**Filters & Controls:**

- [ ] Filter by Job (dropdown)
- [ ] Filter by Status (checkboxes)
- [ ] Search Candidates (name, email)
- [ ] Date Range Filter (applied between dates)
- [ ] Sorting within Column (by date, alphabetical)

**Card Actions (Right-click or Menu):**

- [ ] View Full Application
- [ ] Send Email
- [ ] Schedule Interview
- [ ] Add Internal Note
- [ ] Move to Stage (manual button)
- [ ] View Resume (modal)
- [ ] View Timeline
- [ ] Reject Candidate

**Bulk Actions:**

- [ ] Multi-select Cards
- [ ] Bulk Move to Stage
- [ ] Bulk Reject
- [ ] Bulk Send Email

**Operations:**

- GET `/api/applications?job_id=:id&stage=:stage` - Applications by stage
- PATCH `/api/applications/:id/stage` - Move stage (atomic + audit log)
- GET `/api/applications/:id/full` - Full application modal
- POST `/api/applications/:id/bulk-move` - Bulk stage update
- POST `/api/applications/:id/reject` - Reject candidate

---

### 📋 **11. Application Detail & Audit Trail**

**Role:** Recruiter  
**Purpose:** Full candidate review and history

#### Features:

**Application Details:**

- [ ] Candidate Info (name, email, phone, LinkedIn)
- [ ] Resume Display (PDF viewer or text preview)
- [ ] Cover Letter (if provided)
- [ ] Application Metadata (applied date, job title, source)
- [ ] Custom Question Answers
- [ ] Attachment Downloads

**Audit Trail:**

- [ ] Immutable Stage Change History
  - [ ] From Stage, To Stage, Changed By, Timestamp
  - [ ] Reason/Notes (if provided)
- [ ] Action Timeline (emails sent, interviews scheduled, notes added)
- [ ] Email Log (all notifications sent to candidate)
- [ ] Interview Records

**Internal Notes:**

- [ ] Add Note Button
- [ ] Note List (newest first)
- [ ] Note Editor (rich text, @mention recruiters)
- [ ] Notification on @mention
- [ ] Delete Own Note (soft delete)
- [ ] Pin Important Notes
- [ ] Note Timestamps & Author

**Interview Section:**

- [ ] Scheduled Interviews List
- [ ] Interview Details (type, date, time, meeting link)
- [ ] Interview Notes (recruiter feedback)
- [ ] Reschedule Interview
- [ ] Cancel Interview
- [ ] Calendar Download (.ics)

**Operations:**

- GET `/api/applications/:id` - Full details
- GET `/api/applications/:id/audit-trail` - Change history
- POST `/api/applications/:id/notes` - Add note
- PATCH `/api/applications/:id/notes/:noteId` - Edit note
- DELETE `/api/applications/:id/notes/:noteId` - Delete note
- GET `/api/applications/:id/emails` - Email log

---

### 🗓️ **12. Interview Scheduling**

**Role:** Recruiter (create), Candidate (respond)  
**Purpose:** Manage interviews and availability

#### Features:

**Create Interview (Recruiter):**

- [ ] Interview Type Dropdown (Phone, Video, In-person, Other)
- [ ] Date Picker
- [ ] Time Picker (with timezone support)
- [ ] Duration Selector (30min, 60min, etc.)
- [ ] Interview Link Input (Zoom, Teams, etc.)
- [ ] Interviewer Selection (multiselect)
- [ ] Notes/Instructions Textarea
- [ ] Reminder Settings (24h before, 1h before)
- [ ] Send Notification to Candidate (auto-queued)

**Interview List (Recruiter):**

- [ ] Interview Calendar View
- [ ] List View (all upcoming interviews)
- [ ] Filter by Date Range
- [ ] Filter by Job
- [ ] Color-coded by Status (scheduled, completed, no-show, cancelled)
- [ ] Reminders Due (bulk mark as sent)

**Interview List (Candidate):**

- [ ] Upcoming Interviews
- [ ] Interview Details (date, time, link, instructions)
- [ ] Calendar Download (.ics)
- [ ] Confirm Attendance
- [ ] Reschedule Request Button
- [ ] Interview Feedback (post-interview)

**Reschedule Flow:**

- [ ] Candidate Proposes Slot(s)
- [ ] Recruiter Accepts/Rejects
- [ ] Both Notified on Update
- [ ] Updated Calendar Invite

**Reminders (Automated):**

- [ ] 24-Hour Before (candidate & interviewers)
- [ ] 1-Hour Before (candidate & interviewers)
- [ ] No-Show Reminder (if missed)
- [ ] Follow-up Email (24h after scheduled time)

**Operations:**

- POST `/api/interviews` - Create interview
- GET `/api/interviews?job_id=:id` - List interviews
- PATCH `/api/interviews/:id` - Update/reschedule
- DELETE `/api/interviews/:id` - Cancel interview
- POST `/api/interviews/:id/confirm` - Candidate confirmation
- POST `/api/interviews/:id/reschedule-propose` - Candidate proposes slots
- GET `/api/interviews/:id/calendar.ics` - Download .ics file

---

### 📧 **13. Email System (Background Process)**

**Role:** No direct UI (automated)  
**Purpose:** Candidate & recruiter notifications

#### Email Templates:

1. [ ] **Application Received** → Candidate (confirms submission)
2. [ ] **Application Status Change** → Candidate (moved to Screening, Interview, Offer, Rejected)
3. [ ] **Interview Scheduled** → Candidate & Recruiters
4. [ ] **Interview Reminder (24h)** → Candidate & Recruiters
5. [ ] **Interview Reminder (1h)** → Candidate & Recruiters
6. [ ] **Interview Feedback Request** → Candidate
7. [ ] **Offer Extended** → Candidate
8. [ ] **Rejection** → Candidate (with feedback if applicable)
9. [ ] **Weekly Digest** → Recruiter (Monday, job stats, pending tasks)
10. [ ] **Password Reset** → User
11. [ ] **Email Verification** → User
12. [ ] **Admin Notification** (failed queued jobs) → Admin

#### Features:

- [ ] Email Template Management
- [ ] Dynamic Variable Substitution (name, job title, link, etc.)
- [ ] HTML + Plain Text Versions
- [ ] Unsubscribe Links
- [ ] Email Log Storage (with retry attempts)
- [ ] Failed Email Alert
- [ ] Delivery Tracking (queued, sent, bounced, failed)
- [ ] Rate Limiting on Sends (prevent spam)
- [ ] Resend Failed Emails

**Operations (Queue):**

- POST `/queue/send-email` - Enqueue email (BullMQ)
- GET `/api/admin/email-logs` - View all sent emails
- POST `/api/admin/email-logs/:id/resend` - Retry failed email

---

### 🔍 **14. Search (Full-Text & Filters)**

**Role:** Recruiter (candidate search), Candidate (job search)  
**Purpose:** Fast, relevant discovery

#### Job Search (Candidate):\*\*

- [ ] Full-Text Trigram Search (title, description)
- [ ] Keyword Autocomplete
- [ ] Faceted Filters (type, location, seniority, salary range, company)
- [ ] Pagination (20 per page, deep linking)
- [ ] Search Analytics (logged searches)

#### Candidate Search (Recruiter):\*\*

- [ ] Search by Name, Email
- [ ] Filter by Job
- [ ] Filter by Stage
- [ ] Filter by Applied Date Range
- [ ] Saved Search Filters
- [ ] Export Search Results

**Database Indexes:**

- [ ] GIN Trigram Index on `jobs.title`
- [ ] GIN Trigram Index on `jobs.description`
- [ ] B-Tree Index on `applications.current_stage`
- [ ] B-Tree Index on `users.email`

**Operations:**

- GET `/api/public/jobs/search?q=:query` - Job search (cached)
- GET `/api/applications/search?q=:query` - Candidate search

---

### 📈 **15. Analytics Dashboard (Recruiter)**

**Role:** Recruiter  
**Purpose:** Data-driven hiring insights

#### Charts & Metrics:

**Conversion Funnel (per job):**

- [ ] Applied → Screening → Interview → Offer → Hired
- [ ] Drop-off rate between stages
- [ ] Time-to-conversion

**Time-to-Hire:**

- [ ] Average days from apply to hire
- [ ] Trend over time (line chart)
- [ ] By job category
- [ ] By seniority level

**Pipeline Stage Duration:**

- [ ] Avg days in each stage
- [ ] Bottleneck detection (highlight stages > 7 days)
- [ ] Standard deviation

**Applicants Over Time:**

- [ ] Weekly/monthly trend (bar chart)
- [ ] Job source (referral, board, LinkedIn, etc. if tracked)

**Top Jobs by Activity:**

- [ ] Applied count ranking
- [ ] Conversion ratio ranking
- [ ] Time-to-hire ranking

**Recruiter Metrics (optional):**

- [ ] Offers made vs. accepted
- [ ] Rejection reasons (if tracked)
- [ ] Email response rates

**Export:**

- [ ] Download reports as PDF/CSV
- [ ] Schedule weekly email reports
- [ ] Custom date range selection

**Operations:**

- GET `/api/analytics/funnel?job_id=:id` - Funnel metrics
- GET `/api/analytics/time-to-hire` - TTH analytics
- GET `/api/analytics/stage-duration` - Duration breakdown
- GET `/api/analytics/applicants-trend` - Application trend

---

### ⚙️ **16. Settings & Preferences**

#### Recruiter Settings:

- [ ] Company Profile (name, logo, contact, website)
- [ ] Email Signature
- [ ] Notification Preferences (email digest frequency)
- [ ] Team Members (add/remove recruiters, assign jobs)
- [ ] Interview Reminder Schedule (customize times)
- [ ] Workflow Customization (add custom pipeline stages - future)
- [ ] Integrations (webhook URLs for job posting)

#### Candidate Settings:

- [ ] Profile Info (name, email, phone)
- [ ] Password Change
- [ ] Email Notification Preferences
- [ ] Delete Account

#### Admin Settings:

- [ ] Platform Branding (logo, colors)
- [ ] Email Provider Config (SMTP or Resend API key)
- [ ] Storage Provider Config (Supabase, S3)
- [ ] Rate Limit Thresholds
- [ ] Queue & Redis Health
- [ ] Backup/Restore Options
- [ ] CORS Allowed Origins

**Operations:**

- GET `/api/settings` - User settings
- PATCH `/api/settings` - Update settings
- POST `/api/settings/change-password` - Password change
- DELETE `/api/user/account` - Account deletion

---

### 🔒 **17. Security & Access Control**

#### Features:

- [ ] Role-Based Access Control (RBAC) on all routes
- [ ] JWT Token with Expiry (1h) and Refresh Token (7d)
- [ ] Secure Session Cookies (HttpOnly, Secure, SameSite)
- [ ] CSRF Protection on forms
- [ ] Request Validation (Zod schemas)
- [ ] Rate Limiting (global, auth endpoints, application submit)
- [ ] Audit Logging (all data mutations tracked)
- [ ] Admin Impersonation with Audit Trail
- [ ] Soft Deletes (no hard deletes for recovery)
- [ ] Data Encryption at Rest (future: field-level encryption)

**Operations:**

- Middleware checks on protected routes
- Validation on all POST/PATCH/DELETE endpoints
- Rate limit check on apply, login, password reset

---

### 📱 **18. Background Jobs & Cron Tasks (BullMQ + Node-Cron)**

#### Job Queue Types:

1. [ ] **parse-resume** - Extract text from PDF resume
2. [ ] **send-email** - Transactional email delivery (with retries)
3. [ ] **process-application** - Post-submission pipeline (parse resume, send confirmation)
4. [ ] **notify-stage-change** - Send candidate notification on stage move
5. [ ] **schedule-interview-reminder** - Send 24h/1h reminders
6. [ ] **process-rejected** - Send rejection email with feedback

#### Cron Tasks (Node-Cron):

1. [ ] **Daily 9:00 AM** - Interview reminders (24h before)
2. [ ] **Every hour** - Check failed jobs queue, log alerts
3. [ ] **Every Monday 8:00 AM** - Send recruiter weekly digest
4. [ ] **Every day 11:55 PM** - Cleanup old sessions (keep last 30 days)
5. [ ] **Quarterly (1st of month)** - Archive candidates > 6 months old (soft delete)

#### Queue Features:

- [ ] Retry Logic (exponential backoff: 1s, 10s, 1min, 5min, 15min, 30min)
- [ ] Dead-Letter Queue (DLQ) for jobs > 5 failures
- [ ] Job Status Tracking (queued, processing, completed, failed)
- [ ] Job Persistence (Redis)
- [ ] Admin Queue Monitor (view stats, retry/delete jobs)
- [ ] Error Logging (Pino structured logs)

**Operations:**

- GET `/api/admin/queue/stats` - Queue health
- POST `/api/admin/queue/:jobId/retry` - Retry failed job
- DELETE `/api/admin/queue/:jobId` - Remove job from queue
- GET `/api/admin/queue/:type/jobs` - View jobs by type

---

## Feature Implementation Checklist

### Phase 1: Foundation (Week 1-2)

- [ ] Project setup (Next.js, TypeScript, Drizzle, PostgreSQL)
- [ ] Database schema & migrations
- [ ] Environment config (dotenv)
- [ ] OAuth setup (Google, GitHub)
- [ ] Session/JWT management
- [ ] Role assignment on first login
- [ ] Protected routes middleware
- [ ] Error handling & logging setup

### Phase 2: Core Domain (Week 3-4)

- [ ] User registration & profile
- [ ] Company creation & management
- [ ] Job CRUD (create, read, update, delete, publish, close)
- [ ] Public job board (browse, search, filter)
- [ ] Application submission with resume upload
- [ ] Rate limiting (10 apps/hour)
- [ ] Application tracking (candidate view)

### Phase 3: Pipeline (Week 5-6)

- [ ] Kanban board (drag & drop)
- [ ] Stage transitions
- [ ] Audit logging (all stage changes)
- [ ] Application detail page with audit trail
- [ ] Internal notes system
- [ ] Recruiter dashboard

### Phase 4: Automation (Week 7-9)

- [ ] Redis + BullMQ setup
- [ ] Email system (Resend or Nodemailer)
- [ ] Email templates (11 types)
- [ ] Background job handlers (resume parsing, email sending)
- [ ] Cron tasks (reminders, digests, cleanup)
- [ ] Interview scheduling
- [ ] Interview reminders (24h, 1h before)
- [ ] Resume parsing (pdf-parse)

### Phase 5: Intelligence & Polish (Week 10-12)

- [ ] Full-text search (trigram indexes)
- [ ] Analytics dashboard (funnel, TTH, trends)
- [ ] Admin panel (users, companies, stats, queue monitor)
- [ ] Settings pages (recruiter, candidate, admin)
- [ ] Email logs & debugging
- [ ] Error monitoring (Sentry)
- [ ] Performance optimization (caching, indexes)
- [ ] Documentation & deployment

---

## Database Schema Summary

| Table             | Key Columns                                          | Purpose              |
| ----------------- | ---------------------------------------------------- | -------------------- |
| users             | id, email, role                                      | User accounts        |
| companies         | id, owner_id, name                                   | Company profiles     |
| jobs              | id, company_id, status, title, description           | Job listings         |
| applications      | id, job_id, candidate_id, current_stage, resume_url  | Applications         |
| audit_logs        | id, application_id, from_stage, to_stage, changed_by | Stage history        |
| application_notes | id, application_id, author_id, body                  | Internal notes       |
| interviews        | id, application_id, scheduled_at, type, link         | Interviews           |
| interview_slots   | id, application_id, proposed_at                      | Reschedule proposals |
| email_logs        | id, to_email, template, status, sent_at              | Email tracking       |
| saved_jobs        | id, user_id, job_id                                  | Candidate bookmarks  |

---

## API Endpoint Summary

**Auth:** 8 endpoints  
**Jobs:** 8 endpoints  
**Applications:** 12 endpoints  
**Interviews:** 6 endpoints  
**Admin:** 12 endpoints  
**Analytics:** 4 endpoints  
**Settings:** 4 endpoints  
**Search:** 3 endpoints  
**Queue/Jobs:** 4 endpoints

**Total: ~61 API endpoints**

---

## Environment Variables Required

```
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL, NEXTAUTH_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

# Redis & Queue
REDIS_URL

# Email
RESEND_API_KEY (or EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD for SMTP)

# Storage
SUPABASE_URL, SUPABASE_SERVICE_KEY (or AWS_S3_BUCKET, etc.)

# Monitoring
SENTRY_DSN

# App
NODE_ENV, PORT, ALLOWED_ORIGINS, ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD
```

---

## Estimated Development Timeline

| Phase        | Duration     | Effort                              |
| ------------ | ------------ | ----------------------------------- |
| Foundation   | 2 weeks      | High (setup, architecture, auth)    |
| Core Domain  | 2 weeks      | High (database, upload, validation) |
| Pipeline     | 2 weeks      | High (drag-drop, audit logs)        |
| Automation   | 3 weeks      | Very High (queues, emails, cron)    |
| Intelligence | 3 weeks      | Medium (analytics, polish, deploy)  |
| **Total**    | **12 weeks** | **1 developer**                     |

---

**Document prepared for HireTrack engineering team.**  
For questions or updates, refer to HireTrack_PRD.md
