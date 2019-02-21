
exports.up = knex => knex.schema.createTable('users', (t) => {
  t.increments('id').primary();
  t.string('name').notNull();
  t.string('mail').notNull().unique();
  t.string('passwd').notNull();
});

exports.down = knex => knex.schema.dropTable('users');
