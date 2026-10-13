const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite requisições do seu GitHub Pages e localhost
    methods: ["GET", "POST"]
  }
});

// Lista em memória dos alertas recentes (últimas 24h)
let communityAlerts = [];

// Rota simples para verificar se a API está online
app.get('/', (req, res) => {
  res.send('Servidor do Daniel (Tempo Real) rodando perfeitamente!');
});

io.on('connection', (socket) => {
  console.log('Cliente conectado ao Socket:', socket.id);

  // Envia o histórico existente ao novo usuário que abriu o app
  socket.emit('load_initial_alerts', communityAlerts);

  // Recebe um novo alerta enviado por um usuário
  socket.on('send_community_alert', (data) => {
    const alertItem = {
      id: Date.now(),
      beachKey: data.beachKey,
      beachName: data.beachName,
      type: data.type, // 'shark', 'drowning', 'warning'
      description: data.description,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    // Salva no histórico do servidor (limitado aos últimos 50 alertas)
    communityAlerts.unshift(alertItem);
    if (communityAlerts.length > 50) communityAlerts.pop();

    // Transmite instantaneamente para TODOS os usuários conectados
    io.emit('new_community_alert', alertItem);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});