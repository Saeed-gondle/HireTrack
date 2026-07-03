import { NextFunction, Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { userSignupSchema } from "../schemas/userSchema";
import AppError from "../utils/appError";
import { config } from "../config/env";
import { db, usersTable } from "../config/db";
import { comparePassword, hashPassword } from "../utils/authOperations";
import catchAsync from "../utils/catchAsync";
import { NewUser, User } from "../config/db";
import { eq } from "drizzle-orm";
import { loginSchema } from "../schemas/loginSchema";
import { sendEmail } from "../services/sendEmail";
import { resetPasswordEmail } from "../emails/resetPasswordEmail";
import { signupOtpEmail } from "../emails/signupOtp";
import client from "../redis/redisClient";
import { randomBytes } from "node:crypto";
import { magicLinkEmail } from "../emails/magicLink";
interface JWTPayload {
  id: string;
  email: string;
  role: string;
}
type SafeUser = Omit<User, "password">;
const generateOtpAndSendEmail = async (user: User) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  await db
    .update(usersTable)
    .set({
      verification: {
        code: Number(otp),
        expiry: expiry.toISOString(),
      },
    })
    .where(eq(usersTable.email, user.email));
  const html = signupOtpEmail(user.name, "Verify Your Email", otp, 10);
  await sendEmail(user.email, "Verify Your Email", html, "signupOtpEmail");
};

const signToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

const createSendToken = (
  user: User, // Full user from database
  statusCode: number,
  req: Request,
  res: Response,
): void => {
  // 1. Create JWT payload
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  const token = signToken(payload);

  // 2. Cookie options
  const expiresInDays = Number(config.jwt.expiresIn) || 90;
  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN_DAYS ?? 7);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  // 3. Send cookie
  res.cookie("jwt", token, cookieOptions);

  // 4. Remove password from output (create a shallow copy to avoid mutation)
  const { password, ...userWithoutPassword } = user;

  // 5. Send response
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: userWithoutPassword,
    },
  });
};
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check of it's there

    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies?.jwt;
    }
    if (!token) {
      return next(
        new AppError(
          "You are not logged in! Please log in to get access.",
          401,
        ),
      );
    }

    // 2) Verification token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    // 3) Check if user still exists
    const currentUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.id))
      .limit(1);
    if (currentUser.length === 0) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401,
        ),
      );
    }
    if (!currentUser[0].isVerified) {
      return next(
        new AppError(
          "You are not verified. Please verify your email to login",
          401,
        ),
      );
    }
    // 4) Check if user changed password after the token was issued
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return next(
    //     new AppError('User recently changed password! Please log in again.', 401)
    //   );
    // }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser[0];
    const { password, ...userWithoutPassword } = currentUser[0];
    await client.set(
      `user:${userWithoutPassword.id}`,
      JSON.stringify(userWithoutPassword),
      {
        EX: 60 * 60 * 24,
      },
    );
    res.locals.user = userWithoutPassword;
    next();
  },
);
export const isLoggedIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.cookies.jwt) {
      try {
        token = req.cookies.jwt;
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        // 3) Check if user still exists
        const currentUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, decoded.id))
          .limit(1);
        if (currentUser.length === 0) {
          return next();
        }

        // 4) Check if user changed password after the token was issued
        // if (currentUser.changedPasswordAfter(decoded.iat)) {
        //   return next();
        // }

        // GRANT ACCESS TO PROTECTED ROUTE
        res.locals.user = currentUser[0];
        return next();
      } catch (err) {
        return next();
      }
    }
    next();
  },
);
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError(
          "You are not logged in! Please log in to get access.",
          401,
        ),
      );
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403),
      );
    }
    next();
  };
};
export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Validate input
    const result = userSignupSchema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError("Invalid input data", 400));
    }

    // 2. Check existing user
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, result.data.email))
      .limit(1);
    if (existing.length > 0) {
      return next(new AppError("Email already in use", 400));
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(result.data.password);
    // 4. Prepare insert data (type-safe)
    const { name, email, password, role, avatar_url } = result.data;
    const newUserData: NewUser = {
      name,
      email,
      password: hashedPassword,
      role,
      avatar_url,
      isVerified: false,
    };
    const [newUser] = await db
      .insert(usersTable)
      .values({ ...newUserData })
      .returning();
    if (!newUser) return next(new AppError("Failed to create user", 500));
    generateOtpAndSendEmail(newUser);
    // 6. Send token response
    createSendToken(newUser, 201, req, res);
  },
);
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
   
    if (req.user) {
      return next(new AppError("User Already Logged In", 200));
    }
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError("Invalid input data", 400));
    }
    const { email, password } = result.data;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (user.length === 0) {
      return next(new AppError("No User Found", 401));
    }
    const validPassword = await comparePassword(password, user[0].password);
    if (!validPassword) {
      return next(new AppError("Invalid email or password", 401));
    }
    createSendToken(user[0], 200, req, res);
  },
);
export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("jwt", "", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    });
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  },
);
export const forgotPassword = catchAsync(
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await db
      .update(usersTable)
      .set({
        passwordReset: {
          code: Number(otp),
          expiry: expiry.toISOString(),
        },
      })
      .where(eq(usersTable.email, email));
    const html = resetPasswordEmail(user[0].name, otp, 10);
    await sendEmail(email, "Forgot Password", html, "resetPasswordEmail");
    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });
  },
);
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, password } = req.body;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (user.length === 0) {
      return next(new AppError("User not found", 404));
    }
    if (!user[0].passwordReset) {
      return next(new AppError("Invalid OTP", 400));
    }
    if (user[0].passwordReset?.code !== Number(otp)) {
      return next(new AppError("Invalid OTP", 400));
    }
    if (user[0].passwordReset?.expiry < new Date().toISOString()) {
      return next(new AppError("OTP expired", 400));
    }
    const hashedPassword = await hashPassword(password);
    await db
      .update(usersTable)
      .set({
        password: hashedPassword,
        passwordReset: null,
      })
      .where(eq(usersTable.email, email));
    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  },
);
export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    if (user.length === 0) {
      return next(new AppError("User not found", 404));
    }
    const hashedPassword = await hashPassword(password);
    await db
      .update(usersTable)
      .set({
        password: hashedPassword,
      })
      .where(eq(usersTable.id, req.user.id));
    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  },
);
export const verifyAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (user.length === 0) {
      return next(new AppError("User not found", 404));
    }
    if (!user[0].verification) {
      return next(new AppError("Invalid OTP", 400));
    }
    if (user[0].verification?.code !== Number(otp)) {
      return next(new AppError("Invalid OTP", 400));
    }
    if (user[0].verification?.expiry < new Date().toISOString()) {
      return next(new AppError("OTP expired", 400));
    }
    await db
      .update(usersTable)
      .set({
        verification: null,
        isVerified: true,
      })
      .where(eq(usersTable.email, email));
    res.status(200).json({
      status: "success",
      message: "Account verified successfully",
    });
  },
);
export const newVerification = catchAsync(
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
    await generateOtpAndSendEmail(user[0]);
    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });
  },
);
export const generateMagicLink = catchAsync(
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
    const expiry = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes in seconds
    await db
      .update(usersTable)
      .set({
        autoLoginToken: token,
        autoLoginTokenExpiry: expiry,
      })
      .where(eq(usersTable.email, email));
    const link = `${config.cors.webAppUrl}/link-login?token=${token}`;
    console.log(link);
    const html = magicLinkEmail(user[0].name, "Magic Link", link);
    await sendEmail(email, "Magic Link", html, "magicLinkEmail");
    res.status(200).json({
      status: "success",
      message: "Magic link sent successfully",
    });
  },
);
export const magicLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.params.token as unknown as string;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.autoLoginToken, token))
      .limit(1);
    if (user.length === 0) {
      return next(new AppError("Invalid token", 400));
    }
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (
      user[0].autoLoginTokenExpiry !== null &&
      user[0].autoLoginTokenExpiry < currentTimestamp
    ) {
      return next(new AppError("Token expired", 400));
    }
    await db
      .update(usersTable)
      .set({
        autoLoginToken: null,
        autoLoginTokenExpiry: null,
      })
      .where(eq(usersTable.autoLoginToken, token));
    createSendToken(user[0], 200, req, res);
  },
);
// const signToken = (payload: JWTPayload): string => {
//   const options: SignOptions = {
//     expiresIn: config.jwt.expiresIn as SignOptions["expiresIn"],
//   };
//   return jwt.sign(payload, config.jwt.secret, options);
// };
