import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import { getAllAuditLogs, getAllEmailLogs } from "../controllers/auditController";

const router = express.Router();

router.use(protect, restrictTo("ADMIN"));

router.route("/").get(getAllAuditLogs);
router.route("/emails").get(getAllEmailLogs);

export default router;
