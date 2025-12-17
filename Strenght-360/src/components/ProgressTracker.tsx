import { useEffect } from 'react';
import { Responses } from '../utils/scoring';

interface ProgressTrackerProps {
  studentName: string;
  studentEmail: string;
  responses: Responses;
  currentQuestionIndex: number;
  testStartTime: Date | null;
  violations: string[];
}

export function ProgressTracker({
  studentName,
  studentEmail,
  responses,
  currentQuestionIndex,
  testStartTime,
  violations
}: ProgressTrackerProps) {
  
  useEffect(() => {
    // Auto-save progress every 30 seconds or when responses change
    const saveProgress = () => {
      if (testStartTime) {
        const progressData = {
          studentName,
          studentEmail,
          responses,
          currentQuestionIndex,
          testStartTime: testStartTime.toISOString(),
          violations,
          lastSaved: new Date().toISOString(),
          questionsAnswered: Object.keys(responses).length
        };

        try {
          localStorage.setItem('assessment_progress', JSON.stringify(progressData));
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      }
    };

    // Save progress when responses change
    saveProgress();

    // Set up auto-save interval
    const interval = setInterval(saveProgress, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [studentName, studentEmail, responses, currentQuestionIndex, testStartTime, violations]);

  // This component doesn't render anything
  return null;
}

export function loadProgress() {
  try {
    const saved = localStorage.getItem('assessment_progress');
    if (saved) {
      const progress = JSON.parse(saved);
      return {
        ...progress,
        testStartTime: new Date(progress.testStartTime)
      };
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return null;
}

export function clearProgress() {
  try {
    localStorage.removeItem('assessment_progress');
  } catch (error) {
    console.error('Failed to clear progress:', error);
  }
}
