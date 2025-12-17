import React, { useState, useEffect } from 'react';
import { apiDB } from './lib/apiDatabase';
import { BEYONDERS_QUESTIONS, BeyondersQuestion } from './data/beyonders_questions';
import { AlertCircle, CheckCircle, Clock, Brain } from 'lucide-react';

interface BeyondersTestRunnerProps {
    assignmentId: string;
    token: string;
    testType: 'beyonders_science' | 'beyonders_non_science';
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; // Use environment variable only

export default function BeyondersTestRunner({ assignmentId, token, testType }: BeyondersTestRunnerProps) {
    const [questions, setQuestions] = useState<BeyondersQuestion[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [startTime] = useState(new Date());

    useEffect(() => {
        // Load questions based on test type
        const stream = testType === 'beyonders_science' ? 'SCIENCE' : 'NON_SCIENCE';
        const streamQuestions = BEYONDERS_QUESTIONS[stream];

        // Flatten questions: Easy -> Medium -> Hard
        const allQuestions = [
            ...streamQuestions.EASY,
            ...streamQuestions.MEDIUM,
            ...streamQuestions.HARD
        ];

        setQuestions(allQuestions);
        setLoading(false);
    }, [testType]);

    const currentQuestion = questions[currentQIndex];
    const progressPercentage = ((currentQIndex + 1) / questions.length) * 100;

    const handleAnswer = (option: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: option
        }));
    };

    const handleNext = () => {
        setHint(null);
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const generateHint = async () => {
        if (!currentQuestion) return;
        setIsHintLoading(true);
        setHint("AI is analyzing... Generating conceptual guidance...");

        const userQuery = `Provide a subtle, conceptual hint for the following multiple-choice question: "${currentQuestion.text}". The options are: ${currentQuestion.options.join(', ')}. Do not reveal the answer. Keep the hint concise and focused on the core concept.`;
        const systemPrompt = `You are a friendly, non-judgmental AI study buddy. Your goal is to gently guide the student toward the correct concept, NOT to give them the direct answer. Respond only with the hint text.`;

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userQuery }
                    ],
                    temperature: 0.7,
                    max_completion_tokens: 500,
                    top_p: 0.9
                })
            });

            if (!response.ok) throw new Error('API Error');
            const result = await response.json();
            setHint(result.choices[0]?.message?.content || "Could not generate hint.");
        } catch (error) {
            setHint("Unable to generate hint at this time.");
        } finally {
            setIsHintLoading(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        // Calculate score
        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.answer) {
                correctCount++;
            }
        });

        const score = (correctCount / questions.length) * 100;

        const submissionData = {
            assignmentId,
            responsesJson: answers,
            scoreJson: {
                totalQuestions: questions.length,
                correctAnswers: correctCount,
                score: score,
                percentage: score
            },
            testStartTime: startTime.toISOString(),
            testCompletionTime: new Date().toISOString(),
            questionsAnswered: Object.keys(answers).length,
            isAutoSubmit: false
        };

        try {
            const result = await apiDB.submitTestWithToken(assignmentId, token, submissionData);
            if (result.success) {
                setCompleted(true);
            } else {
                alert('Submission failed: ' + result.error);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An error occurred during submission.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading assessment...</div>;

    if (completed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-light text-slate-800 mb-4">Assessment Complete</h2>
                    <p className="text-slate-600 mb-8">Your responses have been successfully submitted.</p>
                    <button onClick={() => window.location.href = '/dashboard'} className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-900 transition">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative font-sans">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500 z-10" style={{ width: `${progressPercentage}%` }}></div>

            <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-medium text-slate-800 flex items-center">
                            <div className="w-3 h-8 bg-blue-400 mr-4 rounded-sm"></div>
                            Beyonders 360
                        </h2>
                        <p className="text-slate-600 font-light mt-1 ml-7 capitalize">{testType.replace('beyonders_', '').replace('_', ' ')} Assessment</p>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-500 text-sm font-light">Question</div>
                        <div className="text-2xl font-medium text-slate-700">{currentQIndex + 1} <span className="text-lg text-slate-400">/ {questions.length}</span></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="flex-1">
                    <div className="bg-white rounded-3xl shadow-lg border border-slate-200/50 p-8 h-full flex flex-col">

                        {/* Question Text */}
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${currentQuestion.type === 'DOMAIN' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {currentQuestion.type}
                                </span>
                            </div>
                            <h3 className="text-xl font-medium text-slate-800 leading-relaxed">
                                {currentQuestion.text}
                            </h3>
                        </div>

                        {/* AI Hint */}
                        {currentQuestion.type === 'DOMAIN' && (
                            <div className="mb-6">
                                {!hint ? (
                                    <button
                                        onClick={generateHint}
                                        disabled={isHintLoading}
                                        className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                                    >
                                        <Brain className="w-4 h-4 mr-2" />
                                        {isHintLoading ? 'AI is thinking...' : 'Need a hint? Ask AI'}
                                    </button>
                                ) : (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-slate-700 animate-fadeIn">
                                        <div className="flex items-center mb-2 text-blue-700 font-medium">
                                            <Brain className="w-4 h-4 mr-2" />
                                            AI Guidance
                                        </div>
                                        {hint}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Options */}
                        <div className="space-y-3 mb-8 flex-1">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className={`w-full p-4 text-left border rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 ${answers[currentQuestion.id] === option
                                            ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500'
                                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-lg border mr-4 flex items-center justify-center text-sm font-medium transition-colors ${answers[currentQuestion.id] === option
                                                ? 'border-blue-500 bg-blue-500 text-white'
                                                : 'border-slate-300 text-slate-500'
                                            }`}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className={`text-lg ${answers[currentQuestion.id] === option ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                                            {option}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="mt-auto pt-6 border-t border-slate-100">
                            <button
                                onClick={handleNext}
                                disabled={!answers[currentQuestion.id] || submitting}
                                className="w-full bg-slate-800 text-white py-4 rounded-xl text-lg font-medium hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
                            >
                                {submitting ? 'Submitting...' : currentQIndex === questions.length - 1 ? 'Complete Assessment' : 'Continue'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
