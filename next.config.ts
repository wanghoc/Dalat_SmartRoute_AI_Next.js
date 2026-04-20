import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "react-router-dom": "./src/lib/router-dom.tsx",
    },
  },
};

export default nextConfig;
