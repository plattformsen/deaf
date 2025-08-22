# FCrDNS - Deno Authentication Framework

`@deaf/fcrdns` is a module for using Forward-confirmed reverse DNS as an
authentication mechanism in Deno applications. It allows you to trust the
hostname of an IP address, which can be useful in scenarios where you want to
trust the identity of a client, but you don't know their IP address ahead of
time, for example in environments where the IP address is a rolling dynamic IP
address (e.g., in a cloud environment).

> [!CAUTION]
>
> There are three critical security implications to be aware of:
>
> 1. Off-path DNS spoofing
> 1. On-path DNS spoofing
> 1. [DNS cache poisoning](https://www.cloudflare.com/learning/dns/dns-cache-poisoning/)
>
> Use this module sparingly.

The only thing this mechanism ensures is forward-confirmed reverse DNS (FCrDNS):
the IP address has one or more PTR hostnames, and at least one of those
hostnames forward-resolves to a set of IPs that includes the original IP. What
hostnames you trust is up to you. Both PTR and A/AAAA lookups may return
multiple values.

The way this works is that you perform a reverse DNS lookup on the IP address,
which returns a list of hostnames:

```bash
dig -x 1.1.1.1 +short
```

This specific IP is operated by Cloudflare, and they publish the PTR record for
the IP address, which resolves to `one.one.one.one.`.

You can then perform a forward DNS lookup on the hostname to get the IP address
of the hostname:

```bash
dig one.one.one.one +short
```

Which returns two IP addresses:

```txt
1.1.1.1
1.0.0.1
```

This means that the hostname `one.one.one.one.` resolves to the IP address
`1.1.1.1`, making it a forward-confirmed reverse DNS entry.

It doesn't exactly mean that the hostname itself is trustworthy, or that the IP
address belongs to the entity controlling the domain name, but it is a good
indication that the hostname is controlled by the same entity that is using the
IP address.

```typescript
import { lookup } from "jsr:@deaf/fcrdns";

const trustedHostnames = new Set(["one.one.one.one."]);

const { resolvedHostnames } = await lookup("1.1.1.1");

if (!trustedHostnames.isDisjointFrom(resolvedHostnames)) {
  console.log("Trusted hostname found!");
} else {
  console.log("Hostname not trusted.");
}
```

It is up to you as a consumer of this library to determine which hostnames you
trust, and how you want to handle the results of the reverse DNS lookup.
