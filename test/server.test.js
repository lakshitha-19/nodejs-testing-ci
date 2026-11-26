const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const { io: connect } = require('socket.io-client');
const { server, io } = require('../index');

let origin;

before(async () => {
  const listening = once(server, 'listening');
  server.listen(0, '127.0.0.1');
  await listening;
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await io.close();
});

async function connectClient(t) {
  const socket = connect(origin, { autoConnect: false, transports: ['websocket'] });
  t.after(() => socket.disconnect());
  const confirmation = once(socket, 'confirm connection', { signal: t.signal });
  socket.connect();
  assert.deepEqual(await confirmation, ['Connected...']);
  return socket;
}

test('serves the message board and its assets', async () => {
  const page = await fetch(origin + '/board.html');
  assert.equal(page.status, 200);
  const html = await page.text();
  for (const id of ['msg', 'send', 'board']) {
    assert.ok(html.includes(`id="${id}"`));
  }

  for (const path of ['/board.js', '/board.css']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    await response.text();
  }
});

test('confirms connections and replies to requests', { timeout: 5000 }, async (t) => {
  const socket = await connectClient(t);
  const response = once(socket, 'response', { signal: t.signal });
  socket.emit('request', 'Hello from the client');
  assert.deepEqual(await response, ['Hello from the server']);
});

test('broadcasts to other clients without echoing to the sender', { timeout: 5000 }, async (t) => {
  const [sender, firstReader, secondReader] = await Promise.all([
    connectClient(t),
    connectClient(t),
    connectClient(t),
  ]);
  const echoes = [];
  sender.on('receive message', (message) => echoes.push(message));
  const firstDelivery = once(firstReader, 'receive message', { signal: t.signal });
  const secondDelivery = once(secondReader, 'receive message', { signal: t.signal });
  const senderResponse = once(sender, 'response', { signal: t.signal });

  sender.emit('send message', 'Hello board');
  sender.emit('request', 'Check delivery order');

  assert.deepEqual(await Promise.all([firstDelivery, secondDelivery, senderResponse]), [
    ['Hello board'],
    ['Hello board'],
    ['Hello from the server'],
  ]);
  assert.deepEqual(echoes, []);
});
