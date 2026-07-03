import catchAsync from "../utils/catchAsync";
import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { auditLogs, emailLogsTable } from "../db/schema";

export const getAllAuditLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const logs = await db.select().from(auditLogs);
    res.status(200).json({
        status: "success",
        data: {
            logs,
        },
    });
});

export const getAllEmailLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const logs = await db.select().from(emailLogsTable);
    res.status(200).json({
        status: "success",
        data: {
            logs,
        },
    });
});
