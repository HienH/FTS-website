import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { WindowState } from "./window-state";
import { parseWindowState } from "./window-state";

/**
 * Transport for shared windows. MVP: URL hash. The slug backend later
 * implements this same interface (encode -> POST for slug, decode -> GET).
 */
export interface ShareTransport {
  encode(state: WindowState): Promise<string>; // shareable URL
  decode(location: { hash: string }): Promise<WindowState | null>;
}

const HASH_PREFIX = "#w=";

export class HashTransport implements ShareTransport {
  async encode(state: WindowState): Promise<string> {
    const packed = compressToEncodedURIComponent(JSON.stringify(state));
    return `${window.location.origin}/dashboard${HASH_PREFIX}${packed}`;
  }

  async decode(location: { hash: string }): Promise<WindowState | null> {
    if (!location.hash.startsWith(HASH_PREFIX)) return null;
    const packed = location.hash.slice(HASH_PREFIX.length);
    try {
      const json = decompressFromEncodedURIComponent(packed);
      if (!json) return null;
      return parseWindowState(JSON.parse(json));
    } catch {
      return null;
    }
  }
}

export const shareTransport: ShareTransport = new HashTransport();
