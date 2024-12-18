import { create } from 'zustand';
import { QuizResult } from '../types/index';
import { logger } from '../utils/logger';

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
  isLoadingResults: boolean;
  setIsLoadingResults: (loading: boolean) => void;
  setQuizCompleted: (completed: boolean) => void;
  setQuizResults: (results: QuizResult) => void;
  reset: () => void;
}

const QUIZ_VERSION = '1.0.0';

export const useQuizStore = create<QuizState>((set) => ({
  isCompleted: false,
  isLoadingResults: false,
  version: QUIZ_VERSION,
  answers: [],
  results: null,
  percentages: null,
  dominantDosha: null,
  secondaryDosha: null,
  completedAt: null,
  setQuizCompleted: (completed) => set({ isCompleted: completed }),
  setQuizResults: (results) => {
    set((state) => ({ isCompleted: !state.isCompleted })); // Toggle to force re-render
    logger.info('Quiz results updated in quizStore', 'quizStore');
    set({
      results: results.scores,
      percentages: results.percentages,
      dominantDosha: results.dominantDosha,
      secondaryDosha: results.secondaryDosha,
      completedAt: results.completedAt,
      answers: results.answers,
      isCompleted: true
    });
  },
  setIsLoadingResults: (loading) => set({ isLoadingResults: loading }),
  reset: () => set({
    isCompleted: false,
    isLoadingResults: false,
    answers: [],
    results: null,
    percentages: null,
    dominantDosha: null,
    secondaryDosha: null,
    completedAt: null
  }),
}));
