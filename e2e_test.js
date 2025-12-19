const { Client } = require('@stomp/stompjs');
const SockJS = require('sockjs-client');

const token = process.argv[2];
if(!token) { console.error('ERROR: token required'); process.exit(2); }

let messageReceived = false;
let receivedData = null;

const client = new Client({
  webSocketFactory: () => new SockJS(`http://localhost:8000/ws?token=${encodeURIComponent(token)}`),
  reconnectDelay: 0,
  debug: (str) => { /* suppress debug logs */ }
});

client.onConnect = function(frame) {
  console.log('[✓] STOMP connected to gateway');
  client.subscribe('/topic/prices/MSFT', function(message) {
    receivedData = message.body;
    console.log('[✓] Received STOMP message:', message.body);
    messageReceived = true;
    client.deactivate();
    process.exit(0);
  });
};

client.onStompError = function(frame) {
  console.error('[✗] STOMP error:', frame);
  process.exit(2);
};

client.activate();

setTimeout(() => { 
  if(!messageReceived) {
    console.error('[✗] No message received within 20 seconds');
    process.exit(3);
  }
}, 20000);
