import axios from 'axios';

const api = axios.create({
    baseURL: 'https://agritonix.onrender.com',
    // baseURL: 'http://localhost:5000',
    withCredentials: true,
});

// Helper to get cookie by name
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
};

// Request interceptor to add CSRF token to headers
api.interceptors.request.use(
    (config) => {
        // Skip for GET requests
        if (config.method !== 'get') {
            const csrfToken = getCookie('x-csrf-token');
            if (csrfToken) {
                config.headers['x-csrf-token'] = csrfToken;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

export default api;
