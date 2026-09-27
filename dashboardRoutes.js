const express = require('express');
const controller = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/stats', controller.estatisticas);

module.exports = router;
