import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* A self-contained server in .next/standalone, used by the Docker image
     (deploy/). Vercel ignores it. */
  output: "standalone",
  /* The Postgres driver loads optional native bindings at runtime; keep it
     out of the bundle. */
  serverExternalPackages: ["pg"],
};

export default nextConfig;
