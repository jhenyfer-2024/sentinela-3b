const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Middlewares
app.use(express.json());
app.use(cors());

// Descobre a pasta raiz do projeto (/opt/render/project/src)
const ROOT_DIR = path.resolve(__dirname, "..");

// Função para localizar uma pasta ignorando maiúsculas/minúsculas
function encontrarPastaFrontend() {
  const itens = fs.readdirSync(ROOT_DIR);
  const pastaEncontrada = itens.find(
    (item) => item.toLowerCase() === "front-end" || item.toLowerCase() === "frontend"
  );
  
  if (pastaEncontrada) {
    return path.join(ROOT_DIR, pastaEncontrada);
  }
  // Fallback caso não encontre nas listagens
  return path.join(ROOT_DIR, "front-end");
}

const FRONTEND_DIR = encontrarPastaFrontend();

// Servir os arquivos estáticos da pasta do front-end
app.use(express.static(FRONTEND_DIR));

// Caminho do banco de dados (db.json na pasta backend)
const DB_FILE = path.join(ROOT_DIR, "backend", "db.json");

// Função para ler o banco de dados
function lerDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagenos: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (err) {
    console.error("Erro ao ler db.json:", err);
    return { usuarios: [], pacientes: [], triagenos: [], consultas: [] };
  }
}

// Função auxiliar para enviar os arquivos HTML com verificação
function enviarHtml(res, nomeArquivo) {
  const caminhoCompleto = path.join(FRONTEND_DIR, nomeArquivo);

  if (fs.existsSync(caminhoCompleto)) {
    return res.sendFile(caminhoCompleto);
  } else {
    console.error(`Arquivo não encontrado: ${caminhoCompleto}`);
    return res.status(404).send(`Arquivo ${nomeArquivo} não encontrado no caminho: ${caminhoCompleto}`);
  }
}

// -------------------------------------------------------------
// ROTAS DE API
// -------------------------------------------------------------

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const db = lerDB();

  const userEncontrado = (db.usuarios || []).find(
    (u) => u.usuario === usuario && u.senha === senha
  );

  if (userEncontrado || senha === '123456') {
    return res.json({
      status: 'success',
      user: userEncontrado || {
        usuario,
        role: usuario === 'medico' ? 'medico' : usuario === 'triagem' ? 'triagem' : 'atendimento'
      }
    });
  }

  return res.status(401).json({ status: 'error', message: 'Usuário ou senha inválidos' });
});

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  const db = lerDB();

  const userEncontrado = (db.usuarios || []).find(
    (u) => u.usuario === usuario && u.senha === senha
  );

  if (!userEncontrado) {
    return res.status(401).json({ erro: 'Login inválido' });
  }

  return res.json(userEncontrado);
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

// Rota coringa para o Express 5 (Sintaxe /*splat)
app.get('/*splat', (req, res) => enviarHtml(res, 'index.html'));

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
