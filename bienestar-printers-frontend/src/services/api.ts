import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI3M2ZhY2Q2LTJjNjEtNGM2ZS1iOWY4LWNjYzA5ZTMxNjRmNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xoa21zZXhwYm91aHBjeXZoZ29rLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3NjY1NjJhNi1iMzgyLTRjNTktOTk5Yi0xZDhkMmQ2NDA2OGMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwNDAwNDQzLCJpYXQiOjE3NzAzOTY4NDMsImVtYWlsIjoiaXJ2aW5AdGVzdC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MDM5Njg0M31dLCJzZXNzaW9uX2lkIjoiYWY0MDRkMjAtOWY2NC00MWUyLTgxZTktYTllNTk4OTFjNjI1IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.koEabL0Ae4_fPGYn2M72UowHF8VaQBcTUcGAolU-yAXkHEr8UfMwsaCJ04HZSJKBtJMM1fg2SxCGVyKtA-TdEQ';

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
