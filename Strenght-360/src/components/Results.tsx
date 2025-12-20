import { ArrowLeft } from 'lucide-react';

interface ResultsProps {
  scores?: any;
  detailedScores?: any;
  primaryDomain?: string;
  studentName: string;
  studentEmail?: string;
  testResponseId?: number;
  testStartTime?: Date;
  testEndTime?: Date;
  violations?: string[];
  questionsAnswered?: number;
  isAutoSubmit?: boolean;
  onBackToStart?: () => void;
}

/**
 * Results Component - Shows completion message after test submission
 * Note: Detailed reports are NOT shown to candidates (admin-only feature)
 */
export function Results({
  studentName,
  questionsAnswered = 77,
  isAutoSubmit = false,
  onBackToStart
}: ResultsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Atria Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/candidate/atria-logo.jpg"
            alt="Atria University"
            className="h-14 md:h-16 w-auto"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-[#00C853]/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-5xl">🎉</span>
            </div>
          </div>

          {/* Congratulations Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Congratulations, {studentName}!
          </h1>

          <h2 className="text-xl text-gray-700 mb-6">
            You have successfully completed the assessment.
          </h2>

          {/* Submission Details */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-500">Questions Answered</p>
                <p className="text-lg font-semibold text-gray-900">{questionsAnswered}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submission Type</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isAutoSubmit ? 'Auto-submitted' : 'Manual submission'}
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-[#3B4DC9]/10 border border-[#3B4DC9]/20 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-[#3B4DC9] mb-3 flex items-center gap-2">
              <span>📋</span> What happens next?
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-[#3B4DC9] mt-1">•</span>
                <span>Your responses have been securely submitted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#3B4DC9] mt-1">•</span>
                <span>The Atria University team will review your assessment results.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#3B4DC9] mt-1">•</span>
                <span>You will be contacted with next steps and feedback.</span>
              </li>
            </ul>
          </div>

          {/* Return Button */}
          {onBackToStart && (
            <button
              onClick={onBackToStart}
              className="inline-flex items-center px-6 py-3 bg-[#3B4DC9] hover:bg-[#2E3DA1] text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Return to Dashboard
            </button>
          )}

          {/* Footer Message */}
          <p className="mt-8 text-sm text-gray-500">
            Thank you for completing your assessment with Atria University.
          </p>
        </div>
      </div>
    </div>
  );
}
