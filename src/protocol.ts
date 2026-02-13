// protocol.ts
enum MessageType {
    COMMAND = "cmd",      // Browser → Bridge
    RESPONSE = "ack",     // Bridge → Browser
    STREAM = "stream",    // Bridge → Browser (sensor data)
    ERROR = "error"       // Bridge → Browser
}

interface CommandMessage {
    type: MessageType.COMMAND
    action: "digitalWrite" | "analogRead" | "servoWrite" | "pinMode"
    pin: number | string
    value?: number
    requestId: string
}

interface ResponseMessage {
    type: MessageType.RESPONSE
    requestId: string
    ok: boolean
    value?: number
    error?: string
}

interface StreamMessage {
    type: MessageType.STREAM
    pin: string
    value: number
    timestamp: number
}