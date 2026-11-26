const connectionStatus = document.querySelector('#status');
const requestForm = document.querySelector('#request-form');
const messageInput = document.querySelector('#message');
const sendButton = requestForm.querySelector('button');
const reply = document.querySelector('#reply');

const socket = io({ transports: ['websocket'] });

socket.on('confirm connection', (message) => {
  connectionStatus.textContent = message;
  sendButton.disabled = false;
});

socket.on('disconnect', () => {
  connectionStatus.textContent = 'Disconnected. Reconnecting…';
  sendButton.disabled = true;
  reply.textContent = '';
});

socket.on('connect_error', () => {
  connectionStatus.textContent = 'Connection failed. Retrying…';
});

socket.on('response', (message) => {
  reply.textContent = message;
});

requestForm.addEventListener('submit', (event) => {
  event.preventDefault();
  reply.textContent = 'Waiting for the server…';
  socket.emit('request', messageInput.value);
});
