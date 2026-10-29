import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança.
 *
 * A Vercel já manda o HSTS (só aceitar o site por conexão segura). Estes quatro
 * são os baratos que faltavam, e um site que guarda CPF e matrícula devia ter
 * desde o primeiro dia. Nenhum muda o que a pessoa vê.
 */
const cabecalhosDeSeguranca = [
  // Impede que o site seja aberto dentro de uma moldura em página alheia, truque
  // usado para fazer a pessoa clicar em algo sem perceber onde está clicando.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Obriga o navegador a respeitar o tipo declarado de cada arquivo, em vez de
  // adivinhar — adivinhação é o que transforma um upload inocente em script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Ao sair do site, o outro lado recebe só o domínio, nunca o endereço completo
  // da página: o anúncio que a pessoa estava vendo não vaza junto.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nada de microfone nem de localização. A câmera fica liberada para o próprio
  // site, porque o envio da matrícula pelo celular passa por ela.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // sharp é binário nativo (converte a prévia do anúncio para JPEG); empacotá-lo
  // quebra a instância que o próprio Next usa para gerar os ícones do site.
  serverExternalPackages: ["sharp"],

  async headers() {
    return [{ source: "/:path*", headers: cabecalhosDeSeguranca }];
  },
};

export default nextConfig;
