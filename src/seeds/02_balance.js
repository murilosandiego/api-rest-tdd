const moment = require('moment');

exports.seed = knex => knex('users')
  .insert([
    {
      id: 10100,
      name: 'User #3',
      mail: 'user3@mail.com',
      passwd: '$2a$10$g6zgq7PTbl1IAZqLPB0EEeoVer.ogFMGnPgVJF9/PAjHWHM17xHZO',
    },
    {
      id: 10101,
      name: 'User #4',
      mail: 'user4@mail.com',
      passwd: '$2a$10$g6zgq7PTbl1IAZqLPB0EEeoVer.ogFMGnPgVJF9/PAjHWHM17xHZO',
    },
    {
      id: 10102,
      name: 'User #5',
      mail: 'user5@mail.com',
      passwd: '$2a$10$g6zgq7PTbl1IAZqLPB0EEeoVer.ogFMGnPgVJF9/PAjHWHM17xHZO',
    },
  ])
  .then(() => knex('accounts').insert([
    { id: 10100, name: 'Acc Saldo Princial', user_id: 10100 },
    { id: 10101, name: 'Acc Saldo Secundário', user_id: 10100 },
    { id: 10102, name: 'Acc Alternativa 1', user_id: 10101 },
    { id: 10103, name: 'Acc Alternativa 2', user_id: 10101 },
    { id: 10104, name: 'Acc Geral Princial', user_id: 10102 },
    { id: 10105, name: 'Acc Geral Secundário', user_id: 10102 },
  ]))
  .then(() => knex('transfers').insert([
    {
      id: 10100,
      description: 'Tranfer #1',
      user_id: 10102,
      acc_ori_id: 10105,
      acc_dest_id: 10104,
      ammount: 256,
      date: new Date(),
    },
    {
      id: 10101,
      description: 'Tranfer #2',
      user_id: 10101,
      acc_ori_id: 10102,
      acc_dest_id: 10103,
      ammount: 512,
      date: new Date(),
    },
  ]))
  .then(() => knex('transactions').insert([
    // Saldo Princial = 2
    {
      description: 'Transfer nova',
      date: new Date(),
      ammount: 2,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    // Saldo Principal 2
    {
      description: 'Transfer nova',
      date: new Date(),
      ammount: 4,
      type: 'I',
      acc_id: 10102,
      status: true,
    },
    // Saldo Principal = 2 / Saldo Secundário =  8
    {
      description: 'Transfer nova',
      date: new Date(),
      ammount: 8,
      type: 'I',
      acc_id: 10105,
      status: true,
    },
    // Saldo Transação Pendente Principal = 2 / Saldo Secundário =  8
    {
      description: 'Transfer nova',
      date: new Date(),
      ammount: 16,
      type: 'I',
      acc_id: 10104,
      status: false,
    },
    // Saldo Transação Passada Principal = 34 / Saldo Secundário =  8
    {
      description: 'Transfer nova',
      date: moment().subtract({ days: 5 }),
      ammount: 32,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    // Saldo Transação Futura Principal = 34 / Saldo Secundário =  8
    {
      description: 'Transfer nova',
      date: moment().add({ days: 5 }),
      ammount: 64,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    // Saldo Transação Negativa Principal = -94 / Saldo Secundário =  8
    {
      description: 'Transfer nova',
      date: moment(),
      ammount: -128,
      type: 'O',
      acc_id: 10104,
      status: true,
    },
    // Saldo Transação Transferencia Principal = 162 / Saldo Secundário =  8
    {
      description: 'Transfer nova',
      date: moment(),
      ammount: 256,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    // Saldo Transação Transferencia Principal = 162 / Saldo Secundário =  -248
    {
      description: 'Transfer nova',
      date: moment(),
      ammount: -256,
      type: 'O',
      acc_id: 10105,
      status: true,
    },
    // Saldo Transação Transferencia Principal = 162 / Saldo Secundário =  8
    {
      description: 'Transfer nova',
      date: moment(),
      ammount: 512,
      type: 'I',
      acc_id: 10103,
      status: true,
    },
    // Saldo Transação Transferencia Principal = 162 / Saldo Secundário =  -248
    {
      description: 'Transfer nova',
      date: moment(),
      ammount: -512,
      type: 'O',
      acc_id: 10102,
      status: true,
    },
  ]));
