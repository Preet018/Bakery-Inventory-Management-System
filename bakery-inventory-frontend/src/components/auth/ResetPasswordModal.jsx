import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../services/authService';
import { KeyRound, Lock, User, Mail, X, CheckCircle2, AlertCircle, Send, ArrowRight } from 'lucide-react';

/**
 * CHANGE: Renamed from ChangePasswordModal → ResetPasswordModal
 *
 * ResetPasswordModal Component
 *
 * Provides a 2-step OTP-verified password reset workflow for users who
 * have forgotten their password or want to reset it:
 *
 * Step 1: User enters their Username or Email to request a 6-digit OTP
 *         sent to their registered email.
 * Step 2: User enters the received OTP and sets their new password.
 *
 * This is NOT an authenticated "change password" flow — it uses the
 * public /api/auth/password-reset/otp and /api/auth/change-password
 * backend endpoints and does not require a current session.
 */
export const ResetPasswordModal = ({ isOpen, onClose, defaultRole = 'CUSTOMER', prefillIdentifier = '' }) => {
  const [loginMethod, setLoginMethod] = useState('username');
  const [identifier, setIdentifier] = useState(prefillIdentifier);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Workflow step: 1 = Request OTP, 2 = Verify OTP & Set New Password
  const [step, setStep] = useState(1);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const closeTimerRef = useRef(null);

  // CHANGE: Reset ALL state when modal opens/closes so reopening always
  // shows a clean initial form (fixes problem #3).
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      setLoginMethod('username');
      setIdentifier(prefillIdentifier);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setStep(1);
      setSendingOtp(false);
      setSubmitting(false);
      setError(null);
      setSuccessMsg(null);
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen, prefillIdentifier]);

  if (!isOpen) return null;

  // CHANGE: Consistent email regex pattern
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // CHANGE: Validation helpers with exact required user-facing messages (Problem #1)
  const validateIdentifier = () => {
    const value = identifier.trim();

    if (!value) {
      setError(`Please enter your ${loginMethod === 'username' ? 'username' : 'email address'}.`);
      return false;
    }

    if (loginMethod === 'username') {
      // CHANGE: By Username — if user enters an email address, show explicit error and do NOT send OTP
      if (value.includes('@') || EMAIL_REGEX.test(value)) {
        setError('Invalid username. Please enter a valid username.');
        return false;
      }
    }

    if (loginMethod === 'email') {
      // CHANGE: By Email — if user enters an invalid email, show explicit error and do NOT send OTP
      if (!EMAIL_REGEX.test(value)) {
        setError('Invalid email address. Please enter a valid email address.');
        return false;
      }
    }

    return true;
  };

  // Step 1: Send OTP to registered email
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // CHANGE: Run frontend validation BEFORE calling the API (fixes Problem #1)
    if (!validateIdentifier()) {
      return;
    }

    setSendingOtp(true);
    try {
      const msg = await authService.requestPasswordResetOtp(identifier.trim());
      setSuccessMsg(typeof msg === 'string' ? msg : 'A 6-digit password reset OTP has been sent to your registered email.');
      setStep(2);
    } catch (err) {
      console.error('OTP Request error:', err);
      let msg = 'Failed to send OTP. Please check your username/email.';

      // CHANGE: Detect Axios timeout and network errors gracefully (Problem #2 UX)
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'The request timed out while sending the OTP email. Please try again.';
      } else if (err.response) {
        if (err.response.status === 401 || err.response.status === 404) {
          msg = 'Backend endpoint not found / unauthorized (401). Please restart/recompile your Spring Boot backend.';
        } else if (typeof err.response.data === 'string' && err.response.data.trim()) {
          msg = err.response.data;
        } else if (err.response.data?.message) {
          msg = err.response.data.message;
        }
      } else if (!err.response && err.request) {
        msg = 'Unable to reach the server. Please verify the backend is running.';
      }
      setError(msg);
    } finally {
      // CHANGE: Always ensure loading state stops so the button is never stuck (Problem #2)
      setSendingOtp(false);
    }
  };

  // CHANGE: Step 2 — Submit OTP & New Password
  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP verification code.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const msg = await authService.resetPassword({
        usernameOrEmail: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMsg(typeof msg === 'string' ? msg : 'Password has been reset successfully! You can now log in with your new password.');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');

      // CHANGE: Consistent 5-second display duration before auto-closing the modal
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 5000);
    } catch (err) {
      console.error('Password reset error:', err);
      let msg = 'Failed to reset password. Invalid or expired OTP code.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'The request timed out. Please try again.';
      } else if (err.response) {
        if (err.response.status === 401 || err.response.status === 404) {
          msg = 'Backend endpoint not found / unauthorized. Please restart your Spring Boot backend.';
        } else if (typeof err.response.data === 'string' && err.response.data.trim()) {
          msg = err.response.data;
        } else if (err.response.data?.message) {
          msg = err.response.data.message;
        }
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // CHANGE: Handle navigating back from Step 2 to Step 1 cleanly
  // Clears successMsg, error, entered OTP, new password, and confirm password so initial form is clean
  const handleBackToStep1 = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
    setSendingOtp(false);
    setSubmitting(false);
  };

  const resetModal = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    // CHANGE: Reset ALL state including identifier and loginMethod (Problem #3)
    setStep(1);
    setLoginMethod('username');
    setIdentifier(prefillIdentifier);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setSendingOtp(false);
    setSubmitting(false);
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container card auth-modal">
        <div className="modal-header">
          <div className="modal-header-title">
            <KeyRound size={22} className="text-amber" />
            {/* CHANGE: Clear "Reset Password" title */}
            <h3>Reset Password</h3>
          </div>
          <button onClick={resetModal} className="modal-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-alert">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Enter Username/Email to receive OTP */
          /* CHANGE: noValidate added so custom styled validation messages display consistently without native browser popup interference */
          <form onSubmit={handleRequestOtp} className="auth-form" noValidate>
            {/* CHANGE: Clear "Forgot Password" instructional text */}
            <p className="modal-instruction">
              Enter your account username or registered email below. A verification code will be sent to your registered email to reset your password.
            </p>

            {/* Method Toggle: Username vs Email */}
            <div className="login-method-toggle">
              <button
                type="button"
                className={`toggle-tab ${loginMethod === 'username' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMethod('username');
                  setError(null);
                }}
              >
                <User size={14} /> By Username
              </button>
              <button
                type="button"
                className={`toggle-tab ${loginMethod === 'email' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMethod('email');
                  setError(null);
                }}
              >
                <Mail size={14} /> By Email
              </button>
            </div>

            <div className="form-group">
              <label>{loginMethod === 'username' ? 'Account Username *' : 'Registered Email Address *'}</label>
              <div className="input-with-icon">
                {loginMethod === 'username' ? (
                  <User size={18} className="input-icon" />
                ) : (
                  <Mail size={18} className="input-icon" />
                )}
                <input
                  type={loginMethod === 'email' ? 'email' : 'text'}
                  placeholder={loginMethod === 'username' ? 'e.g. john_baker' : 'e.g. customer@example.com'}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={resetModal} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={sendingOtp} className="btn-primary">
                <Send size={16} />
                <span>{sendingOtp ? 'Sending OTP Code...' : 'Send OTP'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: Enter OTP & New Password */
          <form onSubmit={handleConfirmPasswordReset} className="auth-form" noValidate>
            <p className="modal-instruction">
              Enter the 6-digit OTP code sent to the email associated with <strong>{identifier}</strong>.
            </p>

            <div className="form-group">
              <label>6-Digit OTP Code *</label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="otp-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>New Password *</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  minLength={8}
                  maxLength={100}
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <span className="field-hint">Must be at least 8 characters.</span>
            </div>

            <div className="form-group">
              <label>Confirm New Password *</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  minLength={8}
                  maxLength={100}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions-between">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={sendingOtp}
                className="link-button"
              >
                {sendingOtp ? 'Resending...' : 'Resend OTP'}
              </button>

              <div className="modal-actions">
                {/* CHANGE: Back button now calls handleBackToStep1 to completely clean step 2 state & success message */}
                <button type="button" onClick={handleBackToStep1} className="btn-secondary">
                  Back
                </button>
                {/* CHANGE: Button text clearly says "Reset Password" */}
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Resetting...' : 'Verify OTP & Reset Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
