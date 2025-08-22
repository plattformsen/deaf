import { assertEquals } from "@std/assert";
import { hostify6 } from "./hostify6.ts";

// deno-fmt-ignore
const addresses: [number[], string][] = [
  [[0xf1, 0x2e, 0xd3, 0x4c, 0xb5, 0x6a, 0x7f, 0x8e, 0x9a, 0xab, 0xbc, 0xcd, 0xde, 0xef, 0x10, 0x11], "1.1.0.1.f.e.e.d.d.c.c.b.b.a.a.9.e.8.f.7.a.6.5.b.c.4.3.d.e.2.1.f.ip6.arpa."],
  [[0x32, 0x32, 0x23, 0x00, 0x00, 0x54, 0x7a, 0x8e, 0x9a, 0xab, 0xbc, 0xcd, 0x33, 0x22, 0x11, 0x11], "1.1.1.1.2.2.3.3.d.c.c.b.b.a.a.9.e.8.a.7.4.5.0.0.0.0.3.2.2.3.2.3.ip6.arpa."],
];

Deno.test("hostify6 with valid IPv6 addresses", async (t) => {
  for (const [input, expected] of addresses) {
    await t.step(`hostify6(${input}) should return ${expected}`, () => {
      const ip = new Uint8Array(input);
      const result = hostify6(ip);
      assertEquals(result, expected);
    });
  }
});
