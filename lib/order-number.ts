export function formatOrderNumber(id: number | string) {
  return `FG${String(id).padStart(2, "0")}`;
}
