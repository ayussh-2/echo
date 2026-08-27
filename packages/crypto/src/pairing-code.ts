import type { PairingPayload } from "@echo/shared-types";

// Exclude ambiguous characters (0, O, 1, I, L) for human scanning & typing clarity
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generatePairingCode(): string {
  const segment1 = Array.from({ length: 3 }, () =>
    CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length))
  ).join("");
  const segment2 = Array.from({ length: 3 }, () =>
    CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length))
  ).join("");
  return `${segment1}-${segment2}`;
}

export function createPairingPayload(
  uid: string,
  desktopDeviceName: string,
  ttlMs = 2 * 60 * 1000 // 2 minutes short-lived QR pairing window
): PairingPayload {
  const now = Date.now();
  return {
    uid,
    code: generatePairingCode(),
    desktopDeviceName,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
}

export function isPairingPayloadExpired(payload: PairingPayload): boolean {
  return Date.now() > payload.expiresAt;
}

export function encodePairingPayload(payload: PairingPayload): string {
  return JSON.stringify(payload);
}

export function decodePairingPayload(raw: string): PairingPayload | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      "code" in parsed &&
      "expiresAt" in parsed &&
      typeof (parsed as PairingPayload).uid === "string" &&
      typeof (parsed as PairingPayload).code === "string" &&
      typeof (parsed as PairingPayload).expiresAt === "number"
    ) {
      return parsed as PairingPayload;
    }
    return null;
  } catch {
    return null;
  }
}
