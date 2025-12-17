import { useState, useEffect } from 'react';
import { QUESTIONS, TAT_CARDS } from './data/adaptiveData';
import { apiDB } from './lib/apiDatabase';
import { Header } from './components/Header';

// Types
type Stream = 'SCIENCE' | 'NON_SCIENCE';

interface AdaptiveTestRunnerProps {
    assignmentId?: string;
    token?: string;
    testConfig?: any;
    studentName?: string;
    studentEmail?: string;
    onComplete?: () => void;
}

export default function AdaptiveTestRunner({
    assignmentId,
    token,
    testConfig,
    studentName,
    studentEmail
}: AdaptiveTestRunnerProps) {
    const [stream] = useState<Stream>(testConfig?.stream || 'SCIENCE');
    const [currentStage, setCurrentStage] = useState<'INTRO' | 'MCQ' | 'TAT' | 'RESULTS'>('INTRO');
    const [mcqResponses, setMcqResponses] = useState<any>({});
    const [tatResponses, setTatResponses] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('MEDIUM');
    // const [score, setScore] = useState(0);
    const [tatIndex, setTatIndex] = useState(0);
    const [tatStory, setTatStory] = useState('');
    const [loading, setLoading] = useState(false);

    // Load questions for the stream
    const streamQuestions = QUESTIONS[stream];
    // Flatten questions for easier access or manage dynamically
    // The original app seems to pick questions based on difficulty.
    // For simplicity, let's create a linear path or simple adaptive logic.
    // Let's just pick 10 questions from each level or mix them?
    // The original code had 30 questions total.
    // Let's assume we serve 10 Easy, 10 Medium, 10 Hard? Or adaptive?
    // "Adaptive difficulty based on performance" says the UI.

    // Simple Adaptive Logic:
    // Start Medium. Correct -> Hard. Incorrect -> Easy.
    // We need a pool of questions.

    const [questionQueue, setQuestionQueue] = useState<any[]>([]);

    useEffect(() => {
        // Initialize question queue
        // For this implementation, let's just take all questions from the stream
        // and serve them. Or implement true adaptive.
        // Let's stick to the structure: 30 questions.
        // We can just serve them in order of difficulty or mix.
        // Let's serve 10 Easy, 10 Medium, 10 Hard for now to ensure coverage.
        const q = [
            ...streamQuestions.EASY,
            ...streamQuestions.MEDIUM,
            ...streamQuestions.HARD
        ];
        setQuestionQueue(q);
    }, [stream]);

    const handleStart = () => {
        setCurrentStage('MCQ');
    };

    const handleMcqAnswer = (questionId: number, answer: string) => {
        const question = questionQueue[currentQuestionIndex];
        const isCorrect = answer === question.answer;

        setMcqResponses((prev: any) => ({
            ...prev,
            [questionId]: {
                answer,
                isCorrect,
                difficulty: 'FIXED', // Since we are just iterating for now
                timestamp: new Date().toISOString()
            }
        }));

        if (currentQuestionIndex < questionQueue.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setCurrentStage('TAT');
        }
    };

    const handleTatSubmit = async () => {
        const currentCard = TAT_CARDS[tatIndex]; // Need to select cards based on set?
        // Original app used specific cards. Let's just use the first 3 for now.

        const newTatResponse = {
            cardId: currentCard.card_id,
            story: tatStory,
            timestamp: new Date().toISOString()
        };

        const updatedTatResponses = [...tatResponses, newTatResponse];
        setTatResponses(updatedTatResponses);
        setTatStory('');

        if (tatIndex < 2) { // 3 TAT cards
            setTatIndex(prev => prev + 1);
        } else {
            await submitTest(updatedTatResponses);
        }
    };

    const submitTest = async (finalTatResponses: any[]) => {
        setLoading(true);
        const submissionData = {
            student_name: studentName || '',
            student_email: studentEmail || '',
            responses: {
                mcq: mcqResponses,
                tat: finalTatResponses
            },
            test_type: 'adaptive',
            stream: stream,
            submitted_at: new Date().toISOString()
        };

        try {
            if (assignmentId && token) {
                await apiDB.submitTestWithToken(assignmentId, token, submissionData);
            } else {
                await apiDB.insertTestResponse(submissionData);
            }
            setCurrentStage('RESULTS');
        } catch (error) {
            console.error('Submission failed', error);
            alert('Failed to submit test. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (currentStage === 'INTRO') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Beyonders 360 Assessment</h1>
                    <h2 className="text-xl text-blue-600 mb-6">{stream === 'SCIENCE' ? 'Science & Technology' : 'Non-Science'} Stream</h2>

                    <div className="space-y-4 text-left bg-blue-50 p-6 rounded-xl mb-8">
                        <p className="font-medium">This assessment consists of two parts:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li><strong>Part 1:</strong> 30 Multiple Choice Questions (Domain & Behavioral)</li>
                            <li><strong>Part 2:</strong> Thematic Apperception Test (Story Writing)</li>
                        </ul>
                        <p className="text-sm text-gray-500 mt-4">Please ensure you have a stable internet connection and about 45 minutes of uninterrupted time.</p>
                    </div>

                    <button
                        onClick={handleStart}
                        className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Start Assessment
                    </button>
                </div>
            </div>
        );
    }

    if (currentStage === 'MCQ') {
        const question = questionQueue[currentQuestionIndex];
        if (!question) return <div>Loading...</div>;

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 max-w-4xl mx-auto w-full p-4">
                    <div className="mb-6 flex justify-between items-center">
                        <span className="text-gray-500">Question {currentQuestionIndex + 1} of {questionQueue.length}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{question.type}</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h3 className="text-xl font-medium text-gray-800 mb-8">{question.text}</h3>

                        <div className="space-y-4">
                            {question.options.map((option: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleMcqAnswer(question.id, option)}
                                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentStage === 'TAT') {
        const card = TAT_CARDS[tatIndex];
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 max-w-6xl mx-auto w-full p-4">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Part 2: Story Writing ({tatIndex + 1}/3)</h2>
                        <p className="text-gray-600">Write a story based on the image below. Describe what is happening, what led to this, and what the outcome will be.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-center bg-gray-100">
                            <img
                                src={card.image_path}
                                alt="TAT Card"
                                className="max-h-[500px] object-contain rounded-lg"
                                onError={(e) => {
                                    // Fallback if image fails
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                }}
                            />
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
                            <textarea
                                value={tatStory}
                                onChange={(e) => setTatStory(e.target.value)}
                                placeholder="Start writing your story here..."
                                className="flex-1 w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                                style={{ minHeight: '300px' }}
                            />
                            <div className="flex justify-between items-center">
                                <span className={`text-sm ${tatStory.length < 50 ? 'text-red-500' : 'text-green-500'}`}>
                                    {tatStory.length} characters (min 50)
                                </span>
                                <button
                                    onClick={handleTatSubmit}
                                    disabled={tatStory.length < 50 || loading}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Submitting...' : (tatIndex < 2 ? 'Next Image' : 'Submit Assessment')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Assessment Complete!</h2>
                <p className="text-gray-600 mb-8">Thank you for completing the Beyonders 360 Assessment. Your responses have been recorded.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-colors"
                >
                    Return Home
                </button>
            </div>
        </div>
    );
}
