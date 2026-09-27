const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const SALT_ROUNDS = 12;
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;
const RESET_TOKEN_MINUTOS = 15;

function gerarToken(email, papel) {
  return jwt.sign({ sub: email, papel }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function hashToken(tokenBruto) {
  // Guarda só o hash do token no banco: um vazamento do banco não expõe tokens utilizáveis.
  return crypto.createHash('sha256').update(tokenBruto).digest('hex');
}

// POST /api/auth/check-email — primeiro acesso, passo 1
const checkEmail = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();

  const assinante = db.prepare('SELECT * FROM assinantes WHERE email = ? AND autorizado = 1').get(email);
  if (!assinante) {
    throw new ApiError(404, 'Este e-mail não foi encontrado entre as assinaturas ativas.');
  }

  const jaTemConta = db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email);
  if (jaTemConta) {
    throw new ApiError(409, 'Este e-mail já tem conta. Use a tela de login.');
  }

  res.json({ ok: true, mensagem: 'E-mail reconhecido. Você já pode criar sua senha.' });
});

// POST /api/auth/criar-conta — primeiro acesso, passo 2
const criarConta = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();

  const assinante = db.prepare('SELECT * FROM assinantes WHERE email = ? AND autorizado = 1').get(email);
  if (!assinante) {
    throw new ApiError(404, 'Este e-mail não foi encontrado entre as assinaturas ativas.');
  }
  const jaTemConta = db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email);
  if (jaTemConta) {
    throw new ApiError(409, 'Este e-mail já tem conta. Use a tela de login.');
  }

  const senhaHash = await bcrypt.hash(req.body.senha, SALT_ROUNDS);
  db.prepare('INSERT INTO usuarios (email, senha_hash, papel) VALUES (?, ?, ?)').run(email, senhaHash, assinante.papel);

  const token = gerarToken(email, assinante.papel);
  res.status(201).json({ token, email, papel: assinante.papel });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

  // Mesma mensagem para "não existe" e "senha errada": evita que alguém descubra
  // quais e-mails têm conta só testando o login.
  const credenciaisInvalidas = () => new ApiError(401, 'E-mail ou senha incorretos.');

  if (!usuario) throw credenciaisInvalidas();

  if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
    throw new ApiError(423, 'Conta temporariamente bloqueada por excesso de tentativas. Tente novamente mais tarde ou redefina sua senha.');
  }

  const senhaOk = await bcrypt.compare(req.body.senha, usuario.senha_hash);

  if (!senhaOk) {
    const tentativas = usuario.tentativas_login + 1;
    if (tentativas >= MAX_TENTATIVAS) {
      const bloqueioAte = new Date(Date.now() + BLOQUEIO_MINUTOS * 60000).toISOString();
      db.prepare('UPDATE usuarios SET tentativas_login = 0, bloqueado_ate = ? WHERE email = ?').run(bloqueioAte, email);
      throw new ApiError(423, `Muitas tentativas incorretas. Conta bloqueada por ${BLOQUEIO_MINUTOS} minutos.`);
    }
    db.prepare('UPDATE usuarios SET tentativas_login = ? WHERE email = ?').run(tentativas, email);
    throw credenciaisInvalidas();
  }

  db.prepare('UPDATE usuarios SET tentativas_login = 0, bloqueado_ate = NULL WHERE email = ?').run(email);

  const token = gerarToken(email, usuario.papel);
  res.json({ token, email, papel: usuario.papel });
});

// GET /api/auth/me — dados do usuário autenticado (usado pelo front para saber se é "owner")
const me = asyncHandler(async (req, res) => {
  res.json({ email: req.usuario.email, papel: req.usuario.papel });
});

// POST /api/auth/esqueci-senha — "esqueci minha senha", passo 1
// Gera um token de uso único com validade curta e (por enquanto, sem um provedor de
// e-mail configurado) devolve o token na própria resposta apenas fora de produção,
// só para permitir testar o fluxo ponta a ponta. Em produção, plugue aqui o envio do
// link "https://seu-dominio/redefinir?token=..." por e-mail (Resend, SendGrid, SES...)
// e pare de retornar o token na resposta.
const esqueciSenha = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const usuario = db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    throw new ApiError(404, 'Não encontramos conta com este e-mail.');
  }

  const tokenBruto = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(tokenBruto);
  const expiraEm = new Date(Date.now() + RESET_TOKEN_MINUTOS * 60000).toISOString();

  db.prepare('DELETE FROM tokens_redefinicao WHERE email = ? AND usado = 0').run(email);
  db.prepare('INSERT INTO tokens_redefinicao (email, token_hash, expira_em) VALUES (?, ?, ?)').run(email, tokenHash, expiraEm);

  if (env.NODE_ENV !== 'production') {
    console.log(`[dev] Token de redefinição para ${email}: ${tokenBruto} (expira em ${RESET_TOKEN_MINUTOS} min)`);
  }

  const resposta = { ok: true, mensagem: 'Encontramos sua conta. Enviamos um link para redefinir a senha.' };
  if (env.NODE_ENV !== 'production') {
    resposta.tokenDemonstracao = tokenBruto; // remova este campo assim que o envio de e-mail estiver plugado
  }
  res.json(resposta);
});

// POST /api/auth/redefinir-senha — "esqueci minha senha", passo 2
const redefinirSenha = asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.body.token);
  const registro = db.prepare(`
    SELECT * FROM tokens_redefinicao
    WHERE token_hash = ? AND usado = 0 AND expira_em > datetime('now')
  `).get(tokenHash);

  if (!registro) {
    throw new ApiError(400, 'Token inválido ou expirado. Solicite a redefinição novamente.');
  }

  const senhaHash = await bcrypt.hash(req.body.novaSenha, SALT_ROUNDS);
  db.prepare('UPDATE usuarios SET senha_hash = ?, tentativas_login = 0, bloqueado_ate = NULL WHERE email = ?').run(senhaHash, registro.email);
  db.prepare('UPDATE tokens_redefinicao SET usado = 1 WHERE id = ?').run(registro.id);

  const usuario = db.prepare('SELECT papel FROM usuarios WHERE email = ?').get(registro.email);
  const token = gerarToken(registro.email, usuario.papel);
  res.json({ token, email: registro.email, papel: usuario.papel });
});

module.exports = { checkEmail, criarConta, login, esqueciSenha, redefinirSenha, me };
