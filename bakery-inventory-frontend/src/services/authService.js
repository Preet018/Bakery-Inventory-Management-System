import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: AuthService
 * Encapsulates all authentication-related REST API endpoints.
 */

export const authService = {
  // Login user (Customer, Inventory Manager, Admin)
  login: async (credentials) => {
    // credentials = { usernameOrEmail, password }
    const response = await axiosInstance.post('/api/auth/login', credentials);
    return response.data; // LoginResponse: { accessToken, tokenType, expiresIn, username, role }
  },

  // Register new customer account
  register: async (userData) => {
    // userData = { firstName, lastName, email, password, phoneNumber }
    const response = await axiosInstance.post('/api/auth/register', userData);
    return response.data; // Success message string
  },

  // Verify email using OTP code
  verifyEmail: async (verificationData) => {
    // verificationData = { email, otp }
    const response = await axiosInstance.post('/api/auth/verify-email', verificationData);
    return response.data;
  },

  // Request new email verification OTP
  requestVerificationOtp: async (email) => {
    const response = await axiosInstance.post(`/api/auth/request-verification?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  // Request account deletion OTP
  requestAccountDeletionOtp: async () => {
    const response = await axiosInstance.post('/api/auth/account-deletion/otp');
    return response.data;
  },

  // Delete account with OTP
  deleteOwnAccount: async (deleteData) => {
    // deleteData = { password, otpCode }
    const response = await axiosInstance.delete('/api/auth/account', { data: deleteData });
    return response.data;
  },

  // Request OTP for password reset
  requestPasswordResetOtp: async (usernameOrEmail) => {
    const response = await axiosInstance.post(`/api/auth/password-reset/otp?usernameOrEmail=${encodeURIComponent(usernameOrEmail)}`);
    return response.data;
  },

  // CHANGE: Renamed from changePassword → resetPassword for accuracy.
  // This is an OTP-based password reset (unauthenticated), not an
  // authenticated "change password" flow.
  resetPassword: async (passwordData) => {
    // passwordData = { usernameOrEmail, otp, newPassword }
    const response = await axiosInstance.post('/api/auth/change-password', passwordData);
    return response.data;
  }
};
