module.exports = {
  test: {
    client: 'pg',
    version: '11.1',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'root',
      database: 'api_rest_tdd',
    },
    migrations: {
      directory: 'src/migrations',
    },
    seeds: {
      directory: 'src/seeds',
    },
  },
  prod: {
    client: 'pg',
    version: '11.1',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'root',
      database: 'api_rest_tdd_prod',
    },
    migrations: {
      directory: 'src/migrations',
    },
  },
};
