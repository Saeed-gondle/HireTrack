import catchAsync from "../utils/catchAsync";
import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { applicationsTable, jobsTable, auditLogs } from "../db/schema";
import AppError from "../utils/appError";
import { and, eq, sql } from "drizzle-orm";
import { sendEmail } from "../services/sendEmail";
import { applicationRejectionEmail } from "../emails/applicationRejected";
import { newApplicationEmail } from "../emails/newApplication";
import { applicationStatusChangeEmail } from "../emails/applicationStatusChange";
import { getAll, getAllById, getOne, updateOne } from "./handleFactory";
import {
  createApplicationSchema,
  updateApplicationSchema,
} from "../schemas/applicationsSchema";
import client from "../redis/redisClient";
export const getAllApplications = getAll(applicationsTable,"applicationsTable");
export const getApplication = getOne(applicationsTable, "applicationId");
export const updateApplication = updateOne(
  applicationsTable,
  "applicationId",
  updateApplicationSchema,
);
export const getAllJobApplications = getAllById(
  applicationsTable,
  "jobId",
  "job",
);
export const getApplicationsByUserId = getAllById(
  applicationsTable,
  "userId",
  "candidate",
);
export const createApplication = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { jobId } = req.body;
    const isAlreadyApplied = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.job, jobId),
          eq(applicationsTable.candidate, req.user.id),
        ),
      );
    if (isAlreadyApplied.length > 0) {
      return next(new AppError("You have already applied for this job", 400));
    }
    const newApplication = {
      job: jobId,
      candidate: req.user.id,
      current_stage: "APPLIED",
      resume_url: req.body.resume_url || "",
      parsed_resume_url: req.body.parsed_resume_url || "",
      created_at: new Date(),
    };
    const parsedApplication = createApplicationSchema.safeParse(newApplication);
    if (!parsedApplication.success) {
      console.log(parsedApplication.error);
      return next(new AppError("Invalid application data", 400));
    }
    const application = await db.transaction(async (tx) => {
      const application = await tx
        .insert(applicationsTable)
        .values(parsedApplication.data)
        .returning();
      await tx
        .update(jobsTable)
        .set({ application_count: sql`${jobsTable.application_count} + 1` })
        .where(eq(jobsTable.id, jobId));

      await tx.insert(auditLogs).values({
        application_id: application[0].id,
        changed_by: req.user.id,
        from_stage: "NONE",
        to_stage: "APPLIED",
      });

      return application;
    });
    await client.del(`all_applications_${JSON.stringify(req.query)}`);
    const applicationWithCandidateEmail =
      await db.query.applicationsTable.findFirst({
        where: eq(applicationsTable.id, application[0].id),
        with: {
          candidate: {
            columns: { email: true, name: true },
          },
          job: {
            columns: { title: true },
            with: { company: { columns: { name: true } } },
          },
        },
      });
    console.log(applicationWithCandidateEmail);
    const email = applicationWithCandidateEmail?.candidate?.email;
    const job = applicationWithCandidateEmail?.job;
    const company = job?.company;
    if (!email || !company || !job) {
      return next(new AppError("Application not found", 404));
    }
    await sendEmail(
      email,
      "New Application Received",
      newApplicationEmail(
        company.name,
        applicationWithCandidateEmail.candidate.name,
        job.title,
        new Date().toISOString(),
        "APPLIED",
      ),
      "newApplicationEmail",
    );
    res.status(200).json({
      status: "success",
      data: {
        application,
      },
    });
  },
);

export const checkApplicationStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { applicationId } = req.params;
    const application = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId));
    res.status(200).json({
      status: "success",
      data: {
        status: application[0].current_stage,
      },
    });
  },
);

export const changeApplicationStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    const existingApp = await db
      .select({ current_stage: applicationsTable.current_stage })
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId));
    if (!existingApp.length) {
      return next(new AppError("Application not found", 404));
    }

    const application = await db
      .update(applicationsTable)
      .set({ current_stage: status })
      .where(eq(applicationsTable.id, applicationId))
      .returning();

    await db.insert(auditLogs).values({
      application_id: applicationId,
      changed_by: req.user.id,
      from_stage: existingApp[0].current_stage,
      to_stage: status,
    });
    const applicationWithCandidateEmail =
      await db.query.applicationsTable.findFirst({
        where: eq(applicationsTable.id, application[0].id),
        with: {
          candidate: {
            columns: { email: true, name: true },
          },
          job: {
            columns: { title: true },
            with: { company: { columns: { name: true } } },
          },
        },
      });
    console.log(applicationWithCandidateEmail);
    const email = applicationWithCandidateEmail?.candidate?.email;
    const job = applicationWithCandidateEmail?.job;
    const company = job?.company;
    if (!email || !company || !job) {
      return next(new AppError("Application not found", 404));
    }
    await sendEmail(
      email,
      "Application Status Update",
      applicationStatusChangeEmail(
        company.name,
        job.title,
        applicationWithCandidateEmail.candidate.name,
        status,
      ),
      "applicationStatusChangeEmail",
    );
    res.status(200).json({
      status: "success",
      data: {
        application,
      },
    });
  },
);
export const rejectApplication = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { applicationId } = req.params;

    const existingApp = await db
      .select({ current_stage: applicationsTable.current_stage })
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId));
    if (!existingApp.length) {
      return next(new AppError("Application not found", 404));
    }

    const application = await db
      .update(applicationsTable)
      .set({ current_stage: "REJECTED" })
      .where(eq(applicationsTable.id, applicationId))
      .returning();

    await db.insert(auditLogs).values({
      application_id: applicationId,
      changed_by: req.user.id,
      from_stage: existingApp[0].current_stage,
      to_stage: "REJECTED",
    });
    const applicationWithCandidateEmail =
      await db.query.applicationsTable.findFirst({
        where: eq(applicationsTable.id, application[0].id),
        with: {
          candidate: {
            columns: { email: true, name: true },
          },
          job: {
            columns: { title: true },
            with: { company: { columns: { name: true } } },
          },
        },
      });
    console.log(applicationWithCandidateEmail);
    const email = applicationWithCandidateEmail?.candidate?.email;
    const job = applicationWithCandidateEmail?.job;
    const company = job?.company;
    if (!email || !company || !job) {
      return next(new AppError("Application not found", 404));
    }
    await sendEmail(
      email,
      "Application Rejected",
      applicationRejectionEmail(
        applicationWithCandidateEmail.candidate.name,
        company.name,
        job.title,
      ),
      "applicationRejectionEmail",
    );
    res.status(200).json({
      status: "success",
      data: {
        application,
      },
    });
  },
);
