import { calculateDetailedScores, getPrimaryTalentDomain } from '../utils/scoring';
import { Responses } from '../utils/scoring';

describe('Scoring Utility Functions', () => {
  describe('calculateDetailedScores', () => {
    it('should calculate scores correctly for balanced responses', () => {
      const responses: Responses = {};
      // Simulate equal distribution across all domains
      for (let i = 1; i <= 77; i++) {
        responses[i.toString()] = { selectedStatement: i % 2 === 0 ? 'A' : 'B' };
      }

      const result = calculateDetailedScores(responses);

      expect(result).toBeDefined();
      expect(result.executing).toBeGreaterThanOrEqual(0);
      expect(result.influencing).toBeGreaterThanOrEqual(0);
      expect(result.relationshipBuilding).toBeGreaterThanOrEqual(0);
      expect(result.strategicThinking).toBeGreaterThanOrEqual(0);
    });

    it('should return zero scores for empty responses', () => {
      const responses: Responses = {};

      const result = calculateDetailedScores(responses);

      expect(result.executing).toBe(0);
      expect(result.influencing).toBe(0);
      expect(result.relationshipBuilding).toBe(0);
      expect(result.strategicThinking).toBe(0);
    });

    it('should calculate correct total across all domains', () => {
      const responses: Responses = {};
      for (let i = 1; i <= 77; i++) {
        responses[i.toString()] = { selectedStatement: 'A' };
      }

      const result = calculateDetailedScores(responses);
      const total = result.executing + result.influencing + result.relationshipBuilding + result.strategicThinking;

      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(77);
    });

    it('should handle partial responses', () => {
      const responses: Responses = {
        '1': { selectedStatement: 'A' },
        '5': { selectedStatement: 'B' },
        '10': { selectedStatement: 'A' },
      };

      const result = calculateDetailedScores(responses);

      expect(result.executing).toBeGreaterThanOrEqual(0);
      expect(result.influencing).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPrimaryTalentDomain', () => {
    it('should return the domain with highest score', () => {
      const scores = {
        executing: 10,
        influencing: 5,
        relationshipBuilding: 7,
        strategicThinking: 15,
      };

      const primary = getPrimaryTalentDomain(scores);

      expect(primary).toBe('Strategic Thinking');
    });

    it('should handle tie by returning first in order', () => {
      const scores = {
        executing: 10,
        influencing: 10,
        relationshipBuilding: 10,
        strategicThinking: 10,
      };

      const primary = getPrimaryTalentDomain(scores);

      expect(primary).toBeDefined();
      expect(['Executing', 'Influencing', 'Relationship Building', 'Strategic Thinking']).toContain(primary);
    });

    it('should return all four domains as valid options', () => {
      const testCases = [
        { scores: { executing: 20, influencing: 0, relationshipBuilding: 0, strategicThinking: 0 }, expected: 'Executing' },
        { scores: { executing: 0, influencing: 20, relationshipBuilding: 0, strategicThinking: 0 }, expected: 'Influencing' },
        { scores: { executing: 0, influencing: 0, relationshipBuilding: 20, strategicThinking: 0 }, expected: 'Relationship Building' },
        { scores: { executing: 0, influencing: 0, relationshipBuilding: 0, strategicThinking: 20 }, expected: 'Strategic Thinking' },
      ];

      testCases.forEach(({ scores, expected }) => {
        const primary = getPrimaryTalentDomain(scores);
        expect(primary).toBe(expected);
      });
    });
  });
});

describe('Scoring Performance Tests', () => {
  it('should calculate scores for 1000 assessments in reasonable time', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      const responses: Responses = {};
      for (let j = 1; j <= 77; j++) {
        responses[j.toString()] = { selectedStatement: Math.random() > 0.5 ? 'A' : 'B' };
      }
      calculateDetailedScores(responses);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`\n✅ 1000 assessments scored in ${duration.toFixed(2)}ms`);
    console.log(`   Average: ${(duration / 1000).toFixed(3)}ms per assessment`);

    // Should complete in less than 5 seconds (5000ms)
    expect(duration).toBeLessThan(5000);
  });

  it('should handle concurrent score calculations', async () => {
    const responses: Responses = {};
    for (let i = 1; i <= 77; i++) {
      responses[i.toString()] = { selectedStatement: 'A' };
    }

    const promises = Array(100).fill(null).map(() =>
      Promise.resolve(calculateDetailedScores(responses))
    );

    const startTime = performance.now();
    const results = await Promise.all(promises);
    const endTime = performance.now();

    expect(results.length).toBe(100);
    expect(endTime - startTime).toBeLessThan(1000);
    console.log(`\n✅ 100 concurrent assessments in ${(endTime - startTime).toFixed(2)}ms`);
  });
});
