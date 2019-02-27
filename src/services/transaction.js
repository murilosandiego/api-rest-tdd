module.exports = (app) => {
  const find = (userId, filter = {}) => app
    .db('transactions')
    .join('accounts', 'accounts.id', 'acc_id')
    .where(filter)
    .andWhere('accounts.user_id', '=', userId)
    .select();

  const save = (transaction) => {
    const newTransaction = { ...transaction };
    if (
      (transaction.type === 'I' && transaction.ammount < 0)
      || (transaction.type === 'O' && transaction.ammount > 0)
    ) newTransaction.ammount *= -1;
    return app.db('transactions').insert(newTransaction, '*');
  };

  const findOne = (filter = {}) => app
    .db('transactions')
    .where(filter)
    .first();

  const update = (id, transaction) => app
    .db('transactions')
    .where({ id })
    .update(transaction, '*');

  const remove = id => app
    .db('transactions')
    .where({ id })
    .del();

  return {
    find,
    save,
    findOne,
    update,
    remove,
  };
};
