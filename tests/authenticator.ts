import { createHmac } from 'node:crypto';

/** Independent RFC 6238 generator for API and browser interoperability checks. */
export function authenticatorCode(secret: string, offset = 0): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret]
    .map((char) => alphabet.indexOf(char).toString(2).padStart(5, '0'))
    .join('');
  const key = Buffer.from(
    bits.match(/.{8}/g)?.map((byte) => Number.parseInt(byte, 2)) ?? [],
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const digest = createHmac('sha1', key).update(counter).digest();
  const start = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(start) & 0x7fffffff) % 1000000).padStart(
    6,
    '0',
  );
}
