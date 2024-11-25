import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { m } from 'framer-motion';
import { Clock, Users, DollarSign, CreditCard } from 'lucide-react';
import { RecurringSession } from '../types/index';
import { format } from 'date-fns';
import { useBookings } from '../hooks/useBookings';
import { stripePromise } from '../lib/stripe';
import { getNextDayOccurrence } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface BookingModalProps {
  session: RecurringSession;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ session, isOpen, onClose }: BookingModalProps) {
  const { bookSession } = useBookings();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  // Generate next 4 available dates based on rotation
  const getAvailableDates = () => {
    const dates: Date[] = [];
    const recurringDays = session.recurringDays || [];
    
    if (recurringDays.length === 0) return dates;

    const today = new Date();
    let currentDate = new Date(today);

    while (dates.length < 4) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();

      if (recurringDays.includes(dayOfWeek)) {
        dates.push(new Date(currentDate));
      }
    }

    return dates;
  };

  const availableDates = getAvailableDates();

  const handleContinueToPayment = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    setShowPayment(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success('Booking confirmed! Check your email for confirmation.');
        onClose();
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
            {showPayment ? 'Payment Details' : 'Book Session'}
          </Dialog.Title>

          {!showPayment ? (
            <>
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
                    {availableDates.map((date) => (
                      <option key={date.toISOString()} value={date.toISOString()}>
                        {format(date, 'EEEE, MMMM d, yyyy')}
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
            </>
          ) : (
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Card Number
                </label>
                <div className="mt-1 relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="4242 4242 4242 4242"
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={paymentDetails.expiry}
                    onChange={(e) => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CVC
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={paymentDetails.cvc}
                    onChange={(e) => setPaymentDetails({...paymentDetails, cvc: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name on Card
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={paymentDetails.name}
                  onChange={(e) => setPaymentDetails({...paymentDetails, name: e.target.value})}
                />
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay $${session.price}`}
                </button>
              </div>
            </form>
          )}
        </m.div>
      </div>
    </Dialog>
  );
}
