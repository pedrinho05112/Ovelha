const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function normalizarFamilia(familia) {
  const valor = (familia || '').trim();
  return valor || 'Sozinho(a)';
}

const CAMPOS_ORDENAVEIS = ['nome', 'categoria', 'cargo', 'batizado', 'familia'];

// GET /api/ovelhas?busca=&cargo=&categoria=&batizado=&ordenarPor=&ordem=
const listar = asyncHandler(async (req, res) => {
  const busca = `%${(req.query.busca || '').trim().toLowerCase()}%`;
  const cargo = (req.query.cargo || '').trim();
  const categoria = (req.query.categoria || '').trim();
  const batizado = (req.query.batizado || '').trim();

  const ordenarPor = CAMPOS_ORDENAVEIS.includes(req.query.ordenarPor) ? req.query.ordenarPor : 'nome';
  const ordem = req.query.ordem === 'desc' ? 'DESC' : 'ASC';

  let sql = 'SELECT * FROM ovelhas WHERE lower(nome) LIKE ?';
  const params = [busca];
  if (cargo) { sql += ' AND cargo = ?'; params.push(cargo); }
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
  if (batizado) { sql += ' AND batizado = ?'; params.push(batizado); }
  // ordenarPor/ordem vêm de uma lista fechada acima, nunca são concatenados a partir
  // de entrada livre do usuário — por isso é seguro interpolar aqui, sem parametrizar.
  sql += ` ORDER BY ${ordenarPor} COLLATE NOCASE ${ordem}`;

  const ovelhas = db.prepare(sql).all(...params);
  res.json(ovelhas);
});

// GET /api/ovelhas/:id
const buscarPorId = asyncHandler(async (req, res) => {
  const ovelha = db.prepare('SELECT * FROM ovelhas WHERE id = ?').get(req.params.id);
  if (!ovelha) throw new ApiError(404, 'Ovelha não encontrada.');
  res.json(ovelha);
});

// POST /api/ovelhas
const criar = asyncHandler(async (req, res) => {
  const { nome, batizado, cargo, categoria, endereco, numero } = req.body;
  const familia = normalizarFamilia(req.body.familia);

  const info = db.prepare(`
    INSERT INTO ovelhas (nome, batizado, cargo, categoria, endereco, numero, familia, criado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nome, batizado, cargo, categoria, endereco || null, numero || null, familia, req.usuario.email);

  const ovelha = db.prepare('SELECT * FROM ovelhas WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(ovelha);
});

// PUT /api/ovelhas/:id
const atualizar = asyncHandler(async (req, res) => {
  const existente = db.prepare('SELECT * FROM ovelhas WHERE id = ?').get(req.params.id);
  if (!existente) throw new ApiError(404, 'Ovelha não encontrada.');

  const { nome, batizado, cargo, categoria, endereco, numero } = req.body;
  const familia = normalizarFamilia(req.body.familia);

  db.prepare(`
    UPDATE ovelhas
    SET nome = ?, batizado = ?, cargo = ?, categoria = ?, endereco = ?, numero = ?, familia = ?, atualizado_em = datetime('now')
    WHERE id = ?
  `).run(nome, batizado, cargo, categoria, endereco || null, numero || null, familia, req.params.id);

  const ovelha = db.prepare('SELECT * FROM ovelhas WHERE id = ?').get(req.params.id);
  res.json(ovelha);
});

// DELETE /api/ovelhas/:id
const remover = asyncHandler(async (req, res) => {
  const info = db.prepare('DELETE FROM ovelhas WHERE id = ?').run(req.params.id);
  if (info.changes === 0) throw new ApiError(404, 'Ovelha não encontrada.');
  res.status(204).send();
});

module.exports = { listar, buscarPorId, criar, atualizar, remover };
