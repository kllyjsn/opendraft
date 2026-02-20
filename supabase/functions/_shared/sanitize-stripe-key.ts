/**
 * Sanitizes a Stripe API key by replacing known Cyrillic/Unicode
 * look-alike characters with their ASCII Latin equivalents.
 *
 * This fixes issues caused by mobile keyboards or clipboard managers
 * that silently substitute characters like х→x, Т→T, etc.
 */
const cyrillicToLatin: Record<string, string> = {
  '\u0445': 'x', // х → x
  '\u0422': 'T', // Т → T
  '\u0412': 'B', // В → B
  '\u0443': 'y', // у → y
  '\u00D7': 'x', // × → x
  '\u0425': 'X', // Х → X
  '\u0440': 'p', // р → p
  '\u0410': 'A', // А → A
  '\u0421': 'C', // С → C
  '\u0415': 'E', // Е → E
  '\u041D': 'H', // Н → H
  '\u041A': 'K', // К → K
  '\u041C': 'M', // М → M
  '\u041E': 'O', // О → O
  '\u0420': 'P', // Р → P
  '\u0430': 'a', // а → a
  '\u0435': 'e', // е → e
  '\u043E': 'o', // о → o
  '\u0441': 'c', // с → c
};

export function sanitizeStripeKey(key: string): string {
  return [...key].map(c => cyrillicToLatin[c] ?? c).join('');
}
