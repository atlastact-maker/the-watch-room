// Builds every newsletter in this folder into newsletters/*.html:
//   npm run newsletter                  all issues
//   npm run newsletter -- 2026-10-16    the issues whose name contains it
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] ?? "";
const issues = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f.includes(filter));
if (issues.length === 0) {
  console.error(`no newsletter matches "${filter}"`);
  process.exit(1);
}
for (const file of issues) {
  const entry = path.join(dir, file);
  const bundle = path.join("node_modules", ".cache", `newsletter-${file.replace(/\.ts$/, "")}.cjs`);
  execSync(`npx esbuild "${entry}" --bundle --platform=node --format=cjs --alias:@=./src --outfile="${bundle}" --log-level=error`, { stdio: "inherit" });
  execSync(`node "${bundle}"`, { stdio: "inherit" });
}
