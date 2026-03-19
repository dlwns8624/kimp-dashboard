import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/indicators',
        destination: '/market-data',
        permanent: true,
      },
      {
        source: '/global-indicators',
        destination: '/market-data',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
