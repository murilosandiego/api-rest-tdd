const request = require('supertest');
const app = require('../../src/app');

test('should create user by signup', () => {
  const mail = `${Date.now()}@mail.com`;
  return request(app)
    .post('/auth/signup')
    .send({ name: 'Walter', mail, passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Walter');
      expect(res.body.mail).toBe(mail);
      expect(res.body).not.toHaveProperty('passwd');
    });
});
test('should receive token after login', () => {
  const mail = `${Date.now()}@mail.com`;
  return app.services.user
    .save({
      name: 'Walter',
      mail,
      passwd: '123456',
    })
    .then(() => request(app)
      .post('/auth/signin')
      .send({ mail, passwd: '123456' }))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
});

test('should not auth user not exists', () => request(app)
  .post('/auth/signin')
  .send({ mail: 'NaoExiste@mail.com', passwd: '123456' })
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Usuário ou senha inválido!');
  }));

test('should not access protected route without token', () => request(app)
  .get('/v1/users')
  .then((res) => {
    expect(res.status).toBe(401);
  }));
