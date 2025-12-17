// --- Groq AI API Configuration ---
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
// Use environment variable for API key
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; // Set this in your .env file

// Groq API call function
const callGroqApi = async (userQuery, systemPrompt) => {
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
    ];
    
    const payload = {
        model: GROQ_MODEL,
        messages: messages,
        temperature: 0.7,
        max_completion_tokens: 500,
        top_p: 0.9
    };

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.choices || !result.choices[0] || !result.choices[0].message) {
            console.error("Groq API response structure error:", result);
            return "Error: Could not generate content.";
        }
        
        return result.choices[0].message.content.trim();
    } catch (error) {
        console.error("Groq API call failed:", error);
        if (error.message.includes('401')) {
            return "Error: Invalid API key. Please check your Groq API key.";
        } else if (error.message.includes('429')) {
            return "Error: Rate limit exceeded. Please try again later.";
        }
        return "Error: Failed to connect to Groq AI service. Please check your internet connection.";
    }
};

// Fixed QuizScreen component
const QuizScreen = ({ session, handleAnswer, submitQuiz, proctorWarnings, incrementProctorWarning }) => {
    const { questions, currentQIndex, correctStreak, score, currentDifficulty, stream } = session;
    const currentQuestion = questions[currentQIndex];
    const difficultyInfo = DIFFICULTY_LEVELS[currentDifficulty];

    const [selectedOption, setSelectedOption] = useState(null);
    const [hint, setHint] = useState(null);
    const [isHintLoading, setIsHintLoading] = useState(false);

    // Calculate progress percentage
    const progressPercentage = ((currentQIndex + 1) / TOTAL_QUESTIONS) * 100;

    // AI Proctoring: Focus/Blur Listener
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.warn("Proctor Warning: Window/tab lost focus!");
                incrementProctorWarning();
            }
        };

        const handleBlur = () => {
             console.warn("Proctor Warning: Window lost focus (blur event)!");
             incrementProctorWarning();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [incrementProctorWarning]);

    const onSubmit = () => {
        if (selectedOption !== null) {
            handleAnswer(currentQuestion.id, selectedOption);
            setSelectedOption(null);
            setHint(null); // Clear hint for the next question
        }
    };
    
    const isDomainQuestion = currentQuestion?.type === 'DOMAIN';

    const generateHint = async () => {
        if (!currentQuestion) return;
        setIsHintLoading(true);
        setHint("AI is analyzing... Generating conceptual guidance...");

        const userQuery = `Provide a subtle, conceptual hint for the following multiple-choice question: "${currentQuestion.text}". The options are: ${currentQuestion.options.join(', ')}. Do not reveal the answer. Keep the hint concise and focused on the core concept.`;
        const systemPrompt = `You are a friendly, non-judgmental AI study buddy. Your goal is to gently guide the student toward the correct concept, NOT to give them the direct answer. Respond only with the hint text.`;

        try {
            const generatedHint = await callGroqApi(userQuery, systemPrompt);
            setHint(generatedHint);
        } catch (error) {
            setHint("Unable to generate hint at this time. Please proceed with your best knowledge.");
        } finally {
            setIsHintLoading(false);
        }
    };

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-8">
                <Card className="max-w-md p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg"></div>
                    </div>
                    <h2 className="text-3xl font-light text-slate-800 mb-4">Assessment Complete</h2>
                    <p className="text-slate-600 font-light mb-8">You have successfully completed all {TOTAL_QUESTIONS} questions.</p>
                    <Button onClick={submitQuiz} className="w-full bg-slate-800 text-white hover:bg-slate-900 border-slate-800 py-3 text-lg">
                        View Results
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500 z-10" style={{ width: `${progressPercentage}%` }}></div>
            
            <div className="flex flex-col min-h-screen p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                    <div>
                        <h2 className="text-2xl font-medium text-slate-800 flex items-center">
                            <div className="w-3 h-8 bg-blue-400 mr-4"></div>
                            Beyonders 360
                        </h2>
                        <p className="text-slate-600 font-light mt-1">{stream.replace('_', ' ')} Assessment</p>
                        <div className="flex items-center mt-3">
                            <span className="text-sm text-slate-500 mr-3">Progress</span>
                            <div className="bg-slate-200 rounded-full w-32 h-2">
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-slate-700">{currentQIndex + 1}/{TOTAL_QUESTIONS}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-medium text-slate-700">{score.toFixed(0)}</div>
                        <div className="text-slate-500 text-sm font-light">Current Score</div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Side Panel */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Difficulty */}
                        <Card className="p-6 text-center">
                            <div className={`w-8 h-8 rounded-xl mx-auto mb-4 ${
                                difficultyInfo.label === 'EASY' ? 'bg-emerald-400' : 
                                difficultyInfo.label === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'
                            }`}></div>
                            <h3 className="font-medium text-slate-700 mb-1">{difficultyInfo.label}</h3>
                            <p className="text-sm text-slate-500 font-light">{difficultyInfo.multiplier.toFixed(1)}x</p>
                        </Card>

                        {/* Streak */}
                        <Card className="p-6 text-center">
                            <div className="text-2xl font-light text-slate-600 mb-2">{correctStreak}/5</div>
                            <h3 className="font-medium text-slate-700 mb-3">Streak</h3>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${(correctStreak / 5) * 100}%` }}></div>
                            </div>
                        </Card>

                        {/* Focus Status */}
                        <Card className="p-6 text-center">
                            <div className={`w-3 h-3 rounded-full mx-auto mb-3 ${
                                proctorWarnings === 0 ? 'bg-emerald-400' : 'bg-red-400'
                            }`}></div>
                            <h3 className="font-medium text-slate-700">Focus</h3>
                            <p className={`text-sm font-light ${
                                proctorWarnings === 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                {proctorWarnings === 0 ? 'Maintained' : `${proctorWarnings} Warning${proctorWarnings > 1 ? 's' : ''}`}
                            </p>
                        </Card>
                    </div>

                    {/* Main Question Area */}
                    <div className="lg:col-span-4">
                        <Card className="p-8 h-full flex flex-col">
                            {/* Streak Notifications */}
                            {correctStreak > 0 && correctStreak < 5 && (
                                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                    <p className="text-gray-700 font-medium">Excellent progress! {correctStreak} consecutive correct answers.</p>
                                </div>
                            )}
                            {correctStreak === 5 && (
                                <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-xl">
                                    <p className="text-gray-800 font-medium">Outstanding! Perfect streak achieved. Difficulty increased.</p>
                                </div>
                            )}

                            {/* Question */}
                            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                                <div className="flex items-center mb-4">
                                    <div className="w-2 h-6 bg-gray-400 mr-4"></div>
                                    <span className="text-lg font-medium text-gray-700">
                                        {isDomainQuestion ? "Knowledge Assessment" : "Behavioral Evaluation"}
                                    </span>
                                </div>
                                <h3 className="text-xl font-medium text-gray-800 leading-relaxed">
                                    {currentQuestion.text}
                                </h3>
                            </div>
                            
                            {/* AI Hint Section */}
                            {isDomainQuestion && (
                                <div className="mb-6 flex justify-between items-center">
                                    <span className="text-gray-600 font-light">Need assistance? Request AI guidance</span>
                                    <Button 
                                        onClick={generateHint} 
                                        disabled={isHintLoading}
                                        className="px-6 py-2 text-sm bg-gray-700 text-white hover:bg-gray-800 border-gray-700 disabled:bg-gray-500 disabled:text-white disabled:opacity-60"
                                    >
                                        {isHintLoading ? 'Analyzing...' : 'Get Hint'}
                                    </Button>
                                </div>
                            )}

                            {hint && (
                                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.04)]">
                                    <p className="font-medium text-gray-700 mb-2">AI Guidance:</p>
                                    <p className="text-gray-600 font-light leading-relaxed">{hint}</p>
                                </div>
                            )}

                            {/* Options */}
                            <div className="space-y-3 mb-8 flex-1">
                                {currentQuestion.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedOption(option)}
                                        className={`w-full p-4 text-left border rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 ${
                                            selectedOption === option
                                                ? 'border-gray-400 bg-gray-50 shadow-[0_6px_20px_rgba(0,0,0,0.08)] font-medium'
                                                : 'border-gray-200 bg-white hover:border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.08)]'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-6 h-6 rounded-lg border mr-4 flex items-center justify-center text-sm font-medium ${
                                                selectedOption === option 
                                                    ? 'border-gray-700 bg-gray-700 text-white' 
                                                    : 'border-gray-500 bg-white text-gray-800'
                                            }`}>
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <span className="text-gray-700">{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Submit Button */}
                            <Button 
                                onClick={onSubmit} 
                                disabled={selectedOption === null} 
                                className="w-full py-4 text-lg bg-gray-700 text-white hover:bg-gray-800 border-gray-700 shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] disabled:bg-gray-500 disabled:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {currentQIndex === TOTAL_QUESTIONS - 1 ? 'Complete Assessment' : 'Continue'}
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};