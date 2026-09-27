const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const env = require('./env');

const dbPath = path.resolve(process.cwd(), env.DB_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Segurança/integridade básica do SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS assinantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    autorizado INTEGER NOT NULL DEFAULT 1,
    papel TEXT NOT NULL DEFAULT 'admin' CHECK (papel IN ('owner', 'admin')),
    convidado_por TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'admin' CHECK (papel IN ('owner', 'admin')),
    tentativas_login INTEGER NOT NULL DEFAULT 0,
    bloqueado_ate TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (email) REFERENCES assinantes(email)
  );

  CREATE TABLE IF NOT EXISTS ovelhas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    batizado TEXT NOT NULL CHECK (batizado IN ('sim', 'nao')),
    cargo TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Homem', 'Mulher', 'Jovem', 'Criança')),
    endereco TEXT,
    numero TEXT,
    familia TEXT NOT NULL DEFAULT 'Sozinho(a)',
    criado_por TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (criado_por) REFERENCES usuarios(email)
  );

  CREATE TABLE IF NOT EXISTS tokens_redefinicao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expira_em TEXT NOT NULL,
    usado INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (email) REFERENCES usuarios(email)
  );

  CREATE INDEX IF NOT EXISTS idx_ovelhas_cargo ON ovelhas(cargo);
  CREATE INDEX IF NOT EXISTS idx_ovelhas_categoria ON ovelhas(categoria);
  CREATE INDEX IF NOT EXISTS idx_tokens_email ON tokens_redefinicao(email);
`);

module.exports = db;
