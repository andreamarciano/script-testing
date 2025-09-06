import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import readline from "readline";
import { execSync } from "child_process";
import chalk from "chalk";

dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error("Error: OPENROUTER_API_KEY is not set in .env");
  process.exit(1);
}

// free models on OpenRouter
const MODEL = "gpt-4o-mini";
// const MODEL = "claude";
// const MODEL = "mistral-7b";
// const MODEL = "llama-2-7b-chat";
// const MODEL = "wizardcoder";

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

    // raw mode
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
    /* 1. Choose files to add for "git add" & "git diff" */
    const userInput = await askQuestion(
      "Add file/s for git diff (path or 'all'): "
    );

    if (userInput.toLowerCase() === "all") {
      console.log(chalk.blue("Executing: git add ."));
      execSync("git add .", { stdio: "inherit" });

      console.log(chalk.yellow("Executing: git diff --staged"));
      const diffOutput = execSync("git diff --staged", { encoding: "utf-8" });
      fs.writeFileSync(DIFF_FILE, diffOutput);
    } else {
      const files = userInput.split(" ").join(" ");
      console.log(chalk.blue(`Executing: git add ${files}`));
      execSync(`git add ${files}`, { stdio: "inherit" });

      console.log(chalk.yellow("Executing: git diff --staged"));
      const diffOutput = execSync("git diff --staged", { encoding: "utf-8" });
      fs.writeFileSync(DIFF_FILE, diffOutput);
    }

    /* 2. Generate commit message with LLM */
    const diff = fs.readFileSync(DIFF_FILE, "utf-8");
    if (!diff.trim()) {
      console.error(chalk.red("Git diff is empty. Nothing to commit."));
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

    const response = await fetch("https://openrouter.ai/api/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    const data: OpenRouterResponse =
      (await response.json()) as OpenRouterResponse;
    // console.log(JSON.stringify(data, null, 2));
    if (!data.choices || data.choices.length === 0) {
      console.error("No choices returned from API:", data);
      return;
    }

    const output = data.choices[0].text;
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
    console.log(`\n ${chalk.magenta("Saved to:")} ${OUTPUT_FILE}\n`);

    /* 3. Use commit for "git commit" */
    const confirm = await askYesNo("Do you want to use this commit? (y/n): ");
    if (confirm) {
      execSync(gitCommitString, { stdio: "inherit" });
      console.log(chalk.green("\n✅ Commit created successfully!"));
    } else {
      console.log(
        "\nYou chose not to commit automatically. Here's the command you can use:"
      );
      console.log(`${gitCommitString}\n`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

generateCommitMessage();

// git diff > git-diff.txt
// git diff --staged > git-diff/git-diff.txt
