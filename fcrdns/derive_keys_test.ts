import { assertEquals } from "@std/assert";
import { deriveKeys } from "./derive_keys.ts";

Deno.test("deriveKeys with root '.' should return '.', '*.', and '**.'", () => {
  assertEquals(deriveKeys("."), [".", "*.", "**."]);
});

Deno.test("deriveKeys with top-level domain", () => {
  assertEquals(deriveKeys("com."), ["com.", "*.", "**."]);
});

Deno.test("deriveKeys with second-level domain", () => {
  assertEquals(deriveKeys("example.com."), [
    "example.com.",
    "*.com.",
    "**.com.",
    "**.",
  ]);
});

Deno.test("deriveKeys with subdomain", () => {
  assertEquals(deriveKeys("sub.example.com."), [
    "sub.example.com.",
    "*.example.com.",
    "**.example.com.",
    "**.com.",
    "**.",
  ]);
});

Deno.test("deriveKeys adds . to the end of the hostname if not present", () => {
  assertEquals(deriveKeys("example.com"), [
    "example.com.",
    "*.com.",
    "**.com.",
    "**.",
  ]);
  assertEquals(deriveKeys(""), [
    ".",
    "*.",
    "**.",
  ]);
});
