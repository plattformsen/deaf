export function deriveKeys(hostname: string): string[] {
  const keys: string[] = [];
  if (hostname === "") {
    return [".", "*.", "**."];
  }
  hostname = hostname.toLowerCase();
  hostname = hostname.endsWith(".") ? hostname : `${hostname}.`;
  keys.push(hostname); // exact match
  let firstIndex = hostname.indexOf(".");
  if (firstIndex !== -1) {
    hostname = hostname.slice(firstIndex + 1);
    keys.push(`*.${hostname}`); // wildcard for 1-depth subdomains
  }
  while (firstIndex !== -1 && hostname.length > 0) {
    keys.push(`**.${hostname}`); // wildcard for full-depth subdomains
    firstIndex = hostname.indexOf(".");
    hostname = hostname.slice(firstIndex + 1);
  }
  keys.push("**."); // wildcard for all hostnames
  return keys;
}
