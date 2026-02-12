# Hardware Bridge Protocol v1.0

## Message Format

All messages are JSON objects sent over WebSocket.

### Browser → Bridge (Commands)

**Digital Write**

```json
{
  "cmd": "digitalWrite",
  "pin": 13,
  "value": 1
}
```

**Digital Read**

```json
{
  "cmd": "digitalRead",
  "pin": 2
}
```

**Analog Write (PWM)**

```json
{
  "cmd": "analogWrite",
  "pin": 9,
  "value": 128
}
```

**Analog Read**

```json
{
  "cmd": "analogRead",
  "pin": "A0"
}
```

**Servo Control**

```json
{
  "cmd": "servoWrite",
  "pin": 10,
  "angle": 90
}
```

**Start Sensor Stream**

```json
{
  "cmd": "startStream",
  "pin": "A0",
  "interval": 100
}
```

**Stop Sensor Stream**

```json
{
  "cmd": "stopStream",
  "pin": "A0"
}
```

### Bridge → Browser (Responses)

**Connection Status**

```json
{
  "type": "connected",
  "board": "Arduino Uno",
  "timestamp": 1710000000000
}
```

**Acknowledgment**

```json
{
  "type": "ack",
  "action": "digitalWrite",
  "pin": 13,
  "ok": true
}
```

**Read Response**

```json
{
  "type": "response",
  "action": "analogRead",
  "pin": "A0",
  "value": 512
}
```

**Sensor Stream Data**

```json
{
  "type": "stream",
  "pin": "A0",
  "value": 512,
  "timestamp": 1710000000000
}
```

**Error**

```json
{
  "type": "error",
  "code": "BOARD_NOT_READY",
  "message": "Hardware board is not connected"
}
```

## Error Codes

- `PARSE_ERROR` - Invalid JSON received
- `BOARD_NOT_READY` - Board not connected or not initialized
- `UNKNOWN_COMMAND` - Command not recognized
- `DIGITAL_WRITE_FAILED` - Failed to write digital value
- `DIGITAL_READ_FAILED` - Failed to read digital value
- `ANALOG_WRITE_FAILED` - Failed to write PWM value
- `ANALOG_READ_FAILED` - Failed to read analog value
- `SERVO_WRITE_FAILED` - Failed to control servo
- `STREAM_START_FAILED` - Failed to start sensor stream
- `STREAM_STOP_FAILED` - Failed to stop sensor stream
- `NO_ACTIVE_STREAM` - No active stream for specified pin
