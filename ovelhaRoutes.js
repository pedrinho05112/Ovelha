const express = require('express');
const controller = require('../controllers/ovelhaController');
const validators = require('../validators/ovelhaValidators');
const validate = require('../validators/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth); // nenhuma rota de ovelhas é acessível sem login

router.get('/', controller.listar);
router.get('/:id', validators.idParam, validate, controller.buscarPorId);
router.post('/', validators.criarOuAtualizar, validate, controller.criar);
router.put('/:id', validators.idParam, validators.criarOuAtualizar, validate, controller.atualizar);
router.delete('/:id', validators.idParam, validate, controller.remover);

module.exports = router;
