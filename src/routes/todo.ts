import { Router, Request, Response } from "express";
import db from "../db";
import { AuthRequest } from "../types/auth";
import type { RunResult } from "better-sqlite3";

const router = Router();

// Get all todos for logged-in user
router.get("/", (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;

  const getTodos = db.prepare(`
        SELECT * FROM todos WHERE user_id = ?
  `);
  const todos = getTodos.all(userId);
  res.json(todos);
});

// Create a new todo
router.post("/", (req: Request, res: Response) => {
  const { task } = req.body;
  const { userId } = req as AuthRequest;
  const insertTodo = db.prepare(
    `INSERT INTO todos (user_id, task) VALUES (?, ?)`
  );
  const result: RunResult = insertTodo.run(userId, task);

  res.json({ id: result.lastInsertRowid, task, completed: 0 });
});

// Update a todo
router.put("/:id", (req: Request, res: Response) => {
  const { completed } = req.body;
  const { id } = req.params;
  // const { page } = req.query;

  // const updatedTodo = db.prepare(`
  //   UPDATE todos SET task = ?, completed = ?
  //   `);
  const updatedTodo = db.prepare(`
    UPDATE todos SET completed = ? WHERE id = ?
  `);
  updatedTodo.run(completed, id);

  res.json({ message: "Todo completed" });
});

// Delete a todo
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req as AuthRequest;
  const deleteTodo = db.prepare(`
    DELETE FROM todos WHERE id = ? AND user_id = ?
  `);
  deleteTodo.run(id, userId);

  res.send({ message: "Todo deleted" });
});

export default router;
