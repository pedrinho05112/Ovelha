const { body, param } = require('express-validator');

const adicionar = [
  body('email')
    .trim().notEmpty().withMessage('Informe o e-mail.')
    .isEmail().withMessage('E-mail em formato inválido.')
    .normalizeEmail(),
  body('papel')
    .optional()
    .isIn(['owner', 'admin']).withMessage('Papel inválido.'),
];

const emailParam = [
  param('email').isEmail().withMessage('E-mail inválido.'),
];

module.exports = { adicionar, emailParam };
