import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'export',
  // Resolver warning de múltiples lockfiles: especificar el root del proyecto
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true, // Required for static export unless using external loader
  },
};

export default nextConfig;
