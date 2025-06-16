# ⚙️ Setup - TypeScript, NodeJS, ExpressJS, PostgreSQL, Prisma, Docker

## 📦 Step 1: Initialize the Project

```bash
npm init -y
```

---

## 📚 Step 2: Install Dependencies

### Runtime dependencies

```bash
npm install express bcryptjs jsonwebtoken dotenv @prisma/client pg
```

- `bcryptjs`: Library used to hash and compare passwords securely.

- `jsonwebtoken`: Library for generating and verifying JSON Web Tokens (JWT), used for user authentication.

- `dotenv`: Loads environment variables from a `.env` file into `process.env`.

- `@prisma/client`: The generated **Prisma** client used to interact with your database.

- `pg`: **PostgreSQL** client for Node.js.

### Development dependencies

```bash
npm install -D prisma typescript ts-node @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/better-sqlite3 nodemon
```

- `prisma`: CLI to manage database schema, migrations, and generate the client.

---

#### 1. Initialize Prisma

```bash
npx prisma init
```

This creates a `prisma/` directory with a `schema.prisma` file.

#### 2. Define Your Models

Edit the `schema.prisma` file to define your data models:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       Int    @id @default(autoincrement())
  user     String @unique
  password String
  todos    Todo[]
}

model Todo {
  id        Int     @id @default(autoincrement())
  task      String
  completed Boolean @default(false)
  userId    Int
  user      User    @relation(fields: [userId], references: [id])
}
```

#### 3. Create a Prisma Client File

In `src/prisma.ts`, add:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
```

---

## ⚙️ Step 3: Configure TypeScript

Generate a TypeScript configuration file:

```bash
npx tsc --init
```

Update `tsconfig.json` with the following:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

---

## 🗂️ Step 4: Project Structure

```text
/MyBackendProject
├── /public
├── /prisma
│   └── schema.prisma    # Prisma Schema
├── /src
│   ├── /middleware
│   │   └── auth.ts
│   ├── /routes
│   │   ├── auth.ts
│   │   └── todo.ts
│   ├── db.ts
│   ├── prismaClient.ts  # Prisma Client
│   └── index.ts         # Main entry point
├── .env
├── package.json
└── tsconfig.json
```

---

## 🧠 Step 5: Create Entry File

**`src/index.ts`**

```ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET as string;

console.log("PORT from .env:", PORT);
console.log("JWT_SECRET from .env:", jwtSecret);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript + Express!");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
```

**`.env`**

```ini
PORT=3000
JWT_SECRET=superSecretTokenKey123
```

---

## 📝 Step 6: Update `package.json` Scripts

```json
"scripts": {
  "dev": "nodemon --watch src --exec ts-node src/index.ts"
}
```

---

## ▶️ Step 7: Run the Project

Use the following command to start the development server:

```bash
npm run dev
```

Expected terminal output:

```bash
[nodemon] starting `ts-node src/index.ts`
Server is running at http://localhost:3000
```

---

## 🔗 Step 8: Link to GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/username/repository
git push -u origin main
```
