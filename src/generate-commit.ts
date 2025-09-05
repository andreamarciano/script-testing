import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

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

async function generateCommitMessage() {
  const diff = fs.readFileSync(DIFF_FILE, "utf-8");

  const prompt = `
You are a helpful assistant that generates Git commit messages.

From the following git diff, generate:
1. A short commit title (max 70 chars, Conventional Commits style)
2. A commit description (1-3 sentences) ONLY if necessary. 
   - If the changes are small or fully explained by the title, leave the description empty. 
   - Use the description to explain larger or complex changes.

Output format:
title: <short title>
description: <longer description or leave empty if not needed>

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

  /* Conventional Commit types: 
    feat (new feature), 
    fix (bug fix), 
    docs (documentation changes), 
    style (formatting/code style), 
    refactor (code refactoring without adding features or fixing bugs),
    perf (performance improvements), 
    test (adding/modifying tests), 
    chore (maintenance tasks, dependency updates, build scripts), 
    build (build system changes), 
    ci (CI/CD changes), 
    revert (reverting a previous commit) 
  */

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
  // console.log(output);
  console.log(`\nSaved to: ${OUTPUT_FILE}\n`);

  console.log(gitCommitString);
}

generateCommitMessage().catch(console.error);

// git diff > git-diff.txt
