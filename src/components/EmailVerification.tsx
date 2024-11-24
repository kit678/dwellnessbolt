import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function EmailVerification() {
  const { resendVerificationEmail, loading } = useAuth();
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    try {
      await resendVerificationEmail();
      setCountdown(60); // Start 60 second countdown
      toast.success('Verification email sent!');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent you a verification email. Please check your inbox and click the verification link.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="text-center">
            <button
              onClick={handleResendEmail}
              disabled={loading || countdown > 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {countdown > 0
                    ? `Resend in ${countdown}s`
                    : 'Resend verification email'}
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to login
            </button>
          </div>
        </div>
      </m.div>
    </div>
  );
}
