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
  type: 'general' | 'specialized' | 'meditation';
  description: string;
  price: number;
  capacity: number;
  enrolled: number;
  instructor: string;
  image: string;
  recurringDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  specializedTopic?: SpecializedTopic;
  nextOccurrence?: string; // ISO date string
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