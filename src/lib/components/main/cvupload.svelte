<script lang="ts">
  import { goto } from '$app/navigation';

  // ─── Types ───────────────────────────────────────────────────────────────────

  type MatchResult = {
    input: string;
    status: 'matched' | 'suggestion' | 'new';
    existingId?: string;
    existingLabel?: string;
    similarity?: number;
  };

  type MatchGroup = {
    skills: MatchResult[];
    roles: MatchResult[];
    methods: MatchResult[];
  };

  type WorkflowOutput = {
    matched: MatchGroup;
    suggestions: MatchGroup;
    newItems: MatchGroup;
    tasks: string[];
  };

  // ─── State ───────────────────────────────────────────────────────────────────

  let step: 'upload' | 'loading' | 'review' = $state('upload');
  let error = $state('');
  let dragging = $state(false);
  let saving = $state(false);

  let data: WorkflowOutput | null = $state(null);

  // משתמש יכול לאשר/לדחות suggestions ו-newItems
  // suggestion שאושר → ישתמש ב-existingId
  // suggestion שנדחה → יוצר חדש
  // newItem שנדחה → מוסר מהפרופיל
  type Decision = 'accept' | 'reject' | 'pending';
  let suggestionDecisions: Record<string, Decision> = $state({});
  let newItemDecisions: Record<string, Decision> = $state({});

  // ─── Upload ──────────────────────────────────────────────────────────────────

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'application/rtf'
  ];

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      error = 'הקובץ גדול מדי — עד 5MB';
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      error = 'פורמט לא נתמך';
      return;
    }

    error = '';
    step = 'loading';

    const form = new FormData();
    form.append('cv', file);

    try {
      const res = await fetch('/api/analyze-cv', {
        method: 'POST',
        body: form
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? `שגיאה ${res.status}`);
      }
      data = (await res.json()) as WorkflowOutput;

      // אתחל decisions ל-pending
      const allSuggestions = [
        ...data.suggestions.skills,
        ...data.suggestions.roles,
        ...data.suggestions.methods
      ];
      const allNew = [
        ...data.newItems.skills,
        ...data.newItems.roles,
        ...data.newItems.methods
      ];
      allSuggestions.forEach((s) => {
        suggestionDecisions[s.input] = 'pending';
      });
      allNew.forEach((n) => {
        newItemDecisions[n.input] = 'pending';
      });

      step = 'review';
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'שגיאה לא צפויה';
      step = 'upload';
    }
  }

  function onFileInput(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: DragEvent) {
    dragging = false;
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  async function confirmProfile() {
    if (!data) return;
    saving = true;

    // בנה פרופיל סופי: רק מה שאושר
    const resolvedSkills = [
      ...data.matched.skills.map((s) => ({
        id: s.existingId!,
        label: s.existingLabel!
      })),
      ...data.suggestions.skills
        .filter((s) => suggestionDecisions[s.input] === 'accept')
        .map((s) => ({ id: s.existingId!, label: s.existingLabel! })),
      ...data.suggestions.skills
        .filter((s) => suggestionDecisions[s.input] === 'reject')
        .map((s) => ({ id: null, label: s.input })), // יוצר חדש
      ...data.newItems.skills
        .filter((s) => newItemDecisions[s.input] !== 'reject')
        .map((s) => ({ id: null, label: s.input }))
    ];

    // (זהה ל-roles ו-methods — בפרודקשן כדאי לפקטר לפונקציה)

    try {
      await fetch(`${import.meta.env.VITE_STRAPI_URL}/api/user-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            skills: resolvedSkills,
            tasks: data.tasks
            // roles, methods — זהה
          }
        })
      });
      goto('/onboarding/matches');
    } catch {
      error = 'שגיאה בשמירה, נסה שוב';
    } finally {
      saving = false;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function pct(sim?: number) {
    return sim != null ? `${Math.round(sim * 100)}%` : '';
  }

  function hasSuggestions(d: WorkflowOutput) {
    return (
      d.suggestions.skills.length +
        d.suggestions.roles.length +
        d.suggestions.methods.length >
      0
    );
  }

  function hasNew(d: WorkflowOutput) {
    return (
      d.newItems.skills.length +
        d.newItems.roles.length +
        d.newItems.methods.length >
      0
    );
  }
</script>

<!-- ─── Upload ─────────────────────────────────────────────────────────────── -->
{#if step === 'upload'}
  <section>
    <h1>העלאת קורות חיים</h1>
    {#if error}<p class="error">{error}</p>{/if}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="drop-zone"
      class:dragging
      ondragover={(e) => {
        e.preventDefault();
        dragging = true;
      }}
      ondragleave={(e) => {
        e.preventDefault();
        dragging = false;
      }}
      ondrop={onDrop}
      onclick={() => document.getElementById('cv-input')?.click()}
    >
      <p class="icon">↑</p>
      <p>גררו לכאן או לחצו להעלאה</p>
      <p class="sub">PDF · Word · RTF · טקסט — עד 5MB</p>
    </div>
    <input
      id="cv-input"
      type="file"
      accept=".pdf,.docx,.doc,.txt,.md,.rtf"
      hidden
      onchange={onFileInput}
    />
  </section>
{/if}

<!-- ─── Loading ───────────────────────────────────────────────────────────── -->
{#if step === 'loading'}
  <section class="center">
    <div class="spinner"></div>
    <p>מנתח ומתאים לרשימות הקיימות...</p>
  </section>
{/if}

<!-- ─── Review ────────────────────────────────────────────────────────────── -->
{#if step === 'review' && data}
  <section>
    <h1>תוצאות הניתוח</h1>
    {#if error}<p class="error">{error}</p>{/if}

    <!-- ── אושרו אוטומטית ───────────────────────────────────────────────── -->
    <div class="group">
      <div class="group-header matched-header">
        <span class="dot green"></span>
        אותרו ב-Lev1 — מוסיפים אוטומטית
      </div>

      {#each ['skills', 'roles', 'methods'] as cat}
        {#if data.matched[cat as keyof typeof data.matched].length > 0}
          <div class="sub-label">
            {cat === 'skills'
              ? 'כישורים'
              : cat === 'roles'
                ? 'תפקידים'
                : 'דרכי עשיה'}
          </div>
          <div class="tags">
            {#each data.matched[cat as keyof typeof data.matched] as item}
              <span class="tag matched" title="דמיון: {pct(item.similarity)}">
                {item.existingLabel}
                <small>{pct(item.similarity)}</small>
              </span>
            {/each}
          </div>
        {/if}
      {/each}
    </div>

    <!-- ── הצעות — מחכות לאישור ──────────────────────────────────────────── -->
    {#if hasSuggestions(data)}
      <div class="group">
        <div class="group-header suggestion-header">
          <span class="dot amber"></span>
          דומה לקיים — בחר מה להשתמש
        </div>
        <p class="hint">
          בחרנו דומה מהמערכת. אם זה נכון — אשר. אם לא — נוסיף חדש.
        </p>

        {#each ['skills', 'roles', 'methods'] as cat}
          {#each data.suggestions[cat as keyof typeof data.suggestions] as item}
            <div class="suggestion-row">
              <div class="suggestion-labels">
                <span class="label-new">{item.input}</span>
                <span class="arrow">→</span>
                <span class="label-existing">{item.existingLabel}</span>
                <small class="sim">{pct(item.similarity)}</small>
              </div>
              <div class="btn-group">
                <button
                  class="btn-accept"
                  class:active={suggestionDecisions[item.input] === 'accept'}
                  onclick={() => (suggestionDecisions[item.input] = 'accept')}
                  >כן, השתמש בקיים</button
                >
                <button
                  class="btn-reject"
                  class:active={suggestionDecisions[item.input] === 'reject'}
                  onclick={() => (suggestionDecisions[item.input] = 'reject')}
                  >לא, הוסף חדש</button
                >
              </div>
            </div>
          {/each}
        {/each}
      </div>
    {/if}

    <!-- ── חדשים לגמרי ────────────────────────────────────────────────────── -->
    {#if hasNew(data)}
      <div class="group">
        <div class="group-header new-header">
          <span class="dot blue"></span>
          חדשים במערכת — יתווספו לאוצר המילים
        </div>
        <p class="hint">
          הפריטים האלה לא קיימים עדיין ב-Lev1. יתווספו בעת האישור.
        </p>

        {#each ['skills', 'roles', 'methods'] as cat}
          {#if data.newItems[cat as keyof typeof data.newItems].length > 0}
            <div class="sub-label">
              {cat === 'skills'
                ? 'כישורים'
                : cat === 'roles'
                  ? 'תפקידים'
                  : 'דרכי עשיה'}
            </div>
            <div class="tags">
              {#each data.newItems[cat as keyof typeof data.newItems] as item}
                <span
                  class="tag new-item"
                  class:rejected={newItemDecisions[item.input] === 'reject'}
                  onclick={() => {
                    newItemDecisions[item.input] =
                      newItemDecisions[item.input] === 'reject'
                        ? 'pending'
                        : 'reject';
                  }}
                  title="לחץ להסרה"
                >
                  {item.input}
                  {newItemDecisions[item.input] === 'reject' ? '✕' : '+'}
                </span>
              {/each}
            </div>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- ── משימות ──────────────────────────────────────────────────────────── -->
    {#if data.tasks.length > 0}
      <div class="group">
        <div class="group-header">משימות והישגים</div>
        <ul class="tasks-list">
          {#each data.tasks as task}
            <li>{task}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <button class="primary" onclick={confirmProfile} disabled={saving}>
      {saving ? 'שומר...' : 'אישור והמשך לשותפויות ←'}
    </button>
  </section>
{/if}

<style>
  .error {
    color: #c0392b;
    font-size: 14px;
  }
  .drop-zone {
    border: 2px dashed #ccc;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    border-radius: 12px;
  }
  .drop-zone.dragging {
    border-color: #378add;
    background: #f0f7ff;
  }
  .icon {
    font-size: 24px;
    margin: 0;
  }
  .sub {
    font-size: 13px;
    color: #888;
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #eee;
    border-top-color: #378add;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .center {
    text-align: center;
    padding: 3rem;
  }

  .group {
    border: 0.5px solid #e5e5e5;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }
  .group-header {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .matched-header {
    color: #085041;
  }
  .suggestion-header {
    color: #633806;
  }
  .new-header {
    color: #0c447c;
  }
  .hint {
    font-size: 13px;
    color: #888;
    margin: -0.25rem 0 0.75rem;
  }
  .sub-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #aaa;
    margin: 0.5rem 0 0.3rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .dot.green {
    background: #1d9e75;
  }
  .dot.amber {
    background: #ba7517;
  }
  .dot.blue {
    background: #378add;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px;
    border-radius: 99px;
    font-size: 13px;
    cursor: default;
  }
  .tag small {
    font-size: 10px;
    opacity: 0.6;
  }
  .tag.matched {
    background: #e1f5ee;
    color: #085041;
  }
  .tag.new-item {
    background: #e6f1fb;
    color: #0c447c;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .tag.new-item.rejected {
    background: #f5f5f5;
    color: #aaa;
    text-decoration: line-through;
  }

  .suggestion-row {
    border: 0.5px solid #f0e0c0;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    background: #fdf8f0;
  }
  .suggestion-labels {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0.5rem;
    font-size: 14px;
  }
  .label-new {
    color: #333;
  }
  .label-existing {
    color: #085041;
    font-weight: 500;
  }
  .arrow {
    color: #aaa;
  }
  .sim {
    font-size: 11px;
    color: #aaa;
    margin-right: auto;
  }
  .btn-group {
    display: flex;
    gap: 6px;
  }
  .btn-accept,
  .btn-reject {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    border: 0.5px solid;
    transition: all 0.15s;
  }
  .btn-accept {
    border-color: #1d9e75;
    color: #085041;
    background: transparent;
  }
  .btn-accept.active {
    background: #e1f5ee;
  }
  .btn-reject {
    border-color: #ccc;
    color: #888;
    background: transparent;
  }
  .btn-reject.active {
    background: #f5f5f5;
  }

  .tasks-list {
    margin: 0;
    padding-right: 1.25rem;
    font-size: 14px;
    line-height: 1.8;
    color: #444;
  }
  .primary {
    width: 100%;
    padding: 12px;
    background: #378add;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    margin-top: 1rem;
  }
  .primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
