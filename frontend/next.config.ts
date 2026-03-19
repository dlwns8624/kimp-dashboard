import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/indicators',
        destination: '/global-indicators',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
