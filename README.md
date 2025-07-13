# Backend API - Sistema de Giro de Sala Cirúrgica

Backend serverless para o Sistema de Giro de Sala Cirúrgica, configurado para deploy na Vercel Functions.

## 🚀 Tecnologias

- **Node.js** + **Express.js**
- **SQLite** (banco de dados)
- **JWT** (autenticação)
- **Vercel Functions** (serverless)
- **bcryptjs** (hash de senhas)

## 📁 Estrutura do Projeto

```
giro-backend-vercel/
├── api/                    # Vercel Functions
│   ├── auth/
│   │   └── login.js       # Autenticação de usuários
│   ├── relatorios/
│   │   ├── index.js       # Dados dos relatórios
│   │   └── exportar-csv.js # Exportação CSV
│   ├── salas.js           # Gestão de salas e giros
│   └── health.js          # Health check
├── lib/                   # Módulos compartilhados
│   ├── database.js        # Configuração do SQLite
│   └── auth.js            # Utilitários de autenticação
├── data/                  # Banco de dados local (dev)
├── package.json           # Dependências
├── vercel.json            # Configuração da Vercel
└── README.md              # Este arquivo
```

## 🔗 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login do usuário

### Salas
- `GET /api/salas` - Listar todas as salas
- `POST /api/salas` - Operações nas salas (ocupar, iniciar giro, etc.)

### Relatórios
- `GET /api/relatorios` - Obter dados dos relatórios
- `GET /api/relatorios/exportar-csv` - Exportar dados em CSV

### Health Check
- `GET /api/health` - Verificar status da API

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- NPM ou Yarn
- Vercel CLI (opcional)

### Instalação
```bash
# Clone o repositório
git clone <seu-repositorio>
cd giro-backend-vercel

# Instale as dependências
npm install

# Execute localmente
npm run dev
# ou
vercel dev
```

### Teste Local
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","senha":"admin123"}'
```

## 🌐 Deploy na Vercel

### Passo 1: Preparar Repositório
1. Crie um repositório no GitHub
2. Faça upload destes arquivos
3. Commit e push

### Passo 2: Deploy na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Conecte com GitHub
3. Importe o repositório
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** (deixe vazio)
   - **Output Directory:** (deixe vazio)

### Passo 3: Variáveis de Ambiente (Opcional)
```bash
JWT_SECRET=seu-secret-super-seguro-aqui
NODE_ENV=production
TZ=America/Sao_Paulo
```

## 🔧 Configuração

### CORS
O CORS está configurado para aceitar requisições de qualquer origem (`*`). Para produção, recomenda-se especificar os domínios:

```javascript
// Em vercel.json
"headers": [
  {
    "source": "/api/(.*)",
    "headers": [
      {
        "key": "Access-Control-Allow-Origin",
        "value": "https://seu-frontend.vercel.app"
      }
    ]
  }
]
```

### Banco de Dados
- **Desenvolvimento:** SQLite local em `data/database.sqlite`
- **Produção:** SQLite em `/tmp/database.sqlite` (Vercel)

⚠️ **Importante:** Na Vercel, o banco é recriado a cada deploy. Para produção real, considere usar:
- **PostgreSQL** (Vercel Postgres)
- **MySQL** (PlanetScale)
- **MongoDB** (MongoDB Atlas)

## 📊 Dados Iniciais

O sistema cria automaticamente:

### Usuários
- **Admin:** admin@hospital.com / admin123
- **Operador:** joao@hospital.com / admin123

### Salas
- 10 salas (Sala 01 a Sala 10)
- Todas inicialmente com status "livre"

## 🔐 Autenticação

### JWT Token
- **Expiração:** 24 horas
- **Secret:** Configurável via variável de ambiente
- **Payload:** userId, email, tipo

### Exemplo de Uso
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@hospital.com', senha: 'admin123' })
});

const { token } = await response.json();

// Usar token em requisições autenticadas
const salas = await fetch('/api/salas', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se os headers estão configurados corretamente
- Confirme que o frontend está fazendo requisições para a URL correta

### Banco de Dados
- Em desenvolvimento, o banco fica em `data/database.sqlite`
- Na Vercel, é recriado a cada deploy (dados temporários)

### Logs
- Na Vercel: Functions > View Function Logs
- Local: Console do terminal

## 📈 Monitoramento

### Health Check
```bash
curl https://seu-backend.vercel.app/api/health
```

### Logs da Vercel
1. Acesse o dashboard da Vercel
2. Vá em Functions
3. Clique em "View Function Logs"

## 🔄 Atualizações

Para atualizar o backend:
1. Faça as alterações no código
2. Commit e push para o GitHub
3. A Vercel fará deploy automaticamente

## 📞 Suporte

Para problemas específicos:
1. Verifique os logs da Vercel
2. Teste localmente com `vercel dev`
3. Abra uma issue no repositório

---

**🎯 Backend configurado para alta disponibilidade e escalabilidade na Vercel!**

