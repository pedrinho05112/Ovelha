const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/administradores
const listar = asyncHandler(async (req, res) => {
  const lista = db.prepare(`
    SELECT a.email, a.papel, a.criado_em, a.convidado_por,
           CASE WHEN u.id IS NULL THEN 0 ELSE 1 END AS registrado
    FROM assinantes a
    LEFT JOIN usuarios u ON u.email = a.email
    WHERE a.autorizado = 1
    ORDER BY a.criado_em ASC
  `).all();
  res.json(lista);
});

// POST /api/admin/administradores  { email, papel? }
const adicionar = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const papel = req.body.papel === 'owner' ? 'owner' : 'admin';

  const existente = db.prepare('SELECT 1 FROM assinantes WHERE email = ?').get(email);
  if (existente) {
    throw new ApiError(409, 'Este e-mail já está na lista de administradores.');
  }

  db.prepare('INSERT INTO assinantes (email, autorizado, papel, convidado_por) VALUES (?, 1, ?, ?)')
    .run(email, papel, req.usuario.email);

  res.status(201).json({ ok: true, mensagem: `${email} liberado para fazer o primeiro acesso.` });
});

// DELETE /api/admin/administradores/:email
const revogar = asyncHandler(async (req, res) => {
  const email = req.params.email.toLowerCase();
  if (email === req.usuario.email) {
    throw new ApiError(400, 'Você não pode revogar o seu próprio acesso.');
  }
  const info = db.prepare('UPDATE assinantes SET autorizado = 0 WHERE email = ?').run(email);
  if (info.changes === 0) {
    throw new ApiError(404, 'Administrador não encontrado.');
  }
  res.status(204).send();
});

module.exports = { listar, adicionar, revogar };
