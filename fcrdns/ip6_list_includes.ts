import { arrayEq } from "./array_eq.ts";
import { parseIPv6 } from "./parse_ipv6.ts";

export function ip6ListIncludes(
  list: string[],
  ip: Uint8Array,
): boolean {
  return list.some((item) => arrayEq(parseIPv6(item), ip));
}
