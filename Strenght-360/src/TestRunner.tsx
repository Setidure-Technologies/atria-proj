import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentInfo } from './components/StudentInfo';
import { TestInstructions } from './components/TestInstructions';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { Results } from './components/Results';
import { Timer } from './components/Timer';
import { WarningModal } from './components/WarningModal';
import { TestMonitor } from './components/TestMonitor';
import { ProgressTracker, clearProgress } from './components/ProgressTracker';
import { questions, ForcedChoiceResponse } from './data/questions';
import { calculateDetailedScores, getPrimaryTalentDomain, Responses, DetailedTalentScores } from './utils/scoring';
import { apiDB } from './lib/apiDatabase';

type AppState = 'loading' | 'error' | 'info' | 'instructions' | 'test' | 'results';

interface TestRunnerProps {
  assignmentId?: string;
  token?: string;
}

function TestRunner({ assignmentId, token }: TestRunnerProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>('info');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const [scores, setScores] = useState({ executing: 0, influencing: 0, relationshipBuilding: 0, strategicThinking: 0 });
  const [detailedScores, setDetailedScores] = useState<DetailedTalentScores | null>(null);
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [testResponseId, setTestResponseId] = useState<number | null>(null);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [testViolations, setTestViolations] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMinutes, setWarningMinutes] = useState(0);
  const [testEndTime, setTestEndTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const TEST_DURATION = 20 * 60; // 20 minutes in seconds

  useEffect(() => {
    if (assignmentId && token) {
      verifyToken();
    }
  }, [assignmentId, token]);

  const verifyToken = async () => {
    setState('loading');
    try {
      const result = await apiDB.validateTestToken(assignmentId!, token!);
      if (result.success) {
        setStudentName(result.user.name);
        setStudentEmail(result.user.email);
        setState('instructions');
      } else {
        setErrorMessage(result.error || 'Invalid or expired test link');
        setState('error');
      }
    } catch (error) {
      setErrorMessage('Failed to verify test link. Please try again.');
      setState('error');
    }
  };

  const handleStart = (name: string, email: string, data?: any) => {
    setStudentName(name);
    setStudentEmail(email);
    if (data) setStudentData(data);
    setState('instructions');
  };

  const handleStartTest = () => {
    setTestStartTime(new Date());
    setState('test');
  };

  const handleBackToStart = () => {
    if (assignmentId && token) {
      navigate('/dashboard');
    } else {
      setState('info');
      setCurrentQuestionIndex(0);
      setResponses({});
      setDetailedScores(null);
      setTestStartTime(null);
      setTestEndTime(null);
      setTestViolations([]);
      setShowWarning(false);
      clearProgress();
      setStudentData(null);
    }
  };

  const handleViolation = (violation: string) => {
    setTestViolations(prev => [...prev, violation]);
  };

  const handleTimeWarning = (minutesLeft: number) => {
    setWarningMinutes(minutesLeft);
    setShowWarning(true);
  };

  const handleTimeUp = async () => {
    await submitAssessment(true);
  };

  const submitAssessment = async (isAutoSubmit = false) => {
    const endTime = new Date();
    setTestEndTime(endTime);

    const detailedResults = calculateDetailedScores(responses);
    const calculatedScores = {
      executing: detailedResults.executing,
      influencing: detailedResults.influencing,
      relationshipBuilding: detailedResults.relationshipBuilding,
      strategicThinking: detailedResults.strategicThinking
    };
    const primary = getPrimaryTalentDomain(calculatedScores);
    setScores(calculatedScores);
    setDetailedScores(detailedResults);
    setPrimaryDomain(primary);

    const submissionData = {
      student_name: studentName,
      student_email: studentEmail,
      responses: responses, // Include both for compatibility
      responsesJson: responses,
      executing_score: calculatedScores.executing,
      influencing_score: calculatedScores.influencing,
      relationship_building_score: calculatedScores.relationshipBuilding,
      strategic_thinking_score: calculatedScores.strategicThinking,
      primary_talent_domain: primary,
      detailed_scores: detailedResults,
      test_start_time: testStartTime?.toISOString(),
      test_completion_time: endTime.toISOString(),
      test_violations: testViolations,
      is_auto_submit: isAutoSubmit,
      questions_answered: Object.keys(responses).length,
      studentData: studentData // Include student data for profile update
    };

    try {
      let result;
      if (assignmentId && token) {
        result = await apiDB.submitTestWithToken(assignmentId, token, submissionData);
      } else {
        result = await apiDB.insertTestResponse(submissionData);
      }

      if (result && result.success) {
        if (result.id) {
          setTestResponseId(result.id);
        }
        clearProgress();
        setState('results');
      } else {
        console.error('❌ Submission failed:', result?.error);
        setErrorMessage(result?.error || 'Failed to submit test. Please try again.');
        // Don't change state to results, let user retry
        alert('Failed to submit test. Please check your connection and try again.');
      }
    } catch (error) {
      console.error('❌ Error saving responses:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleAnswer = async (questionId: number, response: ForcedChoiceResponse) => {
    const newResponses = {
      ...responses,
      [questionId]: response
    };
    setResponses(newResponses);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await submitAssessment(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying test access...</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <a href="/" className="text-orange-600 hover:text-orange-700 font-medium">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (state === 'info') {
    return (
      <>
        <Header />
        <StudentInfo onStart={handleStart} />
      </>
    );
  }

  if (state === 'instructions') {
    return (
      <>
        <Header />
        <TestInstructions
          onStart={handleStartTest}
          studentName={studentName}
          totalQuestions={questions.length}
        />
      </>
    );
  }

  if (state === 'test') {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <>
        <Header />
        <TestMonitor isActive={true} onViolation={handleViolation} />
        <ProgressTracker
          studentName={studentName}
          studentEmail={studentEmail}
          responses={responses}
          currentQuestionIndex={currentQuestionIndex}
          testStartTime={testStartTime}
          violations={testViolations}
        />
        <WarningModal
          isOpen={showWarning}
          minutesLeft={warningMinutes}
          onClose={() => setShowWarning(false)}
        />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">Strength 360</h2>
                  <span className="text-lg font-medium text-gray-700">
                    {currentQuestionIndex + 1}/{questions.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="ml-6">
                <Timer
                  duration={TEST_DURATION}
                  onTimeUp={handleTimeUp}
                  onWarning={handleTimeWarning}
                />
              </div>
            </div>
            <QuestionCard
              question={currentQuestion}
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
              initialResponse={responses[currentQuestion.id]}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <Results
        scores={scores}
        detailedScores={detailedScores || undefined}
        primaryDomain={primaryDomain}
        studentName={studentName}
        studentEmail={studentEmail}
        testResponseId={testResponseId || undefined}
        testStartTime={testStartTime || undefined}
        testEndTime={testEndTime || undefined}
        violations={testViolations}
        questionsAnswered={Object.keys(responses).length}
        isAutoSubmit={testEndTime ? (testEndTime.getTime() - (testStartTime?.getTime() || 0)) >= TEST_DURATION * 1000 : false}
        onBackToStart={handleBackToStart}
      />
    </>
  );
}

export default TestRunner;
