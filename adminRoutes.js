const express = require('express');
const controller = require('../controllers/adminController');
const validators = require('../validators/adminValidators');
const validate = require('../validators/validate');
const { requireAuth, requireOwner } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireOwner); // toda rota aqui exige ser o administrador principal

router.get('/administradores', controller.listar);
router.post('/administradores', validators.adicionar, validate, controller.adicionar);
router.delete('/administradores/:email', validators.emailParam, validate, controller.revogar);

module.exports = router;
