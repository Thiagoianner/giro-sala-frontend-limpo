const { initDatabase, getDatabase } = require('../../lib/database');
const { generateToken, verifyPassword } = require('../../lib/auth');

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

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Inicializar banco de dados
    await initDatabase();
    const db = getDatabase();

    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco
    db.get(
      'SELECT * FROM usuarios WHERE email = ?',
      [email],
      (err, user) => {
        if (err) {
          console.error('Erro ao buscar usuário:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        if (!verifyPassword(senha, user.senha)) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token
        const token = generateToken(user);

        // Retornar dados do usuário (sem senha)
        const { senha: _, ...userWithoutPassword } = user;

        res.json({
          message: 'Login realizado com sucesso',
          token,
          user: userWithoutPassword
        });
      }
    );
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

