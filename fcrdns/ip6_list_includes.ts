import { arrayEq } from "./array_eq.ts";
import { parseIPv6 } from "./parse_ipv6.ts";

/**
 * @param ip Assumed to be an expanded IPv6 address.
 */
export function ip6ListIncludes(
  list: string[],
  ip: Uint8Array,
): boolean {
  return list.some((item) => arrayEq(parseIPv6(item), ip));
}
