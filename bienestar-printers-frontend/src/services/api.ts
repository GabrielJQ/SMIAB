import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImMyZjI5MGRlLTE1ZmEtNGNkMy1hYjU4LTdlZWM3MjQ4OWI0ZSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lhYmNxY2ptZGd2b21rdWh0bWVjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkMDI5NzJjYy1jMTNlLTQzNzQtYjgyNS1iZjJhZmFlYzQ3ZGMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzczMTgwOTI1LCJpYXQiOjE3NzMxNzczMjUsImVtYWlsIjoiZmFybWVuZ29sQGFsaW1lbnRhY2lvbmJpZW5lc3Rhci5nb2IubXgiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiRkVMSVggRk9SVElOTyBBUk1FTkdPTCBSSUNBUkRFWiIsInJvbGUiOiJhZG1pbiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzczMTc3MzI1fV0sInNlc3Npb25faWQiOiIxZWM2YWE5Zi1lZDdlLTRmMWUtYjE4OC05ZmMyMmYwNGE0YTIiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.pg4Co8IglO1OjKEGhyh2EcdBrU26Symjqd4ha8QBYdMXlH6iqp3Njvrsp0mcMCTPnlT3tQZedeBg3KbE7UHySg';

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
