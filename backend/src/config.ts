import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
    port: process.env.PORT || 3000,
    mqttPort: parseInt(process.env.MQTT_PORT || '1883', 10),
    mqttUrl: process.env.MQTT_URL || 'mqtt://localhost:1883',
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db'
};
