import { useState } from 'react';
import { collection, addDoc, query, where, getDocs, doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { RecurringSession, Booking } from '../types/index';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

export function useBookings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);


  const bookSession = async (session: RecurringSession, scheduledDate: string) => {
    console.log('bookSession called with user:', user);
    try {
    if (!user) {
      console.error('User or user ID is undefined');
      toast.error('Please log in to book a session');
      return;
    }
    logger.info(`Received scheduledDate in bookSession: ${scheduledDate}`, 'useBookings');
      // Check for existing confirmed booking for the same session and date to avoid double bookings
      logger.debug(`Checking existing bookings for scheduledDate: ${scheduledDate}`, 'useBookings');
      const existingBookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
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
      logger.debug(`Checking session capacity for scheduledDate: ${scheduledDate}`, 'useBookings');
      const sessionRef = doc(db, 'sessions', session.id);
      const sessionDoc = await getDoc(sessionRef);
      const sessionData = sessionDoc.data();
      const dateKey = scheduledDate;

      if (sessionData?.bookings?.[dateKey]?.remainingCapacity <= 0) {
        toast.error('No available slots for the selected date.');
        return;
      }

      // Check for existing pending booking
      const pendingBookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        where('sessionId', '==', session.id),
        where('scheduledDate', '==', scheduledDate),
        where('status', '==', 'pending')
      );
      const pendingBookingsSnapshot = await getDocs(pendingBookingsQuery);

      if (!pendingBookingsSnapshot.empty) {
        const existingBooking = pendingBookingsSnapshot.docs[0];
        console.log('Reusing existing pending booking:', existingBooking.id);
        return existingBooking.data().stripeSessionId;
      }

      logger.debug(`Creating new booking with scheduledDate: ${scheduledDate}`, 'useBookings');
      logger.info(`Inserting booking document with userId: ${user.uid}, sessionId: ${session.id}, scheduledDate: ${scheduledDate}`, 'useBookings');
      // Create new booking
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        sessionId: session.id,
        session,
        status: 'pending',
        bookedAt: new Date().toISOString(),
        scheduledDate: scheduledDate
      });

      // Create new Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          bookingId: bookingRef.id,
          userId: user.uid,
          amount: session.price * 100,
          metadata: {
            bookingId: bookingRef.id,
            userId: user.uid,
            sessionId: session.id,
            sessionDate: scheduledDate,
            sessionTitle: session.title,
            sessionPrice: session.price.toString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create checkout session:', errorText);
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      console.log('Checkout session created:', data);

      // Update booking with Stripe session ID
      await updateDoc(bookingRef, { stripeSessionId: data.sessionId });

      return data.sessionId;

    } catch (error) {
      console.error('Error in bookSession:', error);
      toast.error('Failed to process booking');
    } finally {
      setLoading(false);
    }
  };

  const getUserBookings = async (): Promise<Booking[]> => {
    setLoading(true);
    if (!user) {
      console.error('User or user ID is undefined');
      setLoading(false);
      return [];
    }

    try {
      console.log('Querying bookings for user:', user.uid);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
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
          throw new Error('Cannot cancel a pending booking. Please delete it instead.');
        }

        const sessionRef = doc(db, 'sessions', bookingData.sessionId);
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists()) {
          throw new Error('Session does not exist!');
        }
        const sessionData = sessionDoc.data();

        // Update booking status to 'cancelled'
        transaction.update(bookingRef, { status: 'cancelled' });

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

        if (bookingData.status === 'confirmed') {
          throw new Error('Cannot delete a confirmed booking. Please cancel it first.');
        }

        // Delete the booking if it's pending or cancelled
        transaction.delete(bookingRef);
      });
      toast.success('Booking deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete booking');
      console.error('Transaction failure:', error);
    }
  };
  const getNextSpecializedTopic = () => {
    const currentDate = new Date();
    const topics = ['Stress Management', 'Diabetes & Hypertension', 'Weight Loss', 'PCOS/Women\'s Health', 'Meditation & Breathwork', 'General Wellness Class'];
    const startDate = new Date('2023-01-01'); // Example start date
    const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return topics[weeksSinceStart % topics.length];
  };

  return {
    loading,
    bookSession,
    getUserBookings,
    cancelBooking,
    getNextSpecializedTopic,
    deleteBooking
  };
}
