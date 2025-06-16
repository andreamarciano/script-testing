import { Request } from "express";

export interface AuthRequest extends Request {
  userId: number;
}

export type User = {
  id: number;
  username: string;
  password: string;
};
