const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'giro-de-sala-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    req.user = user;
    next();
  });
}

// Gerar token JWT
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      tipo: user.tipo 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verificar senha
function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

// Hash da senha
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

module.exports = {
  authenticateToken,
  generateToken,
  verifyPassword,
  hashPassword
};

