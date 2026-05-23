/** Date du jour `YYYY-MM-DD` (UTC, stable en CI). */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Date relative pour tests d’ordonnancement (ex. +1 jour). */
export function isoDateOffsetDays(offset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
