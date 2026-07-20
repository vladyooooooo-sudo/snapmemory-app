/**
 * Hashing del PIN con Web Crypto (SubtleCrypto), mai in chiaro.
 * Un salt casuale per utente rende inutile una rainbow table anche per
 * uno spazio piccolo come 4 cifre.
 */

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bufToHex(bytes.buffer);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return bufToHex(digest);
}

export async function verifyPin(pin: string, salt: string, hash: string): Promise<boolean> {
  const candidate = await hashPin(pin, salt);
  return candidate === hash;
}
