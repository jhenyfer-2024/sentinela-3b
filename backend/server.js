const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// =========================
// CONFIGURAÇÕES
// =========================

app.use(express.json());
app.use(cors());

// Servir o frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Banco de dados
const DB_FILE = path.join(__dirname, "db.json");

// =========================
// BANCO DE DADOS
// =========================

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }

  try {
    const db = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

    // Garante que as propriedades existam
    if (!Array.isArray(db.usuarios)) db.usuarios = [];
    if (!Array.isArray(db.pacientes)) db.pacientes = [];
    if (!Array.isArray(db.triagens)) db.triagens = [];
    if (!Array.isArray(db.consultas)) db.consultas = [];

    if (!db.tv_chamada) {
      db.tv_chamada = null;
    }

    if (!Array.isArray(db.tv_historico)) {
      db.tv_historico = [];
    }

    return db;
  } catch (error) {
    console.error("Erro ao ler db.json:", error);

    return {
      usuarios: [],
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
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Erro ao salvar db.json:", error);
    throw error;
  }
}

// =========================
// ROTA PRINCIPAL
// =========================

app.get("/", (req, res) => {
  res.send("🏥 Hospital Pro - API online");
});

// =========================
// LOGIN
// =========================

app.post("/login", (req, res) => {
  const db = readDB();

  const user = db.usuarios.find(
    (u) =>
      u.usuario === req.body.usuario &&
      u.senha === req.body.senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// =========================
// ATENDIMENTO
// =========================

// Cadastrar paciente
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

// Listar pacientes
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

// Listar triagens
app.get("/triagens", (req, res) => {
  const db = readDB();

  res.json(db.triagens);
});

// =========================
// TV / MÍDIA INDOOR
// =========================

// Chamar paciente na TV
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

  // Mantém somente as últimas 5 chamadas
  if (db.tv_historico.length > 5) {
    db.tv_historico = db.tv_historico.slice(0, 5);
  }

  writeDB(db);

  res.json(chamada);
});

// Consultar chamada atual e histórico
app.get("/tv/chamada", (req, res) => {
  const db = readDB();

  res.json({
    chamada: db.tv_chamada,
    historico: db.tv_historico
  });
});

// =========================
// MEDICAÇÕES
// =========================

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// =========================
// CONSULTA
// =========================

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

// Listar medicações/consultas
app.get("/medicacoes", (req, res) => {
  const db = readDB();

  res.json(db.consultas);
});

// =========================
// TRATAMENTO DE ERROS
// =========================

app.use((err, req, res, next) => {
  console.error("Erro na aplicação:", err);

  res.status(500).json({
    erro: "Erro interno do servidor"
  });
});

// =========================
// SERVIDOR
// =========================

// IMPORTANTE PARA O RENDER:
// O Render fornece a porta através de process.env.PORT.

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🏥 Hospital Pro rodando na porta ${PORT}`);
});
