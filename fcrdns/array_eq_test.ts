import { assert, assertFalse } from "@std/assert";
import { arrayEq } from "./array_eq.ts";

Deno.test("arrayEq with different lengths should fail", () => {
  const a = new Uint8Array([1, 2, 3]);
  const b = new Uint8Array([1, 2]);
  assertFalse(arrayEq(a, b));
});

Deno.test("arrayEq with same length but different content should fail", () => {
  const a = new Uint8Array([1, 2, 3]);
  const b = new Uint8Array([1, 2, 4]);
  assertFalse(arrayEq(a, b));
});

Deno.test("arrayEq with same content should pass", () => {
  const a = new Uint8Array([1, 2, 3]);
  const b = new Uint8Array([1, 2, 3]);
  assert(arrayEq(a, b)); // should not be false
});
