/**
 * Tutor Page Component
 * 
 * Main interface for students to input problems, get hints, and validate steps.
 */

import React, { useState } from 'react';
import { apiClient, HintResponse, ValidationResponse } from '../services/apiClient';

const TutorPage: React.FC = () => {
  // State management
  const [studentId] = useState<number>(1); // Default student ID
  const [problem, setProblem] = useState<string>('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [hint, setHint] = useState<HintResponse | null>(null);
  const [studentStep, setStudentStep] = useState<string>('');
  const [feedback, setFeedback] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle "Get Hint" button click
   */
  const handleGetHint = async () => {
    if (!problem.trim()) {
      setError('Please enter a math problem');
      return;
    }

    setLoading(true);
    setError(null);
    setHint(null);

    try {
      const response = await apiClient.getHint({
        student_id: studentId,
        problem: problem.trim(),
        level,
      });
      setHint(response);
    } catch (err: any) {
      setError(err.message || 'Failed to get hint');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "Check My Step" button click
   */
  const handleCheckStep = async () => {
    if (!problem.trim()) {
      setError('Please enter the original problem');
      return;
    }
    if (!studentStep.trim()) {
      setError('Please enter your solution step');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await apiClient.checkStep({
        student_id: studentId,
        problem: problem.trim(),
        student_step: studentStep.trim(),
      });
      setFeedback(response);
    } catch (err: any) {
      setError(err.message || 'Failed to validate step');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            MentorBoard Lite
          </h1>
          <p className="text-gray-600">
            AI-powered math tutoring with step-by-step guidance
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Problem Input Section */}
          <div className="mb-6">
            <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-2">
              Math Problem
            </label>
            <input
              id="problem"
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g., x^2 + 3x = 5"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Level Selector */}
          <div className="mb-6">
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Get Hint Button */}
          <button
            onClick={handleGetHint}
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-6"
          >
            {loading ? 'Loading...' : 'Get Hint'}
          </button>

          {/* Hint Display */}
          {hint && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Hint:</h3>
              <p className="text-blue-800 mb-3">{hint.hint}</p>
              <h3 className="font-semibold text-blue-900 mb-2">Think about:</h3>
              <p className="text-blue-800 mb-2">{hint.next_question}</p>
              <span className="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded">
                Difficulty: {hint.difficulty}
              </span>
            </div>
          )}

          {/* Solution Step Input */}
          <div className="mb-6">
            <label htmlFor="studentStep" className="block text-sm font-medium text-gray-700 mb-2">
              Your Solution Step
            </label>
            <input
              id="studentStep"
              type="text"
              value={studentStep}
              onChange={(e) => setStudentStep(e.target.value)}
              placeholder="e.g., x = 3"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Check Step Button */}
          <button
            onClick={handleCheckStep}
            disabled={loading}
            className="w-full bg-success text-white py-3 px-6 rounded-md font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-6"
          >
            {loading ? 'Checking...' : 'Check My Step'}
          </button>

          {/* Feedback Display */}
          {feedback && (
            <div
              className={`border rounded-md p-4 ${
                feedback.correct
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center mb-2">
                {feedback.correct ? (
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <h3 className={`font-semibold ${feedback.correct ? 'text-green-900' : 'text-red-900'}`}>
                  {feedback.correct ? 'Correct!' : 'Not Quite'}
                </h3>
              </div>
              <p className={feedback.correct ? 'text-green-800' : 'text-red-800'}>
                {feedback.feedback}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-gray-600 mt-2">Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorPage;
