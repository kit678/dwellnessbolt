import { create } from 'zustand';

interface QuizState {
  isCompleted: boolean;
  results: {
    Vata: number;
    Pitta: number;
    Kapha: number;
  } | null;
  setQuizCompleted: (completed: boolean) => void;
  setQuizResults: (results: { Vata: number; Pitta: number; Kapha: number }) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  isCompleted: false,
  results: null,
  setQuizCompleted: (completed) => set({ isCompleted: completed }),
  setQuizResults: (results) => set({ results, isCompleted: true }),
  reset: () => set({ isCompleted: false, results: null }),
}));
