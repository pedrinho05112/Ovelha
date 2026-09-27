const env = require('../config/env');

// Fica sempre por último na cadeia de middlewares.
// Nunca vaza stack trace ou detalhes internos para o cliente em produção.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const resposta = {
    erro: err.isOperational ? err.message : 'Erro interno do servidor.',
  };
  if (err.details) resposta.detalhes = err.details;

  if (!err.isOperational) {
    console.error('[erro não tratado]', err);
  } else if (env.NODE_ENV !== 'production') {
    console.warn(`[erro] ${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json(resposta);
}

function notFoundHandler(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

module.exports = { errorHandler, notFoundHandler };
