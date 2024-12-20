import { QuizResult } from '../types/index';

export function calculateQuizResults(answers: number[], userId: string): QuizResult {
  // Calculate raw scores
  const scores = {
    Vata: answers.filter(a => a === 0).length,
    Pitta: answers.filter(a => a === 1).length,
    Kapha: answers.filter(a => a === 2).length
  };

  // Calculate percentages
  const total = answers.length;
  const percentages = {
    Vata: (scores.Vata / total) * 100,
    Pitta: (scores.Pitta / total) * 100,
    Kapha: (scores.Kapha / total) * 100
  };

  // Determine dominant and secondary doshas
  const sortedDoshas = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([dosha]) => dosha);

  const dominantDosha = sortedDoshas[0];
  const secondaryDosha = sortedDoshas[1];

  return {
    id: crypto.randomUUID(),
    userId,
    completedAt: new Date().toISOString(),
    answers,
    scores,
    percentages,
    dominantDosha,
    secondaryDosha,
    version: '1.0.0'
  };
}
