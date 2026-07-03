import { Request, Response, NextFunction } from "express";
import { eq, SQL } from "drizzle-orm";
import { jobsTable, companiesTable, applicationsTable } from "../config/db";

// All supported table names — add new table names here as the app grows
export type OwnedTableName =
  | "jobsTable"
  | "companiesTable"
  | "applicationsTable"
  | "interviewsTable";

/**
 * isOwner(tableName, action?)
 *
 * Middleware that builds a Drizzle SQL conditions array based on:
 *   - The table being accessed (tableName param)
 *   - The authenticated user's role and attributes (req.user)
 *   - The action being performed (read | write)
 *
 * ZERO database queries. Pure in-memory condition building from req.user.
 *
 * Stores the result in req.ownershipConditions[].
 * The factory handler merges them into the final query:
 *   .where(and(eq(table.id, id), ...req.ownershipConditions))
 *
 * ADMIN role → empty array → no extra WHERE clause → full unrestricted access.
 */
export const isOwner = (
  tableName: OwnedTableName,
  action: "read" | "write" = "read",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // Initialize to empty — empty array = no restriction applied
    req.ownershipConditions = [];

    // ── ADMIN bypass ────────────────────────────────────────────────────────
    // Admins get no extra WHERE clause → they see and mutate everything
    if (user.role === "ADMIN") {
      return next();
    }

    const conditions: SQL[] = [];

    // ── Jobs ────────────────────────────────────────────────────────────────
    if (tableName === "jobsTable") {
      if (user.role === "RECRUITER" && user.company) {
        // READ:  Recruiter sees all jobs within their company
        conditions.push(eq(jobsTable.company, user.company));

        // WRITE: Recruiter can only mutate jobs they personally created
        if (action === "write") {
          conditions.push(eq(jobsTable.createdBy, user.id));
        }
      }
      // CANDIDATE has no direct ownership of jobs — handled via restrictTo at route level
    }

    // ── Companies ───────────────────────────────────────────────────────────
    if (tableName === "companiesTable") {
      if (user.role === "RECRUITER") {
        // Recruiter can only access the company they own
        conditions.push(eq(companiesTable.owner, user.id));
      }
    }

    // ── Applications ────────────────────────────────────────────────────────
    if (tableName === "applicationsTable") {
      if (user.role === "CANDIDATE") {
        // Candidates can only access their own applications
        conditions.push(eq(applicationsTable.candidate, user.id));
      }
      // Recruiter access to applications is handled at the controller level
      // via a JOIN query (applications → jobs → company) — too complex for a simple eq()
    }

    // ── Interviews ──────────────────────────────────────────────────────────
    // Interviews require a JOIN through applications → jobs → company.
    // Add specific conditions here as that feature is built out.

    req.ownershipConditions = conditions;
    return next();
  };
};
