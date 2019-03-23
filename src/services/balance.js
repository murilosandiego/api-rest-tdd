module.exports = (app) => {
  const getSaldo = userId => app
    .db('transactions as t')
    .sum('ammount')
    .join('accounts as acc', 'acc.id', '=', 't.acc_id')
    .where({ user_id: userId, status: true })
    .where('t.date', '<=', new Date())
    .select('acc.id')
    .groupBy('acc.id')
    .orderBy('acc.id');

  return { getSaldo };
};
