"use client";

import { useState, useRef, useEffect } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
}

interface EmailResult {
  email: string;
  success: boolean;
  error?: string;
}

interface EmailTemplate {
  subject: string;
  greeting: string;
  body: string;
  signature: string;
  companyName: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "template" | "logs" | "settings"
  >("dashboard");
  const [showPreview, setShowPreview] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Estado del template del email
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: "Soluciones Integrales en Madera para sus Proyectos",
    greeting: "Hola,",
    body: "Esperamos que este mensaje te encuentre bien.\n\nTe adjuntamos un documento PDF importante que requiere tu atención inmediata.\n\nPor favor, revisa el contenido del documento y no dudes en contactarnos si tienes alguna pregunta o necesitas aclaraciones adicionales.\n\nEste documento contiene información relevante para tu trabajo y requiere tu revisión lo antes posible.",
    signature: "Saludos,",
    companyName: "Maderas Caballero",
  });

  const addLog = (type: LogEntry["type"], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const clearLogs = () => {
    setLogs([]);
    setProgress(0);
    setCurrentEmail("");
  };

  const enviarEmails = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    clearLogs();

    addLog("info", "🚀 Iniciando proceso de envío de emails...");
    addLog("info", "📋 Leyendo lista de destinatarios...");

    try {
      const statusResponse = await fetch("/api/send-emails");
      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(statusData.error || "Error al verificar estado");
      }

      addLog(
        "info",
        `📧 Total de destinatarios: ${statusData.destinatarios.total}`
      );
      addLog(
        "info",
        `📎 PDF encontrado: ${
          statusData.archivos.pdfExiste ? "✅ Sí" : "❌ No"
        }`
      );
      addLog(
        "info",
        `🔐 Credenciales: ${
          statusData.configuracion.credencialesConfiguradas
            ? "✅ Configuradas"
            : "❌ Faltantes"
        }`
      );

      if (!statusData.archivos.pdfExiste) {
        throw new Error(
          "El archivo documento.pdf no existe en la raíz del proyecto"
        );
      }

      if (!statusData.configuracion.credencialesConfiguradas) {
        throw new Error("Las credenciales de Gmail no están configuradas");
      }

      addLog("info", "🔗 Iniciando conexión SMTP...");

      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ template: emailTemplate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en el servidor");
      }

      const data = await response.json();

      if (data.success) {
        addLog("success", `✅ Proceso completado exitosamente!`);
        addLog(
          "info",
          `📊 Resumen: ${data.estadisticas.exitosos} exitosos, ${data.estadisticas.fallidos} fallidos`
        );

        data.resultados.forEach((resultado: EmailResult) => {
          if (resultado.success) {
            addLog("success", `✅ Email enviado a: ${resultado.email}`);
          } else {
            addLog(
              "error",
              `❌ Error enviando a ${resultado.email}: ${resultado.error}`
            );
          }
        });

        setResult(data);
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error de conexión";
      addLog("error", `💥 Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setProgress(100);
      addLog("info", "🏁 Proceso finalizado");
    }
  };

  const verificarEstado = async () => {
    try {
      addLog("info", "🔍 Verificando estado del sistema...");

      const response = await fetch("/api/send-emails");
      const data = await response.json();

      if (response.ok) {
        addLog("success", "✅ Estado del sistema verificado");
        addLog("info", `📧 Destinatarios: ${data.destinatarios.total}`);
        addLog(
          "info",
          `📎 PDF: ${
            data.archivos.pdfExiste ? "✅ Encontrado" : "❌ No encontrado"
          }`
        );
        addLog(
          "info",
          `🔐 Credenciales: ${
            data.configuracion.credencialesConfiguradas
              ? "✅ Configuradas"
              : "❌ Faltantes"
          }`
        );

        setResult(data);
        setError(null);
      } else {
        addLog("error", `❌ Error: ${data.error}`);
        setError(data.error);
      }
    } catch (err) {
      addLog("error", "❌ Error al verificar estado");
      setError("Error al verificar estado");
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-emerald-600 bg-emerald-50/60 border-emerald-200/40";
      case "error":
        return "text-red-600 bg-red-50/60 border-red-200/40";
      case "warning":
        return "text-amber-600 bg-amber-50/60 border-amber-200/40";
      default:
        return "text-slate-600 bg-slate-50/60 border-slate-200/40";
    }
  };

  const generatePreviewHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailTemplate.subject}</title>
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
              <div class="header">
                  <h2>📧 ${emailTemplate.subject}</h2>
              </div>
              
              <div class="content">
                  <div class="greeting">${emailTemplate.greeting}</div>
                  
                  <div class="message">${emailTemplate.body}</div>
                  
                  <div class="signature">
                      ${emailTemplate.signature}
                  </div>
              </div>
              
              <div class="footer">
                  <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                      © 2024 ${emailTemplate.companyName}. Todos los derechos reservados.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                  <span className="text-white text-xl font-bold">📧</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                  Email Sender Pro
                </h1>
                <p className="text-slate-600 font-medium">
                  Sistema de envío masivo 2025
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="group relative px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 text-slate-700 font-semibold">
                {showPreview ? "Ocultar" : "Vista Previa"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Navigation Tabs */}
        <nav className="relative mb-16">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/30 shadow-xl shadow-black/5"></div>
          <div className="relative flex space-x-2 p-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: "📊" },
              { id: "template", label: "Template", icon: "✏️" },
              { id: "logs", label: "Logs", icon: "📝" },
              { id: "settings", label: "Config", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex-1 px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-500 ${
                  activeTab === tab.id
                    ? "text-slate-900 bg-white shadow-2xl shadow-black/10 scale-105"
                    : "text-slate-600 hover:text-slate-800 hover:bg-white/60 hover:scale-102"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-lg">{tab.icon}</span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-12">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-black/10 hover:shadow-3xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                      <span className="text-white text-2xl">📧</span>
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                        Destinatarios
                      </p>
                      <p className="text-4xl font-bold text-slate-900">
                        {result?.destinatarios?.total || "0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-black/10 hover:shadow-3xl hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-105">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/25">
                      <span className="text-white text-2xl">📎</span>
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                        PDF
                      </p>
                      <p className="text-4xl font-bold text-slate-900">
                        {result?.archivos?.pdfExiste ? "✅" : "❌"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-black/10 hover:shadow-3xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25">
                      <span className="text-white text-2xl">🔐</span>
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                        Credenciales
                      </p>
                      <p className="text-4xl font-bold text-slate-900">
                        {result?.configuracion?.credencialesConfiguradas
                          ? "✅"
                          : "❌"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-slate-600/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-2xl shadow-black/10">
                <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
                  🎛️ Panel de Control
                </h2>

                <div className="flex flex-wrap justify-center gap-8 mb-10">
                  <button
                    onClick={verificarEstado}
                    disabled={isLoading}
                    className="group relative px-10 py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-2xl transition-all duration-500 transform hover:scale-105 disabled:transform-none disabled:opacity-50 shadow-2xl shadow-slate-900/25 hover:shadow-3xl hover:shadow-slate-900/30"
                  >
                    <span className="relative z-10">🔍 Verificar Estado</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>

                  <button
                    onClick={enviarEmails}
                    disabled={isLoading}
                    className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-500 transform hover:scale-105 disabled:transform-none disabled:opacity-50 shadow-2xl shadow-blue-600/25 hover:shadow-3xl hover:shadow-blue-600/30"
                  >
                    <span className="relative z-10">
                      {isLoading ? "📤 Enviando..." : "📤 Enviar Emails"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="mb-8">
                    <div className="flex justify-between text-sm font-semibold text-slate-600 mb-4">
                      <span>Progreso del envío</span>
                      <span className="text-blue-600">{progress}%</span>
                    </div>
                    <div className="relative w-full bg-slate-200/50 rounded-full h-4 overflow-hidden shadow-inner">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
                        style={{ width: `${progress}%` }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                    {currentEmail && (
                      <p className="text-sm text-slate-600 mt-4 text-center">
                        Enviando a:{" "}
                        <span className="font-semibold text-blue-600">
                          {currentEmail}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-red-200/40 rounded-3xl p-8 shadow-2xl shadow-red-500/20">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/25">
                      <span className="text-white text-xl">❌</span>
                    </div>
                    <div className="ml-6">
                      <h3 className="text-2xl font-bold text-red-900">
                        Error Detectado
                      </h3>
                      <div className="mt-2 text-red-800 font-medium text-lg">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && result.estadisticas && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-2xl shadow-black/10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
                    📊 Resultados del Envío
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50 rounded-3xl p-8 text-center shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-slate-200/30 transition-all duration-300 hover:scale-105">
                      <div className="text-5xl font-bold text-slate-900 mb-2">
                        {result.estadisticas.total}
                      </div>
                      <div className="text-slate-700 font-semibold uppercase tracking-wide">
                        Total
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-3xl p-8 text-center shadow-xl shadow-emerald-200/20 hover:shadow-2xl hover:shadow-emerald-200/30 transition-all duration-300 hover:scale-105">
                      <div className="text-5xl font-bold text-emerald-700 mb-2">
                        {result.estadisticas.exitosos}
                      </div>
                      <div className="text-emerald-700 font-semibold uppercase tracking-wide">
                        Exitosos
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 rounded-3xl p-8 text-center shadow-xl shadow-red-200/20 hover:shadow-2xl hover:shadow-red-200/30 transition-all duration-300 hover:scale-105">
                      <div className="text-5xl font-bold text-red-700 mb-2">
                        {result.estadisticas.fallidos}
                      </div>
                      <div className="text-red-700 font-semibold uppercase tracking-wide">
                        Fallidos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Template Tab */}
        {activeTab === "template" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            {/* Editor */}
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-2xl shadow-black/10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
                    ✏️ Editor de Template
                  </h2>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                        Asunto del Email
                      </label>
                      <input
                        type="text"
                        value={emailTemplate.subject}
                        onChange={(e) =>
                          setEmailTemplate((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 border border-slate-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium bg-white/50 backdrop-blur-sm"
                        placeholder="Asunto del email..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                        Saludo
                      </label>
                      <input
                        type="text"
                        value={emailTemplate.greeting}
                        onChange={(e) =>
                          setEmailTemplate((prev) => ({
                            ...prev,
                            greeting: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 border border-slate-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium bg-white/50 backdrop-blur-sm"
                        placeholder="Ej: Hola, Estimado cliente,"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                        Cuerpo del Mensaje
                      </label>
                      <textarea
                        value={emailTemplate.body}
                        onChange={(e) =>
                          setEmailTemplate((prev) => ({
                            ...prev,
                            body: e.target.value,
                          }))
                        }
                        rows={10}
                        className="w-full px-6 py-4 border border-slate-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium resize-none bg-white/50 backdrop-blur-sm"
                        placeholder="Escribe el contenido de tu mensaje aquí..."
                      />
                      <p className="text-xs text-slate-500 mt-3 font-medium">
                        💡 Usa \n para saltos de línea
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                        Firma
                      </label>
                      <textarea
                        value={emailTemplate.signature}
                        onChange={(e) =>
                          setEmailTemplate((prev) => ({
                            ...prev,
                            signature: e.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full px-6 py-4 border border-slate-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium resize-none bg-white/50 backdrop-blur-sm"
                        placeholder="Saludos cordiales, Tu Equipo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                        Maderas Caballero
                      </label>
                      <input
                        type="text"
                        value={emailTemplate.companyName}
                        onChange={(e) =>
                          setEmailTemplate((prev) => ({
                            ...prev,
                            companyName: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 border border-slate-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium bg-white/50 backdrop-blur-sm"
                        placeholder="Maderas Caballero"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-2xl shadow-black/10">
                <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
                  👁️ Vista Previa
                </h2>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-3xl p-8 border border-slate-200/50 shadow-xl">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white p-8 text-center">
                      <h3 className="font-bold text-2xl">
                        {emailTemplate.subject}
                      </h3>
                    </div>
                    <div className="p-8 space-y-6">
                      <p className="font-semibold text-slate-800 text-xl">
                        {emailTemplate.greeting}
                      </p>
                      <div className="text-slate-700 whitespace-pre-line text-base leading-relaxed">
                        {emailTemplate.body}
                      </div>
                      <div className="pt-6 border-t border-slate-200 text-slate-700 whitespace-pre-line text-base">
                        {emailTemplate.signature}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-6 text-center text-sm text-slate-500 border-t border-slate-200/50">
                      © 2025 {emailTemplate.companyName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-slate-600/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-slate-900">
                  📝 Logs en Tiempo Real
                </h2>
                <div className="flex items-center space-x-6">
                  <span className="text-sm font-semibold text-slate-600 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/40 shadow-lg">
                    {logs.length} entradas
                  </span>
                  <button
                    onClick={clearLogs}
                    className="px-8 py-3 text-sm font-semibold text-slate-700 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-105"
                  >
                    🗑️ Limpiar
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 h-[600px] overflow-y-auto font-mono text-sm border border-slate-700/50 shadow-2xl shadow-slate-900/50">
                {logs.length === 0 ? (
                  <div className="text-slate-400 text-center py-20">
                    <div className="text-8xl mb-6">📝</div>
                    <p className="text-2xl font-medium">No hay logs aún</p>
                    <p className="text-slate-500 text-lg mt-2">
                      Usa los botones del dashboard para comenzar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-5 rounded-2xl border-2 ${getLogColor(
                          log.type
                        )} shadow-lg backdrop-blur-sm`}
                      >
                        <span className="text-slate-400 font-mono">
                          [{log.timestamp}]
                        </span>{" "}
                        <span className="mr-4 text-xl">
                          {getLogIcon(log.type)}
                        </span>
                        <span className="font-medium text-lg">
                          {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-2xl shadow-black/10">
              <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
                ⚙️ Configuración del Sistema
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-700 mb-6">
                    📋 Archivos Requeridos
                  </h3>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex items-center p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="w-4 h-4 bg-blue-500 rounded-full mr-4 shadow-lg"></span>
                      <code className="bg-blue-100 px-4 py-2 rounded-xl font-mono text-sm font-semibold">
                        data/destinatarios.json
                      </code>
                    </li>
                    <li className="flex items-center p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="w-4 h-4 bg-emerald-500 rounded-full mr-4 shadow-lg"></span>
                      <code className="bg-emerald-100 px-4 py-2 rounded-xl font-mono text-sm font-semibold">
                        documento.pdf
                      </code>
                    </li>
                    <li className="flex items-center p-5 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="w-4 h-4 bg-purple-500 rounded-full mr-4 shadow-lg"></span>
                      <code className="bg-purple-100 px-4 py-2 rounded-xl font-mono text-sm font-semibold">
                        .env.local
                      </code>
                    </li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-700 mb-6">
                    🔐 Variables de Entorno
                  </h3>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex items-center p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="w-4 h-4 bg-emerald-500 rounded-full mr-4 shadow-lg"></span>
                      <code className="bg-emerald-100 px-4 py-2 rounded-xl font-mono text-sm font-semibold">
                        GMAIL_USER
                      </code>
                    </li>
                    <li className="flex items-center p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="w-4 h-4 bg-emerald-500 rounded-full mr-4 shadow-lg"></span>
                      <code className="bg-emerald-100 px-4 py-2 rounded-xl font-mono text-sm font-semibold">
                        GMAIL_PASSWORD
                      </code>
                    </li>
                    <li className="flex items-center p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="w-4 h-4 bg-emerald-500 rounded-full mr-4 shadow-lg"></span>
                      <code className="bg-emerald-100 px-4 py-2 rounded-xl font-mono text-sm font-semibold">
                        SMTP_HOST
                      </code>
                    </li>
                    <li className="flex items-center p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="w-4 h-4 bg-emerald-500 rounded-full mr-4 shadow-lg"></span>
                      <code className="bg-emerald-100 px-4 py-2 rounded-xl font-mono text-sm font-semibold">
                        SMTP_PORT
                      </code>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-10 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-3xl border border-blue-200/50 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">
                  🚀 Instrucciones de Uso
                </h3>
                <ol className="space-y-4 text-blue-800 text-lg">
                  <li className="flex items-start">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5 shadow-lg">
                      1
                    </span>
                    <span>
                      <strong>Configura las variables de entorno</strong> en tu
                      archivo{" "}
                      <code className="bg-blue-200 px-3 py-1 rounded-lg font-mono">
                        .env.local
                      </code>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5 shadow-lg">
                      2
                    </span>
                    <span>
                      <strong>Coloca tu PDF</strong> con el nombre{" "}
                      <code className="bg-blue-200 px-3 py-1 rounded-lg font-mono">
                        documento.pdf
                      </code>{" "}
                      en la raíz
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5 shadow-lg">
                      3
                    </span>
                    <span>
                      <strong>Personaliza el template</strong> del email en la
                      pestaña "Template"
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5 shadow-lg">
                      4
                    </span>
                    <span>
                      <strong>Verifica el estado</strong> del sistema
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5 shadow-lg">
                      5
                    </span>
                    <span>
                      <strong>Ejecuta el envío</strong> de emails
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-white/40">
            <div className="flex items-center justify-between p-8 border-b border-slate-200/50">
              <h3 className="text-2xl font-bold text-slate-900">
                👁️ Vista Previa del Email
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div
                dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
