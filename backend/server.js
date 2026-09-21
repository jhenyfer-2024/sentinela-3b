const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Middlewares
app.use(express.json());
app.use(cors());

// Descobre a pasta raiz do projeto
const ROOT_DIR = path.resolve(__dirname, "..");

// Função para localizar a pasta do front-end
function obterPastaFrontend() {
  try {
    const itens = fs.readdirSync(ROOT_DIR);
    const pasta = itens.find(
      (item) => item.toLowerCase() === "front-end" || item.toLowerCase() === "frontend"
    );
    return path.join(ROOT_DIR, pasta || "front-end");
  } catch (err) {
    return path.join(ROOT_DIR, "front-end");
  }
}

const FRONTEND_DIR = obterPastaFrontend();
app.use(express.static(FRONTEND_DIR));

// Banco de dados (localizado dentro da pasta backend)
const DB_FILE = path.join(ROOT_DIR, "backend", "db.json");

// =========================
// BANCO DE DADOS
// =========================

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [
        { usuario: "triagem", senha: "123", tipo: "triagem" },
        { usuario: "medico", senha: "123", tipo: "medico" },
        { usuario: "atendimento", senha: "123", tipo: "atendimento" }
      ],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }

  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

    if (!Array.isArray(db.usuarios) || db.usuarios.length === 0) {
      db.usuarios = [
        { usuario: "triagem", senha: "123", tipo: "triagem" },
        { usuario: "medico", senha: "123", tipo: "medico" },
        { usuario: "atendimento", senha: "123", tipo: "atendimento" }
      ];
    }
    if (!Array.isArray(db.pacientes)) db.pacientes = [];
    if (!Array.isArray(db.triagens)) db.triagens = [];
    if (!Array.isArray(db.consultas)) db.consultas = [];
    if (!db.tv_chamada) db.tv_chamada = null;
    if (!Array.isArray(db.tv_historico)) db.tv_historico = [];

    return db;
  } catch (error) {
    console.error("Erro ao ler db.json:", error);
    return {
      usuarios: [
        { usuario: "triagem", senha: "123", tipo: "triagem" },
        { usuario: "medico", senha: "123", tipo: "medico" },
        { usuario: "atendimento", senha: "123", tipo: "atendimento" }
      ],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Erro ao salvar db.json:", error);
  }
}

// Função para enviar os arquivos HTML das abas
function enviarHtml(res, nomeArquivo) {
  const caminhoCompleto = path.join(FRONTEND_DIR, nomeArquivo);
  if (fs.existsSync(caminhoCompleto)) {
    return res.sendFile(caminhoCompleto);
  }
  return res.status(404).send(`Página ${nomeArquivo} não encontrada.`);
}

// =========================
// LOGIN & AUTENTICAÇÃO
// =========================

app.post("/login", (req, res) => {
  const db = readDB();
  const { usuario, senha } = req.body;

  let user = db.usuarios.find(
    (u) => u.usuario === usuario && u.senha === senha
  );

  // Permite login com senha padrão caso o usuário não esteja cadastrado no json
  if (!user && (senha === "123" || senha === "123456")) {
    user = {
      usuario,
      tipo: usuario === "medico" ? "medico" : usuario === "triagem" ? "triagem" : "atendimento"
    };
  }

  if (!user) {
    return res.status(401).json({ erro: "Usuário ou senha incorretos" });
  }

  res.json(user);
});

// Suporte para a rota alternativa de API
app.post("/api/login", (req, res) => {
  const db = readDB();
  const { usuario, senha } = req.body;

  let user = db.usuarios.find(
    (u) => u.usuario === usuario && u.senha === senha
  );

  if (!user && (senha === "123" || senha === "123456")) {
    user = {
      usuario,
      tipo: usuario === "medico" ? "medico" : usuario === "triagem" ? "triagem" : "atendimento"
    };
  }

  if (!user) {
    return res.status(401).json({ status: "error", message: "Usuário ou senha incorretos" });
  }

  res.json({ status: "success", user, tipo: user.tipo });
});

// =========================
// ATENDIMENTO
// =========================

app.post("/atendimento", (req, res) => {
  const db = readDB();
  const paciente = {
    id: Date.now(),
    nome: req.body.nome,
    cpf: req.body.cpf,
    tipo: req.body.tipo,
    status: "triagem",
    createdAt: new Date().toISOString()
  };

  db.pacientes.push(paciente);
  writeDB(db);
  res.json(paciente);
});

app.get("/pacientes", (req, res) => {
  const db = readDB();
  res.json(db.pacientes);
});

// =========================
// TRIAGEM
// =========================

app.post("/triagem", (req, res) => {
  const db = readDB();
  let risco = req.body.risco;
  const temperatura = Number(req.body.temperatura);

  if (temperatura >= 39) {
    risco = "vermelho";
  } else if (temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: req.body.temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco,
    status: "aguardando_medico",
    createdAt: new Date().toISOString()
  };

  db.triagens.push(triagem);
  writeDB(db);
  res.json(triagem);
});

app.get("/triagens", (req, res) => {
  const db = readDB();
  res.json(db.triagens);
});

// =========================
// TV / MÍDIA INDOOR
// =========================

app.post("/tv/chamar", (req, res) => {
  const db = readDB();
  const chamada = {
    id: Date.now().toString(),
    localTipo: req.body.localTipo,
    localNumero: req.body.localNumero,
    paciente: req.body.paciente,
    hora: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  db.tv_chamada = chamada;
  db.tv_historico.unshift(chamada);

  if (db.tv_historico.length > 5) {
    db.tv_historico = db.tv_historico.slice(0, 5);
  }

  writeDB(db);
  res.json(chamada);
});

app.get("/tv/chamada", (req, res) => {
  const db = readDB();
  res.json({
    chamada: db.tv_chamada,
    historico: db.tv_historico
  });
});

// =========================
// MEDICAÇÕES E CONSULTAS
// =========================

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona", "Paracetamol", "Ibuprofeno", "Amoxicilina",
    "Azitromicina", "Loratadina", "Omeprazol", "Buscopan",
    "Dramin", "Soro fisiológico"
  ]);
});

app.post("/consulta", (req, res) => {
  const db = readDB();
  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date().toISOString()
  };

  db.consultas.push(consulta);
  writeDB(db);
  res.json(consulta);
});

app.get("/medicacoes", (req, res) => {
  const db = readDB();
  res.json(db.consultas);
});

// =========================
// NAVEGAÇÃO DAS ABAS (Evita Erro 404)
// =========================

app.get("/", (req, res) => enviarHtml(res, "index.html"));
app.get("/triagem", (req, res) => enviarHtml(res, "triagem.html"));
app.get("/medico", (req, res) => enviarHtml(res, "medico.html"));
app.get("/atendimento", (req, res) => enviarHtml(res, "atendimento.html"));
app.get("/alta", (req, res) => enviarHtml(res, "alta.html"));
app.get("/medicacoes", (req, res) => enviarHtml(res, "medicacoes.html"));
app.get("/tv", (req, res) => enviarHtml(res, "tv.html"));

// Rota curinga para redirecionamento no Express 5
app.get("/*splat", (req, res) => enviarHtml(res, "index.html"));

// =========================
// SERVIDOR
// =========================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🏥 Hospital Pro rodando na porta ${PORT}`);
});
