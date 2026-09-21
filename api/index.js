const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Middlewares
app.use(express.json());
app.use(cors());

// Descobre o caminho raiz do projeto (/opt/render/project/src)
const ROOT_DIR = path.resolve(__dirname, "..");

// Servir os arquivos estáticos da pasta front-end
app.use(express.static(path.join(ROOT_DIR, "front-end")));

// Caminho para o banco de dados db.json
const DB_FILE = path.join(ROOT_DIR, "backend", "db.json");

// Função auxiliar para enviar arquivos HTML com validação
function enviarHtml(res, nomeArquivo) {
  const caminhoCompleto = path.join(ROOT_DIR, "front-end", nomeArquivo);

  if (fs.existsSync(caminhoCompleto)) {
    return res.sendFile(caminhoCompleto);
  } else {
    console.error(`Arquivo não encontrado: ${caminhoCompleto}`);
    return res.status(404).send(`Arquivo ${nomeArquivo} não encontrado no caminho: ${caminhoCompleto}`);
  }
}

// -------------------------------------------------------------
// ROTAS DE API (Endpoints)
// -------------------------------------------------------------

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (senha === '123456' || usuario) {
    return res.json({
      status: 'success',
      user: {
        usuario,
        role: usuario === 'medico' ? 'medico' : usuario === 'triagem' ? 'triagem' : 'atendimento'
      }
    });
  }

  return res.status(401).json({ status: 'error', message: 'Usuário ou senha inválidos' });
});

// -------------------------------------------------------------
// ROTAS DE NAVEGAÇÃO DAS ABAS
// -------------------------------------------------------------

app.get('/', (req, res) => enviarHtml(res, 'index.html'));
app.get('/triagem', (req, res) => enviarHtml(res, 'triagem.html'));
app.get('/medico', (req, res) => enviarHtml(res, 'medico.html'));
app.get('/atendimento', (req, res) => enviarHtml(res, 'atendimento.html'));
app.get('/alta', (req, res) => enviarHtml(res, 'alta.html'));
app.get('/medicacoes', (req, res) => enviarHtml(res, 'medicacoes.html'));
app.get('/tv', (req, res) => enviarHtml(res, 'tv.html'));

// Rota coringa atualizada para o Express 5 (Sintaxe /*splat)
app.get('/*splat', (req, res) => enviarHtml(res, 'index.html'));

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
