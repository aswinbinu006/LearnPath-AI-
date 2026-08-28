import React, { useState } from 'react';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import {
  HelpCircle,
  BookOpen,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  MessageSquareCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Roadmap & Progress',
    question: 'How does LearnPath AI calculate my curriculum progress?',
    answer:
      'Progress is dynamically calculated based on the courses and modules you complete. As you complete lessons and quizzes, your phase milestones unlock non-linearly to match your true mastery.',
  },
  {
    category: 'AI Mentor',
    question: 'How does the AI Mentor personalize its feedback?',
    answer:
      'The AI Mentor analyzes your current target engineering role, your active phase focus, and identified skill gaps from your assessments to provide context-aware code reviews and study recommendations.',
  },
  {
    category: 'Assessments',
    question: 'How do skill gap assessments work?',
    answer:
      'Skill assessments present real-world coding questions. Your answers determine your proficiency score and generate targeted course recommendations to close identified gaps.',
  },
  {
    category: 'Account & Settings',
    question: 'Can I change my target engineering role after onboarding?',
    answer:
      'Yes! Head to Settings -> Personal Information & Learning Goals, choose your new target role, and save. You can also regenerate your learning roadmap at any time.',
  },
];

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Roadmap & Progress', 'AI Mentor', 'Assessments', 'Account & Settings'];

  const filteredFaqs =
    selectedCategory === 'ALL' ? faqs : faqs.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-xs">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help & Support Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          How can we help you learn today?
        </h1>
        <p className="text-blue-100 text-xs sm:text-sm max-w-2xl">
          Find answers about AI path generation, course completion tracking, dark theme settings, and technical coaching.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => navigate('/ai-mentor')}
          className="p-5 border-slate-200/90 dark:border-neutral-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-neutral-900 border border-blue-100 dark:border-neutral-800 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Ask AI Mentor</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Get instant technical mentorship, code explanations, and roadmap guidance.
          </p>
        </Card>

        <Card
          onClick={() => navigate('/learning-path')}
          className="p-5 border-slate-200/90 dark:border-neutral-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-neutral-900 border border-purple-100 dark:border-neutral-800 flex items-center justify-center text-purple-600 mb-3 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Your Learning Path</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect your multi-phase milestones, module unlocks, and study hours.
          </p>
        </Card>

        <Card
          onClick={() => navigate('/skills')}
          className="p-5 border-slate-200/90 dark:border-neutral-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-neutral-900 border border-emerald-100 dark:border-neutral-800 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Skill Assessments</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Benchmark your proficiency, uncover skill gaps, and earn verified badges.
          </p>
        </Card>
      </div>

      {/* FAQs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quick answers to common questions about LearnPath AI.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <Card
                key={faq.question}
                className="border-slate-200/90 dark:border-neutral-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-neutral-800/80 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
