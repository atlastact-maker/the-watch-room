// Renders /trailer3 to a video file: drives Chromium, tab-captures one
// full loop (video + the page's Web Audio soundtrack), then converts
// the recording to an H.264/AAC MP4 with ffmpeg-static.
//
//   node scripts/capture-trailer3.mjs [baseUrl]
//
// Needs the dev server running (default baseUrl http://localhost:3000)
// and /trailer3 on the public paths list.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT_DIR = path.resolve("capture-out");
mkdirSync(OUT_DIR, { recursive: true });
const WEBM = path.join(OUT_DIR, "trailer3-raw.webm");
const MP4 = path.join(OUT_DIR, "the-watch-room-tiktok.mp4");

const browser = await chromium.launch({
  headless: false,
  args: [
    "--auto-accept-this-tab-capture",
    "--autoplay-policy=no-user-gesture-required",
    "--hide-scrollbars",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  acceptDownloads: true,
});
const page = await context.newPage();
page.on("console", (m) => {
  if (m.text().startsWith("[capture]")) console.log(m.text());
});

console.log(`opening ${BASE}/trailer3 …`);
await page.goto(`${BASE}/trailer3`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// 1. Enable sound (real click = user gesture; restarts the loop).
await page.getByText("♪ sound off").click();
await page.waitForTimeout(800);

// 2. Start the tab recorder from inside the page (gesture via click on
//    an injected button; --auto-accept-this-tab-capture skips the picker).
await page.evaluate(() => {
  const btn = document.createElement("button");
  btn.id = "__cap_btn";
  btn.textContent = "cap";
  btn.style.cssText =
    "position:fixed;left:0;top:0;width:40px;height:40px;opacity:0.01;z-index:99999";
  btn.onclick = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 }, width: 1080, height: 1920 },
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: "include",
      });
      console.log(
        `[capture] tracks: video=${stream.getVideoTracks().length} audio=${stream.getAudioTracks().length}`,
      );
      const rec = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 8_000_000,
        audioBitsPerSecond: 192_000,
      });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "trailer3-raw.webm";
        document.body.appendChild(a);
        a.click();
        console.log("[capture] recording saved");
      };
      rec.start(500);
      window.__cap_rec = rec;
      window.__cap_started = performance.now();
      console.log("[capture] recorder running");
    } catch (err) {
      console.log(`[capture] FAILED: ${err?.message ?? err}`);
    }
  };
  document.body.appendChild(btn);
});
await page.click("#__cap_btn");
await page.waitForFunction(() => !!window.__cap_rec, null, { timeout: 10_000 });

// 3. Restart the loop so t=0 aligns, then hide the desktop gutter so the
//    frame is clean. Measure the trim offset between recorder start and
//    the replay click.
const trimMs = await page.evaluate(() => performance.now() - window.__cap_started);
await page.getByText("▸ replay").click();
await page.evaluate(() => {
  for (const el of document.querySelectorAll("button")) {
    if (el.textContent?.includes("replay")) {
      el.parentElement.style.display = "none";
    }
  }
  const cap = document.getElementById("__cap_btn");
  if (cap) cap.style.display = "none";
});
console.log(`trim offset ≈ ${(trimMs / 1000).toFixed(2)}s — recording one loop (34s)…`);

// 4. Record one full loop, then stop and collect the download.
const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
await page.waitForTimeout(34_200);
await page.evaluate(() => window.__cap_rec.stop());
const download = await downloadPromise;
await download.saveAs(WEBM);
console.log(`raw capture: ${WEBM}`);
await browser.close();

// 5. Convert to MP4 (H.264 + AAC), trimming the pre-replay junk.
if (!existsSync(WEBM)) {
  console.error("capture file missing");
  process.exit(1);
}
const ss = ((trimMs + 250) / 1000).toFixed(2);
console.log("converting to MP4…");
execFileSync(
  ffmpegPath,
  [
    "-y",
    "-i", WEBM,
    "-ss", ss,
    "-t", "33.8",
    "-fps_mode", "cfr",
    "-r", "30",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "19",
    "-preset", "medium",
    "-c:a", "aac",
    "-b:a", "192k",
    MP4,
  ],
  { stdio: "inherit" },
);
console.log(`done: ${MP4}`);
