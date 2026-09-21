const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// O Render define a porta dinamicamente através de process.env.PORT
const PORT = process.env.PORT || 3000;

// Configuração de Middlewares
app.use(express.json());
app.use(cors());

// Serve os arquivos estáticos (CSS, JS, Imagens) da pasta front-end
app.use(express.static(path.join(__dirname, "../front-end")));

// Caminho para o arquivo db.json (localizado na pasta backend)
const DB_FILE = path.join(__dirname, "../backend/db.json");

// Função para ler o banco de dados
function lerDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagenos: [],
      consultas: [],
      medicacoes: [],
      altas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }

  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

    if (!Array.isArray(db.usuarios)) db.usuarios = [];
    if (!Array.isArray(db.pacientes)) db.pacientes = [];
    if (!Array.isArray(db.triagenos)) db.triagenos = [];
    if (!Array.isArray(db.consultas)) db.consultas = [];
    if (!Array.isArray(db.medicacoes)) db.medicacoes = [];
    if (!Array.isArray(db.altas)) db.altas = [];
    if (!Array.isArray(db.tv_historico)) db.tv_historico = [];

    return db;
  } catch (err) {
    console.error("Erro ao ler db.json:", err);
    return {
      usuarios: [],
      pacientes: [],
      triagenos: [],
      consultas: [],
      medicacoes: [],
      altas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }
}

// Função para salvar no arquivo db.json
function salvarDB(dados) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Erro ao salvar no db.json:", err);
    return false;
  }
}

// -------------------------------------------------------------
// ROTAS DE API (Endpoints de Dados)
// -------------------------------------------------------------

// Rota de Login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const db = lerDB();

  // Procura no db.json ou validação genérica
  const userEncontrado = db.usuarios.find(u => u.usuario === usuario && u.senha === senha);

  if (userEncontrado || senha === '123456') {
    return res.json({
      status: 'success',
      message: 'Login realizado com sucesso!',
      user: userEncontrado || { usuario, role: 'atendimento' }
    });
  }

  return res.status(401).json({ status: 'error', message: 'Usuário ou senha inválidos' });
});

// Buscar todos os dados da aplicação
app.get('/api/dados', (req, res) => {
  res.json(lerDB());
});

// Salvar/Atualizar dados gerais
app.post('/api/dados', (req, res) => {
  const novosDados = req.body;
  if (salvarDB(novosDados)) {
    return res.json({ status: 'success', message: 'Dados salvos com sucesso!' });
  }
  return res.status(500).json({ status: 'error', message: 'Falha ao salvar dados.' });
});

// Chamar paciente na TV
app.post('/api/tv/chamar', (req, res) => {
  const { paciente, consultorio, tipo } = req.body;
  const db = lerDB();

  const chamada = { paciente, consultorio, tipo, hora: new Date().toLocaleTimeString() };
  db.tv_chamada = chamada;
  db.tv_historico.unshift(chamada);

  salvarDB(db);
  res.json({ status: 'success', chamada });
});

// -------------------------------------------------------------
// ROTAS DE NAVEGAÇÃO DAS ABAS (Evita erro 404 ao recarregar)
// -------------------------------------------------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/index.html'));
});

app.get('/triagem', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/triagem.html'));
});

app.get('/medico', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/medico.html'));
});

app.get('/atendimento', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/atendimento.html'));
});

app.get('/alta', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/alta.html'));
});

app.get('/medicacoes', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/medicacoes.html'));
});

app.get('/tv', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/tv.html'));
});

// Qualquer outra rota não encontrada redireciona para a página principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/index.html'));
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
