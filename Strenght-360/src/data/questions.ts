export interface Question {
  id: number;
  statementA: string;
  statementB: string;
}

export interface ForcedChoiceResponse {
  selectedStatement: 'A' | 'B';
}

// Keep LikertResponse for backward compatibility if needed
export interface LikertResponse {
  statementA: number; // 1-5 scale
  statementB: number; // 1-5 scale
}

export const likertOptions = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' }
];

export const questions: Question[] = [
   {
    "id": 1,
    "statementA": "I feel a deep satisfaction when I cross a task off my to-do list.",
    "statementB": "I naturally take the lead in group situations."
  },
  {
    "id": 2,
    "statementA": "I am known for being reliable and following through on my promises.",
    "statementB": "I enjoy persuading others to see my point of view."
  },
  {
    "id": 3,
    "statementA": "I need to be productive to feel good about my day.",
    "statementB": "I am comfortable selling an idea or a product."
  },
  {
    "id": 4,
    "statementA": "I create routines to make my work more efficient.",
    "statementB": "I like to be the one who speaks up in meetings."
  },
  {
    "id": 5,
    "statementA": "I take pride in my strong work ethic.",
    "statementB": "I find it easy to start a conversation with strangers."
  },
  {
    "id": 6,
    "statementA": "I get frustrated by disorganization and lack of structure.",
    "statementB": "I am energized by friendly competition."
  },
  {
    "id": 7,
    "statementA": "I believe success comes from consistent, hard work.",
    "statementB": "I believe success comes from making a visible impact."
  },
  {
    "id": 8,
    "statementA": "I prefer to have a clear plan before starting a project.",
    "statementB": "I am confident in my ability to take risks."
  },
  {
    "id": 9,
    "statementA": "I am the person who will fix a problem that everyone else is ignoring.",
    "statementB": "I am the person who will rally the team when energy is low."
  },
  {
    "id": 10,
    "statementA": "I am meticulous about the details of my work.",
    "statementB": "I love the challenge of winning someone over."
  },
  {
    "id": 11,
    "statementA": "I feel a strong sense of ownership over my commitments.",
    "statementB": "I naturally command attention when I enter a room."
  },
  {
    "id": 12,
    "statementA": "I value stability and predictable outcomes.",
    "statementB": "I am motivated by the desire to be recognized for my work."
  },
  {
    "id": 13,
    "statementA": "I enjoy the process of organizing people and resources.",
    "statementB": "I get bored easily and like to initiate new actions."
  },
  {
    "id": 14,
    "statementA": "My core values are my compass for making decisions.",
    "statementB": "I am optimistic about my ability to succeed."
  },
  {
    "id": 15,
    "statementA": "I am careful and cautious when making important decisions.",
    "statementB": "I am often described as charismatic or persuasive."
  },
  {
    "id": 16,
    "statementA": "I am good at making people feel comfortable and included.",
    "statementB": "I am constantly thinking about what could be in the future."
  },
  {
    "id": 17,
    "statementA": "I am fascinated by what makes each person unique.",
    "statementB": "I enjoy analyzing data and patterns to find the root cause."
  },
  {
    "id": 18,
    "statementA": "I am the glue that holds my friend group or team together.",
    "statementB": "I love learning new things, simply for the sake of learning."
  },
  {
    "id": 19,
    "statementA": "I am highly empathetic and can easily sense how others are feeling.",
    "statementB": "I am a strategic thinker who always has a contingency plan."
  },
  {
    "id": 20,
    "statementA": "I believe that almost everything happens for a reason.",
    "statementB": "I am fascinated by innovative ideas and concepts."
  },
  {
    "id": 21,
    "statementA": "I derive joy from helping others grow and succeed.",
    "statementB": "I enjoy thought-provoking, intellectual debates."
  },
  {
    "id": 22,
    "statementA": "I avoid conflict and seek harmony and consensus.",
    "statementB": "I love collecting information, ideas, or interesting facts."
  },
  {
    "id": 23,
    "statementA": "I prefer deep, one-on-one relationships to large social gatherings.",
    "statementB": "I understand the present by studying the past."
  },
  {
    "id": 24,
    "statementA": "I am adaptable and can easily go with the flow.",
    "statementB": "I am always asking \"why?\" and \"what if?\""
  },
  {
    "id": 25,
    "statementA": "I am intentional about including people who might be left out.",
    "statementB": "I can quickly identify the best path forward among many options."
  },
  {
    "id": 26,
    "statementA": "I am a positive person who can lift the mood of a room.",
    "statementB": "I am a logical and objective thinker."
  },
  {
    "id": 27,
    "statementA": "I build trust through genuine, caring relationships.",
    "statementB": "I trust my insights and intuition when solving problems."
  },
  {
    "id": 28,
    "statementA": "I am skilled at helping diverse people work together productively.",
    "statementB": "I am skilled at simplifying complex problems."
  },
  {
    "id": 29,
    "statementA": "I feel connected to humanity and the world around me.",
    "statementB": "I spend a lot of time thinking inside my own head."
  },
  {
    "id": 30,
    "statementA": "I am patient and enjoy seeing small signs of progress in others.",
    "statementB": "I get excited by brainstorming and generating new possibilities."
  },
  {
    "id": 31,
    "statementA": "I need to be busy and accomplishing tasks.",
    "statementB": "I need to be learning and thinking."
  },
  {
    "id": 32,
    "statementA": "I want to be recognized for my achievements.",
    "statementB": "I want to be known as a trustworthy and loyal friend."
  },
  {
    "id": 33,
    "statementA": "I am driven by a desire to make a difference.",
    "statementB": "I am driven by a desire to understand how things work."
  },
  {
    "id": 34,
    "statementA": "I am great at starting projects.",
    "statementB": "I am great at finishing projects."
  },
  {
    "id": 35,
    "statementA": "I focus on people's strengths and how to maximize them.",
    "statementB": "I focus on problems and how to solve them."
  },
  {
    "id": 36,
    "statementA": "I am inspired by a clear and vivid vision of the future.",
    "statementB": "I am inspired by collaborating with a close-knit team."
  },
  {
    "id": 37,
    "statementA": "I set ambitious goals for myself.",
    "statementB": "I enjoy exploring interesting ideas, even with no clear goal."
  },
  {
    "id": 38,
    "statementA": "I am independent and like to control my own destiny.",
    "statementB": "I am adaptable and can thrive in changing circumstances."
  },
  {
    "id": 39,
    "statementA": "I believe in treating everyone with consistent fairness.",
    "statementB": "I believe in tailoring my approach to each individual."
  },
  {
    "id": 40,
    "statementA": "I am a pragmatic \"how-to\" person.",
    "statementB": "I am a \"big picture\" thinker."
  },
  {
    "id": 41,
    "statementA": "I am motivated by winning and being the best.",
    "statementB": "I am motivated by personal growth and improvement."
  },
  {
    "id": 42,
    "statementA": "I am disciplined and create order.",
    "statementB": "I am flexible and can juggle multiple things at once."
  },
  {
    "id": 43,
    "statementA": "I bring energy and enthusiasm to a team.",
    "statementB": "I bring logic and a calm analysis to a team."
  },
  {
    "id": 44,
    "statementA": "I am deeply committed to my core values.",
    "statementB": "I am deeply curious about a wide range of topics."
  },
  {
    "id": 45,
    "statementA": "I am a doer.",
    "statementB": "I am a thinker."
  },
  {
    "id": 46,
    "statementA": "I am a talker.",
    "statementB": "I am a listener."
  },
  {
    "id": 47,
    "statementA": "I see the unique potential in every person.",
    "statementB": "I see the strategic patterns in every situation."
  },
  {
    "id": 48,
    "statementA": "I am determined to be in charge of my own life.",
    "statementB": "I am dedicated to helping others succeed in theirs."
  },
  {
    "id": 49,
    "statementA": "I get things done.",
    "statementB": "I imagine what could be."
  },
  {
    "id": 50,
    "statementA": "I make sure my voice is heard.",
    "statementB": "I make sure everyone else's voice is heard."
  },
  {
    "id": 51,
    "statementA": "I am focused on efficiency and progress.",
    "statementB": "I am focused on harmony and morale."
  },
  {
    "id": 52,
    "statementA": "I am confident in my own decisions.",
    "statementB": "I am thoughtful and consider all options before deciding."
  },
  {
    "id": 53,
    "statementA": "I am the one who remembers everyone's personal story.",
    "statementB": "I am the one who remembers the key data points."
  },
  {
    "id": 54,
    "statementA": "I am motivated by deadlines.",
    "statementB": "I am motivated by new challenges."
  },
  {
    "id": 55,
    "statementA": "I like to be the center of attention.",
    "statementB": "I prefer to work behind the scenes."
  },
  {
    "id": 56,
    "statementA": "I am a planner.",
    "statementB": "I am an improviser."
  },
  {
    "id": 57,
    "statementA": "I am serious and responsible.",
    "statementB": "I am upbeat and positive."
  },
  {
    "id": 58,
    "statementA": "I am competitive.",
    "statementB": "I am cooperative."
  },
  {
    "id": 59,
    "statementA": "I am a hard worker.",
    "statementB": "I am a creative thinker."
  },
  {
    "id": 60,
    "statementA": "I am direct and assertive.",
    "statementB": "I am diplomatic and tactful."
  },
  {
    "id": 61,
    "statementA": "I am organized and structured.",
    "statementB": "I am spontaneous and adaptable."
  },
  {
    "id": 62,
    "statementA": "I am a person of action.",
    "statementB": "I am a person of reflection."
  },
  {
    "id": 63,
    "statementA": "I am motivated by external recognition.",
    "statementB": "I am motivated by internal satisfaction."
  },
  {
    "id": 64,
    "statementA": "I am a realist.",
    "statementB": "I am an optimist."
  },
  {
    "id": 65,
    "statementA": "I am a specialist who deepens expertise.",
    "statementB": "I am a generalist who connects ideas."
  },
  {
    "id": 66,
    "statementA": "I am driven to complete tasks.",
    "statementB": "I am driven to connect with people."
  },
  {
    "id": 67,
    "statementA": "I am a problem-solver.",
    "statementB": "I am a motivator."
  },
  {
    "id": 68,
    "statementA": "I am focused on the outcome.",
    "statementB": "I am focused on the process."
  },
  {
    "id": 69,
    "statementA": "I am a decision-maker.",
    "statementB": "I am a consensus-builder."
  },
  {
    "id": 70,
    "statementA": "I am a teacher who shares knowledge.",
    "statementB": "I am a mentor who nurtures growth."
  },
  {
    "id": 71,
    "statementA": "I am precise and accurate.",
    "statementB": "I am imaginative and innovative."
  },
  {
    "id": 72,
    "statementA": "I am a stabilizer who creates routine.",
    "statementB": "I am a catalyst who creates change."
  },
  {
    "id": 73,
    "statementA": "I am loyal to my principles.",
    "statementB": "I am loyal to my team."
  },
  {
    "id": 74,
    "statementA": "I am the one who defines the goal.",
    "statementB": "I am the one who organizes the plan to reach it."
  },
  {
    "id": 75,
    "statementA": "I am a public speaker.",
    "statementB": "I am a private thinker."
  },
  {
    "id": 76,
    "statementA": "I am a finisher.",
    "statementB": "I am a starter."
  },
  {
    "id": 77,
    "statementA": "My greatest joy is achievement.",
    "statementB": "My greatest joy is connection."
  }
];