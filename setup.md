# ⚙️ Setup - TypeScript, NodeJS, ExpressJS, PostgreSQL, Prisma, Docker

## Table of Contents

- [Step 1: Initialize the Project](#step1)
- [Step 2: Install Dependencies](#step2)
- [Step 3: Update `package.json` Scripts](#step3)
- [Step 4: Setup Prisma](#step4)
- [Step 5: Create `.env` File](#step5)
- [Step 6: Configure TypeScript](#step6)
- [Step 7: Setup Docker](#step7)
- [Step 8: Build and Initialize Database](#step8)
- [Step 9: Start the Application](#step9)
- [Step 10: Access PostgreSQL CLI (optional)](#step10)
- [Step 11: Development Workflow](#step11)
- [Step 12: Link to GitHub](#step12)
- [Project Structure](#structure)

## 📦 Step 1: Initialize the Project {#step1}

```bash
npm init -y
```

---

## 📚 Step 2: Install Dependencies {#step2}

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
npm install -D prisma typescript ts-node @types/node @types/express @types/bcryptjs @types/jsonwebtoken nodemon
```

- `prisma`: CLI to manage database schema, migrations, and generate the client.

---

## 📝 Step 3: Update `package.json` Scripts {#step3}

```json
"scripts": {
  "dev": "nodemon --watch src --exec ts-node src/index.ts"
}
```

---

## ⚙️ Step 4: Setup Prisma {#step4}

### 1. Initialize Prisma

```bash
npx prisma init
```

This creates a `prisma/` directory with a `schema.prisma` file.

### 2. Define Your Models in `schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       Int    @id @default(autoincrement())
  username String @unique
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

### 3. Generate the Prisma Client

```bash
npx prisma generate
```

This generates the TypeScript client you can import and use in your app.

### 4. Create a Prisma Client File `src/prismaClient.ts`

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
```

---

## 🧾 Step 5: Create `.env` File {#step5}

Even though Docker injects environment variables, it's still good practice to create a `.env` file in your root directory. This is especially useful if you ever run Prisma commands outside Docker.

**`.env`**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todoapp
JWT_SECRET=superSecretTokenKey123
PORT=3000
```

> ⚠️ Prisma CLI (outside Docker) reads from `.env` when generating the client or running migrations. This file is ignored by Docker Compose (which uses the inline `environment:` config), but it's important for local use and consistency.

---

## ⚙️ Step 6: Configure TypeScript {#step6}

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

## 🐳 Step 7: Setup Docker {#step7}

### 1. Dockerfile

Create a `Dockerfile` in your project root with the following contents:

```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm install 

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### 2. `docker-compose.yaml`

Create a `docker-compose.yaml` file in your project root with the following contents:

```yaml
services:
  app:
    build: .
    container_name: todo-app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/todoapp
      - JWT_SECRET=superSecretTokenKey123
      - NODE_ENV=development
      - PORT=3000
    ports:
      - "3000:3000"
    depends_on:
      - db
    volumes:
      - .:/app

  db:
    image: postgres:13-alpine
    container_name: postgres-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: todoapp
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

---

## Step 8: Build and Initialize Database {#step8}

Open a terminal in your project directory, then run:

```bash
docker compose build
```

Run the database migration to create the tables according to your Prisma schema:

```bash
docker compose run app npx prisma migrate dev --name init
```

This command runs the migration **inside the Docker container**, connecting to the PostgreSQL database defined in your docker-compose.

---

## ▶️ Step 9: Start the Application {#step9}

Start your app and database containers with:

```bash
docker compose up
```

You should see output confirming that PostgreSQL and your Node.js app started successfully.

---

## 🖥️ Step 10: Access PostgreSQL CLI (optional) {#step10}

Open a second terminal and connect to your PostgreSQL database running inside Docker:

```bash
docker exec -it postgres-db psql -U postgres -d todoapp
```

Now you can run SQL commands, for example:

```sql
\dt
SELECT * FROM "Todo";
\q  -- quit
```

### 🗄️ Useful PostgreSQL CLI Commands

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `\dt`           | List all tables                     |
| `\d table_name` | Show table schema                   |
| `\l`            | List all databases                  |
| `\c dbname`     | Connect to a different database     |
| `\du`           | List all roles/users                |
| `\conninfo`     | Show current connection information |
| `\q`            | Quit the PostgreSQL CLI             |

---

## 🔄 Step 11: Development Workflow {#step11}

- To **start the server and database**, run:

```bash
docker compose up
```

- To **stop everything**, run:

```bash
docker compose down 
```

### ⚠️ Ctrl+C vs `docker compose down`

  When working with Docker, it's important to understand the difference between **stopping** and **shutting down** containers:

- **Ctrl + C** in the terminal where `docker compose up` is running:

  - This sends a termination signal and **stops** the containers.
  - The containers are still present and can be restarted quickly with `docker compose up`.

- **`docker compose down`**:

  - This **stops and removes** the containers, **networks**, and other resources.
  - It's useful when you want a clean shutdown or to reset the environment.

### Recommendation

- Use **Ctrl + C** during development when you're actively coding and just need to stop the server temporarily.
- Use **`docker compose down`** when you're done working or want to start from a clean state.

---

## 🔗 Step 12: Link to GitHub {#step12}

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/username/repository
git push -u origin main
```

---

## 🗂️ Project Structure {#structure}

```text
/MyBackendProject
├── /node_modules
│   └── @prisma/client   # generate
├── /public
├── /prisma
│   └── schema.prisma    # Prisma Schema
├── /src
│   ├── /middleware
│   │   └── auth.ts
│   ├── /routes
│   │   ├── auth.ts
│   │   └── todo.ts
│   ├── prismaClient.ts  # Prisma Client
│   └── index.ts         # Main entry point
├── Dockerfile
├── docker-compose.yaml
├── package.json
└── tsconfig.json
```
