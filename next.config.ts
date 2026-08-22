import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to THIS project directory. Without
  // this, Turbopack finds the parent package-lock.json (which lives in
  // the primary git worktree at ../../..) and compiles from there,
  // serving 404s for every route that only exists in this worktree.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
