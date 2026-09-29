// SHA-256 hex digest via the browser's Web Crypto API. Used for the garden
// password gate — this is a *simple* UI-level gate (the garden's data stays
// publicly readable the same way it always has been), so the goal here is
// just to avoid ever writing a visitor-chosen plaintext password into a
// publicly-readable Firestore document, not to defend against a determined
// attacker with access to the hash.
export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
