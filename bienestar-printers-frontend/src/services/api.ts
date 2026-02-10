import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI3M2ZhY2Q2LTJjNjEtNGM2ZS1iOWY4LWNjYzA5ZTMxNjRmNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xoa21zZXhwYm91aHBjeXZoZ29rLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3NjY1NjJhNi1iMzgyLTRjNTktOTk5Yi0xZDhkMmQ2NDA2OGMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwNzYyNDk5LCJpYXQiOjE3NzA3NTg4OTksImVtYWlsIjoiaXJ2aW5AdGVzdC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MDc1ODg5OX1dLCJzZXNzaW9uX2lkIjoiZGExNTU3YmMtZjQ5OC00YzNkLTk5Y2YtNjQwYzBiMDhmZWRjIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.ydgHJTyRNhUJDydDF-TYt7-EWeUYTBqNHBlH0_1VG7jk6K98PSHPSO4Fh-c-7PcUNH1M3R-v2odBVtxuejkLLA';

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
