const bodyParser = require('body-parser');
const cors = require('cors');

// const knexLogger = require('knex-logger');

module.exports = (app) => {
  app.use(bodyParser.json());
  // app.use(knexLogger(app.db));
  app.use(cors({ origin: '*' }));
};
