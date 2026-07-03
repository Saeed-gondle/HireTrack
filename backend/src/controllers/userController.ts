import { NextFunction, Request, Response } from "express";
import multer from "multer";
import catchAsync from "../utils/catchAsync";
import sharp from "sharp";
import AppError from "../utils/appError";
import { db, usersTable } from "../config/db";
import { eq } from "drizzle-orm";
import { getAnalyticsData } from "../db/queries/analytics";

const multerStorage = multer.memoryStorage();
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const uploadUserPhoto = upload.single("photo");

export const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  },
);

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use /updateMyPassword.",
          400,
        ),
      );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, "name", "email");
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) Update user document
    const [updatedUser] = await db
      .update(usersTable)
      .set(filteredBody as any)
      .where(eq(usersTable.id, req.user.id))
      .returning();

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  },
);
export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id; // Overwrite the ID to the current user
  next();
};
export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.params.id))
      .limit(1);
    res.status(200).json({
      status: "success",
      data: {
        user: user[0],
      },
    });
  },
);
export const me = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    res.status(200).json({
      status: "success",
      data: {
        user: user[0],
      },
    });
  },
);

export const getAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Admins can pass companyId as a query param; recruiters use their own company
    const companyId: string =
      req.user.role === "ADMIN" && typeof req.query.companyId === "string"
        ? req.query.companyId
        : req.user.company;

    if (!companyId) {
      return next(
        new AppError("No company associated with this account.", 400),
      );
    }

    const jobId =
      typeof req.query.jobId === "string" ? req.query.jobId : undefined;

    const analytics = await getAnalyticsData(companyId, jobId);

    res.status(200).json({
      status: "success",
      data: analytics,
    });
  },
);
