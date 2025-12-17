import { useState } from 'react';
import { Clock, Shield, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

interface TestInstructionsProps {
  onStart: () => void;
  studentName: string;
  totalQuestions: number;
}

export function TestInstructions({ onStart, studentName, totalQuestions }: TestInstructionsProps) {
  const [hasAccepted, setHasAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <FileText className="mx-auto mb-4 text-orange-600" size={64} />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Strength 360 Assessment</h1>
            <p className="text-lg text-gray-600">Welcome, {studentName}</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Clock className="text-blue-600 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Limit</h3>
                  <p className="text-gray-700">
                    You have <strong>20 minutes</strong> to complete this assessment. The timer will start as soon as you begin.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-green-600 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment Details</h3>
                  <p className="text-gray-700 mb-3">
                    This assessment identifies your natural strengths, learning preferences, and behavioural tendencies, intended to help you understand yourself better so you can make informed choices about your future pathways.
                  </p>
                  <div className="mb-3">
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <AlertCircle className="text-yellow-600 mt-1" size={20} />
                      <div className="text-yellow-800 text-sm">
                        Note: Some statement pairs may feel unrelated. This is intentional and part of the design.
                      </div>
                    </div>
                  </div>

                  <ul className="text-gray-700 space-y-1">
                    <li>• Total Questions: {totalQuestions}</li>
                    <li>• Question Type: Forced choice (choose one of two statements)</li>
                    <li>• Choose the statement that feels more like the "real you"</li>
                    <li>• Trust your instincts - your first reaction is usually best</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-orange-600 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Reminders</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• You will receive warnings at 5 minutes and 1 minute remaining</li>
                    <li>• The assessment will auto-submit when time expires</li>
                    <li>• You cannot pause the timer once started</li>
                    <li>• Stay focused and avoid distractions</li>
                    <li>• Answer all questions to get your complete results</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Shield className="text-red-600 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Integrity</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Do not use external resources or assistance</li>
                    <li>• Do not share or discuss questions during the assessment</li>
                    <li>• Switching tabs or windows may affect your results</li>
                    <li>• Complete the assessment in one sitting</li>
                    <li>• Your responses will be automatically saved</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="accept-terms"
                checked={hasAccepted}
                onChange={(e) => setHasAccepted(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <label htmlFor="accept-terms" className="text-gray-700">
                I have read and understood the instructions above. I agree to complete this assessment 
                honestly and without external assistance.
              </label>
            </div>

            <div className="text-center">
              <button
                onClick={onStart}
                disabled={!hasAccepted}
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
                  hasAccepted
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Start Assessment (20 Minutes)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
