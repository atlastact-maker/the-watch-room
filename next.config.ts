import type { NextConfig } from "next";
import path from "node:path";

// Build stamp for the ops-centre footer: date of the build plus the
// short commit (Vercel exposes the SHA at build time; "dev" locally).
const buildStamp =
  new Date().toISOString().slice(0, 10).replace(/-/g, ".") +
  " · " +
  (process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_STAMP: buildStamp,
  },
  // Pin Turbopack's workspace root to THIS project directory. Without
  // this, Turbopack finds the parent package-lock.json (which lives in
  // the primary git worktree at ../../..) and compiles from there,
  // serving 404s for every route that only exists in this worktree.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
