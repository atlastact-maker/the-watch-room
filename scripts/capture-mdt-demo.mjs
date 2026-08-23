// One-shot capture of the /demo-mdt loop to an MP4.
//
//   node scripts/capture-mdt-demo.mjs [url] [outDir]
//
// Records one full pass (56 s + lead-in) of the deployed demo page in a
// headless browser at 1080×1920, then transcodes the WebM to H.264 MP4
// with the bundled ffmpeg-static. No dev server involved.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";

const url = process.argv[2] ?? "https://the-watch-room.vercel.app/demo-mdt";
const outDir = resolve(process.argv[3] ?? "capture-out");
const rawDir = resolve(outDir, "raw");
mkdirSync(rawDir, { recursive: true });

const DURATION_MS = 57_500;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: rawDir, size: { width: 1080, height: 1920 } },
});
const page = await context.newPage();
const captureUrl = url + (url.includes("?") ? "&" : "?") + "capture=1";
console.log("loading", captureUrl);
await page.goto(captureUrl, { waitUntil: "networkidle" });
// Reload so the loop starts clean at t=0 with everything warm.
await page.reload({ waitUntil: "domcontentloaded" });
console.log("recording", DURATION_MS / 1000, "s …");
await page.waitForTimeout(DURATION_MS);
await context.close();
await browser.close();

const webm = readdirSync(rawDir).find((f) => f.endsWith(".webm"));
if (!webm) throw new Error("no webm produced");
const webmPath = resolve(rawDir, webm);
const mp4Path = resolve(outDir, "mdt-demo.mp4");
console.log("transcoding →", mp4Path);
execFileSync(ffmpegPath, [
  "-y",
  "-i", webmPath,
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "20",
  "-pix_fmt", "yuv420p",
  "-r", "30",
  "-movflags", "+faststart",
  mp4Path,
], { stdio: "inherit" });
renameSync(mp4Path, resolve(outDir, "mdt-demo.mp4"));
rmSync(rawDir, { recursive: true, force: true });
console.log("done:", resolve(outDir, "mdt-demo.mp4"));
