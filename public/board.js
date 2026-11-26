const socket = io();
const messageInput = $('#msg');
const sendButton = $('#send');
const board = $('#board');

function appendMessage(message, classes) {
  $('<p>').addClass(classes).text(message).appendTo(board);
}

socket.on('connect', () => {
  sendButton.prop('disabled', false);
});

socket.on('disconnect', () => {
  sendButton.prop('disabled', true);
});

socket.on('receive message', (message) => {
  appendMessage(message, 'message');
});

sendButton.on('click', (event) => {
  event.preventDefault();
  const message = messageInput.val().trim();

  if (!socket.connected || !message) {
    return;
  }

  socket.emit('send message', message);
  appendMessage(message, 'message sent');
  messageInput.val('').trigger('focus');
});
