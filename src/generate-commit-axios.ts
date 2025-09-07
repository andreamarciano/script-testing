import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import readline from "readline";
import { execSync } from "child_process";

dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error("[ERROR] OPENROUTER_API_KEY is not set in .env");
  process.exit(1);
}

// free models on OpenRouter
const MODEL = "gpt-4o-mini";

const DIFF_FILE = path.resolve(__dirname, "../git-diff/git-diff.txt");
const OUTPUT_FILE = path.resolve(__dirname, "../git-diff/git-commit.txt");

interface OpenRouterResponse {
  choices: { text: string }[];
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

function askYesNo(query: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(query);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onData = (key: string) => {
      const k = key.toLowerCase();
      if (k === "y" || k === "n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write(k + "\n");
        resolve(k === "y");
      }
      if (key === "\u0003") {
        // Ctrl+C
        process.exit();
      }
    };

    process.stdin.on("data", onData);
  });
}

async function generateCommitMessage() {
  try {
    // --- Modalità scelta ---
    const mode = await askQuestion(
      "Choose mode:\n1) Automatic CLI (git add + git diff)\n2) Manual mode (use existing git-diff.txt)\n> "
    );

    if (mode === "1") {
      const userInput = await askQuestion(
        "Add file/s for git diff (path or 'all'): "
      );

      if (userInput.toLowerCase() === "all") {
        console.log("[INFO] Executing: git add .");
        execSync("git add .", { stdio: "inherit" });

        console.log("[INFO] Executing: git diff --staged");
        const diffOutput = execSync("git diff --staged", { encoding: "utf-8" });
        fs.writeFileSync(DIFF_FILE, diffOutput);
      } else {
        const files = userInput.split(" ").join(" ");
        console.log(`[INFO] Executing: git add ${files}`);
        execSync(`git add ${files}`, { stdio: "inherit" });

        console.log("[INFO] Executing: git diff --staged");
        const diffOutput = execSync("git diff --staged", { encoding: "utf-8" });
        fs.writeFileSync(DIFF_FILE, diffOutput);
      }
    } else {
      console.log("[INFO] Using existing git-diff.txt");
    }

    // --- Genera commit message ---
    const diff = fs.readFileSync(DIFF_FILE, "utf-8");
    if (!diff.trim()) {
      console.error("[ERROR] Git diff is empty. Nothing to commit.");
      return;
    }

    const prompt = `
You are a helpful assistant that generates Git commit messages.

From the following git diff, generate:
1. A short commit title (max 70 chars, Conventional Commits style)
2. A commit description (1-3 sentences) ONLY IF ABSOLUTELY NECESSARY.
   - If the commit title already fully explains the change, write "description:" and leave it completely empty.
   - Do not invent or rephrase explanations just to fill the description.
   - Only add a description for complex or multi-file changes.

Output format (strict):
title: <short title>
description: <leave blank if not needed>

Here is the git diff:
${diff}
  `;

    const response = await axios.post<OpenRouterResponse>(
      "https://openrouter.ai/api/v1/completions",
      {
        model: MODEL,
        prompt,
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      console.error("[ERROR] No choices returned from API:", response.data);
      return;
    }

    const output = response.data.choices[0].text;
    const titleMatch = output.match(/title:\s*(.*)/i);
    const descMatch = output.match(/description:\s*([\s\S]*)/i);

    const commitTitle = titleMatch
      ? titleMatch[1].trim()
      : "chore: update commit";
    const commitDescription = descMatch ? descMatch[1].trim() : "";
    const gitCommitString = commitDescription
      ? `git commit -m "${commitTitle}" -m "${commitDescription}"`
      : `git commit -m "${commitTitle}"`;

    fs.writeFileSync(OUTPUT_FILE, gitCommitString);

    console.log("\n--- Generated commit ---\n");
    console.log(output);
    console.log(`\n[INFO] Saved to: ${OUTPUT_FILE}\n`);

    if (mode === "1") {
      const confirm = await askYesNo("Do you want to use this commit? (y/n): ");
      if (confirm) {
        execSync(gitCommitString, { stdio: "inherit" });
        console.log("\n✅ Commit created successfully!");
      } else {
        console.log(
          "\nYou chose not to commit automatically. Here's the command you can use:"
        );
        console.log(`${gitCommitString}\n`);
      }
    } else {
      console.log(
        `\n[INFO] Manual mode complete. Run this to commit:\n${gitCommitString}\n`
      );
    }
  } catch (err) {
    console.error("[ERROR]", err);
  }
}

generateCommitMessage();
