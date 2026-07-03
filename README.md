# HireTrack

HireTrack is a modern, full-stack Applicant Tracking & Recruitment Automation Platform (ATS). It is designed for small to mid-size companies to streamline their hiring workflows, replacing fragmented spreadsheets and emails with a single unified platform. 

HireTrack combines a public job board, a visual Kanban pipeline, automated interview scheduling, and candidate tracking into one platform.

---

## 🛠️ Architecture & Tech Stack

HireTrack is structured as a **monorepo** containing two main sub-projects:

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons, Shadcn UI, NextAuth v5 (Beta)
*   **Backend**: Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL (with pg/postgres drivers), Redis, Resend (for emails), tsx

### Project Structure
```text
hiretrack/
├── Docs/               # Product Requirements and Roadmap docs
├── frontend/           # Next.js 16 Client web app
├── backend/            # Express, Drizzle ORM, and background workers/cron-jobs
├── misc/               # Cache clearing and database schema analyses scripts
├── package.json        # Root package definition
└── .gitignore          # Universal ignore configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [PostgreSQL](https://www.postgresql.org/) (running locally or hosted)
*   [Redis](https://redis.io/) (for caching, rate limiting, and background queues)

---

### 📦 Installation

#### 1. Clone the repository
```bash
git clone https://github.com/Saeed-gondle/HireTrack.git
cd HireTrack
```

#### 2. Install dependencies for all parts
In the root directory, install any shared helper tools, then install dependencies for both the frontend and backend:
```bash
# Install root package dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### ⚙️ Environment Configuration

#### Backend Setup (`backend/.env.local`)
Create a file named `.env.local` inside the `backend/` directory with the following variables:
```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/hiretrack
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=re_your_api_key
JWT_SECRET=your_jwt_secret_key
# Rate limiting config
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

#### Frontend Setup (`frontend/.env.local`)
Create a file named `.env.local` inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
AUTH_SECRET=your_nextauth_secret
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
AUTH_GITHUB_ID=your_github_oauth_client_id
AUTH_GITHUB_SECRET=your_github_oauth_client_secret
```

---

### 🗄️ Database Setup & Migrations

The backend uses **Drizzle ORM** with **PostgreSQL**. To set up and push your schema:

1.  **Generate migrations**:
    ```bash
    cd backend
    npm run migrate
    ```
2.  **Push migrations** directly to database:
    ```bash
    npm run db:push
    ```
3.  **Seed the database** (optional):
    ```bash
    npm run seed
    ```

---

### 💻 Running the Servers

#### Backend Development Server
Run the Express backend with automatic file-watching (`tsx`):
```bash
cd backend
npm run dev
```

#### Frontend Development Server
Run the Next.js frontend:
```bash
cd frontend
npm run dev
```

The applications will typically be available at:
*   Frontend: [http://localhost:3000](http://localhost:3000)
*   Backend API: [http://localhost:5000](http://localhost:5000)

---

## ⚡ Key Features

*   **Authentication & Role Management**: Secure OAuth (Google & GitHub) and Magic Link login. User roles: `ADMIN`, `RECRUITER`, and `CANDIDATE`.
*   **Job Posting Board**: Recruiters can draft, publish, and close jobs. Candidates can search and apply to public jobs.
*   **Drag & Drop Kanban Board**: Visual hiring pipeline stages (`APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`) for recruiters.
*   **Audit Trail Log**: Fully detailed history tracking for all candidate stage transitions.
*   **Asynchronous Background Tasks**: Email digests, reminder notifications, and resume processing offloaded using Redis.
*   **Automatic Email Alerts**: Confirmation emails, interview invitations, stage-change notifications, and weekly digests powered by Resend.
