const { initDatabase, getDatabase } = require('../../lib/database');

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

  // Apenas GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Inicializar banco de dados
    await initDatabase();
    const db = getDatabase();

    // Buscar estatísticas resumidas
    db.get(
      `SELECT 
         COUNT(*) as total_giros,
         COUNT(CASE WHEN status = 'concluido' THEN 1 END) as giros_concluidos,
         COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
         AVG(CASE WHEN tempo_total > 0 THEN tempo_total END) as tempo_medio
       FROM giros`,
      (err, stats) => {
        if (err) {
          console.error('Erro ao buscar estatísticas:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        // Buscar dados detalhados dos giros
        db.all(
          `SELECT 
             g.*,
             s.numero as sala_numero,
             u.nome as usuario_nome
           FROM giros g
           LEFT JOIN salas s ON g.sala_id = s.id
           LEFT JOIN usuarios u ON g.usuario_id = u.id
           ORDER BY g.data_inicio DESC
           LIMIT 100`,
          (err, giros) => {
            if (err) {
              console.error('Erro ao buscar giros:', err);
              return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            // Formatar dados
            const girosFormatados = giros.map(giro => ({
              id: giro.id,
              sala: giro.sala_numero,
              usuario: giro.usuario_nome,
              data_inicio: giro.data_inicio,
              data_fim: giro.data_fim,
              status: giro.status,
              etapa_atual: giro.etapa_atual,
              tempos: {
                total: giro.tempo_total || 0,
                desmontagem: giro.tempo_desmontagem || 0,
                limpeza: giro.tempo_limpeza || 0,
                montagem: giro.tempo_montagem || 0
              }
            }));

            res.json({
              estatisticas: {
                total_giros: stats.total_giros || 0,
                giros_concluidos: stats.giros_concluidos || 0,
                em_andamento: stats.em_andamento || 0,
                tempo_medio: stats.tempo_medio || 0
              },
              giros: girosFormatados
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Erro na API de relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

