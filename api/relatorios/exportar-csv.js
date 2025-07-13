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

    // Buscar dados dos giros para exportação
    db.all(
      `SELECT 
         g.*,
         s.numero as sala_numero,
         u.nome as usuario_nome
       FROM giros g
       LEFT JOIN salas s ON g.sala_id = s.id
       LEFT JOIN usuarios u ON g.usuario_id = u.id
       WHERE g.status = 'concluido'
       ORDER BY g.data_inicio DESC`,
      (err, giros) => {
        if (err) {
          console.error('Erro ao buscar dados para CSV:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        // Gerar CSV
        let csv = 'Sala,Data/Hora Início,Data/Hora Fim,Tempo Total (min),Desmontagem (min),Limpeza (min),Montagem (min),Status,Usuário\n';
        
        giros.forEach(giro => {
          const tempoTotal = giro.tempo_total ? (giro.tempo_total / 60).toFixed(2) : '0.00';
          const tempoDesmontagem = giro.tempo_desmontagem ? (giro.tempo_desmontagem / 60).toFixed(2) : '0.00';
          const tempoLimpeza = giro.tempo_limpeza ? (giro.tempo_limpeza / 60).toFixed(2) : '0.00';
          const tempoMontagem = giro.tempo_montagem ? (giro.tempo_montagem / 60).toFixed(2) : '0.00';
          
          const dataInicio = new Date(giro.data_inicio).toLocaleString('pt-BR');
          const dataFim = giro.data_fim ? new Date(giro.data_fim).toLocaleString('pt-BR') : '';
          
          csv += `"${giro.sala_numero}","${dataInicio}","${dataFim}","${tempoTotal}","${tempoDesmontagem}","${tempoLimpeza}","${tempoMontagem}","${giro.status}","${giro.usuario_nome || ''}"\n`;
        });

        // Configurar headers para download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_giros_${new Date().toISOString().split('T')[0]}.csv"`);
        
        // Adicionar BOM para UTF-8 (para Excel reconhecer acentos)
        res.write('\uFEFF');
        res.end(csv);
      }
    );
  } catch (error) {
    console.error('Erro na exportação CSV:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

