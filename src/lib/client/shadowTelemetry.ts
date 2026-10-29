// Browser half of the shadow-projection telemetry (A3). Each distinct
// snapshot goes to POST /api/consent/telemetry once per page session —
// fire-and-forget: the server's verdict never reaches the UI.

import { shadowReportKey, SHADOW_TELEMETRY_TAG, type ShadowReport } from '$lib/consent/shadowTelemetry';

const sent = new Set<string>();

/** True when the snapshot was new and a send was started. */
export function sendShadowReport(report: ShadowReport, fetchFn: typeof fetch = fetch): boolean {
  const key = shadowReportKey(report);
  if (sent.has(key)) return false;
  sent.add(key);
  if (report.mismatches.length > 0) {
    console.warn(SHADOW_TELEMETRY_TAG, 'projection/gql mismatch', report);
  }
  fetchFn('/api/consent/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  }).catch(() => {
    // Telemetry only. A lost line is a gap in the count, never a page error.
  });
  return true;
}

/** Tests only. */
export function _resetShadowReports(): void {
  sent.clear();
}
