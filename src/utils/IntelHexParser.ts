/**
 * Intel HEX format parser.
 * Converts .hex file content into raw binary pages for flashing.
 */

interface HexRecord {
  address: number;
  type: number;
  data: Uint8Array;
}

export function parseIntelHex(hex: string): Uint8Array {
  const records: HexRecord[] = [];
  let baseAddress = 0;
  let minAddr = Infinity;
  let maxAddr = 0;

  for (const rawLine of hex.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || !line.startsWith(":")) continue;

    const bytes = [];
    for (let i = 1; i < line.length; i += 2) {
      bytes.push(parseInt(line.substring(i, i + 2), 16));
    }

    const byteCount = bytes[0];
    const address = (bytes[1] << 8) | bytes[2];
    const type = bytes[3];
    const data = new Uint8Array(bytes.slice(4, 4 + byteCount));

    if (type === 0x00) {
      // Data record
      const fullAddr = baseAddress + address;
      records.push({ address: fullAddr, type, data });
      minAddr = Math.min(minAddr, fullAddr);
      maxAddr = Math.max(maxAddr, fullAddr + data.length);
    } else if (type === 0x02) {
      // Extended segment address
      baseAddress = ((data[0] << 8) | data[1]) << 4;
    } else if (type === 0x04) {
      // Extended linear address
      baseAddress = ((data[0] << 8) | data[1]) << 16;
    } else if (type === 0x01) {
      // EOF
      break;
    }
  }

  if (records.length === 0) {
    throw new Error("No data records found in hex file");
  }

  // Create contiguous binary buffer
  const binary = new Uint8Array(maxAddr - minAddr);
  binary.fill(0xff); // Unprogrammed flash is 0xFF

  for (const rec of records) {
    binary.set(rec.data, rec.address - minAddr);
  }

  return binary;
}
