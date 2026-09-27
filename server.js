const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, () => {
  console.log(`Secretaria Digital (backend) rodando em http://localhost:${env.PORT}`);
});
