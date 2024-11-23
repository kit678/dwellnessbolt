'use client'

import { useState } from 'react'
import { calculateQuizResults } from '@/utils/quizUtils'
import { useQuizStore } from '@/store/quizStore'
import { m, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAuth } from '@/hooks/useAuth'

interface OnboardingQuizProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: { Vata: number; Pitta: number; Kapha: number }) => void;
}

const questions = [
  "How would you describe your body frame?",
  "How does your body weight usually behave?",
  "How's your hunger?"
]

const options = [
  [
    { image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=250&h=250&fit=crop", label: "Thin & Light" },
    { image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&h=250&fit=crop", label: "Medium Build" },
    { image: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=250&h=250&fit=crop", label: "Sturdy & Solid" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=250&h=250&fit=crop", label: "Easy to Lose" },
    { image: "https://images.unsplash.com/photo-1573200529499-b0d9f3a78b3a?w=250&h=250&fit=crop", label: "Steady Weight" },
    { image: "https://images.unsplash.com/photo-1573879541250-58ae8b322b40?w=250&h=250&fit=crop", label: "Easy to Gain" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=250&h=250&fit=crop", label: "Unpredictable" },
    { image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=250&h=250&fit=crop", label: "Strong" },
    { image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=250&h=250&fit=crop", label: "Mild" },
  ]
]

export default function OnboardingQuiz({ isOpen, onClose, onComplete }: OnboardingQuizProps) {
  const auth = useAuth();
  const { user, updateUserProfile } = auth;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(selectedOption);
    }
  };

  const handleSkip = () => {
    setSelectedOption(null);
    setCurrentQuestion(0);
    setAnswers([]);
    onClose();
  };

  const handleFinish = async () => {
    if (!user?.uid) {
      console.error('User ID is undefined');
      return;
    }

    try {
      console.log('Quiz finished - calculating results...');
      const quizResults = calculateQuizResults(answers, user.uid);
      
      console.log('Updating user profile with quiz results...');
      // Update quiz completion and results in auth store
      // Store complete quiz results in user profile
      await updateUserProfile(user.uid, {
        quizCompleted: true,
        dosha: quizResults.dominantDosha,
        secondaryDosha: quizResults.secondaryDosha,
        lastQuizDate: quizResults.completedAt,
        quizResults: [...(user.quizResults || []), {
          id: quizResults.id,
          userId: user.uid,
          completedAt: quizResults.completedAt,
          answers: quizResults.answers,
          scores: quizResults.scores,
          percentages: quizResults.percentages,
          dominantDosha: quizResults.dominantDosha,
          secondaryDosha: quizResults.secondaryDosha,
          version: quizResults.version
        }]
      });
      console.log('Quiz results stored in database successfully');

      // Update quiz store
      useQuizStore.getState().setQuizResults(quizResults);
      console.log('Quiz state updated successfully');

      // Pass results back to parent
      onComplete(quizResults.scores);
      
      // Reset local state
      setSelectedOption(null);
      setCurrentQuestion(0);
      setAnswers([]);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating quiz completion status:', error);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <Card className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 relative">
          <h2 className="text-2xl font-bold">Discover Your Dosha</h2>
          <p className="text-indigo-100 mt-2">Answer a few questions to find your Ayurvedic body type</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-indigo-400 hover:text-white"
            onClick={handleSkip}
          >
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <Progress value={(currentQuestion + 1) / questions.length * 100} className="mb-6" />
          <AnimatePresence mode="wait">
            <m.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">{questions[currentQuestion]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {options[currentQuestion]?.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-auto p-0 overflow-hidden ${
                      selectedOption === index ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <div className="relative w-full aspect-square">
                      <img
                        src={option.image}
                        alt={option.label}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold text-center px-2">{option.label}</span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </m.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-gray-50 p-6 flex justify-between items-center">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Quiz
          </Button>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={handleBack} disabled={currentQuestion === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNext} disabled={selectedOption === null}>
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Finish Quiz'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
