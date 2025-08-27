# 📧 Enviador de Emails Masivos con Next.js y Nodemailer

Este proyecto implementa una API completa en Next.js para enviar emails masivos con PDF adjunto usando Nodemailer. Cada email se personaliza con el nombre del destinatario y se envía desde una cuenta de Gmail.

## 🚀 Características

- ✅ **API Route completa** en Next.js 14 con App Router
- ✅ **Envío masivo** de emails a múltiples destinatarios
- ✅ **Personalización** de cada email con el nombre del destinatario
- ✅ **Adjunto de PDF** automático
- ✅ **Manejo de errores** robusto con logging detallado
- ✅ **Variables de entorno** para credenciales seguras
- ✅ **Interfaz web** para probar y monitorear la API
- ✅ **TypeScript** completo con tipado estricto
- ✅ **Tailwind CSS** para estilos modernos

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de Gmail con autenticación de 2 factores habilitada
- Contraseña de aplicación de Gmail

## 🛠️ Instalación

1. **Clona o descarga el proyecto**
   ```bash
   git clone <tu-repositorio>
   cd email-sender-nextjs
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   GMAIL_USER=tu_email@gmail.com
   GMAIL_PASSWORD=tu_contraseña_de_aplicacion
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

4. **Coloca tu archivo PDF**
   
   Asegúrate de que `documento.pdf` esté en la raíz del proyecto.

5. **Personaliza la lista de destinatarios**
   
   Edita `data/destinatarios.json` con tu lista de contactos:
   ```json
   [
     {
       "nombre": "Juan Pérez",
       "email": "juan.perez@ejemplo.com"
     }
   ]
   ```

## 🔐 Configuración de Gmail

### Habilitar Autenticación de 2 Factores
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Selecciona "Seguridad"
3. Habilita "Verificación en 2 pasos"

### Generar Contraseña de Aplicación
1. Ve a "Seguridad" → "Verificación en 2 pasos"
2. Selecciona "Contraseñas de aplicación"
3. Genera una nueva contraseña para "Correo"
4. Usa esta contraseña en tu archivo `.env.local`

## 🚀 Uso

### Desarrollo Local
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Interfaz Web
- **Verificar Estado**: Comprueba la configuración y archivos
- **Enviar Emails**: Ejecuta el envío masivo de emails

### API Endpoints

#### GET `/api/send-emails`
Verifica el estado de la API y la configuración.

#### POST `/api/send-emails`
Ejecuta el envío masivo de emails.

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Proceso de envío completado",
  "estadisticas": {
    "total": 5,
    "exitosos": 5,
    "fallidos": 0
  },
  "resultados": [...]
}
```

## 📁 Estructura del Proyecto

```
email-sender-nextjs/
├── app/
│   ├── api/
│   │   └── send-emails/
│   │       └── route.ts          # API route principal
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página principal
├── data/
│   └── destinatarios.json        # Lista de destinatarios
├── .env.example                  # Ejemplo de variables de entorno
├── next.config.js                # Configuración de Next.js
├── package.json                  # Dependencias del proyecto
├── tailwind.config.js            # Configuración de Tailwind
└── tsconfig.json                 # Configuración de TypeScript
```

## 🔧 Personalización

### Modificar el Template del Email
Edita la función `crearContenidoHTML()` en `app/api/send-emails/route.ts`:

```typescript
const crearContenidoHTML = (nombre: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Hola ${nombre}</h1>
        <p>Tu contenido personalizado aquí...</p>
      </body>
    </html>
  `;
};
```

### Cambiar el Asunto del Email
Modifica la línea en la función `enviarEmail()`:

```typescript
subject: `Tu asunto personalizado para ${destinatario.nombre}`,
```

### Ajustar el Delay entre Envíos
Modifica el valor en la función `enviarEmailsMasivos()`:

```typescript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
```

## 🚨 Solución de Problemas

### Error: "Credenciales de Gmail no configuradas"
- Verifica que tu archivo `.env.local` existe y tiene las variables correctas
- Asegúrate de que el servidor se reinició después de crear el archivo

### Error: "El archivo documento.pdf no existe"
- Coloca tu archivo PDF en la raíz del proyecto
- Verifica que el nombre sea exactamente `documento.pdf`

### Error de Autenticación SMTP
- Verifica que la autenticación de 2 factores esté habilitada
- Usa la contraseña de aplicación, no tu contraseña normal
- Asegúrate de que `GMAIL_USER` sea tu email completo

### Límites de Gmail
- Gmail tiene límites de envío: 500 emails por día para cuentas normales
- Para envíos masivos, considera usar servicios como SendGrid o Mailgun

## 📊 Monitoreo y Logs

La API genera logs detallados en la consola:
- ✅ Emails enviados exitosamente
- ❌ Errores de envío
- 📊 Estadísticas del proceso
- 🔗 Estado de la conexión SMTP

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard
3. Despliega automáticamente

### Otras Plataformas
- **Netlify**: Soporta Next.js con configuración adicional
- **Railway**: Ideal para aplicaciones Node.js
- **Heroku**: Requiere configuración de buildpacks

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la sección de solución de problemas
2. Verifica los logs de la consola
3. Abre un issue en el repositorio

---

**¡Disfruta enviando emails masivos con tu nueva API! 🎉**
