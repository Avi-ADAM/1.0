const RESTIME_HOURS: Record<string, number> = { feh: 48, sth: 72, nsh: 96, sevend: 168 };

export function calcDeadlineMs(restime: string): number {
  return (RESTIME_HOURS[restime] ?? 48) * 3600000;
}
