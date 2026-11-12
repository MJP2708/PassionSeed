/** First letter for an avatar. Skips Thai leading vowels (เ แ โ ใ ไ) so "ใบเตย" → "บ". */
export function initialOf(name: string): string {
  const chars = [...name.trim()];
  return chars.find((c) => !/[เแโใไ]/.test(c)) ?? chars[0] ?? "?";
}
