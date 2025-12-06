'use client';

import { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { SkillNodeData } from '@/components/skill-graph/SkillNode';
import type { TestQuestion, GradingResult } from '@/lib/ai';
import { SKILL_PASS_THRESHOLD } from '@/lib/constants';

interface SkillTestModalProps {
  skill: SkillNodeData;
  careerTitle: string;
  onClose: () => void;
  onComplete: (progress: number) => void;
}

type TestState = 'loading' | 'testing' | 'submitting' | 'results';

export function SkillTestModal({
  skill,
  careerTitle,
  onClose,
  onComplete,
}: SkillTestModalProps) {
  const [state, setState] = useState<TestState>('loading');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<GradingResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch('/api/skill/test/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skillName: skill.name,
            skillDescription: skill.description,
            skillLevel: skill.level,
            category: skill.category,
            careerTitle,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate questions');
        }

        const data = await response.json();
        setQuestions(data.questions);
        setState('testing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test');
      }
    }

    fetchQuestions();
  }, [skill, careerTitle]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setState('submitting');
    setError(null);

    try {
      const response = await fetch('/api/skill/test/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: skill.name,
          skillDescription: skill.description,
          questions: questions.map((q) => ({
            id: q.id,
            question: q.question,
            expectedConcepts: q.expectedConcepts,
            answer: answers[q.id] || '',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grade answers');
      }

      const data = await response.json();
      setResults(data.results);
      setTotalScore(data.totalScore);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade test');
      setState('testing');
    }
  };

  const allAnswered = questions.every((q) => answers[q.id]?.trim());
  const passed = totalScore >= SKILL_PASS_THRESHOLD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <GlassPanel className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{skill.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{skill.name} Test</h2>
                <p className="text-sm text-slate-400">Level {skill.level} - {skill.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Generating questions...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {state === 'testing' && (
            <div className="space-y-6">
              <p className="text-slate-300 text-sm">
                Answer the following questions to demonstrate your knowledge of {skill.name}.
                You need at least {SKILL_PASS_THRESHOLD}% to pass.
              </p>

              {questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <label className="block">
                    <span className="text-white font-medium">
                      {index + 1}. {q.question}
                    </span>
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="mt-2 w-full h-24 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                      placeholder="Enter your answer..."
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

          {state === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Grading your answers...</p>
            </div>
          )}

          {state === 'results' && (
            <div className="space-y-6">
              {/* Score Summary */}
              <div className={`text-center p-6 rounded-xl ${passed ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                <div className={`text-5xl font-bold mb-2 ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {totalScore}%
                </div>
                <p className={`text-lg ${passed ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {passed ? 'Congratulations! You passed!' : 'Keep practicing!'}
                </p>
                {!passed && (
                  <p className="text-slate-400 text-sm mt-2">
                    You need at least {SKILL_PASS_THRESHOLD}% to pass. Feel free to retake the test.
                  </p>
                )}
              </div>

              {/* Question Results */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Detailed Feedback</h3>
                {results.map((result, index) => (
                  <div key={result.questionId} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Question {index + 1}</span>
                      <span className={`px-2 py-1 rounded text-sm ${result.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : result.score >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                        {result.score}%
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{result.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          {state === 'testing' && (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
                allAnswered
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Submit Answers
            </button>
          )}

          {state === 'results' && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => onComplete(totalScore)}
                className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-colors ${
                  passed
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                }`}
              >
                {passed ? 'Complete Skill' : 'Save Progress'}
              </button>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
