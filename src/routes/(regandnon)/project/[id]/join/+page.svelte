<script>
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

  const RESTIME_LABEL = {
    feh: { he: '48 שעות', en: '48 hours' },
    sth: { he: '72 שעות', en: '72 hours' },
    nsh: { he: '96 שעות', en: '96 hours' },
    sevend: { he: 'שבוע', en: 'a week' }
  };
  let restimeLabel = $derived(
    RESTIME_LABEL[attrs?.restime]?.[$lang] ?? RESTIME_LABEL.feh[$lang]
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

  const t = {
    title: { he: 'בואו להיות חלק', en: 'Come be a part' },
    sub: {
      he: 'מציעים את עצמכם בתנאים שלכם — אתם קובעים מה תעשו או תביאו, וכמה זה שווה. ההצעה שלכם היא נקודת הפתיחה של השיחה.',
      en: 'Nominate yourself on your own terms — you decide what you’ll do or bring, and what it’s worth. Your offer is the opening point of the conversation.'
    },
    valuesTitle: { he: 'הערכים שמובילים כאן', en: 'The values that lead here' },
    kindMission: { he: '🚀 אני אעשה…', en: '🚀 I’ll do…' },
    kindResource: { he: '🧰 אני אביא…', en: '🧰 I’ll bring…' },
    mName: { he: 'מה תעשו? (כותרת המשימה)', en: 'What will you do? (mission title)' },
    mDescrip: { he: 'פרטו קצת — מה בדיוק, איך, למה דווקא אתם', en: 'A few details — what exactly, how, why you' },
    mHours: { he: 'כמה שעות?', en: 'How many hours?' },
    mPerhour: {
      he: 'השכר השעתי האידאלי שלכם (₪)',
      en: 'Your ideal hourly rate (₪)'
    },
    perhourHint: {
      he: 'לא ״כמה תדרשו״ — כמה העבודה שלכם שווה. הרישום בשווי מלא הוא הבסיס לחלוקה הוגנת של הכנסות, עכשיו או בעתיד.',
      en: 'Not “what you demand” — what your work is worth. Full-value recording is the basis for fair income sharing, now or later.'
    },
    rName: { he: 'מה תביאו? (שם המשאב)', en: 'What will you bring? (resource name)' },
    rDescrip: { he: 'פרטו קצת על המשאב', en: 'A few details about the resource' },
    rPrice: { he: 'השווי האידאלי (₪)', en: 'Ideal value (₪)' },
    rKindOf: { he: 'אופן התמחור', en: 'Pricing mode' },
    rHm: { he: 'כמות/יחידות', en: 'Quantity/units' },
    rRecurring: { he: 'משאב מתמשך (מתחדש)', en: 'Recurring resource' },
    kinds: {
      total: { he: 'סה״כ', en: 'Total' },
      monthly: { he: 'חודשי', en: 'Monthly' },
      perUnit: { he: 'ליחידה', en: 'Per unit' },
      rent: { he: 'השכרה', en: 'Rent' },
      yearly: { he: 'שנתי', en: 'Yearly' }
    },
    send: { he: 'שליחת ההצעה שלי', en: 'Send my offer' },
    sending: { he: 'שולח…', en: 'Sending…' },
    how: { he: 'איך זה עובד?', en: 'How does it work?' },
    howSteps: {
      he: [
        'אתם מנסחים הצעה — משימה שתבצעו או משאב שתביאו, בתנאים שלכם.',
        'חברי הריקמה מקבלים אותה ללב שלהם: הם יכולים לאשר, לשוחח, או להציע נגדית — אין ״לא״ מוחלט.',
        'מרגע שחבר נענה — שתיקה היא הסכמה: בלי מענה בתוך {restime}, ההצעה האחרונה שעל השולחן מתאשרת.'
      ],
      en: [
        'You phrase an offer — a mission you’ll do or a resource you’ll bring, on your terms.',
        'The rikma members get it in their Lev: they can approve, chat, or counter — there is no absolute “no”.',
        'Once a member engages — silence is consent: with no reply within {restime}, the last offer on the table is approved.'
      ]
    },
    sentTitle: { he: 'ההצעה נשלחה! 🎉', en: 'Your offer was sent! 🎉' },
    sentBody: {
      he: 'חברי הריקמה קיבלו התראה. מרגע שחבר ייענה, יש לריקמה {restime} להגיב — ואפשר לעקוב אחרי הכול בלב שלכם.',
      en: 'The members were notified. Once a member engages, the rikma has {restime} to respond — follow everything in your Lev.'
    },
    toLev: { he: 'ללב שלי ←', en: 'To my Lev →' },
    backToProject: { he: 'חזרה לעמוד הריקמה', en: 'Back to the project page' },
    memberTitle: { he: 'את/ה כבר חלק 💗', en: 'You’re already part of this 💗' },
    memberBody: {
      he: 'חברי ריקמה יוצרים משימות ומשאבים מהמוח — שם כל הכלים שלכם.',
      en: 'Members create missions and resources from the moach — all your tools are there.'
    },
    toMoach: { he: 'למוח הריקמה ←', en: 'To the moach →' },
    guestTitle: { he: 'צריך חשבון (חינם) כדי להציע', en: 'You need a (free) account to offer' },
    guestBody: {
      he: 'ההצעה שלכם פותחת שיחה אמיתית עם הריקמה — ולשם כך צריך זהות. ההרשמה פתוחה וחינמית.',
      en: 'Your offer opens a real conversation with the rikma — that needs an identity. Registration is open and free.'
    },
    login: { he: 'הרשמה / התחברות', en: 'Register / Log in' },
    supportInstead: {
      he: 'רק רוצים לתמוך? לדף התמיכה והשקיפות ←',
      en: 'Just want to support? To the support page →'
    }
  };

  let pageTitle = $derived(
    attrs?.projectName
      ? $lang === 'he'
        ? `${attrs.projectName} — הצטרפות`
        : `${attrs.projectName} — Join`
      : '1💗1'
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta
    name="description"
    content={$lang === 'he'
      ? `הציעו את עצמכם לריקמה ${attrs?.projectName ?? ''} — בתנאים שלכם`
      : `Nominate yourself to ${attrs?.projectName ?? ''} — on your own terms`}
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
          {t.title[$lang]}
        </h1>
        <p class="text-white/75 max-w-xl mx-auto">{t.sub[$lang]}</p>
      </div>

      <!-- Values as context -->
      {#if vallues.length > 0}
        <div class="text-center mb-8">
          <p class="text-xs uppercase tracking-widest text-white/40 mb-2">
            {t.valuesTitle[$lang]}
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
          <h2 class="text-2xl font-bold text-gold mb-2">{t.memberTitle[$lang]}</h2>
          <p class="text-white/70 mb-6">{t.memberBody[$lang]}</p>
          <a href="/moach/{projectId}" class="btn-primary">{t.toMoach[$lang]}</a>
        </div>
      {:else if sent}
        <!-- Success -->
        <div class="glass rounded-3xl p-8 text-center">
          <h2 class="text-2xl font-bold text-gold mb-2">{t.sentTitle[$lang]}</h2>
          <p class="text-white/70 mb-6 max-w-lg mx-auto">
            {t.sentBody[$lang].replace('{restime}', restimeLabel)}
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <a href="/lev" class="btn-primary">{t.toLev[$lang]}</a>
            <a href="/project/{projectId}" class="btn-ghost">{t.backToProject[$lang]}</a>
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
              {t.kindMission[$lang]}
            </button>
            <button
              role="tab"
              aria-selected={kind === 'resource'}
              class="kind-tab"
              class:kind-active={kind === 'resource'}
              onclick={() => (kind = 'resource')}
            >
              {t.kindResource[$lang]}
            </button>
          </div>

          {#if kind === 'mission'}
            <label class="field">
              <span>{t.mName[$lang]}</span>
              <input type="text" bind:value={mName} maxlength="120" disabled={!isRegisteredUser} />
            </label>
            <label class="field">
              <span>{t.mDescrip[$lang]}</span>
              <textarea rows="4" bind:value={mDescrip} disabled={!isRegisteredUser}></textarea>
            </label>
            <div class="grid grid-cols-2 gap-4">
              <label class="field">
                <span>{t.mHours[$lang]}</span>
                <input type="number" min="0" step="0.5" bind:value={mHours} disabled={!isRegisteredUser} />
              </label>
              <label class="field">
                <span>{t.mPerhour[$lang]}</span>
                <input type="number" min="0" step="1" bind:value={mPerhour} disabled={!isRegisteredUser} />
              </label>
            </div>
            <p class="text-xs text-white/50 leading-relaxed mt-1">{t.perhourHint[$lang]}</p>
          {:else}
            <label class="field">
              <span>{t.rName[$lang]}</span>
              <input type="text" bind:value={rName} maxlength="120" disabled={!isRegisteredUser} />
            </label>
            <label class="field">
              <span>{t.rDescrip[$lang]}</span>
              <textarea rows="4" bind:value={rDescrip} disabled={!isRegisteredUser}></textarea>
            </label>
            <div class="grid grid-cols-3 gap-4">
              <label class="field">
                <span>{t.rPrice[$lang]}</span>
                <input type="number" min="0" step="1" bind:value={rPrice} disabled={!isRegisteredUser} />
              </label>
              <label class="field">
                <span>{t.rKindOf[$lang]}</span>
                <select bind:value={rKindOf} disabled={!isRegisteredUser}>
                  {#each Object.entries(t.kinds) as [k, label] (k)}
                    <option value={k}>{label[$lang]}</option>
                  {/each}
                </select>
              </label>
              <label class="field">
                <span>{t.rHm[$lang]}</span>
                <input type="number" min="1" step="1" bind:value={rHm} disabled={!isRegisteredUser} />
              </label>
            </div>
            <label class="flex items-center gap-2 mt-3 text-sm text-white/70">
              <input type="checkbox" bind:checked={rRecurring} disabled={!isRegisteredUser} />
              {t.rRecurring[$lang]}
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
              {sending ? t.sending[$lang] : t.send[$lang]}
            </button>
          {:else}
            <div class="mt-6 text-center border-t border-white/10 pt-6">
              <h3 class="font-bold text-gold mb-1">{t.guestTitle[$lang]}</h3>
              <p class="text-white/60 text-sm mb-4 max-w-md mx-auto">{t.guestBody[$lang]}</p>
              <a href="/" class="btn-primary">{t.login[$lang]}</a>
            </div>
          {/if}
        </div>

        <!-- How it works -->
        <div class="glass rounded-2xl p-6 mb-6">
          <h3 class="font-bold text-white/80 mb-3">{t.how[$lang]}</h3>
          <ol class="space-y-2 text-sm text-white/60 list-decimal ps-5">
            {#each t.howSteps[$lang] as step (step)}
              <li>{step.replace('{restime}', restimeLabel)}</li>
            {/each}
          </ol>
        </div>

        <p class="text-center text-sm">
          <a href="/project/{projectId}/support" class="text-gold underline hover:text-white">
            {t.supportInstead[$lang]}
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
