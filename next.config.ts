import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.3.250.160"],
  // `fscandle` is a local `file:` dependency during development (a symlink into
  // ../fscandle). Turbopack needs the workspace root pinned here so it
  // follows the link, and the package compiled through the app's own pipeline.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  transpilePackages: ["fscandle"],
};

export default nextConfig;
