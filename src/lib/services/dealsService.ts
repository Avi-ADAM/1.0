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

/** Translator callback (`$t` from `$lib/translations`), passed in by the page so this module stays pure. */
export type TranslateFn = (key: string, payload?: Record<string, any>) => string;

/** Fallback when a caller has no translator: the key itself, never Hebrew on an English screen. */
const identityT: TranslateFn = (key) => key;

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
  monthly: 'deals.kindMonthly',
  yearly: 'deals.kindYearly',
  total: 'deals.kindTotal',
  unlimited: 'deals.kindUnlimited',
  daily: 'deals.kindDaily'
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

function buildTimeline(s: SaleData, t: TranslateFn): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  if (s.startDate) {
    events.push({
      date: formatDate(s.startDate),
      label: t('deals.service.tlStart'),
      desc: t('deals.service.tlStartDesc'),
      status: 'done'
    });
  }
  if (Array.isArray(s.weFinnish) && s.weFinnish.length > 0) {
    events.push({
      date: t('deals.service.last'),
      label: t('deals.service.tlDelivered'),
      desc: t('deals.service.tlDeliveredDesc', { count: s.weFinnish.length }),
      status: 'done'
    });
  }
  if (s.iGotIt) {
    events.push({
      date: t('deals.service.last'),
      label: t('deals.service.tlReceived'),
      desc: t('deals.service.tlReceivedDesc'),
      status: 'done'
    });
  }
  if (s.iTransferMoney && !s.moneyTransfered) {
    events.push({
      date: t('deals.service.now'),
      label: t('deals.service.tlTransfer'),
      desc: t('deals.service.tlTransferDesc'),
      status: 'active'
    });
  }
  if (s.moneyTransfered) {
    events.push({
      date: t('deals.service.last'),
      label: t('deals.service.tlMoneyIn'),
      desc: t('deals.service.tlMoneyInDesc'),
      status: 'done'
    });
  }
  if (s.finnishDate) {
    const isFuture = new Date(s.finnishDate).getTime() > Date.now();
    events.push({
      date: formatDate(s.finnishDate),
      label: t('deals.service.tlEnd'),
      desc:
        s.kindOf === 'monthly' || s.kindOf === 'yearly'
          ? t('deals.service.tlEndSubPeriod')
          : t('deals.service.tlEndSubPlanned'),
      status: isFuture ? 'future' : 'done'
    });
  }
  return events;
}

function buildMessages(s: SaleData, t: TranslateFn): ForumMessage[] {
  if (!Array.isArray(s.messages)) return [];
  return s.messages.map((m: any) => {
    const username = m.username || t('deals.service.user');
    const isMine = String(m.userId) === String(s.myid);
    return {
      id: String(m.id),
      author: isMine ? t('deals.service.you') : username,
      initials: initials(isMine ? username : username),
      authorType: isMine ? 'client' : 'creator',
      content: m.content || '',
      timeAgo: formatDate(m.createdAt)
    };
  });
}

function buildParties(s: SaleData, kind: DealKind, t: TranslateFn): Party[] {
  const parties: Party[] = [];
  const myId = String(s.myid || '');

  parties.push({
    name:
      String(s.customerId) === myId
        ? `${s.customerName || t('deals.service.you')} ${t('deals.service.youCustomerSuffix')}`
        : `${s.customerName || t('deals.service.customer')} ${t('deals.service.customerSuffix')}`,
    initials: initials(s.customerName || t('deals.service.customer')),
    role: kind === 'purchase' ? t('deals.service.roleYouCustomer') : t('deals.service.roleCustomerOfDeal'),
    avatarStyle: pickAvatarStyle(String(s.customerId || s.customerName || 'c')),
    status: 'active'
  });

  const members = Array.isArray((s as any).members) ? (s as any).members : [];
  for (const m of members) {
    if (!m?.id) continue;
    const isMe = String(m.id) === myId;
    parties.push({
      name: isMe
        ? `${m.username || t('deals.service.you')} ${t('deals.service.youSellerSuffix')}`
        : m.username || t('deals.service.teamMember'),
      initials: initials(m.username || ''),
      role: isMe ? t('deals.service.roleYouSeller') : t('deals.service.roleProjectMember'),
      avatarStyle: pickAvatarStyle(String(m.id)),
      status: 'active'
    });
  }

  return parties;
}

function buildPendingApprovals(s: SaleData, kind: DealKind, t: TranslateFn): PendingApproval[] {
  const approvals: PendingApproval[] = [];

  if (kind === 'purchase') {
    if (!s.iGotIt && Array.isArray(s.weFinnish) && s.weFinnish.length > 0) {
      approvals.push({
        id: `recv-${s.id}`,
        name: t('deals.service.approveReceipt', { name: s.name || t('deals.service.theProduct') }),
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
        name: t('deals.service.approveDelivery', { name: s.name || t('deals.service.theProduct') }),
        type: 'mission',
        cost: s.total || s.price || 0
      });
    }
  }

  return approvals;
}

export function saleToDeal(
  s: SaleData,
  kind: DealKind,
  t: TranslateFn = identityT
): Deal & {
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
    product: s.name || t('deals.service.product'),
    project: s.projectName || t('deals.service.project'),
    category: KIND_CATEGORY[kindOfKey] ? t(KIND_CATEGORY[kindOfKey]) : t('deals.service.sale'),
    icon: KIND_ICON[kindOfKey] || '🎁',
    iconBg: KIND_BG[kindOfKey] || 'linear-gradient(135deg,#1a1200,#2e2000)',
    status: computeStatus(s, kind),
    missions: { done: 0, inProgress: 0, total: 0 },
    hours: { done: 0, total: 0 },
    resources: { done: s.iGotIt ? 1 : 0, total: 1 },
    currency: s.currency,
    totalCost: total,
    paid,
    startDate: formatDate(s.startDate),
    endDate: formatDate(s.finnishDate),
    pendingApprovalCount: buildPendingApprovals(s, kind, t).length,
    progressPct: computeProgress(s)
  };
}

export function saleToDealDetail(
  s: SaleData,
  kind: DealKind,
  t: TranslateFn = identityT
): DealDetailData & { kind: DealKind; sheirutId: string; raw: SaleData } {
  const base = saleToDeal(s, kind, t);
  const total = base.totalCost;

  const productResource: Resource = {
    id: `product-${s.id}`,
    name: s.name || t('deals.service.theProduct'),
    cost: total,
    maxCost: total,
    needsApproval: kind === 'purchase' && !s.iGotIt
  };

  const missionList: Mission[] = [];

  return {
    ...base,
    missionList,
    resourceList: [productResource],
    timeline: buildTimeline(s, t),
    messages: buildMessages(s, t),
    parties: buildParties(s, kind, t),
    pendingApprovals: buildPendingApprovals(s, kind, t),
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
