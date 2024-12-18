import { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { m } from 'framer-motion';
import { Clock, Users, DollarSign } from 'lucide-react';
import { RecurringSession } from '../types/index.js';
import { format, parseISO } from 'date-fns';
import { useBookings } from '../hooks/useBookings';
import { stripePromise } from '../lib/stripe.js';
import toast from 'react-hot-toast';

interface BookingModalProps {
  session: RecurringSession;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({
  session,
  isOpen,
  onClose,
}: BookingModalProps) {
  const { bookSession } = useBookings();
  const [selectedDate, setSelectedDate] = useState('');
  const [, setLoading] = useState(false);

  // Memoized available dates to prevent them from changing between renders
  const computeAvailableDates = (recurringDays: number[]) => {
    const dates: string[] = [];
    if (recurringDays.length === 0) return dates;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    let currentDate = new Date(today);

    while (dates.length < 4) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();

      if (recurringDays.includes(dayOfWeek)) {
        // Format date as 'yyyy-MM-dd' to ensure consistency
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        dates.push(dateStr);
      }
    }

    return dates;
  };

  const availableDates = useMemo(() => {
    const dates = computeAvailableDates(session.recurringDays || []);
    // Ensure bookings object has keys for all computed dates
    dates.forEach(date => {
      if (!session.bookings || !session.bookings[date]) {
        session.bookings = {
          ...session.bookings,
          [date]: { confirmedBookings: [], remainingCapacity: session.capacity }
        };
      }
    });
    return dates;
  }, [session]);

  const handleContinueToPayment = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const sessionId = await bookSession(session, selectedDate);
      if (sessionId) {
        const stripe = await stripePromise;
        const { error } = await stripe!.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
          toast.error('Failed to redirect to payment');
        }
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Failed to process booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4"
        >
          <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
            'Book Session'
          </Dialog.Title>

              <div className="space-y-4 mb-6">
                <h3 className="text-xl font-semibold">{session.title}</h3>
                <p className="text-gray-600">{session.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>
                      {session.startTime} - {session.endTime} MST
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span>
                      {session.capacity - session.enrolled} spots available
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-5 w-5 mr-2" />
                    <span>${session.price}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Choose a date</option>
                    {availableDates.map((dateStr) => (
                      <option key={dateStr} value={dateStr}>
                        {format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueToPayment}
                  disabled={!selectedDate}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Continue to Payment
                </button>
              </div>
        </m.div>
      </div>
    </Dialog>
  );
}
