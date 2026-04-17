import axios from 'axios';

const api = axios.create({
    // baseURL: 'https://agritonix.onrender.com',
    baseURL: 'http://localhost:5000',
    withCredentials: true,
});

// Request interceptor to add CSRF custom header
api.interceptors.request.use(
    (config) => {
        if (config.method !== 'get') {
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Disabled automatic logout on 401 to prevent unnecessary logouts
        // if (error.response?.status === 401) {
        //     window.dispatchEvent(new Event('auth-unauthorized'));
        // }
        return Promise.reject(error);
    }
);

export default api;
