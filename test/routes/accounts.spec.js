const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/accounts';
let user;
let user2;

beforeAll(async () => {
  const res = await app.services.user.save({
    name: 'User Account',
    mail: `${Date.now()}@mail.com`,
    passwd: 123456,
  });

  const res2 = await app.services.user.save({
    name: 'User Account #2',
    mail: `${Date.now()}@email.com`,
    passwd: 123456,
  });

  user = { ...res[0] };
  user2 = { ...res2[0] };

  user.token = jwt.encode(user, 'Segredo!');
  user2.token = jwt.encode(user2, 'Segredo!');
});

test('should insert an account with success', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ name: 'Acc #1' })
  .then((result) => {
    expect(result.status).toBe(201);
    expect(result.body.name).toBe('Acc #1');
  }));

test('should not insert an account without name', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({})
  .then((result) => {
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Nome é um atributo obrigatório');
  }));

test('should not insert an account with duplicate name for the same user ', () => app
  .db('accounts')
  .insert({ name: 'Acc duplicada', user_id: user.id })
  .then(() => request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc duplicada' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Já existe uma conta com esse nome');
    })));

test('should list only accounts the user', async () => {
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();

  return app
    .db('accounts')
    .insert([{ name: 'Acc User #1', user_id: user.id }, { name: 'Acc User #2', user_id: user2.id }])
    .then(() => request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Acc User #1');
    });
});

test('should return one account by Id', () => app
  .db('accounts')
  .insert({ name: 'Acc By Id', user_id: user.id }, ['id'])
  .then(acc => request(app)
    .get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acc By Id');
    expect(res.body.user_id).toBe(user.id);
  }));

test('should not return accounts other users', () => app
  .db('accounts')
  .insert({ name: 'Acc User23', user_id: user2.id }, ['id'])
  .then(acc => request(app)
    .get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário');
  }));

test('should change one account', () => app
  .db('accounts')
  .insert({ name: 'Acc to update', user_id: user.id }, ['id'])
  .then(acc => request(app)
    .put(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc Update' }))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acc Update');
  }));

test('should remove one account', () => app
  .db('accounts')
  .insert({ name: 'Acc to remove', user_id: user.id }, ['id'])
  .then(acc => request(app)
    .delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(204);
  }));

test('should not change accounts other users', () => app
  .db('accounts')
  .insert({ name: 'Acc User22', user_id: user2.id }, ['id'])
  .then(acc => request(app)
    .put(`${MAIN_ROUTE}/${acc[0].id}`)
    .send({ name: 'Acc Update' })
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário');
  }));

test('should not remove accounts other users', () => app
  .db('accounts')
  .insert({ name: 'Acc User2', user_id: user2.id }, ['id'])
  .then(acc => request(app)
    .delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário');
  }));
