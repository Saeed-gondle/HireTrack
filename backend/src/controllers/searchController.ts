import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { searchJobs, searchCandidates } from "../services/searchService";

const parsePagination = (req: Request) => ({
  page: Number(req.query.page) || 1,
  limit: Number(req.query.limit) || 20,
});

export const searchJobsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const q = String(req.query.q || "").trim();
    if (!q) return next(new AppError("Query param 'q' is required", 400));

    const { page, limit } = parsePagination(req);
    const result = await searchJobs({ q, page, limit });

    res.status(200).json({
      status: "success",
      results: result.length,
      data: result,
    });
  },
);

export const searchCandidatesHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const q = String(req.query.q || "").trim();
    if (!q) return next(new AppError("Query param 'q' is required", 400));

    const { page, limit } = parsePagination(req);
    const result = await searchCandidates({ q, page, limit });

    res.status(200).json({
      status: "success",
      results: result.length,
      data: result,
    });
  },
);