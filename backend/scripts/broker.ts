import Aedes from 'aedes';
import { createServer } from 'net';

const PORT = 1883;
const aedes = new Aedes();
const server = createServer(aedes.handle);

server.listen(PORT, function () {
    console.log(`MQTT Broker started and listening on port ${PORT}`);
});
