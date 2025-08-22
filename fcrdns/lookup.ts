import { hostify6 } from "./hostify6.ts";
import { ip4ListIncludes } from "./ip4_list_includes.ts";
import { ip6ListIncludes } from "./ip6_list_includes.ts";
import { parseIPv6 } from "./parse_ipv6.ts";

/**
 * The options that can be passed to the `lookup` function.
 */
export interface LookupOptions extends Deno.ResolveDnsOptions {
}

/**
 * Performs a reverse DNS lookup for the given IP address and checks if any of
 * the resolved hostnames can be resolved back to the original IP address. This
 * is also known as "Forward-confirmed reverse DNS," or FCrDNS for short.
 *
 * @param ip The IP address to look up.
 * @returns
 */
export async function lookup(
  ip: string,
  options?: LookupOptions,
): Promise<LookupResult> {
  // Optimistically decide if the IP address is IPv4 or IPv6 based on the first
  // 4 characters of the IP address. This is a heuristic and may not always be
  // accurate, but it works for most common cases.
  let ipListIncludesFn:
    | ((list: string[], ip: string) => boolean)
    | ((list: string[], ip: Uint8Array) => boolean);
  let ipVersionRecord: "A" | "AAAA";
  let parsedIp: Uint8Array | string = ip;
  let lookupIpHost: string;

  if (ip[1] === "." || ip[2] === "." || ip[3] === ".") {
    parsedIp = ip;
    ipListIncludesFn = ip4ListIncludes;
    ipVersionRecord = "A";
    lookupIpHost = `${ip.split(".").reverse().join(".")}.in-addr.arpa.`;
  } else {
    parsedIp = parseIPv6(ip) as Uint8Array;
    ipListIncludesFn = ip6ListIncludes;
    ipVersionRecord = "AAAA";
    lookupIpHost = hostify6(parsedIp);
  }

  let hostnames: string[];

  try {
    hostnames = await Deno.resolveDns(lookupIpHost, "PTR", options);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // If no PTR records are found, we return an empty result.
      return {
        ip,
        hostnames: [],
        resolvedHostnames: [],
      };
    }

    throw error;
  }

  const resolvedHostnames: string[] = [];

  for (const hostname of hostnames) {
    try {
      const records = await Deno.resolveDns(
        hostname,
        ipVersionRecord,
        options,
      );

      // deno-lint-ignore no-explicit-any
      if (ipListIncludesFn(records, parsedIp as any)) {
        resolvedHostnames.push(hostname);
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // If the hostname does not resolve to any records, we can skip it.
        continue;
      }
      throw error;
    }
  }

  return {
    ip,
    hostnames,
    resolvedHostnames,
  };
}

/**
 * Represents the result of a reverse DNS lookup.
 */
export interface LookupResult {
  /**
   * The original IP address that was looked up. This could be an IPv4 or IPv6
   * address.
   */
  ip: string;

  /**
   * The list of hostnames associated with the IP address. This is the result
   * of the reverse DNS lookup.
   */
  hostnames: string[];

  /**
   * A list of hostnames that resolved to the original IP address. This is
   * a subset of the `hostnames` list, containing only those hostnames that
   * were verified to resolve back to the original IP address, also known as
   * "Forward-confirmed reverse DNS," or FCrDNS for short.
   *
   * If this list is empty, it means that none of the hostnames resolved to the
   * original IP address, or that the DNS lookup did not return any hostnames.
   * A request must be considered unauthentic if this list is empty.
   */
  resolvedHostnames: string[];
}
