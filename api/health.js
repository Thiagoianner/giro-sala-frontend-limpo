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
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      timezone: 'America/Sao_Paulo',
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      message: 'API do Giro de Sala está funcionando!'
    });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

