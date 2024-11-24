import { useState } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { RecurringSession, Booking } from '../types/index';
import toast from 'react-hot-toast';

export function useBookings() {
  const [loading, setLoading] = useState(false);
  const { user, setLoading } = useAuthStore();

  const bookSession = async (session: RecurringSession, scheduledDate: string) => {
    if (!user) {
      toast.error('Please log in to book a session');
      return;
    } finally {
      setLoading(false);
    }

    setLoading(true);
    setLoading(true);
    try {
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: user.id,
        sessionId: session.id,
        session,
        status: 'pending',
        bookedAt: new Date().toISOString(),
        scheduledDate
      });

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          bookingId: bookingRef.id,
          userId: user.id,
          amount: session.price * 100,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process booking');
      }

      toast.success('Booking confirmed successfully!');
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to process booking');
    } finally {
      setLoading(false);
    }
  };

  const getUserBookings = async (): Promise<Booking[]> => {
    if (!user || !user.id) {
      console.error('User or user ID is undefined');
      return [];
    }

    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.id)
      );
      const snapshot = await getDocs(bookingsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Booking));
    } catch (error) {
      toast.error('Failed to fetch bookings');
      console.error(error);
      return [];
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled'
      });
      toast.success('Booking cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel booking');
      console.error(error);
    }
  };

  const getNextSpecializedTopic = (currentDate: Date): string => {
    const topics = ['Stress Management', 'Diabetes & Hypertension', 'Weight Loss', 'PCOS/Women\'s Health'];
    const startDate = new Date('2023-01-01'); // Example start date
    const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return topics[weeksSinceStart % topics.length];
  };

  return {
    loading,
    bookSession,
    getUserBookings,
    cancelBooking,
    getNextSpecializedTopic
  };
}
