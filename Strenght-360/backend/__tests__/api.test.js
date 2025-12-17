import request from 'supertest';
import app from '../server.js';

describe('Psychometric Test API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/responses', () => {
    it('should save a test response', async () => {
      const testResponse = {
        student_name: 'Test User',
        student_email: 'test@example.com',
        responses: {
          '1': { selectedStatement: 'A' },
          '2': { selectedStatement: 'B' },
        },
        executing_score: 10,
        influencing_score: 8,
        relationship_building_score: 9,
        strategic_thinking_score: 11,
        primary_talent_domain: 'Strategic Thinking',
      };

      const response = await request(app)
        .post('/api/responses')
        .send(testResponse);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });

    it('should reject incomplete data', async () => {
      const response = await request(app)
        .post('/api/responses')
        .send({ student_name: 'Test' }); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/responses', () => {
    it('should fetch all responses', async () => {
      const response = await request(app).get('/api/responses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.responses)).toBe(true);
    });
  });

  describe('GET /api/stats', () => {
    it('should return statistics', async () => {
      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
    });
  });
});

describe('API Performance Tests', () => {
  it('should handle 100 rapid health checks', async () => {
    const startTime = Date.now();
    const promises = Array(100).fill(null).map(() =>
      request(app).get('/api/health')
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    expect(responses.every(r => r.status === 200)).toBe(true);
    console.log(`\n✅ 100 health checks completed in ${endTime - startTime}ms`);
  });
});
