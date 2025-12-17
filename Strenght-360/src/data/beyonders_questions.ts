export interface BeyondersQuestion {
    id: number;
    text: string;
    options: readonly string[];
    answer: string;
    type: 'DOMAIN' | 'BEHAVIORAL';
}

export const BEYONDERS_QUESTIONS = {
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
} as const;
