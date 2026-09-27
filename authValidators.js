const { body } = require('express-validator');

const emailRule = body('email')
  .trim()
  .notEmpty().withMessage('Informe o e-mail.')
  .isEmail().withMessage('E-mail em formato inválido.')
  .normalizeEmail();

// Senha forte: mínimo 8 caracteres, com ao menos uma letra e um número.
const senhaForteRule = (campo) =>
  body(campo)
    .notEmpty().withMessage('Informe a senha.')
    .isLength({ min: 8 }).withMessage('A senha precisa ter no mínimo 8 caracteres.')
    .matches(/[A-Za-z]/).withMessage('A senha precisa ter ao menos uma letra.')
    .matches(/[0-9]/).withMessage('A senha precisa ter ao menos um número.');

const confirmaSenhaRule = (campo, original) =>
  body(campo).custom((valor, { req }) => {
    if (valor !== req.body[original]) throw new Error('As senhas não coincidem.');
    return true;
  });

const checkEmail = [emailRule];

const criarConta = [
  emailRule,
  senhaForteRule('senha'),
  confirmaSenhaRule('confirmarSenha', 'senha'),
];

const login = [
  emailRule,
  body('senha').notEmpty().withMessage('Informe a senha.'),
];

const esqueciSenha = [emailRule];

const redefinirSenha = [
  body('token').trim().notEmpty().withMessage('Token de redefinição ausente.'),
  senhaForteRule('novaSenha'),
  confirmaSenhaRule('confirmarSenha', 'novaSenha'),
];

module.exports = { checkEmail, criarConta, login, esqueciSenha, redefinirSenha };
