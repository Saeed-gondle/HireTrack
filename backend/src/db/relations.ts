import { relations } from "drizzle-orm";
import {
  applicationsTable,
  companiesTable,
  interviewsTable,
  jobsTable,
  usersTable,
} from "./schema";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  applications: many(applicationsTable),
}));

export const companyRelations = relations(companiesTable, ({ one, many }) => ({
  jobs: many(jobsTable),
  owner: one(usersTable, {
    fields: [companiesTable.owner],
    references: [usersTable.id],
  }),
}));

export const jobRelations = relations(jobsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [jobsTable.company],
    references: [companiesTable.id],
  }),
  applications: many(applicationsTable),
}));

export const applicationsRelations = relations(
  applicationsTable,
  ({ one }) => ({
    candidate: one(usersTable, {
      fields: [applicationsTable.candidate],
      references: [usersTable.id],
    }),
    interview: one(interviewsTable),
    job: one(jobsTable, {
      fields: [applicationsTable.job],
      references: [jobsTable.id],
    }),
    // job:one(jobsTable,{fields:[applicationsTable.job],references:[]})
  }),
);

export const interviewsRelations = relations(interviewsTable, ({ one }) => ({
  application: one(applicationsTable, {
    fields: [interviewsTable.application],
    references: [applicationsTable.id],
  }),
}));
