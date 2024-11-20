export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export type SpecializedTopic = 
  | 'Stress Management'
  | 'Diabetes & Hypertension'
  | 'Weight Loss'
  | 'PCOS/Women\'s Health';

export interface RecurringSession {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  price: number;
  specializedTopic?: string;
  // Add other properties as needed
}

export interface Booking {
  id: string;
  userId: string;
  sessionId: string;
  session: RecurringSession;
  status: 'confirmed' | 'cancelled';
  bookedAt: string;
  scheduledDate: string; // The specific date booked for the recurring session
}