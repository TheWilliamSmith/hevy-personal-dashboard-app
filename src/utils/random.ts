const UINT32_RANGE = 0x1_0000_0000;

export function secureRandom(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return (buffer[0] ?? 0) / UINT32_RANGE;
}
