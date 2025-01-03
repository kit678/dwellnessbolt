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
  profile_pic?: string;
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
  status: 'confirmed' | 'cancelled' | 'pending';
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
  image?: string;
  recurringDays: number[];
  bookings?: {
    [date: string]: {
      confirmedBookings: Array<{ userId: string; bookingId: string }>;
      remainingCapacity: number;
    };
  };
}

export type SpecializedTopic = 
  | 'Stress Management'
  | 'Diabetes & Hypertension'
  | 'Weight Loss'
  | 'PCOS/Women\'s Health';
