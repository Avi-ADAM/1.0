<script>
  import { onMount, onDestroy } from 'svelte';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { goto } from '$app/navigation';
  import { uPic } from '$lib/stores/uPic.js';
  import RichText from '$lib/celim/ui/richText.svelte';

  /** @type {{ data: { wish: any | null; proposals: any[]; loadOk: boolean; uid?: string; isOwner: boolean; enrichment?: any } }} */
  let { data } = $props();

  onMount(() => showFoot.set(false));
  onDestroy(() => showFoot.set(true));

  /* ===== Mock fallback (§8 of PLAN_CONCIERGE) — used when wish not loaded yet ===== */
  const MOCK_WISH_TEXT   = 'אני רוצה לארגן יום חופש לאמא שלי';
  const MOCK_WISH_LONG   = 'אמא שלי מטפלת בילדים כל יום ובקרוב יום הולדתה. אני רוצה לתת לה יום שלם משוחרר — טיפול ספא, ארוחה טובה, מישהי שתשגיח על הילדים, ובן אדם שיבטיח שתגיע ותחזור בשלום. מבקשת לארגן את הכל מראש בלי שתעשה אפילו פנייה אחת.';
  const MOCK_WISH_AVATAR = 'נב';
  const MOCK_WISH_AUTHOR = 'נעה ב.';
  const MOCK_WISH_CODE   = 'R-7f3a91';

  const MOCK_MISSIONS = [
    { name: 'בייביסיטר',    hours: 6,   imp: 'must' },
    { name: 'הסעה',          hours: 2,   imp: 'must' },
    { name: 'טיפול ספא',     hours: 2,   imp: 'must' },
    { name: 'הזמנת מסעדה',   hours: 0.5, imp: 'nice' },
  ];
  const MOCK_RESOURCES = [
    { name: 'מקום שקט וצמחי', qty: 1, imp: 'must' },
    { name: 'ארוחה לשניים',   qty: 2, imp: 'nice' },
    { name: 'זר פרחים',       qty: 1, imp: 'nice' },
  ];

  /* ===== Resolved (real if present, mock otherwise) ===== */
  const WISH_TEXT   = $derived(data?.wish?.name      ?? MOCK_WISH_TEXT);
  const WISH_LONG   = $derived(data?.wish?.longDes   ?? MOCK_WISH_LONG);
  const WISH_AVATAR = $derived(data?.wish?.ownerAvatar ?? MOCK_WISH_AVATAR);
  const WISH_AUTHOR = $derived(data?.wish?.ownerName   ?? MOCK_WISH_AUTHOR);
  const WISH_CODE   = $derived(data?.wish?.code        ?? MOCK_WISH_CODE);

  const MISSIONS = $derived(
    data?.wish?.extractedMissions?.length
      ? data.wish.extractedMissions.map((m) => ({
          name: m.name,
          hours: m.hoursEst ?? 0,
          imp: m.importance === 'must' ? 'must' : 'nice',
        }))
      : MOCK_MISSIONS
  );
  const RESOURCES = $derived(
    data?.wish?.extractedResources?.length
      ? data.wish.extractedResources.map((r) => ({
          name: r.name,
          qty: r.quantityEst ?? 1,
          imp: r.importance === 'must' ? 'must' : 'nice',
        }))
      : MOCK_RESOURCES
  );

  /* ===== Mock fallbacks (used when no real proposals are loaded yet) ===== */
  const MOCK_PLAN_ROWS = [
    {
      need: { title: 'טיפול ספא 2 שעות', detail: 'עיסוי גוף + פנים. עדיפות למטפלת אישה, אווירה שקטה, ללא מוזיקה רועשת.', kind: 'משימה', imp: 'must', hours: 2, bestPrice: 420 },
      providers: [
        { name: 'נועה גולן', project: 'ספא טבע · חיפה', avatar: 'נג', status: 'accepted', score: 0.91, hours: 2, price: 420, note: 'יש לי חלון פנוי ביום שישי 10:00. סוויטה הפרטית של עץ הזית.', badges: ['פה אחד 5/5', '142 דילים', '6 ק״מ'] },
        { name: 'רני שני',  project: 'ספא הנמל',        avatar: 'רש', status: 'matching', score: 0.74, hours: 2, price: 510, note: 'אני זמינה אבל רק בצהריים. אעדיף לתאם איתך ישירות.',       badges: ['חדשה ב־1💗1', '12 דילים'] },
      ],
    },
    {
      need: { title: 'בייביסיטר 6 שעות', detail: '2 ילדים, גילאי 4 ו־7. ארוחת צהריים והבאת/החזרת מהגן/בית הספר.', kind: 'משימה', imp: 'must', hours: 6, bestPrice: 360 },
      providers: [
        { name: 'תמר ל.',  project: 'אמהות עוזרות זו לזו', avatar: 'תל', status: 'accepted', score: 0.78, hours: 6, price: 360, note: 'אני אמא לילד באותו גן. אקח את הילדים אליי הביתה, אהיה שמחה לעזור.',                       badges: ['ערבות הדדית', '4 ילדים שלה', 'אישור הקהילה'] },
        { name: 'שני מ.',  project: 'אמהות עוזרות זו לזו', avatar: 'שמ', status: 'matching', score: 0.65, hours: 6, price: 400, note: 'אני מציעה להעביר אצלי בבית פעילות יצירה. מתאים גם לילדים שלא מכירים זה את זה.', badges: ['ערבות הדדית', '12 ימים פעילים החודש'] },
      ],
    },
    {
      need: { title: 'הסעה הלוך וחזור', detail: 'מהבית בקרית מוצקין לספא בנשר, חזרה בשעה 13:00.', kind: 'משימה', imp: 'must', hours: 2, bestPrice: 110 },
      providers: [
        { name: 'יואב כ.', project: 'Lift · הסעות בקהילה', avatar: 'יכ', status: 'pending', score: 0.72, hours: 2, price: 110, note: 'אני שם ממילא בבוקר. אקח ואחזיר ללא תשלום נוסף — רק דלק.', badges: ['פעמיים שותף מאחרת', 'דירוג 4.9'] },
      ],
    },
    {
      need: { title: 'ארוחה לשניים במסעדה', detail: 'מסעדה צמחונית קרובה. הזמנה ל־12:30, שלוש מנות.', kind: 'משאב', imp: 'nice', hours: null, bestPrice: 220 },
      providers: [],
    },
  ];

  const MOCK_HARMONY = [
    { id: 'me',   label: 'נב', state: 'accepted', isOwner: true },
    { id: 'spa',  label: 'נג', state: 'accepted' },
    { id: 'sit',  label: 'תל', state: 'accepted' },
    { id: 'lift', label: 'יכ', state: 'pending' },
  ];

  const MOCK_TOTAL_LINES = [
    { label: 'טיפול ספא',        provider: 'נועה גולן · ספא טבע',  price: 420, status: 'accepted' },
    { label: 'בייביסיטר 6 שעות', provider: 'תמר ל. · אמהות עוזרות', price: 360, status: 'accepted' },
    { label: 'הסעה הלוך וחזור',  provider: 'יואב כ. · Lift',       price: 110, status: 'pending'  },
    { label: 'ארוחה במסעדה',      provider: null,                   price: 0,   status: 'open'     },
  ];

  /* ===== Bridge real proposals + extracted_* → display shapes ===== */
  function proposalStatusToProviderStatus(s) {
    if (s === 'accepted') return 'accepted';
    if (s === 'rejected' || s === 'expired') return 'rejected';
    return 'matching';
  }
  function buildPlanRows(wish, proposals) {
    if (!wish) return [];
    const rows = [];

    const mkRow = (item, idx, kindHe, isResource) => {
      const providers = proposals
        .filter((p) => {
          const list = isResource ? p.coveredResources : p.coveredMissions;
          if (!list?.length) return false;
          return list.some((c) =>
            String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(idx)
            || String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(item.id)
          );
        })
        .map((p) => {
          const line = (isResource ? p.coveredResources : p.coveredMissions)
            .find((c) =>
              String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(idx)
              || String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(item.id)
            );
          return {
            proposalId: p.id,
            name: p.proposerName,
            project: p.proposerProject?.name || (p.matanot?.name ?? ''),
            avatar: p.proposerAvatar,
            status: proposalStatusToProviderStatus(p.status),
            rawStatus: p.status,
            score: p.matchScore ?? 0,
            hours: isResource ? null : (line?.hours ?? null),
            qty: isResource ? (line?.quantity ?? null) : null,
            price: line?.price ?? p.totalPrice ?? 0,
            note: '',
            badges: [
              p.autoGenerated ? 'התאמה אוטומטית' : 'יוזמה אישית',
              p.kind === 'existing_matanot' ? 'מוצר קיים' : p.kind === 'custom_offer' ? 'הצעה חדשה' : p.kind,
            ].filter(Boolean),
          };
        });

      const bestPrice = providers.reduce((min, pr) => (pr.price && (!min || pr.price < min) ? pr.price : min), null);

      return {
        need: {
          title: item.name + (item.hoursEst ? ` · ${item.hoursEst} שע׳` : item.quantityEst ? ` · ×${item.quantityEst}` : ''),
          rawName: item.name,
          detail: item.notes || '',
          kind: kindHe,
          isResource,
          linked: (isResource ? item.linkedMashaabims : item.linkedMissions) ?? [],
          imp: item.importance === 'must' ? 'must' : 'nice',
          hours: item.hoursEst ?? null,
          bestPrice,
        },
        providers,
      };
    };

    (wish.extractedMissions ?? []).forEach((m, i) => rows.push(mkRow(m, i, 'משימה', false)));
    (wish.extractedResources ?? []).forEach((r, i) => rows.push(mkRow(r, i, 'משאב', true)));
    return rows;
  }
  function buildHarmony(wish, proposals) {
    if (!wish) return [];
    const items = [{ id: 'owner', label: wish.ownerAvatar, state: 'accepted', isOwner: true }];
    proposals.forEach((p) => {
      items.push({
        id: `p-${p.id}`,
        label: p.proposerAvatar,
        state:
          p.status === 'accepted' ? 'accepted'
          : p.status === 'rejected' || p.status === 'expired' ? 'rejected'
          : 'pending',
      });
    });
    return items.filter((x) => x.state !== 'rejected');
  }
  function buildTotalLines(wish, proposals) {
    if (!wish) return [];
    const lines = [];

    const addLine = (item, idx, isResource) => {
      const matching = proposals.find((p) => {
        const list = isResource ? p.coveredResources : p.coveredMissions;
        return list?.some((c) =>
          String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(idx)
          || String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(item.id)
        );
      });
      const line = matching
        ? (isResource ? matching.coveredResources : matching.coveredMissions)
            .find((c) =>
              String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(idx)
              || String(isResource ? c.extractedResourceIdx : c.extractedMissionIdx) === String(item.id)
            )
        : null;
      lines.push({
        label: item.name,
        provider: matching ? `${matching.proposerName}${matching.proposerProject?.name ? ' · ' + matching.proposerProject.name : ''}` : null,
        price: line?.price ?? matching?.totalPrice ?? 0,
        status: matching
          ? (matching.status === 'accepted' ? 'accepted'
            : matching.status === 'rejected' || matching.status === 'expired' ? 'rejected'
            : 'pending')
          : 'open',
      });
    };

    (wish.extractedMissions ?? []).forEach((m, i) => addLine(m, i, false));
    (wish.extractedResources ?? []).forEach((r, i) => addLine(r, i, true));
    return lines.filter((l) => l.status !== 'rejected');
  }

  /* ===== Resolved (real if proposals/extracted present, mock otherwise) ===== */
  const HAS_REAL = $derived(!!data?.wish && ((data.wish.extractedMissions?.length ?? 0) > 0 || (data.wish.extractedResources?.length ?? 0) > 0));
  const PLAN_ROWS   = $derived(HAS_REAL ? buildPlanRows(data.wish, data.proposals ?? [])  : MOCK_PLAN_ROWS);
  const HARMONY     = $derived(HAS_REAL ? buildHarmony(data.wish, data.proposals ?? [])    : MOCK_HARMONY);
  const TOTAL_LINES = $derived(HAS_REAL ? buildTotalLines(data.wish, data.proposals ?? []) : MOCK_TOTAL_LINES);

  /* ===== Live grounding (real members + free resources from the DB) ===== */
  const ENRICH        = $derived(data?.enrichment ?? { skills: [], missions: [], people: [], resources: [], products: [] });
  const PEOPLE        = $derived(ENRICH.people ?? []);
  const AVAIL_RES     = $derived(ENRICH.resources ?? []);
  const PRODUCTS      = $derived(ENRICH.products ?? []);
  const hasSuggestions = $derived(PEOPLE.length > 0 || AVAIL_RES.length > 0 || PRODUCTS.length > 0);

  function tokenize(s) {
    return String(s || '')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 2);
  }
  /** Loose relatedness: any shared/overlapping token between term-set and text. */
  function relates(terms, text) {
    const bt = tokenize(text);
    if (!bt.length) return false;
    for (const term of terms) {
      for (const t of tokenize(term)) {
        if (bt.some((x) => x === t || x.includes(t) || t.includes(x))) return true;
      }
    }
    return false;
  }
  /** Suggested members for a mission need (matched by skill, capped). */
  function peopleForNeed(need) {
    if (need.isResource) return [];
    const linkedNames = (need.linked ?? []).map((l) => l.name).filter(Boolean);
    const matched = PEOPLE.filter((p) => {
      const terms = [...(p.matchedSkills ?? []), ...(p.skills ?? [])];
      return relates(terms, need.rawName) || linkedNames.some((n) => relates(terms, n));
    });
    return (matched.length ? matched : PEOPLE).slice(0, 4);
  }
  /** Free resource instances (Sp) for a resource need. */
  function resourcesForNeed(need) {
    if (!need.isResource) return [];
    const matched = AVAIL_RES.filter(
      (r) => relates([r.name, r.template ?? ''], need.rawName) || relates([need.rawName], r.name)
    );
    return (matched.length ? matched : AVAIL_RES).slice(0, 4);
  }
  /** Ready products (matanot) a weave offers that may fulfil this need. */
  function productsForNeed(need) {
    const linkedNames = (need.linked ?? []).map((l) => l.name).filter(Boolean);
    const matched = PRODUCTS.filter((m) => {
      const terms = [m.name, m.desc ?? ''];
      return relates(terms, need.rawName) || linkedNames.some((n) => relates(terms, n));
    });
    return matched.slice(0, 3);
  }

  /* ===== Real chronicle (replaces the demo timeline for real wishes) ===== */
  function relTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(+d)) return '';
    const mins = Math.round((Date.now() - +d) / 60000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} ד׳`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `לפני ${hrs} שע׳`;
    const days = Math.round(hrs / 24);
    return days === 1 ? 'אתמול' : `לפני ${days} ימים`;
  }
  const REAL_ACTIVITY = $derived.by(() => {
    const items = [];
    const props = data?.proposals ?? [];
    props.forEach((p) => {
      const color =
        p.status === 'accepted' ? 'green' : p.status === 'rejected' || p.status === 'expired' ? 'pink' : 'blue';
      const verb =
        p.status === 'accepted' ? 'אושרה'
        : p.status === 'rejected' ? 'נדחתה'
        : p.autoGenerated ? 'נמצאה התאמה' : 'הציעה';
      items.push({
        color,
        time: relTime(p.createdAt),
        ts: p.createdAt ? +new Date(p.createdAt) : 0,
        text: `${p.proposerName}${p.proposerProject?.name ? ' · ' + p.proposerProject.name : ''} ${verb}.`
      });
    });
    if (data?.wish?.lastMatchedAt) {
      items.push({
        color: 'gold', time: relTime(data.wish.lastMatchedAt), ts: +new Date(data.wish.lastMatchedAt),
        text: 'Lev סרקה את הריקמות וחיפשה התאמות.'
      });
    }
    items.push({
      color: 'pink', time: '', ts: 0,
      text: `המשאלה פורסמה ופורקה ל־${(data?.wish?.extractedMissions?.length ?? 0) + (data?.wish?.extractedResources?.length ?? 0)} חלקים.`
    });
    return items.sort((a, b) => b.ts - a.ts);
  });
  const ACTIVITY_VIEW = $derived(HAS_REAL ? REAL_ACTIVITY : ACTIVITY);

  /* ===== Extraction editing (review-stage corrections) ===== */
  let editing       = $state(false);
  let editMissions  = $state(/** @type {any[]} */([]));
  let editResources = $state(/** @type {any[]} */([]));
  let saveBusy      = $state(false);
  let saveError     = $state('');

  function startEdit() {
    editMissions = (data?.wish?.extractedMissions ?? []).map((m) => ({
      name: m.name, hoursEst: m.hoursEst ?? null, importance: m.importance === 'must' ? 'must' : 'nice', notes: m.notes || ''
    }));
    editResources = (data?.wish?.extractedResources ?? []).map((r) => ({
      name: r.name, quantityEst: r.quantityEst ?? null, kindOf: r.kindOf ?? null, importance: r.importance === 'must' ? 'must' : 'nice', notes: r.notes || ''
    }));
    saveError = '';
    editing = true;
  }
  function cancelEdit() { editing = false; }
  const addMission  = () => { editMissions  = [...editMissions,  { name: '', hoursEst: null, importance: 'nice', notes: '' }]; };
  const addResource = () => { editResources = [...editResources, { name: '', quantityEst: null, importance: 'nice', notes: '' }]; };
  const removeMission  = (i) => { editMissions  = editMissions.filter((_, k) => k !== i); };
  const removeResource = (i) => { editResources = editResources.filter((_, k) => k !== i); };
  const flipMissionImp  = (i) => { editMissions  = editMissions.map((m, k)  => k === i ? { ...m, importance: m.importance === 'must' ? 'nice' : 'must' } : m); };
  const flipResourceImp = (i) => { editResources = editResources.map((r, k) => k === i ? { ...r, importance: r.importance === 'must' ? 'nice' : 'must' } : r); };

  async function saveExtraction() {
    if (!wishId) return;
    saveBusy = true; saveError = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'updateRatsonExtraction',
          params: {
            ratsonId: wishId,
            extracted_missions: editMissions.filter((m) => m.name.trim()).map((m) => ({
              name: m.name.trim(), hoursEst: m.hoursEst === '' || m.hoursEst == null ? null : Number(m.hoursEst), importance: m.importance, notes: m.notes || ''
            })),
            extracted_resources: editResources.filter((r) => r.name.trim()).map((r) => ({
              name: r.name.trim(), quantityEst: r.quantityEst === '' || r.quantityEst == null ? null : Number(r.quantityEst), kindOf: r.kindOf || null, importance: r.importance, notes: r.notes || ''
            }))
          }
        })
      });
      const out = await res.json();
      if (!out?.success) throw new Error(out?.error || 'השמירה נכשלה');
      window.location.reload();
    } catch (err) {
      console.error('[concierge/[id]] save extraction failed:', err);
      saveError = err instanceof Error ? err.message : 'אירעה שגיאה';
    } finally {
      saveBusy = false;
    }
  }

  function personLink(p) { return `/user/${p.id}`; }
  function resourceLink(r) { return r.ownerId ? `/user/${r.ownerId}` : '#'; }

  /* ===== Reaching out to a grounded suggestion (creates a ratson_proposal) ===== */
  let inviteBusy  = $state(/** @type {Record<string, boolean>} */({}));
  let inviteDone  = $state(/** @type {Record<string, string>} */({}));
  let inviteError = $state('');

  /**
   * @param {string} sugKey  stable key for the suggestion card (busy/done state)
   * @param {{ kind:'person'|'resource'|'matanot', matanotId?:string|null, projectId?:string|null, targetUserId?:string|null, totalPrice?:number|null, label?:string }} payload
   */
  async function requestSuggestion(sugKey, payload) {
    if (!wishId || inviteBusy[sugKey] || inviteDone[sugKey]) return;
    inviteBusy = { ...inviteBusy, [sugKey]: true };
    inviteError = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey: 'requestSuggestion', params: { ratsonId: wishId, ...payload } })
      });
      const out = await res.json();
      if (!out?.success) throw new Error(out?.error || 'הפנייה נכשלה');
      inviteDone = { ...inviteDone, [sugKey]: out?.data?.track === 'service_request' ? 'בקשת השירות נשלחה' : 'ההזמנה נשלחה' };
    } catch (err) {
      console.error('[concierge/[id]] requestSuggestion failed:', err);
      inviteError = err instanceof Error ? err.message : 'אירעה שגיאה';
    } finally {
      inviteBusy = { ...inviteBusy, [sugKey]: false };
    }
  }
  const invitePerson  = (p, label) => requestSuggestion(`p${p.id}`,  { kind: 'person',   targetUserId: p.id, projectId: null, label });
  const inviteResource = (r, label) => requestSuggestion(`r${r.id}`, { kind: 'resource', targetUserId: r.ownerId, projectId: null, totalPrice: r.price ?? 0, label });
  const requestProduct = (m, label) => requestSuggestion(`m${m.id}`, { kind: 'matanot',  matanotId: m.id, projectId: m.projectId, totalPrice: m.price ?? 0, label });

  const FORUM_MSGS = [
    { from: 'נועה גולן', role: 'ספא טבע',               time: 'לפני שעה', color: 'green', text: 'אישרתי. הפכנו את החלון של 10:00 לרשום שמה. שולחת לכם את כתובת הסוויטה.' },
    { from: 'תמר ל.',    role: 'אמהות עוזרות',           time: 'לפני 45ד׳', color: 'green', text: 'מעולה. אהיה עם הילדים מ־8:30 עד 14:30. נעה, רוצה שאקנה לאמא שלך זר פרחים בדרך הביתה?' },
    { from: 'יואב כ.',   role: 'Lift',                   time: 'לפני 22ד׳', color: 'blue',  text: 'אני בעיקרון פנוי. רק רוצה לוודא שעות מדויקות. נעה, אפשר 9:30 או 9:45?' },
    { from: 'נעה ב.',    role: 'הלקוחה · בעלת המשאלה', time: 'לפני 8ד׳',  color: 'gold',  text: 'יואב, 9:30 מעולה. תמר, רעיון הפרחים מקסים — נעלה את זה לחלוקת ההוצאה.' },
  ];

  const ACTIVITY = [
    { color: 'gold',  time: 'עכשיו · 21:48', text: 'התכנית 75% מורכבת. נשארה שורה אחת פתוחה (ארוחה).' },
    { color: 'green', time: 'לפני 15ד׳',     text: 'תמר ל. אישרה את הצעת ההשגחה.' },
    { color: 'green', time: 'לפני 28ד׳',     text: 'נועה גולן (ספא טבע) אישרה את הזמן.' },
    { color: 'blue',  time: 'לפני 41ד׳',     text: 'יואב כ. (Lift) צירף הצעה — ממתינה לתיאום שעה.' },
    { color: 'pink',  time: 'לפני שעה',      text: 'Lev מצאה 6 התאמות מ־3 ריקמות שונות.' },
    { color: 'gold',  time: 'לפני 75ד׳',     text: 'Lev סיכמה את המשאלה ל־4 חלקים. אישרת.' },
    { color: 'pink',  time: 'אתמול 21:14',   text: 'פרסמת את המשאלה.' },
  ];

  const STEPS = [
    { id: 0, en: 'WISH',      he: 'משאלה' },
    { id: 1, en: 'UNDERSTAND', he: 'הבנה' },
    { id: 2, en: 'PROPOSALS', he: 'הצעות' },
    { id: 3, en: 'CONSENT',   he: 'הסכמה' },
  ];

  /* ===== State ===== */
  let activeTab = $state('active');
  let extractionApproved = $state(true);
  let proposalBusy = $state(/** @type {Record<string, 'accepting' | 'rejecting' | null>} */({}));
  let proposalError = $state('');
  const isOwner = $derived(!!data?.isOwner);
  const wishId   = $derived(data?.wish?.id ?? null);

  async function callProposalAction(actionKey, proposalId) {
    if (!proposalId || !wishId) return;
    proposalBusy = { ...proposalBusy, [proposalId]: actionKey === 'acceptRatsonProposal' ? 'accepting' : 'rejecting' };
    proposalError = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey,
          params: { proposalId, ratsonId: wishId }
        })
      });
      const out = await res.json();
      if (!out?.success) throw new Error(out?.error || 'הפעולה נכשלה');
      // Soft refresh — reload the page to pick up new server state.
      window.location.reload();
    } catch (err) {
      console.error('[concierge/[id]] action failed:', err);
      proposalError = err instanceof Error ? err.message : 'אירעה שגיאה';
    } finally {
      proposalBusy = { ...proposalBusy, [proposalId]: null };
    }
  }
  const acceptProposal = (id) => callProposalAction('acceptRatsonProposal', id);
  const rejectProposal = (id) => callProposalAction('rejectRatsonProposal', id);

  /* ===== Derived ===== */
  const grandTotal   = $derived(TOTAL_LINES.reduce((s, l) => s + l.price, 0));
  const coveredPct   = $derived(Math.round(100 * TOTAL_LINES.filter(l => l.status !== 'open').length / TOTAL_LINES.length));
  const acceptedCount = $derived(HARMONY.filter(p => p.state === 'accepted').length);

  /* ===== Harmony ring geometry ===== */
  const CX = 130, CY = 130, RR = 86;
  const harmonyPositions = $derived(
    HARMONY.map((p, i) => {
      const angle = (-Math.PI / 2) + (i / HARMONY.length) * Math.PI * 2;
      return { ...p, x: CX + RR * Math.cos(angle), y: CY + RR * Math.sin(angle) };
    })
  );

  /* ===== Helpers ===== */
  function stateColor(s) { return s === 'accepted' ? '#02ffbb' : s === 'pending' ? '#74bfff' : '#9a8f80'; }
  function discBorder(s) { return s === 'accepted' ? 'rgba(2,255,187,0.6)' : s === 'pending' ? 'rgba(116,191,255,0.6)' : 'rgba(238,232,170,0.5)'; }
  function gemCls(imp) { return imp === 'must' ? 'gem' : 'gem gem-gold'; }
  function fmt(n) { return n.toLocaleString('he-IL'); }
  function forumColor(c) { return c === 'green' ? '#02ffbb' : c === 'blue' ? '#74bfff' : '#fde68a'; }
  function forumBorder(c) { return c === 'green' ? 'rgba(2,255,187,0.5)' : c === 'blue' ? 'rgba(116,191,255,0.5)' : 'rgba(238,232,170,0.5)'; }
</script>

<!-- ===================================================================
     MAIN SCREEN — Concierge deal detail (mock, design-only)
     =================================================================== -->
<div class="cp" dir="rtl">

  <!-- ── HEADER ─────────────────────────────────────────────────────── -->
  <header class="hdr">
    <div class="hdr-logo">
      <img src="/logo-concierge.png" class="hdr-coin" alt="Concierge" />
      <div class="hdr-brand">
        <span class="hdr-dot"></span>
        <span class="hdr-name">Concierge</span>
        <span class="hdr-sub hide-xs">· קונסיירז׳</span>
      </div>
    </div>

    <nav class="hdr-nav hide-sm">
      <a href="/lev" class="nav-lnk">הסקירה שלי</a>
      <a href="/concierge" class="nav-lnk nav-act">משאלות</a>
      <a href="/deals" class="nav-lnk">דילים</a>
      <a href="/moach" class="nav-lnk">ריקמות</a>
    </nav>

    <div class="hdr-right">
      <button class="notif-btn" aria-label="התראות">🔔<span class="notif-pip"></span></button>
      <button class="av-btn" onclick={() => goto('/me')}>
        {#if $uPic}
          <img src={$uPic} alt="פרופיל" class="av-img" />
        {:else}
          בר״
        {/if}
      </button>
    </div>
  </header>

  <!-- ── SHELL ──────────────────────────────────────────────────────── -->
  <div class="shell">
    <div class="wrap">

      <!-- TOP BAR -->
      <div class="topbar anim">
        <!-- Step dial -->
        <div class="steps">
          {#each STEPS as step, i (step.id)}
            {@const st = i < 2 ? 'done' : i === 2 ? 'active' : ''}
            <div class="step {st}">
              <span class="step-dot">{st === 'done' ? '✓' : step.id + 1}</span>
              <span class="step-en hide-xs">{step.en}</span>
              <span class="step-he hide-xs">· {step.he}</span>
            </div>
            {#if i < STEPS.length - 1}<span class="step-sep"></span>{/if}
          {/each}
        </div>
        <!-- Wish code + CTA -->
        <div class="topbar-right">
          <span class="code-lbl hide-xs">קוד משאלה</span>
          <code class="wish-code">{WISH_CODE}</code>
          <a href="/concierge/new" class="btn-ghost btn-xs">+ משאלה חדשה</a>
          <button class="btn-ghost btn-xs hide-xs">📤 שתפי</button>
        </div>
      </div>

      <!-- WISH HERO -->
      <div class="facet wish-glow anim anim-d1">
        <div class="hero-inner">
          <div class="hero-av">{WISH_AVATAR}</div>
          <div class="hero-body">
            <div class="hero-meta">
              <span class="badge-open">משאלה פתוחה</span>
              <span class="dim">·</span>
              <span class="muted">פורסמה אתמול 21:14</span>
              <span class="dim hide-xs">·</span>
              <span class="muted hide-xs">מאת {WISH_AUTHOR}</span>
            </div>
            <h1 class="hero-title">{WISH_TEXT}</h1>
            <div class="hero-long rich-wrap">
              <RichText outpot={WISH_LONG} editable={false} trans={true} sml={true} />
            </div>
          </div>
        </div>
        <div class="hero-footer">
          <div class="hero-metas">
            {#each [['📅','ליום','ה׳, 19 ביוני · יום שישי'],['📍','באזור','חיפה והקריות · 8 ק״מ'],['💰','תקציב','₪ 850–1,200']] as [icon, lbl, val] (lbl)}
              <div class="metai">
                <span class="mi-icon">{icon}</span>
                <div><div class="mi-lbl">{lbl}</div><div class="mi-val">{val}</div></div>
              </div>
            {/each}
          </div>
          <button class="btn-ghost">ערכי משאלה ✎</button>
        </div>
      </div>

      <!-- EXTRACTION STRIP -->
      <div class="extstrip anim anim-d2">
        <div class="extstrip-hdr">
          <img src="/botlogo.jpeg" class="bot-av" alt="Lev" />
          <div class="ext-labels">
            <div class="lev-title">Lev הבינה</div>
            <div class="lev-sub">
              {extractionApproved ? 'אישרת את הפירוק להלן. ההצעות בנויות סביבו.' : 'הנה איך פירקתי את המשאלה — אשרי או הגיהי לפני שאחפש ספקים.'}
            </div>
          </div>
          {#if editing}
            <div style="display:flex;gap:6px">
              <button class="btn-jewel" style="padding:8px 16px;font-size:13px" disabled={saveBusy} onclick={saveExtraction}>{saveBusy ? '⏳ שומרת…' : '✓ שמירה'}</button>
              <button class="btn-ghost" style="padding:8px 14px;font-size:13px" disabled={saveBusy} onclick={cancelEdit}>ביטול</button>
            </div>
          {:else}
            {#if isOwner && HAS_REAL}
              <button class="btn-ghost" style="padding:8px 14px;font-size:13px" onclick={startEdit}>✎ ערכי פירוק</button>
            {/if}
            {#if extractionApproved}
              <span class="sbadge ready">אושר על־ידי הלקוחה</span>
            {:else}
              <button class="btn-jewel" style="padding:8px 16px;font-size:13px" onclick={() => extractionApproved = true}>אשרי ›</button>
            {/if}
          {/if}
        </div>

        {#if editing}
          {#if saveError}
            <div style="margin-bottom:12px;padding:9px 13px;background:rgba(255,77,158,.06);border:1px solid rgba(255,77,158,.3);border-radius:10px;font-family:'Bellefair',serif;font-size:13px;color:#ff4d9e">{saveError}</div>
          {/if}
          <div class="extgrid">
            <div>
              <div class="extcol-lbl">✦  משימות</div>
              <div class="edit-list">
                {#each editMissions as m, i (i)}
                  <div class="edit-row">
                    <button class="imp-toggle {m.importance}" title="חובה / רצוי" onclick={() => flipMissionImp(i)}>{m.importance === 'must' ? 'חובה' : 'רצוי'}</button>
                    <input class="edit-in" placeholder="שם המשימה" bind:value={m.name} />
                    <input class="edit-num" type="number" min="0" step="0.5" placeholder="שע׳" bind:value={m.hoursEst} />
                    <button class="edit-del" title="הסרה" onclick={() => removeMission(i)}>✕</button>
                  </div>
                {/each}
                <button class="edit-add" onclick={addMission}>+ הוסיפי משימה</button>
              </div>
            </div>
            <div>
              <div class="extcol-lbl">◐  משאבים</div>
              <div class="edit-list">
                {#each editResources as r, i (i)}
                  <div class="edit-row">
                    <button class="imp-toggle {r.importance}" title="חובה / רצוי" onclick={() => flipResourceImp(i)}>{r.importance === 'must' ? 'חובה' : 'רצוי'}</button>
                    <input class="edit-in" placeholder="שם המשאב" bind:value={r.name} />
                    <input class="edit-num" type="number" min="0" step="1" placeholder="כמות" bind:value={r.quantityEst} />
                    <button class="edit-del" title="הסרה" onclick={() => removeResource(i)}>✕</button>
                  </div>
                {/each}
                <button class="edit-add" onclick={addResource}>+ הוסיפי משאב</button>
              </div>
            </div>
          </div>
        {:else}
          <div class="extgrid">
            <div>
              <div class="extcol-lbl">✦  משימות שזיהיתי</div>
              <div class="chips">
                {#each MISSIONS as m (m.name)}
                  <span class="chip {m.imp}">
                    <span class="{gemCls(m.imp)}" style="width:6px;height:6px"></span>
                    {m.name}{m.hours ? ` · ` : ''}{#if m.hours}<span style="opacity:.7">{m.hours} שע׳</span>{/if}
                  </span>
                {/each}
              </div>
            </div>
            <div>
              <div class="extcol-lbl">◐  משאבים שזיהיתי</div>
              <div class="chips">
                {#each RESOURCES as r (r.name)}
                  <span class="chip {r.imp}">
                    <span class="{gemCls(r.imp)}" style="width:6px;height:6px"></span>
                    {r.name} {r.qty ? `· ×${r.qty}` : ''}
                  </span>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- MAIN LAYOUT: plan + right rail -->
      <div class="layout">

        <!-- ── MAIN COLUMN ── -->
        <main>
          <div class="section-label"><span class="lead"><span class="gem"></span>התכנית · 3 שותפות מציעות יחד</span></div>

          <div class="tabs">
            {#each [['active','הצעות פעילות · 6'],['rejected','דחויות · 2'],['archive','ארכיון']] as [key, lbl] (key)}
              <button class="tab {activeTab === key ? 'active' : ''}" onclick={() => activeTab = key}>{lbl}</button>
            {/each}
          </div>

          {#if proposalError}
            <div style="margin-bottom:14px;padding:10px 14px;background:rgba(255,77,158,.06);border:1px solid rgba(255,77,158,.3);border-radius:12px;font-family:'Bellefair',serif;font-size:13px;color:#ff4d9e">
              {proposalError}
            </div>
          {/if}

          {#each PLAN_ROWS as row, ri (row.need.title)}
            {@const met = row.providers.some(p => p.status === 'accepted' || p.status === 'pending')}
            <div class="plan-row {met ? 'met' : ''}" style="animation-delay:{(ri+2)*0.08}s">
              <div class="need">
                <div class="need-kind">
                  <span class="{gemCls(row.need.imp)}"></span>
                  <span style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:{row.need.imp==='must'?'#ff4d9e':'#fde68a'}">
                    {row.need.imp === 'must' ? 'חובה' : 'רצוי'} · {row.need.kind}
                  </span>
                </div>
                <div class="need-title">{row.need.title}</div>
                <div class="need-detail">{row.need.detail}</div>
                <div class="need-ftr">
                  {#if row.need.hours}<span class="muted" style="font-size:12px">⏱ {row.need.hours} שע׳</span>{/if}
                  {#if row.need.bestPrice}<span style="font-size:12px;color:#fde68a">₪{row.need.bestPrice}</span>{/if}
                </div>
              </div>
              <div class="opt-grid">
                {#if row.providers.length === 0}
                  {@const sugP = HAS_REAL ? peopleForNeed(row.need) : []}
                  {@const sugR = HAS_REAL ? resourcesForNeed(row.need) : []}
                  {@const sugM = HAS_REAL ? productsForNeed(row.need) : []}
                  {#if sugP.length || sugR.length || sugM.length}
                    <div class="sug-wrap">
                      <div class="sug-lbl">✶ אולי מתאימים — שלחי פנייה</div>
                      {#each sugM as m (m.id)}
                        {@const k = `m${m.id}`}
                        <div class="scard">
                          <div class="disc disc-sm">🎁</div>
                          <div style="flex:1;min-width:0">
                            <div class="pname" style="font-size:14px">{m.name}</div>
                            <div class="sug-skills">
                              {#if m.projectName}<span class="pbadge">{m.projectName}</span>{/if}
                              <span class="pproj">· מוצר מוכן</span>
                              {#if m.price != null}<span style="color:#fde68a;font-size:12px">{m.currencySymbol || '₪'}{fmt(m.price)}</span>{/if}
                            </div>
                          </div>
                          {#if inviteDone[k]}
                            <span class="sbadge ready" style="padding:6px 10px;font-size:11px">✓ {inviteDone[k]}</span>
                          {:else if isOwner}
                            <button class="btn-jewel" style="padding:6px 12px;font-size:12px" disabled={inviteBusy[k]} onclick={() => requestProduct(m, row.need.title)}>{inviteBusy[k] ? '⏳' : 'בקשת שירות'}</button>
                          {/if}
                        </div>
                      {/each}
                      {#each sugP as p (p.id)}
                        {@const k = `p${p.id}`}
                        <div class="scard">
                          <div class="disc disc-sm">{(p.username || '··').slice(0,2)}</div>
                          <div style="flex:1;min-width:0">
                            <div class="pname" style="font-size:14px">{p.username || 'חברה בקהילה'}</div>
                            <div class="sug-skills">
                              {#each (p.matchedSkills?.length ? p.matchedSkills : p.skills).slice(0,3) as s (s)}<span class="pbadge">{s}</span>{/each}
                              {#if p.projects?.length}<span class="pproj">· {p.projects[0]}</span>{/if}
                            </div>
                          </div>
                          {#if inviteDone[k]}
                            <span class="sbadge ready" style="padding:6px 10px;font-size:11px">✓ {inviteDone[k]}</span>
                          {:else if isOwner}
                            <button class="btn-ghost" style="padding:6px 12px;font-size:12px" disabled={inviteBusy[k]} onclick={() => invitePerson(p, row.need.title)}>{inviteBusy[k] ? '⏳' : 'הזמיני'}</button>
                          {:else}
                            <a href={personLink(p)} class="btn-ghost" style="padding:6px 12px;font-size:12px">פרופיל</a>
                          {/if}
                        </div>
                      {/each}
                      {#each sugR as r (r.id)}
                        {@const k = `r${r.id}`}
                        <div class="scard">
                          <div class="disc disc-sm">◐</div>
                          <div style="flex:1;min-width:0">
                            <div class="pname" style="font-size:14px">{r.name}{r.template && r.template !== r.name ? ` · ${r.template}` : ''}</div>
                            <div class="sug-skills">
                              {#if r.ownerName}<span class="pbadge">{r.ownerName}</span>{/if}
                              {#if r.project}<span class="pproj">· {r.project}</span>{/if}
                              {#if r.price != null}<span style="color:#fde68a;font-size:12px">₪{fmt(r.price)}</span>{/if}
                            </div>
                          </div>
                          {#if inviteDone[k]}
                            <span class="sbadge ready" style="padding:6px 10px;font-size:11px">✓ {inviteDone[k]}</span>
                          {:else if isOwner && r.ownerId}
                            <button class="btn-ghost" style="padding:6px 12px;font-size:12px" disabled={inviteBusy[k]} onclick={() => inviteResource(r, row.need.title)}>{inviteBusy[k] ? '⏳' : 'פנייה'}</button>
                          {:else}
                            <a href={resourceLink(r)} class="btn-ghost" style="padding:6px 12px;font-size:12px">פרופיל</a>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-prov">
                      <span style="font-size:20px;opacity:.4">✶</span>
                      <div style="font-family:'Bellefair',serif;font-size:13px;color:#9a8f80">
                        {HAS_REAL ? 'עוד לא נמצאו מתאימים לחלק הזה' : 'עוד לא נמצא שותף לחלק הזה'}
                      </div>
                      <a href="/concierge/new" class="btn-ghost" style="padding:6px 14px;font-size:12px">הרחיבי חיפוש</a>
                    </div>
                  {/if}
                {/if}
                {#each row.providers as p (p.name)}
                  <div class="pcard {p.status}">
                    <div class="pcard-top">
                      <div class="disc" style="border-color:{discBorder(p.status)}">{p.avatar}</div>
                      <div style="flex:1;min-width:0">
                        <div class="pname">{p.name}</div>
                        <div class="pproj">{p.project}</div>
                      </div>
                      <div class="score-crown">
                        <span class="score-n">{Math.round(p.score*100)}</span><span class="score-p">%</span>
                      </div>
                    </div>
                    {#if p.note}<div class="pnote">"{p.note}"</div>{/if}
                    <div class="pbadges">
                      {#each p.badges as b (b)}<span class="pbadge">{b}</span>{/each}
                    </div>
                    <div class="pcard-ftr">
                      <div style="font-family:'Bellefair',serif;color:#ede5d8;font-size:14px">
                        {#if p.hours}<span style="opacity:.7">{p.hours} שע׳ · </span>{/if}
                        <span style="color:#fde68a">₪{fmt(p.price)}</span>
                      </div>
                      {#if p.status === 'accepted'}
                        <span class="sbadge ready" style="padding:4px 10px;font-size:10px">שותפים</span>
                      {:else if p.status === 'pending'}
                        <span class="sbadge pending" style="padding:4px 10px;font-size:10px">ממתינה</span>
                      {:else if p.proposalId && isOwner}
                        {@const busy = proposalBusy[p.proposalId]}
                        <div style="display:flex;gap:6px">
                          <button
                            class="btn-jewel"
                            style="padding:6px 14px;font-size:12px"
                            disabled={!!busy}
                            onclick={() => acceptProposal(p.proposalId)}
                          >{busy === 'accepting' ? '⏳' : '✓ אני בוחרת'}</button>
                          <button
                            class="btn-ghost"
                            style="padding:6px 12px;font-size:12px"
                            disabled={!!busy}
                            onclick={() => rejectProposal(p.proposalId)}
                          >{busy === 'rejecting' ? '⏳' : 'דחי'}</button>
                        </div>
                      {:else if p.proposalId}
                        <span class="sbadge pending" style="padding:4px 10px;font-size:10px">בבחינה</span>
                      {:else}
                        <button class="btn-ghost" style="padding:6px 14px;font-size:12px">שלחי הזמנה</button>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}

          {#if HAS_REAL}
            {#if inviteError}<div style="margin-bottom:10px;padding:9px 13px;background:rgba(255,77,158,.06);border:1px solid rgba(255,77,158,.3);border-radius:10px;font-family:'Bellefair',serif;font-size:13px;color:#ff4d9e">{inviteError}</div>{/if}
            <!-- Ready products a weave offers (service-request track) -->
            {#if PRODUCTS.length}
              <div class="panel">
                <h4>מוצרים מוכנים מריקמות</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  {#each PRODUCTS.slice(0, 6) as m (m.id)}
                    {@const k = `m${m.id}`}
                    <div style="display:flex;gap:10px;align-items:center">
                      <div class="disc disc-sm">🎁</div>
                      <div style="flex:1;min-width:0">
                        <div class="pname" style="font-size:14px">{m.name}</div>
                        <div class="sug-skills">
                          {#if m.projectName}<span class="pbadge">{m.projectName}</span>{/if}
                          {#if m.price != null}<span style="color:#fde68a;font-size:12px">{m.currencySymbol || '₪'}{fmt(m.price)}</span>{/if}
                        </div>
                      </div>
                      {#if inviteDone[k]}
                        <span class="sbadge ready" style="padding:6px 10px;font-size:11px">✓ {inviteDone[k]}</span>
                      {:else if isOwner}
                        <button class="btn-jewel" style="padding:6px 12px;font-size:12px" disabled={inviteBusy[k]} onclick={() => requestProduct(m, m.name)}>{inviteBusy[k] ? '⏳' : 'בקשת שירות'}</button>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            <!-- People who can help (grounded in the platform) -->
            {#if PEOPLE.length}
              <div class="panel">
                <h4>אנשים שיכולים לעזור</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  {#each PEOPLE.slice(0, 6) as p (p.id)}
                    {@const k = `p${p.id}`}
                    <div style="display:flex;gap:10px;align-items:center">
                      <div class="disc disc-sm">{(p.username || '··').slice(0,2)}</div>
                      <div style="flex:1;min-width:0">
                        <div class="pname" style="font-size:14px">{p.username || 'חברה בקהילה'}</div>
                        <div class="sug-skills">
                          {#each (p.matchedSkills?.length ? p.matchedSkills : p.skills).slice(0,3) as s (s)}<span class="pbadge">{s}</span>{/each}
                          {#if p.projects?.length}<span class="pproj">· {p.projects[0]}</span>{/if}
                        </div>
                      </div>
                      {#if inviteDone[k]}
                        <span class="sbadge ready" style="padding:6px 10px;font-size:11px">✓ {inviteDone[k]}</span>
                      {:else if isOwner}
                        <button class="btn-ghost" style="padding:6px 12px;font-size:12px" disabled={inviteBusy[k]} onclick={() => invitePerson(p, p.username || '')}>{inviteBusy[k] ? '⏳' : 'הזמיני'}</button>
                      {:else}
                        <a href={personLink(p)} class="btn-ghost" style="padding:6px 12px;font-size:12px">פרופיל</a>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            {#if AVAIL_RES.length}
              <div class="panel">
                <h4>משאבים פנויים</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  {#each AVAIL_RES.slice(0, 6) as r (r.id)}
                    {@const k = `r${r.id}`}
                    <div style="display:flex;gap:10px;align-items:center">
                      <div class="disc disc-sm">◐</div>
                      <div style="flex:1;min-width:0">
                        <div class="pname" style="font-size:14px">{r.name}</div>
                        <div class="sug-skills">
                          {#if r.ownerName}<span class="pbadge">{r.ownerName}</span>{/if}
                          {#if r.project}<span class="pproj">· {r.project}</span>{/if}
                          {#if r.price != null}<span style="color:#fde68a;font-size:12px">₪{fmt(r.price)}</span>{/if}
                        </div>
                      </div>
                      {#if inviteDone[k]}
                        <span class="sbadge ready" style="padding:6px 10px;font-size:11px">✓ {inviteDone[k]}</span>
                      {:else if isOwner && r.ownerId}
                        <button class="btn-ghost" style="padding:6px 12px;font-size:12px" disabled={inviteBusy[k]} onclick={() => inviteResource(r, r.name)}>{inviteBusy[k] ? '⏳' : 'פנייה'}</button>
                      {:else}
                        <a href={resourceLink(r)} class="btn-ghost" style="padding:6px 12px;font-size:12px">פרופיל</a>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {:else}
            <!-- Forum (design showcase — demo wish only) -->
            <div class="panel">
              <h4>הפורום של המשאלה</h4>
              <div style="display:flex;flex-direction:column;gap:10px">
                {#each FORUM_MSGS as m (m.from + m.time)}
                  <div style="display:flex;gap:10px;align-items:flex-start">
                    <div class="disc disc-sm" style="border-color:{forumBorder(m.color)};color:{forumColor(m.color)}">{m.from.slice(0,2)}</div>
                    <div style="flex:1">
                      <div style="font-size:10px;color:#52493e;margin-bottom:2px">{m.from} · {m.role} · {m.time}</div>
                      <div style="font-family:'Bellefair',serif;font-size:13px;color:#ede5d8;line-height:1.5">{m.text}</div>
                    </div>
                  </div>
                {/each}
              </div>
              <button class="btn-ghost" style="width:100%;margin-top:12px;justify-content:center">
                פתחי את כל השיחה (12 הודעות)
              </button>
            </div>
          {/if}
        </main>

        <!-- ── RIGHT RAIL ── -->
        <aside class="rail">

          <!-- Harmony Ring -->
          <div class="panel" style="text-align:center;padding:28px 20px">
            <h4>הרמוניית התכנית</h4>
            <div class="harmony-wrap">
              <svg viewBox="0 0 260 260" style="width:min(220px,100%);overflow:visible">
                <defs>
                  <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stop-color="#fde68a" />
                    <stop offset="50%"  stop-color="#aa771c" />
                    <stop offset="100%" stop-color="#574010" />
                  </linearGradient>
                </defs>
                <!-- outer dashed ring -->
                <circle cx={CX} cy={CY} r={RR+18} fill="none" stroke="rgba(238,232,170,0.08)" stroke-width="1" stroke-dasharray="2 6" />
                <!-- arc segments -->
                {#each harmonyPositions as pos, i (pos.id)}
                  {@const nxt = harmonyPositions[(i+1) % harmonyPositions.length]}
                  {@const both = pos.state==='accepted' && nxt.state==='accepted'}
                  <path d="M {pos.x} {pos.y} A {RR} {RR} 0 0 1 {nxt.x} {nxt.y}"
                    fill="none"
                    stroke={both ? '#02ffbb' : 'rgba(255,255,255,0.08)'}
                    stroke-width={both ? 2.5 : 1.5}
                    opacity={both ? 0.9 : 0.5}
                    style="filter:{both ? 'drop-shadow(0 0 6px rgba(2,255,187,0.6))' : 'none'}" />
                {/each}
                <!-- spoke lines to center -->
                {#each harmonyPositions as pos (pos.id)}
                  <line x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                    stroke={stateColor(pos.state)}
                    stroke-width={pos.state==='accepted' ? 1.5 : 1}
                    opacity={pos.state==='accepted' ? 0.65 : 0.35}
                    stroke-dasharray={pos.state==='pending' ? '3 4' : undefined} />
                {/each}
                <!-- center gem -->
                <g transform="translate({CX},{CY})">
                  <circle r="28" fill="#0e0d0c" stroke="rgba(238,232,170,0.5)" stroke-width="1.5" />
                  <g transform="rotate(45)">
                    <rect x="-10" y="-10" width="20" height="20" rx="2" fill="url(#gGold)" />
                  </g>
                  <text y="42" text-anchor="middle" fill="#fde68a" font-family="Cinzel,serif" font-size="9" letter-spacing="2">WISH</text>
                </g>
                <!-- satellites -->
                {#each harmonyPositions as pos (pos.id)}
                  <g transform="translate({pos.x},{pos.y})">
                    <circle r="18" fill="#0e0d0c" stroke={stateColor(pos.state)} stroke-width="2"
                      style="filter:{pos.state==='accepted' ? 'drop-shadow(0 0 8px rgba(2,255,187,0.6))' : pos.state==='pending' ? 'drop-shadow(0 0 6px rgba(116,191,255,0.4))' : 'none'}" />
                    <text text-anchor="middle" dy="4"
                      fill={pos.isOwner ? '#fde68a' : stateColor(pos.state)}
                      font-family="Cinzel,serif" font-size={pos.isOwner ? '11' : '10'}>{pos.label}</text>
                  </g>
                {/each}
              </svg>
              <div class="harmony-counter">
                <div class="hc-lbl">הסכמה</div>
                <div class="hc-num">{acceptedCount} / {HARMONY.length}</div>
              </div>
            </div>
            <div style="margin-top:16px;font-family:'Bellefair',serif;font-size:12px;color:#9a8f80;line-height:1.55">
              כשארבעת הצדדים מאשרים — התכנית סגורה והקשת תיהפך זהובה.
            </div>
          </div>

          <!-- Total card -->
          <div class="total-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div>
                <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#fde68a">הרכבת התכנית</div>
                <div style="font-family:'Sababa','Heebo',sans-serif;font-size:20px;color:#ede5d8;margin-top:2px;line-height:1.1">התכנית מתחברת</div>
              </div>
              <div style="text-align:end">
                <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#9a8f80">כיסוי</div>
                <div style="font-family:'Cinzel',serif;font-size:24px;color:#02ffbb;line-height:1;margin-top:2px">{coveredPct}%</div>
              </div>
            </div>
            <div class="cov-track"><div class="cov-fill" style="width:{coveredPct}%"></div></div>
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
              {#each TOTAL_LINES as line (line.label)}
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
                  <div style="display:flex;align-items:center;gap:9px;min-width:0">
                    <span class="gem {line.status==='accepted'?'gem-green':line.status==='pending'?'gem-blue':''}"
                      style="width:7px;height:7px;opacity:{line.status==='open'?.3:1}"></span>
                    <div style="min-width:0">
                      <div style="font-family:'Bellefair',serif;font-size:14px;color:{line.status==='open'?'#52493e':'#ede5d8'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{line.label}</div>
                      <div style="font-size:10px;color:#52493e;letter-spacing:.08em">{line.provider || 'לא הוקצה ספק'}</div>
                    </div>
                  </div>
                  <div style="font-family:'Bellefair',serif;font-size:14px;color:{line.status==='open'?'#52493e':'#fde68a'};white-space:nowrap">
                    {line.status === 'open' ? '—' : '₪' + fmt(line.price)}
                  </div>
                </div>
              {/each}
            </div>
            <div style="padding-top:14px;border-top:1px dashed rgba(238,232,170,.2);display:flex;justify-content:space-between;align-items:baseline">
              <span style="font-family:'Cinzel',serif;letter-spacing:.2em;font-size:11px;color:#9a8f80;text-transform:uppercase">סך הכל</span>
              <span style="font-family:'Sababa','Heebo',sans-serif;font-size:28px;color:#fde68a">₪{fmt(grandTotal)}</span>
            </div>
            <div style="display:flex;gap:10px;margin-top:16px">
              <button class="btn-jewel" style="flex:2;justify-content:center">✓ סגרי את ההסכמה</button>
              <button class="btn-ghost" style="flex:1">שלחי לדיון</button>
            </div>
            <div class="consent-row" style="margin-top:12px">
              <span>💗</span><span>בלחיצה תפתחי 3 שירותים מקבילים — אחד לכל שותפה.</span>
            </div>
          </div>

          <!-- Activity -->
          <div class="panel">
            <h4>כרוניקה</h4>
            <div style="display:flex;flex-direction:column;gap:10px">
              {#each ACTIVITY_VIEW as item, i (item.text + i)}
                <div style="display:flex;gap:10px">
                  <div style="display:flex;flex-direction:column;align-items:center">
                    <span class="gem {item.color==='green'?'gem-green':item.color==='blue'?'gem-blue':item.color==='pink'?'':'gem-gold'}"></span>
                    {#if i < ACTIVITY_VIEW.length - 1}<div style="width:1px;flex:1;background:rgba(238,232,170,.12);margin-top:4px"></div>{/if}
                  </div>
                  <div style="flex:1;padding-bottom:4px">
                    <div style="font-family:'Bellefair',serif;font-size:13px;color:#ede5d8;line-height:1.4">{item.text}</div>
                    <div style="font-size:10px;color:#52493e;letter-spacing:.1em;margin-top:2px">{item.time}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

        </aside>
      </div><!-- /layout -->
    </div><!-- /wrap -->
  </div><!-- /shell -->
</div><!-- /cp -->

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bellefair&family=Cinzel:wght@400;600;700&family=Heebo:wght@300;400;500;600;700;800&display=swap');

  /* ── Page shell ── */
  .cp { background:#070606; color:#ede5d8; font-family:'Heebo','Rubik',system-ui,sans-serif; min-height:100vh; position:relative; }
  .cp::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background:
      radial-gradient(ellipse 70% 50% at 10% -10%,  rgba(200,150,12,.10) 0%,transparent 55%),
      radial-gradient(ellipse 60% 65% at 90% 110%,  rgba(200,21,95,.09)  0%,transparent 55%),
      radial-gradient(ellipse 50% 40% at 50%  50%,  rgba(2,255,187,.035) 0%,transparent 60%);
  }

  .shell { position:relative; z-index:1; min-height:100vh; padding-bottom:80px; }
  .wrap  { max-width:1280px; margin:0 auto; padding:0 14px; }
  @media(min-width:640px)  { .wrap { padding:0 22px; } }
  @media(min-width:1024px) { .wrap { padding:0 28px; } }

  /* ── Responsive helpers ── */
  @media(max-width:479px) { .hide-xs { display:none !important; } }
  @media(max-width:767px) { .hide-sm { display:none !important; } }

  /* ── Animations ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wishGlow {
    0%,100% { box-shadow:0 0 0 1px rgba(238,232,170,.35) inset,0 0 30px rgba(238,232,170,.18),0 0 80px rgba(200,21,95,.18); }
    50%     { box-shadow:0 0 0 1px rgba(238,232,170,.5)  inset,0 0 44px rgba(238,232,170,.28),0 0 120px rgba(200,21,95,.28); }
  }
  .anim    { animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
  .anim-d1 { animation-delay:.05s; }
  .anim-d2 { animation-delay:.12s; }
  .wish-glow { animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both, wishGlow 4.5s ease-in-out .6s infinite; }

  /* ── Header ── */
  .hdr {
    position:sticky; top:0; z-index:100;
    background:rgba(7,6,6,.84); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
    border-bottom:1px solid rgba(200,150,12,.2);
    padding:0 14px; height:60px;
    display:flex; align-items:center; justify-content:space-between; gap:10px;
  }
  @media(min-width:640px) { .hdr { padding:0 24px; height:64px; } }

  .hdr-logo  { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .hdr-coin  { width:28px; height:28px; border-radius:50%; box-shadow:0 0 14px rgba(238,232,170,.4); }
  .hdr-brand { display:flex; align-items:center; gap:8px; }
  .hdr-dot   { width:6px; height:6px; border-radius:50%; background:#02ffbb; box-shadow:0 0 10px #02ffbb; }
  .hdr-name  { font-family:'Cinzel',serif; font-size:clamp(13px,3vw,18px); color:#f0c040; letter-spacing:.22em; text-transform:uppercase; }
  .hdr-sub   { font-family:'Bellefair',serif; font-size:13px; color:#9a8f80; }

  .hdr-nav   { display:flex; gap:20px; align-items:center; }
  .nav-lnk   { font-size:13px; color:#9a8f80; text-decoration:none; letter-spacing:.02em; }
  .nav-act   { color:#fde68a; text-shadow:0 0 12px rgba(238,232,170,.4); }

  .hdr-right  { display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .notif-btn  { position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:#171512; border:1px solid rgba(255,255,255,.06); cursor:pointer; font-size:14px; color:#fde68a; }
  .notif-pip  { position:absolute; top:6px; left:6px; width:7px; height:7px; border-radius:50%; background:#ff4d9e; box-shadow:0 0 8px #ff4d9e; }
  .av-btn     { width:34px; height:34px; border-radius:50%; border:2px solid #eee8aa; background:linear-gradient(135deg,#201d19,#2a2520); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#f0c040; cursor:pointer; overflow:hidden; padding:0; }
  .av-img     { width:100%; height:100%; object-fit:cover; border-radius:50%; }

  /* ── Top bar ── */
  .topbar       { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:18px 0 14px; }
  .topbar-right { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .code-lbl   { font-family:'Bellefair',serif; font-size:12px; color:#9a8f80; }
  .wish-code  { font-family:'Fira Mono',monospace; font-size:11px; color:#fde68a; background:rgba(238,232,170,.08); padding:4px 10px; border-radius:6px; letter-spacing:.06em; border:1px solid rgba(238,232,170,.2); }

  /* ── Steps ── */
  .steps   { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .step    { display:flex; align-items:center; gap:5px; font-size:11px; color:#52493e; }
  .step-dot { width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; font-size:10px; background:rgba(255,255,255,.04); color:#52493e; border:1px solid rgba(255,255,255,.08); flex-shrink:0; }
  .step.done .step-dot { background:rgba(2,255,187,.12); color:#02ffbb; border-color:rgba(2,255,187,.4); }
  .step.done  { color:#02ffbb; }
  .step.active .step-dot { background:linear-gradient(135deg,#c8155f,#ff4d9e); color:#fde68a; border-color:rgba(255,77,158,.5); box-shadow:0 0 18px rgba(255,77,158,.5); }
  .step.active { color:#ff4d9e; }
  .step-en { font-family:'Cinzel',serif; letter-spacing:.18em; text-transform:uppercase; font-size:10px; }
  .step-he { font-family:'Bellefair',serif; font-size:12px; }
  .step-sep { width:22px; height:1px; background:rgba(255,255,255,.08); flex-shrink:0; }

  /* ── Wish hero ── */
  .facet {
    position:relative;
    background:linear-gradient(180deg,rgba(238,232,170,.04),rgba(7,6,6,0)),linear-gradient(135deg,rgba(255,77,158,.05),rgba(7,6,6,0));
    border:1px solid rgba(238,232,170,.22); border-radius:20px; padding:20px 18px; overflow:hidden;
  }
  @media(min-width:640px) { .facet { border-radius:26px; padding:32px 36px; } }
  .facet::before { content:''; position:absolute; top:-1px; inset-inline-start:28px; width:14px; height:14px; background:linear-gradient(135deg,#fde68a,#aa771c); transform:rotate(45deg); box-shadow:0 0 14px rgba(238,232,170,.7); border-radius:2px; }
  .facet::after  { content:''; position:absolute; top:-1px; inset-inline-end:28px;  width:14px; height:14px; background:linear-gradient(135deg,#ff4d9e,#c8155f); transform:rotate(45deg); box-shadow:0 0 14px rgba(255,77,158,.7);  border-radius:2px; }

  .hero-inner { display:flex; align-items:flex-start; gap:14px; }
  @media(min-width:640px) { .hero-inner { gap:22px; } }
  .hero-av {
    width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#c8155f,#ff4d9e); border:2px solid #eee8aa; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; font-size:14px; color:#fde68a;
    box-shadow:0 0 22px rgba(255,77,158,.4);
  }
  @media(min-width:640px) { .hero-av { width:64px; height:64px; font-size:18px; } }
  .hero-body { flex:1; min-width:0; }
  .hero-meta { display:flex; align-items:center; gap:7px; margin-bottom:10px; flex-wrap:wrap; }
  .badge-open { font-size:10px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#fde68a; }
  .muted { font-family:'Bellefair',serif; font-size:12px; color:#9a8f80; }
  .dim   { color:#52493e; font-size:11px; }
  .hero-title { margin:0; font-family:'Sababa','Heebo',sans-serif; font-size:clamp(20px,5vw,38px); font-weight:700; line-height:1.15; color:#ede5d8; }
  .hero-long  { margin:12px 0 0; font-family:'Bellefair',serif; font-size:clamp(14px,2vw,16px); line-height:1.65; color:#c8bba8; }
  .rich-wrap :global(.editor-wrapper) { border:none !important; box-shadow:none !important; }
  .rich-wrap :global(.tiptap-content) { min-height:0 !important; padding:0 !important; }
  .rich-wrap :global(.custom-prose) { color:#c8bba8 !important; font-family:'Bellefair',serif !important; font-size:clamp(14px,2vw,16px) !important; line-height:1.65 !important; }
  .hero-footer { margin-top:18px; padding-top:15px; border-top:1px solid rgba(238,232,170,.14); display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  .hero-metas  { display:flex; gap:14px; flex-wrap:wrap; }
  .metai  { display:flex; align-items:center; gap:9px; }
  .mi-icon { font-size:14px; opacity:.85; }
  .mi-lbl  { font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:#52493e; }
  .mi-val  { font-family:'Bellefair',serif; font-size:13px; color:#ede5d8; }

  /* ── Extraction strip ── */
  .extstrip { margin-top:16px; padding:18px 16px; border:1px solid rgba(116,191,255,.18); border-radius:18px; background:linear-gradient(180deg,rgba(116,191,255,.04),rgba(116,191,255,.01)); }
  @media(min-width:640px) { .extstrip { padding:22px 26px; border-radius:20px; } }
  .extstrip-hdr { display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
  .bot-av { width:28px; height:28px; border-radius:50%; flex-shrink:0; }
  .ext-labels { flex:1; min-width:0; }
  .lev-title { font-family:'Cinzel',serif; font-size:11px; letter-spacing:.2em; color:#74bfff; text-transform:uppercase; }
  .lev-sub   { font-family:'Bellefair',serif; font-size:13px; color:#9a8f80; margin-top:2px; }
  .extgrid   { display:grid; grid-template-columns:1fr; gap:14px; }
  @media(min-width:600px) { .extgrid { grid-template-columns:1fr 1fr; gap:22px; } }
  .extcol-lbl { font-size:9px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#9a8f80; margin-bottom:9px; }
  .chips { display:flex; gap:6px; flex-wrap:wrap; }

  /* ── Chips ── */
  .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; font-family:'Bellefair',serif; font-size:12.5px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); color:#ede5d8; }
  .chip.must { background:rgba(255,0,146,.10); border-color:rgba(255,0,146,.35); color:#ff4d9e; }
  .chip.nice { background:rgba(238,232,170,.07); border-color:rgba(238,232,170,.25); color:#fde68a; }

  /* ── Status badges ── */
  .sbadge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
  .sbadge::before { content:''; width:6px; height:6px; border-radius:50%; }
  .sbadge.ready   { background:rgba(2,255,187,.08); color:#02ffbb; border:1px solid rgba(2,255,187,.3); }
  .sbadge.ready::before { background:#02ffbb; box-shadow:0 0 8px #02ffbb; }
  .sbadge.pending { background:rgba(116,191,255,.08); color:#74bfff; border:1px solid rgba(116,191,255,.3); }
  .sbadge.pending::before { background:#74bfff; box-shadow:0 0 8px #74bfff; }

  /* ── Buttons ── */
  .btn-jewel {
    display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border:none; cursor:pointer;
    border-radius:14px; font-family:'Sababa','Heebo',sans-serif; font-weight:700; font-size:15px;
    color:#fde68a; white-space:nowrap;
    background:linear-gradient(135deg,#c8155f,#ff4d9e);
    box-shadow:inset 1px 1px 0 rgba(255,255,255,.25),inset -1px -1px 0 rgba(0,0,0,.4),0 6px 20px rgba(200,21,95,.4);
    transition:transform .2s;
  }
  .btn-jewel:hover { transform:translateY(-1px); }
  .btn-ghost { background:transparent; border:1px solid rgba(255,255,255,.1); color:#9a8f80; padding:9px 16px; border-radius:12px; font-size:13px; cursor:pointer; transition:all .2s; text-decoration:none; display:inline-flex; align-items:center; white-space:nowrap; }
  .btn-ghost:hover { color:#ede5d8; border-color:rgba(238,232,170,.3); background:rgba(238,232,170,.04); }
  .btn-xs { padding:7px 12px; font-size:12px; }

  /* ── Gems ── */
  .gem { width:8px; height:8px; display:inline-block; background:linear-gradient(135deg,#ff4d9e,#c8155f); transform:rotate(45deg); box-shadow:0 0 12px rgba(255,77,158,.7); flex-shrink:0; }
  .gem-gold  { background:linear-gradient(135deg,#fde68a,#aa771c); box-shadow:0 0 12px rgba(238,232,170,.7); }
  .gem-green { background:linear-gradient(135deg,#02ffbb,#037d5b); box-shadow:0 0 12px rgba(2,255,187,.6); }
  .gem-blue  { background:linear-gradient(135deg,#74bfff,#04619f); box-shadow:0 0 12px rgba(116,191,255,.6); }

  /* ── Section label ── */
  .section-label { font-size:11px; font-weight:700; color:#9a8f80; letter-spacing:.24em; text-transform:uppercase; display:flex; align-items:center; gap:14px; margin:32px 0 16px; }
  .section-label::before,.section-label::after { content:''; flex:1; height:1px; background:linear-gradient(to right,transparent,rgba(255,255,255,.08),transparent); }
  .section-label .lead { flex:0 0 auto; display:flex; align-items:center; gap:8px; }

  /* ── Tabs ── */
  .tabs { display:flex; gap:5px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:4px; width:max-content; margin-bottom:16px; flex-wrap:wrap; }
  .tab { padding:7px 12px; border-radius:10px; font-size:12px; font-weight:600; color:#9a8f80; background:transparent; border:none; cursor:pointer; white-space:nowrap; }
  .tab.active { background:rgba(238,232,170,.10); color:#fde68a; box-shadow:inset 0 0 0 1px rgba(238,232,170,.25); }

  /* ── Layout ── */
  .layout { display:grid; grid-template-columns:1fr; gap:24px; align-items:start; margin-top:32px; }
  @media(min-width:1080px) { .layout { grid-template-columns:1fr 340px; } }

  /* ── Plan row ── */
  .plan-row {
    display:grid; grid-template-columns:1fr; gap:14px; padding:16px; border-radius:18px;
    background:linear-gradient(135deg,rgba(255,255,255,.015),rgba(255,255,255,0));
    border:1px solid rgba(255,255,255,.05); margin-bottom:12px; position:relative;
    animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both;
  }
  @media(min-width:700px) { .plan-row { grid-template-columns:240px 1fr; padding:18px; } }
  .plan-row.met { border-color:rgba(2,255,187,.22); }
  .plan-row.met::before { content:''; position:absolute; inset-inline-start:0; top:18px; bottom:18px; width:3px; background:linear-gradient(180deg,#02ffbb,transparent); border-radius:999px; }

  .need { display:flex; flex-direction:column; gap:8px; }
  @media(min-width:700px) { .need { padding-inline-end:18px; border-inline-end:1px solid rgba(238,232,170,.12); } }
  .need-kind  { display:flex; align-items:center; gap:8px; }
  .need-title  { font-family:'Sababa','Heebo',sans-serif; font-size:clamp(17px,4vw,22px); font-weight:700; line-height:1.1; color:#ede5d8; }
  .need-detail { font-family:'Bellefair',serif; font-size:13px; color:#9a8f80; line-height:1.5; }
  .need-ftr    { display:flex; gap:14px; margin-top:auto; padding-top:8px; }

  /* ── Provider cards ── */
  .opt-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; }
  .pcard { border:1px solid rgba(255,255,255,.07); background:linear-gradient(180deg,rgba(255,255,255,.015),rgba(255,255,255,0)); border-radius:18px; padding:14px; position:relative; transition:all .25s; }
  .pcard:hover { border-color:rgba(238,232,170,.32); transform:translateY(-2px); }
  .pcard.accepted { border-color:rgba(2,255,187,.4);   box-shadow:0 0 0 1px rgba(2,255,187,.18),0 0 30px rgba(2,255,187,.16); }
  .pcard.pending  { border-color:rgba(116,191,255,.35); box-shadow:0 0 0 1px rgba(116,191,255,.14),0 0 24px rgba(116,191,255,.12); }
  .pcard.matching { border-color:rgba(238,232,170,.3);  box-shadow:0 0 0 1px rgba(238,232,170,.14),0 0 24px rgba(238,232,170,.12); }
  .pcard-top  { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }
  .pname      { font-family:'Sababa','Heebo',sans-serif; font-size:15px; font-weight:700; color:#ede5d8; line-height:1.2; }
  .pproj      { font-family:'Bellefair',serif; font-size:12px; color:#9a8f80; margin-top:2px; }
  .score-crown { display:inline-flex; align-items:baseline; gap:3px; font-family:'Cinzel',serif; font-weight:600; color:#fde68a; }
  .score-n    { font-size:20px; }
  .score-p    { font-size:11px; color:#9a8f80; }
  .pnote      { font-family:'Bellefair',serif; font-size:13px; color:#c8bba8; line-height:1.5; margin-bottom:10px; }
  .pbadges    { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:10px; }
  .pbadge     { font-size:9px; font-weight:700; color:#9a8f80; letter-spacing:.12em; text-transform:uppercase; padding:2px 8px; border-radius:999px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.06); }
  .pcard-ftr  { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:10px; border-top:1px solid rgba(255,255,255,.06); }

  /* ── No provider placeholder ── */
  .no-prov { padding:18px; border:1px dashed rgba(255,255,255,.12); border-radius:18px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:8px; min-height:110px; background:repeating-linear-gradient(-45deg,rgba(255,255,255,.012) 0 8px,transparent 8px 16px); }

  /* ── Suggestion cards (real members / free resources for an open need) ── */
  .sug-wrap { grid-column:1/-1; border:1px dashed rgba(238,232,170,.22); border-radius:16px; padding:12px; display:flex; flex-direction:column; gap:8px; background:repeating-linear-gradient(-45deg,rgba(238,232,170,.015) 0 8px,transparent 8px 16px); }
  .sug-lbl  { font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#fde68a; }
  .scard    { display:flex; align-items:center; gap:10px; padding:8px 10px; border:1px solid rgba(255,255,255,.06); border-radius:12px; background:rgba(255,255,255,.02); }
  .scard:hover { border-color:rgba(238,232,170,.28); }
  .sug-skills { display:flex; align-items:center; gap:5px; flex-wrap:wrap; margin-top:3px; }

  /* ── Extraction editor ── */
  .edit-list { display:flex; flex-direction:column; gap:8px; }
  .edit-row  { display:flex; align-items:center; gap:6px; }
  .edit-in   { flex:1; min-width:0; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:9px; padding:7px 10px; color:#ede5d8; font-family:'Bellefair',serif; font-size:13px; }
  .edit-num  { width:62px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:9px; padding:7px 8px; color:#ede5d8; font-family:'Bellefair',serif; font-size:13px; text-align:center; }
  .edit-in:focus, .edit-num:focus { outline:none; border-color:rgba(238,232,170,.4); }
  .imp-toggle { flex-shrink:0; padding:6px 9px; border-radius:9px; font-size:11px; font-weight:700; cursor:pointer; border:1px solid transparent; white-space:nowrap; }
  .imp-toggle.must { background:rgba(255,0,146,.1); border-color:rgba(255,0,146,.35); color:#ff4d9e; }
  .imp-toggle.nice { background:rgba(238,232,170,.07); border-color:rgba(238,232,170,.25); color:#fde68a; }
  .edit-del { flex-shrink:0; width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,.1); background:transparent; color:#9a8f80; cursor:pointer; font-size:13px; }
  .edit-del:hover { color:#ff4d9e; border-color:rgba(255,77,158,.35); }
  .edit-add { align-self:flex-start; padding:6px 12px; border-radius:9px; border:1px dashed rgba(238,232,170,.3); background:transparent; color:#fde68a; cursor:pointer; font-size:12px; font-family:'Bellefair',serif; }
  .edit-add:hover { background:rgba(238,232,170,.05); }

  /* ── Disc (avatar circle) ── */
  .disc     { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#201d19,#2a2520); border:2px solid rgba(238,232,170,.4); display:inline-flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; color:#fde68a; font-weight:700; font-size:12px; letter-spacing:.06em; flex-shrink:0; }
  .disc-sm  { width:32px; height:32px; font-size:10px; }

  /* ── Panel ── */
  .panel { background:#171512; border:1px solid rgba(255,255,255,.05); border-radius:18px; padding:18px; margin-bottom:18px; }
  .panel h4 { margin:0 0 12px; font-family:'Cinzel',serif; font-size:13px; letter-spacing:.18em; color:#fde68a; text-transform:uppercase; }

  /* ── Right rail ── */
  .rail { display:flex; flex-direction:column; }
  @media(min-width:1080px) { .rail { position:sticky; top:76px; } }

  /* ── Harmony ring ── */
  .harmony-wrap    { position:relative; display:flex; align-items:center; justify-content:center; }
  .harmony-counter { position:absolute; bottom:-2px; left:0; right:0; text-align:center; }
  .hc-lbl { font-family:'Cinzel',serif; font-size:10px; color:#9a8f80; letter-spacing:.22em; text-transform:uppercase; }
  .hc-num { font-family:'Sababa','Heebo',sans-serif; font-size:28px; color:#fde68a; line-height:1; margin-top:4px; }

  /* ── Total card ── */
  .total-card { border:1px solid rgba(238,232,170,.35); background:radial-gradient(120% 80% at 0% 0%,rgba(238,232,170,.06),transparent 60%),radial-gradient(120% 80% at 100% 100%,rgba(200,21,95,.06),transparent 60%),#0e0d0c; border-radius:22px; padding:20px; margin-bottom:18px; }
  .cov-track  { height:6px; border-radius:999px; background:rgba(255,255,255,.05); overflow:hidden; margin-bottom:16px; }
  .cov-fill   { height:100%; background:linear-gradient(90deg,#02ffbb 0%,#fde68a 60%,#ff4d9e 100%); border-radius:999px; box-shadow:0 0 12px rgba(238,232,170,.5); transition:width .6s ease; }

  /* ── Consent row ── */
  .consent-row { display:flex; align-items:center; gap:10px; padding:10px 14px; background:rgba(2,255,187,.04); border:1px dashed rgba(2,255,187,.25); border-radius:12px; font-family:'Bellefair',serif; font-size:13px; color:#ede5d8; }
</style>
