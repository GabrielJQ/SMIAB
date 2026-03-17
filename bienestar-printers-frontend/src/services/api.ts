import axios from 'axios';

// ==========================================
// CONFIGURACIÓN DE RUTAS
// ==========================================
// La IP/Puerto exacto donde tienes abierto Laravel (Asegúrate de que coincida con lo que usas en el navegador)
const LARAVEL_URL = process.env.NEXT_PUBLIC_SAI_URL || 'http://127.0.0.1:8000';

// La IP/Puerto de tu API de NestJS
const NESTJS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: NESTJS_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==========================================
// INTERCEPTOR DE PETICIONES (EL "MAGO" DEL TOKEN)
// ==========================================
api.interceptors.request.use(async (config) => {
    // 1. Buscamos si ya guardamos el token en esta pestaña
    let token = typeof window !== 'undefined' ? sessionStorage.getItem('smiab_token') : null;

    // 2. Si no lo tenemos, vamos corriendo a la "ventanilla" de Laravel a pedirlo
    if (!token && typeof window !== 'undefined') {
        try {
            const response = await axios.get(`${LARAVEL_URL}/smiab/get-token`, {
                // ESTA ES LA LLAVE MÁGICA: Le dice al navegador que envíe la cookie de sesión a Laravel
                withCredentials: true
            });

            token = response.data.access_token;

            // Lo guardamos para no tener que pedirlo en CADA petición que haga la página
            if (token) {
                sessionStorage.setItem('smiab_token', token);
            }
        } catch (error) {
            console.error('No hay sesión en SAI o fallaron los CORS:', error);
            // Si el usuario no está logueado en Laravel, lo regresamos a la pantalla de login del SAI
            window.location.href = `${LARAVEL_URL}/login`;
            return config;
        }
    }

    // 3. Inyectamos el token en la cabecera para que NestJS nos deje pasar
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ==========================================
// INTERCEPTOR DE RESPUESTAS (MANEJO DE ERRORES)
// ==========================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);

        // Si NestJS dice que el token caducó (401), borramos el token viejo y mandamos a Laravel a refrescar
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('smiab_token');
                window.location.href = `${LARAVEL_URL}/login`;
            }
        }

        return Promise.reject(error);
    }
);