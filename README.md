# SMIAB: Sistema de Monitoreo de Impresoras y Activos de Bienestar

## 🌐 Descripción General del Ecosistema

SMIAB es una solución híbrida de nivel institucional diseñada para la gestión integral del inventario tecnológico y el monitoreo en tiempo real de periféricos de impresión. El ecosistema se divide en dos dominios principales siguiendo principios de **Domain-Driven Design (DDD)**:

1.  **SAI (Sistema de Activos Informáticos):** Desarrollado en **Laravel**, actúa como el *Single Source of Truth* para los activos físicos, resguardantes y ubicaciones.
2.  **SMIAB (Monitoreo):** Desarrollado con **NestJS (Backend)** y **Next.js (Frontend)**, actúa como el *Master de Telemetría*, encargándose del estado operativo y consumos de las impresoras.

---

## 🛠 Prerrequisitos Tecnológicos

Para el despliegue y desarrollo del sistema, se requiere:

-   **Node.js:** v20.x o superior.
-   **PHP:** v8.2 o superior (para el núcleo SAI).
-   **PostgreSQL:** v15+ (Gestionado vía Supabase).
-   **Puppeteer Dependencies:** Librerías de sistema para ejecución de Chromium en Linux/Windows.
-   **SNMP:** Acceso a la red institucional para barrido de dispositivos.

---

## 🚀 Instalación Rápida (Desarrollo Local)

### 1. Clonar y Configurar Backend
```bash
cd bienestar-printers-backend
npm install
cp .env.example .env
npm run start:dev
```

### 2. Configurar Frontend
```bash
cd bienestar-printers-frontend
npm install
npm run dev
```
---

## 📚 Documentación del Código (Compodoc)

Este proyecto utiliza el estándar JSDoc en combinación con **Compodoc** para generar un portal web interactivo con la documentación técnica profunda de todos los módulos, controladores y servicios.

Para generar y visualizar el portal de documentación en tu entorno local:

1. Abre la terminal en la raíz del proyecto backend.
2. Ejecuta el comando de construcción:
   ```bash
   npm run docs
El script compilará los comentarios y levantará un servidor local. Abre tu navegador en: http://localhost:8080

Nota para desarrolladores: La carpeta /documentation generada por Compodoc está ignorada en Git (.gitignore) por ser un artefacto de compilación. No la subas al repositorio; genérala siempre bajo demanda.
---

## ⚙️ Variables de Entorno Críticas

| Variable | Descripción | Valores Sugeridos |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cadena de conexión a Supabase. | `postgresql://...` |
| `SNMP_MODE` | Define si el sistema consulta IPs reales o simula datos. | `production` | `simulation` |
| `SMTP_HOST` | Servidor de correo para alertas y reportes. | `smtp.mailtrap.io` |
| `CRON_SNMP_SCHEDULE` | Frecuencia del barrido automático. | `0 */4 * * *` (Cada 4h) |

---

> [!IMPORTANT]
> El sistema requiere que el backend de NestJS tenga acceso por red (puerto 161 UDP) a las impresoras para que el módulo SNMP funcione correctamente.
