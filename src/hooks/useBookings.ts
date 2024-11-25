import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { RecurringSession, Booking } from '../types/index';
import toast from 'react-hot-toast';

export function useBookings() {
  const { user } = useAuth();
  


  const bookSession = async (session: RecurringSession, scheduledDate: string) => {
    console.log('getUserBookings called');
    if (!user) {
      console.error('User or user ID is undefined');
      toast.error('Please log in to book a session');
      return null;
    }
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

      const data = await response.json();
      return data.sessionId;

    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error('Failed to process booking. Please try again later.');
    }
  }

  const getUserBookings = async (): Promise<Booking[]> => {
    if (!user) {
      console.error('User or user ID is undefined');
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
    const topics = ['Stress Management', 'Diabetes & Hypertension', 'Weight Loss', 'PCOS/Women\'s Health', 'Meditation & Breathwork', 'General Wellness Class'];
    const startDate = new Date('2023-01-01'); // Example start date
    const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return topics[weeksSinceStart % topics.length];
  };

  return {
    bookSession,
    getUserBookings,
    cancelBooking,
    getNextSpecializedTopic
  };
}
