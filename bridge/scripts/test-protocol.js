import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8765';
const HTTP_URL = 'http://localhost:8765';

const LED_PIN = 13;
const SENSOR_PIN = 'A0'; // or 14 for Uno A0

console.log('🚀 Starting Protocol Test Script...');

// 1. Health Check
async function checkHealth() {
    try {
        const res = await fetch(`${HTTP_URL}/health`);
        const data = await res.json();
        console.log('✅ Health Check:', data);
        return data.board && data.board.connected;
    } catch (e) {
        console.error('❌ Health Check Failed:', e.message);
        return false;
    }
}

// 2. WebSocket Test
function runWsTest() {
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
        console.log('✅ WebSocket Connected');

        // Test LED Blink
        console.log(`💡 Testing Digital Write on Pin ${LED_PIN}...`);
        ws.send(JSON.stringify({
            cmd: 'digitalWrite',
            pin: LED_PIN,
            value: 1
        }));

        setTimeout(() => {
            ws.send(JSON.stringify({
                cmd: 'digitalWrite',
                pin: LED_PIN,
                value: 0
            }));
            console.log('💡 LED OFF');
        }, 1000);

        // Test Streaming
        console.log(`📡 Testing Sensor Stream on Pin ${SENSOR_PIN}...`);
        ws.send(JSON.stringify({
            cmd: 'startStream',
            pin: SENSOR_PIN,
            interval: 200
        }));

        // Stop after 3 seconds
        setTimeout(() => {
            console.log('🛑 Stopping Stream...');
            ws.send(JSON.stringify({
                cmd: 'stopStream',
                pin: SENSOR_PIN
            }));
            ws.close();
            console.log('✅ Test Complete');
        }, 3000);
    });

    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'stream') {
            console.log(`📊 Stream Data [${msg.pin}]: ${msg.value}`);
        } else if (msg.type === 'error') {
            console.error('❌ Error Message:', msg);
        } else {
            console.log('📩 Message:', msg);
        }
    });

    ws.on('error', (e) => {
        console.error('❌ WebSocket Error:', e.message);
    });
}

(async () => {
    const isHealthy = await checkHealth();
    if (isHealthy) {
        runWsTest();
    } else {
        console.warn('⚠️ Board not connected according to health check. Trying WS anyway...');
        runWsTest();
    }
})();
