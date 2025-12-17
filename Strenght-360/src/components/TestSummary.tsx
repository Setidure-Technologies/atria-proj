import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface TestSummaryProps {
  testStartTime: Date;
  testEndTime: Date;
  violations: string[];
  questionsAnswered: number;
  totalQuestions: number;
  isAutoSubmit: boolean;
}

export function TestSummary({
  testStartTime,
  testEndTime,
  violations,
  questionsAnswered,
  totalQuestions,
  isAutoSubmit
}: TestSummaryProps) {
  const testDuration = Math.floor((testEndTime.getTime() - testStartTime.getTime()) / 1000);
  const minutes = Math.floor(testDuration / 60);
  const seconds = testDuration % 60;

  const completionRate = (questionsAnswered / totalQuestions) * 100;
  const hasViolations = violations.length > 0;

  const getViolationSeverity = (violation: string) => {
    if (violation.includes('developer tools') || violation.includes('keyboard shortcut')) {
      return 'high';
    }
    if (violation.includes('Tab/window switched')) {
      const matches = violation.match(/\((\d+) times\)/);
      const count = matches ? parseInt(matches[1]) : 1;
      if (count >= 3) return 'high';
      if (count >= 2) return 'medium';
      return 'low';
    }
    return 'medium';
  };

  const violationStats = {
    high: violations.filter(v => getViolationSeverity(v) === 'high').length,
    medium: violations.filter(v => getViolationSeverity(v) === 'medium').length,
    low: violations.filter(v => getViolationSeverity(v) === 'low').length
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Test Duration */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-blue-600" size={16} />
            <span className="text-sm font-medium text-gray-700">Duration</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {minutes}m {seconds}s
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="text-green-600" size={16} />
            <span className="text-sm font-medium text-gray-700">Completed</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {questionsAnswered}/{totalQuestions} ({Math.round(completionRate)}%)
          </p>
        </div>

        {/* Submission Type */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            {isAutoSubmit ? (
              <AlertTriangle className="text-orange-600" size={16} />
            ) : (
              <CheckCircle2 className="text-green-600" size={16} />
            )}
            <span className="text-sm font-medium text-gray-700">Submission</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {isAutoSubmit ? 'Auto-submitted (Time expired)' : 'Manual submission'}
          </p>
        </div>

        {/* Violations */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            {hasViolations ? (
              <XCircle className="text-red-600" size={16} />
            ) : (
              <CheckCircle2 className="text-green-600" size={16} />
            )}
            <span className="text-sm font-medium text-gray-700">Test Integrity</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {hasViolations ? `${violations.length} issues` : 'Clean'}
          </p>
        </div>
      </div>

      {/* Detailed Violations */}
      {hasViolations && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-900 mb-2">Test Integrity Issues Detected:</h4>
          
          {violationStats.high > 0 && (
            <div className="mb-2">
              <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                High Risk: {violationStats.high}
              </span>
            </div>
          )}
          
          {violationStats.medium > 0 && (
            <div className="mb-2">
              <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                Medium Risk: {violationStats.medium}
              </span>
            </div>
          )}
          
          {violationStats.low > 0 && (
            <div className="mb-2">
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                Low Risk: {violationStats.low}
              </span>
            </div>
          )}

          <div className="mt-3">
            <details className="text-sm">
              <summary className="cursor-pointer text-red-700 font-medium">View Details</summary>
              <ul className="mt-2 text-red-700 space-y-1">
                {violations.map((violation, index) => (
                  <li key={index} className="text-xs">
                    • {violation}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>Started: {testStartTime.toLocaleString()}</p>
        <p>Completed: {testEndTime.toLocaleString()}</p>
      </div>
    </div>
  );
}
