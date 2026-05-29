import type { SaleData } from '$lib/stores/levStores';
import type {
  Deal,
  DealDetailData,
  DealStatus,
  Mission,
  Resource,
  TimelineEvent,
  ForumMessage,
  Party,
  PendingApproval,
  DashboardStats
} from '$lib/types';

export type DealKind = 'sale' | 'purchase';

const KIND_ICON: Record<string, string> = {
  monthly: '📅',
  yearly: '📆',
  total: '⭐',
  unlimited: '∞',
  daily: '🌅'
};

const KIND_BG: Record<string, string> = {
  monthly: 'linear-gradient(135deg,#0a0a1a,#12122a)',
  yearly: 'linear-gradient(135deg,#1a1200,#2e2000)',
  total: 'linear-gradient(135deg,#0a100a,#0f1e0f)',
  unlimited: 'linear-gradient(135deg,#0f0a0a,#200a0a)',
  daily: 'linear-gradient(135deg,#0a1010,#0f1e1e)'
};

const KIND_CATEGORY: Record<string, string> = {
  monthly: 'מינוי חודשי',
  yearly: 'מינוי שנתי',
  total: 'תשלום חד פעמי',
  unlimited: 'ליחידה - ללא הגבלה',
  daily: 'יומי'
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const yy = String(d.getFullYear()).slice(2);
  return `${d.getDate()}.${d.getMonth() + 1}.${yy}`;
}

function initials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

function computeProgress(s: SaleData): number {
  if (s.moneyTransfered && (s.productExepted || s.iGotIt)) return 100;
  if (s.iTransferMoney || (s.halukaId && !s.moneyTransfered)) return 75;
  if (s.iGotIt) return 50;
  if (Array.isArray(s.weFinnish) && s.weFinnish.length > 0) return 25;
  return 0;
}

function computeStatus(s: SaleData, kind: DealKind): DealStatus {
  const done = s.moneyTransfered && (s.productExepted || s.iGotIt);
  if (done) return 'done';

  if (kind === 'purchase') {
    if (!s.iGotIt && Array.isArray(s.weFinnish) && s.weFinnish.length > 0) {
      return 'approval';
    }
    if (s.iTransferMoney && !s.moneyTransfered) return 'pending';
  } else {
    const alreadyVoted = Array.isArray(s.weFinnish)
      ? s.weFinnish.some(
          (v: any) => String(v?.users_permissions_user?.data?.id) === String(s.myid)
        )
      : false;
    if (!alreadyVoted) return 'approval';
  }

  if (s.iGotIt || s.iTransferMoney) return 'active';
  return 'pending';
}

function pickAvatarStyle(seed: string): string {
  const palette = [
    'background:#1a1200;color:#f0d878',
    'background:#0a120a;color:#4ade80',
    'background:#0a0a1a;color:#74bfff',
    'background:#1a0010;color:#ff6fa8',
    'background:#0a1a1a;color:#5eead4'
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

function buildTimeline(s: SaleData): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  if (s.startDate) {
    events.push({
      date: formatDate(s.startDate),
      label: 'פתיחת עסקה',
      desc: 'המכירה אושרה במערכת',
      status: 'done'
    });
  }
  if (Array.isArray(s.weFinnish) && s.weFinnish.length > 0) {
    events.push({
      date: 'אחרונה',
      label: 'המוכר.ים אישרו מסירה',
      desc: `${s.weFinnish.length} אישורי מסירה`,
      status: 'done'
    });
  }
  if (s.iGotIt) {
    events.push({
      date: 'אחרונה',
      label: 'הלקוח אישר קבלה',
      desc: 'הלקוח דיווח שהמוצר התקבל',
      status: 'done'
    });
  }
  if (s.iTransferMoney && !s.moneyTransfered) {
    events.push({
      date: 'עכשיו',
      label: 'העברת כסף בתהליך',
      desc: 'הלקוח התחיל את ההעברה, ממתין לאישור המקבל',
      status: 'active'
    });
  }
  if (s.moneyTransfered) {
    events.push({
      date: 'אחרונה',
      label: 'הכסף התקבל',
      desc: 'מקבל הכסף אישר את הקבלה',
      status: 'done'
    });
  }
  if (s.finnishDate) {
    const isFuture = new Date(s.finnishDate).getTime() > Date.now();
    events.push({
      date: formatDate(s.finnishDate),
      label: 'מועד סיום',
      desc: s.kindOf === 'monthly' || s.kindOf === 'yearly' ? 'סוף תקופת המינוי' : 'מועד סיום מתוכנן',
      status: isFuture ? 'future' : 'done'
    });
  }
  return events;
}

function buildMessages(s: SaleData): ForumMessage[] {
  if (!Array.isArray(s.messages)) return [];
  return s.messages.map((m: any) => {
    const username = m.username || 'משתמש';
    const isMine = String(m.userId) === String(s.myid);
    return {
      id: String(m.id),
      author: isMine ? 'אתה' : username,
      initials: initials(isMine ? username : username),
      authorType: isMine ? 'client' : 'creator',
      content: m.content || '',
      timeAgo: formatDate(m.createdAt)
    };
  });
}

function buildParties(s: SaleData, kind: DealKind): Party[] {
  const parties: Party[] = [];
  const myId = String(s.myid || '');

  parties.push({
    name:
      String(s.customerId) === myId
        ? `${s.customerName || 'אתה'} (אתה · לקוח)`
        : `${s.customerName || 'לקוח'} (לקוח)`,
    initials: initials(s.customerName || 'לקוח'),
    role: kind === 'purchase' ? 'אתה הלקוח' : 'הלקוח של העסקה',
    avatarStyle: pickAvatarStyle(String(s.customerId || s.customerName || 'c')),
    status: 'active'
  });

  const members = Array.isArray((s as any).members) ? (s as any).members : [];
  for (const m of members) {
    if (!m?.id) continue;
    const isMe = String(m.id) === myId;
    parties.push({
      name: isMe ? `${m.username || 'אתה'} (אתה · מוכר)` : m.username || 'חבר צוות',
      initials: initials(m.username || ''),
      role: isMe ? 'אתה במוכר' : 'חבר/ת צוות הפרויקט',
      avatarStyle: pickAvatarStyle(String(m.id)),
      status: 'active'
    });
  }

  return parties;
}

function buildPendingApprovals(s: SaleData, kind: DealKind): PendingApproval[] {
  const approvals: PendingApproval[] = [];

  if (kind === 'purchase') {
    if (!s.iGotIt && Array.isArray(s.weFinnish) && s.weFinnish.length > 0) {
      approvals.push({
        id: `recv-${s.id}`,
        name: `אישור קבלת ${s.name || 'המוצר'}`,
        type: 'resource',
        cost: s.total || s.price || 0
      });
    }
  } else {
    const alreadyVoted = Array.isArray(s.weFinnish)
      ? s.weFinnish.some(
          (v: any) => String(v?.users_permissions_user?.data?.id) === String(s.myid)
        )
      : false;
    if (!alreadyVoted) {
      approvals.push({
        id: `deliver-${s.id}`,
        name: `אישור משלוח של ${s.name || 'המוצר'}`,
        type: 'mission',
        cost: s.total || s.price || 0
      });
    }
  }

  return approvals;
}

export function saleToDeal(s: SaleData, kind: DealKind): Deal & {
  kind: DealKind;
  sheirutId: string;
} {
  const total = Number(s.total) || Number(s.price) || 0;
  const paid = s.moneyTransfered ? total : 0;
  const kindOfKey = String(s.kindOf || 'total').toLowerCase();

  return {
    id: String(s.id),
    sheirutId: String(s.id),
    kind,
    product: s.name || 'מוצר',
    project: s.projectName || 'פרויקט',
    category: KIND_CATEGORY[kindOfKey] || 'מכירה',
    icon: KIND_ICON[kindOfKey] || '🎁',
    iconBg: KIND_BG[kindOfKey] || 'linear-gradient(135deg,#1a1200,#2e2000)',
    status: computeStatus(s, kind),
    missions: { done: 0, inProgress: 0, total: 0 },
    hours: { done: 0, total: 0 },
    resources: { done: s.iGotIt ? 1 : 0, total: 1 },
    totalCost: total,
    paid,
    startDate: formatDate(s.startDate),
    endDate: formatDate(s.finnishDate),
    pendingApprovalCount: buildPendingApprovals(s, kind).length,
    progressPct: computeProgress(s)
  };
}

export function saleToDealDetail(
  s: SaleData,
  kind: DealKind
): DealDetailData & { kind: DealKind; sheirutId: string; raw: SaleData } {
  const base = saleToDeal(s, kind);
  const total = base.totalCost;

  const productResource: Resource = {
    id: `product-${s.id}`,
    name: s.name || 'המוצר',
    cost: total,
    maxCost: total,
    needsApproval: kind === 'purchase' && !s.iGotIt
  };

  const missionList: Mission[] = [];

  return {
    ...base,
    missionList,
    resourceList: [productResource],
    timeline: buildTimeline(s),
    messages: buildMessages(s),
    parties: buildParties(s, kind),
    pendingApprovals: buildPendingApprovals(s, kind),
    costBreakdown: { missions: 0, resources: total },
    raw: s
  };
}

export function salesToStats(items: Array<SaleData>): DashboardStats {
  let activeDeals = 0;
  let completedDeals = 0;
  let totalCost = 0;
  let totalPaid = 0;
  let pendingApprovals = 0;

  for (const s of items) {
    const total = Number(s.total) || Number(s.price) || 0;
    totalCost += total;
    if (s.moneyTransfered) totalPaid += total;

    const isDone = s.moneyTransfered && (s.productExepted || s.iGotIt);
    if (isDone) completedDeals++;
    else activeDeals++;

    if (!s.iGotIt && Array.isArray(s.weFinnish) && s.weFinnish.length > 0) {
      pendingApprovals++;
    }
  }

  return { activeDeals, completedDeals, totalCost, totalPaid, pendingApprovals };
}
