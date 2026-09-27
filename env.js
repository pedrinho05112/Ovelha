// Carrega o .env e falha alto (fail fast) se faltar algo essencial em produção.
require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  DB_PATH: process.env.DB_PATH || './data/secretaria.db',
};

if (!env.JWT_SECRET || env.JWT_SECRET.length < 16) {
  // Um segredo fraco ou ausente compromete todos os tokens emitidos pela API.
  console.error('[config] JWT_SECRET ausente ou fraco demais. Defina um valor forte no .env (ver .env.example).');
  process.exit(1);
}

if (env.NODE_ENV === 'production' && env.CORS_ORIGIN.length === 0) {
  console.error('[config] Em produção é obrigatório definir CORS_ORIGIN com as origens confiáveis do front-end.');
  process.exit(1);
}

module.exports = env;
