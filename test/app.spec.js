const request = require('supertest');

const app = require('../src/app.js');

test('should response on root', () => request(app).get('/')
  .then((res) => {
    expect(res.status).toBe(200);
  }));
