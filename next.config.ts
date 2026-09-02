import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin's auth module pulls in jwks-rsa -> jose, and jose is
  // ESM-only while jwks-rsa still requires() it — bundling firebase-admin
  // breaks that interop. Externalizing it lets Node's own module resolution
  // handle it at runtime instead of the bundler rewriting it.
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
