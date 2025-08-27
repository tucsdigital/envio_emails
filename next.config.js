/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para manejar mejor los timeouts y errores
  experimental: {
    serverComponentsExternalPackages: ['nodemailer']
  },
  // Configuración de la API
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: false
  },
  // Configuración del servidor
  serverRuntimeConfig: {
    // Timeout para operaciones largas
    maxDuration: 300
  }
}

module.exports = nextConfig
