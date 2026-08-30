import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Application-Level React Error Boundary
 *
 * Catches unexpected JavaScript runtime rendering errors anywhere in the React tree,
 * logs them for debugging, and displays a user-safe fallback UI without technical stack traces.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React application error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container page-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card text-center" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem', boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.1))', borderRadius: 'var(--radius-lg, 16px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-danger-bg, #FEF2F2)', color: 'var(--color-danger, #DC2626)', margin: '0 auto 1.5rem auto' }}>
              <AlertTriangle size={36} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-main, #1F2937)' }}>
              Something Went Wrong
            </h2>

            <p style={{ color: 'var(--color-text-muted, #6B7280)', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
              An unexpected error occurred while displaying this page. Your data is safe. Please refresh the page or return to the main home page.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={this.handleReload}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
              >
                <RefreshCw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={this.handleReset}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
              >
                <Home size={16} />
                <span>Go to Homepage</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
