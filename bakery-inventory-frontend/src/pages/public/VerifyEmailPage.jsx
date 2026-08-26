import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { KeyRound, Mail, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, Send, ArrowLeft } from 'lucide-react';

/**
 * VerifyEmailPage Component
 *
 * Clean 2-step OTP Email Verification Flow:
 *   - Step 1: User enters registered email address and clicks "Send Verification OTP".
 *   - Step 2: On successful OTP dispatch, reveals 6-digit OTP input, "Verify Email & Activate Account"
 *             button, and "Resend OTP" option.
 *   - Clean state reset on Back navigation.
 */
export const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // If redirected from registration with an already-sent OTP, start on step 2; otherwise start on step 1
  const initialEmail = location.state?.email || '';
  const initialStep = location.state?.step || (location.state?.otpSent ? 2 : 1);

  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(
    location.state?.otpSent ? 'A verification code has been sent to your email.' : null
  );
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Email format validation helper
  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
  };

  // =========================================================
  // STEP 1: SEND VERIFICATION OTP
  // =========================================================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();

    // Client-side email validation
    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Invalid email address. Please enter a valid email address.');
      return;
    }

    setSendingOtp(true);

    try {
      const msg = await authService.requestVerificationOtp(trimmedEmail);
      setSuccessMsg(
        typeof msg === 'string' && msg.length > 0
          ? msg
          : 'A verification OTP has been sent to your registered email.'
      );
      setStep(2);
      setOtp('');
    } catch (err) {
      console.error('Send verification OTP error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Failed to send verification OTP. Make sure the email is registered and not already verified.';
      setError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const redirectTimerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // =========================================================
  // STEP 2: VERIFY OTP & ACTIVATE ACCOUNT
  // =========================================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length < 6) {
      setError('Please enter the complete 6-digit verification OTP code.');
      return;
    }

    setVerifying(true);

    try {
      const msg = await authService.verifyEmail({
        email: email.trim().toLowerCase(),
        otp: trimmedOtp,
      });

      setSuccessMsg(
        typeof msg === 'string' && msg.length > 0
          ? msg
          : 'Email verified successfully! Your account is now active.'
      );

      // CHANGE: Consistent 5-second display duration before auto-redirecting to login
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 5000);
    } catch (err) {
      console.error('OTP Verification error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'OTP verification failed. Invalid or expired verification code.';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  // =========================================================
  // RESEND OTP
  // =========================================================
  const handleResendOtp = async () => {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address before requesting an OTP.');
      return;
    }

    setError(null);
    setResending(true);

    try {
      const msg = await authService.requestVerificationOtp(email.trim());
      setSuccessMsg(
        typeof msg === 'string' && msg.length > 0
          ? msg
          : 'A new verification OTP has been sent to your email.'
      );
    } catch (err) {
      console.error('Resend OTP error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Failed to resend OTP. Please try again.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  // Reset to Step 1 (e.g. to change email address)
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
              <KeyRound size={20} />
            </div>
            <div>
              <h3>Verify Email Address</h3>
              <span className="role-pill-compact role-customer">
                {step === 1 ? 'REQUEST VERIFICATION OTP' : 'ENTER VERIFICATION OTP'}
              </span>
            </div>
          </div>
        </div>

        {/* Informational description */}
        <p className="auth-modal-desc" style={{ fontSize: '0.88rem', color: '#4B5563', margin: '0.75rem 0 1rem 0' }}>
          {step === 1
            ? "Enter your registered account email address below. We'll send a 6-digit verification code to activate your account."
            : `Enter the 6-digit verification code sent to ${email}.`}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="error-alert compact-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="success-alert compact-alert">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =====================================================
            STEP 1: REQUEST OTP FORM (Email ONLY)
            ===================================================== */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate className="auth-form compact-form">
            <div className="form-group compact-group">
              <label>Registered Email Address *</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="e.g. customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sendingOtp}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingOtp}
              className="btn-primary btn-block compact-submit-btn"
            >
              {sendingOtp ? (
                <>
                  <RefreshCw className="spinner" size={16} />
                  <span>Sending OTP Code...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Verification OTP</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* =====================================================
            STEP 2: VERIFY OTP FORM (Revealed after OTP is sent)
            ===================================================== */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} noValidate className="auth-form compact-form">
            <div className="form-group compact-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>6-Digit Verification OTP *</label>
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="btn-link-action"
                  style={{ fontSize: '0.78rem' }}
                >
                  Change Email
                </button>
              </div>

              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon" />
                <input
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
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify Email & Activate Account</span>
                </>
              )}
            </button>

            {/* Resend Action */}
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || verifying}
                className="btn-link-action"
                style={{ fontSize: '0.85rem' }}
              >
                {resending ? 'Sending new OTP code...' : "Didn't receive the code? Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="compact-auth-footer" style={{ marginTop: '1.25rem' }}>
          <p>
            <Link to="/login">
              <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
