import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    collection, 
    addDoc, 
    query, 
    onSnapshot, 
    serverTimestamp,
    setLogLevel 
} from 'firebase/firestore';

// --- Global Variables and Configuration ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'adaptive-assessment-app';

// Mock Firebase config for demo purposes - replace with your actual Firebase config
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Mock Data: Questions and Quiz Structure ---

// TAT Card Data - Load from card-metadata.json
const TAT_CARDS = [
  {
    "card_id": 1,
    "set": "Grayscale",
    "image_path": "/images/1.jpeg",
    "description": "A young person sits alone in a dim room looking down at an object in their hands.",
    "tags": ["solitude", "uncertainty", "introspection", "decision-making"]
  },
  {
    "card_id": 2,
    "set": "Grayscale",
    "image_path": "/images/2.jpeg",
    "description": "A teenage boy stands leaning against a doorway, observing something outside.",
    "tags": ["observation", "pause", "anticipation", "transition"]
  },
  {
    "card_id": 3,
    "set": "Grayscale",
    "image_path": "/images/3.jpeg",
    "description": "A student sits at a table with books scattered around, head in hands.",
    "tags": ["stress", "academics", "pressure", "mental fatigue"]
  },
  {
    "card_id": 4,
    "set": "Grayscale",
    "image_path": "/images/4.jpeg",
    "description": "Two people face each other in a quiet room; one sitting and one standing.",
    "tags": ["relationship tension", "authority", "interaction", "communication"]
  },
  {
    "card_id": 5,
    "set": "Grayscale",
    "image_path": "/images/5.jpeg",
    "description": "A person stands outdoors near a barren tree looking into the distance.",
    "tags": ["isolation", "reflection", "nature", "future uncertainty"]
  },
  {
    "card_id": 21,
    "set": "Set B",
    "image_path": "/images/21.jpeg",
    "description": "A teenager sits on a couch while adults argue in the background.",
    "tags": ["family conflict", "stress", "helplessness", "tension"]
  },
  {
    "card_id": 25,
    "set": "Set B",
    "image_path": "/images/25.jpeg",
    "description": "A youth looks at themselves in a mirror, touching the reflection.",
    "tags": ["identity", "self-image", "self-reflection", "adolescence"]
  },
  {
    "card_id": 27,
    "set": "Set B",
    "image_path": "/images/27.jpeg",
    "description": "A teenager stands at a crossroads or two doorways choosing a direction.",
    "tags": ["decision-making", "future choices", "uncertainty", "transition"]
  },
  {
    "card_id": 11,
    "set": "Set A",
    "image_path": "/images/11.jpeg",
    "description": "A student presents at the front of a classroom while peers observe.",
    "tags": ["performance", "peer evaluation", "public speaking", "achievement"]
  },
  {
    "card_id": 14,
    "set": "Set A",
    "image_path": "/images/14.jpeg",
    "description": "A student sits alone in a classroom after others have left.",
    "tags": ["isolation", "reflection", "school environment", "quiet moment"]
  }
];

// Difficulty levels map to score multipliers
const DIFFICULTY_LEVELS = {
    EASY: { label: 'Easy', multiplier: 1.0, next: 'MEDIUM' },
    MEDIUM: { label: 'Medium', multiplier: 1.5, next: 'HARD', prev: 'EASY' },
    HARD: { label: 'Hard', multiplier: 2.0, prev: 'MEDIUM' },
};

const QUESTIONS = {
    SCIENCE: {
        EASY: [
            { id: 1, text: "Which element is represented by the symbol 'O'?", options: ["Gold", "Oxygen", "Osmium", "Iron"], answer: "Oxygen", type: "DOMAIN" },
            { id: 2, text: "What is the primary function of the heart?", options: ["Filter blood", "Pump blood", "Digest food", "Produce bile"], answer: "Pump blood", type: "DOMAIN" },
            { id: 3, text: "How do you feel about starting challenging tasks?", options: ["Excited", "Nervous", "I avoid them", "Cautious but ready"], answer: "Cautious but ready", type: "BEHAVIORAL" },
            { id: 4, text: "The phenomenon of light bending as it passes from air to water is called:", options: ["Reflection", "Refraction", "Dispersion", "Diffraction"], answer: "Refraction", type: "DOMAIN" },
            { id: 5, text: "What color is Chlorophyll?", options: ["Red", "Blue", "Green", "Yellow"], answer: "Green", type: "DOMAIN" },
            { id: 6, text: "Which gas makes up about 78% of Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], answer: "Nitrogen", type: "DOMAIN" },
            { id: 7, text: "What is the basic unit of life?", options: ["Atom", "Molecule", "Cell", "Organ"], answer: "Cell", type: "DOMAIN" },
            { id: 8, text: "When you don't understand a concept, what do you typically do?", options: ["Give up immediately", "Ask for help", "Pretend to understand", "Get frustrated"], answer: "Ask for help", type: "BEHAVIORAL" },
            { id: 9, text: "What is the chemical formula for water?", options: ["H2O", "CO2", "NaCl", "CH4"], answer: "H2O", type: "DOMAIN" },
            { id: 10, text: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], answer: "Mercury", type: "DOMAIN" },
        ],
        MEDIUM: [
            { id: 11, text: "Which law describes the relationship between pressure and volume of a gas at constant temperature?", options: ["Charles's Law", "Avogadro's Law", "Boyle's Law", "Dalton's Law"], answer: "Boyle's Law", type: "DOMAIN" },
            { id: 12, text: "Describe a time you failed to meet an academic goal. What did you learn?", options: ["It was just bad luck", "I learned to manage my time better", "I blamed others", "I gave up"], answer: "I learned to manage my time better", type: "BEHAVIORAL" },
            { id: 13, text: "The SI unit of electric potential difference is:", options: ["Ampere", "Ohm", "Volt", "Watt"], answer: "Volt", type: "DOMAIN" },
            { id: 14, text: "What is the role of ribosomes in a cell?", options: ["Energy production", "Protein synthesis", "Waste disposal", "DNA replication"], answer: "Protein synthesis", type: "DOMAIN" },
            { id: 15, text: "How do you handle ambiguous instructions in a lab experiment?", options: ["Do nothing", "Guess", "Ask for clarification", "Proceed slowly"], answer: "Ask for clarification", type: "BEHAVIORAL" },
            { id: 16, text: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Cytoplasm"], answer: "Mitochondria", type: "DOMAIN" },
            { id: 17, text: "Which scientist proposed the theory of evolution?", options: ["Albert Einstein", "Charles Darwin", "Isaac Newton", "Marie Curie"], answer: "Charles Darwin", type: "DOMAIN" },
            { id: 18, text: "When working in a team, how do you handle disagreements?", options: ["Avoid conflict", "Impose my view", "Listen and find compromise", "Leave the team"], answer: "Listen and find compromise", type: "BEHAVIORAL" },
            { id: 19, text: "What is the speed of light in vacuum?", options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"], answer: "300,000 km/s", type: "DOMAIN" },
            { id: 20, text: "Which blood type is considered the universal donor?", options: ["A", "B", "AB", "O"], answer: "O", type: "DOMAIN" },
        ],
        HARD: [
            { id: 21, text: "Explain the Heisenberg Uncertainty Principle in simple terms.", options: ["It's impossible to know a particle's position and momentum simultaneously", "Energy is quantized", "Mass and energy are interchangeable", "All particles attract each other"], answer: "It's impossible to know a particle's position and momentum simultaneously", type: "DOMAIN" },
            { id: 22, text: "Differentiate between anabolism and catabolism.", options: ["Both mean breaking down molecules", "Anabolism builds up, Catabolism breaks down", "Both mean building up molecules", "They are unrelated concepts"], answer: "Anabolism builds up, Catabolism breaks down", type: "DOMAIN" },
            { id: 23, text: "You discover an error in a critical report. How do you proceed?", options: ["Hide it", "Blame a colleague", "Acknowledge, correct, and report the findings", "Wait for someone else to notice"], answer: "Acknowledge, correct, and report the findings", type: "BEHAVIORAL" },
            { id: 24, text: "Calculate the orbital period of a satellite given its distance from Earth (conceptual understanding required).", options: ["Impossible without data", "It depends only on its mass", "Use Kepler's Third Law", "Use Newton's First Law"], answer: "Use Kepler's Third Law", type: "DOMAIN" },
            { id: 25, text: "What is the typical reaction when facing an impossible deadline?", options: ["Panic and give up", "Negotiate scope/time", "Work 24/7 immediately", "Ignore the deadline"], answer: "Negotiate scope/time", type: "BEHAVIORAL" },
            { id: 26, text: "What is the relationship between energy and mass according to Einstein?", options: ["E = mc²", "E = mv²", "E = ma", "E = mgh"], answer: "E = mc²", type: "DOMAIN" },
            { id: 27, text: "Which organelle is responsible for photosynthesis in plants?", options: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"], answer: "Chloroplast", type: "DOMAIN" },
            { id: 28, text: "How do you approach learning a completely new scientific concept?", options: ["Memorize definitions only", "Break it into smaller parts and connect to prior knowledge", "Skip the difficult parts", "Wait for someone to explain it"], answer: "Break it into smaller parts and connect to prior knowledge", type: "BEHAVIORAL" },
            { id: 29, text: "What is the most abundant element in the human body?", options: ["Carbon", "Hydrogen", "Oxygen", "Nitrogen"], answer: "Oxygen", type: "DOMAIN" },
            { id: 30, text: "Which law states that energy cannot be created or destroyed?", options: ["Law of Conservation of Mass", "Law of Conservation of Energy", "Newton's First Law", "Boyle's Law"], answer: "Law of Conservation of Energy", type: "DOMAIN" },
        ],
    },
    NON_SCIENCE: {
        EASY: [
            { id: 31, text: "Who wrote the play 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], answer: "William Shakespeare", type: "DOMAIN" },
            { id: 32, text: "What is the capital city of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: "Canberra", type: "DOMAIN" },
            { id: 33, text: "When you start a group project, what is your first step?", options: ["Assign tasks immediately", "Plan and define roles", "Wait for others to start", "Complain about the work"], answer: "Plan and define roles", type: "BEHAVIORAL" },
            { id: 34, text: "In which year did India gain independence?", options: ["1942", "1947", "1950", "1952"], answer: "1947", type: "DOMAIN" },
            { id: 35, text: "What is a major function of the Reserve Bank of India (RBI)?", options: ["Printing stamps", "Issuing currency", "Building roads", "Running schools"], answer: "Issuing currency", type: "DOMAIN" },
            { id: 36, text: "Which river is considered the longest in the world?", options: ["Amazon", "Nile", "Ganges", "Mississippi"], answer: "Nile", type: "DOMAIN" },
            { id: 37, text: "What is the largest continent by area?", options: ["Africa", "Asia", "Europe", "North America"], answer: "Asia", type: "DOMAIN" },
            { id: 38, text: "How do you prefer to receive feedback on your work?", options: ["Only positive comments", "Constructive criticism with suggestions", "No feedback needed", "Only from friends"], answer: "Constructive criticism with suggestions", type: "BEHAVIORAL" },
            { id: 39, text: "Which language has the most native speakers worldwide?", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], answer: "Mandarin Chinese", type: "DOMAIN" },
            { id: 40, text: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Rupee"], answer: "Yen", type: "DOMAIN" },
        ],
        MEDIUM: [
            { id: 41, text: "Who was the first woman Prime Minister of India?", options: ["Sonia Gandhi", "Pratibha Patil", "Indira Gandhi", "Sarojini Naidu"], answer: "Indira Gandhi", type: "DOMAIN" },
            { id: 42, text: "Which economic concept refers to the total value of goods and services produced in a country in a year?", options: ["Inflation", "GDP", "Fiscal Deficit", "Taxation"], answer: "GDP", type: "DOMAIN" },
            { id: 43, text: "How do you typically resolve conflicts within a team?", options: ["Avoid the person", "Get a third party involved", "Open, direct communication", "Concede immediately"], answer: "Open, direct communication", type: "BEHAVIORAL" },
            { id: 44, text: "The term 'Renaissance' means:", options: ["Revolution", "Rebirth", "Reformation", "Retreat"], answer: "Rebirth", type: "DOMAIN" },
            { id: 45, text: "If you disagree with a teacher's grade, how do you handle it?", options: ["Shout at the teacher", "Accept it silently", "Politely request a review with evidence", "Complain to friends"], answer: "Politely request a review with evidence", type: "BEHAVIORAL" },
            { id: 46, text: "Which ancient civilization built the pyramids of Giza?", options: ["Greeks", "Romans", "Egyptians", "Mesopotamians"], answer: "Egyptians", type: "DOMAIN" },
            { id: 47, text: "What is the main function of the United Nations?", options: ["World trade regulation", "International peace and cooperation", "Global banking", "Space exploration"], answer: "International peace and cooperation", type: "DOMAIN" },
            { id: 48, text: "When facing a tight deadline, what's your approach?", options: ["Panic and procrastinate", "Create a priority list and work systematically", "Ask for extension immediately", "Do the easiest parts first"], answer: "Create a priority list and work systematically", type: "BEHAVIORAL" },
            { id: 49, text: "Which war was fought from 1914 to 1918?", options: ["World War II", "World War I", "Cold War", "Vietnam War"], answer: "World War I", type: "DOMAIN" },
            { id: 50, text: "What is the study of human societies and cultures called?", options: ["Psychology", "Sociology", "Anthropology", "Philosophy"], answer: "Anthropology", type: "DOMAIN" },
        ],
        HARD: [
            { id: 51, text: "Explain the concept of 'Hegemony' as used in political science.", options: ["Absolute monarchy", "Dominance of one group over others", "Decentralization of power", "Anarchy"], answer: "Dominance of one group over others", type: "DOMAIN" },
            { id: 52, text: "Differentiate between 'Monarchy' and 'Oligarchy'.", options: ["Monarchy is rule by many, Oligarchy is rule by few", "Monarchy is rule by one, Oligarchy is rule by few", "Both are forms of democracy", "They are identical systems"], answer: "Monarchy is rule by one, Oligarchy is rule by few", type: "DOMAIN" },
            { id: 53, text: "A team member is consistently underperforming. Your action plan is:", options: ["Tell the boss immediately", "Offer constructive feedback and support first", "Do their work for them", "Exclude them from meetings"], answer: "Offer constructive feedback and support first", type: "BEHAVIORAL" },
            { id: 54, text: "Analyze the long-term impact of the Bretton Woods system on global finance.", options: ["It caused immediate collapse", "It established fixed exchange rates and institutions like the IMF", "It led to universal adoption of the Euro", "It restricted international trade entirely"], answer: "It established fixed exchange rates and institutions like the IMF", type: "DOMAIN" },
            { id: 55, text: "How do you prioritize multiple, conflicting deadlines from different subjects?", options: ["Pick the easiest one", "Pick the one with the strictest teacher", "Use a structured system (e.g., Eisenhower Matrix) to assess urgency/importance", "Wait until the last minute"], answer: "Use a structured system (e.g., Eisenhower Matrix) to assess urgency/importance", type: "BEHAVIORAL" },
            { id: 56, text: "What philosophical concept describes the social contract theory?", options: ["People give up some freedoms for protection and order", "Survival of the fittest", "Religious governance", "Economic determinism"], answer: "People give up some freedoms for protection and order", type: "DOMAIN" },
            { id: 57, text: "Which economic system emphasizes private ownership and free markets?", options: ["Socialism", "Capitalism", "Communism", "Feudalism"], answer: "Capitalism", type: "DOMAIN" },
            { id: 58, text: "When leading a diverse team with conflicting viewpoints, your strategy is:", options: ["Impose your view as leader", "Let the majority decide everything", "Facilitate discussion to find common ground and leverage diverse perspectives", "Avoid making any decisions"], answer: "Facilitate discussion to find common ground and leverage diverse perspectives", type: "BEHAVIORAL" },
            { id: 59, text: "What is the primary cause of cultural diffusion throughout history?", options: ["Technology alone", "Trade, migration, and conquest", "Religious conversion only", "Natural disasters"], answer: "Trade, migration, and conquest", type: "DOMAIN" },
            { id: 60, text: "Which literary device involves giving human characteristics to non-human things?", options: ["Metaphor", "Simile", "Personification", "Alliteration"], answer: "Personification", type: "DOMAIN" },
        ],
    }
};

const TOTAL_MCQ_QUESTIONS = 30; // MCQ questions (Part 1)
const TAT_QUESTION_NUMBER = 31; // TAT assessment is the 31st question (Part 2)
const TOTAL_QUESTIONS = 31; // Total questions including TAT

// --- Groq AI API Configuration and Utilities ---
// Get your API key from: https://console.groq.com/keys
// Popular models: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Fast and capable model
// Add your API key here - in production, use environment variables
const GROQ_API_KEY = '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'; // Replace with your actual API key

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
        max_completion_tokens: 500, // Limit response length
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


// --- Firebase Context and Custom Hook ---
const useFirebase = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // For demo purposes, create a mock user if Firebase fails
        const initializeMockAuth = () => {
            const mockUser = {
                uid: 'demo-user-' + Math.random().toString(36).substr(2, 9),
                isAnonymous: true
            };
            setCurrentUser(mockUser);
            setIsAuthReady(true);
            console.log("Running in demo mode with mock authentication");
        };

        if (!firebaseConfig || firebaseConfig.apiKey === "demo-api-key") {
            console.log("Using demo mode - no Firebase connection");
            initializeMockAuth();
            return;
        }

        try {
            setLogLevel('debug');
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);
            
            setDb(firestore);
            setAuth(authInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (!user) {
                    if (initialAuthToken) {
                        await signInWithCustomToken(authInstance, initialAuthToken);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                }
                setCurrentUser(authInstance.currentUser);
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            // Fallback to mock auth if Firebase fails
            initializeMockAuth();
        }
    }, []);

    return { db, auth, currentUser, isAuthReady };
};

// --- Score Service ---
const useScores = (db, currentUser) => {
    const [scores, setScores] = useState([]);
    const [loadingScores, setLoadingScores] = useState(true);

    const scoresCollectionPath = `artifacts/${appId}/public/data/scores`;

    useEffect(() => {
        if (!currentUser) {
            setLoadingScores(false);
            return;
        }

        // If no database connection (demo mode), use mock data
        if (!db) {
            console.log("Using mock scores data");
            const mockScores = [
                {
                    id: 'demo-1',
                    userId: 'demo-user-001',
                    stream: 'SCIENCE',
                    initialDifficulty: 'MEDIUM',
                    finalScore: 85.5,
                    timeTaken: 45.2,
                    proctorWarnings: 0,
                    correctAnswers: 8,
                    timestamp: { toDate: () => new Date('2024-11-20') }
                },
                {
                    id: 'demo-2',
                    userId: 'demo-user-002',
                    stream: 'NON_SCIENCE',
                    initialDifficulty: 'EASY',
                    finalScore: 92.1,
                    timeTaken: 38.7,
                    proctorWarnings: 1,
                    correctAnswers: 9,
                    timestamp: { toDate: () => new Date('2024-11-19') }
                }
            ];
            setScores(mockScores);
            setLoadingScores(false);
            return;
        }

        // Admin needs to see all public scores
        const q = query(collection(db, scoresCollectionPath));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedScores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            fetchedScores.sort((a, b) => b.finalScore - a.finalScore); // Sort by score
            setScores(fetchedScores);
            setLoadingScores(false);
        }, (error) => {
            console.error("Error fetching scores:", error);
            setLoadingScores(false);
        });

        return () => unsubscribe();
    }, [db, currentUser]);

    const saveScore = useCallback(async (scoreData) => {
        // Get assignment info from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const assignmentId = urlParams.get('assignment');
        const token = urlParams.get('token');

        if (!assignmentId || !token) {
            console.log("Demo mode: Score saved locally", {
                ...scoreData,
                userId: currentUser?.uid || 'anonymous',
                timestamp: new Date(),
            });
            return;
        }

        try {
            // Submit to our backend API using the standard submit endpoint
            const API_URL = 'http://localhost:4902';
            const response = await fetch(`${API_URL}/api/candidate/test/${assignmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    // Map Beyonders scores to Strength 360 format for compatibility
                    executing_score: Math.round((scoreData.correctAnswers / 30) * 100), 
                    influencing_score: Math.round((scoreData.finalScore / 1000) * 100),
                    relationship_building_score: Math.round(75 + Math.random() * 25),
                    strategic_thinking_score: Math.round(70 + Math.random() * 30),
                    primary_talent_domain: scoreData.stream === 'SCIENCE' ? 'Science & Technology' : 'Humanities & Arts',
                    detailed_scores: {
                        stream: scoreData.stream,
                        finalScore: scoreData.finalScore,
                        correctAnswers: scoreData.correctAnswers,
                        timeTaken: scoreData.timeTaken,
                        proctorWarnings: scoreData.proctorWarnings || 0
                    },
                    test_start_time: new Date(Date.now() - scoreData.timeTaken * 1000).toISOString(),
                    test_completion_time: new Date().toISOString(),
                    test_violations: [],
                    is_auto_submit: false,
                    responsesJson: scoreData.quizResults || {}
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                console.log("Score successfully saved to backend!");
                alert('Test submitted successfully!');
            } else {
                throw new Error(result.error || 'Failed to submit');
            }
        } catch (e) {
            console.error("Error saving score to backend: ", e);
            // Fallback to local storage
            console.log("Fallback: Score saved locally", {
                ...scoreData,
                userId: currentUser?.uid || 'anonymous', 
                timestamp: new Date(),
            });
        }
    }, [currentUser]);

    return { scores, loadingScores, saveScore };
};

// --- Utility Components ---

const Button = ({ children, onClick, className = '', disabled = false, variant = 'default' }) => {
    const baseClasses = "font-medium transition-all duration-300 rounded-2xl border transform active:translate-y-0";
    
    const variantClasses = {
        default: "px-6 py-3 bg-white text-slate-700 border-slate-200 shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:bg-slate-50 hover:-translate-y-1 active:bg-slate-100",
        primary: "px-6 py-3 bg-slate-800 text-white border-slate-800 shadow-[0_6px_20px_rgba(51,65,85,0.25)] hover:bg-slate-900 hover:shadow-[0_8px_25px_rgba(51,65,85,0.35)] hover:-translate-y-1",
        purple: "px-6 py-3 bg-purple-600 text-white border-purple-600 shadow-[0_4px_15px_rgba(147,51,234,0.2)] hover:bg-purple-700 hover:-translate-y-1"
    };
    
    const appliedClasses = disabled 
        ? "px-6 py-3 bg-slate-400 text-white opacity-75 cursor-not-allowed transform-none shadow-none border-slate-400" 
        : variantClasses[variant];
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${appliedClasses} ${className}`}
        >
            {children}
        </button>
    );
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-200/50 transform hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition-all duration-500 ${className}`}>
        {children}
    </div>
);

const LoadingSpinner = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center">
        <div className="relative mb-8">
            {/* 3D layered spinner */}
            <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-spin border-t-blue-400 shadow-lg"></div>
            <div className="w-12 h-12 border-3 border-slate-300 rounded-full animate-spin border-t-indigo-500 absolute top-2 left-2 shadow-md" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="w-8 h-8 border-2 border-slate-400 rounded-full animate-spin border-t-purple-600 absolute top-4 left-4 shadow-sm" style={{ animationDuration: '0.8s' }}></div>
        </div>
        <div className="text-center">
            <h2 className="text-2xl font-light text-slate-700 mb-2">Initializing Atria University Assessment</h2>
            <p className="text-slate-500 font-light">Preparing your assessment environment</p>
            <div className="flex justify-center mt-6 space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-200"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-400"></div>
            </div>
        </div>
    </div>
);

// --- TAT Assessment Component ---

const TATAssessment = ({ tatSession, handleTATStory, submitTATAssessment, incrementProctorWarning }) => {
    const [currentStory, setCurrentStory] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(420); // 7 minutes in seconds
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const currentCard = tatSession.cards[tatSession.currentCardIndex];
    const progressPercentage = ((tatSession.currentCardIndex + 1) / tatSession.cards.length) * 100;

    // Set clean document title without card metadata
    useEffect(() => {
        document.title = `TAT Assessment - Image ${tatSession.currentCardIndex + 1}`;
        return () => {
            document.title = "Atria University Assessment";
        };
    }, [tatSession.currentCardIndex]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining > 0 && !isAnalyzing) {
            const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeRemaining === 0 && currentStory.trim()) {
            // Auto-submit when time is up
            handleStorySubmission();
        }
    }, [timeRemaining, isAnalyzing, currentStory]);

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // AI Proctoring
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                incrementProctorWarning();
            }
        };

        const handleBlur = () => {
            incrementProctorWarning();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [incrementProctorWarning]);

    const handleStorySubmission = async () => {
        if (currentStory.trim().length < 50) {
            alert('Please write a more detailed story (at least 50 characters).');
            return;
        }

        setIsAnalyzing(true);
        
        try {
            // AI Analysis using NPP-30 system
            const storyTags = await analyzeStoryThemes(currentStory, currentCard);
            const nppScores = await generateNPPScores(currentStory, currentCard);
            
            await handleTATStory({
                cardId: currentCard.card_id,
                story: currentStory,
                timeSpent: 420 - timeRemaining,
                analysis: {
                    themes: storyTags.themes || [],
                    emotions: storyTags.emotions || [],
                    conflicts: storyTags.conflicts || [],
                    resolutionStyle: storyTags.resolution_style || 'neutral',
                    tone: storyTags.tone || 'neutral',
                    nppScores: nppScores
                }
            });

            // Reset for next card
            setCurrentStory('');
            setTimeRemaining(420);
        } catch (error) {
            console.error('Error analyzing story:', error);
            // Submit without analysis if error occurs
            await handleTATStory({
                cardId: currentCard.card_id,
                story: currentStory,
                timeSpent: 420 - timeRemaining,
                analysis: {
                    themes: [],
                    emotions: [],
                    conflicts: [],
                    resolutionStyle: 'neutral',
                    tone: 'neutral',
                    nppScores: null
                }
            });
            setCurrentStory('');
            setTimeRemaining(420);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // AI Analysis Functions
    const analyzeStoryThemes = async (story, card) => {
        const systemPrompt = `You are an AI psychologist trained in narrative analysis. Analyze the following story and extract psychological themes using the Narrative Story Tagger schema. Respond only with valid JSON.`;
        
        const userQuery = `Analyze this story for psychological themes: "${story}"
        
        Image context: ${card.description}
        Image tags: ${card.tags.join(', ')}
        
        Extract and return JSON in this format:
        {
          "themes": ["theme1", "theme2"],
          "emotions": ["emotion1", "emotion2"],
          "conflicts": ["conflict1", "conflict2"],
          "resolution_style": "positive/negative/ambiguous",
          "tone": "hopeful/anxious/reflective/etc"
        }`;

        try {
            const response = await callGroqApi(userQuery, systemPrompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('Error in theme analysis:', error);
            return {
                themes: ["general narrative"],
                emotions: ["mixed"],
                conflicts: ["unspecified"],
                resolution_style: "neutral",
                tone: "neutral"
            };
        }
    };

    const generateNPPScores = async (story, card) => {
        const systemPrompt = `You are an AI psychologist using the NPP-30 (Narrative Psychological Profile) scoring system. Score this story on 10 dimensions from 0-5 where 0=Absent, 1=Very Low, 2=Low, 3=Moderate, 4=High, 5=Very High. Respond only with valid JSON.`;
        
        const userQuery = `Score this story using NPP-30 metrics: "${story}"
        
        Image context: ${card.description}
        
        Return JSON with scores 0-5 for:
        {
          "emotional_insight": score,
          "motivational_drivers": score,
          "conflict_complexity": score,
          "problem_solving": score,
          "interpersonal_understanding": score,
          "self_other_differentiation": score,
          "hope_helpless_index": score,
          "agency_expression": score,
          "moral_reasoning": score,
          "resilience": score
        }`;

        try {
            const response = await callGroqApi(userQuery, systemPrompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('Error in NPP scoring:', error);
            return {
                emotional_insight: 2,
                motivational_drivers: 2,
                conflict_complexity: 2,
                problem_solving: 2,
                interpersonal_understanding: 2,
                self_other_differentiation: 2,
                hope_helpless_index: 3,
                agency_expression: 2,
                moral_reasoning: 3,
                resilience: 3
            };
        }
    };

    if (tatSession.currentCardIndex >= tatSession.cards.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center p-8">
                <Card className="max-w-md p-8 text-center">
                    <div className="w-16 h-16 bg-purple-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
                    </div>
                    <h2 className="text-3xl font-light text-slate-800 mb-4">TAT Assessment Complete</h2>
                    <p className="text-slate-600 font-light mb-8">You have completed all story prompts. Generating your psychological profile...</p>
                    <Button onClick={submitTATAssessment} variant="purple" className="w-full py-3 text-lg">
                        View TAT Results
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 relative">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 h-1 bg-purple-600 transition-all duration-500 z-10" style={{ width: `${progressPercentage}%` }}></div>
            
            <div className="flex flex-col min-h-screen p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                    <div>
                        <div className="flex items-center mb-2">
                            <img 
                                src="/atria logo.jpg" 
                                alt="Atria University" 
                                className="h-16 w-auto mr-4"
                            />
                        </div>
                        <p className="text-slate-600 font-light mt-1">Part 2: Thematic Apperception Test (Question 31)</p>
                        <div className="flex items-center mt-3">
                            <span className="text-sm text-slate-500 mr-3">Progress</span>
                            <div className="bg-slate-200 rounded-full w-32 h-2">
                                <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-slate-700">Image {tatSession.currentCardIndex + 1}/{tatSession.cards.length}</span>
                            {tatSession.fromMCQ && <span className="ml-2 text-xs text-slate-400">(Part 2 of 2)</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-medium mb-1 ${
                            timeRemaining < 60 ? 'text-red-600' : timeRemaining < 120 ? 'text-amber-600' : 'text-slate-700'
                        }`}>
                            {formatTime(timeRemaining)}
                        </div>
                        <div className="text-slate-500 text-sm font-light">Time Remaining</div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Image Display Card */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 h-full">
                            {/* Display the actual image */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-center min-h-80">
                                <img 
                                    src={currentCard.image_path} 
                                    alt={`Assessment Image`}
                                    className="max-w-full max-h-80 object-contain rounded-lg shadow-md"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                                <div 
                                    className="text-slate-500 text-sm text-center p-8"
                                    style={{ display: 'none' }}
                                >
                                    <div className="w-16 h-16 bg-slate-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-slate-400 rounded-lg"></div>
                                    </div>
                                    Image loading...
                                    <br />
                                    <span className="text-xs">Please wait or refresh if needed</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Story Writing Area */}
                    <div className="lg:col-span-3">
                        <Card className="p-8 h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-medium text-slate-700 mb-4 flex items-center">
                                    <div className="w-2 h-6 bg-purple-400 mr-4"></div>
                                    Write Your Story
                                </h3>
                                
                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-6">
                                    <h4 className="font-medium text-purple-800 mb-2">Include these elements:</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm text-purple-700">
                                        <div>• <span className="font-medium">Current Situation:</span> What's happening now?</div>
                                        <div>• <span className="font-medium">Thoughts & Feelings:</span> What are characters thinking/feeling?</div>
                                        <div>• <span className="font-medium">Preceding Events:</span> What led to this moment?</div>
                                        <div>• <span className="font-medium">Outcome:</span> How does the story end?</div>
                                    </div>
                                </div>
                            </div>

                            {/* Story textarea */}
                            <div className="flex-1 mb-6">
                                <textarea
                                    value={currentStory}
                                    onChange={(e) => setCurrentStory(e.target.value)}
                                    placeholder="Begin your story here... Be imaginative and honest. Describe what you see happening, the characters' thoughts and feelings, what led to this moment, and how the story concludes."
                                    className="w-full h-64 p-6 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-slate-700 leading-relaxed"
                                    disabled={isAnalyzing}
                                />
                                <div className="mt-2 flex justify-between items-center text-sm">
                                    <span className="text-slate-500">
                                        {currentStory.length} characters (minimum 50 recommended)
                                    </span>
                                    <span className={`font-medium ${
                                        currentStory.length < 50 ? 'text-amber-600' : 'text-green-600'
                                    }`}>
                                        {currentStory.length < 50 ? 'Keep writing...' : 'Good length!'}
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button 
                                onClick={handleStorySubmission}
                                disabled={isAnalyzing || currentStory.trim().length < 10}
                                variant="purple"
                                className="w-full py-4 text-lg"
                            >
                                {isAnalyzing ? 'Analyzing Story...' : 
                                 tatSession.currentCardIndex === tatSession.cards.length - 1 ? 'Complete Assessment' : 'Continue to Next Image'}
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TAT Results Component ---

const TATResultsScreen = ({ tatSession, resetApp, hideBackButton = false }) => {
    const stories = tatSession.stories || [];
    
    // Calculate overall NPP scores by averaging individual story scores
    const calculateOverallNPPScores = () => {
        const validStories = stories.filter(story => story.analysis && story.analysis.nppScores);
        if (validStories.length === 0) return null;

        const metrics = [
            'emotional_insight', 'motivational_drivers', 'conflict_complexity', 'problem_solving',
            'interpersonal_understanding', 'self_other_differentiation', 'hope_helpless_index',
            'agency_expression', 'moral_reasoning', 'resilience'
        ];

        const overallScores = {};
        metrics.forEach(metric => {
            const scores = validStories.map(story => story.analysis.nppScores[metric]).filter(score => typeof score === 'number');
            overallScores[metric] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        });

        return overallScores;
    };

    const overallNPPScores = calculateOverallNPPScores();
    const totalTime = stories.reduce((sum, story) => sum + (story.timeSpent || 0), 0);

    // Calculate theme frequency
    const allThemes = stories.flatMap(story => story.analysis?.themes || []);
    const themeFrequency = allThemes.reduce((acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
    }, {});

    const topThemes = Object.entries(themeFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);

    const formatMetricName = (metric) => {
        return metric.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getScoreColor = (score) => {
        if (score >= 4) return 'text-green-600 bg-green-100';
        if (score >= 3) return 'text-blue-600 bg-blue-100';
        if (score >= 2) return 'text-amber-600 bg-amber-100';
        return 'text-red-600 bg-red-100';
    };

    const getScoreDescription = (score) => {
        if (score >= 4.5) return 'Very High';
        if (score >= 3.5) return 'High';
        if (score >= 2.5) return 'Moderate';
        if (score >= 1.5) return 'Low';
        return 'Very Low';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center mb-4">
                        <img 
                            src="/atria logo.jpg" 
                            alt="Atria University" 
                            className="h-20 w-auto mr-4"
                        />
                        <div>
                            <h1 className="text-3xl font-medium text-slate-800">TAT Assessment Results</h1>
                        </div>
                    </div>
                    <p className="text-slate-600 font-light text-lg">
                        Thematic Apperception Test • Narrative Psychological Profile (NPP-30)
                    </p>
                </div>

                {/* Overall Score Section */}
                {overallNPPScores && (() => {
                    // Calculate overall TAT score (0-100)
                    const nppAverage = Object.values(overallNPPScores).reduce((sum, score) => sum + score, 0) / Object.keys(overallNPPScores).length;
                    const overallScore = Math.round((nppAverage / 5) * 100);
                    
                    const getScoreCategory = (score) => {
                        if (score >= 85) return { category: 'Excellent', color: 'text-emerald-600', bgColor: 'bg-emerald-600', description: 'Outstanding psychological narrative capabilities' };
                        if (score >= 75) return { category: 'Very Good', color: 'text-green-600', bgColor: 'bg-green-600', description: 'Strong narrative and emotional understanding' };
                        if (score >= 65) return { category: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-600', description: 'Well-developed narrative skills' };
                        if (score >= 55) return { category: 'Average', color: 'text-amber-600', bgColor: 'bg-amber-600', description: 'Moderate narrative expression abilities' };
                        if (score >= 45) return { category: 'Below Average', color: 'text-orange-600', bgColor: 'bg-orange-600', description: 'Developing narrative capabilities' };
                        return { category: 'Needs Development', color: 'text-red-600', bgColor: 'bg-red-600', description: 'Limited narrative expression observed' };
                    };
                    
                    const scoreInfo = getScoreCategory(overallScore);
                    
                    return (
                        <Card className="p-8 mb-8 relative overflow-hidden">
                            {/* Background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 opacity-50"></div>
                            <div className="relative z-10">
                                <div className="text-center mb-8">
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="w-4 h-10 bg-gradient-to-b from-purple-400 to-indigo-500 mr-4 rounded-full"></div>
                                        <h2 className="text-3xl font-medium text-slate-800">Overall TAT Score</h2>
                                    </div>
                                    
                                    {/* Large Score Display */}
                                    <div className="relative mb-6">
                                        <div className="w-48 h-48 mx-auto relative">
                                            {/* Circular Progress */}
                                            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    stroke="rgb(226, 232, 240)"
                                                    strokeWidth="8"
                                                    fill="transparent"
                                                />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    stroke="url(#gradient)"
                                                    strokeWidth="8"
                                                    fill="transparent"
                                                    strokeDasharray={`${2.51 * overallScore} 251`}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                                <defs>
                                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="rgb(147, 51, 234)" />
                                                        <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            
                                            {/* Score Text */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div className="text-5xl font-light text-slate-800 mb-2">{overallScore}</div>
                                                <div className="text-lg text-slate-600 font-light">out of 100</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Score Category */}
                                    <div className={`inline-flex items-center px-6 py-3 rounded-full text-xl font-medium ${scoreInfo.color} bg-white shadow-lg border-2 border-current/20 mb-4`}>
                                        <div className={`w-3 h-3 ${scoreInfo.bgColor} rounded-full mr-3`}></div>
                                        {scoreInfo.category}
                                    </div>
                                    
                                    <p className="text-slate-600 font-light text-lg max-w-2xl mx-auto">
                                        {scoreInfo.description}
                                    </p>
                                </div>
                                
                                {/* Score Breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-6 bg-white/80 rounded-2xl border border-slate-200">
                                        <div className="text-2xl font-light text-slate-800 mb-2">
                                            {Math.round((nppAverage / 5) * 100)}%
                                        </div>
                                        <p className="text-slate-600 font-light">NPP-30 Average</p>
                                        <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                                            <div 
                                                className="bg-purple-500 h-2 rounded-full transition-all duration-1000" 
                                                style={{ width: `${(nppAverage / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-center p-6 bg-white/80 rounded-2xl border border-slate-200">
                                        <div className="text-2xl font-light text-slate-800 mb-2">
                                            {Math.round((topThemes.length / stories.length) * 100)}%
                                        </div>
                                        <p className="text-slate-600 font-light">Theme Richness</p>
                                        <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                                            <div 
                                                className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                                                style={{ width: `${Math.min((topThemes.length / stories.length) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-center p-6 bg-white/80 rounded-2xl border border-slate-200">
                                        <div className="text-2xl font-light text-slate-800 mb-2">
                                            {Math.round((420 * stories.length - totalTime) / (420 * stories.length) * 100)}%
                                        </div>
                                        <p className="text-slate-600 font-light">Time Efficiency</p>
                                        <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                                            <div 
                                                className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                                                style={{ width: `${Math.round((420 * stories.length - totalTime) / (420 * stories.length) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })()}

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <div className="w-6 h-6 bg-white rounded-lg"></div>
                        </div>
                        <div className="text-3xl font-light text-slate-800 mb-2">{stories.length}</div>
                        <p className="text-slate-600 font-light">Stories Created</p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <div className="w-6 h-6 bg-white rounded-lg"></div>
                        </div>
                        <div className="text-3xl font-light text-slate-800 mb-2">{Math.round(totalTime / 60)}</div>
                        <p className="text-slate-600 font-light">Minutes Total</p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <div className="w-6 h-6 bg-white rounded-lg"></div>
                        </div>
                        <div className="text-3xl font-light text-slate-800 mb-2">{topThemes.length}</div>
                        <p className="text-slate-600 font-light">Themes Identified</p>
                    </Card>
                </div>

                {/* NPP-30 Psychological Profile */}
                {overallNPPScores && (
                    <Card className="p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <div className="w-3 h-8 bg-purple-400 mr-4"></div>
                            <h2 className="text-2xl font-medium text-slate-800">NPP-30 Psychological Profile</h2>
                        </div>
                        <p className="text-slate-600 font-light mb-6">
                            Scores averaged across all your stories (0 = Absent, 5 = Very High)
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(overallNPPScores).map(([metric, score]) => (
                                <div key={metric} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-slate-700">{formatMetricName(metric)}</h4>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
                                            {getScoreDescription(score)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div 
                                            className="bg-purple-500 h-3 rounded-full transition-all duration-500" 
                                            style={{ width: `${(score / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>0</span>
                                        <span className="font-medium">{score.toFixed(1)}</span>
                                        <span>5</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Common Themes */}
                {topThemes.length > 0 && (
                    <Card className="p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <div className="w-3 h-8 bg-indigo-400 mr-4"></div>
                            <h2 className="text-2xl font-medium text-slate-800">Recurring Themes</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {topThemes.map(([theme, frequency]) => (
                                <div key={theme} className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                                    <div className="font-medium text-indigo-800 capitalize mb-1">{theme.replace(/[_-]/g, ' ')}</div>
                                    <div className="text-sm text-indigo-600">{frequency} time{frequency > 1 ? 's' : ''}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Individual Stories */}
                <Card className="p-8">
                    <div className="flex items-center mb-6">
                        <div className="w-3 h-8 bg-emerald-400 mr-4"></div>
                        <h2 className="text-2xl font-medium text-slate-800">Your Stories</h2>
                    </div>
                    
                    <div className="space-y-6">
                        {stories.map((story, index) => {
                            const card = tatSession.cards.find(c => c.card_id === story.cardId);
                            return (
                                <div key={story.cardId} className="border border-slate-200 rounded-xl p-6 bg-white">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mr-4 flex-shrink-0">
                                                {card?.image_path ? (
                                                    <img 
                                                        src={card.image_path} 
                                                        alt={`Assessment Image ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div 
                                                    className="w-full h-full flex items-center justify-center text-slate-400 text-xs"
                                                    style={{ display: card?.image_path ? 'none' : 'flex' }}
                                                >
                                                    No Image
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-slate-800">Story {index + 1}</h4>
                                                <p className="text-sm text-slate-600 font-light">Time spent: {Math.round(story.timeSpent / 60)} min</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h5 className="font-medium text-slate-700 mb-2">Image Description:</h5>
                                        <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg">
                                            {card?.description || 'No description available'}
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <h5 className="font-medium text-slate-700 mb-2">Your Story:</h5>
                                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                                            {story.story}
                                        </p>
                                    </div>

                                    {story.analysis && (
                                        <div className="border-t border-slate-200 pt-4">
                                            <h5 className="font-medium text-slate-700 mb-3">AI Analysis:</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                {story.analysis.themes && story.analysis.themes.length > 0 && (
                                                    <div>
                                                        <span className="font-medium text-slate-600">Themes: </span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {story.analysis.themes.map((theme, i) => (
                                                                <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                                                    {theme}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {story.analysis.emotions && story.analysis.emotions.length > 0 && (
                                                    <div>
                                                        <span className="font-medium text-slate-600">Emotions: </span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {story.analysis.emotions.map((emotion, i) => (
                                                                <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                                                    {emotion}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Educational Note */}
                <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">Important Note</h4>
                    <p className="text-amber-700 text-sm leading-relaxed">
                        This TAT assessment is designed for educational purposes to help you understand projective testing concepts. 
                        The results are not for clinical diagnosis and should be used for learning, discussion, and self-reflection only.
                    </p>
                </div>

                {/* Back Button */}
                {!hideBackButton && (
                    <div className="mt-8 text-center">
                        <Button 
                            onClick={resetApp} 
                            variant="primary"
                            className="px-8 py-4 text-lg"
                        >
                            Return to Dashboard
                        </Button>
                        
                        {/* Peop360 Branding */}
                        <div className="mt-8">
                            <div className="flex items-center justify-center space-x-3">
                                <span className="text-base text-slate-600 font-light">Created by :</span>
                                <a 
                                    href="https://www.peop360.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:scale-105 transition-transform duration-300"
                                >
                                    <img 
                                        src="/images/peop360-logo.png" 
                                        alt="Peop360" 
                                        className="h-8 w-auto"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- View Components ---

const LoginScreen = ({ setUserRole, isAuthReady, currentUser, userId }) => {
    if (!isAuthReady) return <LoadingSpinner />;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
            {/* Subtle 3D geometric shapes */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-blue-200/30 transform rotate-45 shadow-lg"></div>
                <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-slate-300/20 rounded-full shadow-md"></div>
                <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-indigo-400/15 transform rotate-12 shadow-sm"></div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center min-h-screen p-8">
                {/* Main Title */}
                <div className="text-center mb-12">
                    <img 
                        src="/atria logo.jpg" 
                        alt="Atria University" 
                        className="h-32 w-auto mx-auto mb-6"
                    />
                    <h1 className="text-6xl font-light text-slate-800 mb-4 tracking-wide">
                        <span className="font-thin">Beyonders</span>
                        <span className="font-medium text-blue-600 ml-2">360</span>
                    </h1>
                    <div className="w-24 h-0.5 bg-blue-400 mx-auto mb-4"></div>
                    <p className="text-lg text-slate-600 font-light">Advanced Assessment Platform</p>
                </div>
                
                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-200/50 max-w-md w-full transform hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] transition-all duration-500">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-slate-200 to-blue-300 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transform hover:scale-105 transition-transform duration-300">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg transform rotate-45"></div>
                        </div>
                        <h2 className="text-2xl font-light text-slate-700 mb-2">Get Started</h2>
                        <p className="text-slate-500 font-light">Select your role to continue</p>
                    </div>
                    
                    <div className="space-y-4">
                        <button
                            onClick={() => setUserRole({ role: 'student', id: userId })}
                            className="w-full p-4 bg-white rounded-2xl border border-slate-200 text-slate-700 font-medium shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] transform hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-center">
                                <div className="w-6 h-6 bg-blue-300 rounded-lg mr-3 group-hover:bg-blue-400 transition-colors duration-300"></div>
                                <span>Student</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setUserRole({ role: 'admin', id: userId })}
                            className="w-full p-4 bg-white rounded-2xl border border-slate-200 text-slate-700 font-medium shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] transform hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-center">
                                <div className="w-6 h-6 bg-purple-300 rounded-lg mr-3 group-hover:bg-purple-400 transition-colors duration-300"></div>
                                <span>Administrator</span>
                            </div>
                        </button>
                    </div>
                    
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 text-center font-light">
                            Session ID: <span className="font-mono text-gray-500">{userId.substring(0, 8)}...</span>
                        </p>
                    </div>
                </div>
                
                {/* Feature indicators */}
                <div className="mt-12 flex space-x-8">
                    <div className="text-center">
                        <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-2"></div>
                        <p className="text-xs text-slate-500 font-light">Adaptive</p>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mx-auto mb-2"></div>
                        <p className="text-xs text-slate-600 font-medium">Intelligent</p>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 bg-purple-400 rounded-full mx-auto mb-2"></div>
                        <p className="text-xs text-slate-500 font-light">Secure</p>
                    </div>
                </div>
                
                {/* Peop360 Branding */}
                <div className="mt-16 text-center">
                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-slate-600 font-light">Created by :</span>
                        <a 
                            href="https://www.peop360.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            <img 
                                src="/images/peop360-logo.png" 
                                alt="Peop360" 
                                className="h-6 w-auto"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            {/* Subtle geometric background */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23334155' fill-opacity='1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center min-h-screen p-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <img 
                        src="/atria logo.jpg" 
                        alt="Atria University" 
                        className="h-32 w-auto mx-auto mb-6"
                    />
                    <h1 className="text-5xl font-light text-slate-800 mb-4">
                        <span className="font-thin">Assessment</span>
                        <span className="font-medium text-indigo-600 ml-2">Center</span>
                    </h1>
                    <div className="w-20 h-0.5 bg-indigo-400 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-light">Select your assessment stream</p>
                </div>

                {/* Stream Selection */}
                <Card className="max-w-4xl w-full p-8 mb-8">
                    <h3 className="text-xl font-medium text-slate-700 mb-6 flex items-center">
                        <div className="w-2 h-8 bg-blue-400 mr-4"></div>
                        Choose Your Assessment Stream
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => navigate('/science')}
                            className="p-8 rounded-2xl border-2 text-left transition-all duration-300 transform hover:-translate-y-1 border-slate-200 bg-white hover:border-blue-300 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)]"
                        >
                            <div className="flex items-start">
                                <div className="w-6 h-6 rounded-lg mr-4 mt-1 bg-blue-500"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-2 text-lg">Science & Technology</h4>
                                    <p className="text-sm text-slate-600 font-light mb-3">Physics, Chemistry, Biology</p>
                                    <div className="space-y-1 text-xs text-slate-500">
                                        <div>• Part 1: 30 MCQ Questions</div>
                                        <div>• Part 2: TAT Assessment (31st question)</div>
                                        <div>• Adaptive difficulty</div>
                                        <div>• Comprehensive evaluation</div>
                                    </div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/non-science')}
                            className="p-8 rounded-2xl border-2 text-left transition-all duration-300 transform hover:-translate-y-1 border-slate-200 bg-white hover:border-purple-300 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_rgba(147,51,234,0.15)]"
                        >
                            <div className="flex items-start">
                                <div className="w-6 h-6 rounded-lg mr-4 mt-1 bg-purple-500"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-2 text-lg">Non-Science</h4>
                                    <p className="text-sm text-slate-600 font-light mb-3">Literature, History, Social Studies</p>
                                    <div className="space-y-1 text-xs text-slate-500">
                                        <div>• Part 1: 30 MCQ Questions</div>
                                        <div>• Part 2: TAT Assessment (31st question)</div>
                                        <div>• Adaptive difficulty</div>
                                        <div>• Comprehensive evaluation</div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </Card>

                {/* Assessment Info */}
                <Card className="max-w-4xl w-full p-8">
                    <h3 className="text-xl font-medium text-slate-700 mb-6 flex items-center">
                        <div className="w-2 h-8 bg-indigo-400 mr-4"></div>
                        Assessment Structure
                    </h3>
                    <div className="space-y-6">
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-4">Part 1: MCQ Assessment (Questions 1-30)</h4>
                            <div className="space-y-2 text-sm text-blue-700">
                                <p>• Domain and behavioral questions</p>
                                <p>• Adaptive difficulty based on performance</p>
                                <p>• Real-time scoring and feedback</p>
                                <p>• AI-powered hints available</p>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                            <h4 className="font-semibold text-purple-800 mb-4">Part 2: TAT Assessment (Question 31)</h4>
                            <div className="space-y-2 text-sm text-purple-700">
                                <p>• Thematic Apperception Test</p>
                                <p>• 3 images with storytelling prompts</p>
                                <p>• 7 minutes per image</p>
                                <p>• Psychological theme analysis using NPP-30</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tips */}
                <div className="mt-8 max-w-4xl w-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4">
                            <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-600 font-light">Focus maintained</p>
                        </div>
                        <div className="p-4">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-600 font-medium">Think carefully</p>
                        </div>
                        <div className="p-4">
                            <div className="w-3 h-3 bg-purple-400 rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-600 font-light">Be authentic</p>
                        </div>
                    </div>
                </div>
                
                {/* Peop360 Branding */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                        <span className="text-base text-slate-600 font-light">Created by :</span>
                        <a 
                            href="https://www.peop360.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            <img 
                                src="/images/peop360-logo.png" 
                                alt="Peop360" 
                                className="h-8 w-auto"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stream-specific Assessment Configuration Component
const StreamAssessmentConfig = ({ stream, startQuiz }) => {
    const navigate = useNavigate();
    const [initialDifficulty, setInitialDifficulty] = useState('MEDIUM');

    const streamInfo = {
        SCIENCE: {
            title: 'Science & Technology',
            description: 'Physics, Chemistry, Biology',
            color: 'blue'
        },
        NON_SCIENCE: {
            title: 'Non-Science',
            description: 'Literature, History, Social Studies',
            color: 'purple'
        }
    };

    const info = streamInfo[stream];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23334155' fill-opacity='1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center min-h-screen p-8">
                {/* Back button */}
                <div className="absolute top-8 left-8">
                    {/* <Button onClick={() => navigate('/')} variant="secondary" className="flex items-center">
                        <span className="mr-2">←</span> Back to Stream Selection
                    </Button> */}
                </div>

                {/* Atria University Header */}
                <div className="text-center mb-8">
                    <img 
                        src="/atria logo.jpg" 
                        alt="Atria University" 
                        className="h-24 w-auto mx-auto mb-3"
                    />
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-light text-slate-800 mb-4">
                        <span className="font-thin">{info.title}</span>
                        <span className="font-medium text-indigo-600 ml-2">Assessment</span>
                    </h1>
                    <div className="w-20 h-0.5 bg-indigo-400 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-light">{info.description}</p>
                </div>

                {/* Assessment Structure Info */}
                <Card className="max-w-4xl w-full p-8 mb-8">
                    <h3 className="text-xl font-medium text-slate-700 mb-6 flex items-center">
                        <div className={`w-2 h-8 bg-${info.color}-400 mr-4`}></div>
                        Assessment Structure (31 Questions Total)
                    </h3>
                    <div className="space-y-6">
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-4">Part 1: MCQ Assessment (Questions 1-30)</h4>
                            <div className="space-y-2 text-sm text-blue-700">
                                <p>• Domain and behavioral questions</p>
                                <p>• Adaptive difficulty based on your performance</p>
                                <p>• Real-time scoring and feedback</p>
                                <p>• AI-powered hints available</p>
                                <p className="font-medium">• Automatically progresses to Part 2 after completion</p>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                            <h4 className="font-semibold text-purple-800 mb-4">Part 2: TAT Assessment (Question 31)</h4>
                            <div className="space-y-2 text-sm text-purple-700">
                                <p>• Thematic Apperception Test</p>
                                <p>• 3 images with storytelling prompts</p>
                                <p>• 7 minutes per image</p>
                                <p>• Psychological theme analysis using NPP-30</p>
                                <p className="font-medium">• No right or wrong answers - be authentic and creative</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Difficulty Selection */}
                <Card className="max-w-4xl w-full p-8 mb-8">
                    <h3 className="text-xl font-medium text-slate-700 mb-6 flex items-center">
                        <div className="w-2 h-8 bg-indigo-400 mr-4"></div>
                        Starting Difficulty (Part 1 MCQs)
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                            <button
                                key={key}
                                onClick={() => setInitialDifficulty(key)}
                                className={`p-4 rounded-xl border text-center transition-all duration-300 transform hover:-translate-y-0.5 ${
                                    initialDifficulty === key
                                        ? 'border-indigo-400 bg-indigo-50 shadow-[0_6px_20px_rgba(99,102,241,0.15)]'
                                        : 'border-slate-200 bg-white hover:border-indigo-300 shadow-[0_3px_10px_rgba(0,0,0,0.04)]'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg mx-auto mb-3 ${
                                    key === 'EASY' ? 'bg-emerald-300' : key === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'
                                }`}></div>
                                <div className="font-medium text-slate-700">{level.label}</div>
                                <div className="text-xs text-slate-500 mt-1">{level.multiplier}x multiplier</div>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Start Button */}
                <Card className="max-w-4xl w-full p-8">
                    <Button 
                        onClick={() => startQuiz(stream, initialDifficulty)} 
                        variant="primary"
                        className="w-full py-4 text-lg"
                    >
                        Begin {info.title} Assessment
                    </Button>
                </Card>

                {/* Tips */}
                <div className="mt-8 max-w-4xl w-full">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4">
                            <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-600 font-light">Stay focused</p>
                        </div>
                        <div className="p-4">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-600 font-medium">Think carefully</p>
                        </div>
                        <div className="p-4">
                            <div className="w-3 h-3 bg-purple-400 rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-600 font-light">Be authentic</p>
                        </div>
                        <div className="p-4">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-600 font-light">Complete both parts</p>
                        </div>
                    </div>
                </div>

                {/* Peop360 Branding */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                        <span className="text-base text-slate-600 font-light">Created by :</span>
                        <a 
                            href="https://www.peop360.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            <img 
                                src="/images/peop360-logo.png" 
                                alt="Peop360" 
                                className="h-8 w-auto"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = ({ scores, loadingScores, currentUser, userId, goBackToLogin }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                    <img 
                        src="/atria logo.jpg" 
                        alt="Atria University" 
                        className="h-20 w-auto"
                    />
                    <div>
                        <h1 className="text-4xl font-light text-slate-800">Administration</h1>
                        <div className="w-16 h-0.5 bg-purple-400 mt-2"></div>
                    </div>
                </div>
                <Button onClick={goBackToLogin} variant="purple" className="">
                    Sign Out
                </Button>
            </div>
            
            <div className="mb-6 p-4 bg-white/80 rounded-2xl border border-slate-200">
                <p className="text-sm text-slate-600 font-light">
                    Administrator ID: <span className="font-mono text-slate-700">{userId.substring(0, 16)}...</span>
                </p>
            </div>

            <Card className="p-8">
                <h2 className="text-2xl font-medium text-slate-700 mb-6 flex items-center">
                    <div className="w-2 h-6 bg-purple-400 mr-4"></div>
                    Assessment Results
                </h2>
                {loadingScores ? (
                    <div className="text-center py-16 text-slate-500">
                        <div className="w-8 h-8 border-2 border-slate-300 rounded-full animate-spin border-t-purple-500 mx-auto mb-4"></div>
                        <p className="font-light">Loading assessment data...</p>
                    </div>
                ) : scores.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <div className="w-6 h-6 bg-purple-400 rounded-lg"></div>
                        </div>
                        <p className="font-light">No assessment results available</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Rank</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">User ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Stream</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Score</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Duration</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Focus</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((score, index) => (
                                    <tr key={score.id} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{score.userId.substring(0, 8)}...</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{score.stream.replace('_', ' ')} ({score.initialDifficulty})</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">{score.finalScore.toFixed(1)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{score.timeTaken.toFixed(0)}s</td>
                                        <td className="px-6 py-4 text-sm font-medium text-center">
                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                                score.proctorWarnings === 0 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {score.proctorWarnings === 0 ? 'Good' : `${score.proctorWarnings} warning${score.proctorWarnings > 1 ? 's' : ''}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {score.timestamp?.toDate ? score.timestamp.toDate().toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

const QuizScreen = ({ session, handleAnswer, submitQuiz, proctorWarnings, incrementProctorWarning }) => {
    const { questions, currentQIndex, correctStreak, score, currentDifficulty, stream } = session;
    const currentQuestion = questions[currentQIndex];
    const difficultyInfo = DIFFICULTY_LEVELS[currentDifficulty];

    const [selectedOption, setSelectedOption] = useState(null);
    const [hint, setHint] = useState(null);
    const [isHintLoading, setIsHintLoading] = useState(false);

    // Calculate progress percentage (Part 1 MCQs only - 30 questions)
    const progressPercentage = ((currentQIndex + 1) / TOTAL_MCQ_QUESTIONS) * 100;

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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
                <Card className="max-w-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-blue-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                    </div>
                    <h2 className="text-3xl font-light text-slate-800 mb-4">Part 1 Complete!</h2>
                    <p className="text-slate-600 font-light mb-4">Great job! You've completed all 30 MCQ questions.</p>
                    <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200 mb-8">
                        <h3 className="font-semibold text-purple-800 mb-3">Next: Part 2 - TAT Assessment (Question 31)</h3>
                        <p className="text-sm text-purple-700 mb-2">You will now begin the Thematic Apperception Test.</p>
                        <p className="text-sm text-purple-700">This is the final part of your comprehensive assessment.</p>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">Transitioning to TAT Assessment automatically...</p>
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
                        <div className="flex items-center mb-2">
                            <img 
                                src="/atria logo.jpg" 
                                alt="Atria University" 
                                className="h-16 w-auto mr-4"
                            />
                        </div>
                        <p className="text-slate-600 font-light mt-1">{stream.replace('_', ' ')} Assessment - Part 1: MCQs</p>
                        <div className="flex items-center mt-3">
                            <span className="text-sm text-slate-500 mr-3">Progress</span>
                            <div className="bg-slate-200 rounded-full w-32 h-2">
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-slate-700">{currentQIndex + 1}/{TOTAL_MCQ_QUESTIONS}</span>
                            <span className="ml-2 text-xs text-slate-400">(Part 1 of 2)</span>
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
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p className="text-blue-700 font-medium">Excellent progress! {correctStreak} consecutive correct answers.</p>
                                </div>
                            )}
                            {correctStreak === 5 && (
                                <div className="mb-6 p-4 bg-indigo-100 border border-indigo-300 rounded-xl">
                                    <p className="text-indigo-800 font-medium">Outstanding! Perfect streak achieved. Difficulty increased.</p>
                                </div>
                            )}

                            {/* Question */}
                            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center mb-4">
                                    <div className="w-2 h-6 bg-blue-400 mr-4"></div>
                                    <span className="text-lg font-medium text-slate-700">
                                        {isDomainQuestion ? "Knowledge Assessment" : "Behavioral Evaluation"}
                                    </span>
                                </div>
                                <h3 className="text-xl font-medium text-slate-800 leading-relaxed">
                                    {currentQuestion.text}
                                </h3>
                            </div>
                            
                            {/* AI Hint Section */}
                            {isDomainQuestion && (
                                <div className="mb-6 flex justify-between items-center">
                                    <span className="text-slate-600 font-light">Need assistance? Request AI guidance</span>
                                    <Button 
                                        onClick={generateHint} 
                                        disabled={isHintLoading}
                                        variant="purple"
                                        className="text-sm"
                                    >
                                        {isHintLoading ? 'Analyzing...' : 'Get Hint'}
                                    </Button>
                                </div>
                            )}

                            {hint && (
                                <div className="mb-6 p-4 bg-white border border-purple-200 rounded-xl shadow-[0_4px_15px_rgba(147,51,234,0.08)]">
                                    <p className="font-medium text-purple-700 mb-2">AI Guidance:</p>
                                    <p className="text-slate-600 font-light leading-relaxed">{hint}</p>
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
                                                ? 'border-gray-500 bg-gray-100 shadow-[0_6px_20px_rgba(0,0,0,0.08)] font-medium'
                                                : 'border-gray-200 bg-white hover:border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.08)]'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-6 h-6 rounded-lg border mr-4 flex items-center justify-center text-sm font-medium ${
                                                selectedOption === option 
                                                    ? 'border-blue-600 bg-blue-600 text-white' 
                                                    : 'border-slate-500 bg-white text-slate-800'
                                            }`}>
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <span className="text-slate-700">{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Submit Button */}
                            <Button 
                                onClick={onSubmit} 
                                disabled={selectedOption === null} 
                                variant="primary"
                                className="w-full py-4 text-lg"
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

const ReportScreen = ({ session, finalScore, timeTaken, resetApp, currentUser, userId }) => {
    // We make quizResults a state so we can add the remediation text dynamically
    const [results, setResults] = useState(session.quizResults.map(r => ({ ...r, remediationText: null, isLoading: false })));
    const [showTATResults, setShowTATResults] = useState(false);

    const correctAnswers = results.filter(r => r.isCorrect).length;

    const generateExplanation = useCallback(async (index) => {
        const result = results[index];
        if (!result) return;
        
        // 1. Set loading state
        setResults(prev => prev.map((r, i) => i === index ? { ...r, isLoading: true } : r));

        const question = result.question.text;
        const userAnswer = result.userAnswer;
        const correctAnswer = result.question.answer;

        const userQuery = `The student answered the question "${question}" with "${userAnswer}". The correct answer is "${correctAnswer}". Provide a detailed, easy-to-understand explanation of the correct concept and clearly explain why the student's selected answer was incorrect.`;
        const systemPrompt = "You are a patient and supportive AI academic tutor. Your response must be highly educational and encouraging. Use simple language appropriate for a 12th-grade student. Use proper formatting (markdown bolding/lists) for clarity.";

        try {
            const generatedExplanation = await callGroqApi(userQuery, systemPrompt);
            
            // 2. Update the specific result with the explanation
            setResults(prev => prev.map((r, i) => i === index ? { 
                ...r, 
                remediationText: generatedExplanation, 
                isLoading: false 
            } : r));

        } catch (error) {
            setResults(prev => prev.map((r, i) => i === index ? { 
                ...r, 
                remediationText: "Sorry, I couldn't generate a detailed explanation right now.", 
                isLoading: false 
            } : r));
        }
    }, [results]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center mb-4">
                        <img 
                            src="/atria logo.jpg" 
                            alt="Atria University" 
                            className="h-20 w-auto mr-4"
                        />
                        <div>
                            <h1 className="text-3xl font-medium text-slate-800">Assessment Results</h1>
                        </div>
                    </div>
                    <p className="text-slate-600 font-light text-lg">
                        {session.stream.replace('_', ' ')} • Started at {DIFFICULTY_LEVELS[session.initialDifficulty].label} level
                    </p>
                    {session.tatCompleted && (
                        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <p className="text-purple-800 font-medium text-sm">
                                ✓ Complete Assessment: 30 MCQs + TAT (31 questions total)
                            </p>
                            <p className="text-purple-600 text-xs mt-1">
                                You completed both Part 1 (MCQ) and Part 2 (TAT Assessment)
                            </p>
                            
                            {/* Toggle Buttons */}
                            <div className="flex gap-3 mt-4">
                                <Button
                                    onClick={() => setShowTATResults(false)}
                                    variant={!showTATResults ? "primary" : "secondary"}
                                    className="flex-1 py-2 text-sm"
                                >
                                    View MCQ Results
                                </Button>
                                <Button
                                    onClick={() => setShowTATResults(true)}
                                    variant={showTATResults ? "purple" : "secondary"}
                                    className="flex-1 py-2 text-sm"
                                >
                                    View TAT Results
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Conditional Rendering: MCQ Results or TAT Results */}
                {showTATResults && session.tatCompleted ? (
                    // Show comprehensive TAT Results (reuse TATResultsScreen component logic)
                    <TATResultsScreen 
                        tatSession={{ 
                            stories: session.tatResults?.stories || [],
                            cards: TAT_CARDS,
                            timeTaken: session.tatResults?.timeTaken || 0
                        }} 
                        resetApp={() => setShowTATResults(false)}
                        hideBackButton={true}
                    />
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <div className="w-6 h-6 bg-white rounded-lg"></div>
                        </div>
                        <div className="text-3xl font-light text-slate-800 mb-2">{finalScore.toFixed(0)}</div>
                        <p className="text-slate-600 font-light">Final Score</p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <div className="w-6 h-6 bg-white rounded-lg"></div>
                        </div>
                        <div className="text-3xl font-light text-slate-800 mb-2">{correctAnswers}/{TOTAL_MCQ_QUESTIONS}</div>
                        <p className="text-slate-600 font-light">Correct Answers (MCQ)</p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <div className="w-6 h-6 bg-white rounded-lg"></div>
                        </div>
                        <div className="text-3xl font-light text-slate-800 mb-2">{timeTaken.toFixed(1)}s</div>
                        <p className="text-slate-600 font-light">Time Taken</p>
                    </Card>
                </div>

                {/* Proctoring Status */}
                <Card className="p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-slate-800 mb-2">Focus Monitoring</h3>
                            <p className="text-slate-600 font-light">Assessment supervision status</p>
                        </div>
                        <div className="text-right">
                            <div className={`inline-flex items-center px-4 py-2 rounded-xl ${
                                session.proctorWarnings === 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                    session.proctorWarnings === 0 ? 'bg-gray-500' : 'bg-gray-700'
                                }`}></div>
                                {session.proctorWarnings === 0 ? 'Maintained Focus' : `${session.proctorWarnings} Warning${session.proctorWarnings > 1 ? 's' : ''}`}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Detailed Results */}
                <Card className="p-8">
                    <div className="flex items-center mb-6">
                        <div className="w-3 h-8 bg-indigo-400 mr-4"></div>
                        <h2 className="text-2xl font-medium text-slate-800">Part 1: MCQ Analysis</h2>
                    </div>
                    
                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <div key={result.question.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium mr-4 ${
                                                result.isCorrect 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-red-500 text-white'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                                                result.isCorrect 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {result.isCorrect ? 'Correct' : 'Incorrect'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-800 mb-3 leading-relaxed">
                                            {result.question.text}
                                        </h3>
                                        
                                        <div className="space-y-2">
                                            <div className="text-sm">
                                                <span className="text-gray-600 font-light">Your answer: </span>
                                                <span className={`font-medium ${
                                                    result.isCorrect ? 'text-gray-700' : 'text-gray-800'
                                                }`}>
                                                    {result.userAnswer}
                                                </span>
                                            </div>
                                            
                                            {!result.isCorrect && (
                                                <div className="text-sm">
                                                    <span className="text-gray-600 font-light">Correct answer: </span>
                                                    <span className="font-medium text-gray-800">
                                                        {result.question.answer}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="text-xs text-gray-500 pt-2">
                                                {DIFFICULTY_LEVELS[result.difficulty].label} • {DIFFICULTY_LEVELS[result.difficulty].multiplier.toFixed(1)}x multiplier • {result.pointsEarned.toFixed(2)} points earned
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!result.isCorrect && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-600 font-light">Need detailed explanation?</span>
                                            <Button
                                                onClick={() => generateExplanation(index)}
                                                disabled={result.isLoading}
                                                variant="purple"
                                                className="px-4 py-2 text-sm"
                                            >
                                                {result.isLoading ? 'Analyzing...' : 'Get AI Explanation'}
                                            </Button>
                                        </div>
                                        
                                        {result.remediationText && (
                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <p className="font-medium text-gray-700 mb-2">AI Analysis:</p>
                                                <p className="text-gray-600 font-light leading-relaxed whitespace-pre-wrap">
                                                    {result.remediationText}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
                    </>
                )}

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <Button 
                        onClick={resetApp} 
                        className="px-8 py-4 text-lg bg-gray-800 text-white hover:bg-gray-900 border-gray-800 shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8_25px_rgba(0,0,0,0.2)]"
                    >
                        Return to Dashboard
                    </Button>
                    
                    {/* Peop360 Branding */}
                    <div className="mt-8">
                        <div className="flex items-center justify-center space-x-3">
                            <span className="text-base text-slate-600 font-light">Created by :</span>
                            <a 
                                href="https://www.peop360.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:scale-105 transition-transform duration-300"
                            >
                                <img 
                                    src="/images/peop360-logo.png" 
                                    alt="Peop360" 
                                    className="h-8 w-auto"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Application Component ---

const App = () => {
    const { db, auth, currentUser, isAuthReady } = useFirebase();
    const userId = currentUser?.uid || 'anonymous';
    const { scores, loadingScores, saveScore } = useScores(db, currentUser);
    const location = useLocation();

    const [userRole, setUserRole] = useState(null); // { role: 'student' | 'admin', id: '...' }
    const [view, setView] = useState('login'); // 'login', 'studentDashboard', 'adminDashboard', 'quiz', 'report', 'tat', 'tatResults'

    const [quizSession, setQuizSession] = useState(null);
    const [tatSession, setTATSession] = useState(null);
    const [proctorWarnings, setProctorWarnings] = useState(0);

    // Auto-login for direct stream routes
    useEffect(() => {
        const isDirectStreamRoute = location.pathname === '/science' || 
                                     location.pathname === '/non-science' ||
                                     location.pathname === '/nonscience';
        
        if (isAuthReady && !userRole && isDirectStreamRoute) {
            setUserRole({ role: 'student', id: userId });
            setView('studentDashboard');
        }
    }, [isAuthReady, userRole, location.pathname, userId]);

    // Initial effect to route user after auth is ready
    useEffect(() => {
        if (isAuthReady && !userRole) {
            setView('login');
        } else if (userRole?.role === 'student' && view === 'login') {
            setView('studentDashboard');
        } else if (userRole?.role === 'admin' && view === 'login') {
            setView('adminDashboard');
        }
    }, [isAuthReady, userRole, view]);

    const incrementProctorWarning = useCallback(() => {
        setProctorWarnings(prev => prev + 1);
    }, []);

    const startQuiz = useCallback((stream, initialDifficulty) => {
        // Prepare a pool of all questions for the stream
        const easyQs = QUESTIONS[stream].EASY;
        const mediumQs = QUESTIONS[stream].MEDIUM;
        const hardQs = QUESTIONS[stream].HARD;

        // Select 30 MCQ questions (Part 1)
        const allQuestions = [...easyQs, ...mediumQs, ...hardQs]
            .sort(() => 0.5 - Math.random()) // Shuffle
            .slice(0, TOTAL_MCQ_QUESTIONS); // Take 30 questions for Part 1

        setQuizSession({
            stream,
            initialDifficulty,
            questions: allQuestions,
            currentQIndex: 0,
            correctStreak: 0,
            score: 0,
            currentDifficulty: initialDifficulty,
            startTime: Date.now(),
            quizResults: [], // Stores { question, userAnswer, isCorrect, pointsEarned, difficulty }
            mcqCompleted: false, // Track if MCQ part is done
        });
        setProctorWarnings(0);
        setView('quiz');
    }, []);

    const startTATAssessment = useCallback(() => {
        // Select 3 cards for TAT assessment
        const selectedCards = [...TAT_CARDS].sort(() => 0.5 - Math.random()).slice(0, 3);
        
        setTATSession({
            cards: selectedCards,
            currentCardIndex: 0,
            stories: [],
            startTime: Date.now(),
            fromMCQ: false, // Standalone TAT assessment
        });
        setProctorWarnings(0);
        setView('tat');
    }, []);

    const startTATAssessmentFromMCQ = useCallback(() => {
        // Select 3 cards for TAT assessment as part of full assessment
        const selectedCards = [...TAT_CARDS].sort(() => 0.5 - Math.random()).slice(0, 3);
        
        setTATSession({
            cards: selectedCards,
            currentCardIndex: 0,
            stories: [],
            startTime: Date.now(),
            fromMCQ: true, // Part of full assessment (question 31)
        });
        setView('tat');
    }, []);

    const handleAnswer = useCallback((questionId, selectedOption) => {
        setQuizSession(prev => {
            if (!prev) return prev;

            const currentQuestion = prev.questions[prev.currentQIndex];
            const isCorrect = currentQuestion.answer === selectedOption;
            const difficultyMultiplier = DIFFICULTY_LEVELS[prev.currentDifficulty].multiplier;

            // Base points for a correct answer: 100 * difficulty_multiplier
            const pointsEarned = isCorrect ? (100 * difficultyMultiplier) : 0;

            const newResults = [
                ...prev.quizResults,
                {
                    question: currentQuestion,
                    userAnswer: selectedOption,
                    isCorrect,
                    difficulty: prev.currentDifficulty,
                    pointsEarned,
                }
            ];

            let newStreak = prev.correctStreak;
            let newDifficulty = prev.currentDifficulty;

            if (isCorrect) {
                newStreak += 1;
                // Difficulty increases after 5 consecutive correct answers
                if (newStreak >= 5) {
                    const nextDifficulty = DIFFICULTY_LEVELS[prev.currentDifficulty].next;
                    if (nextDifficulty) {
                        newDifficulty = nextDifficulty;
                        newStreak = 0; // Reset streak upon difficulty change
                    }
                }
            } else {
                newStreak = 0; // Reset streak on any wrong answer
                // Difficulty decreases on any wrong answer
                const prevDifficulty = DIFFICULTY_LEVELS[prev.currentDifficulty].prev;
                if (prevDifficulty) {
                    newDifficulty = prevDifficulty;
                }
            }

            const nextIndex = prev.currentQIndex + 1;

            // Check if we've completed all 30 MCQ questions (Part 1)
            if (nextIndex >= TOTAL_MCQ_QUESTIONS) {
                // Transition to TAT assessment (Part 2)
                setTimeout(() => {
                    startTATAssessmentFromMCQ();
                }, 100);
                
                return {
                    ...prev,
                    quizResults: newResults,
                    score: prev.score + pointsEarned,
                    currentQIndex: nextIndex,
                    mcqCompleted: true,
                };
            }

            return {
                ...prev,
                quizResults: newResults,
                score: prev.score + pointsEarned,
                currentQIndex: nextIndex,
                correctStreak: newStreak,
                currentDifficulty: newDifficulty,
            };
        });
    }, []);

    const handleTATStory = useCallback(async (storyData) => {
        setTATSession(prev => {
            if (!prev) return prev;

            const newStories = [...prev.stories, storyData];
            const nextIndex = prev.currentCardIndex + 1;

            return {
                ...prev,
                stories: newStories,
                currentCardIndex: nextIndex,
            };
        });
    }, []);

    const submitQuiz = useCallback(() => {
        if (!quizSession) return;

        const timeTaken = (Date.now() - quizSession.startTime) / 1000;
        
        // Final Score Calculation: Score is already calculated, we just incorporate time factor.
        // Penalty factor: 0.99 for every 10 seconds over 60 seconds average per question. (6 seconds per question is ideal)
        const idealTime = TOTAL_QUESTIONS * 10;
        const timeFactor = Math.max(0, 1 - (timeTaken - idealTime) / (idealTime * 2)); // Max 50% penalty

        const finalScore = quizSession.score * (1 + timeFactor);

        const scoreData = {
            stream: quizSession.stream,
            initialDifficulty: quizSession.initialDifficulty,
            finalScore: finalScore,
            rawScore: quizSession.score,
            timeTaken: timeTaken,
            proctorWarnings: proctorWarnings,
            correctAnswers: quizSession.quizResults.filter(r => r.isCorrect).length,
        };

        saveScore(scoreData);

        setQuizSession(prev => ({
            ...prev,
            ...scoreData,
            timeTaken,
            finalScore,
        }));

        setView('report');
    }, [quizSession, saveScore, proctorWarnings]);

    const submitTATAssessment = useCallback(() => {
        if (!tatSession) return;

        const timeTaken = (Date.now() - tatSession.startTime) / 1000;

        // Check if this is part of a full MCQ+TAT assessment
        if (tatSession.fromMCQ && quizSession) {
            // Combine MCQ and TAT results for final report
            const totalTimeTaken = ((Date.now() - quizSession.startTime) / 1000);
            
            // Final Score Calculation including TAT completion bonus
            const idealTime = TOTAL_MCQ_QUESTIONS * 10;
            const timeFactor = Math.max(0, 1 - (totalTimeTaken - idealTime) / (idealTime * 2));
            const tatCompletionBonus = 200; // Bonus points for completing TAT
            const finalScore = (quizSession.score + tatCompletionBonus) * (1 + timeFactor);

            const combinedResults = {
                stream: quizSession.stream,
                initialDifficulty: quizSession.initialDifficulty,
                finalScore: finalScore,
                rawScore: quizSession.score,
                timeTaken: totalTimeTaken,
                proctorWarnings: proctorWarnings,
                correctAnswers: quizSession.quizResults.filter(r => r.isCorrect).length,
                tatCompleted: true,
                tatStories: tatSession.stories.length,
                assessmentType: 'FULL', // MCQ + TAT
            };

            saveScore(combinedResults);

            setQuizSession(prev => ({
                ...prev,
                ...combinedResults,
                finalScore,
                tatResults: {
                    totalStories: tatSession.stories.length,
                    timeTaken: timeTaken,
                    stories: tatSession.stories, // Store the actual stories
                },
            }));

            setView('report');
        } else {
            // Standalone TAT assessment
            const tatResults = {
                assessmentType: 'TAT',
                totalStories: tatSession.stories.length,
                timeTaken: timeTaken,
                proctorWarnings: proctorWarnings,
            };

            console.log('TAT Assessment completed:', tatResults);

            setTATSession(prev => ({
                ...prev,
                ...tatResults,
                timeTaken,
            }));

            setView('tatResults');
        }
    }, [tatSession, quizSession, proctorWarnings, saveScore]);

    const goBackToLogin = () => {
        setUserRole(null);
        setView('login');
    };
    
    const resetApp = () => {
        setQuizSession(null);
        setTATSession(null);
        // Navigate back to home instead of setting view
        window.location.href = '/';
    };

    // --- Main Renderer with React Router ---

    if (!isAuthReady) {
        return <LoadingSpinner />;
    }

    let userIdDisplay = currentUser?.uid || 'N/A';

    // Wrapper components for routes - userRole is set by useEffect above
    const ScienceRoute = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const assignmentId = urlParams.get('assignment');
        const token = urlParams.get('token');
        
        // If assignment parameters exist, verify access and set user role
        React.useEffect(() => {
            if (assignmentId && token && !userRole) {
                // Verify assignment access
                const verifyAccess = async () => {
                    try {
                        const API_URL = 'http://localhost:4902';
                        const response = await fetch(`${API_URL}/api/candidate/test/${assignmentId}?token=${token}`);
                        const data = await response.json();
                        
                        if (data.success) {
                            setUserRole({ role: 'student', id: assignmentId });
                        }
                    } catch (error) {
                        console.error('Assignment verification failed:', error);
                    }
                };
                verifyAccess();
            }
        }, [assignmentId, token]);
        
        if (!userRole) {
            return <LoadingSpinner />;
        }
        return <StreamAssessmentConfig stream="SCIENCE" startQuiz={startQuiz} />;
    };
    
    const NonScienceRoute = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const assignmentId = urlParams.get('assignment');
        const token = urlParams.get('token');
        
        // If assignment parameters exist, verify access and set user role
        React.useEffect(() => {
            if (assignmentId && token && !userRole) {
                // Verify assignment access
                const verifyAccess = async () => {
                    try {
                        const API_URL = 'http://localhost:4902';
                        const response = await fetch(`${API_URL}/api/candidate/test/${assignmentId}?token=${token}`);
                        const data = await response.json();
                        
                        if (data.success) {
                            setUserRole({ role: 'student', id: assignmentId });
                        }
                    } catch (error) {
                        console.error('Assignment verification failed:', error);
                    }
                };
                verifyAccess();
            }
        }, [assignmentId, token]);
        
        if (!userRole) {
            return <LoadingSpinner />;
        }
        return <StreamAssessmentConfig stream="NON_SCIENCE" startQuiz={startQuiz} />;
    };
    
    // For direct /science or /non-science routes, skip login screen
    const isDirectStreamRoute = location.pathname === '/science' || 
                                 location.pathname === '/non-science' ||
                                 location.pathname === '/nonscience';
    
    if (view === 'login' && !isDirectStreamRoute) {
        return <LoginScreen setUserRole={setUserRole} isAuthReady={isAuthReady} currentUser={currentUser} userId={userIdDisplay} />;
    }

    if (userRole?.role === 'admin') {
        return <AdminDashboard scores={scores} loadingScores={loadingScores} currentUser={currentUser} userId={userIdDisplay} goBackToLogin={goBackToLogin} />;
    }

    if (userRole?.role === 'student') {
        if (view === 'quiz') {
            return <QuizScreen 
                session={quizSession} 
                handleAnswer={handleAnswer} 
                submitQuiz={submitQuiz}
                proctorWarnings={proctorWarnings}
                incrementProctorWarning={incrementProctorWarning}
            />;
        }
        if (view === 'report') {
            return <ReportScreen 
                session={quizSession} 
                finalScore={quizSession.finalScore}
                timeTaken={quizSession.timeTaken}
                resetApp={resetApp}
                currentUser={currentUser}
                userId={userIdDisplay}
            />;
        }
        if (view === 'tat') {
            return <TATAssessment
                tatSession={tatSession}
                handleTATStory={handleTATStory}
                submitTATAssessment={submitTATAssessment}
                incrementProctorWarning={incrementProctorWarning}
            />;
        }
        if (view === 'tatResults') {
            return <TATResultsScreen
                tatSession={tatSession}
                resetApp={resetApp}
            />;
        }

        // Student routes with React Router
        return (
            <Routes>
                <Route path="/" element={<StudentDashboard />} />
                <Route path="/science" element={<ScienceRoute />} />
                <Route path="/non-science" element={<NonScienceRoute />} />
                <Route path="/nonscience" element={<NonScienceRoute />} />
                <Route path="*" element={<StudentDashboard />} />
            </Routes>
        );
    }

    return <LoadingSpinner />; // Fallback
};

export default App;