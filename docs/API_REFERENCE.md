# API Reference: SMIAB Backend (NestJS)

Esta API sigue el estándar OpenAPI/Swagger para facilitar la integración y pruebas de endpoints.

## 📠 Endpoints Principales

### 📤 Importación de Historial (Excel)
**Endpoint:** `POST /printers/history/upload`

Permite la carga masiva de contadores de impresión desde un archivo Excel institucional.

-   **Parámetros (Multipart):**
    -   `file`: Binario del archivo Excel (.xlsx).
    -   `year`: Año al que pertenecen los datos.
    -   `month`: Mes correspondiente (1-12).
-   **Matemática del Cálculo de Deltas:** El archivo Excel cargado por el usuario contiene la "Lectura Total" (histórico acumulado) de la máquina. El sistema NO guarda esta cifra directamente como consumo, sino que realiza una resta algebraica:
    -   `Consumo Mes Actual = (Lectura Excel) - (Lectura Mes Anterior Registrado en DB)`.
    -   El resultado de esta operación es el **Delta** que se persiste para las gráficas de consumo real.

---

### 📧 Solicitud de Consumibles
**Endpoint:** `POST /printers/:id/request-consumables`

Dispara un flujo de correo institucional solicitando tóner para una impresora específica.

-   **Parámetros:**
    -   `id`: UUID de la impresora en SMIAB.
    -   `email` (Body): Destinatario adicional (opcional).
-   **Flujo de Datos y SQL Joins:** Al procesar esta solicitud, el backend realiza una serie de **JOINs dinámicos** en la base de datos utilizando el `asset_id`. Esto permite extraer en tiempo real la información del resguardante actual almacenada en el dominio SAI:
    -   Datos extraídos: Área de adscripción, Centro de Trabajo, Horario de atención y datos de contacto seleccionados.
-   **Generación de Tabla HTML:** El sistema popula dinámicamente una plantilla HTML con estos datos para que el correo llegue listo para su gestión administrativa.

---

### 📊 Métricas y Estadísticas
**Endpoints:**
-   `GET /printers/unit/history?year=2024&month=3`: Recupera el consumo mensual comparado de toda la unidad.
-   `GET /printers/unit/top-consumers`: Lista las 5 impresoras con mayor volumen de impresión del mes.

---

> [!NOTE]
> Todos los endpoints requieren autenticación mediante un **Bearer Token (Supabase JWT)**. La falta del token resultará en un error `401 Unauthorized`.
