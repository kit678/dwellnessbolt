import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, User as UserIcon, LogOut, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user } = useAuthStore();
  const auth = useAuth();
  const { logout, loading } = auth;
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, navigate]);

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center" aria-label="Home">
              <Calendar className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">WellnessHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link to="/sessions" className="text-gray-700 hover:text-indigo-600">
              Sessions
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600">
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-indigo-600">
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center text-gray-700 hover:text-indigo-600 disabled:opacity-50"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center text-gray-700 hover:text-indigo-600"
              >
                <UserIcon className="h-5 w-5 mr-1" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="sm:hidden" role="menu" aria-label="Mobile Navigation">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/sessions"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Sessions
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  disabled={isLoggingOut || loading}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 disabled:opacity-50"
                  role="menuitem"
                  aria-label="Logout"
                >
                  {isLoggingOut || loading ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
