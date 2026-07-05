const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createInviteCode(length = 6) {
  const cryptoObject = globalThis.crypto;
  const values = new Uint32Array(length);
  cryptoObject.getRandomValues(values);

  return Array.from(values)
    .map((value) => alphabet[value % alphabet.length])
    .join("");
}
