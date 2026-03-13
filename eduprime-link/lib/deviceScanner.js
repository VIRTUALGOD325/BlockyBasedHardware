const { SerialPort } = require('serialport');

/**
 * Scan for available serial devices (Arduino-compatible)
 */
async function listDevices() {
    const ports = await SerialPort.list();

    const devices = ports
        .filter(port => {
            return (
                port.manufacturer?.includes('Arduino') ||
                port.manufacturer?.includes('FTDI') ||
                port.manufacturer?.includes('Silicon Labs') ||
                port.manufacturer?.includes('wch') ||
                port.manufacturer?.includes('QinHeng') ||
                port.path?.toLowerCase().includes('usbserial') ||
                port.path?.toLowerCase().includes('usbmodem') ||
                port.path?.toLowerCase().includes('ttyusb') ||
                port.path?.toLowerCase().includes('ttyacm') ||
                port.vendorId // Any device with a vendor ID is likely USB serial
            );
        })
        .map(port => ({
            path: port.path,
            manufacturer: port.manufacturer || 'Unknown',
            vendorId: port.vendorId || null,
            productId: port.productId || null,
            serialNumber: port.serialNumber || null,
            label: `${port.path} (${port.manufacturer || 'Unknown'})`
        }));

    return devices;
}

module.exports = { listDevices };
