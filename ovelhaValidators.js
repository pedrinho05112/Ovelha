const { body, param } = require('express-validator');

const CARGOS_VALIDOS = [
  'Membro', 'Visitante', 'Músico', 'Diácono', 'Diaconisa',
  'Presbítero', 'Obreiro(a)', 'Líder de ministério', 'Outro',
];
const CATEGORIAS_VALIDAS = ['Homem', 'Mulher', 'Jovem', 'Criança'];

const criarOuAtualizar = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Informe o nome completo.')
    .isLength({ min: 3, max: 120 }).withMessage('O nome deve ter entre 3 e 120 caracteres.'),
  body('batizado')
    .isIn(['sim', 'nao']).withMessage('Informe se é batizado("sim" ou "nao").'),
  body('cargo')
    .isIn(CARGOS_VALIDOS).withMessage('Cargo inválido.'),
  body('categoria')
    .isIn(CATEGORIAS_VALIDAS).withMessage('Categoria inválida.'),
  body('endereco')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Endereço muito longo.'),
  body('numero')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Número muito longo.'),
  body('familia')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 }).withMessage('Nome da família muito longo.'),
];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'),
];

module.exports = { criarOuAtualizar, idParam, CARGOS_VALIDOS, CATEGORIAS_VALIDAS };
