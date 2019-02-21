const express = require('express');
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt-nodejs');
const ValidationError = require('../erros/ValidationErros');

const secret = 'Segredo!';

module.exports = (app) => {
  const router = express.Router();

  router.post('/signin', (req, res, next) => {
    app.services.user
      .findOne({ mail: req.body.mail })
      .then((user) => {
        if (!user) throw new ValidationError('Usuário ou senha inválido!');
        if (!bcrypt.compareSync(req.body.passwd, user.passwd)) throw new ValidationError('Usuário ou senha inválido!');

        const payload = {
          id: user.id,
          name: user.name,
          mail: user.mail,
        };

        const token = jwt.encode(payload, secret);
        res.status(200).json({ token });
      })
      .catch(err => next(err));
  });

  router.post('/signup', (req, res, next) => {
    app.services.user
      .save(req.body)
      .then(result => res.status(201).json(result[0]))
      .catch(err => next(err));
  });

  return router;
};
