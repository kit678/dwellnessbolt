import { SpecializedTopic } from '../types';

export const getNextDayOccurrence = (dayIndex: number, hour: number, minute: number) => {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilNext = (dayIndex + 7 - currentDay) % 7;
  
  date.setDate(date.getDate() + daysUntilNext);
  date.setHours(hour, minute, 0, 0);
  
  return date;
};

export const getSpecializedTopicForDate = (date: Date): SpecializedTopic => {
  const startDate = new Date('2024-01-07'); // First Sunday of 2024 as reference
  const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const topicIndex = weeksDiff % 4;
  
  const topics: SpecializedTopic[] = [
    'Stress Management',
    'Diabetes & Hypertension',
    'Weight Loss',
    'PCOS/Women\'s Health'
  ];
  
  return topics[topicIndex];
};

export const getNextOccurrenceForTopic = (topic: SpecializedTopic): Date => {
  let nextSunday = getNextDayOccurrence(0, 9, 30); // Sunday 9:30 AM
  
  while (getSpecializedTopicForDate(nextSunday) !== topic) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
  
  return nextSunday;
};

export const formatRecurringDay = (day: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

export const formatRecurringSchedule = (days: number[] | undefined): string => {
  if (!days || days.length === 0) {
    return 'Schedule not available';
  }
  
  if (days.length === 1) {
    return `Every ${formatRecurringDay(days[0])}`;
  }
  return `Every ${days.map(d => formatRecurringDay(d)).join(' & ')}`;
};