import { assertEquals, assertRejects } from "@std/assert";
import { createDnsContainer } from "./_dns_testcontainers.ts";
import { lookup } from "./lookup.ts";
import { hostify6 } from "./hostify6.ts";
import { parseIPv6 } from "./parse_ipv6.ts";

// Note about sanitizeResources and sanitizeOps:
// The testcontainers library is making use of ReadableStream for the log
// output, which isn't closing in-time or at all. Since this is only running in
// tests (the testcontainers library), this is fine.

const strSort = (a: string, b: string): number => a.localeCompare(b);

function s(arr: string[]): string[] {
  return arr.sort(strSort);
}

Deno.test(
  "one host in successful FCrDNS lookup",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await using nameServer = await createDnsContainer([
      ["PTR", "1.1.1.1.in-addr.arpa.", ["example.com."]],
      ["A", "example.com.", ["1.1.1.1"]],

      ["PTR", hostify6(parseIPv6("::2")), ["example.com."]],
      ["AAAA", "example.com.", ["::2"]],
    ]);

    await t.step("ip4", async () => {
      const result = await lookup("1.1.1.1", { nameServer });

      assertEquals(result.ip, "1.1.1.1");
      assertEquals(result.hostnames, ["example.com."]);
      assertEquals(result.resolvedHostnames, ["example.com."]);
    });

    await t.step("ip6", async () => {
      const result = await lookup("::2", { nameServer });

      assertEquals(result.ip, "::2");
      assertEquals(result.hostnames, ["example.com."]);
      assertEquals(result.resolvedHostnames, ["example.com."]);
    });
  },
);

Deno.test(
  "two host in successful FCrDNS lookup",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await using nameServer = await createDnsContainer([
      ["PTR", "1.1.1.1.in-addr.arpa.", ["example.com.", "example.org."]],
      ["A", "example.com.", ["1.1.1.1", "1.0.0.1"]],
      ["A", "example.org.", ["1.1.1.1", "1.0.0.1"]],

      ["PTR", hostify6(parseIPv6("::2")), ["example.com.", "example.org."]],
      ["AAAA", "example.com.", ["::2", "::3"]],
      ["AAAA", "example.org.", ["::2", "::3"]],
    ]);

    await t.step("ip4", async () => {
      const result = await lookup("1.1.1.1", { nameServer });

      assertEquals(result.ip, "1.1.1.1");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        s(["example.com.", "example.org."]),
      );
    });

    await t.step("ip6", async () => {
      const result = await lookup("::2", { nameServer });

      assertEquals(result.ip, "::2");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        s(["example.com.", "example.org."]),
      );
    });
  },
);

Deno.test(
  "one of two 1 host in successful FCrDNS lookup",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await using nameServer = await createDnsContainer([
      ["PTR", "1.1.1.1.in-addr.arpa.", ["example.com.", "example.org."]],
      ["A", "example.com.", ["1.1.1.1", "1.0.0.1"]],
      ["A", "example.org.", ["1.0.0.1"]],

      ["PTR", hostify6(parseIPv6("::2")), ["example.com.", "example.org."]],
      ["AAAA", "example.com.", ["::2", "::3"]],
      ["AAAA", "example.org.", ["::3"]],
    ]);

    await t.step("ip4", async () => {
      const result = await lookup("1.1.1.1", { nameServer });

      assertEquals(result.ip, "1.1.1.1");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        s(["example.com."]),
      );
    });

    await t.step("ip6", async () => {
      const result = await lookup("::2", { nameServer });

      assertEquals(result.ip, "::2");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        s(["example.com."]),
      );
    });
  },
);

Deno.test(
  "one of two 2 host in successful FCrDNS lookup",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await using nameServer = await createDnsContainer([
      ["PTR", "1.1.1.1.in-addr.arpa.", ["example.com.", "example.org."]],
      ["A", "example.com.", ["1.0.0.1"]],
      ["A", "example.org.", ["1.1.1.1"]],

      ["PTR", hostify6(parseIPv6("::2")), ["example.com.", "example.org."]],
      ["AAAA", "example.com.", ["::3"]],
      ["AAAA", "example.org.", ["::2"]],
    ]);

    await t.step("ip4", async () => {
      const result = await lookup("1.1.1.1", { nameServer });

      assertEquals(result.ip, "1.1.1.1");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        s(["example.org."]),
      );
    });

    await t.step("ip6", async () => {
      const result = await lookup("::2", { nameServer });

      assertEquals(result.ip, "::2");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        s(["example.org."]),
      );
    });
  },
);

Deno.test(
  "unsuccessful FCrDNS lookup",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await using nameServer = await createDnsContainer([
      ["PTR", "1.1.1.1.in-addr.arpa.", ["example.com.", "example.org."]],
      ["PTR", hostify6(parseIPv6("::2")), ["example.com.", "example.org."]],
    ]);

    await t.step("ip4", async () => {
      const result = await lookup("1.1.1.1", { nameServer });

      assertEquals(result.ip, "1.1.1.1");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        [],
      );
    });

    await t.step("ip6", async () => {
      const result = await lookup("::2", { nameServer });

      assertEquals(result.ip, "::2");
      assertEquals(s(result.hostnames), s(["example.com.", "example.org."]));
      assertEquals(
        s(result.resolvedHostnames),
        [],
      );
    });
  },
);

Deno.test(
  "should not throw error on missing PTR record",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await using nameServer = await createDnsContainer([]);

    await t.step("ip4", async () => {
      const result = await lookup("1.1.1.1", { nameServer });
      assertEquals(result.ip, "1.1.1.1");
      assertEquals(result.hostnames, []);
      assertEquals(result.resolvedHostnames, []);
    });

    await t.step("ip6", async () => {
      const result = await lookup("::2", { nameServer });
      assertEquals(result.ip, "::2");
      assertEquals(result.hostnames, []);
      assertEquals(result.resolvedHostnames, []);
    });
  },
);

Deno.test(
  "should throw original timeout errors",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await using nameServer = await createDnsContainer([
      ["PTR", "1.1.1.1.in-addr.arpa.", ["example.com.", "example.org."]],
      ["PTR", hostify6(parseIPv6("::2")), ["example.com.", "example.org."]],
    ]);

    await nameServer.stop();

    await t.step("ip4", async () => {
      await assertRejects(
        async () => await lookup("1.1.1.1", { nameServer }),
        Deno.errors.TimedOut,
      );
    });

    await t.step("ip6", async () => {
      await assertRejects(
        async () => await lookup("::2", { nameServer }),
        Deno.errors.TimedOut,
      );
    });
  },
);
