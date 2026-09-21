const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// ======================================================
// PORTA
// ======================================================

const PORT = process.env.PORT || 3000;

// ======================================================
// CONFIGURAÇÕES
// ======================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

// ======================================================
// CAMINHOS DO SISTEMA
// ======================================================

const BACKEND_DIR = __dirname;

const FRONTEND_DIR = path.join(
  __dirname,
  "../front-end"
);

const CSS_DIR = path.join(
  __dirname,
  "css"
);

const DB_FILE = path.join(
  __dirname,
  "db.json"
);

// ======================================================
// VERIFICAÇÃO DAS PASTAS
// ======================================================

console.log("");
console.log("==========================================");
console.log("      SENTINELA - SISTEMA HOSPITALAR");
console.log("==========================================");
console.log("");

console.log("📁 Backend:");
console.log(BACKEND_DIR);

console.log("");

console.log("📁 Front-end:");
console.log(FRONTEND_DIR);

console.log("");

console.log("🎨 CSS:");
console.log(CSS_DIR);

console.log("");

console.log("💾 Banco:");
console.log(DB_FILE);

console.log("");

if (!fs.existsSync(FRONTEND_DIR)) {
  console.error(
    "❌ ERRO: A pasta front-end não foi encontrada!"
  );

  console.error(
    `Caminho procurado: ${FRONTEND_DIR}`
  );

  console.error("");
}

if (!fs.existsSync(CSS_DIR)) {
  console.error(
    "❌ ERRO: A pasta css não foi encontrada!"
  );

  console.error(
    `Caminho procurado: ${CSS_DIR}`
  );

  console.error("");
}

// ======================================================
// FRONT-END
// ======================================================

app.use(
  express.static(
    FRONTEND_DIR,
    {
      etag: false,
      lastModified: false,
      maxAge: 0
    }
  )
);

// ======================================================
// CSS
// ======================================================

app.use(
  "/css",
  express.static(
    CSS_DIR,
    {
      etag: false,
      lastModified: false,
      maxAge: 0
    }
  )
);

// ======================================================
// COMPATIBILIDADE COM style.css
// ======================================================

app.get(
  "/style.css",
  (req, res) => {
    const arquivoCSS = path.join(
      CSS_DIR,
      "style.css"
    );

    if (!fs.existsSync(arquivoCSS)) {
      return res
        .status(404)
        .send(
          "Arquivo style.css não encontrado."
        );
    }

    res.sendFile(arquivoCSS);
  }
);

// ======================================================
// BANCO INICIAL
// ======================================================

function bancoInicial() {
  return {
    usuarios: [
      {
        usuario: "triagem",
        senha: "123",
        tipo: "triagem"
      },
      {
        usuario: "medico",
        senha: "123",
        tipo: "medico"
      },
      {
        usuario: "atendimento",
        senha: "123",
        tipo: "atendimento"
      }
    ],

    pacientes: [],

    triagens: [],

    consultas: [],

    tv_chamada: null,

    tv_historico: []
  };
}

// ======================================================
// LER BANCO
// ======================================================

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const banco = bancoInicial();

      writeDB(banco);

      return banco;
    }

    const conteudo = fs.readFileSync(
      DB_FILE,
      "utf8"
    );

    if (!conteudo.trim()) {
      const banco = bancoInicial();

      writeDB(banco);

      return banco;
    }

    const db = JSON.parse(conteudo);

    db.usuarios =
      Array.isArray(db.usuarios)
        ? db.usuarios
        : bancoInicial().usuarios;

    db.pacientes =
      Array.isArray(db.pacientes)
        ? db.pacientes
        : [];

    db.triagens =
      Array.isArray(db.triagens)
        ? db.triagens
        : [];

    db.consultas =
      Array.isArray(db.consultas)
        ? db.consultas
        : [];

    if (!("tv_chamada" in db)) {
      db.tv_chamada = null;
    }

    db.tv_historico =
      Array.isArray(db.tv_historico)
        ? db.tv_historico
        : [];

    return db;

  } catch (erro) {
    console.error(
      "❌ Erro ao ler banco:",
      erro
    );

    throw erro;
  }
}

// ======================================================
// SALVAR BANCO
// ======================================================

function writeDB(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(
      data,
      null,
      2
    ),
    "utf8"
  );
}

// ======================================================
// FUNÇÃO AUXILIAR
// ======================================================

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

// ======================================================
// CLASSIFICAÇÃO DE RISCO
// ======================================================

function classificarRisco(
  sintoma,
  temperatura
) {
  const temp = Number(temperatura);

  const sintomasVermelhos = [
    "infarto",
    "avc",
    "convulsao",
    "convulsão",
    "hemorragia",
    "falta_ar_grave",
    "falta de ar grave"
  ];

  const sintomasAmarelos = [
    "febre",
    "vomito",
    "vômito",
    "diarreia",
    "falta_ar_moderada",
    "falta de ar moderada"
  ];

  const sintomaNormalizado =
    normalizarTexto(sintoma);

  if (temp >= 39) {
    return "vermelho";
  }

  if (
    sintomasVermelhos.includes(
      sintomaNormalizado
    )
  ) {
    return "vermelho";
  }

  if (temp >= 38) {
    return "amarelo";
  }

  if (
    sintomasAmarelos.includes(
      sintomaNormalizado
    )
  ) {
    return "amarelo";
  }

  return "verde";
}

// ======================================================
// PÁGINA INICIAL
// ======================================================

app.get(
  "/",
  (req, res) => {
    const indexPath = path.join(
      FRONTEND_DIR,
      "index.html"
    );

    if (!fs.existsSync(indexPath)) {
      return res
        .status(404)
        .send(`
          <h1>Sentinela</h1>
          <p>index.html não encontrado.</p>
          <p>Caminho procurado:</p>
          <code>${indexPath}</code>
        `);
    }

    res.sendFile(indexPath);
  }
);

// ======================================================
// PÁGINA - ATENDIMENTO
// ======================================================

app.get(
  "/atendimento.html",
  (req, res) => {
    res.sendFile(
      path.join(
        FRONTEND_DIR,
        "atendimento.html"
      )
    );
  }
);

// ======================================================
// PÁGINA - TRIAGEM
// ======================================================

app.get(
  "/triagem.html",
  (req, res) => {
    res.sendFile(
      path.join(
        FRONTEND_DIR,
        "triagem.html"
      )
    );
  }
);

// ======================================================
// PÁGINA - MÉDICO
// ======================================================

app.get(
  "/medico.html",
  (req, res) => {
    res.sendFile(
      path.join(
        FRONTEND_DIR,
        "medico.html"
      )
    );
  }
);

// ======================================================
// PÁGINA - MEDICAÇÕES
// ======================================================

app.get(
  "/medicacoes.html",
  (req, res) => {
    res.sendFile(
      path.join(
        FRONTEND_DIR,
        "medicacoes.html"
      )
    );
  }
);

// ======================================================
// PÁGINA - TV
// ======================================================

app.get(
  "/tv.html",
  (req, res) => {
    res.sendFile(
      path.join(
        FRONTEND_DIR,
        "tv.html"
      )
    );
  }
);

// ======================================================
// LOGIN
// ======================================================

app.post(
  "/login",
  (req, res) => {
    try {
      const db = readDB();

      const usuario = String(
        req.body.usuario || ""
      ).trim();

      const senha = String(
        req.body.senha || ""
      ).trim();

      const user = db.usuarios.find(
        u =>
          u.usuario === usuario &&
          u.senha === senha
      );

      if (!user) {
        return res
          .status(401)
          .json({
            sucesso: false,
            erro: "Login inválido"
          });
      }

      res.json({
        sucesso: true,
        usuario: user,
        tipo: user.tipo
      });

    } catch (erro) {
      console.error(
        "❌ Erro no login:",
        erro
      );

      res
        .status(500)
        .json({
          sucesso: false,
          erro: "Erro interno no login"
        });
    }
  }
);

// ======================================================
// ATENDIMENTO
// CADASTRAR PACIENTE
// ======================================================

app.post(
  "/atendimento",
  (req, res) => {
    try {
      const db = readDB();

      const nome = String(
        req.body.nome || ""
      ).trim();

      const cpf = String(
        req.body.cpf || ""
      ).trim();

      const tipo = String(
        req.body.tipo || "Particular"
      ).trim();

      if (!nome) {
        return res
          .status(400)
          .json({
            erro:
              "Nome do paciente é obrigatório"
          });
      }

      const paciente = {
        id: Date.now(),
        nome,
        cpf,
        tipo,
        status: "triagem",
        createdAt:
          new Date().toISOString()
      };

      db.pacientes.push(paciente);

      writeDB(db);

      res
        .status(201)
        .json({
          sucesso: true,
          paciente
        });

    } catch (erro) {
      console.error(
        "❌ Erro no atendimento:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao cadastrar paciente"
        });
    }
  }
);

// ======================================================
// LISTAR PACIENTES
// ======================================================

app.get(
  "/pacientes",
  (req, res) => {
    try {
      const db = readDB();

      res.json(db.pacientes);

    } catch (erro) {
      console.error(
        "❌ Erro ao buscar pacientes:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao buscar pacientes"
        });
    }
  }
);

// ======================================================
// PACIENTES AGUARDANDO TRIAGEM
// ======================================================

app.get(
  "/pacientes/triagem",
  (req, res) => {
    try {
      const db = readDB();

      const pacientes =
        db.pacientes.filter(
          p =>
            p.status === "triagem"
        );

      res.json(pacientes);

    } catch (erro) {
      console.error(
        "❌ Erro:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao buscar fila de triagem"
        });
    }
  }
);

// ======================================================
// TRIAGEM
// ======================================================

app.post(
  "/triagem",
  (req, res) => {
    try {
      const db = readDB();

      const nome = String(
        req.body.nome || ""
      ).trim();

      const sintoma = String(
        req.body.sintoma || ""
      ).trim();

      const temperatura = Number(
        req.body.temperatura
      );

      const alergia = String(
        req.body.alergia || ""
      ).trim();

      const observacao = String(
        req.body.observacao || ""
      ).trim();

      const pacienteId =
        req.body.pacienteId || null;

      const cpf = String(
        req.body.cpf || ""
      ).trim();

      if (!nome) {
        return res
          .status(400)
          .json({
            erro:
              "Nome do paciente é obrigatório"
          });
      }

      if (!sintoma) {
        return res
          .status(400)
          .json({
            erro:
              "Sintoma é obrigatório"
          });
      }

      if (
        Number.isNaN(temperatura) ||
        temperatura <= 0
      ) {
        return res
          .status(400)
          .json({
            erro:
              "Temperatura inválida"
          });
      }

      const risco =
        classificarRisco(
          sintoma,
          temperatura
        );

      const triagem = {
        id: Date.now(),
        pacienteId,
        nome,
        sintoma,
        temperatura,
        alergia,
        observacao,
        risco,
        status:
          "aguardando_medico",
        createdAt:
          new Date().toISOString()
      };

      db.triagens.push(triagem);

      let paciente = null;

      if (pacienteId) {
        paciente =
          db.pacientes.find(
            p =>
              String(p.id) ===
              String(pacienteId)
          );
      }

      if (!paciente && cpf) {
        paciente =
          db.pacientes.find(
            p =>
              String(p.cpf) === cpf
          );
      }

      if (!paciente) {
        paciente =
          db.pacientes.find(
            p =>
              normalizarTexto(
                p.nome
              ) ===
              normalizarTexto(
                nome
              ) &&
              p.status === "triagem"
          );
      }

      if (paciente) {
        paciente.status =
          "aguardando_medico";

        paciente.risco = risco;

        paciente.triagemId =
          triagem.id;
      }

      writeDB(db);

      res
        .status(201)
        .json({
          sucesso: true,
          triagem,
          paciente:
            paciente || null
        });

    } catch (erro) {
      console.error(
        "❌ Erro na triagem:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao salvar triagem"
        });
    }
  }
);

// ======================================================
// LISTAR TRIAGENS
// ======================================================

app.get(
  "/triagens",
  (req, res) => {
    try {
      const db = readDB();

      res.json(db.triagens);

    } catch (erro) {
      console.error(
        "❌ Erro:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao buscar triagens"
        });
    }
  }
);

// ======================================================
// TRIAGENS AGUARDANDO MÉDICO
// ======================================================

app.get(
  "/triagens/aguardando",
  (req, res) => {
    try {
      const db = readDB();

      const fila =
        db.triagens.filter(
          t =>
            t.status ===
            "aguardando_medico"
        );

      res.json(fila);

    } catch (erro) {
      console.error(
        "❌ Erro:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao buscar fila médica"
        });
    }
  }
);

// ======================================================
// TV - CHAMAR PACIENTE
// ======================================================

app.post(
  "/tv/chamar",
  (req, res) => {
    try {
      const db = readDB();

      const paciente = String(
        req.body.paciente || ""
      ).trim();

      const localTipo = String(
        req.body.localTipo ||
        "GUICHÊ"
      ).trim();

      const localNumero = String(
        req.body.localNumero ||
        "01"
      ).trim();

      if (!paciente) {
        return res
          .status(400)
          .json({
            erro:
              "Nome do paciente é obrigatório"
          });
      }

      const chamada = {
        id: Date.now().toString(),

        localTipo,

        localNumero,

        paciente,

        hora:
          new Date().toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          ),

        createdAt:
          new Date().toISOString()
      };

      db.tv_chamada = chamada;

      db.tv_historico.unshift(
        chamada
      );

      db.tv_historico =
        db.tv_historico.slice(
          0,
          5
        );

      writeDB(db);

      res.json({
        sucesso: true,
        chamada
      });

    } catch (erro) {
      console.error(
        "❌ Erro na TV:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao chamar paciente na TV"
        });
    }
  }
);

// ======================================================
// TV - CONSULTAR CHAMADA
// ======================================================

app.get(
  "/tv/chamada",
  (req, res) => {
    try {
      const db = readDB();

      res.json({
        chamada:
          db.tv_chamada,

        historico:
          db.tv_historico
      });

    } catch (erro) {
      console.error(
        "❌ Erro:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao consultar TV"
        });
    }
  }
);

// ======================================================
// TV - LIMPAR CHAMADA
// ======================================================

app.post(
  "/tv/limpar",
  (req, res) => {
    try {
      const db = readDB();

      db.tv_chamada = null;

      writeDB(db);

      res.json({
        sucesso: true
      });

    } catch (erro) {
      console.error(
        "❌ Erro:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao limpar chamada"
        });
    }
  }
);

// ======================================================
// LISTA DE MEDICAÇÕES
// ======================================================

app.get(
  "/lista-medicacoes",
  (req, res) => {
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
  }
);

// ======================================================
// CONSULTA MÉDICA
// ======================================================

app.post(
  "/consulta",
  (req, res) => {
    try {
      const db = readDB();

      const paciente = String(
        req.body.paciente || ""
      ).trim();

      const diagnostico = String(
        req.body.diagnostico || ""
      ).trim();

      const medicacao = String(
        req.body.medicacao || ""
      ).trim();

      const obs = String(
        req.body.obs || ""
      ).trim();

      if (!paciente) {
        return res
          .status(400)
          .json({
            erro:
              "Paciente é obrigatório"
          });
      }

      const consulta = {
        id: Date.now(),

        paciente,

        diagnostico,

        medicacao,

        obs,

        status: "finalizada",

        createdAt:
          new Date().toISOString()
      };

      db.consultas.push(
        consulta
      );

      const pacienteEncontrado =
        db.pacientes.find(
          p =>
            normalizarTexto(
              p.nome
            ) ===
            normalizarTexto(
              paciente
            )
        );

      if (pacienteEncontrado) {
        pacienteEncontrado.status =
          "finalizado";

        pacienteEncontrado.consultaId =
          consulta.id;
      }

      const triagemEncontrada =
        db.triagens.find(
          t =>
            normalizarTexto(
              t.nome
            ) ===
            normalizarTexto(
              paciente
            ) &&
            t.status ===
            "aguardando_medico"
        );

      if (triagemEncontrada) {
        triagemEncontrada.status =
          "atendido";

        triagemEncontrada.consultaId =
          consulta.id;
      }

      writeDB(db);

      res
        .status(201)
        .json({
          sucesso: true,
          consulta
        });

    } catch (erro) {
      console.error(
        "❌ Erro na consulta:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao salvar consulta"
        });
    }
  }
);

// ======================================================
// LISTAR CONSULTAS
// ======================================================

app.get(
  "/consultas",
  (req, res) => {
    try {
      const db = readDB();

      res.json(db.consultas);

    } catch (erro) {
      console.error(
        "❌ Erro:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao buscar consultas"
        });
    }
  }
);

// ======================================================
// COMPATIBILIDADE
// ======================================================

app.get(
  "/medicacoes",
  (req, res) => {
    try {
      const db = readDB();

      res.json(db.consultas);

    } catch (erro) {
      console.error(
        "❌ Erro:",
        erro
      );

      res
        .status(500)
        .json({
          erro:
            "Erro ao buscar consultas"
        });
    }
  }
);

// ======================================================
// STATUS DO SERVIDOR
// ======================================================

app.get(
  "/status",
  (req, res) => {
    res.json({
      online: true,

      sistema:
        "Sentinela - Sistema Hospitalar",

      servidor:
        "Node.js + Express",

      porta: PORT,

      horario:
        new Date().toISOString()
    });
  }
);

// ======================================================
// ROTA NÃO ENCONTRADA
// ======================================================

app.use(
  (req, res) => {
    res
      .status(404)
      .json({
        erro:
          "Rota não encontrada",

        rota:
          req.originalUrl,

        metodo:
          req.method
      });
  }
);

// ======================================================
// TRATAMENTO DE ERROS
// ======================================================

app.use(
  (
    erro,
    req,
    res,
    next
  ) => {
    console.error(
      "❌ Erro interno:",
      erro
    );

    res
      .status(500)
      .json({
        erro:
          "Erro interno do servidor"
      });
  }
);

// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log("");

    console.log(
      "✅ Servidor iniciado com sucesso!"
    );

    console.log(
      `🌐 Servidor rodando na porta ${PORT}`
    );

    console.log("");
  }
);
