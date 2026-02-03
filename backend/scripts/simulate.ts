import * as mqtt from 'mqtt';
import { config } from '../src/config';

const MQTT_URL = config.mqttUrl;
console.log(`Simulator connecting to ${MQTT_URL}...`);

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
    console.log('Simulator Connected!');
    startSimulation();
});

client.on('error', (err) => {
    console.error('Simulator MQTT Error:', err);
});

function startSimulation() {
    const machines = ['A', 'B', 'C'];

    setInterval(() => {
        const randomMachine = machines[Math.floor(Math.random() * machines.length)];
        const randomScrapIndex = Math.floor(Math.random() * 3) + 1;

        const payload = {
            machineId: randomMachine,
            scrapIndex: randomScrapIndex,
            value: Math.floor(Math.random() * 5) + 1,
            timestamp: new Date().toISOString()
        };

        const topic = `machines/${randomMachine}/scrap`;
        client.publish(topic, JSON.stringify(payload));

    }, 1000);
}
