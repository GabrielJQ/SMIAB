# Módulo SNMP — SMIAB

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura General](#2-arquitectura-general)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Protocolo SNMP: Fundamentos](#4-protocolo-snmp-fundamentos)
5. [OIDs (Object Identifiers)](#5-oids-object-identifiers)
6. [Drivers por Fabricante](#6-drivers-por-fabricante)
7. [Servicio SNMP (`SnmpService`)](#7-servicio-snmp-snmpservice)
8. [Procesador de Telemetría (`TelemetryProcessor`)](#8-procesador-de-telemetría-telemetryprocessor)
9. [Ciclo de Vida del Escaneo](#9-ciclo-de-vida-del-escaneo)
10. [Cierre Mensual de Estadísticas](#10-cierre-mensual-de-estadísticas)
11. [Modos de Operación](#11-modos-de-operación)
12. [APIs y Endpoints Relacionados](#12-apis-y-endpoints-relacionados)
13. [Variables de Entorno](#13-variables-de-entorno)
14. [Guía de Desarrollo: Agregar un Nuevo Driver](#14-guía-de-desarrollo-agregar-un-nuevo-driver)
15. [Solución de Problemas](#15-solución-de-problemas)

---

## 1. Introducción

El módulo SNMP es el núcleo de telemetría del **SMIAB (Sistema de Monitoreo de Impresoras y Activos de Bienestar)**. Su responsabilidad es comunicarse con las impresoras de la red institucional a través del protocolo **SNMP (Simple Network Management Protocol)** para extraer información de estado, niveles de consumibles (tóner, kit de mantenimiento, unidad de imagen) y contadores de páginas impresas.

El sistema está construido sobre **NestJS** usando la librería [`net-snmp`](https://www.npmjs.com/package/net-snmp) (v3.26.1) y sigue principios **SOLID** con una arquitectura de **Drivers** que abstrae las particularidades de cada fabricante.

**Ubicación del código:** `bienestar-printers-backend/src/modules/snmp/`

---

## 2. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                      SnmpModule                                  │
│  ┌──────────────┐  ┌────────────────────────┐                   │
│  │ SnmpService  │──│ TelemetryProcessor      │                   │
│  │ (Orquestador)│  │ (Reglas de negocio)     │                   │
│  └──────┬───────┘  └────────────────────────┘                   │
│         │                                                        │
│         │ usa                                                     │
│         ▼                                                        │
│  ┌──────────────────┐                                            │
│  │ SnmpDriverFactory │◄── Factory Method Pattern                  │
│  └──────┬───────────┘                                            │
│         │ retorna                                                  │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ SnmpDriver (Interface)                                │        │
│  │  ▲              ▲              ▲                      │        │
│  │  │              │              │                      │        │
│  │  │              │              │                      │        │
│  │ BaseSnmpDriver  │              │                      │        │
│  │  ▲              ▲              ▲                      │        │
│  │  │              │              │                      │        │
│  │ GenericDriver  KyoceraDriver  LexmarkDriver           │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                    │
│  ┌──────────────────────────────────────────────┐                 │
│  │ Constants / OIDs                            │                 │
│  │  - SNMP_DRIVERS_CONFIG (Perfiles por marca)  │                 │
│  │  - SYS_DESCR_OID                             │                 │
│  └──────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de datos

```
Impresora Física ──(UDP:161)──► SnmpService ──► TelemetryProcessor
                                                    │
                                                    ├──► PrinterStatusLog (diario)
                                                    ├──► Alert (TONER_LOW / PREMATURE_CHANGE / SUSPICIOUS_SWAP)
                                                    ├──► PrinterTonerChange (histórico)
                                                    └──► ReportsConsumablesService (correo automático)
```

### Archivos del módulo

| Archivo | Propósito |
|---|---|
| `snmp.module.ts` | Módulo NestJS, declara providers y exports |
| `snmp.service.ts` | Servicio principal: barridos, scheduling, lectura SNMP |
| `constants/oids.constants.ts` | Definición de `SnmpDriverConfig` y mapas de OIDs por marca |
| `drivers/interfaces/snmp-driver.interface.ts` | Contrato `SnmpDriver` |
| `drivers/snmp-driver.factory.ts` | Fábrica que selecciona el driver según `sysDescr` |
| `drivers/implementations/base-snmp.driver.ts` | Clase abstracta con métodos genéricos `snmpGet`, `snmpGetStr` |
| `drivers/implementations/generic.driver.ts` | Driver genérico (fallback) |
| `drivers/implementations/kyocera.driver.ts` | Driver Kyocera con OIDs de facturación |
| `drivers/implementations/lexmark.driver.ts` | Driver Lexmark con descubrimiento dinámico de tóner |
| `processors/telemetry.processor.ts` | Procesa datos crudos: logs, alertas, detección de cambios |

---

## 3. Modelo de Datos

### Entidad `Printer` (impresoras registradas)

| Columna | Tipo | Descripción |
|---|---|---|
| `asset_id` | `bigint PK` | Identificador único (desde SAI) |
| `ip_printer` | `inet` | Dirección IP del dispositivo |
| `name_printer` | `varchar` | Nombre descriptivo |
| `printer_status` | `varchar` | Estado: `online` / `offline` / `UNKNOWN` |
| `toner_lvl` | `int` | Nivel de tóner (0-100) |
| `total_pages_printed` | `bigint` | Contador total de páginas |
| `print_only_pages` | `bigint` | Contador solo impresión |
| `copy_pages` | `bigint` | Contador solo copia |
| `last_read_at` | `timestamp` | Última lectura SNMP |
| `kit_mttnce_lvl` | `int` | Nivel del kit de mantenimiento |
| `uni_img_lvl` | `int` | Nivel de la unidad de imagen |

### Entidad `PrinterMonthlyStat` (cierre mensual)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `bigint PK` | Autogenerado |
| `asset_id` | `bigint FK` | Relación con Printer |
| `year` / `month` | `int` | Período |
| `print_total_delta` | `bigint` | Páginas totales en el mes |
| `print_only_delta` | `bigint` | Solo impresión en el mes |
| `copy_delta` | `bigint` | Solo copia en el mes |
| `print_total_reading` | `bigint` | Lectura absoluta al cierre |
| `print_only_reading` / `copy_reading` | `bigint` | Lecturas absolutas |

### Entidad `Alert` (alertas)

| Columna | Descripción |
|---|---|
| `type` | `TONER_LOW` (≤33%), `PREMATURE_CHANGE`, `SUSPICIOUS_SWAP` |
| `status` | `PENDING` / `RESOLVED` |
| `metadata` | JSON con `oldLevel`, `newLevel`, `difference`, `emailSent`, `notifiedAt` |

### Entidad `PrinterStatusLog` (log diario)

| Columna | Descripción |
|---|---|
| `printerId` | FK a Printer |
| `tonerLevel` | Nivel registrado ese día |
| `recordedAt` | Fecha del registro |

### Entidad `PrinterTonerChange` (histórico de cambios)

| Columna | Descripción |
|---|---|
| `assetId` | FK a Printer |
| `detectionType` | `auto_detected` / `manual` |
| `changedAt` | Timestamp del cambio |

---

## 4. Protocolo SNMP: Fundamentos

### ¿Qué es SNMP?

**SNMP (Simple Network Management Protocol)** es un protocolo de capa de aplicación (UDP/IP) utilizado para la gestión y monitoreo de dispositivos de red. Opera bajo el puerto **UDP 161** (agente) y **UDP 162** (trap/manager).

### Versiones soportadas

En SMIAB se utiliza **SNMPv2c** (`snmp.Version2c`), que ofrece:
- Community string (`public`) como autenticación básica
- Soporte para `GET` masivo y `GETNEXT`
- Mejor manejo de errores que v1

### Operaciones utilizadas

| Operación | Uso en SMIAB |
|---|---|
| `GET` | Lectura de uno o múltiples OIDs en una sola solicitud |
| `GETNEXT` | No se usa directamente; el driver de Lexmark hace descubrimiento manual |

### La sesión SNMP

```typescript
// Ejemplo de creación de sesión
const session = snmp.createSession(ip, 'public', {
  retries: 1,
  timeout: 3000,
  version: snmp.Version2c,
});
```

Los parámetros de sesión son:
- **`ip`**: Dirección IP de la impresora
- **`'public'`**: Community string (lectura)
- **`retries: 1`**: Reintentos antes de fallar
- **`timeout: 3000`**: Timeout de 3 segundos por intento
- **`version`**: Versión del protocolo (v2c)

---

## 5. OIDs (Object Identifiers)

### ¿Qué es un OID?

Un **OID (Object Identifier)** es una secuencia de números separados por puntos que identifica unívocamente un objeto dentro de la jerarquía MIB (Management Information Base). Los OIDs se organizan en un árbol estándar global.

```
ISO (1)
 └── org (3)
      └── dod (6)
           └── internet (1)
                ├── mgmt (2)
                │    └── mib-2 (1)
                │         ├── system (1)
                │         │    └── sysDescr (1.0) → 1.3.6.1.2.1.1.1.0
                │         ├── interfaces (2)
                │         └── host (25)
                │              ├── hrDevice (3)
                │              └── hrPrinter (43)
                │                   ├── prtGeneral (10)
                │                   │    └── prtLifeCount (2) → Total de páginas
                │                   └── prtMarkerSupplies (11)
                │                        └── prtMarkerSupplyActualValue (9) → Nivel tóner
                └── private (4)
                     └── enterprises (1)
                          ├── lexmark (641)
                          └── kyocera (1347)
```

### OIDs Estándar (RFC 1213 / RFC 3805 / Printer MIB)

| OID | Nombre | Descripción |
|---|---|---|
| `1.3.6.1.2.1.1.1.0` | `sysDescr` | Descripción del sistema (marca, modelo, firmware) |
| `1.3.6.1.2.1.43.10.2.1.4.1.1` | `prtLifeCount` | Contador total de páginas (genérico) |
| `1.3.6.1.2.1.43.11.1.1.9.1.X` | `prtMarkerSupplyActualValue` | Nivel actual del suministro X |
| `1.3.6.1.2.1.43.11.1.1.8.1.X` | `prtMarkerSupplyMaxCapacity` | Capacidad máxima del suministro X |

### OIDs Propietarios por Fabricante

#### Kyocera

| OID | Descripción |
|---|---|
| `1.3.6.1.4.1.1347.43.10.1.1.12.1.1` | Total de páginas (propietario Kyocera) |
| `1.3.6.1.4.1.1347.46.10.1.1.5.1` | Contador de facturación (billing meter) |
| `1.3.6.1.2.1.43.11.1.1.9.1.1` | Nivel de tóner |
| `1.3.6.1.2.1.43.11.1.1.8.1.1` | Capacidad máxima de tóner |
| `1.3.6.1.2.1.43.11.1.1.9.1.2` | Kit de mantenimiento |
| `1.3.6.1.2.1.43.11.1.1.9.1.3` | Unidad de imagen |

#### Lexmark

| OID | Descripción |
|---|---|
| `1.3.6.1.4.1.641.2.1.2.1.6.1` | Billing total (facturación) |
| `1.3.6.1.4.1.641.6.4.2.1.1.4` | Billing total alternativo |
| `1.3.6.1.2.1.43.11.1.1.9.1.3` | Nivel de tóner (cartucho negro) |
| `1.3.6.1.2.1.43.11.1.1.6.1.1` a `1.3.6.1.2.1.43.11.1.1.6.1.5` | Descubrimiento de suministros |

### Archivo de Configuración de OIDs

**Archivo:** `src/modules/snmp/constants/oids.constants.ts`

```typescript
export type SnmpDriverConfig = {
  totalPages: string;
  printOnly: string | null;
  copyOnly: string | null;
  tonerLevel: string;
  tonerMaxCapacity: string | null;
  maintenanceKit: string | null;
  maintenanceKitMax: string | null;
  imageUnit: string | null;
  imageUnitMax: string | null;
};
```

El diccionario `SNMP_DRIVERS_CONFIG` mapea cada marca (`kyocera`, `lexmark`, `generic`) a su configuración de OIDs. El perfil `generic` actúa como fallback universal basado en el estándar Printer MIB.

---

## 6. Drivers por Fabricante

### `SnmpDriver` (Interfaz)

Define el contrato que todos los drivers deben implementar:

| Método | Retorno | Descripción |
|---|---|---|
| `getBrand()` | `string` | Nombre de la marca |
| `getTonerLevel(session, oids)` | `Promise<number>` | Nivel de tóner (0-100) |
| `getTotalPages(session, oids)` | `Promise<number>` | Contador total de páginas |
| `getModelName(session, oids)` | `Promise<string>` | Nombre del modelo |
| `getSerialNumber(session, oids)` | `Promise<string>` | Número de serie |

### `BaseSnmpDriver` (Clase Abstracta)

Provee la implementación base de los métodos comunes:

- **`getTonerLevel`**: Lee el nivel actual (`tonerLevel`) y lo divide entre la capacidad máxima (`tonerMaxCapacity`) para obtener el porcentaje. Si no hay máximo, asume 100.
- **`getTotalPages`**: Lee el OID `totalPages` y retorna el valor numérico.
- **`snmpGet(session, oid)`**: Wrapper que envuelve el callback de `net-snmp` en una Promise. Lee un único OID y retorna `Number`.
- **`snmpGetStr(session, oid)`**: Igual que `snmpGet` pero retorna `String`.

### `GenericDriver`

Driver de fallback. No añade lógica extra; usa los OIDs del perfil `generic`.

### `KyoceraDriver`

Extiende `BaseSnmpDriver` y **sobreescribe `getTotalPages`** para priorizar OIDs de facturación propietarios:

1. Intenta `1.3.6.1.4.1.1347.46.10.1.1.5.1` (billing meter)
2. Si falla, cae al contador estándar (`super.getTotalPages`)

### `LexmarkDriver`

Extiende `BaseSnmpDriver` con dos sobreescrituras:

**`getTotalPages`**: Prioriza OIDs de facturación Lexmark:
1. `1.3.6.1.4.1.641.2.1.2.1.6.1`
2. `1.3.6.1.4.1.641.6.4.2.1.1.4`
3. Fallback al contador estándar

**`getTonerLevel`**: Implementa **descubrimiento dinámico de suministros**:
1. Lee 5 OIDs de descripción (`1.3.6.1.2.1.43.11.1.1.6.1.1` a `.5`)
2. Normaliza los textos (quita acentos, pasa a minúsculas)
3. Busca palabras clave: `cartucho`, `negro`, `black`, `ner`
4. Asigna dinámicamente los OIDs de nivel y capacidad máxima según el índice encontrado
5. Si falla el descubrimiento, usa la configuración por defecto

### `SnmpDriverFactory` (Factory Method)

El archivo `snmp-driver.factory.ts` implementa el patrón **Factory Method**:

```typescript
static getDriver(sysDescr: string): SnmpDriver {
  const desc = sysDescr.toLowerCase();
  if (desc.includes('lexmark')) return this.drivers.lexmark;
  if (desc.includes('kyocera')) return this.drivers.kyocera;
  return this.drivers.generic;
}
```

La selección del driver se basa en el contenido del OID `1.3.6.1.2.1.1.1.0` (`sysDescr`), que contiene el nombre del fabricante.

---

## 7. Servicio SNMP (`SnmpService`)

**Archivo:** `src/modules/snmp/snmp.service.ts`

### Responsabilidades

- Orquestar barridos SNMP programados y manuales
- Gestionar la concurrencia con `p-limit` (máx. 5 escaneos simultáneos)
- Decidir entre modo simulación o producción
- Ejecutar el cierre mensual de estadísticas
- Limpieza de datos obsoletos

### Propiedades Clave

```typescript
private readonly snmpMode: string;          // 'simulation' | 'production'
private readonly scanLimit = pLimit(5);     // Límite de concurrencia
```

### Métodos Principales

| Método | Tipo | Descripción |
|---|---|---|
| `onModuleInit()` | Hook | Dispara un barrido completo al arrancar el servidor |
| `scheduledSweep()` | `@Cron('0 9 * * *')` | Barrido automático a las 9:00 AM (hora CDMX) |
| `forcePrinterUpdate(assetId?)` | Público | Barrido manual vía API (POST /printers/sync) |
| `forceMonthlyClosing(assetId?)` | Público | Cierre mensual forzado vía API |
| `handlePrinterScanEvent(payload)` | `@OnEvent('snmp.printer.scan')` | Procesa cada impresora individualmente |
| `cleanupOldData()` | `@Cron('0 3 * * *')` | Purga logs > 30 días a las 3:00 AM |

### Flujo del Barrido (`executeSweep`)

```
executeSweep(assetId?, forceClosing?)
  │
  ├── Consulta impresoras con IP no nula
  ├── Si assetId especificado, filtra por ese ID
  ├── Para cada impresora, emite evento 'snmp.printer.scan'
  └── Retorna inmediatamente (procesamiento async en background)
```

### Lectura en Producción (`productionRead`)

```
productionRead(printer)
  │
  ├── 1. Lee sysDescr (1.3.6.1.2.1.1.1.0) para detectar marca
  ├── 2. SnmpDriverFactory.getDriver(sysDescr) → driver
  ├── 3. Obtiene config de OIDs: SNMP_DRIVERS_CONFIG[marca]
  ├── 4. Crea sesión SNMP
  ├── 5. driver.getTonerLevel(session, config)
  ├── 6. driver.getTotalPages(session, config)
  ├── 7. Calcula delta de páginas
  ├── 8. Actualiza Printer en BD
  ├── 9. TelemetryProcessor.processTonerTelemetry()
  └── 10. Cierra sesión SNMP
```

### Manejo de Reintentos

El método `productionRead` implementa un bucle de **hasta 3 reintentos** con 2 segundos de espera entre cada intento. Si todos fallan, marca la impresora como `offline`.

### Validación de Horario Laboral

El barrido programado solo se ejecuta si:
- Es día hábil (lunes a viernes, excluyendo festivos mexicanos)
- Está dentro del horario 8:00 AM - 4:00 PM (hora CDMX)

Los días festivos considerados son: 1 de enero, 1 de mayo, 16 de septiembre, 25 de diciembre, y elecciones federales (1 de octubre cada 6 años desde 2024).

---

## 8. Procesador de Telemetría (`TelemetryProcessor`)

**Archivo:** `src/modules/snmp/processors/telemetry.processor.ts`

### Responsabilidades

Una vez que `SnmpService` obtiene los datos crudos de la impresora, `TelemetryProcessor` aplica las reglas de negocio.

### Flujo de `processTonerTelemetry`

```
processTonerTelemetry(printerId, tonerLvl, printerIp?)
  │
  ├── 1. REGISTRO DIARIO
  │   └── Busca el último log del día
  │   └── Si hoy no tiene log, crea uno nuevo
  │
  ├── 2. DETECCIÓN DE CAMBIOS DE TÓNER
  │   ├── Si tonerLvl subió drásticamente (viejo ≤5% → nuevo ≥98%):
  │   │   └── registerTonerChange('auto_detected')
  │   ├── Si tonerLvl subió a ≥98% pero desde >5%:
  │   │   └── registerPrematureChange() + registerTonerChange()
  │   ├── Si tonerLvl subió pero no a ≥98%:
  │   │   └── registerSuspiciousSwap()
  │   └── Si tonerLvl bajó más de 10% y no es 0:
  │       └── registerSuspiciousSwap()
  │
  ├── 3. ALERTA DE NIVEL CRÍTICO (≤33%)
  │   ├── Crea alerta TONER_LOW si no existe una activa
  │   └── Dispara correo automático al resguardante
  │       └── Encola PDF vía ReportsConsumablesService
  │
  └── 4. LIMPIEZA (cron 3:00 AM)
      └── Elimina PrinterStatusLog con más de 30 días
```

### Tipos de Alertas

| Tipo | Condición | Acción |
|---|---|---|
| `TONER_LOW` | Nivel ≤ 33% | Crea alerta + envía correo automático |
| `PREMATURE_CHANGE` | Cambio prematuro (sube a ≥98% desde >5%) | Crea alerta de sospecha |
| `SUSPICIOUS_SWAP` | Intercambio sospechoso (sube pero no a 98%, o baja >10%) | Crea alerta de sospecha |

---

## 9. Ciclo de Vida del Escaneo

```
[CRON] 9:00 AM CDMX
    │
    ▼
scheduledSweep()
    │
    ├── ¿Es horario laboral? ──NO──► Omite
    │   (8:00-16:00, día hábil)
    │
    ├── executeSweep()
    │   ├── Obtiene impresoras con IP
    │   └── Emite eventos 'snmp.printer.scan' (async)
    │
    ▼
handlePrinterScanEvent (por cada impresora)
    │
    ├── scanLimit.acquire() ──► Espera si hay 5+ activas
    │
    ├── ¿SNMP_MODE = simulation?
    │   ├── SÍ → simulateRead()
    │   │   ├── Genera datos aleatorios
    │   │   └── Guarda en BD
    │   │
    │   └── NO → productionRead()
    │       ├── Lectura sysDescr
    │       ├── Selección de driver
    │       ├── Lectura tóner + páginas
    │       ├── Cálculo de delta
    │       └── Actualización en BD
    │
    └── ¿forceClosing?
        └── SÍ → processMonthlyClosing()
```

---

## 10. Cierre Mensual de Estadísticas

### ¿Qué es?

Es el proceso que calcula cuántas páginas se imprimieron en un mes determinado, basado en la diferencia de lecturas entre el inicio y el fin del período.

### Lógica de Ventana (Window Logic)

```
Si today.getDate() ≤ 5  →  El cierre corresponde al MES ANTERIOR
Si today.getDate() > 5  →  El cierre corresponde al MES ACTUAL
```

**Ejemplo:** Si hoy es 3 de abril, se genera la estadística de marzo.

### Cálculo de Deltas

```
printTotalDelta = lecturaActual_total - últimaLecturaConocida_total
printOnlyDelta = lecturaActual_print - últimaLecturaConocida_print
copyDelta      = lecturaActual_copy  - últimaLecturaConocida_copy
```

Si la impresora no tiene separación print/copy pero el último registro sí tenía total, se calcula una **proporción**:

```
ratioP = currentPrint / currentTotal
printOnlyDelta = floor(printTotalDelta * ratioP)
copyDelta = printTotalDelta - printOnlyDelta
```

### Idempotencia

El proceso es **idempotente**: si ya existe un `PrinterMonthlyStat` para ese mes y no se fuerza la actualización, se omite.

---

## 11. Modos de Operación

### Modo `simulation` (Desarrollo/Pruebas)

- No requiere impresoras reales en la red
- Genera datos aleatorios (tóner: 0-100%, páginas: +0-50)
- Estado simulado: 90% online, 10% offline
- Activa la telemetría simulada y el envío de correos

Configuración: `SNMP_MODE=simulation` en `.env`

### Modo `production` (Operación Real)

- Requiere acceso a las impresoras vía UDP 161
- Lee datos reales mediante SNMPv2c
- Ejecuta reintentos (hasta 3) ante fallos de red
- Marca impresoras como `offline` si no responden

Configuración: `SNMP_MODE=production` en `.env`

---

## 12. APIs y Endpoints Relacionados

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/printers/sync` | Barrido completo de todas las impresoras |
| `POST` | `/printers/sync/monthly-closing` | Cierre estadístico forzado |
| `POST` | `/printers/:id/sync` | Barrido de una impresora específica |
| `POST` | `/printers/:id/request-consumable` | Solicitar consumibles (correo) |

### Roles requeridos

- `super_admin`, `admin`: Todos los endpoints
- `collaborator`: Solo `POST /printers/:id/sync`

---

## 13. Variables de Entorno

| Variable | Descripción | Valores |
|---|---|---|
| `SNMP_MODE` | Modo de operación | `simulation` (default) / `production` |

**Importante:** En modo `production`, el servidor debe tener acceso de red a las impresoras (puerto UDP 161).

---

## 14. Guía de Desarrollo: Agregar un Nuevo Driver

### Paso 1: Crear el archivo del driver

```typescript
// src/modules/snmp/drivers/implementations/hp.driver.ts
import { BaseSnmpDriver } from './base-snmp.driver';
import { SnmpDriverConfig } from '../../constants/oids.constants';

export class HpDriver extends BaseSnmpDriver {
  getBrand(): string {
    return 'HP';
  }

  // Sobreescribe métodos si es necesario
  async getTotalPages(session: any, config: SnmpDriverConfig): Promise<number> {
    // Lógica específica de HP
    return super.getTotalPages(session, config);
  }
}
```

### Paso 2: Registrar en la Factory

```typescript
// src/modules/snmp/drivers/snmp-driver.factory.ts
import { HpDriver } from './implementations/hp.driver';

export class SnmpDriverFactory {
  private static drivers = {
    lexmark: new LexmarkDriver(),
    kyocera: new KyoceraDriver(),
    hp: new HpDriver(),           // ← Nuevo
    generic: new GenericDriver(),
  };

  static getDriver(sysDescr: string): SnmpDriver {
    const desc = sysDescr.toLowerCase();
    if (desc.includes('lexmark')) return this.drivers.lexmark;
    if (desc.includes('kyocera')) return this.drivers.kyocera;
    if (desc.includes('hp')) return this.drivers.hp;      // ← Nuevo
    return this.drivers.generic;
  }
}
```

### Paso 3: Agregar perfil de OIDs

```typescript
// src/modules/snmp/constants/oids.constants.ts
export const SNMP_DRIVERS_CONFIG: Record<string, SnmpDriverConfig> = {
  // ... existentes
  hp: {
    totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
    printOnly: null,
    copyOnly: null,
    tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
    tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
    maintenanceKit: null,
    maintenanceKitMax: null,
    imageUnit: null,
    imageUnitMax: null,
  },
};
```

---

## 15. Solución de Problemas

### Problema: La impresora siempre aparece como `offline`

**Causas posibles:**
1. La IP es incorrecta o ha cambiado
2. La impresora no tiene SNMP habilitado
3. Firewall bloquea el puerto UDP 161
4. Community string diferente de `public`
5. Timeout de red (3s por defecto)

**Solución:** Verificar conectividad con:
```bash
snmpget -v2c -c public <IP> 1.3.6.1.2.1.1.1.0
```

### Problema: El nivel de tóner no se lee correctamente

**Causas posibles:**
1. El OID de tóner es incorrecto para esa marca/modelo
2. El descubrimiento dinámico de Lexmark no encuentra el cartucho negro
3. La impresora reporta el nivel en formato diferente (ej. 0-255 en lugar de porcentaje)

**Solución:** Usar `snmpwalk` para inspeccionar los OIDs disponibles:
```bash
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.43.11.1.1
```

### Problema: El contador de páginas se reinicia o da valores erráticos

**Causas posibles:**
1. Se está leyendo un contador incorrecto (ej. contador de trabajos en lugar de vida útil)
2. La impresora usa múltiples contadores (mecánico vs. facturación)

**Solución:** El driver Kyocera y Lexmark ya implementan fallbacks a OIDs de facturación. Verificar en los logs qué OID se está usando.

### Problema: El cierre mensual no genera estadísticas

**Causas:**
1. La impresora está `offline` y no tiene lectura
2. Ya existe un registro para ese mes (idempotencia)
3. `totalPages` es 0 o NaN

**Solución:** Forzar el cierre con `POST /printers/sync/monthly-closing` y revisar los logs.

### Logs Útiles

El sistema produce logs en los siguientes puntos clave:

| Componente | Nivel | Mensaje |
|---|---|---|
| `SnmpService` | `log` | `SNMP Service initialized in production mode` |
| `SnmpService` | `log` | `Iniciando barrido automático de las 9:00 AM...` |
| `SnmpService` | `log` | `Barrido manual solicitado. AssetID: xxx` |
| `SnmpService` | `error` | `Error procesando evento SNMP para IP: xxx` |
| `TelemetryProcessor` | `warn` | `Alerta registrada PREMATURE_CHANGE para xxx` |
| `TelemetryProcessor` | `warn` | `Alerta registrada SUSPICIOUS_SWAP para xxx` |
| `TelemetryProcessor` | `log` | `Toner change registered for printer xxx` |
| `TelemetryProcessor` | `log` | `Disparando correo automático de consumibles para xxx` |
| `TelemetryProcessor` | `error` | `Error al enviar correo automático para xxx` |

---

## Referencias

- **Librería `net-snmp`:** https://www.npmjs.com/package/net-snmp
- **RFC 1213 (MIB-II):** https://datatracker.ietf.org/doc/html/rfc1213
- **RFC 3805 (Printer MIB):** https://datatracker.ietf.org/doc/html/rfc3805
- **Documentación NestJS:** https://docs.nestjs.com
- **OID Repository:** https://oidref.com
