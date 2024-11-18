import { useState } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { RecurringSession, Booking } from '../types';
import toast from 'react-hot-toast';

export function useBookings() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const bookSession = async (session: RecurringSession, scheduledDate: string) => {
    if (!user) {
      toast.error('Please log in to book a session');
      return;
    }

    setLoading(true);
    try {
      // Create a booking document
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: user.id,
        sessionId: session.id,
        session,
        status: 'pending',
        bookedAt: new Date().toISOString(),
        scheduledDate
      });

      // For local development, use the mock endpoint
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          bookingId: bookingRef.id,
          userId: user.id,
          amount: session.price * 100, // Convert to cents
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
    if (!user) return [];

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

  return {
    loading,
    bookSession,
    getUserBookings,
    cancelBooking
  };
}