import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImVhNTc5OTE0LTM4ZTYtNDM3Yi1hMmM4LTE0Mzk3NmJkNmEyZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL29zYWV4dWNyanl2cm9oaGNsc2R3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkNjRmNjI1NC1kMjE0LTQ4MjMtOTc4Ni1lNTE5MmYyNjc2YjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxNTMyMjA0LCJpYXQiOjE3NzE1Mjg2MDQsImVtYWlsIjoiZ2FicmllbEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiR2FicmllbCBRdWludGFuYXIiLCJyb2xlIjoiYWRtaW4ifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MTUyODYwNH1dLCJzZXNzaW9uX2lkIjoiN2Q5Y2U4OGEtNTM1Yi00ZDgwLWExZmMtMGZkOGU2NGI0OTQ1IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.b_fmL005WU7U5gXAVlFGmsVVtnLcNg-L666IlETpkqEd-GFFAGdjEtBjJs6cxP5Xcxplq-W3nqTwhswOdtxdWQ';

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
