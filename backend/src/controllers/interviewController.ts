import catchAsync from "../utils/catchAsync";
import { Request, Response, NextFunction, response } from "express";
import { db } from "../config/db";
import { applicationsTable, interviewsTable, auditLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../services/sendEmail";
import { interviewScheduledEmail } from "../emails/Interview";
import AppError from "../utils/appError";
import { deleteOne, getAll, getAllById, getOne, updateOne } from "./handleFactory";
import { updateInterviewSchema } from "../schemas/interviewSchema";

export const getAllInterviews = getAll(interviewsTable)
export const getInterview = getOne(interviewsTable, "interviewId")
export const deleteInterview = deleteOne(interviewsTable, "interviewId")
export const updateInterview = updateOne(interviewsTable, "interviewId", updateInterviewSchema)
export const getAllInterviewsByJob = getAllById(interviewsTable, "applicationId", "application")
export const getAllInterviewsByUser = getAllById(interviewsTable, "userId", "user")
export const rescheduleInterview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { interviewId } = req.params;
    const { scheduled_at, interview_type } = req.body;
    const interview = await db.update(interviewsTable).set({
        scheduled_at,
        interview_type,
    }).where(eq(interviewsTable.id, interviewId)).returning();
    const interviewWithCandidateEmail = await db.query.interviewsTable.findFirst({
        where: eq(interviewsTable.id, interview[0].id),
        with: {
            application: {
                with: {
                    candidate: {
                        columns: { email: true, name: true }
                    },
                    job: {
                        columns: { title: true },
                        with: { company: { columns: { name: true } } }
                    }
                }
            }
        }
    });
    console.log(interviewWithCandidateEmail);
    const email = interviewWithCandidateEmail?.application?.candidate?.email;
    const job = interviewWithCandidateEmail?.application?.job;
    const company = job?.company;
    if (!email || !company || !job) {
        return next(new AppError("Interview not found", 404));
    }
    await sendEmail(
        email,
        "Interview Rescheduled! 🔄",
        interviewScheduledEmail(
            req.user.name,
            company.name,
            job.title,
            new Date(interview[0].scheduled_at * 1000).toLocaleString(),
            "https://meet.google.com/xyz123",
            interview[0].interview_type,
            "RESCHEDULED"
        ),
        "interviewRescheduledEmail"
    );
    res.status(200).json({
        status: "success",
        data: {
            interview,
        },
    });
})
export const createInterview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { application_id, scheduled_at, interview_type } = req.body;
    const interviewAlreadyScheduled = await db.query.interviewsTable.findFirst({
        where: eq(interviewsTable.application, application_id)
    })
    if (interviewAlreadyScheduled) {
        return next(new AppError("Interview already scheduled", 400));
    }
    const interview = await db.transaction(async (tx) => {
        const interview = await tx.insert(interviewsTable).values({
            application: application_id,
            scheduled_at: scheduled_at ?? Math.floor(Date.now() / 1000),
            interview_type: interview_type,
            reminder_sent: false
        }).returning();

        const existingApp = await tx.select({ current_stage: applicationsTable.current_stage }).from(applicationsTable).where(eq(applicationsTable.id, application_id));
        const from_stage = existingApp[0]?.current_stage || "UNKNOWN";

        await tx.update(applicationsTable).set({ current_stage: "INTERVIEW" }).where(eq(applicationsTable.id, application_id));

        await tx.insert(auditLogs).values({
            application_id,
            changed_by: req.user.id,
            from_stage,
            to_stage: "INTERVIEW"
        });

        return interview;
    })

    const interviewWithCandidateEmail = await db.query.interviewsTable.findFirst({
        where: eq(interviewsTable.id, interview[0].id),
        with: {
            application: {
                with: {
                    candidate: {
                        columns: { email: true, name: true }
                    },
                    job: {
                        columns: { title: true },
                        with: { company: { columns: { name: true } } }
                    }
                }
            }
        }
    });
    const email = interviewWithCandidateEmail?.application?.candidate?.email;
    const job = interviewWithCandidateEmail?.application?.job;
    const company = job?.company;
    if (!email || !company || !job) {
        return next(new AppError("Interview not found", 404));
    }
    await sendEmail(
        email,
        "Interview Scheduled",
        interviewScheduledEmail(
            req.user.name,
            company.name,
            job.title,
            new Date(interview[0].scheduled_at * 1000).toLocaleString(),
            "https://meet.google.com/xyz123",
            interview[0].interview_type,
            "SCHEDULED"
        ),
        "interviewScheduledEmail"
    );
    await db
      .update(interviewsTable)
      .set({ reminder_sent: true })
      .where(eq(interviewsTable.id, interview[0].id));
    res.status(201).json({
        status: "success",
        data: {
            interview,
        },
    });
})
export const getInterviewsByUserId = getAllById(interviewsTable, "user_id")


// export const updateInterview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const { interviewId } = req.params;
//     const { scheduled_at, interview_type } = req.body;
//     const interview = await db.update(interviewsTable).set({
//         scheduled_at,
//         interview_type,
//     }).where(eq(interviewsTable.id, interviewId)).returning();
//     res.status(200).json({
//         status: "success",
//         data: {
//             interview,
//         },
//     });
// })