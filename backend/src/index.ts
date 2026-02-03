import { createServer } from 'http';
import { Server } from 'socket.io';
import * as mqtt from 'mqtt';
import { ScrapAggregator } from './services/aggregator';
import { config } from './config';

const PORT_WEB = config.port;
const MQTT_URL = config.mqttUrl;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const aggregator = new ScrapAggregator();

console.log(`Connecting to MQTT Broker at ${MQTT_URL}...`);
const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker');
  mqttClient.subscribe('machines/+/scrap');
});

mqttClient.on('error', (err: any) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('MQTT Broker not fully ready, retrying...');
  } else {
    console.error('MQTT Connection Error:', err);
  }
});

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    const result = await aggregator.addData(
      payload.machineId,
      payload.scrapIndex,
      payload.value,
      payload.timestamp
    );

    io.emit('scrap_update', result);

  } catch (err) {
    console.error('Error processing message', err);
  }
});

httpServer.listen(PORT_WEB, () => {
  console.log(`Backend (Socket.io) running on port ${PORT_WEB}`);
});