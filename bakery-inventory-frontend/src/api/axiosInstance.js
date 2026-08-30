import axios from 'axios';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

/**
 * Centralized Axios Instance
 *
 * Axios automatically:
 * 1. Uses the Spring Boot backend URL.
 * 2. Adds the JWT token to requests.
 * 3. Handles authentication errors globally.
 * 4. Normalizes API error responses into user-safe messages.
 */

const API_BASE_URL = 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Global 30-second timeout. The backend sends OTP emails via
  // synchronous JavaMailSender.send(), which can block the HTTP response
  // for 5–15+ seconds during SMTP TLS handshake. Without a timeout, the
  // UI would hang indefinitely if SMTP is unresponsive.
  timeout: 30000,
});

// =========================================================
// REQUEST INTERCEPTOR: Attach JWT token to requests
// =========================================================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bakery_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================
// RESPONSE INTERCEPTOR: Handle 401 / 403 errors and normalize messages
// =========================================================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Attach normalized error properties
    error.userMessage = getErrorMessage(error);
    error.fieldErrors = getFieldErrors(error);
    error.isNetworkError = Boolean(!error.response && error.request) || error.code === 'ERR_NETWORK';

    // Only clear session on 401 from protected API routes (excluding auth endpoints & public browsing)
    const isPublicRoute =
      url.includes('/api/auth/') ||
      url.includes('/api/products') ||
      url.includes('/api/categories');

    if (status === 401 && !isPublicRoute && localStorage.getItem('bakery_token')) {
      console.warn('Protected resource returned 401 Unauthorized. Clearing session.');
      localStorage.removeItem('bakery_token');
      localStorage.removeItem('bakery_user');

      // Tell AuthContext that the session expired
      window.dispatchEvent(new Event('bakery:session-expired'));
    }

    if (status === 403) {
      console.warn('Access denied (403):', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_BASE_URL };