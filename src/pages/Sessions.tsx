import React from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import SessionCard from '../components/SessionCard';
import BookingModal from '../components/BookingModal';
import { RecurringSession } from '../types/index';
import { useSessions } from '../hooks/useSessions';
import { useAuth } from '@/hooks/useAuth';


export default function Sessions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions, loading, error } = useSessions();
  const [selectedSession, setSelectedSession] = React.useState<RecurringSession | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleBooking = (session: RecurringSession) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Error Loading Sessions</h2>
          <p className="mt-4 text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Sessions</h1>
        
        {sessions.length === 0 ? (
          <div className="text-center">
            <p className="text-lg text-gray-500">No sessions available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onBook={() => handleBooking(session)}
              />
            ))}
          </div>
        )}
      </m.div>

      {selectedSession && (
        <BookingModal
          session={selectedSession}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
}