// Uso: npm run seed:assinante -- pastor@igreja.com [admin|owner]
// Libera um e-mail para "primeiro acesso" (simula a confirmação de pagamento da assinatura).
const db = require('../config/database');

const email = (process.argv[2] || '').trim().toLowerCase();
const papel = process.argv[3] === 'owner' ? 'owner' : 'admin';

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Informe um e-mail válido. Exemplo: npm run seed:assinante -- pastor@igreja.com');
  process.exit(1);
}

const stmt = db.prepare('INSERT OR IGNORE INTO assinantes (email, autorizado, papel) VALUES (?, 1, ?)');
const result = stmt.run(email, papel);

if (result.changes > 0) {
  console.log(`E-mail "${email}" liberado para primeiro acesso, como "${papel}".`);
} else {
  console.log(`E-mail "${email}" já estava cadastrado como assinante.`);
}
