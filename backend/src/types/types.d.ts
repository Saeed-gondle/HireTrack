import { SQL } from "drizzle-orm";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "RECRUITER" | "ADMIN" | "CANDIDATE";
  avatar_url?: string | null;
  company?: string | null;
  isVerified?: boolean | null;
}

declare global {
  namespace Express {
    interface Request {
      user: User;
      ownershipConditions: SQL[];
    }
  }
}
export interface Error {
  message: string;
}
declare global {
  interface Error {
    error: {
      message: string;
    };
  }
}
