import { useState } from 'react';
import { User } from '../types/index';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';

export function useUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const updateUserProfile = async (uid: string, data: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      await userService.updateUserProfile(uid, data);
      setUser({ ...useAuthStore.getState().user, ...data } as User);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateUserProfile
  };
}
