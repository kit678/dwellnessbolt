import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { logger } from '../utils/logger';
import { db } from '../lib/firebase';
import { RecurringSession } from '../types';
import toast from 'react-hot-toast';

export function useSessions() {
  const [sessions, setSessions] = useState<RecurringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all sessions without filtering
        const sessionsRef = collection(db, 'sessions');
        const snapshot = await getDocs(sessionsRef);
        
        if (isMounted) {
          if (snapshot.empty) {
            setError('No sessions available');
            setSessions([]);
          } else {
            const sessionData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as RecurringSession[];
            setSessions(sessionData);
            logger.info('Fetched sessions from Firestore:', JSON.stringify(sessionData, null, 2));
          }
        }
      } catch (error: any) {
        console.error('Error fetching sessions:', error);
        if (isMounted) {
          const errorMessage = error?.message || 'Failed to load sessions';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  return { sessions, loading, error };
}
