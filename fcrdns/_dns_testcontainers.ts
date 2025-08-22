import { GenericContainer, Wait } from "testcontainers";

const CONTAINER_IMAGE = "docker.io/4km3/dnsmasq:2.90-r3-alpine-3.22.1";

export type DnsRecord = ["A" | "AAAA" | "PTR", string, string[]];

function recordToArg(record: DnsRecord): string[] {
  const out: string[] = [];

  const [type, name, values] = record;

  switch (type) {
    case "A":
    case "AAAA":
      for (const addr of values) {
        out.push("--host-record=" + name + "," + addr);
      }
      break;
    case "PTR":
      for (const addr of values) {
        out.push("--ptr-record=" + name + "," + addr);
      }
      break;
    default:
      throw new Error(
        "Unsupported DNS record type: " + type + "for" + name,
      );
  }

  return out;
}

export interface DnsRunningContainerControls {
  ipAddr: string;
  port: number;
  stop: () => Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}

function localhostOr(ip: string): string {
  return ip === "localhost" ? "127.0.0.1" : ip;
}

export async function createDnsContainer(
  records: DnsRecord[],
): Promise<DnsRunningContainerControls> {
  const container = new GenericContainer(CONTAINER_IMAGE)
    .withExposedPorts("1053/udp")
    .withAutoRemove(true)
    .withCommand([
      "--no-daemon",
      "--no-hosts",
      "--no-resolv",
      "--port=1053",
      "--interface=*",
      ...records.flatMap(recordToArg),
    ])
    .withWaitStrategy(Wait.forLogMessage(/^dnsmasq:\ started/g));

  const startedContainer = await container.start();
  const ipAddr = localhostOr(startedContainer.getHost());
  const port = startedContainer.getMappedPort("1053/udp");

  const stop = async () => {
    await startedContainer.stop();
  };

  return {
    ipAddr,
    port,
    stop,
    [Symbol.asyncDispose]: stop,
  } satisfies DnsRunningContainerControls;
}
