import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../services/authService';
import { KeyRound, Lock, User, Mail, X, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { getErrorMessage } from '../../utils/apiError';

/**
 * ResetPasswordModal Component
 *
 * Provides a 2-step OTP-verified password reset workflow for users who
 * have forgotten their password or want to reset/change it:
 *
 * Step 1: User enters their Username or Email to request a 6-digit OTP
 *         sent to their registered email.
 * Step 2: User enters the received OTP and sets their new password.
 *
 * This is an OTP-based password reset using the public /api/auth/password-reset/otp
 * and /api/auth/change-password backend endpoints and does not require a current session.
 */
// CHANGE: Removed unused defaultRole prop (Issue #05)
export const ResetPasswordModal = ({ isOpen, onClose, prefillIdentifier = '' }) => {
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

  // CHANGE: OTP resend countdown state & timer refs (Issue #05)
  const [resendCountdown, setResendCountdown] = useState(0);
  const closeTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // CHANGE: Helper to manage the 60s resend cooldown countdown
  const startResendCountdown = (seconds = 60) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setResendCountdown(seconds);
    countdownIntervalRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // CHANGE: Reset ALL state and clear all timers when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
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
      setResendCountdown(0);
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isOpen, prefillIdentifier]);

  if (!isOpen) return null;

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateIdentifier = () => {
    const value = identifier.trim();

    if (!value) {
      setError(`Please enter your ${loginMethod === 'username' ? 'username' : 'email address'}.`);
      return false;
    }

    if (loginMethod === 'username') {
      if (value.includes('@') || EMAIL_REGEX.test(value)) {
        setError('Invalid username. Please enter a valid username.');
        return false;
      }
    }

    if (loginMethod === 'email') {
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

    if (!validateIdentifier()) {
      return;
    }

    setSendingOtp(true);
    try {
      const msg = await authService.requestPasswordResetOtp(identifier.trim());
      setSuccessMsg(typeof msg === 'string' ? msg : 'If an account exists for the provided information, a password reset OTP has been sent to the registered email.');
      setStep(2);
      // CHANGE: Start 60s cooldown countdown on successful OTP request / resend
      startResendCountdown(60);
    } catch (err) {
      console.error('OTP Request error:', err);
      const msg = getErrorMessage(err, 'Failed to send OTP. Please check your username/email.');
      setError(msg);

      // If backend returned a cooldown error, start/maintain the cooldown countdown
      if (typeof msg === 'string' && msg.toLowerCase().includes('wait before')) {
        startResendCountdown(60);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2 — Submit OTP & New Password
  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP verification code.');
      return;
    }

    // CHANGE: Enforce strict 8–100 character password length matching backend (Issue #05)
    if (newPassword.length < 8 || newPassword.length > 100) {
      setError('New password must be between 8 and 100 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
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

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 5000);
    } catch (err) {
      console.error('Password reset error:', err);
      const msg = getErrorMessage(err, 'Failed to reset password. Invalid or expired OTP code.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToStep1 = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
    setSendingOtp(false);
    setSubmitting(false);
    setResendCountdown(0);
  };

  const resetModal = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
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
    setResendCountdown(0);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container card auth-modal">
        <div className="modal-header">
          <div className="modal-header-title">
            <KeyRound size={22} className="text-amber" />
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
          <form onSubmit={handleRequestOtp} className="auth-form" noValidate>
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
              {/* CHANGE: Updated hint text to reflect exact 8-100 character requirement */}
              <span className="field-hint">Must be between 8 and 100 characters.</span>
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
              {/* CHANGE: OTP Resend button with active 60s countdown and disabled state during cooldown */}
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={sendingOtp || resendCountdown > 0}
                className="link-button"
              >
                {sendingOtp
                  ? 'Resending...'
                  : resendCountdown > 0
                    ? `Resend OTP in ${resendCountdown}s`
                    : 'Resend OTP'}
              </button>

              <div className="modal-actions">
                <button type="button" onClick={handleBackToStep1} className="btn-secondary">
                  Back
                </button>
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
