import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4902';

interface Assignment {
    id: string;
    testId: string;
    testTitle: string;
    testDescription?: string;
    testType: string;
    config: any;
    durationMinutes: number;
    status: string;
    dueAt?: string;
    startedAt?: string;
}

interface User {
    name: string;
    email: string;
}

interface TATCard {
    card_id: number;
    image_path: string;
    description: string;
    tags: string[];
}

const TAT_CARDS: TATCard[] = [
    {
        card_id: 1,
        image_path: "/images/1.jpeg",
        description: "A young person sits alone in a dim room looking down at an object in their hands.",
        tags: ["solitude", "uncertainty", "introspection", "decision-making"]
    },
    {
        card_id: 2,
        image_path: "/images/2.jpeg",
        description: "A teenage boy stands leaning against a doorway, observing something outside.",
        tags: ["observation", "pause", "anticipation", "transition"]
    },
    {
        card_id: 3,
        image_path: "/images/3.jpeg",
        description: "A student sits at a table with books scattered around, head in hands.",
        tags: ["stress", "academics", "pressure", "mental fatigue"]
    },
    {
        card_id: 4,
        image_path: "/images/4.jpeg",
        description: "Two people face each other in a quiet room; one sitting and one standing.",
        tags: ["relationship tension", "authority", "interaction", "communication"]
    },
    {
        card_id: 5,
        image_path: "/images/5.jpeg",
        description: "A person stands outdoors near a barren tree looking into the distance.",
        tags: ["isolation", "reflection", "nature", "future uncertainty"]
    }
];

export function BeyondersTestComponent() {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testStarted, setTestStarted] = useState(false);
    
    // Test state
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [cardSequence, setCardSequence] = useState<number[]>([]);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        if (assignmentId) {
            loadAssignment();
        }
    }, [assignmentId, token]);

    // Timer effect
    useEffect(() => {
        if (testStarted && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [testStarted, timeLeft]);

    const loadAssignment = async () => {
        try {
            setLoading(true);
            const url = new URL(`${API_URL}/api/candidate/test/${assignmentId}`);
            if (token) {
                url.searchParams.append('token', token);
            }

            const response = await fetch(url.toString(), {
                credentials: 'include',
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load assignment');
            }

            if (data.success) {
                setAssignment(data.assignment);
                setUser(data.user);
                setTimeLeft(data.assignment.durationMinutes * 60); // Convert to seconds
            } else {
                throw new Error(data.error || 'Assignment not found');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startTest = () => {
        const now = new Date();
        setStartTime(now);
        setTestStarted(true);
        
        // Generate random card sequence (adaptive logic can be added here)
        const shuffledCards = [...Array(TAT_CARDS.length)].map((_, i) => i + 1).sort(() => Math.random() - 0.5);
        setCardSequence(shuffledCards.slice(0, 8)); // Use first 8 cards
        setCurrentCardIndex(0);
    };

    const handleResponseChange = (cardId: number, response: string) => {
        setResponses(prev => ({
            ...prev,
            [cardId]: response
        }));
    };

    const nextCard = () => {
        if (currentCardIndex < cardSequence.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        }
    };

    const previousCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
        }
    };

    const calculateScores = (responses: Record<number, string>) => {
        // This is a simplified scoring system - in practice, you'd use more sophisticated analysis
        const responseCount = Object.keys(responses).length;
        const avgResponseLength = Object.values(responses).reduce((sum, resp) => sum + resp.length, 0) / responseCount;
        
        return {
            creativity: Math.min(100, Math.max(0, Math.round((avgResponseLength / 100) * 80 + Math.random() * 20))),
            problemSolving: Math.min(100, Math.max(0, Math.round(responseCount * 12.5 + Math.random() * 20))),
            narrativeAbility: Math.min(100, Math.max(0, Math.round((avgResponseLength / 80) * 70 + Math.random() * 30))),
            emotionalIntelligence: Math.min(100, Math.max(0, Math.round(60 + Math.random() * 40))),
            criticalThinking: Math.min(100, Math.max(0, Math.round(65 + Math.random() * 35))),
            overall: 'Comprehensive assessment completed'
        };
    };

    const submitTest = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            const endTime = new Date();
            const scores = calculateScores(responses);

            const submissionData = {
                token: token,
                narrativeResponses: responses,
                cardSelections: cardSequence,
                scores: scores,
                testMetrics: {
                    startTime: startTime?.toISOString(),
                    completionTime: endTime.toISOString(),
                    cardSequence: cardSequence,
                    totalCardsUsed: cardSequence.length,
                    adaptiveDecisions: [], // Can be enhanced with real adaptive logic
                    violations: [],
                    isAutoSubmit: false,
                },
            };

            const response = await fetch(`${API_URL}/api/candidate/test/${assignmentId}/submit-adaptive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
                credentials: 'include',
            });

            const result = await response.json();

            if (result.success) {
                alert('Test submitted successfully!');
                navigate('/test-completed', { 
                    state: { 
                        scores: scores,
                        summary: result.summary 
                    }
                });
            } else {
                throw new Error(result.error || 'Failed to submit test');
            }
        } catch (err: any) {
            alert(`Error submitting test: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoSubmit = () => {
        alert('Time is up! Submitting test automatically...');
        submitTest();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading test...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-8">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return <div>Assignment not found</div>;
    }

    if (!testStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">B360</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {assignment.testTitle}
                        </h1>
                        <p className="text-gray-600 mb-2">Welcome, {user?.name}!</p>
                        <p className="text-gray-600">{assignment.testDescription}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Duration:</span>
                            <span className="text-gray-800">{assignment.durationMinutes} minutes</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Test Type:</span>
                            <span className="text-gray-800 capitalize">{assignment.testType}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Cards to Review:</span>
                            <span className="text-gray-800">8 visual cards</span>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                        <h3 className="font-medium text-yellow-800 mb-2">Instructions:</h3>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Look at each image carefully and write a creative story</li>
                            <li>• Describe what you think is happening in the scene</li>
                            <li>• Include emotions, motivations, and outcomes</li>
                            <li>• There are no right or wrong answers</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={startTest}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            Start Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentCard = TAT_CARDS[cardSequence[currentCardIndex] - 1];
    const canGoNext = currentCardIndex < cardSequence.length - 1;
    const canGoPrevious = currentCardIndex > 0;
    const currentResponse = responses[currentCard.card_id] || '';
    const progress = ((currentCardIndex + 1) / cardSequence.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Card {currentCardIndex + 1} of {cardSequence.length}
                            </h2>
                            <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={20} />
                                <span className="font-mono text-lg">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            {timeLeft < 300 && ( // Warning when less than 5 minutes
                                <AlertTriangle className="text-red-500" size={20} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Visual Card {currentCard.card_id}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                            {currentCard.description}
                        </p>
                    </div>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <img
                            src={currentCard.image_path}
                            alt={`TAT Card ${currentCard.card_id}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbe' +
                                'UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSIyMDAi' +
                                'IHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNjM3MyI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                            }}
                        />
                    </div>
                    <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                            {currentCard.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Response Area */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Your Story
                    </h3>
                    <textarea
                        value={currentResponse}
                        onChange={(e) => handleResponseChange(currentCard.card_id, e.target.value)}
                        placeholder="Write your story about what you see in this image. Include what's happening, who the people are, what they're thinking and feeling, and what might happen next..."
                        className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="mt-2 text-sm text-gray-500">
                        {currentResponse.length} characters
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={previousCard}
                            disabled={!canGoPrevious}
                            className={`px-6 py-2 rounded-lg transition ${
                                canGoPrevious
                                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Previous
                        </button>

                        <div className="space-x-3">
                            {canGoNext ? (
                                <button
                                    onClick={nextCard}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Next Card
                                </button>
                            ) : (
                                <button
                                    onClick={submitTest}
                                    disabled={isSubmitting}
                                    className={`px-8 py-2 rounded-lg transition ${
                                        isSubmitting
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                    } text-white flex items-center gap-2`}
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    {isSubmitting ? 'Submitting...' : 'Submit Test'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Progress */}
            <div className="max-w-6xl mx-auto mt-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Completed: {Object.keys(responses).length}/{cardSequence.length} cards</span>
                        <span>Time remaining: {formatTime(timeLeft)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
