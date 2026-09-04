import type { NextConfig } from "next";

// Static export for GitHub Pages. `NEXT_PUBLIC_BASE_PATH` is set by the deploy
// workflow to the project-pages subpath (`/fscandle-web`); it is empty for
// local dev and for a future custom-domain deploy.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  images: { unoptimized: true },
  transpilePackages: ["fscandle"],
};

export default nextConfig;
