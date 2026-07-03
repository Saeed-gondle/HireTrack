import { db } from "../config/db";
import { SQL } from "drizzle-orm";
import catchAsync from "./catchAsync";
import { Request, Response, NextFunction } from "express";
export const getAll = (table: SQL) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const result = await db.select().from(table);
        res.status(200).json({
            status: "success",
            data: {
                data: result,
            },
        });
    })
}

export const getOne = (table: SQL, id) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const result = await db.select().from(table).where(eq(table.id, id));
        res.status(200).json({
            status: "success",
            data: {
                data: result,
            },
        });
    })
}