import React from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, BarChart3, Clock, User } from 'lucide-react';

interface TestCompletionProps {
}

export function TestCompletion() {
    const location = useLocation();
    const { scores, summary } = location.state || {};

    if (!scores) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Completed!</h2>
                    <p className="text-gray-600">Thank you for completing the assessment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Assessment Complete!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Congratulations! You have successfully completed the Beyonders 360 assessment.
                    </p>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Scores */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center mb-6">
                            <BarChart3 className="text-blue-600 mr-3" size={24} />
                            <h2 className="text-xl font-bold text-gray-800">Your Scores</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <ScoreBar 
                                label="Creativity" 
                                score={scores.creativity} 
                                color="bg-purple-500" 
                            />
                            <ScoreBar 
                                label="Problem Solving" 
                                score={scores.problemSolving} 
                                color="bg-blue-500" 
                            />
                            <ScoreBar 
                                label="Narrative Ability" 
                                score={scores.narrativeAbility} 
                                color="bg-green-500" 
                            />
                            <ScoreBar 
                                label="Emotional Intelligence" 
                                score={scores.emotionalIntelligence} 
                                color="bg-yellow-500" 
                            />
                            <ScoreBar 
                                label="Critical Thinking" 
                                score={scores.criticalThinking} 
                                color="bg-red-500" 
                            />
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">Overall Assessment</h3>
                            <p className="text-blue-700 text-sm">{scores.overall}</p>
                        </div>
                    </div>

                    {/* Test Details */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center mb-6">
                            <User className="text-green-600 mr-3" size={24} />
                            <h2 className="text-xl font-bold text-gray-800">Test Summary</h2>
                        </div>

                        {summary && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b">
                                    <span className="text-gray-600">Cards Completed</span>
                                    <span className="font-medium text-gray-800">{summary.totalCardsUsed}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b">
                                    <span className="text-gray-600">Narrative Responses</span>
                                    <span className="font-medium text-gray-800">{summary.narrativeResponses}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b">
                                    <span className="text-gray-600">Completed At</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(summary.submittedAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                                <Clock className="text-green-600 mr-2" size={16} />
                                <span className="text-green-800 font-medium">Next Steps</span>
                            </div>
                            <p className="text-green-700 text-sm mt-2">
                                Your detailed report will be processed and made available to your administrator. 
                                You may close this window.
                            </p>
                        </div>
                    </div>
                </div>

                {/* What This Means */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Understanding Your Results</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-purple-800 mb-2">Creativity</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Measures your ability to generate original ideas and think outside conventional boundaries.
                            </p>
                            
                            <h3 className="font-semibold text-blue-800 mb-2">Problem Solving</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Evaluates your analytical thinking and ability to find solutions to complex situations.
                            </p>

                            <h3 className="font-semibold text-green-800 mb-2">Narrative Ability</h3>
                            <p className="text-sm text-gray-600">
                                Assesses your storytelling skills and ability to construct coherent, engaging narratives.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-yellow-800 mb-2">Emotional Intelligence</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Measures your understanding of emotions and interpersonal relationships.
                            </p>

                            <h3 className="font-semibold text-red-800 mb-2">Critical Thinking</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Evaluates your ability to analyze information objectively and make reasoned judgments.
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500">
                                    <strong>Note:</strong> This assessment provides insights into your cognitive abilities 
                                    and personality traits. Results are used for educational and developmental purposes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-600 mb-4">
                            Thank you for participating in the Beyonders 360 assessment!
                        </p>
                        <button
                            onClick={() => window.close()}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                            Close Window
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ScoreBarProps {
    label: string;
    score: number;
    color: string;
}

function ScoreBar({ label, score, color }: ScoreBarProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-600">{score}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                    className={`h-3 rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                ></div>
            </div>
        </div>
    );
}
