import express from "express";
import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import globalErrorHandler from "./controllers/globalErrorsController";
import AppError from "./utils/appError";
import { config } from "./config/env";
import userRouter from "./routes/userRoutes";
import jobsRouter from "./routes/jobRoutes";
import searchRouter from "./routes/searchRoutes";
import companyRouter from "./routes/companyRoutes";
import jobApplicationsRouter from "./routes/jobApplicationsRoute";
import interviewRouter from "./routes/interviewRoutes";
import auditRouter from "./routes/auditRoutes";
import invitationRouter from "./routes/companyJoiningInvirationRoutes";
import { initCronJobs } from "./cron-jobs/emailCron";
import { rateLimiter, cache } from "./redis/redisClient";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cookieParser());
// Parse JSON bodies (for Content-Type: application/json)
app.use(express.json());

// Parse URL-encoded bodies (for HTML form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        frameAncestors: ["'none'"], // Prevents clickjacking entirely
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);
if (config.nodeEnv === "development") {
  app.use(morgan("tiny"));
}
const allowedOrigins = [config.allowedUrls];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"], // Be strict
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Only if you use cookies/auth headers
    maxAge: 86400, // Cache preflight for 24h (performance boost)
  }),
);
// Global limiter: Protects the entire app from being overwhelmed
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per 15 mins
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

// Handle preflight requests explicitly
app.options("{*path}", cors());
app.use(express.json());
app.use(rateLimiter(100, 60));
app.use(cache(60));
app.use(globalLimiter); // Apply global rate limiter to all routes

// Catch JSON parsing errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    "body" in err &&
    (err as any).status === 400
  ) {
    return res.status(400).json({
      status: "error",
      message: "Invalid JSON payload sent. Please check your request body.",
    });
  }
  next(err);
});

const port = process.env.PORT || 5000;
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/users", userRouter);
app.use("/api/invitations", invitationRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/company", companyRouter);
app.use("/api/search", searchRouter);
app.use("/api/applications", jobApplicationsRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/audit", auditRouter);
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Test DB connection with a simple query
    const { db } = await import("./config/db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    res.status(200).json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: "degraded",
      db: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
app.all("{*path}", (req: Request, res: Response, next: NextFunction) => {
  // console.log(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  // next(err);
});
app.use(globalErrorHandler);

initCronJobs();

app.listen(port, () => {
  console.log(`Server is running on port ${port} visit http://localhost:5000`);
});
