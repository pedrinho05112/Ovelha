const rateLimit = require('express-rate-limit');

// Limita tentativas de login/definição de senha por IP, para dificultar força bruta.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' },
});

// Limite mais amplo para a API em geral, evitando abuso/varredura.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Aguarde um pouco antes de tentar novamente.' },
});

module.exports = { authLimiter, apiLimiter };
