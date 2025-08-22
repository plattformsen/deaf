import { assert, assertFalse } from "@std/assert";
import { ip4ListIncludes } from "./ip4_list_includes.ts";

Deno.test("ip4ListIncludes with empty list", () => {
  assertFalse(ip4ListIncludes([], "1.2.3.4"));
});

Deno.test("ip4ListIncludes with singular", () => {
  assert(ip4ListIncludes(["1.2.3.4"], "1.2.3.4"));
});

Deno.test("ip4ListIncludes with multiple singular", () => {
  assert(ip4ListIncludes(["127.0.0.1", "1.2.3.4", "4.5.6.7"], "1.2.3.4"));
});

Deno.test("ip4ListIncludes does not include", () => {
  assertFalse(ip4ListIncludes(["127.0.0.1", "1.2.3.4", "4.5.6.7"], "10.2.3.4"));
});
