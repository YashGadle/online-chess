// session.ts
import session from "express-session";

const isProd = process.env.NODE_ENV === "production";

export const sessionParser = session({
  saveUninitialized: false,
  secret: "$eCuRiTy",
  resave: false,
  cookie: {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax", // 'none' required for cross-origin
    secure: isProd, // true in HTTPS, false in dev
  },
});
