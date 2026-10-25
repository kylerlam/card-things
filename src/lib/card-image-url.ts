export function isCardImageUrl(value: string) {
  if (!value || value.length > 2048 || /[\\\s]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
