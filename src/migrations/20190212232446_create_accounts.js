
exports.up = knex => knex.schema.createTable('accounts', (t) => {
  t.increments('id').primary();
  t.string('name').notNull();
  t.integer('user_id')
    .references('id')
    .inTable('users')
    .notNull();
});

exports.down = knex => knex.schema.dropTable('accounts');
