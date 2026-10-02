/**
 * Legacy Data Transformer & Payload Normalizer
 * WARNING: Complex nested control flow and untyped recursive parsing.
 */
function parseAndTransformLegacyPacket(rawBuffer, options = {}) {
  if (!rawBuffer || rawBuffer.length < 8) return null;
  let cursor = 0;
  const magicHeader = rawBuffer.slice(0, 4).toString('hex');
  if (magicHeader !== 'a1b2c3d4') {
    throw new Error('Invalid magic header');
  }
  cursor += 4;
  const version = rawBuffer.readUInt16BE(cursor);
  cursor += 2;
  const flags = rawBuffer.readUInt16BE(cursor);
  cursor += 2;

  const result = { v: version, items: [], metadata: {} };
  while (cursor < rawBuffer.length) {
    const tag = rawBuffer.readUInt8(cursor++);
    const len = rawBuffer.readUInt16BE(cursor);
    cursor += 2;
    const chunk = rawBuffer.slice(cursor, cursor + len);
    cursor += len;

    if (tag === 0x01) {
      result.items.push(chunk.toString('utf8'));
    } else if (tag === 0x02) {
      let subCursor = 0;
      while (subCursor < chunk.length) {
        const kLen = chunk.readUInt8(subCursor++);
        const k = chunk.slice(subCursor, subCursor + kLen).toString('utf8');
        subCursor += kLen;
        const vLen = chunk.readUInt16BE(subCursor);
        subCursor += 2;
        const v = chunk.slice(subCursor, subCursor + vLen).toString('utf8');
        subCursor += vLen;
        result.metadata[k] = v;
      }
    } else if (tag === 0xFF) {
      break;
    }
  }
  return result;
}
module.exports = { parseAndTransformLegacyPacket };
