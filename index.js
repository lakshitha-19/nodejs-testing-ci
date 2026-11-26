const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 9000;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.emit('confirm connection', 'Connected...');

  socket.on('request', (message) => {
    console.log('Request received:', message);
    socket.emit('response', 'Hello from the server');
  });

  socket.on('send message', (message) => {
    if (typeof message !== 'string' || !message.trim()) {
      return;
    }

    socket.broadcast.emit('receive message', message.trim());
  });
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
  });
}

module.exports = { server, io };
