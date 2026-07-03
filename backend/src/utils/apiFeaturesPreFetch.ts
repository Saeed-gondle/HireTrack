import { Request } from "express";
import { sql, SQL, and } from "drizzle-orm";

interface QueryOptions {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  [key: string]: any;
}

class ApiFeatures {
  query: any;
  queryString: QueryOptions;
  queryObject: any;

  constructor(query: any, queryString: Request["query"]) {
    // We assume query is a Drizzle dynamic Select query builder instance
    if (typeof query === "object") this.queryObject = query;
    this.query = query;
    this.queryString = queryString as QueryOptions;
  }

  filter() {
    const queryObj: QueryOptions = { ...this.queryString };
    const excludeFields = ["page", "sort", "limit", "fields"];

    // Remove unneeded fields from query
    excludeFields.forEach((el) => delete queryObj[el]);

    const conditions: SQL[] = [];

    // Parse standard fields and nested Mongoose-like operators: { price: { gte: 100 } }
    for (const key of Object.keys(queryObj)) {
      const value = queryObj[key];

      if (this.queryObject.length) {
        for (const op of Object.keys(value)) {
          const val = value[op];
          if (op === "gt")
            this.queryObject = this.queryObject.filter(
              (data: any) => data[key] > val,
            );
          else if (op === "gte")
            this.queryObject = this.queryObject.filter(
              (data: any) => data[key] >= val,
            );
          else if (op === "lt")
            this.queryObject = this.queryObject.filter(
              (data: any) => data[key] < val,
            );
          else if (op === "lte")
            this.queryObject = this.queryObject.filter(
              (data: any) => data[key] <= val,
            );
        }
        return this;
      }

      // If we have an object like { gt: '10', lte: '20' }
      if (typeof value === "object" && value !== null) {
        for (const op of Object.keys(value)) {
          const val = value[op];
          if (op === "gt")
            conditions.push(sql`${sql.identifier(key)} > ${val}`);
          else if (op === "gte")
            conditions.push(sql`${sql.identifier(key)} >= ${val}`);
          else if (op === "lt")
            conditions.push(sql`${sql.identifier(key)} < ${val}`);
          else if (op === "lte")
            conditions.push(sql`${sql.identifier(key)} <= ${val}`);
        }
      } else {
        // Direct match
        conditions.push(sql`${sql.identifier(key)} = ${value}`);
      }
    }

    if (conditions.length > 0) {
      this.query = this.query.where(and(...conditions));
    }

    return this;
  }

  sort() {
    if (this.queryObject.length) {
      const sortBy =
        this.queryString.sort?.split(",").map((s) => s.trim()) || [];
      sortBy.forEach((field) => {
        if (field.startsWith("-")) {
          this.queryObject = this.queryObject.sort((a: any, b: any) =>
            b[field.substring(1)].localeCompare(a[field.substring(1)]),
          );
        } else {
          this.queryObject = this.queryObject.sort((a: any, b: any) =>
            a[field].localeCompare(b[field]),
          );
        }
      });
      return this;
    }
    if (this.queryString.sort) {
      const sortByStrings = this.queryString.sort.split(",");
      const orderBys: SQL[] = [];

      sortByStrings.forEach((field) => {
        if (field.startsWith("-")) {
          // descending sort
          orderBys.push(sql`${sql.identifier(field.substring(1))} desc`);
        } else {
          // ascending sort
          orderBys.push(sql`${sql.identifier(field)} asc`);
        }
      });

      if (orderBys.length > 0) {
        this.query = this.query.orderBy(...orderBys);
      }
    } else {
      // Default fallback
      this.query = this.query.orderBy(sql`created_at desc`);
    }
    return this;
  }

  limitFields() {
    // In Drizzle, dynamic selection of fields must happen in `db.select({...})`
    // Trying to strip them dynamically out of a `.select()` builder logic is tricky.
    // For now, this operates as a no-op to not break chaining.
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page || "1", 10);
    const limit = parseInt(this.queryString.limit || "100", 10);
    const skip = (page - 1) * limit;
    if (this.queryObject.length) {
      this.queryObject = this.queryObject.slice(skip, skip + limit);
      return this;
    }

    this.query = this.query.limit(limit).offset(skip);
    return this;
  }
}

export default ApiFeatures;
