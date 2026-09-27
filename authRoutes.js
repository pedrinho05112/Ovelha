const express = require('express');
const controller = require('../controllers/authController');
const validators = require('../validators/authValidators');
const validate = require('../validators/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de autenticação passam pelo limitador contra força bruta.
router.use(authLimiter);

router.post('/check-email', validators.checkEmail, validate, controller.checkEmail);
router.post('/criar-conta', validators.criarConta, validate, controller.criarConta);
router.post('/login', validators.login, validate, controller.login);
router.post('/esqueci-senha', validators.esqueciSenha, validate, controller.esqueciSenha);
router.post('/redefinir-senha', validators.redefinirSenha, validate, controller.redefinirSenha);
router.get('/me', requireAuth, controller.me);

module.exports = router;
