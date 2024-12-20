import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RecurringSession as Session } from '../types/index';
import toast from 'react-hot-toast';

export function useAdmin() {
  const [loading, setLoading] = useState(false);

  const createSession = async (sessionData: Omit<Session, 'id'>) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'sessions'), sessionData);
      toast.success('Session created successfully');
    } catch (error) {
      toast.error('Failed to create session');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSession = async (sessionId: string, sessionData: Partial<Session>) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'sessions', sessionId), sessionData);
      toast.success('Session updated successfully');
    } catch (error) {
      toast.error('Failed to update session');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      toast.success('Session deleted successfully');
    } catch (error) {
      toast.error('Failed to delete session');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAnalytics = async () => {
    try {
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
      
      const totalBookings = bookingsSnapshot.size;
      const totalRevenue = bookingsSnapshot.docs.reduce((acc, doc) => {
        const booking = doc.data();
        return acc + (booking.session?.price || 0);
      }, 0);
      
      const sessionStats = new Map();
      bookingsSnapshot.docs.forEach(doc => {
        const booking = doc.data();
        const sessionId = booking.sessionId;
        const current = sessionStats.get(sessionId) || 0;
        sessionStats.set(sessionId, current + 1);
      });

      return {
        totalBookings,
        totalRevenue,
        sessionsData: sessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          bookings: sessionStats.get(doc.id) || 0
        }))
      };
    } catch (error) {
      toast.error('Failed to fetch analytics');
      throw error;
    }
  };

  return {
    loading,
    createSession,
    updateSession,
    deleteSession,
    getAnalytics
  };
}
