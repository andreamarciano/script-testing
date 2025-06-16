import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getEnv } from "../routes/getEnv";
import { AuthRequest } from "../types/auth";

const jwtSecret = getEnv("JWT_SECRET");

// intercept the network request, read the token and verify it's correct
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  // token provided
  jwt.verify(
    token,
    jwtSecret,
    (
      err: jwt.VerifyErrors | null,
      decoded: string | JwtPayload | undefined
    ) => {
      // token invalid or expired
      if (
        err ||
        typeof decoded !== "object" ||
        !decoded ||
        !("id" in decoded)
      ) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      const userId = Number((decoded as JwtPayload).id);
      if (isNaN(userId)) {
        res.status(401).json({ message: "Invalid token payload" });
        return;
      }

      (req as AuthRequest).userId = userId;
      next();
    }
  );
}

export default authMiddleware;
