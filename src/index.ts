import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth";
import todoRoutes from "./routes/todo";
import authMiddleware from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET as string;

const publicPath = path.join(__dirname, "../public");

/* Middleware */
app.use("/static", express.static(publicPath));
app.use(express.json());

/* Web */
app.get("/", (req: Request, res: Response) => {
  res.sendFile("index.html", { root: publicPath });
});

/* Routes */
app.use("/auth", authRoutes);
app.use("/todos", authMiddleware, todoRoutes);

/* Start Backend */
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
