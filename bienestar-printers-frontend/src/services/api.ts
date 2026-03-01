import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImVhNTc5OTE0LTM4ZTYtNDM3Yi1hMmM4LTE0Mzk3NmJkNmEyZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL29zYWV4dWNyanl2cm9oaGNsc2R3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxMzA5YTI5OC0wYmQ1LTQwMDMtYjY1Mi1hYWRiMTQ0ZDRjMDYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyNDAwNjEyLCJpYXQiOjE3NzIzOTcwMTIsImVtYWlsIjoiZmFybWVuZ29sQGFsaW1lbnRhY2lvbmJpZW5lc3Rhci5nb2IubXgiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiRkVMSVggRk9SVElOTyBBUk1FTkdPTCBSSUNBUkRFWiIsInJvbGUiOiJhZG1pbiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzcyMzk3MDEyfV0sInNlc3Npb25faWQiOiI4N2FkYjEzYy0wZjNhLTRiODMtYTdjMC1hMzc1ZGEzYWFlMmQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.j3rgKElXjNOFqyx0_aVjViBSFlROh6WYc02mxB6LRhJ12wsS6Cl3eqpJVk95reX47RArZE8j1ivlYQ05rFL1CQ';

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
