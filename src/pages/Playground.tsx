import React, { useState } from 'react';
import Analytics from '../components/Analytics';
import OnboardingQuiz from '../components/OnboardingQuiz';

const components = {
  Analytics: Analytics,
  OnboardingQuiz: OnboardingQuiz,
} as const;

type ComponentName = keyof typeof components;

const Playground: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<ComponentName | ''>('');

  const renderComponent = () => {
    if (!selectedComponent) return null;
    
    const Component = components[selectedComponent];
    
    // Provide mock props based on the component
    const mockProps = {
      Analytics: {
        data: {
          totalBookings: 150,
          totalRevenue: 5000,
          sessionsData: [
            { id: '1', title: 'Test Session', bookings: 10, price: 100 }
          ]
        }
      },
      OnboardingQuiz: {
        isOpen: true,
        onClose: () => console.log('close'),
        onComplete: (score: { Vata: number; Pitta: number; Kapha: number }) => console.log('score:', score)
      }
    };

    return <Component {...(mockProps[selectedComponent] as any)} />;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Component Playground</h1>
      <div className="mb-4">
        <select
          value={selectedComponent}
          onChange={(e) => setSelectedComponent(e.target.value as ComponentName)}
          className="w-full max-w-xs p-2 border rounded"
        >
          <option value="">Select a component</option>
          {Object.keys(components).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        {renderComponent()}
      </div>
    </div>
  );
};

export default Playground;
