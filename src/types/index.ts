export interface QuizResult {
  id: string;
  userId: string;
  completedAt: string;
  answers: number[];
  scores: {
    Vata: number;
    Pitta: number;
    Kapha: number;
  };
  dominantDosha: string;
  secondaryDosha: string | null;
  percentages: {
    Vata: number;
    Pitta: number;
    Kapha: number;
  };
  version: string;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  name: string;
  role: 'user' | 'admin';
  authProvider: 'google' | 'email';
  createdAt: string;
  lastLoginAt: string;
  quizCompleted: boolean;
  dosha: string | null;
  secondaryDosha: string | null;
  quizResults: QuizResult[];
  lastQuizDate: string | null;
  bookings: string[];
  quizProgress?: {
    currentQuestion: number;
    answers: number[];
    lastUpdated: string;
  };
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
