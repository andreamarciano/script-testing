/*
Ctrl+Shift+P
Preferences: Configure User Snippets -> Snippets: Configure Snippets
typescriptreact
*/

import fs from "fs";
import path from "path";

const SNIPPETS_DIR = path.join(__dirname, "../.vscode/snippets");

function getVSCodeSnippetsPath() {
  return path.join(
    process.env.APPDATA!,
    "Code",
    "User",
    "snippets",
    "typescriptreact.json"
  );
}

// Read
function loadAllSnippets() {
  const files = fs.readdirSync(SNIPPETS_DIR);
  const allSnippets: Record<string, any> = {};

  for (const file of files) {
    if (file.endsWith(".json")) {
      const content = fs.readFileSync(path.join(SNIPPETS_DIR, file), "utf-8");
      const parsed = JSON.parse(content);

      // Merge the snippets, checking for duplicates
      for (const [key, value] of Object.entries(parsed)) {
        if (allSnippets[key]) {
          console.warn(`Snippet duplicate key detected: ${key}`);
        }
        allSnippets[key] = value;
      }
    }
  }

  return allSnippets;
}

// Write
function syncSnippets() {
  const targetPath = getVSCodeSnippetsPath();
  const snippets = loadAllSnippets();

  fs.writeFileSync(targetPath, JSON.stringify(snippets, null, 2), "utf-8");
  console.log(
    `✅ Synced ${Object.keys(snippets).length} snippets to ${targetPath}`
  );
}

syncSnippets();
