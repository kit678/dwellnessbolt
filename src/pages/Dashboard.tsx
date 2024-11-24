import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Booking } from '../types/index';

import { logger } from '../utils/logger';
import { useBookings } from '../hooks/useBookings';
import OnboardingQuiz from '../components/OnboardingQuiz';
import { useAuth } from '@/hooks/useAuth';

logger.info('Dashboard component rendered', 'Dashboard');

export default function Dashboard() {
  logger.info('Dashboard component mounted', 'Dashboard');
  const { user, loading: authLoading } = useAuth();
  const { getUserBookings, loading: bookingsLoading } = useBookings();
  const { results } = useQuizStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  // Effect to handle automatic quiz modal display
  useEffect(() => {
    if (user && !user.quizCompleted) {
      console.log('User has not completed quiz - showing modal');
      setQuizOpen(true);
    }
  }, [user]);

  useEffect(() => {
    if (!hasFetched && user) {
      console.log('Fetching bookings for user:', user);
      console.log('Dashboard mounted. User:', user);
      console.log('Quiz Results:', results);
      console.log('Latest Quiz Result:', user.quizResults?.[user.quizResults.length - 1]);
      const fetchBookings = async () => {
        try {
          console.log('Attempting to fetch bookings for user:', user);
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
        }
      };
      fetchBookings();
    }
  }, [user, hasFetched, getUserBookings]);


  if (bookingsLoading || authLoading) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMMM d, yyyy');
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return isNaN(time.getTime()) ? 'Invalid time' : format(time, 'h:mm a');
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <User className="h-6 w-6 text-indigo-600" />
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
                        <Tooltip formatter={(value: number) => `${Math.round(value)}%`} />
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>
                    {formatDate(booking.scheduledDate)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>
                    {formatTime(booking.session.startTime)} -{' '}
                    {formatTime(booking.session.endTime)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-5 w-5 mr-2" />
                  <span>${booking.session.price}</span>
                </div>
              </div>
            </m.div>
          ))
        )}
      </div>
      <OnboardingQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} onComplete={() => setQuizOpen(false)} />
    </div>
  );
}
