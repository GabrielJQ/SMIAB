# 📘 Manual de Despliegue: SMIAB (Sistema de Monitoreo de Impresoras)

Este documento es la *Guía Maestra* para instalar, configurar y mantener el sistema SMIAB en un servidor Linux con LAMPP (XAMPP), asegurando la correcta comunicación con el sistema *SAI*.

---

## 🏗️ 1. Preparación del Servidor (Dependencias)

LAMPP por sí solo no puede ejecutar SMIAB. Necesitamos instalar el motor de ejecución (Node.js) y el gestor de procesos (PM2).

bash
# A. Actualizar repositorios
sudo apt-get update

# B. Instalar Node.js (v20 LTS sugerida)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# C. Instalar PM2 para que el sistema nunca se apague
sudo npm install -g pm2


---

## 📠 2. Configuración del Backend (NestJS)

El backend es el "cerebro" que lee SNMP y se conecta a la base de datos de SAI.

1.  *Directorio*: .../bienestar-printers-backend
2.  *Archivo .env*: Crear o editar con los siguientes valores:
    bash
    SUPABASE_URL=xxxxxxxxxxxxxxxx
    DATABASE_URL=xxxxxxxxxxxxxxxx
    SNMP_MODE=production
    # Credenciales SMTP para notificaciones
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=xxxxxxxxxxxxxxxx
    SMTP_PASS=xxxxxxxxxxxxxxxx
    
3.  *Instalación y Compilación*:
    bash
    npm install
    npm run build
    
4.  *Arranque Perpetuo*:
    bash
    pm2 start dist/main.js --name "smiab-api"
    

---

## 🖥️ 3. Configuración del Frontend (Next.js)

La interfaz visual que los usuarios verán en el navegador.

1.  *Directorio*: .../bienestar-printers-frontend
2.  *Archivo .env.local*: Asegurar que apunte a la IP del servidor:
    bash
    NEXT_PUBLIC_API_URL=http://10.101.21.24/smiab/api
    NEXT_PUBLIC_SAI_URL=http://10.101.21.24/sai
    
3.  *Archivo next.config.ts*: (Ya configurado internamente para /smiab).
4.  *Instalación y Compilación*:
    bash
    npm install
    npm run build
    
5.  *Arranque Perpetuo (Puerto 3001)*:
    bash
    pm2 start npm --name "smiab-web" -- start -- -p 3001
    

---

## 🚦 4. Configuración de Apache en LAMPP (Proxy Inverso)

Este es el paso vital para que el exterior pueda entrar a SMIAB vía IP sin usar puertos extraños.

### Paso A: Habilitar Módulos
Editar /opt/lampp/etc/httpd.conf y descomentar (quitar el #) estas líneas:
apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so


### Paso B: Agregar Reglas de Reenvío
Al final del mismo archivo, agregar este bloque:
apache
# --- CONFIGURACIÓN SMIAB: IP 10.101.21.24 ---

# Reenvío para la Aplicación Visual
ProxyPass /smiab http://localhost:3001/smiab
ProxyPassReverse /smiab http://localhost:3001/smiab

# Reenvío para la API (Datos)
ProxyPass /smiab/api http://localhost:3000
ProxyPassReverse /smiab/api http://localhost:3000


### Paso C: Reiniciar Apache
bash
sudo /opt/lampp/lampp restart


---

## 🤝 5. Integración con SAI

SMIAB y SAI están "conectados por el corazón" (la base de datos). 

- *¿Cómo interactúan?*: SMIAB lee las tablas que alimenta SAI (Activos, Resguardantes, Áreas).
- *Verificación*: Si das de alta una impresora en SAI, debe aparecer en SMIAB en cuestión de segundos.
- *Seguridad*: Asegurarse de que el firewall de Linux permita tráfico saliente al puerto 6543 (Supabase) y tráfico SNMP (UDP 161) hacia las impresoras.

---

## 🛠️ 6. Mantenimiento y Comandos Útiles

- *Ver estado del sistema*: pm2 status
- *Ver logs en tiempo real*: pm2 logs
- *Guardar configuración tras reinicio*: pm2 save
- *Recargar backend tras cambios*: pm2 restart smiab-api

> [!WARNING]
> Nunca modifiques archivos directamente en la carpeta dist/ o .next/ del servidor; siempre haz los cambios en el código fuente, compila (npm run build) y luego reinicia PM2.