import { useState } from 'react';
import OnboardingQuiz from '../components/OnboardingQuiz'; // Import components you want to test

const components: { [key: string]: JSX.Element } = {
  OnboardingQuiz: <OnboardingQuiz isOpen={true} onClose={() => {}} onComplete={() => {}} />,
  // Add other components here
};

export default function ComponentPlayground() {
  const [selectedComponent, setSelectedComponent] = useState<keyof typeof components | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-4">Component Playground</h1>
      <select
        onChange={(e) => setSelectedComponent(e.target.value as keyof typeof components)}
        className="mb-4 p-2 border border-gray-300 rounded"
      >
        <option value="">Select a component</option>
        {Object.keys(components).map((componentName) => (
          <option key={componentName} value={componentName}>
            {componentName}
          </option>
        ))}
      </select>
      <div className="w-full max-w-md">
        {selectedComponent && components[selectedComponent]}
      </div>
    </div>
  );
} 