module.exports = function AcessDeniedError(message = 'Este recurso não pertence ao usuário') {
  this.name = 'AcessDeniedError';
  this.message = message;
};
