import express from "express";
import { createCompany } from "../controllers/companyController";
import { protect, restrictTo } from "../controllers/authController";
const router = express.Router();

// routes.route("/").get(getAllCompanies).post(createCompany);
// routes.route("/:id").get(getCompany).patch(updateCompany).delete(deleteCompany);
router.post("/create", protect, restrictTo("RECRUITER","ADMIN"), createCompany);
export default router;