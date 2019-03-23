const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';
let user;
let user2;
let accUser;
let accUser2;

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();

  const users = await app.db('users').insert(
    [
      {
        name: 'User #1',
        mail: 'user1@mail.com',
        passwd: '$2a$10$g6zgq7PTbl1IAZqLPB0EEeoVer.ogFMGnPgVJF9/PAjHWHM17xHZO',
      },
      {
        name: 'User #2',
        mail: 'user2@mail.com',
        passwd: '$2a$10$g6zgq7PTbl1IAZqLPB0EEeoVer.ogFMGnPgVJF9/PAjHWHM17xHZO',
      },
    ],
    '*',
  );
  [user, user2] = users;
  delete user.passwd;
  user.token = jwt.encode(user, 'Segredo!');

  const accs = await app
    .db('accounts')
    .insert([{ name: 'Acc #1', user_id: user.id }, { name: 'Acc #2', user_id: user2.id }], '*');

  [accUser, accUser2] = accs;
});

test('should list only user transactions', () => app
  .db('transactions')
  .insert([
    {
      description: 'T1',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
    },
    {
      description: 'T2',
      date: new Date(),
      ammount: 200,
      type: 'O',
      acc_id: accUser2.id,
    },
  ])
  .then(() => request(app)
    .get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('T1');
    })));

test('should insert a transaction with success', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({
    description: 'New T1',
    date: new Date(),
    ammount: 100,
    type: 'I',
    acc_id: accUser.id,
  })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.description).toBe('New T1');
    expect(res.body.ammount).toBe('100.00');
  }));

test('should return posite when it is entry transaction', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({
    description: 'New T1',
    date: new Date(),
    ammount: -100,
    type: 'I',
    acc_id: accUser.id,
  })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.ammount).toBe('100.00');
  }));

test('should return negative when it is outgoing transaction', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({
    description: 'New T1',
    date: new Date(),
    ammount: 100,
    type: 'O',
    acc_id: accUser.id,
  })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.ammount).toBe('-100.00');
  }));

describe('Insert invalid transaction', () => {
  const testTemplate = (newData, errorMessage) => request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T1',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
      ...newData,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  test('Should not insert without description', () => testTemplate({ description: null }, 'Descrição é um atributo obrigatório'));
  test('Should not insert without ammount', () => testTemplate({ ammount: null }, 'Valor é um atributo obrigatório'));
  test('Should not insert without date', () => testTemplate({ date: null }, 'Data é um atributo obrigatório'));
  test('Should not insert without account', () => testTemplate({ acc_id: null }, 'Conta é um atributo obrigatório'));
  test('Should not insert without type', () => testTemplate({ type: null }, 'Tipo é um atributo obrigatório'));
  test('Should not insert without invalid type ', () => testTemplate({ type: 'A' }, 'Tipo inválido'));
});

test('should return a transaction by ID', () => app
  .db('transactions')
  .insert(
    {
      description: 'T1 ID',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
    },
    ['id'],
  )
  .then(result => request(app)
    .get(`${MAIN_ROUTE}/${result[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('T1 ID');
      expect(res.body.id).toBe(result[0].id);
    })));

test('should update a transaction', () => app
  .db('transactions')
  .insert(
    {
      description: 'T1 CHANGE',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
    },
    ['id'],
  )
  .then(result => request(app)
    .put(`${MAIN_ROUTE}/${result[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'T1 CHANGE EDIT',
    })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('T1 CHANGE EDIT');
      expect(res.body.id).toBe(result[0].id);
    })));

test('should remove a transaction', () => app
  .db('transactions')
  .insert(
    {
      description: 'T1 DELETE',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
    },
    ['id'],
  )
  .then(result => request(app)
    .delete(`${MAIN_ROUTE}/${result[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(204);
    })));

test('should not remove a transactions that belong to other users', () => app
  .db('transactions')
  .insert(
    {
      description: 'T1 DELETE OTHER USER',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser2.id,
    },
    ['id'],
  )
  .then(result => request(app)
    .delete(`${MAIN_ROUTE}/${result[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    })));

test('should not remove account with transaction ', () => app
  .db('transactions')
  .insert(
    {
      description: 'New Transaction',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
    },
    ['id'],
  )
  .then(() => request(app)
    .delete(`/v1/accounts/${accUser.id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Essa conta possui transações associadas');
    })));
