import { useEffect, useState, useCallback, useMemo } from 'react';
import { doc as firebaseDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../lib/firebase';
import { stripePromise } from '../lib/stripe';
import { Dialog } from '../components/ui/Dialog';
import { ProfilePicDialog } from '../components/ui/ProfilePicDialog';
import { m } from 'framer-motion';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DateTime } from 'luxon';
import { Booking } from '../types/index';
import { logger } from '../utils/logger';
import OnboardingQuiz from '../components/OnboardingQuiz';
import { useAuth } from '../hooks/useAuth';
import { useQuizStore } from '@/store/quizStore';
import { useBookings } from '@/hooks/useBookings';

logger.info('Dashboard component rendered', 'Dashboard');

export default function Dashboard() {
  logger.info('Dashboard component mounted', 'Dashboard');
  const { user, loading: authLoading } = useAuth();
  const { getUserBookings, cancelBooking, deleteBooking, bookSession } = useBookings() as any;
  const { results } = useQuizStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  // No changes needed here
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [profilePicModalOpen, setProfilePicModalOpen] = useState<boolean>(false);
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogConfirmAction, setDialogConfirmAction] = useState<(() => void) | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString);
    return date.isValid ? date.toFormat('MMMM d, yyyy') : 'Invalid date';
  };

  const formatTime = (timeString: string, fromTimeZone: string, toTimeZone: string) => {
    const date = DateTime.fromFormat(timeString, 'HH:mm', { zone: fromTimeZone });
    const zonedDate = date.setZone(toTimeZone);
    return zonedDate.toFormat('h:mm a zzz');
  };

  const isDevelopment = useMemo(() => import.meta.env.VITE_NODE_ENV === 'development', []);

  const handleDeleteBooking = useCallback(
    (bookingId: string) => {
      setDialogTitle('Delete Booking');
      setDialogMessage('Are you sure you want to delete this booking? This action cannot be undone.');
      setDialogConfirmAction(() => async () => {
        await deleteBooking(bookingId);
        setBookings((prevBookings) => prevBookings.filter(b => b.id !== bookingId));
        setDialogOpen(false);
      });
      setDialogOpen(true);
    },
    [deleteBooking]
  );

  const handleCancelBooking = useCallback(
    (booking: Booking) => {
      const bookingDate = new Date(`${booking.scheduledDate}T${booking.session.startTime}`).getTime();
      const now = Date.now();
      const isWithin24Hours = bookingDate - now < 24 * 60 * 60 * 1000;
      const isInPast = bookingDate < now;

      if (isInPast || isWithin24Hours) {
        setDialogTitle('Cannot Cancel Booking');
        setDialogMessage('This booking cannot be canceled because it is either in the past or within 24 hours of the scheduled time.');
        setDialogConfirmAction(() => () => setDialogOpen(false));
        setDialogOpen(true);
      } else {
        setDialogTitle('Cancel Booking');
        setDialogMessage('Are you sure you want to cancel this booking?');
        setDialogConfirmAction(() => () => {
          cancelBooking(booking.id);
          setBookings((prevBookings) => prevBookings.filter(b => b.id !== booking.id));
          setDialogOpen(false);
        });
        setDialogOpen(true);
      }
    },
    [cancelBooking]
  );

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        logger.info(`Attempting to fetch bookings for user: ${user}`, 'Dashboard');
        const userBookings = await getUserBookings();
        console.log('Fetched bookings:', userBookings);
        console.log('Setting bookings state');
        setBookings(userBookings);
        setHasFetched(true);

        if (user.quizCompleted) {
          console.log('Quiz results fetched:', user.dosha);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (!user.quizCompleted) {
      logger.info('User has not completed quiz - showing modal', 'Dashboard');
      setQuizOpen(true);
    }

    if (!hasFetched) {
      logger.info(`Fetching bookings for user: ${user}`, 'Dashboard');
      logger.info(`Dashboard mounted. User: ${user}`, 'Dashboard');
      logger.info(`Quiz Results: ${JSON.stringify(results)}`, 'Dashboard');
      logger.info(`Latest Quiz Result: ${JSON.stringify(user.quizResults?.[user.quizResults.length - 1])}`, 'Dashboard');
      fetchBookings();
    }
  }, [user, hasFetched, getUserBookings, results]);

  if (loading || authLoading) {
    console.log('Loading bookings...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    console.log('Error loading bookings:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Attempt to enlarge the Google profile image if applicable
  const enlargedProfilePicUrl = user?.profile_pic
    ? user.profile_pic.replace('=s96-c', '=s400-c')
    : '';

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-full overflow-hidden">
            {user?.profile_pic ? (
              <img
                src={user.profile_pic}
                alt="Profile"
                className="h-12 w-12 rounded-full cursor-pointer"
                onClick={() => setProfilePicModalOpen(true)}
              />
            ) : (
              <User className="h-6 w-6 text-indigo-600" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Quiz Section */}
      {user && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {!user.quizCompleted ? (
            <div className="text-center">
              <p className="text-yellow-800">You haven't completed your onboarding quiz yet. Please complete it to get personalized recommendations.</p>
              <button 
                onClick={() => setQuizOpen(true)} 
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Complete Quiz
              </button>
            </div>
          ) : user.quizResults?.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-center">Your Dosha Profile</h3>
                <button 
                  onClick={() => setQuizOpen(true)} 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Retake Quiz
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dosha Distribution Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-4 text-center">Dosha Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Vata', value: user.quizResults?.[user.quizResults.length - 1]?.percentages?.Vata || 0 },
                            { name: 'Pitta', value: user.quizResults?.[user.quizResults.length - 1]?.percentages?.Pitta || 0 },
                            { name: 'Kapha', value: user.quizResults?.[user.quizResults.length - 1]?.percentages?.Kapha || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#FF9F40" /> {/* Vata */}
                          <Cell fill="#FF6B6B" /> {/* Pitta */}
                          <Cell fill="#4ECDC4" /> {/* Kapha */}
                        </Pie>
                        <Tooltip formatter={(value: string | number | (string | number)[]) => `${Math.round(Number(value))}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-4 mt-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#FF9F40] rounded-full mr-2"></div>
                      <span>Vata</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#FF6B6B] rounded-full mr-2"></div>
                      <span>Pitta</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#4ECDC4] rounded-full mr-2"></div>
                      <span>Kapha</span>
                    </div>
                  </div>
                </div>

                {/* Dosha Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-4">Your Dosha Details</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600">Dominant Dosha</p>
                      <p className="text-xl font-semibold text-indigo-600">{user.dosha}</p>
                    </div>
                    {user.secondaryDosha && (
                      <div>
                        <p className="text-gray-600">Secondary Dosha</p>
                        <p className="text-xl font-semibold text-indigo-500">{user.secondaryDosha}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Last Quiz Taken</p>
                      <p className="text-lg">{new Date(user.lastQuizDate || '').toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-yellow-800">Your quiz results are not available. Please retake the quiz.</p>
              <button 
                onClick={() => setQuizOpen(true)} 
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
      
      <div className="grid grid-cols-1 gap-8">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">You haven't made any bookings yet.</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <m.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {booking.session.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{booking.session.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  {booking.status !== 'confirmed' && (
                    <button
                      onClick={async () => {
                        try {
                          const sessionRef = firebaseDoc(db, 'sessions', booking.sessionId);
                          const sessionDoc = await getDoc(sessionRef);
                          const sessionData = sessionDoc.data();
                          const dateKey = booking.scheduledDate;

                          if (sessionData?.bookings?.[dateKey]?.remainingCapacity > 0) {
                            const sessionId = await bookSession(booking.session, booking.scheduledDate);
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
                          } else {
                            toast.error('No slots available for the selected date. Please choose another date.');
                          }
                        } catch (error) {
                          console.error('Error completing booking:', error);
                          toast.error('Failed to complete booking');
                        }
                      }}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      Complete Booking
                    </button>
                  )}
                  {isDevelopment && (
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      Trash
                    </button>
                  )}
                  {booking.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelBooking(booking)}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{formatDate(booking.scheduledDate)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>
                    {formatTime(booking.session.startTime, 'America/Denver', Intl.DateTimeFormat().resolvedOptions().timeZone)} - {formatTime(booking.session.endTime, 'America/Denver', Intl.DateTimeFormat().resolvedOptions().timeZone)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-5 w-5 mr-2" />
                  <span>${booking.session.price}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>Booked At: {formatDate(booking.bookedAt)} {formatTime(new Date(booking.bookedAt).toLocaleTimeString(), 'America/Denver', Intl.DateTimeFormat().resolvedOptions().timeZone)}</span>
                </div>
              </div>
            </m.div>
          ))
        )}
      </div>
      <OnboardingQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} onComplete={(_scores) => setQuizOpen(false)} />

      <Dialog
        isOpen={dialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        onClose={() => setDialogOpen(false)}
        onConfirm={dialogConfirmAction}
        confirmText={dialogTitle === 'Cannot Cancel Booking' ? 'Ok' : 'Yes'}
        cancelText={dialogTitle === 'Cannot Cancel Booking' ? undefined : 'No'}
      />

      {/* Profile Pic Modal with only a close (X) button in top-right and enlarged image */}
      <ProfilePicDialog
        isOpen={profilePicModalOpen}
        imageUrl={enlargedProfilePicUrl}
        onClose={() => setProfilePicModalOpen(false)}
      />
    </div>
  );
}
