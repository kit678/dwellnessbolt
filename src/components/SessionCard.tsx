import React from 'react';
import { m } from 'framer-motion';
import { Calendar, Users, Clock, DollarSign } from 'lucide-react';
import { RecurringSession } from '../types';
import { formatRecurringSchedule } from '../utils/dateUtils';

interface SessionCardProps {
  session: RecurringSession;
  onBook: (session: RecurringSession) => void;
}

export default function SessionCard({ session, onBook }: SessionCardProps) {
  if (!session) {
    return null;
  }

  const spotsLeft = session.capacity - (session.enrolled || 0);
  const schedule = formatRecurringSchedule(session.recurringDays);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative h-48">
        <img
          src={session.image}
          alt={session.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-indigo-600">
          ${session.price}
        </div>
        {session.specializedTopic && (
          <div className="absolute bottom-4 left-4 bg-indigo-600 px-3 py-1 rounded-full text-sm font-semibold text-white">
            {session.specializedTopic}
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
        <p className="text-gray-600 mb-4">{session.description}</p>
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{schedule}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-5 w-5 mr-2" />
            <span>
              {session.startTime} - {session.endTime} MST
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            <span>{spotsLeft} spots per session</span>
          </div>
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-5 w-5 mr-2" />
            <span>${session.price}</span>
          </div>
        </div>
        
        <button
          onClick={() => onBook(session)}
          disabled={spotsLeft === 0}
          className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors duration-200
            ${
              spotsLeft === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
        >
          {spotsLeft === 0 ? 'Fully Booked' : 'Book Now'}
        </button>
      </div>
    </m.div>
  );
}