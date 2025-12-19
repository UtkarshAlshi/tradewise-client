const { Client } = require('@stomp/stompjs');
const SockJS = require('sockjs-client');

const token = process.argv[2];
if(!token) { console.error('token required'); process.exit(2); }

const client = new Client({
  webSocketFactory: () => new SockJS(`http://localhost:8000/ws?token=${encodeURIComponent(token)}`),
  reconnectDelay: 0,
  debug: (str) => { console.log('[STOMP]', str); }
});

client.onConnect = function(frame) {
  console.log('STOMP connected');
  client.subscribe('/topic/prices/AAPL', function(message) {
    console.log('Received STOMP message:', message.body);
    client.deactivate();
    process.exit(0);
  });
};

client.onStompError = function(frame) {
  console.error('Broker reported error:', frame);
  process.exit(2);
};

client.activate();

setTimeout(() => { console.error('No message received within timeout'); process.exit(3); }, 15000);
