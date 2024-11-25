// src/hooks/useBookings.ts

import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { RecurringSession, Booking } from '../types/index';
import toast from 'react-hot-toast';

export function useBookings() {
  const { user } = useAuth();

  const bookSession = async (session: RecurringSession, scheduledDate: string) => {
    if (!user) {
      console.error('User or user ID is undefined');
      toast.error('Please log in to book a session');
      return null;
    }
    try {
      // Check for existing bookings for the same session and date
      const existingBookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.id),
        where('sessionId', '==', session.id),
        where('scheduledDate', '==', scheduledDate)
      );
      const existingBookingsSnapshot = await getDocs(existingBookingsQuery);
      if (!existingBookingsSnapshot.empty) {
        toast.error('You already have a booking for this session on the selected date.');
        return null;
      }

      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: user.id,
        sessionId: session.id,
        session,
        status: 'pending',
        bookedAt: new Date().toISOString(),
        scheduledDate
      });

      const response = await fetch(`http://localhost:5000/api/stripe/create-checkout-session`, {
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

      const data = await response.json();
      return data.sessionId;

    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error('Failed to process booking. Please try again later.');
    }
  };

  // ... rest of your code
}
