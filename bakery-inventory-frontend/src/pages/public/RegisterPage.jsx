import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { getErrorMessage, getFieldErrors } from '../../utils/apiError';
import {
  User,
  Mail,
  Lock,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

/**
 * RegisterPage Component
 *
 * Clean 2-Step Customer Account Creation Process:
 * - Step 1: Customer enters Username, Email, and Password.
 *           "Register & Send Verification OTP" validates details, requests OTP,
 *           and moves directly to Step 2 without creating a DB row yet.
 * - Step 2: Customer enters 6-Digit OTP sent to their Step 1 email.
 *           "Verify OTP & Create Account" validates OTP, creates the UserAccount,
 *           and redirects to login.
 */
export const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Clean up redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // =========================================================
  // STEP 1: REGISTER & SEND VERIFICATION OTP
  // =========================================================
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();
    const password = formData.password;

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const msg = await authService.register({
        username: trimmedUsername,
        email: trimmedEmail,
        password: password,
      });

      setSuccessMsg(
        typeof msg === 'string' && msg.length > 0
          ? msg
          : `A 6-digit verification code has been sent to ${trimmedEmail}.`
      );
      setStep(2);
      setOtp('');
      setResendCooldown(60);
    } catch (err) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err, 'Registration failed. Please check your details.'));
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // STEP 2: VERIFY OTP & CREATE ACCOUNT
  // =========================================================
  const handleStep2Verify = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length < 6) {
      setError('Please enter the complete 6-digit verification OTP code.');
      return;
    }

    setVerifying(true);

    try {
      const msg = await authService.verifyRegistration({
        email: formData.email.trim().toLowerCase(),
        otp: trimmedOtp,
      });

      setSuccessMsg(
        typeof msg === 'string' && msg.length > 0
          ? msg
          : 'Account created and verified successfully! Redirecting to login...'
      );

      // Auto-redirect to login after short display
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            registrationSuccess: true,
            email: formData.email.trim(),
          },
        });
      }, 2500);
    } catch (err) {
      console.error('OTP Verification error:', err);
      setError(getErrorMessage(err, 'OTP verification failed. Invalid or expired verification code.'));
    } finally {
      setVerifying(false);
    }
  };

  // =========================================================
  // RESEND OTP
  // =========================================================
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending || verifying) return;

    setError(null);
    setResending(true);

    try {
      const msg = await authService.resendRegistrationOtp(formData.email.trim());
      setSuccessMsg(
        typeof msg === 'string' && msg.length > 0
          ? msg
          : 'A new verification OTP has been sent to your email.'
      );
      setResendCooldown(60);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(getErrorMessage(err, 'Failed to resend OTP. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  // =========================================================
  // RETURN TO STEP 1 (EDIT DETAILS)
  // =========================================================
  const handleBackToStep1 = () => {
    setStep(1);
    setOtp('');
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="auth-standalone-page page-container">
      <div className="auth-card card compact-auth-card role-card-customer">
        {/* Header */}
        <div className="compact-auth-header">
          <div className="header-title-row">
            <div className="compact-icon-badge icon-customer">
              {step === 1 ? <UserPlus size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h3>{step === 1 ? 'Create Customer Account' : 'Verify Email & Create Account'}</h3>
              <span className="role-pill-compact role-customer">
                {step === 1 ? 'STEP 1 OF 2: REGISTRATION' : 'STEP 2 OF 2: VERIFY OTP'}
              </span>
            </div>
          </div>
        </div>

        {/* Step description */}
        {step === 2 && (
          <p
            className="auth-modal-desc"
            style={{ fontSize: '0.88rem', color: '#4B5563', margin: '0.75rem 0 1rem 0' }}
          >
            Enter the 6-digit verification code sent to <strong>{formData.email}</strong>.
          </p>
        )}

        {/* Alerts */}
        {error && (
          <div className="error-alert compact-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-alert compact-alert">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =====================================================
            STEP 1: REGISTRATION DETAILS FORM
            ===================================================== */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="auth-form compact-form">
            <div className="form-group compact-group">
              <label htmlFor="reg-username">Username (Display Name) *</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="reg-username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="e.g. john_baker (3–50 chars)"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={submitting}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group compact-group">
              <label htmlFor="reg-email">Email Address (For OTP Verification) *</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="e.g. customer@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group compact-group">
              <label htmlFor="reg-password">Password *</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary btn-block compact-submit-btn"
            >
              {submitting ? (
                <>
                  <RefreshCw className="spinner" size={16} />
                  <span>Sending Verification OTP...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Register & Send Verification OTP</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* =====================================================
            STEP 2: OTP VERIFICATION & ACCOUNT CREATION
            ===================================================== */}
        {step === 2 && (
          <form onSubmit={handleStep2Verify} noValidate className="auth-form compact-form">
            <div className="form-group compact-group">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <label>6-Digit Verification OTP *</label>
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="btn-link-action"
                  style={{ fontSize: '0.78rem' }}
                >
                  <ArrowLeft
                    size={12}
                    style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}
                  />
                  Change Details
                </button>
              </div>

              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon" />
                <input
                  id="reg-otp"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={verifying}
                  style={{ letterSpacing: '0.3em', fontWeight: '700', fontSize: '1.05rem' }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || otp.trim().length < 6}
              className="btn-primary btn-block compact-submit-btn"
            >
              {verifying ? (
                <>
                  <RefreshCw className="spinner" size={16} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify OTP & Create Account</span>
                </>
              )}
            </button>

            {/* Resend Action */}
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || verifying || resendCooldown > 0}
                className="btn-link-action"
                style={{ fontSize: '0.85rem' }}
              >
                {resending
                  ? 'Sending new OTP code...'
                  : resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : "Didn't receive the code? Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="compact-auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
