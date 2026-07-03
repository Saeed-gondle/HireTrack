import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { Request, Response, NextFunction } from "express";
import { companySchema } from "../schemas/companySchema";
import {
  companiesTable,
  companyMembersTable,
  db,
  usersTable,
} from "../config/db";
import { eq } from "drizzle-orm";

export const createCompany = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const isPreviousCompamy = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.owner, req.user.id));
    if (isPreviousCompamy.length > 0) {
      return next(new AppError("You already have a company", 400));
    }
    const result = companySchema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError("The Company creation schema is invalid", 400));
    }
    const updatingTables = await db.transaction(async (tx) => {
      const company = await tx
        .insert(companiesTable)
        .values({
          owner: req.user.id,
          name: result.data.name,
          description: result.data.description,
          slug: result.data.slug,
          logo_url: result.data.logo_url,
        })
        .returning();

      const user = await tx
        .update(usersTable)
        .set({
          company: company[0].id,
        })
        .where(eq(usersTable.id, req.user.id))
        .returning();
      await tx
        .insert(companyMembersTable)
        .values({ company: company[0].id, user: user[0].id });
      return {
        company: company[0],
        user: user[0],
      };
    });

    res.status(201).json({
      status: "success",
      data: {
        company: updatingTables.company,
        user: updatingTables.user,
      },
    });
  },
);
