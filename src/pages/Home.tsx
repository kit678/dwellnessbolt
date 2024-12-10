import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Calendar, Users, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative bg-indigo-600">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80"
            alt="Wellness background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Transform Your Wellness Journey
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl text-indigo-100 max-w-3xl"
          >
            Join our expert-led sessions and workshops designed to help you achieve
            your wellness goals. From meditation to specialized health workshops,
            we've got you covered.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <Link
              to="/sessions"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors duration-200"
            >
              Browse Sessions
            </Link>
          </m.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <Calendar className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Flexible Scheduling
            </h3>
            <p className="text-gray-600">
              Choose from multiple sessions throughout the week that fit your schedule.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <Users className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Expert Instructors
            </h3>
            <p className="text-gray-600">
              Learn from certified professionals with years of experience in wellness.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <Clock className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Diverse Programs
            </h3>
            <p className="text-gray-600">
              From general wellness to specialized workshops, find the perfect program.
            </p>
          </m.div>
        </div>
      </div>
    </div>
  );
}
