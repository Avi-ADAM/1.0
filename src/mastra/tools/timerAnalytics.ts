// timerAnalytics.ts — timer statistics & hours-worked calculations
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer.js';

// ── helpers ──────────────────────────────────────────────

function getPeriodBounds(
  period: 'today' | 'week' | 'month' | 'custom',
  startDate?: string,
  endDate?: string
): { start: Date; end: Date; label: string } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    return { start: todayStart, end: now, label: 'היום' };
  }
  if (period === 'week') {
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    return { start: weekStart, end: now, label: 'השבוע' };
  }
  if (period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: monthStart, end: now, label: 'החודש' };
  }
  // custom
  const s = startDate ? new Date(startDate) : todayStart;
  const e = endDate ? new Date(endDate) : now;
  return { start: s, end: e, label: `${s.toLocaleDateString('he-IL')} – ${e.toLocaleDateString('he-IL')}` };
}

function calcOverlapHours(
  intervals: Array<{ start: string; stop?: string | null }>,
  periodStart: Date,
  periodEnd: Date
): number {
  let totalMs = 0;
  for (const iv of intervals) {
    if (!iv.start) continue;
    const ivStart = new Date(iv.start);

    if (!iv.stop) {
      // Running interval (timer still active).
      // If it started BEFORE the period it's a zombie timer that was never stopped —
      // skip it so it doesn't pollute the stats.
      if (ivStart < periodStart) continue;
      // Started inside the period — count time from start to now.
      const overlapEnd = Math.min(Date.now(), periodEnd.getTime());
      if (overlapEnd > ivStart.getTime()) {
        totalMs += overlapEnd - ivStart.getTime();
      }
      continue;
    }

    // Completed interval — standard overlap with the period window.
    const ivEnd = new Date(iv.stop);
    const overlapStart = Math.max(ivStart.getTime(), periodStart.getTime());
    const overlapEnd = Math.min(ivEnd.getTime(), periodEnd.getTime());
    if (overlapEnd > overlapStart) {
      totalMs += overlapEnd - overlapStart;
    }
  }
  return totalMs / 3_600_000; // ms → hours
}

function fmt(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} דקות`;
  if (m === 0) return `${h} שעות`;
  return `${h} שעות ו-${m} דקות`;
}

// ── tool ────────────────────────────────────────────────

export const getWorkedHoursTool = createTool({
  id: 'getWorkedHours',
  description:
    'Calculate how many hours the user worked in a given period (today / this week / this month / custom range). ' +
    'Returns total hours and a per-mission / per-project breakdown. ' +
    'Use this when the user asks "כמה שעות עבדתי", "כמה זמן עבדתי", "סיכום שעות", "hours worked", etc.',
  inputSchema: z.object({
    period: z
      .enum(['today', 'week', 'month', 'custom'])
      .default('month')
      .describe('Time period to calculate. Use "month" for "החודש", "week" for "השבוע", "today" for "היום".'),
    startDate: z
      .string()
      .optional()
      .describe('ISO date string for period start (only for custom period)'),
    endDate: z
      .string()
      .optional()
      .describe('ISO date string for period end (only for custom period)')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    periodLabel: z.string(),
    totalHours: z.number(),
    totalFormatted: z.string(),
    byMission: z.array(
      z.object({
        missionId: z.string(),
        missionName: z.string(),
        projectName: z.string(),
        hours: z.number(),
        formatted: z.string()
      })
    ),
    byProject: z.array(
      z.object({
        projectName: z.string(),
        hours: z.number(),
        formatted: z.string()
      })
    ),
    error: z.string().optional()
  }),
  execute: async (inputData) => {
    const { period, startDate, endDate } = inputData;
    const globalContext = (global as any).botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;
    const isServerRequest = !globalContext.isInternalBot;

    const emptyResult = {
      success: false,
      periodLabel: '',
      totalHours: 0,
      totalFormatted: '0 דקות',
      byMission: [],
      byProject: []
    };

    if (!userId || !fetchInstance) {
      return { ...emptyResult, error: 'Missing user context' };
    }

    const { start, end, label } = getPeriodBounds(period, startDate, endDate);

    try {
      const res = await sendToSer(
        { id: userId },
        '8getMissionsOnProgress',
        0, 0,
        isServerRequest,
        fetchInstance
      );
      const missions: any[] =
        res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];

      const missionRows: Array<{
        missionId: string;
        missionName: string;
        projectName: string;
        hours: number;
        formatted: string;
      }> = [];

      for (const m of missions) {
        const intervals: Array<{ start: string; stop?: string | null }> =
          m.attributes.activeTimer?.data?.attributes?.timers ?? [];

        const hours = calcOverlapHours(intervals, start, end);
        if (hours < 0.01) continue; // skip missions with zero time in period

        missionRows.push({
          missionId: m.id,
          missionName: m.attributes.name,
          projectName: m.attributes.project?.data?.attributes?.projectName || 'ללא פרויקט',
          hours,
          formatted: fmt(hours)
        });
      }

      // Sort by most hours first
      missionRows.sort((a, b) => b.hours - a.hours);

      const totalHours = missionRows.reduce((s, r) => s + r.hours, 0);

      // Group by project
      const projectMap = new Map<string, number>();
      for (const r of missionRows) {
        projectMap.set(r.projectName, (projectMap.get(r.projectName) ?? 0) + r.hours);
      }
      const byProject = Array.from(projectMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([projectName, hours]) => ({ projectName, hours, formatted: fmt(hours) }));

      return {
        success: true,
        periodLabel: label,
        totalHours,
        totalFormatted: fmt(totalHours),
        byMission: missionRows,
        byProject
      };
    } catch (err: any) {
      console.error('getWorkedHoursTool error:', err);
      return { ...emptyResult, periodLabel: label, error: err.message };
    }
  }
});
