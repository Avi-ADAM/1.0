<!-- src/lib/components/prPr/kanban/KanbanBoard.svelte -->
<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

  interface RawItem {
    id: string;
    attributes: Record<string, any>;
  }

  interface CardItem {
    id: string;
    name: string;
    // click resolution (may differ from column kind for acts)
    clickId: string;
    clickKind: string;
    // column placement
    kind: string;
    colId: string;
    // distinguishes missions from acts
    itemType: 'mission' | 'act';
    // mission fields
    hours?: number;
    perhour?: number;
    // act fields
    assignee?: string;
    assigneePic?: string;
    createdBy?: string;
    dateS?: string;
    dateF?: string;
    pendingApproval?: boolean; // assigned but myIshur=false
    pendingValidation?: boolean; // naasa=true but valiIshur=false
    isCompleted?: boolean;
    progress?: number; // 0-100 from status field
    rawAct?: Record<string, any>;
  }

  interface KanbanColumn {
    id: string;
    title: { he: string; en: string };
    accent: string;
    glow: string;
    dotColor: string;
    ringColor: string;
    kind: string;
    items: CardItem[];
  }

  let {
    openMissions = [],
    pendingMissions = [],
    inProgressMissions = [],
    finishedMissions = [],
    acts = [],
    onMissionMoved = null,
    onCardClick = null,
    onActClick = null
  }: {
    openMissions?: RawItem[];
    pendingMissions?: RawItem[];
    inProgressMissions?: RawItem[];
    finishedMissions?: RawItem[];
    acts?: RawItem[];
    onMissionMoved?: ((e: object) => void) | null;
    onCardClick?: ((e: { id: string; kind: string }) => void) | null;
    onActClick?: ((act: Record<string, any>) => void) | null;
  } = $props();

  /* ׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬
     Mission normalisation
  ׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬ */
  function normMissions(
    missions: RawItem[],
    kind: string,
    colId: string,
    nameKey = 'name'
  ): CardItem[] {
    return missions.map((m) => ({
      id: m.id,
      name:
        m.attributes[nameKey] ??
        m.attributes.name ??
        m.attributes.missionName ??
        '',
      hours:
        m.attributes.noofhours ??
        m.attributes.hoursassinged ??
        m.attributes.total,
      perhour: m.attributes.perhour,
      kind,
      clickId: m.id,
      clickKind: kind,
      colId,
      itemType: 'mission' as const
    }));
  }

  /* ׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬
     Act normalisation
     Column is derived from approval workflow state:
       open     ׳’ג€ ג€™ unassigned (no my.data)
       pending  ׳’ג€ ג€™ assigned, myIshur=false
       progress ׳’ג€ ג€™ myIshur=true OR naasa=true but valiIshur=false
       done     ׳’ג€ ג€™ naasa && valiIshur
  ׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬ */
  function getActColId(attr: Record<string, any>): string {
    if (attr.naasa && attr.valiIshur) return 'done';
    if (attr.myIshur || (attr.naasa && !attr.valiIshur)) return 'progress';
    if (attr.isAssigned && (attr.my?.data?.length ?? 0) > 0) return 'pending';
    return 'open';
  }

  /**
   * Mirrors handleTaskClick logic from actsTable.svelte:
   * linked mesimabetahalich ׳’ג€ ג€™ 'betha'
   * linked open_mission     ׳’ג€ ג€™ 'openM'
   * linked pendm            ׳’ג€ ג€™ 'pendm'
   * else                    ׳’ג€ ג€™ 'assign' (opens ChooseM, a=9)
   */
  function resolveActClick(
    id: string,
    attr: Record<string, any>
  ): { id: string; kind: string } {
    const mid = attr.mesimabetahaliches?.data?.[0]?.id;
    const isOpen = attr.open_mission?.data?.id;
    const isPend = attr.pendm?.data?.id;
    if (mid) return { id: mid, kind: 'betha' };
    if (isOpen) return { id: isOpen, kind: 'openM' };
    if (isPend) return { id: isPend, kind: 'pendm' };
    return { id, kind: 'assign' };
  }

  const colKindMap: Record<string, string> = {
    open: 'openM',
    pending: 'pendm',
    progress: 'betha',
    done: 'done'
  };

  function normActs(rawActs: RawItem[]): CardItem[] {
    return rawActs.map((a) => {
      const attr = a.attributes ?? {};
      const colId = getActColId(attr);
      const click = resolveActClick(a.id, attr);
      const myUser = attr.my?.data?.[0]?.attributes;

      return {
        id: a.id,
        name: attr.shem ?? '׳’ג‚¬ג€',
        clickId: click.id,
        clickKind: click.kind,
        kind: colKindMap[colId],
        colId,
        itemType: 'act' as const,
        assignee: myUser?.username,
        assigneePic: myUser?.profilePic?.data?.attributes?.url,
        createdBy: attr.vali?.data?.attributes?.username,
        dateS: attr.dateS,
        dateF: attr.dateF,
        progress: attr.status ?? 0,
        pendingApproval:
          attr.isAssigned && (attr.my?.data?.length ?? 0) > 0 && !attr.myIshur,
        pendingValidation: !!attr.naasa && !attr.valiIshur,
        isCompleted: !!attr.naasa && !!attr.valiIshur,
        rawAct: {
          id: a.id,
          ...attr,
          vali: attr.vali || { data: null },
          my: attr.my || { data: [] },
          mesimabetahaliches: attr.mesimabetahaliches || { data: [] },
          tafkidims: attr.tafkidims || { data: [] }
        }
      };
    });
  }

  /* ׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬
     Columns state
  ׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬׳’ג€ג‚¬ */
  let columns: KanbanColumn[] = $state([
    {
      id: 'open',
      title: { he: 'פתוחות', en: 'Open' },
      accent: 'border-emerald-400/60 text-emerald-400',
      glow: 'bg-emerald-500/5',
      dotColor: 'bg-emerald-400',
      ringColor: 'ring-emerald-400/50',
      kind: 'openM',
      items: []
    },
    {
      id: 'pending',
      title: { he: 'ממתין לאישור', en: 'Pending' },
      accent: 'border-amber-400/60 text-amber-400',
      glow: 'bg-amber-500/5',
      dotColor: 'bg-amber-400',
      ringColor: 'ring-amber-400/50',
      kind: 'pendm',
      items: []
    },
    {
      id: 'progress',
      title: { he: 'בתהליך', en: 'In Progress' },
      accent: 'border-sky-400/60 text-sky-400',
      glow: 'bg-sky-500/5',
      dotColor: 'bg-sky-400',
      ringColor: 'ring-sky-400/50',
      kind: 'betha',
      items: []
    },
    {
      id: 'done',
      title: { he: 'הושלמו', en: 'Done' },
      accent: 'border-fuchsia-400/60 text-fuchsia-400',
      glow: 'bg-fuchsia-500/5',
      dotColor: 'bg-fuchsia-400',
      ringColor: 'ring-fuchsia-400/50',
      kind: 'done',
      items: []
    }
  ]);

  /* Sync props ׳’ג€ ג€™ local state, missions first then acts in each column */
  $effect(() => {
    const allActs = normActs(acts);
    columns[0].items = [
      ...normMissions(openMissions, 'openM', 'open', 'name'),
      ...allActs.filter((a) => a.colId === 'open')
    ];
    columns[1].items = [
      ...normMissions(pendingMissions, 'pendm', 'pending', 'name'),
      ...allActs.filter((a) => a.colId === 'pending')
    ];
    columns[2].items = [
      ...normMissions(inProgressMissions, 'betha', 'progress', 'name'),
      ...allActs.filter((a) => a.colId === 'progress')
    ];
    columns[3].items = [
      ...normMissions(finishedMissions, 'done', 'done', 'missionName'),
      ...allActs.filter((a) => a.colId === 'done')
    ];
  });

  let totalMissions = $derived(
    openMissions.length +
      pendingMissions.length +
      inProgressMissions.length +
      finishedMissions.length
  );
  let totalActs = $derived(acts.length);
  let isRtl = $derived($lang === 'he');

  let dragging: { item: CardItem; fromColId: string } | null = $state(null);
  let dragOverColId: string | null = $state(null);

  function onDragStart(item: CardItem, colId: string) {
    dragging = { item, fromColId: colId };
  }

  function onDragOver(e: DragEvent, colId: string) {
    e.preventDefault();
    dragOverColId = colId;
  }
  function onDragLeave(e: DragEvent) {
    const related = e.relatedTarget as HTMLElement | null;
    if (!related?.closest?.(`[data-col="${dragOverColId}"]`))
      dragOverColId = null;
  }
  function onDrop(e: DragEvent, toColId: string) {
    e.preventDefault();
    dragOverColId = null;
    if (!dragging || dragging.fromColId === toColId) {
      dragging = null;
      return;
    }
    moveItem(dragging.item, dragging.fromColId, toColId);
    dragging = null;
  }
  function onDragEnd() {
    dragging = null;
    dragOverColId = null;
  }

  let selectedCard: CardItem | null = $state(null);
  let showMoveSheet = $state(false);

  function isCoarse() {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches
    );
  }
  function onCardTap(item: CardItem) {
    /*if (isCoarse() && item.colId !== 'done') {
      selectedCard = item;
      showMoveSheet = true;
    } else */
    fireCardClick(item);
  }
  function closeMoveSheet() {
    selectedCard = null;
    showMoveSheet = false;
  }
  function moveToCol(toColId: string) {
    if (!selectedCard) return;
    moveItem(selectedCard, selectedCard.colId, toColId);
    closeMoveSheet();
  }
  function fireCardClick(item: CardItem) {
    if (item.itemType === 'act' && item.rawAct) {
      onActClick?.(item.rawAct);
      return;
    }
    if (onCardClick) onCardClick({ id: item.clickId, kind: item.clickKind });
  }

  function moveItem(item: CardItem, fromColId: string, toColId: string) {
    const fromCol = columns.find((c) => c.id === fromColId);
    const toCol = columns.find((c) => c.id === toColId);
    if (!fromCol || !toCol) return;

    // unique by id+type (acts and missions can share numeric ids)
    fromCol.items = fromCol.items.filter(
      (i) => !(i.id === item.id && i.itemType === item.itemType)
    );
    toCol.items = [
      ...toCol.items,
      { ...item, colId: toColId, kind: toCol.kind }
    ];
    columns = [...columns];

    onMissionMoved?.({
      missionId: item.id,
      itemType: item.itemType, // 'mission' | 'act' ׳’ג‚¬ג€ parent uses this to pick mutation
      sourceCol: fromColId,
      destCol: toColId,
      sourceKind: item.kind,
      destKind: toCol.kind
    });
  }

  const i18n = {
    empty: { he: 'ריק - גרור לכאן', en: 'Empty - drop here' },
    moveTo: { he: 'העבר לעמודה:', en: 'Move to column:' },
    cancel: { he: 'ביטול', en: 'Cancel' },
    click: { he: 'לחץ לפרטים', en: 'Tap for details' },
    task: { he: 'מטלה', en: 'Task' },
    mission: { he: 'משימה', en: 'Mission' },
    pendApproval: { he: 'ממתין לאישור', en: 'Pending approval' },
    pendValidation: { he: 'ממתין לאימות', en: 'Pending validation' },
    scrollHint: { he: 'גלול בין כל העמודות', en: 'Scroll between all columns' },
    missions: { he: 'משימות', en: 'missions' },
    tasks: { he: 'מטלות', en: 'tasks' },
    next: { he: 'הבא', en: 'Next' },
    back: { he: 'הקודם', en: 'Back' }
  } as const;

  function fmtDate(iso?: string) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    } catch {
      return '';
    }
  }

  let trackEl: HTMLDivElement | null = $state(null);
  let canScrollBack = $state(false);
  let canScrollForward = $state(false);

  function getColumnElements(): HTMLDivElement[] {
    if (!trackEl) return [];
    return Array.from(trackEl.querySelectorAll('.kanban-col'));
  }

  function updateScrollControls() {
    if (!trackEl) {
      canScrollBack = false;
      canScrollForward = false;
      return;
    }

    const columns = getColumnElements();
    if (columns.length === 0) {
      canScrollBack = false;
      canScrollForward = false;
      return;
    }

    const trackRect = trackEl.getBoundingClientRect();
    const tolerance = 12;

    if (isRtl) {
      // In RTL, "back" (right-to-left scroll) means items are to the right of the track
      // "forward" (left-to-right scroll) means items are to the left of the track
      canScrollBack = columns.some(
        (col) => col.getBoundingClientRect().right > trackRect.right + tolerance
      );
      canScrollForward = columns.some(
        (col) => col.getBoundingClientRect().left < trackRect.left - tolerance
      );
    } else {
      canScrollBack = columns.some(
        (col) => col.getBoundingClientRect().left < trackRect.left - tolerance
      );
      canScrollForward = columns.some(
        (col) => col.getBoundingClientRect().right > trackRect.right + tolerance
      );
    }
  }

  function scrollColumns(direction: 'back' | 'forward') {
    if (!trackEl) return;

    const columns = getColumnElements();
    if (columns.length === 0) return;

    const trackRect = trackEl.getBoundingClientRect();
    const tolerance = 12;

    let target: HTMLDivElement | undefined;

    if (isRtl) {
      if (direction === 'forward') {
        // Forward in RTL means scrolling to the left (next column)
        target = columns.find(
          (col) => col.getBoundingClientRect().left < trackRect.left - tolerance
        );
      } else {
        // Back in RTL means scrolling to the right (previous column)
        target = [...columns]
          .reverse()
          .find(
            (col) =>
              col.getBoundingClientRect().right > trackRect.right + tolerance
          );
      }
    } else {
      if (direction === 'forward') {
        target = columns.find(
          (col) =>
            col.getBoundingClientRect().right > trackRect.right + tolerance
        );
      } else {
        target = [...columns]
          .reverse()
          .find(
            (col) =>
              col.getBoundingClientRect().left < trackRect.left - tolerance
          );
      }
    }

    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: isRtl ? 'end' : 'start'
    });
  }

  $effect(() => {
    trackEl;
    columns;
    updateScrollControls();
  });

  $effect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => updateScrollControls();
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  });
</script>

{#if showMoveSheet && selectedCard}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
    onclick={closeMoveSheet}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="w-full max-w-lg rounded-t-3xl border-t border-x border-slate-600/50
             bg-gradient-to-b from-slate-800 to-slate-900 p-6 pb-10 shadow-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="mx-auto w-10 h-1 rounded-full bg-slate-600 mb-5"></div>

      <!-- Type pill -->
      <div class="flex justify-center mb-2">
        {#if selectedCard.itemType === 'act'}
          <span
            class="text-[10px] font-bold uppercase tracking-wider
                       bg-orange-500/20 text-orange-400 border border-orange-500/30
                       rounded-full px-2.5 py-0.5">{i18n.task[$lang]}</span
          >
        {:else}
          <span
            class="text-[10px] font-bold uppercase tracking-wider
                       bg-barbi/20 text-barbi border border-barbi/30
                       rounded-full px-2.5 py-0.5">{i18n.mission[$lang]}</span
          >
        {/if}
      </div>

      <p class="text-gold font-bold text-center text-base mb-1 truncate px-4">
        {selectedCard.name}
      </p>
      <p class="text-slate-400 text-sm text-center mb-5">
        {i18n.moveTo[$lang]}
      </p>

      <div class="grid grid-cols-2 gap-3">
        {#each columns.filter((c) => c.id !== selectedCard?.colId && c.id !== 'done') as col}
          <button
            class="py-3 px-4 rounded-xl border font-semibold text-sm
                   transition-all active:scale-95 {col.accent} bg-slate-700/40 hover:bg-slate-600/40"
            onclick={() => moveToCol(col.id)}
          >
            <span
              class="inline-block w-2 h-2 rounded-full {col.dotColor} me-1.5 opacity-80"
            ></span>
            {col.title[$lang]}
          </button>
        {/each}
      </div>

      <button
        class="w-full mt-4 py-2 rounded-xl text-slate-400 text-sm
               hover:text-slate-200 hover:bg-slate-700/40 transition-colors"
        onclick={closeMoveSheet}>{i18n.cancel[$lang]}</button
      >
    </div>
  </div>
{/if}

<div class="kanban-root w-full" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
  <!-- Stats / legend bar -->
  <div
    class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-4 px-2 text-xs"
  >
    {#each columns as col}
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full {col.dotColor}"></span>
        <span class="text-slate-400">{col.title[$lang]}</span>
        <span class="font-bold {col.accent.split(' ')[1]}"
          >{col.items.length}</span
        >
      </div>
    {/each}
    <span class="text-slate-700 hidden sm:inline">|</span>
    <span class="inline-flex items-center gap-1 text-slate-500">
      <span class="w-1.5 h-1.5 rounded-sm bg-barbi/70"></span>
      {totalMissions}
      {i18n.missions[$lang]}
    </span>
    {#if totalActs > 0}
      <span class="inline-flex items-center gap-1 text-slate-500">
        <span class="w-1.5 h-1.5 rounded-sm bg-orange-400/70"></span>
        {totalActs}
        {i18n.tasks[$lang]}
      </span>
    {/if}
  </div>

  <div class="mb-3 flex items-center justify-center gap-2 md:gap-3">
    {#if isRtl}
      <button
        type="button"
        dir="ltr"
        class="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
        onclick={() => scrollColumns('back')}
        disabled={!canScrollBack}
        aria-label={$lang === 'he'
          ? 'גלול לעמודה הקודמת'
          : 'Scroll to previous column'}
      >
        <span dir="rtl">{i18n.back[$lang]}</span>

        <svg
          class="h-3 w-3 shrink-0"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M8 4l6 6-6 6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        dir="ltr"
        class="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
        onclick={() => scrollColumns('forward')}
        disabled={!canScrollForward}
        aria-label={$lang === 'he'
          ? 'גלול לעמודה הבאה'
          : 'Scroll to next column'}
      >
        <svg
          class="h-3 w-3 shrink-0"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M12 4l-6 6 6 6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span dir="rtl">{i18n.next[$lang]}</span>
      </button>
    {:else}
      <button
        type="button"
        dir="ltr"
        class="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
        onclick={() => scrollColumns('back')}
        disabled={!canScrollBack}
        aria-label="Scroll to previous column"
      >
        <svg
          class="h-3 w-3 shrink-0"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M12 4l-6 6 6 6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Prev</span>
      </button>
      <button
        type="button"
        dir="ltr"
        class="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
        onclick={() => scrollColumns('forward')}
        disabled={!canScrollForward}
        aria-label="Scroll to next column"
      >
        <span>Next</span>
        <svg
          class="h-3 w-3 shrink-0"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M8 4l6 6-6 6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    {/if}
  </div>

  <!-- Column track -->
  <div
    class="kanban-track flex gap-4 overflow-x-auto pb-4 px-4 sm:px-2 snap-x snap-mandatory"
    bind:this={trackEl}
    onscroll={updateScrollControls}
  >
    {#each columns as col (col.id)}
      {@const isOver = dragOverColId === col.id}
      {@const missionCount = col.items.filter(
        (i) => i.itemType === 'mission'
      ).length}
      {@const actCount = col.items.filter((i) => i.itemType === 'act').length}

      <div
        data-col={col.id}
        class="kanban-col flex-shrink-0 w-[85vw] sm:w-[22rem] max-h-[78vh] overflow-hidden snap-center flex flex-col rounded-2xl border
               transition-all duration-200
               {col.accent} {col.glow}
               {isOver
          ? `ring-2 ${col.ringColor} scale-[1.015] shadow-xl shadow-current/10`
          : ''}"
        ondragover={(e) => onDragOver(e, col.id)}
        ondragleave={onDragLeave}
        ondrop={(e) => onDrop(e, col.id)}
        role="region"
        aria-label={col.title[$lang]}
      >
        <!-- Column header -->
        <div class="flex items-center justify-between px-3 pt-3 pb-2">
          <div class="flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full {col.dotColor}
                         {isOver ? 'animate-pulse' : ''}"
            ></span>
            <h3 class="font-bold text-sm {col.accent.split(' ')[1]}">
              {col.title[$lang]}
            </h3>
          </div>

          <div class="group/badge relative">
            <span
              class="text-[11px] font-semibold bg-slate-700/70 rounded-full
                          px-2 py-0.5 text-slate-300 tabular-nums cursor-default"
            >
              {col.items.length}
            </span>
            {#if missionCount > 0 && actCount > 0}
              <div
                class="absolute end-0 top-6 hidden group-hover/badge:flex flex-col gap-0.5
                           bg-slate-800 border border-slate-600/60 rounded-lg
                           px-2.5 py-1.5 shadow-xl z-10 w-max text-[10px]"
              >
                <span class="text-slate-300 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-sm bg-barbi/80"></span>
                  {missionCount}
                  {i18n.missions[$lang]}
                </span>
                <span class="text-slate-300 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-sm bg-orange-400/80"></span>
                  {actCount}
                  {i18n.tasks[$lang]}
                </span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Divider -->
        <div class="mx-3 h-px bg-current opacity-10 mb-2"></div>

        <!-- Cards -->
        <div
          class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto d px-2 pb-3"
        >
          {#each col.items as item (item.itemType + '-' + item.id)}
            {@const isDraggingThis =
              dragging?.item.id === item.id &&
              dragging?.item.itemType === item.itemType}
            {@const isAct = item.itemType === 'act'}

            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
            <div
              class="kanban-card shrink-0 group relative rounded-xl overflow-hidden
                     bg-slate-800/80 border p-3 cursor-pointer select-none
                     hover:shadow-md hover:shadow-current/10
                     hover:-translate-y-0.5 active:scale-[0.98]
                     transition-all duration-200
                     {col.accent.split(' ')[1]}
                     {isAct
                ? 'border-orange-500/25 hover:border-orange-500/55'
                : 'border-slate-700/40 hover:border-current/50'}
                     {isDraggingThis
                ? 'opacity-30 scale-95 pointer-events-none'
                : ''}"
              draggable={col.kind !== 'done' ? 'true' : 'false'}
              ondragstart={() => onDragStart(item, col.id)}
              ondragend={onDragEnd}
              onclick={() => onCardTap(item)}
              role="button"
              tabindex="0"
              onkeypress={(e) => e.key === 'Enter' && fireCardClick(item)}
              title={col.kind !== 'done' ? i18n.click[$lang] : item.name}
            >
              <!-- Accent stripe: barbi for missions, orange for acts -->
              <div
                class="absolute top-0 start-0 end-0 h-0.5 transition-opacity duration-200
                           {isAct
                  ? 'bg-orange-400 opacity-40 group-hover:opacity-90'
                  : 'bg-current    opacity-25 group-hover:opacity-70'}"
              ></div>

              <!-- Header row: type badge + action icon -->
              <div class="flex items-center justify-between gap-1 mb-1.5">
                {#if isAct}
                  <span
                    class="shrink-0 text-[9px] font-bold uppercase tracking-wider
                               bg-orange-500/15 text-orange-400 border border-orange-500/25
                               rounded-full px-1.5 py-px leading-tight"
                  >
                    {i18n.task[$lang]}
                  </span>
                {:else}
                  <span
                    class="shrink-0 text-[9px] font-bold uppercase tracking-wider
                               bg-barbi/15 text-barbi border border-barbi/25
                               rounded-full px-1.5 py-px leading-tight"
                  >
                    {i18n.mission[$lang]}
                  </span>
                {/if}

                <!-- Done ׳’ֲג€ or drag handle -->
                {#if col.kind === 'done'}
                  <svg
                    class="w-3.5 h-3.5 shrink-0 opacity-50
                               {isAct ? 'text-orange-400' : 'text-fuchsia-400'}"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                    />
                  </svg>
                {:else}
                  <!-- desktop drag handle -->
                  <div
                    class="shrink-0 opacity-0 group-hover:opacity-25 transition-opacity hidden md:block"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                      />
                    </svg>
                  </div>
                {/if}
              </div>

              <!-- Name -->
              <p
                class="text-sm font-semibold text-slate-100 leading-snug line-clamp-2 mb-2"
              >
                {item.name}
              </p>

              {#if !isAct}
                <div class="flex items-center gap-2 flex-wrap">
                  {#if item.hours}
                    <span
                      class="inline-flex items-center gap-1 text-[11px] text-slate-400
                                 bg-slate-700/50 rounded-full px-2 py-0.5"
                    >
                      <svg
                        class="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                        />
                      </svg>
                      {item.hours}{item.perhour ? `×${item.perhour}₪` : 'h'}
                    </span>
                  {/if}
                  <span class="text-[10px] text-slate-600 ms-auto tabular-nums"
                    >#{item.id}</span
                  >
                </div>
              {:else}
                <div class="flex flex-col gap-1.5">
                  <!-- Assignee -->
                  {#if item.assignee}
                    <div class="flex items-center gap-1.5">
                      {#if item.assigneePic}
                        <img
                          src={item.assigneePic}
                          alt={item.assignee}
                          class="w-4 h-4 rounded-full object-cover ring-1 ring-orange-400/40"
                        />
                      {:else}
                        <span
                          class="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400
                                     flex items-center justify-center text-[8px] font-bold
                                     ring-1 ring-orange-500/30"
                        >
                          {item.assignee.charAt(0).toUpperCase()}
                        </span>
                      {/if}
                      <span class="text-[11px] text-slate-400 truncate"
                        >{item.assignee}</span
                      >
                    </div>
                  {/if}

                  <!-- Date -->
                  {#if item.dateS || item.dateF}
                    <div
                      class="flex items-center gap-1 text-[10px] text-slate-500"
                    >
                      <svg
                        class="w-2.5 h-2.5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"
                        />
                      </svg>
                      {fmtDate(item.dateS)}{item.dateF
                        ? ` → ${fmtDate(item.dateF)}`
                        : ''}
                    </div>
                  {/if}

                  <!-- Progress bar -->
                  {#if (item.progress ?? 0) > 0}
                    <div class="w-full bg-slate-700/60 rounded-full h-1">
                      <div
                        class="h-1 rounded-full bg-orange-400/70 transition-all duration-500"
                        style="width: {item.progress}%"
                      ></div>
                    </div>
                  {/if}

                  <!-- Approval state chips -->
                  <div class="flex flex-wrap gap-1">
                    {#if item.pendingApproval}
                      <span
                        class="text-[9px] bg-amber-500/15 text-amber-400
                                   border border-amber-500/25 rounded-full px-1.5 py-px leading-tight"
                      >
                        ⏳ {i18n.pendApproval[$lang]}
                      </span>
                    {/if}
                    {#if item.pendingValidation}
                      <span
                        class="text-[9px] bg-sky-500/15 text-sky-400
                                   border border-sky-500/25 rounded-full px-1.5 py-px leading-tight"
                      >
                        🔍 {i18n.pendValidation[$lang]}
                      </span>
                    {/if}
                  </div>

                  <span class="text-[10px] text-slate-600 self-end tabular-nums"
                    >#{item.id}</span
                  >
                </div>
              {/if}

              <!-- Mobile tap hint -->
              {#if col.kind !== 'done'}
                <div
                  class="absolute bottom-1 end-2 text-[9px] text-slate-700 md:hidden
                            group-active:text-current transition-colors"
                >
                  ⠿
                </div>
              {/if}
            </div>
          {:else}
            <div class="flex-1 flex items-center justify-center">
              <div
                class="text-center py-8 border-2 border-dashed border-slate-700/50
                          rounded-xl mx-1 w-full
                          {isOver ? 'border-current/40 bg-current/5' : ''}
                          transition-all duration-200"
              >
                <div class="text-2xl mb-1 opacity-25">
                  {col.id === 'done'
                    ? '✓'
                    : col.id === 'open'
                      ? '○'
                      : col.id === 'pending'
                        ? '◎'
                        : '●'}
                </div>
                <p class="text-slate-600 text-xs">{i18n.empty[$lang]}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <p class="text-center text-[11px] text-slate-700 mt-1 md:hidden select-none">
    {i18n.scrollHint[$lang]}
  </p>
</div>

<style>
  .kanban-track {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    scroll-padding-inline: 0.5rem;
    touch-action: pan-x;
  }
  .kanban-track::-webkit-scrollbar {
    display: none;
  }

  .kanban-col > :last-child {
    touch-action: pan-y;
  }

  @media (min-width: 1100px) {
    .kanban-track {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      overflow-x: visible;
    }
    .kanban-col {
      width: auto !important;
    }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .kanban-card[draggable='true']:active {
    cursor: grabbing;
  }
</style>
