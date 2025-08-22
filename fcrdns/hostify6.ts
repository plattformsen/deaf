/**
 * Convert a 16-byte IPv6 address into its reverse-nibble ip6.arpa name.
 * Order: iterate bytes from last to first; within each byte, low nibble then high nibble.
 * Example: ::1 -> "1.0.0....0.ip6.arpa."
 */
export function hostify6(ip: Uint8Array): string {
  let str = "";

  for (let i = 15; i >= 0; i -= 2) {
    const byte1 = ip[i - 1];
    const byte2 = ip[i];

    str += (byte2 & 0x0f).toString(16) + "." +
      (byte2 >> 4).toString(16) + "." +
      (byte1 & 0x0f).toString(16) + "." +
      (byte1 >> 4).toString(16) + ".";
  }

  return `${str}ip6.arpa.`;
}
