import { sql } from "drizzle-orm";
import { db } from "../config/db";

interface SearchInput {
  q: string;
  page: number;
  limit: number;
}

const normalizePaging = (page?: number, limit?: number) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

export const searchJobs = async ({ q, page, limit }: SearchInput) => {
  const { limit: safeLimit, offset } = normalizePaging(page, limit);

  const rows = await db.execute(sql`
    SELECT
      j.id,
      j.title,
      j.description,
      j.status,
      j.category,
      j.job_type,
      j.job_location,
      GREATEST(
        similarity(lower(j.title), lower(${q})),
        similarity(lower(coalesce(j.description, '')), lower(${q}))
      ) AS rank
    FROM jobs j
    WHERE
      j.deleted_at IS NULL
      AND (
        lower(j.title) % lower(${q})
        OR lower(coalesce(j.description, '')) % lower(${q})
      )
    ORDER BY rank DESC, j.created_at DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `);

  return rows;
};

export const searchCandidates = async ({ q, page, limit }: SearchInput) => {
  const { limit: safeLimit, offset } = normalizePaging(page, limit);

  const rows = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.skills,
      GREATEST(
        similarity(lower(u.name), lower(${q})),
        similarity(lower(u.email), lower(${q})),
        similarity(lower(coalesce(u.skills::text, '')), lower(${q}))
      ) AS rank
    FROM users u
    WHERE
      u.deleted_at IS NULL
      AND u.role = 'CANDIDATE'
      AND (
        lower(u.name) % lower(${q})
        OR lower(u.email) % lower(${q})
        OR lower(coalesce(u.skills::text, '')) % lower(${q})
      )
    ORDER BY rank DESC, u.created_at DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `);

  return rows;
};
