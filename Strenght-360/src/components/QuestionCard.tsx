import { useState, useEffect } from 'react';
import { Question, ForcedChoiceResponse } from '../data/questions';

interface QuestionCardProps {
  question: Question;
  currentQuestion: number;
  totalQuestions: number;
  onAnswer: (questionId: number, response: ForcedChoiceResponse) => void;
  initialResponse?: ForcedChoiceResponse;
}

export function QuestionCard({
  question,
  currentQuestion,
  totalQuestions,
  onAnswer,
  initialResponse
}: QuestionCardProps) {
  const [selectedStatement, setSelectedStatement] = useState<'A' | 'B' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialResponse) {
      setSelectedStatement(initialResponse.selectedStatement);
    } else {
      // Reset selection for new questions
      setSelectedStatement(null);
    }
    setError(''); // Clear any errors when moving to a new question
  }, [initialResponse, question.id]);

  const handleStatementSelect = (statement: 'A' | 'B') => {
    setSelectedStatement(statement);
    setError(''); // Clear error when selection is made
  };

  const handleSubmit = () => {
    if (!selectedStatement) {
      setError('Please select one statement before continuing');
      return;
    }
    onAnswer(question.id, { selectedStatement });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Question {question.id}</h3>
        <p className="text-gray-600">
          Choose the statement that feels more like the "real you" – your instinctual, natural reaction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Option A Card */}
        <div
          onClick={() => handleStatementSelect('A')}
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            selectedStatement === 'A'
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-25'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                selectedStatement === 'A'
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-300'
              }`}>
                {selectedStatement === 'A' && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-lg font-semibold text-gray-700">Option A</span>
            </div>
            {selectedStatement === 'A' && (
              <div className="text-orange-500 font-semibold">✓ Selected</div>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">{question.statementA}</p>
        </div>

        {/* Option B Card */}
        <div
          onClick={() => handleStatementSelect('B')}
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            selectedStatement === 'B'
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-25'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                selectedStatement === 'B'
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-300'
              }`}>
                {selectedStatement === 'B' && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-lg font-semibold text-gray-700">Option B</span>
            </div>
            {selectedStatement === 'B' && (
              <div className="text-orange-500 font-semibold">✓ Selected</div>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">{question.statementB}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {selectedStatement ? `Option ${selectedStatement} selected` : 'Please select one option'}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!selectedStatement}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedStatement
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {currentQuestion === totalQuestions ? 'Complete Strength 360' : 'Next Question'}
        </button>
      </div>
    </div>
  );
}
