import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
});
export const config = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  allowedUrls: process.env.ALLOWED_URLS,
  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  // CORS
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:19006",
      "https://paystormx.vercel.app",
    ],
    webAppUrl: process.env.WEB_APP_URL || "https://paystormx.vercel.app",
    mobileAppUrl: process.env.MOBILE_APP_URL || "http://localhost:19006",
  },

  // Webhooks
  webhookSecret: process.env.WEBHOOK_SECRET || "",

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@paystormx.com",
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || "admin123",
  },

  // Email Configuration
  email: {
    useSmtp: process.env.USE_SMTP === "true",
    // SMTP Configuration (for pro plan)
    smtp: {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_SECURE === "true",
      user: process.env.EMAIL_USER || "",
      password: process.env.EMAIL_PASSWORD || "",
    },
    // Resend Configuration (for free plan)
    resendApiKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "noreply@toolify.studio",
  },

  // Rate Limiting
  rateLimit: {
    // Auth endpoints: more lenient in development
    auth: {
      points:
        (process.env.NODE_ENV || "development") === "development" ? 50 : 5,
      duration:
        (process.env.NODE_ENV || "development") === "development"
          ? 60
          : 60 * 15,
      blockDuration:
        (process.env.NODE_ENV || "development") === "development"
          ? 60
          : 60 * 15,
    },
  },
} as const;

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Validate JWT secret lengths
if (config.jwt.secret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

if (config.jwt.refreshSecret.length < 32) {
  throw new Error("JWT_REFRESH_SECRET must be at least 32 characters long");
}

// Production safety checks
if (config.nodeEnv === "production") {
  if (config.admin.defaultPassword === "admin123") {
    console.warn(
      "⚠️ WARNING: Default admin password detected in production. Change ADMIN_DEFAULT_PASSWORD immediately!",
    );
  }
  if (!process.env.ALLOWED_ORIGINS) {
    throw new Error("ALLOWED_ORIGINS must be explicitly set in production");
  }
  if (config.jwt.secret === config.jwt.refreshSecret) {
    throw new Error(
      "JWT_SECRET and JWT_REFRESH_SECRET must be different in production",
    );
  }
}
