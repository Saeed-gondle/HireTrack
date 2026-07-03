import { db } from "../../config/db";
import { sql } from "drizzle-orm";

/**
 * Conversion Funnel
 * Returns count + percentage of total for each current_stage value
 * within a job (or across the whole company when jobId is omitted).
 */
export async function getConversionFunnel(companyId: string, jobId?: string) {
  const jobFilter = jobId ? sql`AND a.job = ${jobId}::uuid` : sql``;

  const rows = await db.execute(sql`
    SELECT
      a.current_stage                                   AS stage,
      COUNT(*)::int                                     AS count,
      ROUND(
        COUNT(*) * 100.0 / NULLIF(COUNT(*) OVER (), 0),
        2
      )                                                 AS percentage
    FROM applications a
    JOIN jobs j ON j.id = a.job
    WHERE j.company = ${companyId}::uuid
    ${jobFilter}
    GROUP BY a.current_stage
    ORDER BY
      CASE a.current_stage
        WHEN 'APPLIED'    THEN 1
        WHEN 'SCREENING'  THEN 2
        WHEN 'INTERVIEW'  THEN 3
        WHEN 'OFFERED'    THEN 4
        WHEN 'REJECTED'   THEN 5
      END
  `);

  return rows;
}

/**
 * Time-to-Hire
 * For every application that ever reached HIRED (OFFERED here, as per schema),
 * calculates the days between the first APPLIED audit entry and the OFFERED entry,
 * then returns the per-job average.
 */
export async function getTimeToHire(companyId: string, jobId?: string) {
  const jobFilter = jobId ? sql`AND a.job = ${jobId}::uuid` : sql``;

  const rows = await db.execute(sql`
    WITH hired AS (
      SELECT
        a.id           AS application_id,
        a.job,
        MIN(CASE WHEN al.to_stage = 'APPLIED'  THEN al.changed_at END) AS applied_at,
        MIN(CASE WHEN al.to_stage = 'OFFERED'  THEN al.changed_at END) AS offered_at
      FROM applications a
      JOIN jobs        j  ON j.id = a.job
      JOIN audit_logs  al ON al.application_id = a.id
      WHERE j.company = ${companyId}::uuid
        AND a.current_stage = 'OFFERED'
        ${jobFilter}
      GROUP BY a.id, a.job
    )
    SELECT
      h.job                                                         AS job_id,
      j.title                                                       AS job_title,
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (h.offered_at - h.applied_at)) / 86400.0
        )::numeric,
        2
      )                                                             AS avg_days_to_hire
    FROM hired h
    JOIN jobs j ON j.id = h.job
    WHERE h.applied_at IS NOT NULL AND h.offered_at IS NOT NULL
    GROUP BY h.job, j.title
    ORDER BY avg_days_to_hire
  `);

  return rows;
}

/**
 * Average Time Per Stage
 * Uses LEAD() on the audit_logs to find how long (in days) each application
 * spent in each stage before moving to the next one.
 */
export async function getAvgTimePerStage(companyId: string, jobId?: string) {
  const jobFilter = jobId ? sql`AND a.job = ${jobId}::uuid` : sql``;

  const rows = await db.execute(sql`
    WITH stage_durations AS (
      SELECT
        al.application_id,
        al.to_stage                                                 AS stage,
        al.changed_at                                               AS entered_at,
        LEAD(al.changed_at) OVER (
          PARTITION BY al.application_id
          ORDER BY al.changed_at
        )                                                           AS left_at
      FROM audit_logs  al
      JOIN applications a ON a.id = al.application_id
      JOIN jobs         j ON j.id = a.job
      WHERE j.company = ${companyId}::uuid
        ${jobFilter}
    )
    SELECT
      stage,
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (left_at - entered_at)) / 86400.0
        )::numeric,
        2
      )                                                             AS avg_days_in_stage,
      COUNT(*)::int                                                 AS sample_size
    FROM stage_durations
    WHERE left_at IS NOT NULL
    GROUP BY stage
    ORDER BY
      CASE stage
        WHEN 'APPLIED'    THEN 1
        WHEN 'SCREENING'  THEN 2
        WHEN 'INTERVIEW'  THEN 3
        WHEN 'OFFERED'    THEN 4
        WHEN 'REJECTED'   THEN 5
        ELSE 6
      END
  `);

  return rows;
}

/**
 * Applicants Over Time
 * Buckets applications by week (DATE_TRUNC) and counts them.
 * Returns a time-series array ready to feed a chart.
 */
export async function getApplicantsOverTime(companyId: string, jobId?: string) {
  const jobFilter = jobId ? sql`AND a.job = ${jobId}::uuid` : sql``;

  const rows = await db.execute(sql`
    SELECT
      DATE_TRUNC('week', a.created_at)::date   AS week_start,
      COUNT(*)::int                             AS applicant_count
    FROM applications a
    JOIN jobs j ON j.id = a.job
    WHERE j.company = ${companyId}::uuid
      ${jobFilter}
    GROUP BY week_start
    ORDER BY week_start
  `);

  return rows;
}

/**
 * Source Tracking
 * Groups applications by their UTM source value.
 * Requires a `source` column on the applications table — returns empty
 * until the column is populated.
 */
export async function getSourceTracking(companyId: string, jobId?: string) {
  const jobFilter = jobId ? sql`AND a.job = ${jobId}::uuid` : sql``;

  // Guard: if the source column doesn't exist yet, return an empty array.
  const columnCheck = await db.execute(sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'applications'
      AND column_name = 'source'
    LIMIT 1
  `);

  if ((columnCheck as any[]).length === 0) {
    return [];
  }

  const rows = await db.execute(sql`
    SELECT
      COALESCE(a.source, 'direct')             AS source,
      COUNT(*)::int                             AS applicant_count,
      ROUND(
        COUNT(*) * 100.0 / NULLIF(COUNT(*) OVER (), 0),
        2
      )                                         AS percentage
    FROM applications a
    JOIN jobs j ON j.id = a.job
    WHERE j.company = ${companyId}::uuid
      ${jobFilter}
    GROUP BY a.source
    ORDER BY applicant_count DESC
  `);

  return rows;
}

/**
 * Master analytics getter — runs all five queries in parallel.
 */
export async function getAnalyticsData(companyId: string, jobId?: string) {
  const [
    conversionFunnel,
    timeToHire,
    avgTimePerStage,
    applicantsOverTime,
    sourceTracking,
  ] = await Promise.all([
    getConversionFunnel(companyId, jobId),
    getTimeToHire(companyId, jobId),
    getAvgTimePerStage(companyId, jobId),
    getApplicantsOverTime(companyId, jobId),
    getSourceTracking(companyId, jobId),
  ]);

  return {
    conversionFunnel,
    timeToHire,
    avgTimePerStage,
    applicantsOverTime,
    sourceTracking,
  };
}
