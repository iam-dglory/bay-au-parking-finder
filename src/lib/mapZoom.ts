export function zoomForRadius(radiusM: number): number {
  return radiusM <= 500 ? 16 : radiusM <= 1000 ? 15 : radiusM <= 2000 ? 14 : 13
}
