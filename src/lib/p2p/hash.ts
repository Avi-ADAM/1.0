/**
 * Content addressing for the P2P pilot (docs/PLAN_P2P_PILOT.md §2).
 *
 * A file is named by the sha256 of its bytes. That is what makes a stranger's
 * bytes safe to accept: the receiver recomputes the hash and compares it with
 * the one the row recorded at upload, and anything else is thrown away.
 */

const HEX64 = /^[0-9a-f]{64}$/;

export function isSha256Hex(value: unknown): value is string {
  return typeof value === 'string' && HEX64.test(value);
}

/** Lower-case hex sha256 of the bytes (WebCrypto — browser and Node 20+). */
export async function sha256Hex(data: ArrayBuffer | Blob | Uint8Array): Promise<string> {
  const buffer =
    data instanceof Blob
      ? await data.arrayBuffer()
      : data instanceof Uint8Array
        ? data.slice().buffer
        : data;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  let hex = '';
  for (const byte of new Uint8Array(digest)) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

/** Do these bytes really have this name? */
export async function verifySha256(data: ArrayBuffer | Blob | Uint8Array, expected: string): Promise<boolean> {
  if (!isSha256Hex(expected)) return false;
  return (await sha256Hex(data)) === expected;
}
