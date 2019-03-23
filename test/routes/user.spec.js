const request = require('supertest');
const jwt = require('jwt-simple');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/users';
const mail = `${Date.now()}@mail.com`;
let user;

beforeAll(async () => {
  const res = await app.services.user.save({
    name: 'User Account',
    mail: `${Date.now()}@mail.com`,
    passwd: 123456,
  });
  user = { ...res[0] };
  user.token = jwt.encode(user, 'Segredo!');
});

test('should list all users', () => request(app)
  .get(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  }));

test('should insert user with success', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ name: 'Arley Mota', mail, passwd: '123456' })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Arley Mota');
    expect(res.body).not.toHaveProperty('passwd');
  }));

test('should store encrypted password', async () => {
  const res = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Arley Mota', mail: `${Date.now()}@mail.com`, passwd: '123456' });

  expect(res.status).toBe(201);

  const { id } = res.body;
  const userDB = await app.services.user.findOne({ id });
  expect(userDB.passwd).not.toBeUndefined();
  expect(userDB.passwd).not.toBe('123456');
});

test('should not insert user without name', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ mail: 'mail@mail.com', passwd: 123456 })
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Nome é um atributo obrigatório');
  }));

test('should not insert user without e-mail', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'João Pualo', passwd: 123456 });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Email é um atributo requerido');
});

test('should not insert user without password', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'João Pualo', mail: 'asdifj@sdfij.com' });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Senha é um atributo requerido');
});

test('should not insert user if e-mail exist', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ name: 'Arley Mota', mail, passwd: 123456 })
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Já existe um usuário com este e-mail');
  }));
