import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../routes/auth";
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
  jwt.verify(token, jwtSecret, (err, decoded) => {
    // token invalid or expired
    if (err || typeof decoded !== "object" || !decoded || !("id" in decoded)) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    (req as AuthRequest).userId = decoded.id;
    next();
  });
}

export default authMiddleware;
