import rateLimit from "express-rate-limit";

// Strict limiter: Protects login/registration endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per IP
  skipSuccessfulRequests: true, // Don't count successful logins against them
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});
