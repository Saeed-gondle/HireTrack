import { Resend } from 'resend';
import { config } from '../config/env';
import { db } from "../config/db";
import { emailLogsTable } from "../db/schema";

const resend = new Resend(config.email.resendApiKey);

export const sendEmail = async (to: string, subject: string, html: string, templateName: string = "UNKNOWN") => {
    const { data, error } = await resend.emails.send({
        from: config.email.from,
        to,
        subject,
        html,
    });

    try {
        await db.insert(emailLogsTable).values({
            to_email: to,
            template: templateName,
            status: error ? "FAILED" : "SENT",
            sent_at: new Date()
        });
    } catch (err) {
        console.error("Failed to log email to DB", err);
    }
};