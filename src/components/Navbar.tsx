import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Menu, X, User as UserIcon, LogOut, Calendar } from 'lucide-react';
import { useTestAuth } from '../hooks/useTestAuth';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(false);
  
  // This will automatically sign in the test user in development
  useTestAuth();

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
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
                  onClick={() => logout()}
                  className="flex items-center text-gray-700 hover:text-indigo-600"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
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
              className="text-gray-700 hover:text-indigo-600"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/sessions"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
            >
              Sessions
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600"
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