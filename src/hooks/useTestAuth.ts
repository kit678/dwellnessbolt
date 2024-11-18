import { useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123'
};

export function useTestAuth() {
  const { user } = useAuthStore();

  useEffect(() => {
    // Only sign in if we're in development and no user is logged in
    if (process.env.NODE_ENV === 'development' && !user) {
      signInWithEmailAndPassword(auth, TEST_USER.email, TEST_USER.password)
        .catch(error => console.error('Test auth error:', error));
    }
  }, [user]);

  return { isTestUser: user?.email === TEST_USER.email };
}