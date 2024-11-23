'use client'

import { useState } from 'react'
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
  "How's your hunger?",
  "How would you describe your digestion?",
  "What's your skin like?",
  "How is your hair texture?",
  "How often do you go to the bathroom?",
  "How do you feel about your internal body temperature?",
  "What's your ideal weather?",
  "What best describes your physical activity level?",
  "How does your mind typically work?",
  "How do you sleep?",
  "How do you usually speak?",
  "How would you describe your memory?"
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
  ],
  [
    { image: "https://images.unsplash.com/photo-1604480132736-44c188fe4d20?w=250&h=250&fit=crop", label: "Irregular" },
    { image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=250&h=250&fit=crop", label: "Quick" },
    { image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=250&h=250&fit=crop", label: "Slow & Steady" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1508264165352-258db2ebd59b?w=250&h=250&fit=crop", label: "Dry" },
    { image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=250&h=250&fit=crop", label: "Warm" },
    { image: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=250&h=250&fit=crop", label: "Smooth" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=250&h=250&fit=crop", label: "Dry & Frizzy" },
    { image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=250&h=250&fit=crop", label: "Fine & Thin" },
    { image: "https://images.unsplash.com/photo-1580618864180-f6d7d39b8ff6?w=250&h=250&fit=crop", label: "Thick & Oily" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1541199249251-f713e6145474?w=250&h=250&fit=crop", label: "Inconsistent" },
    { image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=250&h=250&fit=crop", label: "Regular" },
    { image: "https://images.unsplash.com/photo-1596689200475-21e5bfb8266f?w=250&h=250&fit=crop", label: "Slow & Regular" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1515876305430-f06edab8282a?w=250&h=250&fit=crop", label: "Always Cold" },
    { image: "https://images.unsplash.com/photo-1517241034903-9a4c3ab12f00?w=250&h=250&fit=crop", label: "Always Warm" },
    { image: "https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=250&h=250&fit=crop", label: "Comfortable" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=250&h=250&fit=crop", label: "Warm & Dry" },
    { image: "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=250&h=250&fit=crop", label: "Cool & Refreshing" },
    { image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=250&h=250&fit=crop", label: "Warm & Humid" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1434596922112-19c563067271?w=250&h=250&fit=crop", label: "Quick but Tiring" },
    { image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=250&h=250&fit=crop", label: "Intense & Energetic" },
    { image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=250&h=250&fit=crop", label: "Slow & Steady" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=250&h=250&fit=crop", label: "Fast & Creative" },
    { image: "https://images.unsplash.com/photo-1457369804613-b5bdb714032a?w=250&h=250&fit=crop", label: "Sharp & Focused" },
    { image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=250&h=250&fit=crop", label: "Calm & Steady" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1489533119213-66a5cd877091?w=250&h=250&fit=crop", label: "Light & Restless" },
    { image: "https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=250&h=250&fit=crop", label: "Deep but Light" },
    { image: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=250&h=250&fit=crop", label: "Heavy & Long" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=250&h=250&fit=crop", label: "Fast & Talkative" },
    { image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&h=250&fit=crop", label: "Clear & Direct" },
    { image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=250&h=250&fit=crop", label: "Slow & Thoughtful" },
  ],
  [
    { image: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=250&h=250&fit=crop", label: "Quick but Forgetful" },
    { image: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=250&h=250&fit=crop", label: "Sharp & Detailed" },
    { image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=250&h=250&fit=crop", label: "Slow but Lasting" },
  ],
]

export default function OnboardingQuiz({ isOpen, onClose, onComplete }: OnboardingQuizProps) {
  const { user } = useAuth();
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
      // Calculate scores based on answers
      const scores = {
        Vata: answers.filter((a, i) => a === 0).length,
        Pitta: answers.filter((a, i) => a === 1).length,
        Kapha: answers.filter((a, i) => a === 2).length
      };

      // Update quiz completion in auth store
      await updateUserProfile(user.uid, {
        quizCompleted: true,
        dosha: Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      });

      // Pass results back to parent
      onComplete(scores);
      
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
