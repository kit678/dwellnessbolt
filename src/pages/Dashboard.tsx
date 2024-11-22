import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from '../types';
import { useAuthStore } from '../store/authStore';
import { useBookings } from '../hooks/useBookings';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { getUserBookings, loading } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false); // Added state to track fetching

  useEffect(() => {
    console.log('Dashboard mounted. User:', user);
    const fetchBookings = async () => {
      if (user && !hasFetched) { // Check if bookings have not been fetched yet
        console.log('Fetching bookings for user:', user);
        try {
          const userBookings = await getUserBookings();
          console.log('Fetched bookings:', userBookings);
          setBookings(userBookings);
          setHasFetched(true); // Mark as fetched
        } catch (err) {
          console.error('Failed to fetch bookings:', err);
          setError('Failed to load bookings. Please try again later.');
        }
      }
    };
    fetchBookings();
  }, [user, hasFetched, getUserBookings]); // Added hasFetched to dependencies

  if (loading) {
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
    </div>
  );
}
