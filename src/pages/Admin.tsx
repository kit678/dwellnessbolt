import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Plus, Calendar as CalendarIcon, BarChart2, RefreshCw } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { useAdmin } from '../hooks/useAdmin';
import AdminCalendar from '../components/AdminCalendar';
import Analytics from '../components/Analytics';
import SessionForm from '../components/SessionForm';
import { RecurringSession as Session } from '../types/index';
import toast from 'react-hot-toast';

export default function Admin() {
  const [view, setView] = useState<'calendar' | 'analytics'>('calendar');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);
  const { loading, createSession, updateSession, deleteSession, getAnalytics } = useAdmin();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const analytics = await getAnalytics();
      const sessionsData = analytics.sessionsData.map((session: any) => ({
        ...session,
        title: session.title || 'Default Title',
        startTime: session.startTime || new Date(),
        endTime: session.endTime || new Date(),
      }));
      setAnalyticsData(analytics);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleResetSessions = async () => {
    if (window.confirm('Are you sure you want to reset all sessions? This will delete existing sessions and create new ones.')) {
      setIsResetting(true);
      try {
        await fetchData();
        toast.success('Sessions have been reset successfully');
      } catch (error) {
        console.error('Failed to reset sessions:', error);
        toast.error('Failed to reset sessions');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleSubmit = async (data: Omit<Session, 'id'>) => {
    try {
      if (selectedSession) {
        await updateSession(selectedSession.id, data);
      } else {
        await createSession(data);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await deleteSession(sessionId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-md ${
              view === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            <CalendarIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`px-4 py-2 rounded-md ${
              view === 'analytics'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            <BarChart2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleResetSessions}
            disabled={isResetting}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
            Reset Sessions
          </button>
          <button
            onClick={() => {
              setSelectedSession(null);
              setIsFormOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Session
          </button>
        </div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {view === 'calendar' ? (
          <AdminCalendar
            sessions={sessions}
            onSelectEvent={(session) => {
              setSelectedSession(session);
              setIsFormOpen(true);
            }}
          />
        ) : (
          analyticsData && <Analytics data={analyticsData} />
        )}
      </m.div>

      {/* Session Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              {selectedSession ? 'Edit Session' : 'New Session'}
            </Dialog.Title>
            <SessionForm
              onSubmit={handleSubmit}
              initialData={selectedSession || undefined}
              loading={loading}
            />
            {selectedSession && (
              <button
                onClick={() => handleDelete(selectedSession.id)}
                className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete Session
              </button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
