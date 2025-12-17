import { ForcedChoiceResponse } from '../data/questions';

export interface Responses {
  [key: string]: ForcedChoiceResponse;
}

export interface TalentScores {
  executing: number;
  influencing: number;
  relationshipBuilding: number;
  strategicThinking: number;
}

// ========== SUBDOMAIN TYPES AND CONSTANTS ==========

export type CoreDomain =
  | "Executing"
  | "Influencing"
  | "RelationshipBuilding"
  | "StrategicThinking";

export type Choice = "A" | "B";

// 1. Executing Domain
export const EXECUTING_SUBDOMAINS = [
  "Achiever",
  "Arranger", 
  "Belief",
  "Consistency",
  "Deliberative",
  "Discipline",
  "Focus",
  "Responsibility",
  "Restorative"
] as const;

// 2. Influencing Domain
export const INFLUENCING_SUBDOMAINS = [
  "Activator",
  "Command",
  "Communication",
  "Competition",
  "Maximizer",
  "SelfAssurance",
  "Significance",
  "Woo"
] as const;

// 3. Relationship Building Domain
export const RELATIONSHIP_BUILDING_SUBDOMAINS = [
  "Adaptability",
  "Connectedness",
  "Developer",
  "Empathy",
  "Harmony",
  "Includer",
  "Individualization",
  "Positivity",
  "Relator"
] as const;

// 4. Strategic Thinking Domain
export const STRATEGIC_THINKING_SUBDOMAINS = [
  "Analytical",
  "Context",
  "Futuristic",
  "Ideation",
  "Input",
  "Intellection",
  "Learner",
  "Strategic"
] as const;

// All subdomains
export const ALL_SUBDOMAINS = [
  ...EXECUTING_SUBDOMAINS,
  ...INFLUENCING_SUBDOMAINS,
  ...RELATIONSHIP_BUILDING_SUBDOMAINS,
  ...STRATEGIC_THINKING_SUBDOMAINS
] as const;

export type ExecutingSubdomain = (typeof EXECUTING_SUBDOMAINS)[number];
export type InfluencingSubdomain = (typeof INFLUENCING_SUBDOMAINS)[number];
export type RelationshipBuildingSubdomain = (typeof RELATIONSHIP_BUILDING_SUBDOMAINS)[number];
export type StrategicThinkingSubdomain = (typeof STRATEGIC_THINKING_SUBDOMAINS)[number];

export type Subdomain =
  | ExecutingSubdomain
  | InfluencingSubdomain
  | RelationshipBuildingSubdomain
  | StrategicThinkingSubdomain;

// Mapping: Subdomain -> Core Domain
export const domainBySubdomain: Record<Subdomain, CoreDomain> = {
  // Executing
  Achiever: "Executing",
  Arranger: "Executing",
  Belief: "Executing",
  Consistency: "Executing",
  Deliberative: "Executing",
  Discipline: "Executing",
  Focus: "Executing",
  Responsibility: "Executing",
  Restorative: "Executing",

  // Influencing
  Activator: "Influencing",
  Command: "Influencing",
  Communication: "Influencing",
  Competition: "Influencing",
  Maximizer: "Influencing",
  SelfAssurance: "Influencing",
  Significance: "Influencing",
  Woo: "Influencing",

  // Relationship Building
  Adaptability: "RelationshipBuilding",
  Connectedness: "RelationshipBuilding",
  Developer: "RelationshipBuilding",
  Empathy: "RelationshipBuilding",
  Harmony: "RelationshipBuilding",
  Includer: "RelationshipBuilding",
  Individualization: "RelationshipBuilding",
  Positivity: "RelationshipBuilding",
  Relator: "RelationshipBuilding",

  // Strategic Thinking
  Analytical: "StrategicThinking",
  Context: "StrategicThinking",
  Futuristic: "StrategicThinking",
  Ideation: "StrategicThinking",
  Input: "StrategicThinking",
  Intellection: "StrategicThinking",
  Learner: "StrategicThinking",
  Strategic: "StrategicThinking"
};

// Mapping: Statement (e.g. "1A") -> Subdomain
export const themeMap: Record<string, Subdomain> = {
  "1A": "Achiever", "1B": "Command",
  "2A": "Responsibility", "2B": "Woo",
  "3A": "Achiever", "3B": "Woo",
  "4A": "Discipline", "4B": "Communication",
  "5A": "Responsibility", "5B": "Woo",
  "6A": "Discipline", "6B": "Competition",
  "7A": "Consistency", "7B": "Significance",
  "8A": "Focus", "8B": "SelfAssurance",
  "9A": "Restorative", "9B": "Activator",
  "10A": "Discipline", "10B": "Woo",
  "11A": "Responsibility", "11B": "Command",
  "12A": "Consistency", "12B": "Significance",
  "13A": "Arranger", "13B": "Activator",
  "14A": "Belief", "14B": "SelfAssurance",
  "15A": "Deliberative", "15B": "Communication",
  "16A": "Includer", "16B": "Futuristic",
  "17A": "Individualization", "17B": "Analytical",
  "18A": "Relator", "18B": "Learner",
  "19A": "Empathy", "19B": "Strategic",
  "20A": "Connectedness", "20B": "Ideation",
  "21A": "Developer", "21B": "Intellection",
  "22A": "Harmony", "22B": "Input",
  "23A": "Relator", "23B": "Context",
  "24A": "Adaptability", "24B": "Ideation",
  "25A": "Includer", "25B": "Strategic",
  "26A": "Positivity", "26B": "Analytical",
  "27A": "Developer", "27B": "Strategic",
  "28A": "Harmony", "28B": "Analytical",
  "29A": "Connectedness", "29B": "Intellection",
  "30A": "Developer", "30B": "Ideation",
  "31A": "Achiever", "31B": "Learner",
  "32A": "Significance", "32B": "Relator",
  "33A": "Significance", "33B": "Analytical",
  "34A": "Activator", "34B": "Achiever",
  "35A": "Maximizer", "35B": "Restorative",
  "36A": "Futuristic", "36B": "Relator",
  "37A": "Achiever", "37B": "Ideation",
  "38A": "SelfAssurance", "38B": "Adaptability",
  "39A": "Consistency", "39B": "Individualization",
  "40A": "Focus", "40B": "Strategic",
  "41A": "Competition", "41B": "Learner",
  "42A": "Discipline", "42B": "Adaptability",
  "43A": "Positivity", "43B": "Analytical",
  "44A": "Belief", "44B": "Learner",
  "45A": "Achiever", "45B": "Intellection",
  "46A": "Communication", "46B": "Empathy",
  "47A": "Individualization", "47B": "Strategic",
  "48A": "SelfAssurance", "48B": "Developer",
  "49A": "Achiever", "49B": "Futuristic",
  "50A": "Command", "50B": "Harmony",
  "51A": "Focus", "51B": "Harmony",
  "52A": "SelfAssurance", "52B": "Deliberative",
  "53A": "Relator", "53B": "Input",
  "54A": "Achiever", "54B": "Achiever",
  "55A": "Significance", "55B": "Harmony",
  "56A": "Discipline", "56B": "Adaptability",
  "57A": "Responsibility", "57B": "Positivity",
  "58A": "Competition", "58B": "Harmony",
  "59A": "Achiever", "59B": "Ideation",
  "60A": "Command", "60B": "Harmony",
  "61A": "Discipline", "61B": "Adaptability",
  "62A": "Activator", "62B": "Intellection",
  "63A": "Significance", "63B": "Intellection",
  "64A": "Analytical", "64B": "Positivity",
  "65A": "Learner", "65B": "Ideation",
  "66A": "Achiever", "66B": "Relator",
  "67A": "Restorative", "67B": "Maximizer",
  "68A": "Focus", "68B": "Analytical",
  "69A": "Command", "69B": "Harmony",
  "70A": "Learner", "70B": "Developer",
  "71A": "Discipline", "71B": "Ideation",
  "72A": "Consistency", "72B": "Activator",
  "73A": "Belief", "73B": "Relator",
  "74A": "Strategic", "74B": "Arranger",
  "75A": "Communication", "75B": "Intellection",
  "76A": "Achiever", "76B": "Activator",
  "77A": "Achiever", "77B": "Relator"
};

// Subdomain scores interface
export interface SubdomainScores {
  // Executing subdomains
  Achiever: number;
  Arranger: number;
  Belief: number;
  Consistency: number;
  Deliberative: number;
  Discipline: number;
  Focus: number;
  Responsibility: number;
  Restorative: number;
  
  // Influencing subdomains
  Activator: number;
  Command: number;
  Communication: number;
  Competition: number;
  Maximizer: number;
  SelfAssurance: number;
  Significance: number;
  Woo: number;
  
  // Relationship Building subdomains
  Adaptability: number;
  Connectedness: number;
  Developer: number;
  Empathy: number;
  Harmony: number;
  Includer: number;
  Individualization: number;
  Positivity: number;
  Relator: number;
  
  // Strategic Thinking subdomains
  Analytical: number;
  Context: number;
  Futuristic: number;
  Ideation: number;
  Input: number;
  Intellection: number;
  Learner: number;
  Strategic: number;
}

// Enhanced scores interface including subdomains
export interface DetailedTalentScores extends TalentScores {
  subdomains: SubdomainScores;
}

// Enhanced scoring function that calculates both core domain and subdomain scores
export const calculateDetailedScores = (responses: Responses): DetailedTalentScores => {
  // Initialize subdomain scores
  const subdomainScores: SubdomainScores = {} as SubdomainScores;
  
  // Initialize all subdomains to 0
  ALL_SUBDOMAINS.forEach(subdomain => {
    subdomainScores[subdomain] = 0;
  });

  // Calculate subdomain scores based on responses
  Object.entries(responses).forEach(([questionNum, response]) => {
    if (response && response.selectedStatement) {
      const statementKey = `${questionNum}${response.selectedStatement}`;
      const subdomain = themeMap[statementKey];
      
      if (subdomain) {
        subdomainScores[subdomain] += 1;
      }
    }
  });

  // Calculate core domain scores by summing subdomain scores
  const executing = EXECUTING_SUBDOMAINS.reduce((total, subdomain) => 
    total + subdomainScores[subdomain], 0);
  
  const influencing = INFLUENCING_SUBDOMAINS.reduce((total, subdomain) => 
    total + subdomainScores[subdomain], 0);
    
  const relationshipBuilding = RELATIONSHIP_BUILDING_SUBDOMAINS.reduce((total, subdomain) => 
    total + subdomainScores[subdomain], 0);
    
  const strategicThinking = STRATEGIC_THINKING_SUBDOMAINS.reduce((total, subdomain) => 
    total + subdomainScores[subdomain], 0);

  return {
    executing,
    influencing,
    relationshipBuilding,
    strategicThinking,
    subdomains: subdomainScores
  };
};

// Original scoring function (maintained for backward compatibility)
export const calculateScores = (responses: Responses): TalentScores => {
  const detailed = calculateDetailedScores(responses);
  return {
    executing: detailed.executing,
    influencing: detailed.influencing,
    relationshipBuilding: detailed.relationshipBuilding,
    strategicThinking: detailed.strategicThinking
  };
};

// Helper function to get subdomain scores for a specific core domain
export const getSubdomainScoresForDomain = (
  subdomainScores: SubdomainScores, 
  domain: CoreDomain
): Record<string, number> => {
  const result: Record<string, number> = {};
  
  switch (domain) {
    case "Executing":
      EXECUTING_SUBDOMAINS.forEach(subdomain => {
        result[subdomain] = subdomainScores[subdomain];
      });
      break;
    case "Influencing":
      INFLUENCING_SUBDOMAINS.forEach(subdomain => {
        result[subdomain] = subdomainScores[subdomain];
      });
      break;
    case "RelationshipBuilding":
      RELATIONSHIP_BUILDING_SUBDOMAINS.forEach(subdomain => {
        result[subdomain] = subdomainScores[subdomain];
      });
      break;
    case "StrategicThinking":
      STRATEGIC_THINKING_SUBDOMAINS.forEach(subdomain => {
        result[subdomain] = subdomainScores[subdomain];
      });
      break;
  }
  
  return result;
};

// Helper function to get top subdomains for a core domain
export const getTopSubdomainsForDomain = (
  subdomainScores: SubdomainScores,
  domain: CoreDomain,
  limit: number = 3
): Array<{ subdomain: string; score: number; percentage: number }> => {
  const domainSubdomains = getSubdomainScoresForDomain(subdomainScores, domain);
  const totalDomainScore = Object.values(domainSubdomains).reduce((sum, score) => sum + score, 0);
  
  return Object.entries(domainSubdomains)
    .map(([subdomain, score]) => ({
      subdomain,
      score,
      percentage: totalDomainScore > 0 ? Math.round((score / totalDomainScore) * 100) : 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// Helper functions for subdomain analysis
export function getSubdomainForAnswer(id: number, choice: Choice): Subdomain | undefined {
  const key = `${id}${choice}`;
  return themeMap[key];
}

export function getDomainForSubdomain(subdomain: Subdomain): CoreDomain {
  return domainBySubdomain[subdomain];
}

export function getDomainForAnswer(id: number, choice: Choice): CoreDomain | undefined {
  const sub = getSubdomainForAnswer(id, choice);
  if (!sub) return undefined;
  return domainBySubdomain[sub];
}

export const getPrimaryTalentDomain = (scores: TalentScores): string => {
  const entries = Object.entries(scores);
  const highest = entries.reduce((max, entry) =>
    entry[1] > max[1] ? entry : max
  );

  const domainNames: { [key: string]: string } = {
    executing: 'Executing',
    influencing: 'Influencing',
    relationshipBuilding: 'Relationship Building',
    strategicThinking: 'Strategic Thinking'
  };

  return domainNames[highest[0]];
};
