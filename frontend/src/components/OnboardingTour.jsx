import { useState, useEffect } from 'react';

const TOUR_STEPS = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Welcome to DistML!',
    content: 'This is your dashboard. Get an overview of all training sessions, models, and platform activity.',
    position: 'right'
  },
  {
    target: '[data-tour="datasets"]',
    title: 'Upload Your Data',
    content: 'Start by uploading datasets. We support CSV, JSON, and more. You can also explore sample datasets.',
    position: 'right'
  },
  {
    target: '[data-tour="experiments"]',
    title: 'Configure Experiments',
    content: 'Set up experiments with different model architectures, hyperparameters, and training configurations.',
    position: 'right'
  },
  {
    target: '[data-tour="training"]',
    title: 'Train Models',
    content: 'Launch distributed training jobs. Monitor progress in real-time with live metrics and GPU utilization.',
    position: 'right'
  },
  {
    target: '[data-tour="inference"]',
    title: 'Deploy & Predict',
    content: 'Once trained, deploy models for inference. Test predictions and create API endpoints.',
    position: 'right'
  },
  {
    target: '[data-tour="monitoring"]',
    title: 'Monitor Performance',
    content: 'Track model drift, performance metrics, and set up alerts for production models.',
    position: 'right'
  }
];

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('distml-tour-completed');
    if (hasSeenTour) {
      setVisible(false);
      return;
    }
    updatePosition();
  }, [currentStep]);

  const updatePosition = () => {
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2 - 60,
        left: rect.right + 16
      });
    } else {
      setPosition({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 175 });
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem('distml-tour-completed', 'true');
    setVisible(false);
    onComplete?.();
  };

  if (!visible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={completeTour} />

      {/* Tooltip */}
      <div
        className="fixed z-[9999] bg-dark-800 dark:bg-dark-800/40 border border-primary-500/30 rounded-xl shadow-2xl p-5 w-[350px] transition-all duration-300"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {/* Arrow */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-dark-800" />

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-3">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-6 bg-primary-400' : 'w-1.5 bg-dark-600'
              }`}
            />
          ))}
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
        <p className="text-purple-200/70 text-sm mb-4">{step.content}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={completeTour}
            className="text-xs text-purple-300/50 hover:text-dark-200 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 text-sm text-purple-200/70 hover:text-white border border-dark-600 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function resetTour() {
  localStorage.removeItem('distml-tour-completed');
}
