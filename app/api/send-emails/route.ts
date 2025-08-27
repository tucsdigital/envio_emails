import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Tipos TypeScript para mejor tipado
interface EmailResult {
  email: string;
  success: boolean;
  error?: string;
}

// Configuración del transportador de email
const createTransporter = () => {
  console.log('🔧 Creando transportador SMTP con configuración:');
  console.log('  - Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('  - Port:', process.env.SMTP_PORT || '587');
  console.log('  - User:', process.env.GMAIL_USER ? `${process.env.GMAIL_USER.substring(0, 3)}***@gmail.com` : 'UNDEFINED');
  console.log('  - Pass:', process.env.GMAIL_PASSWORD ? '***CONFIGURADO***' : 'UNDEFINED');
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
    // Configuraciones adicionales para mejor estabilidad
    connectionTimeout: 60000, // 60 segundos
    greetingTimeout: 30000,   // 30 segundos
    socketTimeout: 60000,     // 60 segundos
  });
};

// Función para leer el archivo de destinatarios
const leerDestinatarios = (): string[] => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'destinatarios.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const destinatarios = JSON.parse(fileContent);
    
    // Validar que sea un array de strings
    if (!Array.isArray(destinatarios)) {
      throw new Error('El archivo debe contener un array de emails');
    }
    
    // Validar que cada elemento sea un email válido
    const emailsValidos = destinatarios.filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof email === 'string' && emailRegex.test(email);
    });
    
    if (emailsValidos.length !== destinatarios.length) {
      console.warn(`⚠️ Se encontraron ${destinatarios.length - emailsValidos.length} emails inválidos`);
    }
    
    return emailsValidos;
  } catch (error) {
    console.error('Error al leer el archivo de destinatarios:', error);
    throw new Error('No se pudo leer o parsear el archivo de destinatarios');
  }
};

// Función para crear el contenido HTML del email
const crearContenidoHTML = (template: any): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject || 'Documento Importante'}</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 0;
                background-color: #f8fafc;
            }
            .email-container {
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                margin: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            .header h2 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.025em;
            }
            .content {
                padding: 40px 20px;
                background-color: #ffffff;
            }
            .greeting {
                font-size: 20px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 24px;
            }
            .message {
                color: #374151;
                margin-bottom: 20px;
                white-space: pre-line;
            }
            .signature {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                color: #374151;
                white-space: pre-line;
            }
            .footer {
                background-color: #f9fafb;
                padding: 24px 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="content">
                <div class="greeting">${template.greeting || 'Hola,'}</div>
                
                <div class="message">${template.body || 'Esperamos que este mensaje te encuentre bien.'}</div>
                
                <div class="signature">
                    ${template.signature || 'Saludos cordiales.'}
                </div>
            </div>
            
            <div class="footer">
                <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                    © 2025 ${template.companyName || 'Maderas Caballero'}. Todos los derechos reservados.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Función para enviar un email individual
const enviarEmail = async (
  transporter: nodemailer.Transporter,
  email: string,
  pdfPath: string,
  template?: any
): Promise<EmailResult> => {
  try {
    // Crear el contenido HTML personalizado
    const htmlContent = crearContenidoHTML(template || {
      greeting: 'Hola,',
      body: 'Esperamos que este mensaje te encuentre bien.\n\nTe adjuntamos un documento PDF importante que requiere tu atención inmediata.',
      signature: 'Saludosz',
      companyName: 'Maderas Caballero'
    });
    
    // Configurar las opciones del email
    const mailOptions = {
      from: `"Maderas Caballero" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: template?.subject || `Soluciones Integrales en Madera para sus Proyectos`,
      html: htmlContent,
      attachments: [
        {
          filename: 'presentacion_maderas_caballero.pdf',
          path: pdfPath,
          contentType: 'application/pdf',
        },
      ],
      // Configuraciones adicionales para mejor entrega
      priority: 'high' as const,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado exitosamente a: ${email}`);
    
    return {
      email,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌ Error al enviar email a ${email}:`, errorMessage);
    
    return {
      email,
      success: false,
      error: errorMessage,
    };
  }
};

// Función principal para enviar emails a todos los destinatarios
const enviarEmailsMasivos = async (template?: any): Promise<EmailResult[]> => {
  const resultados: EmailResult[] = [];
  
  try {
    console.log('🚀 Iniciando proceso de envío masivo...');
    
    // Leer la lista de destinatarios
    const destinatarios = leerDestinatarios();
    console.log(`📋 Total de destinatarios válidos: ${destinatarios.length}`);
    
    if (destinatarios.length === 0) {
      throw new Error('No hay destinatarios válidos para enviar emails');
    }
    
    // Verificar que existe el archivo PDF
    const pdfPath = path.join(process.cwd(), 'documento.pdf');
    console.log('📎 Verificando archivo PDF en:', pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error('El archivo documento.pdf no existe en la raíz del proyecto');
    }
    
    // Verificar el tamaño del PDF
    const stats = fs.statSync(pdfPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`📎 Archivo PDF encontrado: ${fileSizeInMB.toFixed(2)} MB`);
    
    if (fileSizeInMB > 10) {
      console.warn(`⚠️ El archivo PDF es grande (${fileSizeInMB.toFixed(2)} MB). Esto puede causar problemas de envío.`);
      console.warn(`⚠️ Gmail tiene límites de tamaño para adjuntos. Considera comprimir el PDF.`);
    }
    
    // Crear el transportador de email
    console.log('🔧 Creando transportador SMTP...');
    const transporter = createTransporter();
    
    // Verificar la conexión
    console.log('🔗 Verificando conexión SMTP...');
    try {
      await transporter.verify();
      console.log('🔗 Conexión SMTP verificada correctamente');
    } catch (verifyError) {
      console.error('❌ Error al verificar conexión SMTP:', verifyError);
      throw new Error(`Error de conexión SMTP: ${verifyError instanceof Error ? verifyError.message : 'Error desconocido'}`);
    }
    
    // Enviar emails a cada destinatario
    for (let i = 0; i < destinatarios.length; i++) {
      const email = destinatarios[i];
      const progreso = Math.round(((i + 1) / destinatarios.length) * 100);
      
      console.log(`📤 [${progreso}%] Enviando email ${i + 1}/${destinatarios.length} a: ${email}`);
      
      try {
        const resultado = await enviarEmail(transporter, email, pdfPath, template);
        resultados.push(resultado);
        
        if (resultado.success) {
          console.log(`✅ Email enviado exitosamente a: ${email}`);
        } else {
          console.error(`❌ Error enviando email a ${email}:`, resultado.error);
        }
      } catch (emailError) {
        console.error(`💥 Error crítico enviando email a ${email}:`, emailError);
        resultados.push({
          email,
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Error desconocido'
        });
      }
      
      // Pausa entre envíos para evitar límites de rate y spam
      if (i < destinatarios.length - 1) {
        const delay = Math.random() * 1000 + 1000; // Entre 1-2 segundos
        console.log(`⏳ Esperando ${Math.round(delay)}ms antes del siguiente envío...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Cerrar la conexión
    transporter.close();
    console.log('🔒 Conexión SMTP cerrada');
    
    return resultados;
  } catch (error) {
    console.error('💥 Error general en el proceso de envío:', error);
    throw error;
  }
};

// Handler POST para la API route
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando proceso de envío de emails masivos...');
    console.log('🔍 Variables de entorno:');
    console.log('  - GMAIL_USER:', process.env.GMAIL_USER ? 'CONFIGURADO' : 'NO CONFIGURADO');
    console.log('  - GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO');
    console.log('  - SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
    console.log('  - SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
    
    // Obtener el template del body de la request
    let template = null;
    try {
      const body = await request.json();
      template = body.template;
      console.log('📝 Template recibido:', template ? 'SÍ' : 'NO (usando valores por defecto)');
    } catch (error) {
      console.log('⚠️ No se pudo parsear el body de la request, usando valores por defecto');
    }
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
      console.error('❌ Credenciales no configuradas:');
      console.error('  - GMAIL_USER:', process.env.GMAIL_USER ? 'CONFIGURADO' : 'NO CONFIGURADO');
      console.error('  - GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO');
      
      return NextResponse.json(
        { 
          error: 'Credenciales de Gmail no configuradas. Verifica tu archivo .env.local',
          details: 'GMAIL_USER y GMAIL_PASSWORD son requeridos'
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Credenciales verificadas, procediendo con el envío...');
    
    // Ejecutar el envío masivo con el template
    const resultados = await enviarEmailsMasivos(template);
    
    // Calcular estadísticas
    const exitosos = resultados.filter(r => r.success).length;
    const fallidos = resultados.filter(r => !r.success).length;
    
    console.log(`📊 Resumen final: ${exitosos} exitosos, ${fallidos} fallidos de ${resultados.length} total`);
    
    // Retornar respuesta exitosa con estadísticas
    return NextResponse.json({
      success: true,
      message: 'Proceso de envío completado exitosamente',
      timestamp: new Date().toISOString(),
      estadisticas: {
        total: resultados.length,
        exitosos,
        fallidos,
        porcentajeExito: Math.round((exitosos / resultados.length) * 100)
      },
      resultados,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('💥 Error en la API route:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handler GET para verificar el estado de la API
export async function GET() {
  try {
    // Verificar que existe el archivo de destinatarios
    const destinatarios = leerDestinatarios();
    
    // Verificar que existe el archivo PDF
    const pdfPath = path.join(process.cwd(), 'documento.pdf');
    const pdfExiste = fs.existsSync(pdfPath);
    
    // Información adicional del PDF si existe
    let pdfInfo = null;
    if (pdfExiste) {
      const stats = fs.statSync(pdfPath);
      pdfInfo = {
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        lastModified: stats.mtime
      };
    }
    
    // Verificar variables de entorno
    const credencialesConfiguradas = !!(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD);
    
    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      destinatarios: {
        total: destinatarios.length,
        lista: destinatarios,
        validos: destinatarios.length
      },
      archivos: {
        pdfExiste,
        pdfPath: pdfExiste ? 'documento.pdf' : 'No encontrado',
        pdfInfo
      },
      configuracion: {
        credencialesConfiguradas,
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: process.env.SMTP_PORT || '587',
        gmailUser: process.env.GMAIL_USER ? `${process.env.GMAIL_USER.substring(0, 3)}***@gmail.com` : 'No configurado'
      },
      sistema: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al verificar estado:', errorMessage);
    
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Error al verificar el estado de la API',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
