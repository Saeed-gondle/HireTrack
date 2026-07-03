import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import {
  companiesTable,
  companyMembersTable,
  invitations,
  usersTable,
} from "../db/schema";
import { db } from "../config/db";
import AppError from "../utils/appError";
import { eq } from "drizzle-orm";
import { newInvitaionSchema } from "../schemas/joiningInvitation";
import { randomBytes } from "node:crypto";
import { joiningInvitationEmail } from "../emails/joiningInvitaion";
import { sendEmail } from "../services/sendEmail";
export const createInviitation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (user.length === 0) {
      return next(new AppError("User not found", 404));
    }
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in seconds
    const result = newInvitaionSchema.safeParse(req.body);
    if (!result.success) {
      return next(
        new AppError(`Invalid invitation data: ${result.error.message}`, 400),
      );
    }
    if (!req.user?.company) {
      return next(
        new AppError("You must belong to a company to invite members", 400),
      );
    }
    const newData = {
      invitedBy: req.user.id,
      company: req.user.company, // Key name updated to companyId
      token,
      expiresAt: expiry,
      ...result.data, // TypeScript now knows result.data is fully defined
    };
    const newInvitationData = await db.transaction(async (tx) => {
      const newInvitaion = await tx
        .insert(invitations)
        .values(newData)
        .returning();
      const company = await tx
        .select()
        .from(companiesTable)
        .where(eq(companiesTable.id, req.user.company as string));
      return {
        invitation: newInvitaion[0],
        company: company[0],
      };
    });
    const options = {
      company: newInvitationData.company.name, // Key name updated to companyId
      name: req.user.name,
      inviteLink: `http://localhost:5000/invitations/${token}`,
      expiresAt: expiry,
    };
    const emailHtml = joiningInvitationEmail(
      newInvitationData.company.name,
      req.user.name,
      `http://localhost:5000/invitations/${token}`,
      `${expiry}`,
    );
    await sendEmail(
      newInvitationData.invitation.email,
      "Invitation",
      emailHtml,
      "magicLinkEmail",
    );
    // companyName, // e.g., "Google DeepMind"
    // req.user.name, // e.g., "John Doe"
    // inviteLink, // e.g., "http://localhost:3000/invite/accept?token=..."
    // expiryString, // (Optional) e.g., "July 7, 2026"
    res.status(200).json({
      status: "success",
      data: {
        invitaion: newInvitationData.invitation,
      },
    });
  },
);
export const joinInvitation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.params.token as unknown as string;
    const InvitationExist = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);
    if (InvitationExist.length === 0) {
      return next(
        new AppError(
          "Invalid invitation request whether it is expired or does not exist",
          404,
        ),
      );
    }
    if (InvitationExist[0].expiresAt < new Date()) {
      return next(new AppError("Invitation has expired", 400));
    }
    const newMemer = {
      company: InvitationExist[0].company,
      user: req.user.id,
      role: req.user.role,
    };
    await db.transaction(async (tx) => {
      await tx.insert(companyMembersTable).values(newMemer).returning();
      await tx
        .update(usersTable)
        .set({ company: InvitationExist[0].company })
        .where(eq(usersTable.id, req.user.id));
      await tx
        .update(invitations)
        .set({ acceptedAt: new Date() })
        .where(eq(invitations.token, token));
    });

    res.status(200).json({
      status: "company joined successfully!",
    });
  },
);
