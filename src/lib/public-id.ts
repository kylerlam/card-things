import { randomInt } from "node:crypto";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

export function createPublicId() {
  const suffix = Array.from(
    { length: 12 },
    () => alphabet[randomInt(alphabet.length)],
  ).join("");

  return `ct${suffix}`;
}
