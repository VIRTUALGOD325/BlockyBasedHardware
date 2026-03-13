const ws = new WebSocket('ws://localhost:8991');
const wsCallbacks = {};
let wsReqId = 0;

function wsRequest(type, payload) {
    return new Promise((resolve, reject) => {
        const requestId = ++wsReqId;
        wsCallbacks[requestId] = { resolve, reject };

        const sendMsg = () => ws.send(JSON.stringify({ type, requestId, ...payload }));

        if (ws.readyState === WebSocket.OPEN) {
            sendMsg();
        } else if (ws.readyState === WebSocket.CONNECTING) {
            ws.addEventListener('open', sendMsg, { once: true });
        } else {
            reject(new Error("WebSocket is not open (state: " + ws.readyState + ")"));
        }
    });
}

function wsSendOneWay(type, payload) {
    const sendMsg = () => ws.send(JSON.stringify({ type, ...payload }));
    if (ws.readyState === WebSocket.OPEN) {
        sendMsg();
    } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener('open', sendMsg, { once: true });
    }
}

const eventListeners = {
    serialData: [],
    codeReceived: [],
    uploadStatus: []
};

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    // Handle request responses
    if (msg.requestId && wsCallbacks[msg.requestId]) {
        if (msg.type === 'ERROR') {
            wsCallbacks[msg.requestId].reject(new Error(msg.message));
        } else {
            wsCallbacks[msg.requestId].resolve(msg.type === 'PORTS' ? msg.data : msg.message || 'ok');
        }
        delete wsCallbacks[msg.requestId];
        return;
    }

    // Handle broadcast events
    switch (msg.type) {
        case 'SERIAL_DATA':
            eventListeners.serialData.forEach(cb => cb(msg.data));
            break;
        case 'CODE_RECEIVED':
            eventListeners.codeReceived.forEach(cb => cb(msg.code));
            break;
        case 'UPLOAD_STATUS_EVENT':
            eventListeners.uploadStatus.forEach(cb => cb(msg.status));
            break;
        case 'COMPILE_STATUS':
        case 'UPLOAD_STATUS':
            // we could also emit here if needed, but right now UPLOAD_STATUS_EVENT handles it
            break;
    }
};

window.eduAPI = {
    listPorts: () => wsRequest('LIST_PORTS'),
    connect: (port, baudRate) => wsRequest('CONNECT', { port, baudRate }).then(() => 'connected'),
    disconnect: () => wsRequest('DISCONNECT'),
    send: (data) => wsSendOneWay('SEND_DATA', { payload: data }),
    uploadCPP: (code, port) => wsSendOneWay('UPLOAD_CODE', { code, port }),

    onSerialData: (cb) => eventListeners.serialData.push(cb),
    onCodeReceived: (cb) => eventListeners.codeReceived.push(cb),
    onUploadStatus: (cb) => eventListeners.uploadStatus.push(cb)
};
