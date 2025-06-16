import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";

const router = Router();

dotenv.config();
export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
const jwtSecret = getEnv("JWT_SECRET");

export type User = {
  id: number;
  username: string;
  password: string;
};

// Register a new user endpoint
router.post("/register", (req: Request, res: Response) => {
  const { username, password } = req.body;

  // encrypt password
  const hashedPassword = bcrypt.hashSync(password, 8);

  // save the new user and hashed password to the db
  try {
    const insertUser = db.prepare(
      `INSERT INTO users (username, password) VALUES (?, ?)`
    );
    const result = insertUser.run(username, hashedPassword);

    // create the first todo
    const defaultTodo = "Hello! Add your first todo!";
    const insertTodo = db.prepare(
      `INSERT INTO todos (user_id, task) VALUES (?, ?)`
    );
    insertTodo.run(result.lastInsertRowid, defaultTodo);

    // create a token (authenticate user, like api key)
    const token = jwt.sign({ id: result.lastInsertRowid }, jwtSecret, {
      expiresIn: "24h",
    });
    res.json({ token });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Registration error:", err.message);
    } else {
      console.error("Unknown error during registration");
    }

    res.sendStatus(503); // server error
  }
});

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const getUser = db.prepare(`
        SELECT * FROM users WHERE username = ?
    `);
    const user = getUser.get(username) as User | undefined;

    // User not found
    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    // Password does not match
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      res.status(401).send({ message: "Invalid password" });
      return;
    }

    // Successful authentication
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "24h" });
    res.json({ token });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Login error:", err.message);
    } else {
      console.error("Unkown error during login");
    }

    res.sendStatus(503);
  }
});

export default router;
