const request = require('supertest');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAwMDAsIm5hbWUiOiJVc2VyICMxIiwibWFpbCI6InVzZXIxQG1haWwuY29tIn0.QMgvo_lPe0Rdxpx7cay_hIkDAbjCK_--VD2fP0NTTqk';

beforeAll(async () => {
  // await app.db.migrate.rollback();
  // await app.db.migrate.latest();
  await app.db.seed.run();
});

it('should list only the transfers of the user', () => request(app)
  .get(MAIN_ROUTE)
  .set('authorization', `bearer ${TOKEN}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('Tranfer #1');
  }));

it('should insert a tranfer with success', () => request(app)
  .post(MAIN_ROUTE)
  .set('authorization', `bearer ${TOKEN}`)
  .send({
    description: 'Regular transfer',
    user_id: 10000,
    acc_ori_id: 10000,
    acc_dest_id: 10001,
    ammount: 100,
    date: new Date(),
  })
  .then(async (res) => {
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Regular transfer');

    const transactions = await app.db('transactions').where({ transfer_id: res.body.id });
    expect(transactions).toHaveLength(2);
    expect(transactions[0].description).toBe('Transfer to acc #10001');
    expect(transactions[1].description).toBe('Transfer from acc #10000');
    expect(transactions[0].ammount).toBe('-100.00');
    expect(transactions[1].ammount).toBe('100.00');
    expect(transactions[0].acc_id).toBe(10000);
    expect(transactions[1].acc_id).toBe(10001);
  }));

describe('Saving a valid transfer', () => {
  let transferId;
  let income;
  let outcome;

  it('should return the 201 status and the data the transfer', () => request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({
      description: 'Regular transfer',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      ammount: 100,
      date: new Date(),
    })
    .then(async (res) => {
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Regular transfer');
      transferId = res.body.id;
    }));

  it('should create equivalent transactions', async () => {
    const transactions = await app
      .db('transactions')
      .where({ transfer_id: transferId })
      .orderBy('ammount');
    expect(transactions).toHaveLength(2);

    [outcome, income] = transactions;
  });

  it('should return negative ammount for outcome transaction', () => {
    expect(outcome.description).toBe('Transfer to acc #10001');
    expect(outcome.ammount).toBe('-100.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('O');
  });

  it('should return positve ammount for income transaction', () => {
    expect(income.description).toBe('Transfer from acc #10000');
    expect(income.ammount).toBe('100.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');
  });

  it('should refer to the transfer that originated them', () => {
    expect(income.transfer_id).toBe(transferId);
    expect(outcome.transfer_id).toBe(transferId);
  });
});

describe('Saving a invalid transfer', () => {
  const testTemplate = (newData, errorMessage) => request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({
      description: 'Regular transfer',
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      ammount: 100,
      date: new Date(),
      ...newData,
    })
    .then(async (res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  it('should not insert without description', () => testTemplate({ description: null }, 'Descrição é um atributo obrigatório'));
  it('should not insert without ammount', () => testTemplate({ ammount: null }, 'Descrição é um atributo obrigatório'));
  it('should not insert without date', () => testTemplate({ date: null }, 'Data é um atributo obrigatório'));
  it('should not insert without source account', () => testTemplate({ acc_ori_id: null }, 'Conta de origem é um atributo obrigatório'));
  it('should not insert without destination account', () => testTemplate({ acc_dest_id: null }, 'Conta de destino é um atributo obrigatório'));
  it('should not insert if destination and source are same', () => testTemplate(
    { acc_ori_id: 10000, acc_dest_id: 10000 },
    'Não é possível realizar transferência entre a mesma conta',
  ));
  it('should not insert if accounts belong to the other user', () => testTemplate({ acc_ori_id: 10002 }, 'Conta não encontrada'));
});

it('should return a transfer by id', () => request(app)
  .get(`${MAIN_ROUTE}/${10000}`)
  .set('authorization', `bearer ${TOKEN}`)
  .then(async (res) => {
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Tranfer #1');
  }));

describe('Updating a valid transfer', () => {
  let transferId;
  let income;
  let outcome;

  it('should return the 200 status and the data the transfer', () => request(app)
    .put(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .send({
      description: 'Updated transfer',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      ammount: 500,
      date: new Date(),
    })
    .then(async (res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated transfer');
      expect(res.body.ammount).toBe('500.00');
      transferId = res.body.id;
    }));

  it('should create equivalent transactions', async () => {
    const transactions = await app
      .db('transactions')
      .where({ transfer_id: transferId })
      .orderBy('ammount');
    expect(transactions).toHaveLength(2);

    [outcome, income] = transactions;
  });

  it('should return negative ammount for outcome transaction', () => {
    expect(outcome.description).toBe('Transfer to acc #10001');
    expect(outcome.ammount).toBe('-500.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('O');
  });

  it('should return positve ammount for income transaction', () => {
    expect(income.description).toBe('Transfer from acc #10000');
    expect(income.ammount).toBe('500.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');
  });

  it('should refer to the transfer that originated them', () => {
    expect(income.transfer_id).toBe(transferId);
    expect(outcome.transfer_id).toBe(transferId);
  });
});

describe('Updating a invalid transfer', () => {
  const testTemplate = (newData, errorMessage) => request(app)
    .put(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .send({
      description: 'Regular transfer',
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      ammount: 100,
      date: new Date(),
      ...newData,
    })
    .then(async (res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  it('should not insert without description', () => testTemplate({ description: null }, 'Descrição é um atributo obrigatório'));
  it('should not insert without ammount', () => testTemplate({ ammount: null }, 'Descrição é um atributo obrigatório'));
  it('should not insert without date', () => testTemplate({ date: null }, 'Data é um atributo obrigatório'));
  it('should not insert without source account', () => testTemplate({ acc_ori_id: null }, 'Conta de origem é um atributo obrigatório'));
  it('should not insert without destination account', () => testTemplate({ acc_dest_id: null }, 'Conta de destino é um atributo obrigatório'));
  it('should not insert if destination and source are same', () => testTemplate(
    { acc_ori_id: 10000, acc_dest_id: 10000 },
    'Não é possível realizar transferência entre a mesma conta',
  ));
  it('should not insert if accounts belong to the other user', () => testTemplate({ acc_ori_id: 10002 }, 'Conta não encontrada'));
});
