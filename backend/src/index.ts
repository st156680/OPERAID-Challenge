import { createServer } from 'http';
import { Server } from 'socket.io';
import * as mqtt from 'mqtt';
import Aedes from 'aedes';
import { createServer as createNetServer } from 'net';
import { ScrapAggregator } from './services/aggregator';

const PORT_WEB = 3000;
const PORT_MQTT = 1883;

// --- 1. Setup Embedded MQTT Broker (Aedes) ---
const aedes = new Aedes();
const mqttServer = createNetServer(aedes.handle);

mqttServer.listen(PORT_MQTT, () => {
  console.log(`📡 MQTT Broker running on port ${PORT_MQTT}`);
  startSimulator(); // Start generating dummy data once broker is up
});

// --- 2. Setup HTTP & WebSocket Server ---
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" } // Allow Angular dev server
});

// --- 3. Business Logic ---
const aggregator = new ScrapAggregator();

// Connect internal MQTT Client to our own broker
const mqttClient = mqtt.connect(`mqtt://localhost:${PORT_MQTT}`);

mqttClient.on('connect', () => {
  console.log('✅ Internal Client connected to MQTT Broker');
  mqttClient.subscribe('machines/+/scrap');
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    
    // Process Data
    const result = aggregator.addData(
      payload.machineId,
      payload.scrapIndex,
      payload.value,
      payload.timestamp
    );

    // Push to Frontend via WebSocket
    // We emit an event per machine or a global 'update'
    io.emit('scrap_update', result);
    
  } catch (err) {
    console.error('Error processing message', err);
  }
});

// --- 4. Start Server ---
httpServer.listen(PORT_WEB, () => {
  console.log(`🚀 Backend (Socket.io) running on port ${PORT_WEB}`);
});

// --- 5. Simulator (Bonus) ---
function startSimulator() {
  const machines = ['A', 'B', 'C'];
  const client = mqtt.connect(`mqtt://localhost:${PORT_MQTT}`);

  setInterval(() => {
    const randomMachine = machines[Math.floor(Math.random() * machines.length)];
    const randomScrapIndex = Math.floor(Math.random() * 3) + 1; // Index 1, 2, or 3
    
    const payload = {
      machineId: randomMachine,
      scrapIndex: randomScrapIndex,
      value: Math.floor(Math.random() * 5) + 1, // Value 1-5
      timestamp: new Date().toISOString()
    };

    client.publish(`machines/${randomMachine}/scrap`, JSON.stringify(payload));
  }, 1000); // New message every second
}