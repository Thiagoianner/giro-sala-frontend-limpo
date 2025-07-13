const { initDatabase, getDatabase } = require('../lib/database');
const { authenticateToken } = require('../lib/auth');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Tratar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Inicializar banco de dados
    await initDatabase();
    const db = getDatabase();

    // GET - Listar todas as salas
    if (req.method === 'GET') {
      db.all(
        `SELECT s.*, 
                g.id as giro_id, 
                g.etapa_atual, 
                g.data_inicio as giro_inicio,
                g.tempo_total,
                g.tempo_desmontagem,
                g.tempo_limpeza,
                g.tempo_montagem
         FROM salas s 
         LEFT JOIN giros g ON s.id = g.sala_id AND g.status = 'em_andamento'
         ORDER BY s.numero`,
        (err, salas) => {
          if (err) {
            console.error('Erro ao buscar salas:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }

          // Formatar dados das salas
          const salasFormatadas = salas.map(sala => ({
            id: sala.id,
            numero: sala.numero,
            status: sala.status,
            ultima_atualizacao: sala.ultima_atualizacao,
            giro: sala.giro_id ? {
              id: sala.giro_id,
              etapa_atual: sala.etapa_atual,
              data_inicio: sala.giro_inicio,
              tempos: {
                total: sala.tempo_total,
                desmontagem: sala.tempo_desmontagem,
                limpeza: sala.tempo_limpeza,
                montagem: sala.tempo_montagem
              }
            } : null
          }));

          res.json(salasFormatadas);
        }
      );
    }
    // POST - Operações nas salas (ocupar, iniciar giro, etc.)
    else if (req.method === 'POST') {
      // Verificar autenticação para operações POST
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
      }

      const { action, salaId, etapa } = req.body;

      if (!action || !salaId) {
        return res.status(400).json({ error: 'Ação e ID da sala são obrigatórios' });
      }

      switch (action) {
        case 'ocupar':
          db.run(
            'UPDATE salas SET status = ?, ultima_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
            ['ocupada', salaId],
            function(err) {
              if (err) {
                console.error('Erro ao ocupar sala:', err);
                return res.status(500).json({ error: 'Erro interno do servidor' });
              }
              res.json({ message: 'Sala ocupada com sucesso' });
            }
          );
          break;

        case 'iniciar_giro':
          // Atualizar status da sala
          db.run(
            'UPDATE salas SET status = ?, ultima_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
            ['em_giro', salaId],
            function(err) {
              if (err) {
                console.error('Erro ao atualizar sala:', err);
                return res.status(500).json({ error: 'Erro interno do servidor' });
              }

              // Criar novo giro
              db.run(
                'INSERT INTO giros (sala_id, usuario_id, etapa_atual) VALUES (?, ?, ?)',
                [salaId, 1, 'desmontagem'], // TODO: usar userId do token
                function(err) {
                  if (err) {
                    console.error('Erro ao criar giro:', err);
                    return res.status(500).json({ error: 'Erro interno do servidor' });
                  }
                  res.json({ message: 'Giro iniciado com sucesso', giroId: this.lastID });
                }
              );
            }
          );
          break;

        case 'avancar_etapa':
          const etapas = ['desmontagem', 'limpeza', 'montagem', 'checklist', 'liberacao', 'concluido'];
          const etapaAtualIndex = etapas.indexOf(etapa);
          const proximaEtapa = etapas[etapaAtualIndex + 1];

          if (!proximaEtapa) {
            return res.status(400).json({ error: 'Etapa inválida' });
          }

          if (proximaEtapa === 'concluido') {
            // Concluir giro
            db.run(
              `UPDATE giros SET 
                 etapa_atual = ?, 
                 status = 'concluido', 
                 data_fim = CURRENT_TIMESTAMP,
                 tempo_total = (julianday(CURRENT_TIMESTAMP) - julianday(data_inicio)) * 24 * 60 * 60
               WHERE sala_id = ? AND status = 'em_andamento'`,
              [proximaEtapa, salaId],
              function(err) {
                if (err) {
                  console.error('Erro ao concluir giro:', err);
                  return res.status(500).json({ error: 'Erro interno do servidor' });
                }

                // Liberar sala
                db.run(
                  'UPDATE salas SET status = ?, ultima_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
                  ['livre', salaId],
                  function(err) {
                    if (err) {
                      console.error('Erro ao liberar sala:', err);
                      return res.status(500).json({ error: 'Erro interno do servidor' });
                    }
                    res.json({ message: 'Giro concluído com sucesso' });
                  }
                );
              }
            );
          } else {
            // Avançar para próxima etapa
            db.run(
              'UPDATE giros SET etapa_atual = ? WHERE sala_id = ? AND status = "em_andamento"',
              [proximaEtapa, salaId],
              function(err) {
                if (err) {
                  console.error('Erro ao avançar etapa:', err);
                  return res.status(500).json({ error: 'Erro interno do servidor' });
                }
                res.json({ message: `Etapa avançada para: ${proximaEtapa}` });
              }
            );
          }
          break;

        default:
          res.status(400).json({ error: 'Ação não reconhecida' });
      }
    }
    else {
      res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API de salas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

