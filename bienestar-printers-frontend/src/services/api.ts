import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI3M2ZhY2Q2LTJjNjEtNGM2ZS1iOWY4LWNjYzA5ZTMxNjRmNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xoa21zZXhwYm91aHBjeXZoZ29rLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3NjY1NjJhNi1iMzgyLTRjNTktOTk5Yi0xZDhkMmQ2NDA2OGMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwNzU1MjY0LCJpYXQiOjE3NzA3NTE2NjQsImVtYWlsIjoiaXJ2aW5AdGVzdC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MDc1MTY2NH1dLCJzZXNzaW9uX2lkIjoiYzg3ODQ4N2MtNzU5Ny00ODhmLTlhZDctNzU4YTYxNzI3MDdlIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.D9KHCEGRW3CAs1JzrQry1gX-fWbCspUCRkwKgNOjWAxe_6hqgQorOSgc_bKscTG5b2RwVpywk3zHWI2m2LI_zQ';

export const api = axios.create({
    baseURL: 'http://localhost:3000', // Hardcoded for Phase 0
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (AUTH_TOKEN) {
        config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log error or handle global errors
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
