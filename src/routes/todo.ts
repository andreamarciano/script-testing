import { Router, Request, Response } from "express";
import { AuthRequest } from "../types/auth";
import prisma from "../prismaClient";

const router = Router();

// Get all todos for logged-in user
router.get("/", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;

  const todos = await prisma.todo.findMany({
    where: {
      userId: userId,
    },
  });
  res.json(todos);
});

// Create a new todo
router.post("/", async (req: Request, res: Response) => {
  const { task } = req.body;
  const { userId } = req as AuthRequest;
  const todo = await prisma.todo.create({
    data: {
      task,
      userId: userId,
    },
  });

  res.json(todo);
});

// Update a todo
router.put("/:id", async (req: Request, res: Response) => {
  const { completed } = req.body;
  const { id } = req.params;
  const { userId } = req as AuthRequest;

  const updatedTodo = await prisma.todo.update({
    where: {
      id: parseInt(id),
      userId: userId,
    },
    data: {
      completed: !!completed, // convert number (0, 1) to boolean
    },
  });

  res.json(updatedTodo);
});

// Delete a todo
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req as AuthRequest;

  await prisma.todo.delete({
    where: {
      id: parseInt(id),
      userId,
    },
  });

  res.send({ message: "Todo deleted" });
});

export default router;
