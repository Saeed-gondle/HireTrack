import express from "express";
import {
  createJob,
  deleteJob,
  duplicateJob,
  getAllJobs,
  getJob,
  updateJob,
} from "../controllers/jobController";
import { protect, restrictTo } from "../controllers/authController";
const router = express.Router();
router.route("/").get(protect, getAllJobs);
router
  .route("/create")
  .post(protect, restrictTo("ADMIN", "RECRUITER"), createJob);
router
  .route("/:jobId")
  .get(protect, restrictTo("ADMIN", "RECRUITER"), getJob)
  .patch(protect, restrictTo("ADMIN", "RECRUITER"), updateJob)
  .delete(protect, restrictTo("ADMIN", "RECRUITER"), deleteJob);
router
  .route("/:jobId/duplicate")
  .post(protect, restrictTo("ADMIN", "RECRUITER"), duplicateJob);
export default router;
