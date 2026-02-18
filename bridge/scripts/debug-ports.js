import { SerialPort } from 'serialport';

async function listPorts() {
    try {
        const ports = await SerialPort.list();
        console.log("All detected ports:");
        console.log(JSON.stringify(ports, null, 2));
    } catch (err) {
        console.error("Error listing ports:", err);
    }
}

listPorts();
