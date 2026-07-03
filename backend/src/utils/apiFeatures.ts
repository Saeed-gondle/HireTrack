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
    this.query = query;
    this.queryString = queryString as QueryOptions;
  }

  filter() {
    console.log("filtering data from search queries");
    const queryObj: QueryOptions = { ...this.queryString };
    const excludeFields = ["page", "sort", "limit", "fields"];

    // Remove unneeded fields from query
    excludeFields.forEach((el) => delete queryObj[el]);
    console.log("QueryObj", queryObj);
    const conditions: SQL[] = [];

    // Parse standard fields and nested Mongoose-like operators: { price: { gte: 100 } }
    for (const key of Object.keys(queryObj)) {
      const value = queryObj[key];
      console.log(key, value);
      if (typeof value == "object") {
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
          else {
            // Direct match
            conditions.push(sql`${sql.identifier(key)} = ${val}`);
          }
          return this;
        }
      } else {
        conditions.push(sql`${sql.identifier(key)} = ${value}`);
      }
    }
    if (conditions.length > 0) {
      this.query = this.query.where(and(...conditions));
    }
    return this
  }

  sort() {
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

  paginate() {
    const page = parseInt(this.queryString.page || "1", 10);
    const limit = parseInt(this.queryString.limit || "100", 10);
    const skip = (page - 1) * limit;
    this.query = this.query.limit(limit).offset(skip);
    return this;
  }
}

export default ApiFeatures;
