const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard/stats
const estatisticas = asyncHandler(async (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM ovelhas').get().n;

  const porCategoria = db.prepare(`
    SELECT categoria, COUNT(*) AS n FROM ovelhas GROUP BY categoria
  `).all();

  const porCargo = db.prepare(`
    SELECT cargo, COUNT(*) AS n FROM ovelhas GROUP BY cargo ORDER BY n DESC
  `).all();

  const contagemCategoria = { Homem: 0, Mulher: 0, Jovem: 0, Criança: 0 };
  porCategoria.forEach((row) => { contagemCategoria[row.categoria] = row.n; });

  res.json({
    total,
    porCategoria: contagemCategoria,
    porCargo,
  });
});

module.exports = { estatisticas };
