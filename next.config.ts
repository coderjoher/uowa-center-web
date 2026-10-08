import type { NextConfig } from "next";

/* Photos uploaded in the CMS are served from the Strapi server; next/image
   only optimises remote images from hosts listed here. */
const mediaOrigin = process.env.STRAPI_PUBLIC_URL ?? process.env.STRAPI_URL;
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
let cmsOnThisMachine = false;
if (mediaOrigin) {
  const u = new URL(mediaOrigin);
  cmsOnThisMachine = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  remotePatterns.push({
    protocol: u.protocol.replace(":", "") as "http" | "https",
    hostname: u.hostname,
    port: u.port,
    pathname: "/uploads/**",
  });
}

const nextConfig: NextConfig = {
  /* Next refuses to optimise images from private addresses. Allow it only
     when the CMS runs on this machine (local development); remotePatterns
     still limits it to the CMS's /uploads/ path. */
  images: { remotePatterns, dangerouslyAllowLocalIP: cmsOnThisMachine },
  /* Editors used to sign in at /admin on the site itself; send them to the
     CMS admin panel instead. */
  async redirects() {
    return mediaOrigin ? [{ source: "/admin", destination: `${mediaOrigin.replace(/\/+$/, "")}/admin`, permanent: false }] : [];
  },
};

export default nextConfig;
