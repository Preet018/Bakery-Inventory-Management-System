/**
 * Centralized API & Application Error Normalization Utility
 *
 * Provides consistent error extraction, prioritization, and field-level validation resolution
 * across all React components and Axios API service calls.
 *
 * Message Resolution Priority:
 * 1. Explicit user-safe backend error message (`response.data.message` or primary field error).
 * 2. Field-level validation detail when available.
 * 3. Known HTTP-status-specific user-friendly message.
 * 4. Network / Connectivity message.
 * 5. Caller-provided safe fallback message (`defaultMessage`).
 */

/**
 * Extracts a normalized, user-friendly error message from any error object.
 *
 * @param {any} error - The caught error (Axios error, Error instance, or string).
 * @param {string} [fallbackMessage] - Optional fallback message if no specific error can be determined.
 * @returns {string} User-safe, formatted error message.
 */
export function getErrorMessage(
  error,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
) {
  if (!error) return fallbackMessage;

  // 1. Direct string error
  if (typeof error === 'string' && error.trim().length > 0) {
    return error.trim();
  }

  // 2. Pre-normalized message attached by Axios interceptor
  if (error.userMessage && typeof error.userMessage === 'string' && error.userMessage.trim().length > 0) {
    return error.userMessage.trim();
  }

  const response = error.response;
  const status = response?.status;
  const data = response?.data;

  // 3. Explicit safe backend error response
  if (data && typeof data === 'object') {
    // If backend returned field-level validation errors
    if (data.fieldErrors && typeof data.fieldErrors === 'object') {
      const fieldKeys = Object.keys(data.fieldErrors);
      if (fieldKeys.length > 0) {
        const firstFieldMsg = data.fieldErrors[fieldKeys[0]];
        // If the top-level message is specific and not generic "Request validation failed", prefer it
        if (
          data.message &&
          data.message !== 'Request validation failed' &&
          data.message !== 'Validation failed' &&
          data.message.trim().length > 0
        ) {
          return data.message.trim();
        }
        if (firstFieldMsg && typeof firstFieldMsg === 'string' && firstFieldMsg.trim().length > 0) {
          return firstFieldMsg.trim();
        }
      }
    }

    // Explicit top-level user-safe message from backend
    if (data.message && typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message.trim();
    }

    // Fallback if error description string was returned in error property (e.g. human-readable error name)
    if (data.error && typeof data.error === 'string' && data.error.trim().length > 0 && !data.error.includes('_')) {
      return data.error.trim();
    }
  }

  // Plain-text response body from backend (sanitized against HTML error pages)
  if (typeof data === 'string' && data.trim().length > 0 && !data.includes('<!DOCTYPE') && !data.includes('<html>')) {
    return data.trim();
  }

  // 4. Known HTTP Status specific user-safe messages
  if (status) {
    switch (status) {
      case 400:
        return 'Invalid request. Please check the entered details.';
      case 401:
        return 'Your session has expired or you are not signed in. Please log in.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'The requested item or resource could not be found.';
      case 409:
        return 'A conflict occurred with the current state of the resource.';
      case 422:
        return 'Validation failed for the submitted information.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'A server error occurred. Please try again later.';
      default:
        break;
    }
  }

  // 5. Network / Connectivity / Timeout errors
  if (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    (typeof error.message === 'string' && (
      error.message.toLowerCase().includes('network error') ||
      error.message.toLowerCase().includes('timeout')
    )) ||
    (!response && error.request)
  ) {
    return 'Unable to connect to the server. Please check your network connection or try again later.';
  }

  // 6. Safe caller-provided fallback (never arbitrary error.message)
  return fallbackMessage;
}

/**
 * Extracts field-level validation errors object from an API error response.
 *
 * @param {any} error - The caught error.
 * @returns {Record<string, string>} Map of fieldName -> errorMessage.
 */
export function getFieldErrors(error) {
  if (!error) return {};

  if (error.fieldErrors && typeof error.fieldErrors === 'object') {
    return error.fieldErrors;
  }

  if (error.response?.data?.fieldErrors && typeof error.response.data.fieldErrors === 'object') {
    return error.response.data.fieldErrors;
  }

  return {};
}

/**
 * Normalizes all error metadata into a structured summary object.
 *
 * @param {any} error - The caught error.
 * @param {string} [defaultMsg] - Optional default message.
 * @returns {{ message: string, fieldErrors: Record<string, string>, status: number | null, isNetworkError: boolean, isAuthError: boolean, isForbidden: boolean }}
 */
export function normalizeApiError(error, defaultMsg) {
  const message = getErrorMessage(error, defaultMsg);
  const fieldErrors = getFieldErrors(error);
  const status = error?.response?.status || null;
  const isNetwork = Boolean(!error?.response && error?.request) || error?.code === 'ERR_NETWORK';
  const isAuth = status === 401;
  const isForbidden = status === 403;

  return {
    message,
    fieldErrors,
    status,
    isNetworkError: isNetwork,
    isAuthError: isAuth,
    isForbidden,
  };
}
