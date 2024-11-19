import { 
  collection, 
  getDocs, 
  writeBatch,
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getNextDayOccurrence } from '../utils/dateUtils';
import toast from 'react-hot-toast';

// Helper function to get next occurrence of a day
const offerings = [
  // Sunday General Class
  {
    title: 'General Wellness Class',
    type: 'general',
    description: 'A comprehensive wellness session focusing on overall health and fitness.',
    price: 15,
    capacity: 20,
    enrolled: 0,
    startTime: getNextDayOccurrence(0, 8, 0).toISOString(), // Sunday 8:00 AM
    endTime: getNextDayOccurrence(0, 9, 0).toISOString(), // Sunday 9:00 AM
    instructor: 'Dwellness',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80',
    recurringDays: [0]
  },
  // Monday & Wednesday Classes
  {
    title: 'General Wellness Class',
    type: 'general',
    description: 'A comprehensive wellness session focusing on overall health and fitness.',
    price: 15,
    capacity: 20,
    enrolled: 0,
    startTime: getNextDayOccurrence(1, 19, 0).toISOString(), // Monday 7:00 PM
    endTime: getNextDayOccurrence(1, 20, 0).toISOString(), // Monday 8:00 PM
    instructor: 'Dwellness',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80',
    recurringDays: [1, 3]
  }
];

export const resetAndInitializeSessions = async () => {
  try {
    console.log('Starting sessions reset and initialization...');
    
    // Get reference to sessions collection
    const sessionsRef = collection(db, 'sessions');
    
    // Delete all existing sessions
    console.log('Deleting existing sessions...');
    const snapshot = await getDocs(sessionsRef);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
    }
    console.log(`Deleted ${snapshot.size} existing sessions`);

    // Add new sessions in batches
    console.log('Creating new sessions...');
    const batchSize = 2;
    for (let i = 0; i < offerings.length; i += batchSize) {
      const currentBatch = writeBatch(db);
      const currentOfferings = offerings.slice(i, i + batchSize);
      
      currentOfferings.forEach(offering => {
        const newDocRef = doc(sessionsRef);
        currentBatch.set(newDocRef, offering);
      });
      
      await currentBatch.commit();
      console.log(`Added batch of ${currentOfferings.length} sessions`);
    }

    console.log(`Created ${offerings.length} new sessions`);
    toast.success('Sessions have been reset and reinitialized');
    return true;
  } catch (error) {
    console.error('Error in resetAndInitializeSessions:', error);
    toast.error('Failed to reset and initialize sessions');
    throw error;
  }
};