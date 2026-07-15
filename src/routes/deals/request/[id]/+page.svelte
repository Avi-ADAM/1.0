<script lang="ts">
  import { goto } from '$app/navigation';
  import MatanotPublicView from '$lib/components/products/MatanotPublicView.svelte';
  import { toast } from 'svelte-sonner';
  import ChatSmall from '$lib/components/footer/chatSmall.svelte';
  import { forum, nowChatId, isChatOpen, initialForum } from '$lib/stores/pendMisMes.js';
  import { addVote, rejectSheirutpend } from '$lib/client/actionClient';

  let { data } = $props();

  const KIND_ICON: Record<string, string> = {
    monthly: '📅', yearly: '📆', total: '⭐', unlimited: '∞', daily: '🌅'
  };
  const KIND_LABEL: Record<string, string> = {
    monthly: 'מינוי חודשי', yearly: 'מינוי שנתי', total: 'תשלום חד פעמי',
    unlimited: 'ליחידה - ללא הגבלה', daily: 'יומי'
  };

  function fmt(iso?: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  }

  const isComplexProduct = $derived(data.pricingMode && data.pricingMode !== 'fixed');

  const matanotForView = $derived(
    isComplexProduct
      ? {
          id: data.productId ?? '',
          name: data.productName,
          pricingMode: data.pricingMode,
          estimatedPrice: data.estimatedPrice,
          marginPct: data.marginPct,
          matanot_recipe_missions: { data: data.matanot_recipe_missions ?? [] },
          matanot_recipe_resources: { data: data.matanot_recipe_resources ?? [] }
        }
      : null
  );

  let isCreatingChat = $state(false);
  let localForumId = $state(data.forumId ?? null);
  let isProcessing = $state(false);
  let localVoteCount = $state(data.voteCount ?? 0);
  let localAlreadyVoted = $state(data.alreadyVoted ?? false);

  async function handleApprove() {
    if (isProcessing || localAlreadyVoted) return;
    isProcessing = true;
    try {
      const result = await addVote({
        type: 'sheirutpend',
        id: data.id,
        projectId: String(data.projectId)
      });
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      localAlreadyVoted = true;
      localVoteCount += 1;

      if (data.memberCount === 1 || result.data?._deleted) {
        toast.success('הבקשה אושרה — נוצר שירות חדש!');
        await goto('/deals');
      } else {
        toast.success(`הצבעתך נרשמה (${localVoteCount}/${data.memberCount})`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('שגיאה באישור הבקשה');
    } finally {
      isProcessing = false;
    }
  }

  async function handleReject() {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const result = await rejectSheirutpend({
        id: data.id,
        projectId: String(data.projectId)
      });
      if (!result.success) throw new Error(result.error?.message || 'Failed');
      toast.success('הבקשה נדחתה');
      await goto('/deals');
    } catch (err: any) {
      console.error(err);
      toast.error('שגיאה בדחיית הבקשה');
    } finally {
      isProcessing = false;
    }
  }

  async function handleOpenChat() {
    if (isCreatingChat) return;

    if (!localForumId) {
      isCreatingChat = true;
      try {
        const response = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionKey: 'ensureSheirutpendForum',
            params: {
              projectId: String(data.projectId),
              sheirutpendId: String(data.id)
            }
          })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || 'Failed to create chat');

        localForumId = result.data?.forumId ?? result.forumId;
        if (!localForumId) throw new Error('No forum ID returned');
      } catch (err: any) {
        console.error(err);
        toast.error('שגיאה בפתיחת הצ׳אט');
        return;
      } finally {
        isCreatingChat = false;
      }
    }

    const md = {
      pid: Number(data.projectId),
      projectName: data.projectName,
      projectPic: data.projectPic,
      title: data.productName,
      requestUrl: `/deals/request/${data.id}`
    };

    const tempF = $forum;
    tempF[localForumId] = {
      loading: false,
      messages: tempF[localForumId]?.messages || [],
      md
    };
    forum.set(tempF);
    initialForum(false, [String(localForumId)], 0);
    nowChatId.set(localForumId);
    isChatOpen.set(true);
  }
</script>

<svelte:head>
  <title>{data.productName} · בקשת הזמנה</title>
</svelte:head>

<main class="page-wrap" dir="rtl">
  <button class="back-btn" onclick={() => goto('/deals')}>← חזרה לעסקאות</button>

  <div class="hero">
    {#if data.projectPic}
      <img src={data.projectPic} alt={data.projectName} class="proj-pic" />
    {/if}
    <div>
      <div class="pending-badge">
        {#if data.kind === 'buy'}
          ⏳ ממתינה לאישור המוכר
        {:else if localAlreadyVoted && data.memberCount === 1}
          ✓ אושרה
        {:else if localAlreadyVoted}
          ✓ הצבעתך נרשמה
        {:else}
          ⏳ ממתינה לאישורך
        {/if}
      </div>
      <h1 class="product-name">{data.productName}</h1>
      <div class="project-name">{data.projectName}</div>
    </div>
  </div>

  <div class="cards-row">
    <!-- Details card -->
    <div class="info-card">
      <div class="card-title">פרטי הבקשה</div>
      <div class="rows">
        <div class="row">
          <span class="rl">סוג</span>
          <span class="rv">{KIND_ICON[data.productKindOf] ?? '🎁'} {KIND_LABEL[data.productKindOf] ?? '—'}</span>
        </div>
        <div class="row">
          <span class="rl">כמות</span>
          <span class="rv">{data.quant}</span>
        </div>
        <div class="row">
          <span class="rl">מחיר ליחידה</span>
          <span class="rv">₪ {Number(data.price).toLocaleString()}</span>
        </div>
        <div class="row total-row">
          <span class="rl">סה"כ</span>
          <span class="rv gold">₪ {Number(data.total).toLocaleString()}</span>
        </div>
        {#if data.startDate}
          <div class="row">
            <span class="rl">תאריך התחלה</span>
            <span class="rv">{fmt(data.startDate)}</span>
          </div>
        {/if}
        {#if data.finnishDate}
          <div class="row">
            <span class="rl">תאריך סיום</span>
            <span class="rv">{fmt(data.finnishDate)}</span>
          </div>
        {/if}
        <div class="row">
          <span class="rl">הוגשה</span>
          <span class="rv">{fmt(data.createdAt)}</span>
        </div>
      </div>
    </div>

    <!-- Requester / status card -->
    <div class="info-card">
      <div class="card-title">{data.kind === 'buy' ? 'הרוכש' : 'פרטי הבקשה'}</div>
      <div class="rows">
        {#if data.requesterPic}
          <img src={data.requesterPic} alt={data.requesterName} class="avatar" />
        {:else}
          <div class="avatar-placeholder">{(data.requesterName || '?').charAt(0)}</div>
        {/if}
        <div class="row">
          <span class="rl">שם</span>
          <a href="/user/{data.requesterId}" class="rv user-link">{data.requesterName || '—'}</a>
        </div>
      </div>

      {#if data.kind === 'buy'}
        <div class="status-box">
          <div class="status-icon">⏳</div>
          <div class="status-text">
            הבקשה שלך התקבלה ומועברת לאישור הפרויקט.
            תקבל/י עדכון כשהפרויקט יאשר.
          </div>
        </div>
      {:else}
        <div class="seller-actions">
          {#if data.memberCount > 1}
            <div class="vote-progress">
              <div class="vote-bar-wrap">
                <div class="vote-bar" style="width: {Math.round((localVoteCount / data.memberCount) * 100)}%"></div>
              </div>
              <span class="vote-label">{localVoteCount} / {data.memberCount} אישורים</span>
            </div>
          {/if}
          <div class="seller-btns">
            <button
              class="btn-reject"
              onclick={handleReject}
              disabled={isProcessing}
            >
              דחייה
            </button>
            <button
              class="btn-approve"
              onclick={handleApprove}
              disabled={isProcessing || localAlreadyVoted}
            >
              {#if isProcessing}
                מעבד...
              {:else if localAlreadyVoted}
                אישרת ✓
              {:else if data.memberCount === 1}
                אישור ויצירת עסקה
              {:else}
                אישור
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- BOM / Recipe section for complex products -->
  {#if isComplexProduct && matanotForView}
    <div class="bom-section">
      <MatanotPublicView matanot={matanotForView} />
    </div>
  {/if}

  <div class="actions">
    <!-- Chat button -->
    <button class="btn-chat" onclick={handleOpenChat} disabled={isCreatingChat}>
      <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {isCreatingChat ? 'פותח צ׳אט...' : 'צ׳אט'}
    </button>
    <button class="btn-primary" onclick={() => goto('/deals')}>לכל העסקאות</button>
    <a href="/gift/{data.productId ?? ''}" class="btn-secondary">לדף המוצר</a>
  </div>
</main>

{#if $isChatOpen}
  <div class="chat-overlay">
    <button class="chat-overlay-close" onclick={() => isChatOpen.set(false)}>✕</button>
    <ChatSmall un={data.un ?? ''} />
  </div>
{/if}

<style>
  .page-wrap {
    max-width: 820px;
    margin: 0 auto;
    padding: 24px 16px 80px;
  }
  .back-btn {
    background: none;
    border: none;
    color: var(--tm);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 24px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .back-btn:hover { color: var(--text); }

  .hero {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }
  .proj-pic {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border);
    flex-shrink: 0;
  }
  .pending-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    background: var(--gold-d);
    color: var(--gold-l);
    border: 1px solid var(--border-g);
    display: inline-block;
    margin-bottom: 8px;
  }
  .product-name {
    font-size: 24px;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 4px;
  }
  .project-name {
    font-size: 14px;
    color: var(--tm);
  }

  .cards-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }
  @media (max-width: 600px) {
    .cards-row { grid-template-columns: 1fr; }
  }

  .info-card {
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 20px;
  }
  .card-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--tm);
    letter-spacing: 0.5px;
    margin-bottom: 16px;
    text-transform: uppercase;
  }
  .rows { display: flex; flex-direction: column; gap: 10px; }
  .row { display: flex; justify-content: space-between; align-items: center; }
  .rl { font-size: 12px; color: var(--td); }
  .rv { font-size: 13px; font-weight: 700; color: var(--text); }
  .rv.gold { color: var(--gold-l); }
  .total-row {
    border-top: 1px solid var(--border);
    padding-top: 10px;
    margin-top: 4px;
  }

  .user-link {
    color: var(--text);
    text-decoration: none;
    transition: color 0.15s;
  }
  .user-link:hover { color: var(--gold-l); text-decoration: underline; }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border);
    margin-bottom: 10px;
  }
  .avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--gold-d);
    color: var(--gold-l);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .status-box {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-top: 16px;
    padding: 14px;
    background: var(--s2);
    border-radius: 10px;
    border: 1px solid var(--border);
  }
  .status-icon { font-size: 22px; flex-shrink: 0; }
  .status-text { font-size: 13px; color: var(--tm); line-height: 1.6; }

  .bom-section {
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 20px;
    margin-bottom: 28px;
  }

  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  .btn-chat {
    padding: 10px 20px;
    background: var(--s2);
    color: #3b82f6;
    border: 2px solid #3b82f6;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-chat:hover { background: #eff6ff; }
  .btn-chat:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-icon { width: 18px; height: 18px; }
  .btn-primary {
    padding: 10px 24px;
    background: linear-gradient(135deg, var(--gold), var(--pink));
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .btn-primary:hover { opacity: 0.85; }
  .btn-secondary {
    padding: 10px 24px;
    background: var(--s2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .btn-secondary:hover { background: var(--s3); }

  .chat-overlay {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 340px;
    height: 500px;
    background: var(--s1, #fff);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .chat-overlay-close {
    position: absolute;
    top: 8px;
    left: 8px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--tm, #6b7280);
    z-index: 1;
    padding: 4px 8px;
    border-radius: 6px;
    line-height: 1;
  }
  .chat-overlay-close:hover { background: var(--s2, #f3f4f6); }
  @media (max-width: 600px) {
    .chat-overlay { width: 100%; bottom: 0; right: 0; border-radius: 16px 16px 0 0; height: 60vh; }
    .chat-overlay-close { top: 10px; }
  }

  .seller-actions {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .vote-progress {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .vote-bar-wrap {
    height: 6px;
    background: var(--s3, #e5e7eb);
    border-radius: 99px;
    overflow: hidden;
  }
  .vote-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--gold, #f59e0b), var(--pink, #ec4899));
    border-radius: 99px;
    transition: width 0.3s ease;
  }
  .vote-label {
    font-size: 11px;
    color: var(--tm, #6b7280);
    font-weight: 600;
  }
  .seller-btns {
    display: flex;
    gap: 10px;
  }
  .btn-reject {
    flex: 1;
    padding: 10px 16px;
    background: var(--s1, #fff);
    color: #ef4444;
    border: 2px solid #ef4444;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-reject:hover:not(:disabled) { background: #fef2f2; }
  .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-approve {
    flex: 2;
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--gold, #f59e0b), var(--pink, #ec4899));
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .btn-approve:hover:not(:disabled) { opacity: 0.85; }
  .btn-approve:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
