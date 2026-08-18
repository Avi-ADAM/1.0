<script>
  import { t } from '$lib/translations';
  import Header from '$lib/components/header/header.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';

  let { data } = $props();

  let projectId = $derived(data.projectId);
  let isRegisteredUser = $derived(data.isRegisteredUser);
  let project = $derived(data.projectData);
  let attrs = $derived(project?.attributes);

  /** @type {'rtl' | 'ltr'} */
  let dir = $derived($lang === 'he' ? 'rtl' : 'ltr');

  let logoSrc = $derived(
    attrs?.profilePic?.data
      ? attrs.profilePic.data.attributes.formats?.thumbnail?.url ||
          attrs.profilePic.data.attributes.url
      : null
  );

  let isMember = $derived(
    Boolean(
      data.uid &&
        (attrs?.user_1s?.data || []).some((u) => String(u.id) === String(data.uid))
    )
  );

  let vallues = $derived.by(() => {
    const base = attrs?.vallues?.data || [];
    return base
      .map((v) => {
        const loc = v?.attributes?.localizations?.data;
        return $lang === 'he' && loc?.length > 0
          ? loc[0].attributes.valueName
          : v?.attributes?.valueName;
      })
      .filter(Boolean);
  });
  let restimeLabel = $derived(
    $t(`pages.restime.${attrs?.restime ?? 'feh'}`)
  );

  /** @type {'mission' | 'resource'} */
  let kind = $state('mission');

  // Mission form
  let mName = $state('');
  let mDescrip = $state('');
  let mHours = $state('');
  let mPerhour = $state('');

  // Resource form
  let rName = $state('');
  let rDescrip = $state('');
  let rPrice = $state('');
  let rKindOf = $state('total');
  let rHm = $state('1');
  let rRecurring = $state(false);

  let sending = $state(false);
  let sent = $state(false);
  let errorMsg = $state('');

  async function submit() {
    errorMsg = '';
    if (kind === 'mission' && !mName.trim()) return;
    if (kind === 'resource' && !rName.trim()) return;
    sending = true;
    try {
      const result =
        kind === 'mission'
          ? await executeAction('nominateSelfMission', {
              projectId,
              name: mName.trim(),
              descrip: mDescrip.trim() || undefined,
              noofhours: mHours !== '' ? Number(mHours) : undefined,
              perhour: mPerhour !== '' ? Number(mPerhour) : undefined
            })
          : await executeAction('nominateSelfResource', {
              projectId,
              name: rName.trim(),
              descrip: rDescrip.trim() || undefined,
              price: rPrice !== '' ? Number(rPrice) : undefined,
              hm: rHm !== '' ? Number(rHm) : undefined,
              kindOf: rKindOf,
              recurring: rRecurring
            });
      if (result.success) {
        sent = true;
      } else {
        errorMsg = result.error?.message || 'שליחה נכשלה';
      }
    } catch (e) {
      errorMsg = e?.message || 'שליחה נכשלה';
    } finally {
      sending = false;
    }
  }

  let pageTitle = $derived(
    attrs?.projectName
      ? $lang === 'he'
        ? `${attrs.projectName} - הצטרפות`
        : `${attrs.projectName} - Join`
      : '1💗1'
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta
    name="description"
    content={$lang === 'he'
      ? `הציעו את עצמכם לריקמה ${attrs?.projectName ?? ''} - בתנאים שלכם`
      : `Nominate yourself to ${attrs?.projectName ?? ''} - on your own terms`}
  />
</svelte:head>

{#if isRegisteredUser}
  <Header />
{/if}

{#if project}
  <div class="join-page min-h-screen text-white font-sans overflow-x-hidden">
    <div {dir} class="max-w-3xl mx-auto px-4 pb-24 pt-12">
      <!-- Hero -->
      <div class="text-center mb-8">
        {#if logoSrc}
          <img
            src={logoSrc}
            alt={attrs.projectName}
            class="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-gold/70 shadow-[0_0_25px_rgba(255,215,0,0.25)]"
          />
        {/if}
        <p class="text-white/50 text-sm mb-1">{attrs.projectName}</p>
        <h1
          class="text-3xl sm:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-l from-gold via-white to-barbi leading-tight"
        >
          {$t('pages.projectJoin.title')}
        </h1>
        <p class="text-white/75 max-w-xl mx-auto">{$t('pages.projectJoin.sub')}</p>
      </div>

      <!-- Values as context -->
      {#if vallues.length > 0}
        <div class="text-center mb-8">
          <p class="text-xs uppercase tracking-widest text-white/40 mb-2">
            {$t('pages.projectJoin.valuesTitle')}
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            {#each vallues as v (v)}
              <span class="chip chip-gold">{v}</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if isMember}
        <!-- Member: redirect to moach -->
        <div class="glass rounded-3xl p-8 text-center">
          <h2 class="text-2xl font-bold text-gold mb-2">{$t('pages.projectJoin.memberTitle')}</h2>
          <p class="text-white/70 mb-6">{$t('pages.projectJoin.memberBody')}</p>
          <a href="/moach/{projectId}" class="btn-primary">{$t('pages.projectJoin.toMoach')}</a>
        </div>
      {:else if sent}
        <!-- Success -->
        <div class="glass rounded-3xl p-8 text-center">
          <h2 class="text-2xl font-bold text-gold mb-2">{$t('pages.projectJoin.sentTitle')}</h2>
          <p class="text-white/70 mb-6 max-w-lg mx-auto">
            {$t('pages.projectJoin.sentBody').replace('{restime}', restimeLabel)}
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <a href="/lev" class="btn-primary">{$t('pages.projectJoin.toLev')}</a>
            <a href="/project/{projectId}" class="btn-ghost">{$t('pages.projectJoin.backToProject')}</a>
          </div>
        </div>
      {:else}
        <!-- The offer form -->
        <div class="glass rounded-3xl p-6 sm:p-8 mb-6">
          <!-- kind switch -->
          <div class="flex gap-2 mb-6" role="tablist">
            <button
              role="tab"
              aria-selected={kind === 'mission'}
              class="kind-tab"
              class:kind-active={kind === 'mission'}
              onclick={() => (kind = 'mission')}
            >
              {$t('pages.projectJoin.kindMission')}
            </button>
            <button
              role="tab"
              aria-selected={kind === 'resource'}
              class="kind-tab"
              class:kind-active={kind === 'resource'}
              onclick={() => (kind = 'resource')}
            >
              {$t('pages.projectJoin.kindResource')}
            </button>
          </div>

          {#if kind === 'mission'}
            <label class="field">
              <span>{$t('pages.projectJoin.mName')}</span>
              <input type="text" bind:value={mName} maxlength="120" disabled={!isRegisteredUser} />
            </label>
            <label class="field">
              <span>{$t('pages.projectJoin.mDescrip')}</span>
              <textarea rows="4" bind:value={mDescrip} disabled={!isRegisteredUser}></textarea>
            </label>
            <div class="grid grid-cols-2 gap-4">
              <label class="field">
                <span>{$t('pages.projectJoin.mHours')}</span>
                <input type="number" min="0" step="0.5" bind:value={mHours} disabled={!isRegisteredUser} />
              </label>
              <label class="field">
                <span>{$t('pages.projectJoin.mPerhour')}</span>
                <input type="number" min="0" step="1" bind:value={mPerhour} disabled={!isRegisteredUser} />
              </label>
            </div>
            <p class="text-xs text-white/50 leading-relaxed mt-1">{$t('pages.projectJoin.perhourHint')}</p>
          {:else}
            <label class="field">
              <span>{$t('pages.projectJoin.rName')}</span>
              <input type="text" bind:value={rName} maxlength="120" disabled={!isRegisteredUser} />
            </label>
            <label class="field">
              <span>{$t('pages.projectJoin.rDescrip')}</span>
              <textarea rows="4" bind:value={rDescrip} disabled={!isRegisteredUser}></textarea>
            </label>
            <div class="grid grid-cols-3 gap-4">
              <label class="field">
                <span>{$t('pages.projectJoin.rPrice')}</span>
                <input type="number" min="0" step="1" bind:value={rPrice} disabled={!isRegisteredUser} />
              </label>
              <label class="field">
                <span>{$t('pages.projectJoin.rKindOf')}</span>
                <select bind:value={rKindOf} disabled={!isRegisteredUser}>
                  {#each ['total', 'monthly', 'perUnit', 'rent', 'yearly'] as k (k)}
                    <option value={k}>{$t(`pages.projectJoin.kinds.${k}`)}</option>
                  {/each}
                </select>
              </label>
              <label class="field">
                <span>{$t('pages.projectJoin.rHm')}</span>
                <input type="number" min="1" step="1" bind:value={rHm} disabled={!isRegisteredUser} />
              </label>
            </div>
            <label class="flex items-center gap-2 mt-3 text-sm text-white/70">
              <input type="checkbox" bind:checked={rRecurring} disabled={!isRegisteredUser} />
              {$t('pages.projectJoin.rRecurring')}
            </label>
          {/if}

          {#if errorMsg}
            <p class="text-red-300 text-sm mt-4">{errorMsg}</p>
          {/if}

          {#if isRegisteredUser}
            <button
              class="btn-primary w-full mt-6 disabled:opacity-50"
              disabled={sending || (kind === 'mission' ? !mName.trim() : !rName.trim())}
              onclick={submit}
            >
              {sending ? $t('pages.projectJoin.sending') : $t('pages.projectJoin.send')}
            </button>
          {:else}
            <div class="mt-6 text-center border-t border-white/10 pt-6">
              <h3 class="font-bold text-gold mb-1">{$t('pages.projectJoin.guestTitle')}</h3>
              <p class="text-white/60 text-sm mb-4 max-w-md mx-auto">{$t('pages.projectJoin.guestBody')}</p>
              <a href="/" class="btn-primary">{$t('pages.projectJoin.login')}</a>
            </div>
          {/if}
        </div>

        <!-- How it works -->
        <div class="glass rounded-2xl p-6 mb-6">
          <h3 class="font-bold text-white/80 mb-3">{$t('pages.projectJoin.how')}</h3>
          <ol class="space-y-2 text-sm text-white/60 list-decimal ps-5">
            {#each $t('pages.projectJoin.howSteps') as step (step)}
              <li>{step.replace('{restime}', restimeLabel)}</li>
            {/each}
          </ol>
        </div>

        <p class="text-center text-sm">
          <a href="/project/{projectId}/support" class="text-gold underline hover:text-white">
            {$t('pages.projectJoin.supportInstead')}
          </a>
        </p>
      {/if}
    </div>
  </div>
{:else}
  <div class="join-page h-screen w-screen flex items-center justify-center">
    <RingLoader size="200" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  </div>
{/if}

<style>
  .join-page {
    background:
      radial-gradient(1000px 400px at 85% -5%, rgba(255, 0, 174, 0.09), transparent 60%),
      radial-gradient(900px 500px at 5% 15%, rgba(255, 215, 0, 0.07), transparent 55%),
      linear-gradient(160deg, #1a0515 0%, #2c0b1e 45%, #120f26 100%);
  }

  .glass {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
  }

  .text-gold { color: #ffd700; }
  .ring-gold\/70 { --tw-ring-color: rgba(255, 215, 0, 0.7); }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.82rem;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .chip-gold {
    background: rgba(255, 215, 0, 0.12);
    border-color: rgba(255, 215, 0, 0.35);
    color: #ffe36e;
  }

  .btn-primary {
    display: inline-block;
    padding: 0.8rem 2rem;
    border-radius: 9999px;
    font-weight: 700;
    color: #000;
    text-align: center;
    background: linear-gradient(120deg, #ffd700, #d4af37 55%, #b8860b);
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.35);
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    cursor: pointer;
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 26px rgba(255, 215, 0, 0.5);
  }

  .btn-ghost {
    display: inline-block;
    padding: 0.8rem 1.6rem;
    border-radius: 9999px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    transition: border-color 0.2s, background 0.2s;
  }
  .btn-ghost:hover {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.08);
  }

  .kind-tab {
    flex: 1;
    padding: 0.7rem 1rem;
    border-radius: 1rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s;
    cursor: pointer;
  }
  .kind-active {
    color: #000;
    background: linear-gradient(120deg, #ffd700, #d4af37);
    border-color: transparent;
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
  }

  .field {
    display: block;
    margin-bottom: 0.9rem;
  }
  .field span {
    display: block;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.65);
    margin-bottom: 0.3rem;
  }
  .field input,
  .field textarea,
  .field select {
    width: 100%;
    padding: 0.65rem 0.9rem;
    border-radius: 0.75rem;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    outline: none;
    transition: border-color 0.2s;
  }
  .field input:focus,
  .field textarea:focus,
  .field select:focus {
    border-color: rgba(255, 215, 0, 0.6);
  }
  .field input:disabled,
  .field textarea:disabled,
  .field select:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
