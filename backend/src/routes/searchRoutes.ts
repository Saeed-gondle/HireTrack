import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import {
  searchCandidatesHandler,
  searchJobsHandler,
} from "../controllers/searchController";
let router = express.Router();
router.use(protect);

router.get("/jobs", restrictTo("ADMIN", "CANDIDATE"), searchJobsHandler);

router.get(
  "/candidates",
  restrictTo("ADMIN", "RECRUITER"),
  searchCandidatesHandler,
);
export default router;
