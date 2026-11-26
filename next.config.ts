import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  redirects: async () => [
    { source: "/roll-call", destination: "/admin/roll-call", permanent: false },
    { source: "/status", destination: "/move", permanent: false },
    { source: "/inventory", destination: "/move", permanent: false },
    { source: "/profile", destination: "/me", permanent: false },
    { source: "/join", destination: "/sign-in", permanent: false },
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
