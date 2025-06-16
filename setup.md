# ⚙️ Setup - TypeScript + Express + SQLite

## 📦 Step 1: Initialize the Project

```bash
npm init -y
```

---

## 📚 Step 2: Install Dependencies

### Runtime dependencies

```bash
npm install express bcryptjs jsonwebtoken dotenv better-sqlite3
```

- `bcryptjs`: Library used to hash and compare passwords securely.

- `jsonwebtoken`: Library for generating and verifying JSON Web Tokens (JWT), used for user authentication.

- `dotenv`: Loads environment variables from a `.env` file into `process.env`.

- `better-sqlite3`: Fast and simple SQLite3 database client with synchronous API.

### Development dependencies

```bash
npm install -D typescript ts-node @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/better-sqlite3 nodemon
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
├── /src
│   ├── /middleware
│   │   └── auth.ts
│   ├── /routes
│   │   ├── auth.ts
│   │   └── todo.ts
│   ├── db.ts
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
