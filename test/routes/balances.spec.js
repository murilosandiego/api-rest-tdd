const request = require('supertest');
const moment = require('moment');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/balance';
const ROUTE_TRANSACTION = '/v1/transactions';
const ROUTE_TRANSFER = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAxMDAsIm5hbWUiOiJVc2VyICMzIiwibWFpbCI6InVzZXIzQG1haWwuY29tIn0.haEEjbmL_75BKW-tuVDBSXW9djjQoTfH6t-5ot0cwP4';
const TOKEN_GERAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAxMDIsIm5hbWUiOiJVc2VyICM1IiwibWFpbCI6InVzZXI1QG1haWwuY29tIn0.h1wvHEq-Ij_uqPhRh3m9W97fX-WTYRITjQRpur48iYg';

beforeAll(async () => {
  await app.db.seed.run();
});

describe('Balance', () => {
  it('should return only the accounts with some transaction', () => request(app)
    .get(MAIN_ROUTE)
    .set('Authorization', `Bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    }));

  it('should add values of the income', () => request(app)
    .post(ROUTE_TRANSACTION)
    .set('Authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'des in in async',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: 10100,
      status: true,
    })
    .then(() => {
      request(app)
        .get(MAIN_ROUTE)
        .set('authorization', `bearer ${TOKEN}`)
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].id).toBe(10100);
          expect(res.body[0].sum).toBe('100.00');
        });
    }));

  it('should subtract values of the outcome', () => request(app)
    .post(ROUTE_TRANSACTION)
    .set('authorization', `bearer ${TOKEN}`)
    .send({
      description: 'des outcome',
      date: new Date(),
      ammount: 200,
      type: 'O',
      acc_id: 10100,
      status: true,
    })
    .then(() => {
      request(app)
        .get(MAIN_ROUTE)
        .set('authorization', `bearer ${TOKEN}`)
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].id).toBe(10100);
          expect(res.body[0].sum).toBe('-100.00');
        });
    }));

  it('should not consider transactions with false status', () => request(app)
    .post(ROUTE_TRANSACTION)
    .set('Authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'des',
      date: new Date(),
      ammount: 200,
      type: 'O',
      acc_id: 10100,
      status: false,
    })
    .then(() => request(app)
      .get(MAIN_ROUTE)
      .set('Authorization', `Bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(10100);
        expect(res.body[0].sum).toBe('-100.00');
      })));

  it('should not add balance to different accounts', () => request(app)
    .post(ROUTE_TRANSACTION)
    .set('Authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'des',
      date: new Date(),
      ammount: 50,
      type: 'I',
      acc_id: 10101,
      status: true,
    })
    .then(() => request(app)
      .get(MAIN_ROUTE)
      .set('Authorization', `Bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].id).toBe(10100);
        expect(res.body[0].sum).toBe('-100.00');
        expect(res.body[1].id).toBe(10101);
        expect(res.body[1].sum).toBe('50.00');
      })));

  it('should not consider accounts of other users', () => request(app)
    .post(ROUTE_TRANSACTION)
    .set('Authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'des',
      date: new Date(),
      ammount: 200,
      type: 'O',
      acc_id: 10102,
      status: true,
    })
    .then(() => request(app)
      .get(MAIN_ROUTE)
      .set('Authorization', `Bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].id).toBe(10100);
        expect(res.body[0].sum).toBe('-100.00');
        expect(res.body[1].id).toBe(10101);
        expect(res.body[1].sum).toBe('50.00');
      })));

  it('should consider past transaction', () => request(app)
    .post(ROUTE_TRANSACTION)
    .set('Authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'des past transaction',
      date: moment().subtract({ days: 5 }),
      ammount: 250,
      type: 'I',
      acc_id: 10100,
      status: true,
    })
    .then(() => request(app)
      .get(MAIN_ROUTE)
      .set('Authorization', `Bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].id).toBe(10100);
        expect(res.body[0].sum).toBe('150.00');
        expect(res.body[1].id).toBe(10101);
        expect(res.body[1].sum).toBe('50.00');
      })));

  it('should not consider future transaction', () => request(app)
    .post(ROUTE_TRANSACTION)
    .set('Authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'des',
      date: moment().add({ days: 5 }),
      ammount: 150,
      type: 'I',
      acc_id: 10100,
      status: true,
    })
    .then(() => request(app)
      .get(MAIN_ROUTE)
      .set('Authorization', `Bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].id).toBe(10100);
        expect(res.body[0].sum).toBe('150.00');
        expect(res.body[1].id).toBe(10101);
        expect(res.body[1].sum).toBe('50.00');
      })));

  it('should consider transfers ', () => request(app)
    .post(ROUTE_TRANSFER)
    .set('Authorization', `Bearer ${TOKEN}`)
    .send({
      description: 'des',
      date: new Date(),
      ammount: 250,
      acc_ori_id: 10100,
      acc_dest_id: 10101,
    })
    .then(() => request(app)
      .get(MAIN_ROUTE)
      .set('Authorization', `Bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].id).toBe(10100);
        expect(res.body[0].sum).toBe('-100.00');
        expect(res.body[1].id).toBe(10101);
        expect(res.body[1].sum).toBe('300.00');
      })));

  it('should calculate balance user accounts', () => request(app)
    .get(MAIN_ROUTE)
    .set('Authorization', `Bearer ${TOKEN_GERAL}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe(10104);
      expect(res.body[0].sum).toBe('162.00');
      expect(res.body[1].id).toBe(10105);
      expect(res.body[1].sum).toBe('-248.00');
    }));
});
