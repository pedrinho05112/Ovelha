const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Exige um Bearer token válido. Em caso de sucesso, disponibiliza req.usuario.email e .papel.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Autenticação necessária. Faça login novamente.'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.usuario = { email: payload.sub, papel: payload.papel || 'admin' };
    next();
  } catch (err) {
    return next(new ApiError(401, 'Sessão inválida ou expirada. Faça login novamente.'));
  }
}

// Deve vir depois de requireAuth. Só deixa passar quem é "owner" (dono da conta principal).
function requireOwner(req, res, next) {
  if (req.usuario?.papel !== 'owner') {
    return next(new ApiError(403, 'Só o administrador principal pode fazer isso.'));
  }
  next();
}

module.exports = { requireAuth, requireOwner };
