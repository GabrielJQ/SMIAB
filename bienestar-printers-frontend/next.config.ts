import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRÍTICO: Le dice a Next.js que debe vivir y servir sus archivos dentro de /smiab
  basePath: '/smiab',

  /* config options here */
  // Si esta propiedad es usada para tus Server Actions o CORS interno, 
  // es vital agregar la IP real del servidor para que no bloquee las peticiones.
  allowedDevOrigins: [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://127.0.0.1:3001',
    'http://10.101.21.24',   // Agregada IP del servidor
    'http://10.102.21.24'    // Agregada IP de SAI por si acaso
  ],

};

export default nextConfig;
