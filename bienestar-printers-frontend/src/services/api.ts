import axios from 'axios';

// ⚠️ TODO: Replace with a valid Supabase JWT for the 'bienestar-printers' project
// This token should belong to a user with a valid area/unit assigned.
export const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImVhNTc5OTE0LTM4ZTYtNDM3Yi1hMmM4LTE0Mzk3NmJkNmEyZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL29zYWV4dWNyanl2cm9oaGNsc2R3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5YzVlYTZlOS03ODQzLTRhMWUtOTJiNy04NTI4NmUzYzVhMmYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxMDA4MTAyLCJpYXQiOjE3NzEwMDQ1MDIsImVtYWlsIjoiZ2FicmllbEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiR2FicmllbCBRdWludGFuYXIiLCJyb2xlIjoiYWRtaW4ifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MTAwNDUwMn1dLCJzZXNzaW9uX2lkIjoiYWNlNWQ1YTUtZTk4Yy00OWVmLTg0MTAtYjQwNDQwYzc2MzI3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.J8GR0JFIIESCq3ppqeSynOy9qqfeQ1PqWm-ij2GYwV2AwKBtW9539_S8f4rJPVTrQgW225TyiP1DkhQH2xJSnw';

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
