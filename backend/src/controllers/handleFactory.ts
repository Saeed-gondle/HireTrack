import { Request, Response, NextFunction } from "express";
import { applicationsTable, db, jobsTable } from "../config/db";
import { AnyColumn, eq, SQL, and } from "drizzle-orm";
import client from "../redis/redisClient";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import z from "zod";
import ApiFeatures from "../utils/apiFeatures";

// const applyFeaturesOnArray = (data: any[], query: any) => {
//   let filteredData = [...data];

//   // 1) Filtering
//   const queryObj = { ...query };
//   const excludedFields = ["page", "sort", "limit", "fields"];
//   excludedFields.forEach((el) => delete queryObj[el]);

//   for (const key in queryObj) {
//     if (typeof queryObj[key] === "object") {
//       for (const op in queryObj[key]) {
//         if (op === "gte")
//           filteredData = filteredData.filter(
//             (item: any) => item[key] >= Number(queryObj[key][op]),
//           );
//         if (op === "gt")
//           filteredData = filteredData.filter(
//             (item: any) => item[key] > Number(queryObj[key][op]),
//           );
//         if (op === "lte")
//           filteredData = filteredData.filter(
//             (item: any) => item[key] <= Number(queryObj[key][op]),
//           );
//         if (op === "lt")
//           filteredData = filteredData.filter(
//             (item: any) => item[key] < Number(queryObj[key][op]),
//           );
//       }
//     } else {
//       filteredData = filteredData.filter(
//         (item: any) => String(item[key]) === String(queryObj[key]),
//       );
//     }
//   }

//   // 2) Sorting
//   if (query.sort) {
//     const sortBy = query.sort.split(",").map((s: string) => s.trim());
//     filteredData.sort((a, b) => {
//       for (const field of sortBy) {
//         const isDesc = field.startsWith("-");
//         const key = isDesc ? field.slice(1) : field;
//         if (a[key] > b[key]) return isDesc ? -1 : 1;
//         if (a[key] < b[key]) return isDesc ? 1 : -1;
//       }
//       return 0;
//     });
//   }

//   // 3) Field Limiting
//   if (query.fields) {
//     const fields = query.fields.split(",").map((f: string) => f.trim());
//     filteredData = filteredData.map((item: any) => {
//       const newItem: any = {};
//       fields.forEach((f: string) => {
//         if (item.hasOwnProperty(f)) newItem[f] = item[f];
//       });
//       return newItem;
//     });
//   }

//   // 4) Pagination
//   const page = Number(query.page) || 1;
//   const limit = Number(query.limit) || 100;
//   const skip = (page - 1) * limit;
//   filteredData = filteredData.slice(skip, skip + limit);

//   return filteredData;
// };

export const getOne = (table: any, columnId: string, tableName?: string) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[columnId] as string;
    if (tableName) {
      const cacheKey = `all_${tableName.split("T")[0]}`;
      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        const rawData = JSON.parse(cachedData);
        const result = rawData.find((item: any) => item.id === id);
        if (result) {
          return res.status(200).json({
            status: "success",
            data: {
              data: [result],
            },
          });
        }
      }
    }
    const result = await db.select().from(table).where(eq(table.id, id));
    res.status(200).json({
      status: "success",
      data: {
        data: result,
      },
    });
  });
};
export const getAllById = (table: any, id: string, column: string) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const ColumnId = req.params[id];
    const result = await db
      .select()
      .from(table)
      .where(eq(table[column], ColumnId));
    res.status(200).json({
      status: "success",
      data: {
        data: result,
      },
    });
  });
};
export const getAll = (table: any, tableName: string) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let cacheKey = `all_${tableName.split("T")[0]}`;

    if (req.user.role === "ADMIN") {
      cacheKey += ":admin";
    } else if (tableName === "jobsTable" && req.user.company) {
      cacheKey += `:company:${req.user.company}`;
    } else if (tableName === "applicationsTable" && req.user.id) {
      cacheKey += `:candidate:${req.user.id}`;
    }
    const conditions: SQL[] = [];
    const cachedData = await client.get(cacheKey);

    if (tableName === "jobsTable") {
      conditions.push(eq(jobsTable.company, req.user.company as string));
    }
    if (tableName === "applicationsTable") {
      conditions.push(eq(applicationsTable.candidate, req.user.id as string));
    }
    const hasQueryParams = Object.keys(req.query).length > 0;
    if (!hasQueryParams) {
      console.log("Trying Cache Data without any search query");
      if (cachedData) {
        const data = JSON.parse(cachedData);
        console.log("Data is cached ");
        return res.status(200).json({
          status: "success",
          results: data.length,
          data: { data },
        });
      }
      console.log("Data is not fetched and fetching now !!!");
      let query = db.select().from(table).$dynamic();

      if (conditions.length) {
        query =
          req.user.role === "ADMIN" ? query : query.where(and(...conditions));
      }
      const rawData = await query;
      console.log(cachedData, rawData);
      await client.set(cacheKey, JSON.stringify(rawData), { EX: 60 * 60 });

      return res.status(200).json({
        status: "success",
        results: rawData.length,
        data: { data: rawData },
      });
    }
    console.log("There are search queries so fetching dynamic data!");
    let result: any = new ApiFeatures(db.select().from(table), req.query)
      .filter()
      .sort()
      .paginate();
    result = await result.query;
    res.status(200).json({
      status: "success",
      results: result.length,
      data: {
        data: result,
      },
    });
  });
};
export const updateOne = (
  table: any,
  ColumnId: string,
  updateSchema: z.ZodTypeAny,
) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[ColumnId];
    const parsedUpdate = updateSchema.safeParse(req.body);
    if (!parsedUpdate.success) {
      return next(new AppError("Invalid update data", 400));
    }
    if (table === "jobsTable") {
      const isOwner = await db.select().from(table).where(eq(table.id, id));
      console.log(isOwner[0].user_id, req.user.id);
      if (isOwner[0].user_id !== req.user.id) {
        return next(
          new AppError("You are not authorized to update this data", 403),
        );
      }
    }
    const tableName = `${table}`.split("T")[0];
    const result = await db
      .update(table)
      .set(parsedUpdate.data as Record<string, any>)
      .where(eq(table.id, id))
      .returning();
    await client.del(`all_${tableName}`);
    res.status(200).json({
      status: "success",
      data: {
        data: result,
      },
    });
  });
};
export const deleteOne = (table: any, ColumnId: string) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[ColumnId];
    const tableName = `${table}`.split("T")[0];
    const result = await db.delete(table).where(eq(table.id, id)).returning();
    await client.del(`all_${tableName}`);
    res.status(200).json({
      status: "success",
      data: {
        data: result,
      },
    });
  });
};
