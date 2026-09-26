import type { WebhookRuntimeSecurityOptions } from "./types";

export interface EndpointValidationOptions {
  allowPrivateHosts: boolean;
  allowHttpForLocalhost: boolean;
}

export const DEFAULT_ENDPOINT_VALIDATION_OPTIONS: EndpointValidationOptions = {
  allowPrivateHosts: false,
  allowHttpForLocalhost: true,
};

// URL hostnames arrive canonicalized: IPv4 as a dotted quad and IPv6 as
// bracketed, lowercase, compressed hex. A fully qualified name may still end
// with a dot ("localhost.").
function normalizeHostname(hostname: string): string {
  let host = hostname.toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }
  return host.replace(/\.+$/, "");
}

function parseIpv4(host: string): number[] | null {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  return octets.every((octet) => octet <= 255) ? octets : null;
}

function parseIpv6Groups(part: string): number[] | null {
  if (part.length === 0) return [];
  const groups: number[] = [];
  for (const piece of part.split(":")) {
    if (piece.includes(".")) {
      const octets = parseIpv4(piece);
      if (!octets) return null;
      groups.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
    } else if (/^[0-9a-f]{1,4}$/.test(piece)) {
      groups.push(Number.parseInt(piece, 16));
    } else {
      return null;
    }
  }
  return groups;
}

function parseIpv6(host: string): number[] | null {
  if (!host.includes(":")) return null;
  const halves = host.split("::");
  if (halves.length > 2) return null;

  const head = parseIpv6Groups(halves[0] ?? "");
  const tail = halves.length === 2 ? parseIpv6Groups(halves[1] ?? "") : [];
  if (!head || !tail) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;

  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;
  return [...head, ...new Array<number>(missing).fill(0), ...tail];
}

function isPrivateIpv4(octets: readonly number[]): boolean {
  const [first = 0, second = 0, third = 0] = octets;
  return (
    first === 0 || // "this" network, including 0.0.0.0
    first === 10 ||
    (first === 100 && second >= 64 && second <= 127) || // shared address space
    first === 127 ||
    (first === 169 && second === 254) || // link-local and cloud metadata
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224 // multicast, reserved, and broadcast
  );
}

function embeddedIpv4(groups: readonly number[]): number[] {
  const high = groups[6] ?? 0;
  const low = groups[7] ?? 0;
  return [high >> 8, high & 0xff, low >> 8, low & 0xff];
}

function isPrivateIpv6(groups: readonly number[]): boolean {
  const [first = 0, second = 0] = groups;
  const zeroPrefix = (length: number) =>
    groups.slice(0, length).every((group) => group === 0);

  // Unspecified (::), loopback (::1), and IPv4-compatible (::a.b.c.d).
  if (zeroPrefix(6)) {
    return (
      (groups[6] === 0 && (groups[7] ?? 0) <= 1) ||
      isPrivateIpv4(embeddedIpv4(groups))
    );
  }
  // IPv4-mapped (::ffff:a.b.c.d).
  if (zeroPrefix(5) && groups[5] === 0xffff) {
    return isPrivateIpv4(embeddedIpv4(groups));
  }
  // NAT64 well-known prefix (64:ff9b::a.b.c.d).
  if (
    first === 0x64 &&
    second === 0xff9b &&
    groups.slice(2, 6).every((g) => g === 0)
  ) {
    return isPrivateIpv4(embeddedIpv4(groups));
  }

  return (
    (first & 0xfe00) === 0xfc00 || // unique local
    (first & 0xffc0) === 0xfe80 || // link-local
    (first & 0xffc0) === 0xfec0 || // site-local (deprecated)
    (first & 0xff00) === 0xff00 // multicast
  );
}

function isLoopbackHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  const ipv4 = parseIpv4(host);
  if (ipv4) return ipv4[0] === 127;
  const ipv6 = parseIpv6(host);
  if (!ipv6) return false;
  if (ipv6.slice(0, 7).every((group) => group === 0) && ipv6[7] === 1) {
    return true;
  }
  return (
    ipv6.slice(0, 5).every((group) => group === 0) &&
    ipv6[5] === 0xffff &&
    embeddedIpv4(ipv6)[0] === 127
  );
}

function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  // WHATWG URL parsing rejects IPv6 zone ids, but a zone-scoped address is
  // link- or site-local by definition, so fail closed if one ever arrives.
  if (host.includes("%")) return true;

  const ipv4 = parseIpv4(host);
  if (ipv4) return isPrivateIpv4(ipv4);
  const ipv6 = parseIpv6(host);
  if (ipv6) return isPrivateIpv6(ipv6);

  return host.endsWith(".local") || host.endsWith(".internal");
}

export function resolveEndpointValidationOptions(
  security: WebhookRuntimeSecurityOptions | undefined,
): EndpointValidationOptions {
  return {
    allowPrivateHosts:
      security?.allowPrivateHosts ??
      DEFAULT_ENDPOINT_VALIDATION_OPTIONS.allowPrivateHosts,
    allowHttpForLocalhost:
      security?.allowHttpForLocalhost ??
      DEFAULT_ENDPOINT_VALIDATION_OPTIONS.allowHttpForLocalhost,
  };
}

export function validateEndpointUrl(
  rawUrl: string,
  options: EndpointValidationOptions = DEFAULT_ENDPOINT_VALIDATION_OPTIONS,
): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  const hostname = normalizeHostname(parsed.hostname);
  const localhost = isLoopbackHost(hostname);

  if (parsed.protocol !== "https:") {
    if (
      !(
        options.allowHttpForLocalhost &&
        localhost &&
        parsed.protocol === "http:"
      )
    ) {
      throw new Error("Webhook URL must use HTTPS");
    }
  }

  if (!options.allowPrivateHosts && isPrivateHost(hostname)) {
    throw new Error("Private hosts are not allowed for webhook endpoints");
  }

  return parsed;
}
