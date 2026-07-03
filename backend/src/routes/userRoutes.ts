import express from "express";
import {
  forgotPassword,
  generateMagicLink,
  isLoggedIn,
  login,
  logout,
  magicLogin,
  newVerification,
  protect,
  resetPassword,
  signup,
  updatePassword,
  verifyAccount,
} from "../controllers/authController";
import {
  getMe,
  getUser,
  updateMe,
  getAnalytics,
} from "../controllers/userController";
import { authLimiter } from "../middlewares/authRateLimit";

const router = express.Router();
router.post("/login", authLimiter, isLoggedIn, login);
router.post("/signup", authLimiter, signup);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/logout", logout);
router.route("/verify").post(verifyAccount);
router.get("/new-otp", newVerification);
router.post("/magic-link", generateMagicLink);
router.get("/magic-login/:token", magicLogin);
router.use(protect);
router.get("/me", getMe, getUser);
router.patch("/update-password", updatePassword);
router.patch("/update-me", updateMe);
router.get("/analytics", getAnalytics);
export default router;
