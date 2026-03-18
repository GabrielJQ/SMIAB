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

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        } else {
            // CRITICAL: If there is no error but also no token, we MUST settle the promise
            // to prevent the application from hanging in "loading" state forever.
            prom.reject(new Error('Sesión expirada o token no recuperado'));
        }
    });
    failedQueue = [];
};

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
        // Si NestJS dice que el token caducó (401), intentamos refrescar usando Laravel
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            return new Promise(async (resolve, reject) => {
                try {
                    const refreshResponse = await axios.post(`${LARAVEL_URL}/smiab/refresh-token`, {}, {
                        withCredentials: true
                    });

                    const newToken = refreshResponse.data.access_token;
                    if (!newToken) {
                        throw new Error('Token no devuelto por el servidor');
                    }

                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('smiab_token', newToken);
                    }

                    api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
                    originalRequest.headers.Authorization = 'Bearer ' + newToken;

                    processQueue(null, newToken);
                    resolve(api(originalRequest));
                } catch (refreshError) {
                    // Clear the broken/expired token to prevent infinite loops
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('smiab_token');
                    }
                    
                    processQueue(refreshError, null);
                    
                    if (typeof window !== 'undefined') {
                        // Redirect to SAI login if we can't recover the session
                        window.location.href = `${LARAVEL_URL}/login`;
                    }
                    reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            });
        }

        return Promise.reject(error);
    }
);