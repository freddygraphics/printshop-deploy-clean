export function calculateSqft(widthIn: number, heightIn: number): number {
  return Number(((widthIn * heightIn) / 144).toFixed(2));
}
