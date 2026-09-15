import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Servidor Node propio (BFF): el Dockerfile corre .next/standalone/server.js.
  output: 'standalone',
  // Resolver warning de múltiples lockfiles: especificar el root del proyecto
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  images: {
    // Solo el logo local: sin optimizador no se expone /_next/image.
    unoptimized: true,
  },
};

export default nextConfig;
