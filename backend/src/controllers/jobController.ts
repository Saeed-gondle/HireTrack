import { companiesTable, db, jobsTable } from "../config/db";
import catchAsync from "../utils/catchAsync";
import { eq } from "drizzle-orm";
import AppError from "../utils/appError";
import { jobSchema, jobUpdateSchema } from "../schemas/jobSchema";
import { Request, Response, NextFunction } from "express";
import { deleteOne, getAll, getOne, updateOne } from "./handleFactory";
import client from "../redis/redisClient";
import { v4 as uuid } from "uuid";
export const getJob = getOne(jobsTable, "jobId");
export const getAllJobs = getAll(jobsTable, "jobsTable");
export const updateJob = updateOne(jobsTable, "jobId", jobUpdateSchema);
export const deleteJob = deleteOne(jobsTable, "jobId");
export const createJob = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const company = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.owner, req.user.id));
    if (company.length === 0) {
      return next(
        new AppError(
          `You are not authorized to create a job You need to create a company in order to create a job `,
          401,
        ),
      );
    }
    if (!req.user?.isVerified) {
      return next(
        new AppError(
          "You are not verified . Verify your account in order to create a job",
          401,
        ),
      );
    }
    const result = jobSchema.safeParse(req.body);
    if (!result.success) {
      return next(
        new AppError(
          `The Job creation schema is invalid ${result.error.message}`,
          400,
        ),
      );
    }
    let newJob = {
      company: company[0].id,
      createdBy: req.user.id,
      ...result.data,
    };
    let createdJob = await db.insert(jobsTable).values(newJob).returning();
    await client.del(`all_jobs_${JSON.stringify(req.query)}`);
    res.status(200).json({
      status: "success",
      results: createdJob.length,
      data: createdJob[0],
    });
  },
);

export const changeJobVisibility = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const jobs = await db
      .update(jobsTable)
      .set({
        status: req.body.status as "DRAFT" | "OPEN" | "CLOSED",
      })
      .where(eq(jobsTable.id, id))
      .returning();
    if (jobs.length === 0) {
      return next(new AppError("Job not found", 404));
    }
    await client.del(`all_jobs_${JSON.stringify(req.query)}`);
    res.status(200).json({
      status: "success",
      results: jobs.length,
      data: jobs[0],
    });
  },
);

export const duplicateJob = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { jobId } = req.params as { jobId: string };
    const job = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.id, jobId));
    if (job.length === 0) {
      return next(new AppError("Job not found", 404));
    }
    const newJob = {
      ...job[0],
      id: uuid(),
      status: "DRAFT",
      title: `${job[0].title} (Copy)`,
    } as typeof jobsTable.$inferInsert;
    const createdJob = await db.insert(jobsTable).values(newJob).returning();
    await client.del(`all_jobs_${JSON.stringify(req.query)}`);
    res.status(200).json({
      status: "success",
      results: createdJob.length,
      data: createdJob[0],
    });
  },
);
