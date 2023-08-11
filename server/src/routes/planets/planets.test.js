const supertest = require('supertest');
const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');
const { loadPlanetsData } = require('../../models/planets.model');

describe('Planets API', () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe('Test GET /planets', () => {
    test('It should respond with 200 success', async () => {
      await supertest(app).get('/v1/planets').expect('Content-Type', /json/).expect(200);
    });
  });
});
