import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp é binário nativo (converte a prévia do anúncio para JPEG); empacotá-lo
  // quebra a instância que o próprio Next usa para gerar os ícones do site.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
