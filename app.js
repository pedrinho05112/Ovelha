const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const ApiError = require('./utils/ApiError');

const app = express();

// Cabeçalhos de segurança padrão (protege contra sniffing, clickjacking, etc.)
app.use(helmet());

// Só aceita chamadas das origens do front-end configuradas em CORS_ORIGIN.
app.use(cors({
  origin(origin, callback) {
    // permite chamadas sem origem (ex: apps mobile, curl/Postman) e as origens liberadas
    if (!origin || env.CORS_ORIGIN.length === 0 || env.CORS_ORIGIN.includes(origin)) {
      return callback(null, true);
    }
    return callback(new ApiError(403, 'Origem não autorizada.'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' })); // corpo pequeno: não é uma API de upload de arquivos
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
