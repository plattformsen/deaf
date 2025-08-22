import { assert, assertFalse } from "@std/assert";
import { ip6ListIncludes } from "./ip6_list_includes.ts";
import { parseIPv6 } from "./parse_ipv6.ts";

Deno.test("ip6ListIncludes with empty list", () => {
  assertFalse(ip6ListIncludes([], parseIPv6("::1")));
});

Deno.test("ip6ListIncludes with singular", () => {
  assert(ip6ListIncludes(["0:0:0::1"], parseIPv6("0::1")));
});

Deno.test("ip6ListIncludes with multiple singular", () => {
  assert(ip6ListIncludes(["::1", "::2", "::3"], parseIPv6("0:0:0:0::2")));
});

Deno.test("ip6ListIncludes does not include", () => {
  assertFalse(ip6ListIncludes(["::1", "::2", "::3"], parseIPv6("::4")));
});
