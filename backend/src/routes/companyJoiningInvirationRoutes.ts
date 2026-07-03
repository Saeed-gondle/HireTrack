import express, { NextFunction, Request, Response } from "express";
import {
  createInviitation,
  joinInvitation,
} from "../controllers/invitationController";
import { protect, restrictTo } from "../controllers/authController";
let router = express.Router();
router
  .route("/new")
  .post(protect, restrictTo("RECRUITER", "ADMIN"), createInviitation);
router.route("/:token").post(protect, joinInvitation);
export default router;
