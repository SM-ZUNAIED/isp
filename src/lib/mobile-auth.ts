/** Shared helpers for mobile-number based auth (client + server safe). */

export const MOBILE_RE = /^01[3-9]\d{8}$/;

/** Synthetic email derived from a mobile number, used as the auth identifier. */
export const mobileToEmail = (mobile: string) => `${mobile.trim()}@mobile.local`;

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
