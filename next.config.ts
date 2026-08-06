import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` añade un bloque de instrucciones al final de CLAUDE.md en cada
  // arranque. Aquí CLAUDE.md es el contrato de trabajo con el cliente, no un
  // archivo generado, así que se desactiva. La advertencia que trae ese bloque
  // (Next 16 rompe cosas respecto a versiones anteriores) está recogida a mano
  // en la sección 10 de CLAUDE.md.
  agentRules: false,
};

export default nextConfig;
