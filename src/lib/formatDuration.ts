/** e.g. 10 -> "10 min", 30 -> "30 min", 120 -> "2h", 90 -> "1.5h". */
export function formatMaxStay(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}h`
}
