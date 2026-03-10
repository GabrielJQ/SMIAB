import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImMyZjI5MGRlLTE1ZmEtNGNkMy1hYjU4LTdlZWM3MjQ4OWI0ZSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lhYmNxY2ptZGd2b21rdWh0bWVjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkMDI5NzJjYy1jMTNlLTQzNzQtYjgyNS1iZjJhZmFlYzQ3ZGMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzczMTEyMDgxLCJpYXQiOjE3NzMxMDg0ODEsImVtYWlsIjoiZmFybWVuZ29sQGFsaW1lbnRhY2lvbmJpZW5lc3Rhci5nb2IubXgiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiRkVMSVggRk9SVElOTyBBUk1FTkdPTCBSSUNBUkRFWiIsInJvbGUiOiJhZG1pbiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzczMTA4NDgxfV0sInNlc3Npb25faWQiOiIxZTliYTQwYS0xNWZmLTQ2MzEtODQ2My1lMGY3OTFiYWJmYmMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.WNkCqwMRkeA8boo98tLNt7uKzgpy-bhEjpeInk9vSqDHitpFeAxJSrqmRX1rXEKd30LJnvZfZtPSmuVMjZXVUQ';

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
