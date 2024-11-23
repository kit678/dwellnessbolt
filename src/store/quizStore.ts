import { create } from 'zustand';

interface QuizState {
  isCompleted: boolean;
  version: string;
  answers: number[];
  results: {
    Vata: number;
    Pitta: number;
    Kapha: number;
  } | null;
  percentages: {
    Vata: number;
    Pitta: number;
    Kapha: number;
  } | null;
  dominantDosha: string | null;
  secondaryDosha: string | null;
  completedAt: string | null;
  setQuizCompleted: (completed: boolean) => void;
  setQuizResults: (results: QuizResult) => void;
  reset: () => void;
}

const QUIZ_VERSION = '1.0.0';

export const useQuizStore = create<QuizState>((set) => ({
  isCompleted: false,
  version: QUIZ_VERSION,
  answers: [],
  results: null,
  percentages: null,
  dominantDosha: null,
  secondaryDosha: null,
  completedAt: null,
  setQuizCompleted: (completed) => set({ isCompleted: completed }),
  setQuizResults: (results) => set({
    results: results.scores,
    percentages: results.percentages,
    dominantDosha: results.dominantDosha,
    secondaryDosha: results.secondaryDosha,
    completedAt: results.completedAt,
    answers: results.answers,
    isCompleted: true
  }),
  reset: () => set({
    isCompleted: false,
    answers: [],
    results: null,
    percentages: null,
    dominantDosha: null,
    secondaryDosha: null,
    completedAt: null
  }),
}));
