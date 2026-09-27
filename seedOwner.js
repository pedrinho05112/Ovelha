// Uso: node src/db/seedOwner.js <email> <senha>
// Cria (ou promove) a conta principal do sistema, já com login e senha prontos —
// sem precisar passar pela tela de "primeiro acesso". Use isso uma única vez, para
// criar o primeiro administrador (o "dono") da sua instância do OVELHA.
// Rode isso direto no seu servidor — nunca deixe e-mail/senha reais escritos em
// arquivos versionados ou compartilhados.
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const email = (process.argv[2] || '').trim().toLowerCase();
const senha = process.argv[3] || '';

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: node src/db/seedOwner.js <email> <senha>');
  process.exit(1);
}
if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) {
  console.error('A senha precisa ter ao menos 8 caracteres, com letra e número.');
  process.exit(1);
}

(async () => {
  const senhaHash = await bcrypt.hash(senha, 12);

  db.prepare('INSERT OR IGNORE INTO assinantes (email, autorizado, papel) VALUES (?, 1, ?)').run(email, 'owner');
  db.prepare('UPDATE assinantes SET papel = ?, autorizado = 1 WHERE email = ?').run('owner', email);

  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existente) {
    db.prepare('UPDATE usuarios SET senha_hash = ?, papel = ?, tentativas_login = 0, bloqueado_ate = NULL WHERE email = ?')
      .run(senhaHash, 'owner', email);
    console.log(`Conta "${email}" atualizada para owner com a nova senha.`);
  } else {
    db.prepare('INSERT INTO usuarios (email, senha_hash, papel) VALUES (?, ?, ?)').run(email, senhaHash, 'owner');
    console.log(`Conta "${email}" criada como owner (administrador principal).`);
  }
})();
