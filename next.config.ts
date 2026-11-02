import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Soft-launch: English-only storefront + admin.
  // Images come from R2 — add remotePatterns when a public CDN hostname is chosen.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

// Enables Wrangler bindings during `next dev` when using OpenNext Cloudflare.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
