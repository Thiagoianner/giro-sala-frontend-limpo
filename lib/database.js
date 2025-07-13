const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuração do banco de dados
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : path.join(__dirname, '../data/database.sqlite');

let db = null;

// Função para inicializar o banco de dados
function initDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar com o banco de dados:', err);
        return reject(err);
      }
      
      console.log('Conectado ao banco de dados SQLite!');
      
      // Criar tabelas se não existirem
      createTables()
        .then(() => {
          console.log('Banco de dados inicializado com sucesso!');
          resolve(db);
        })
        .catch(reject);
    });
  });
}

// Função para criar tabelas
function createTables() {
  return new Promise((resolve, reject) => {
    const queries = [
      // Tabela de usuários
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT DEFAULT 'operador',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabela de salas
      `CREATE TABLE IF NOT EXISTS salas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL,
        status TEXT DEFAULT 'livre',
        ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabela de giros
      `CREATE TABLE IF NOT EXISTS giros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sala_id INTEGER,
        usuario_id INTEGER,
        data_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_fim DATETIME,
        status TEXT DEFAULT 'em_andamento',
        tempo_total INTEGER,
        tempo_desmontagem INTEGER,
        tempo_limpeza INTEGER,
        tempo_montagem INTEGER,
        etapa_atual TEXT DEFAULT 'desmontagem',
        FOREIGN KEY (sala_id) REFERENCES salas (id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`
    ];

    let completed = 0;
    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          console.error(`Erro ao criar tabela ${index + 1}:`, err);
          return reject(err);
        }
        
        completed++;
        if (completed === queries.length) {
          // Inserir dados iniciais
          insertInitialData()
            .then(resolve)
            .catch(reject);
        }
      });
    });
  });
}

// Função para inserir dados iniciais
function insertInitialData() {
  return new Promise((resolve, reject) => {
    // Verificar se já existem usuários
    db.get('SELECT COUNT(*) as count FROM usuarios', (err, row) => {
      if (err) {
        return reject(err);
      }
      
      if (row.count > 0) {
        return resolve(); // Dados já existem
      }
      
      // Inserir usuários padrão
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      const insertUsers = `
        INSERT INTO usuarios (nome, email, senha, tipo) VALUES 
        ('Administrador', 'admin@hospital.com', ?, 'admin'),
        ('João Silva', 'joao@hospital.com', ?, 'operador')
      `;
      
      db.run(insertUsers, [hashedPassword, hashedPassword], (err) => {
        if (err) {
          return reject(err);
        }
        
        // Inserir salas padrão
        const insertSalas = `
          INSERT INTO salas (numero, status) VALUES 
          ('Sala 01', 'livre'), ('Sala 02', 'livre'), ('Sala 03', 'livre'),
          ('Sala 04', 'livre'), ('Sala 05', 'livre'), ('Sala 06', 'livre'),
          ('Sala 07', 'livre'), ('Sala 08', 'livre'), ('Sala 09', 'livre'),
          ('Sala 10', 'livre')
        `;
        
        db.run(insertSalas, (err) => {
          if (err) {
            return reject(err);
          }
          
          console.log('Dados iniciais inseridos com sucesso!');
          resolve();
        });
      });
    });
  });
}

// Função para obter instância do banco
function getDatabase() {
  if (!db) {
    throw new Error('Banco de dados não inicializado. Chame initDatabase() primeiro.');
  }
  return db;
}

module.exports = {
  initDatabase,
  getDatabase
};

