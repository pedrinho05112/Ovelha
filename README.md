# Secretaria Digital — Backend

API em Node.js + Express + SQLite para o app de cadastro de ovelhas (membros) da igreja.

## Estrutura de pastas

```
src/
  config/       variáveis de ambiente e conexão com o banco
  db/           scripts utilitários (seed de assinante)
  middleware/   autenticação (JWT), rate limit, tratamento de erros
  validators/   regras de validação de cada rota (express-validator)
  controllers/  regra de negócio de cada recurso
  routes/       definição dos endpoints da API
  app.js        monta o Express e liga os middlewares
  server.js     sobe o servidor HTTP
data/           arquivo do banco SQLite (gerado automaticamente)
```

Cada camada tem uma responsabilidade só: rota decide o caminho, validator garante que
os dados estão corretos antes de chegar no controller, e o controller conversa com o banco.

## Papéis de administrador

Existem dois papéis:
- **owner** (dono): é você. Só o dono pode adicionar ou revogar outros administradores.
- **admin**: pode cadastrar, editar e excluir ovelhas normalmente, mas não pode gerenciar
  outros administradores.

Crie sua conta como dono (uma única vez, direto no seu servidor):

```bash
node src/db/seedOwner.js seu-email@exemplo.com "SuaSenhaForte123"
```

A partir daí, você faz login normalmente pelo app e usa a aba **Administradores**
(que só aparece para o dono) para convidar outras pessoas — elas recebem o e-mail
liberado e completam o cadastro pela tela de "primeiro acesso".

## Como rodar

```bash
npm install
cp .env.example .env
# edite o .env e troque JWT_SECRET por um valor forte (ex: openssl rand -hex 64)

# libera o e-mail de quem já pagou a assinatura, pra ele poder fazer o "primeiro acesso"
npm run seed:assinante -- pastor@igreja.com

npm run dev
```

O servidor sobe em `http://localhost:3000`. Todas as rotas ficam sob `/api`.

## Endpoints

| Método | Rota                          | Autenticação | Descrição |
|--------|-------------------------------|--------------|-----------|
| GET    | /api/health                   | não          | Verifica se a API está no ar |
| POST   | /api/auth/check-email         | não          | Primeiro acesso, passo 1: confirma que o e-mail é de um assinante |
| POST   | /api/auth/criar-conta         | não          | Primeiro acesso, passo 2: define a senha e já retorna um token |
| POST   | /api/auth/login                | não          | Login com e-mail + senha, retorna um token |
| POST   | /api/auth/esqueci-senha        | não          | Esqueci senha, passo 1: gera um token de redefinição válido por 15 min |
| POST   | /api/auth/redefinir-senha      | não          | Esqueci senha, passo 2: troca a senha usando o token recebido |
| GET    | /api/auth/me                  | sim          | Dados do usuário logado (e-mail e papel) |
| GET    | /api/admin/administradores     | sim (dono)   | Lista quem tem acesso e o status (ativo/pendente) |
| POST   | /api/admin/administradores     | sim (dono)   | Convida um novo administrador por e-mail |
| DELETE | /api/admin/administradores/:email | sim (dono) | Revoga o acesso de um administrador |
| GET    | /api/ovelhas                  | sim          | Lista ovelhas (filtros `?busca=&cargo=&categoria=&batizado=`, ordenação `?ordenarPor=nome\|categoria\|cargo\|batizado\|familia&ordem=asc\|desc`) |
| POST   | /api/ovelhas                  | sim          | Cadastra uma ovelha |
| PUT    | /api/ovelhas/:id               | sim          | Atualiza uma ovelha |
| DELETE | /api/ovelhas/:id               | sim          | Remove uma ovelha |
| GET    | /api/dashboard/stats           | sim          | Totais gerais, por categoria e por cargo |

Rotas autenticadas exigem o cabeçalho `Authorization: Bearer <token>` recebido no login.

## O que já está implementado em segurança e validação

- **Senhas com hash** (bcrypt, custo 12) — nunca guardadas em texto puro.
- **Senha forte obrigatória**: mínimo 8 caracteres, com letra e número.
- **Redefinição de senha por token**: "esqueci minha senha" gera um token de uso único,
  com hash (SHA-256) salvo no banco e validade de 15 minutos — quem só sabe o e-mail de
  alguém não consegue mais redefinir a senha dessa pessoa. Falta só plugar um provedor
  de e-mail (ver seção abaixo) para enviar o link de verdade.
- **Bloqueio de conta**: 5 tentativas de login erradas bloqueiam a conta por 15 minutos.
- **Rate limit** por IP nas rotas de autenticação (10 tentativas / 15 min) e na API em geral.
- **Validação de todos os campos de entrada** (e-mail, tamanho de nome, cargo e categoria
  dentro de uma lista fechada, etc.) com `express-validator`, sempre no servidor — nunca
  confiando apenas no que o front-end barra.
- **JWT com expiração** (8h por padrão) para autenticação sem guardar sessão em texto claro.
- **Cabeçalhos de segurança** via `helmet` (proteção contra clickjacking, sniffing de MIME etc.).
- **CORS restrito** às origens definidas em `CORS_ORIGIN`.
- **Consultas parametrizadas** (better-sqlite3 com `?` nos SQLs) — sem concatenar strings,
  o que evita injeção de SQL.
- **Mensagens de erro sem detalhes internos**: erros inesperados nunca vazam stack trace
  para quem chama a API.
- **Segredos fora do código**: `.env` fica de fora do controle de versão (`.gitignore`).

## Antes de colocar em produção de verdade

Isso ainda é uma base sólida para demonstração, mas falta fechar alguns pontos:

1. **Enviar o e-mail de redefinição de verdade.** O token já é gerado e validado com
   segurança (passo anterior), mas hoje ele só aparece no console/resposta da API fora
   de produção, para dar pra testar sem um provedor configurado. Antes de ir ao ar,
   plugue um serviço de e-mail (ex: Resend, SendGrid, Amazon SES) em
   `src/controllers/authController.js` (função `esqueciSenha`) para mandar o link
   `https://seu-dominio/redefinir?token=...` por e-mail e parar de devolver o token na resposta.
2. **HTTPS obrigatório** — hoje o servidor roda em HTTP puro, correto para
   desenvolvimento local; em produção deve ficar atrás de um proxy/CDN com HTTPS.
3. **Backup do banco.** O SQLite é ótimo para começar, mas programe backups periódicos
   do arquivo em `data/`.
4. **LGPD**: como o sistema guarda nome, endereço e vínculo familiar de pessoas reais,
   vale ter uma política de privacidade simples e uma forma de alguém pedir a exclusão
   dos próprios dados.
5. **Perfis de acesso**: hoje qualquer conta autenticada tem acesso total. Se no futuro
   existir um nível "obreiro" que só pode ver os próprios dados, isso precisa de um campo
   de papel/role nas tabelas e checagens extras nas rotas.
6. **Logs e monitoramento** em produção (ex: enviar os logs do `morgan` para um serviço
   externo) para perceber tentativas de ataque.
