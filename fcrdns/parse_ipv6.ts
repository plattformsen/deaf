export function parseIPv6(ip: string): Uint8Array {
  let [leftStr, rightStr] = ip.split("::");
  leftStr = leftStr || "";
  rightStr = rightStr || "";
  const left = leftStr ? leftStr.split(":") : [];
  const right = rightStr ? rightStr.split(":") : [];
  const bytes = new Uint8Array(16);
  if (left.length + right.length === 0) {
    return bytes;
  }
  for (let i = 0; i < left.length; i++) {
    const byte = parseInt(left[i], 16);
    bytes.set([byte >> 8, byte & 255], i * 2);
  }
  const offset = 16 - right.length * 2;
  for (let i = 0; i < right.length; i++) {
    const byte = parseInt(right[i], 16);
    bytes.set([byte >> 8, byte & 255], offset + i * 2);
  }
  return bytes;
}
