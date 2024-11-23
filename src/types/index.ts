export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  name: string;
  role: string;
  quizCompleted: boolean;
  dosha: string | null;
  // Add other properties as needed
}

export interface Booking {
  id: string;
  userId: string;
  sessionId: string;
  session: RecurringSession;
  status: 'confirmed' | 'cancelled';
  bookedAt: string;
  scheduledDate: string;
}

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
}

export type SpecializedTopic = 
  | 'Stress Management'
  | 'Diabetes & Hypertension'
  | 'Weight Loss'
  | 'PCOS/Women\'s Health';
