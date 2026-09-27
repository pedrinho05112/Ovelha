const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Deve vir depois das regras de validação em cada rota.
// Junta todos os erros de campo em uma resposta única e legível.
module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const detalhes = result.array().map((e) => ({ campo: e.path, mensagem: e.msg }));
  next(new ApiError(422, 'Dados inválidos.', detalhes));
};
