import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/archive",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/archive/:cityId/:imageId",
        destination: "/gallery/:cityId/:imageId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
