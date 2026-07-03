/**
 * Privacy rounding for the public discovery map (PLAN_DISCOVERY_MAP §2.2,
 * PLAN_SHARED_PURCHASE §14.5): snap a coordinate to a ~1km grid so a wish
 * marker never exposes a home address. 0.01° ≈ 1.11km latitude.
 */
export function roundCoord(value: number, gridDeg = 0.01): number {
  return Math.round(value / gridDeg) * gridDeg;
}
