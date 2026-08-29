import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { ProgressBar } from '../common/ProgressBar.js';
import { assessmentService } from '../../services/assessmentService.js';
import { AssessmentQuestion, AssessmentResult } from '../../types/index.js';
import { CheckCircle2, XCircle, Award, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../contexts/ToastContext.js';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentCompleted?: () => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  onAssessmentCompleted,
}) => {
  const toast = useToast();
  const [step, setStep] = useState<'SELECT' | 'QUIZ' | 'RESULT'>('SELECT');
  const [selectedCategory, setSelectedCategory] = useState('JavaScript');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('SELECT');
      setCurrentIndex(0);
      setSelectedAnswers({});
      setResult(null);
    }
  }, [isOpen]);

  const startQuiz = async (category: string) => {
    setSelectedCategory(category);
    try {
      const questionsData = await assessmentService.getQuestions(category);
      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setStep('QUIZ');
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Submit assessment
      setIsSubmitting(true);
      try {
        const payload = {
          title: `${selectedCategory} Engineering Benchmark`,
          category: selectedCategory,
          answers: Object.entries(selectedAnswers).map(([questionId, selectedOptionIndex]) => ({
            questionId,
            selectedOptionIndex,
          })),
        };
        const resultData = await assessmentService.submitAssessment(payload);
        if (resultData) {
          setResult(resultData);
          setStep('RESULT');
          toast.success(
            `Assessment completed! Score: ${resultData.score}/${resultData.maxScore}`,
            'Benchmark Result'
          );
          if (resultData.score >= 70) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          if (onAssessmentCompleted) {
            onAssessmentCompleted();
          }
        }
      } catch (err) {
        console.error('Failed to submit assessment:', err);
        toast.error('Failed to evaluate assessment submission.', 'Evaluation Error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'SELECT'
          ? 'Start New Skill Assessment'
          : step === 'QUIZ'
          ? `${selectedCategory} Competency Test`
          : 'Assessment Completed 🎉'
      }
      subtitle={
        step === 'SELECT'
          ? 'Select a technical area to evaluate your proficiency and update your learning path.'
          : step === 'QUIZ'
          ? `Question ${currentIndex + 1} of ${questions.length}`
          : 'Your skill gap map and roadmap have been automatically updated.'
      }
      maxWidth="2xl"
    >
      {step === 'SELECT' && (
        <div className="space-y-3 sm:space-y-4">
          <div
            onClick={() => startQuiz('JavaScript')}
            className="p-4 min-h-[48px] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  JavaScript Engineering Benchmark
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Evaluates DOM APIs, ES6+ features, Event Loop, and Asynchronous patterns.
                </p>
              </div>
              <Badge variant="blue" className="self-start sm:self-auto shrink-0">5 Questions • 10 min</Badge>
            </div>
          </div>

          <div
            onClick={() => startQuiz('React')}
            className="p-4 min-h-[48px] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  React Architecture & Hooks
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  State lifecycles, memoization, custom hooks, and concurrent rendering.
                </p>
              </div>
              <Badge variant="purple" className="self-start sm:self-auto shrink-0">5 Questions • 12 min</Badge>
            </div>
          </div>

          <div
            onClick={() => startQuiz('Async')}
            className="p-4 min-h-[48px] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Async Concurrency & Error Handling
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Promise.all, race conditions, network resiliency, and abort signals.
                </p>
              </div>
              <Badge variant="amber" className="self-start sm:self-auto shrink-0">5 Questions • 10 min</Badge>
            </div>
          </div>
        </div>
      )}

      {step === 'QUIZ' && currentQ && (
        <div className="space-y-5">
          <ProgressBar value={progressPercent} size="sm" />

          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <Badge variant="slate" size="sm" className="truncate">
                Skill: {currentQ.skillTested}
              </Badge>
              <Badge variant="blue" size="sm" className="shrink-0">
                {currentQ.difficulty}
              </Badge>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              {currentQ.questionText}
            </p>

            {currentQ.codeBlock && (
              <pre className="mt-3 p-3.5 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                <code>{currentQ.codeBlock}</code>
              </pre>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-3.5 min-h-[44px] rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.98] ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="leading-relaxed">{option}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="min-h-[40px] px-3 font-semibold"
            >
              Previous
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={selectedAnswers[currentQ.id] === undefined}
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleNext}
              className="min-h-[40px] px-4 font-bold shadow-sm active:scale-95"
            >
              {currentIndex === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
            </Button>
          </div>
        </div>
      )}

      {step === 'RESULT' && result && (
        <div className="space-y-5 text-center py-2">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {result.score}%
            </h4>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
              {result.proficiencyResult}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              {result.feedback}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>AI Path Recalibration Applied</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Your skill matrix has been calibrated. Weak competencies have been flagged as gap areas and new targeted modules have been prioritized in your curriculum.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-center gap-2.5 sm:gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep('SELECT')} className="w-full sm:w-auto min-h-[44px] font-semibold">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Retake Another
            </Button>
            <Button variant="primary" size="sm" onClick={onClose} className="w-full sm:w-auto min-h-[44px] font-bold shadow-md shadow-blue-500/20 active:scale-[0.98]">
              View Updated Dashboard
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
