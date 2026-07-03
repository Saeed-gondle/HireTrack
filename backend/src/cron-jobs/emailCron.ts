import cron from "node-cron";
import { db } from "../config/db";
import { usersTable, applicationsTable, interviewsTable, companiesTable, jobsTable } from "../db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { sendEmail } from "../services/sendEmail";
import { interviewReminderEmail } from "../emails/interviewReminder";
import { candidateDigestEmail } from "../emails/candidateDigest";
import { recruiterDigestEmail } from "../emails/recruiterDigest";

export const initCronJobs = () => {
    // 1. Interview Reminder (Runs every hour)
    cron.schedule("0 * * * *", async () => {
        console.log("Running Interview Reminder Cron...");
        try {
            const nowSec = Math.floor(Date.now() / 1000);
            const tomorrowSec = nowSec + 24 * 60 * 60;
            const tomorrowPlusOneHourSec = tomorrowSec + 60 * 60;

            const upcomingInterviews = await db.query.interviewsTable.findMany({
                where: and(
                    gte(interviewsTable.scheduled_at, tomorrowSec),
                    lt(interviewsTable.scheduled_at, tomorrowPlusOneHourSec),
                    eq(interviewsTable.reminder_sent, false)
                ),
                with: {
                    application: {
                        with: {
                            candidate: true,
                            job: {
                                with: { company: true }
                            }
                        }
                    }
                }
            });

            for (const interview of upcomingInterviews) {
                const candidate = interview.application?.candidate;
                const job = interview.application?.job;
                const company = job?.company;
                
                if (candidate && job && company) {
                    const dateStr = new Date(interview.scheduled_at * 1000).toLocaleString();
                    await sendEmail(
                        candidate.email, 
                        "Interview Reminder! ⏰", 
                        interviewReminderEmail(candidate.name, company.name, job.title, dateStr, interview.interview_type),
                        "interviewReminderEmail"
                    );
                    
                    await db.update(interviewsTable)
                        .set({ reminder_sent: true })
                        .where(eq(interviewsTable.id, interview.id));
                }
            }
        } catch (err) {
            console.error("Error in reminder cron", err);
        }
    });

    // 2. Candidate Weekly Digest (Runs every Sunday at 9 AM)
    cron.schedule("0 9 * * 0", async () => {
        console.log("Running Candidate Weekly Digest Cron...");
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const candidates = await db.query.usersTable.findMany({ where: eq(usersTable.role, "CANDIDATE") });

            for (const candidate of candidates) {
                const apps = await db.query.applicationsTable.findMany({
                    where: eq(applicationsTable.candidate, candidate.id),
                    with: { job: { with: { company: true } }, interview: true }
                });

                let newAppCount = 0;
                let upcomingIntCount = 0;
                let htmlList = "";

                for (const app of apps) {
                    const jobTitle = app.job?.title;
                    const companyName = app.job?.company?.name;

                    if (app.created_at >= oneWeekAgo) {
                        newAppCount++;
                        htmlList += `<li>Applied to <strong>${jobTitle}</strong> at ${companyName}</li>`;
                    } else if (app.current_stage !== 'APPLIED') {
                        // Notify about status changes even for older applications
                        htmlList += `<li>Status update: <strong>${jobTitle}</strong> is now at <strong>${app.current_stage}</strong> stage.</li>`;
                    }

                    if (app.interview && app.interview.scheduled_at >= Math.floor(Date.now() / 1000)) {
                        upcomingIntCount++;
                    }
                }

                if (newAppCount > 0 || upcomingIntCount > 0 || htmlList.length > 0) {
                    await sendEmail(
                        candidate.email, 
                        "Your Weekly Candidate Digest 📊", 
                        candidateDigestEmail(candidate.name, apps.length, upcomingIntCount, htmlList), 
                        "candidateDigestEmail"
                    );
                }
            }
        } catch (err) {
            console.error("Error in candidate digest cron", err);
        }
    });

    // 3. Recruiter Weekly Digest (Runs every Monday at 9 AM)
    cron.schedule("0 9 * * 1", async () => {
        console.log("Running Recruiter Weekly Digest Cron...");
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const recruiters = await db.query.usersTable.findMany({ where: eq(usersTable.role, "RECRUITER") });

            for (const recruiter of recruiters) {
                const companies = await db.query.companiesTable.findMany({ where: eq(companiesTable.owner, recruiter.id) });
                
                for (const company of companies) {
                    const jobs = await db.query.jobsTable.findMany({ where: eq(jobsTable.company, company.id) });
                    
                    let newAppCount = 0;
                    let intCount = 0;
                    let htmlList = "";

                    for (const job of jobs) {
                        const apps = await db.query.applicationsTable.findMany({
                            where: eq(applicationsTable.job, job.id),
                            with: { interview: true }
                        });

                        let jobNewApps = 0;
                        for (const app of apps) {
                            if (app.created_at >= oneWeekAgo) {
                                newAppCount++;
                                jobNewApps++;
                            }
                            if (app.interview && app.interview.scheduled_at >= Math.floor(Date.now() / 1000)) {
                                intCount++;
                            }
                        }
                        if (jobNewApps > 0) {
                            htmlList += `<li><strong>${job.title}</strong>: Received ${jobNewApps} new candidate(s) this week!</li>`;
                        }
                    }

                    if (newAppCount > 0 || intCount > 0 || htmlList.length > 0) {
                        await sendEmail(
                            recruiter.email, 
                            "Your Weekly Hiring Digest 📈", 
                            recruiterDigestEmail(recruiter.name, newAppCount, intCount, htmlList), 
                            "recruiterDigestEmail"
                        );
                    }
                }
            }
        } catch (err) {
            console.error("Error in recruiter digest cron", err);
        }
    });
};
