import { useState } from 'react';
import { collection, addDoc, query, where, getDocs, doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { RecurringSession, Booking } from '../types/index';
import toast from 'react-hot-toast';

export function useBookings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);


  const bookSession = async (session: RecurringSession, scheduledDate: string) => {
    console.log('bookSession called with user:', user);
    if (!user) {
      console.error('User or user ID is undefined');
      toast.error('Please log in to book a session');
      return;
    }
    try {
      // Check for existing confirmed booking for the same session and date to avoid double bookings
      const existingBookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.id),
        where('sessionId', '==', session.id),
        where('scheduledDate', '==', scheduledDate),
        where('status', '==', 'confirmed')
      );
      const existingBookingsSnapshot = await getDocs(existingBookingsQuery);

      if (!existingBookingsSnapshot.empty) {
        toast.error('You have already booked this session on the selected date.');
        return;
      }

      // Check session capacity
      const sessionRef = doc(db, 'sessions', session.id);
      const sessionDoc = await getDoc(sessionRef);
      const sessionData = sessionDoc.data();
      const dateKey = scheduledDate;

      if (sessionData?.bookings?.[dateKey]?.remainingCapacity <= 0) {
        toast.error('No available slots for the selected date.');
        return;
      }

      // Create booking
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: user.id,
        sessionId: session.id,
        session,
        status: 'pending',
        bookedAt: new Date().toISOString(),
        scheduledDate
      });


      console.log('Creating checkout session with:', {
        sessionId: session.id,
        bookingId: bookingRef.id,
        userId: user.id,
        amount: session.price * 100,
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
        const errorText = await response.text();
        console.error('Failed to create checkout session:', errorText);
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      console.log('Checkout session created:', data);
      return data.sessionId;

    } catch (error) {
      console.error('Error in bookSession:', error);
      toast.error('Failed to process booking');
    } finally {
      setLoading(false);
    }
  }

  const getUserBookings = async (): Promise<Booking[]> => {
    setLoading(true);
    if (!user) {
      console.error('User or user ID is undefined');
      setLoading(false);
      return [];
    }

    try {
      console.log('Querying bookings for user:', user.id);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.id)
      );
      const snapshot = await getDocs(bookingsQuery);
      const bookings: Booking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Booking));
      console.log('Bookings fetched:', bookings);
      return bookings;
    } catch (error) {
      toast.error('Failed to fetch bookings');
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string): Promise<void> => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) {
          throw new Error('Booking does not exist!');
        }
        const bookingData = bookingDoc.data();
        if (bookingData.status !== 'confirmed') {
          throw new Error('Only confirmed bookings can be cancelled.');
        }

        // Update booking status to 'cancelled'
        transaction.update(bookingRef, { status: 'cancelled' });

        const sessionRef = doc(db, 'sessions', bookingData.sessionId);
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists()) {
          throw new Error('Session does not exist!');
        }
        const sessionData = sessionDoc.data();

        if (sessionData.bookings && sessionData.bookings[bookingData.scheduledDate]) {
          const dateBooking = sessionData.bookings[bookingData.scheduledDate];

          // Remove from confirmedBookings
          const confirmedBookings = dateBooking.confirmedBookings.filter((b: any) => b.bookingId !== bookingId);
          transaction.update(sessionRef, {
            [`bookings.${bookingData.scheduledDate}.confirmedBookings`]: confirmedBookings
          });
    
          // Recompute remainingCapacity based on confirmedBookings
          const newRemainingCapacity = sessionData.capacity - confirmedBookings.length;
          transaction.update(sessionRef, {
            [`bookings.${bookingData.scheduledDate}.remainingCapacity`]: newRemainingCapacity
          });
        } else {
          throw new Error('Booking date data does not exist in session.');
        }
      });
      toast.success('Booking cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
      console.error('Transaction failure:', error);
    }
  };

  const deleteBooking = async (bookingId: string): Promise<void> => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) {
          throw new Error('Booking does not exist!');
        }
        const bookingData = bookingDoc.data();

        // If booking is confirmed, update session's remainingCapacity and confirmedBookings
        if (bookingData.status === 'confirmed') {
          const sessionRef = doc(db, 'sessions', bookingData.sessionId);
          const sessionDoc = await transaction.get(sessionRef);
          if (!sessionDoc.exists()) {
            throw new Error('Session does not exist!');
          }
          const sessionData = sessionDoc.data();

          if (sessionData.bookings && sessionData.bookings[bookingData.scheduledDate]) {
            const dateBooking = sessionData.bookings[bookingData.scheduledDate];

            // Remove from confirmedBookings
            const confirmedBookings = dateBooking.confirmedBookings.filter((b: any) => b.bookingId !== bookingId);
            transaction.update(sessionRef, {
              [`bookings.${bookingData.scheduledDate}.confirmedBookings`]: confirmedBookings
            });
    
            // Recompute remainingCapacity based on confirmedBookings
            const newRemainingCapacity = sessionData.capacity - confirmedBookings.length;
            transaction.update(sessionRef, {
              [`bookings.${bookingData.scheduledDate}.remainingCapacity`]: newRemainingCapacity
            });
          } else {
            throw new Error('Booking date data does not exist in session.');
          }
        }

        // Delete the booking
        transaction.delete(bookingRef);
      });
      toast.success('Booking deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete booking');
      console.error('Transaction failure:', error);
    }
  };
  const currentDate = new Date();
  const topics = ['Stress Management', 'Diabetes & Hypertension', 'Weight Loss', 'PCOS/Women\'s Health', 'Meditation & Breathwork', 'General Wellness Class'];
  const startDate = new Date('2023-01-01'); // Example start date
  const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const getNextSpecializedTopic = () => topics[weeksSinceStart % topics.length];

  return {
    loading,
    bookSession,
    getUserBookings,
    cancelBooking,
    getNextSpecializedTopic,
    deleteBooking
  };
}
