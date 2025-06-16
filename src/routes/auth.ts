import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getEnv } from "./getEnv";
import prisma from "../prismaClient";

const router = Router();

const jwtSecret = getEnv("JWT_SECRET");

// Register a new user endpoint
router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8); // encrypt password

  // save the new user and hashed password to the db
  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // create the first todo
    const defaultTodo = "Hello! Add your first todo!";
    await prisma.todo.create({
      data: {
        task: defaultTodo,
        userId: newUser.id,
      },
    });

    // create token
    const token = jwt.sign({ id: newUser.id }, jwtSecret, {
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

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

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
