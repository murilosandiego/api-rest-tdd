const express = require('express');
const AcessDeniedError = require('../erros/AccessDeniedError');

module.exports = (app) => {
  const router = express.Router();

  router.param('id', (req, res, next) => {
    app.services.account
      .find({ id: req.params.id })
      .then((acc) => {
        if (acc.user_id !== req.user.id) throw new AcessDeniedError();
        else next();
      })
      .catch(err => next(err));
  });

  router.get('/', (req, res, next) => {
    app.services.account
      .findAll(req.user.id)
      .then(result => res.status(200).json(result))
      .catch(err => next(err));
  });

  router.post('/', (req, res, next) => {
    app.services.account
      .save({ ...req.body, user_id: req.user.id })
      .then(result => res.status(201).json(result[0]))
      .catch(err => next(err));
  });

  router.get('/:id', (req, res, next) => {
    app.services.account
      .find({ id: req.params.id })
      .then((result) => {
        if (result.user_id !== req.user.id) return res.status(403).json({ error: 'Este recurso não pertence ao usuário' });
        return res.status(200).json(result);
      })
      .catch(err => next(err));
  });

  router.put('/:id', (req, res, next) => {
    app.services.account
      .update(req.params.id, req.body)
      .then(result => res.status(200).json(result[0]))
      .catch(err => next(err));
  });

  router.delete('/:id', (req, res, next) => {
    app.services.account
      .remove(req.params.id)
      .then(() => res.status(204).send())
      .catch(err => next(err));
  });

  return router;
};
