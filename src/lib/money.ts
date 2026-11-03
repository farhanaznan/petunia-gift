/** Integer sen helpers — never use floating point for money. */

export function senToRm(sen: number): string {
  const sign = sen < 0 ? "-" : "";
  const abs = Math.abs(sen);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}RM${whole}.${frac}`;
}

export function rmToSen(rm: number): number {
  return Math.round(rm * 100);
}

export function sumSen(...parts: number[]): number {
  return parts.reduce((acc, n) => acc + n, 0);
}
