<script>
  /**
   * DonateDialog — the "communication between a person and the rikma to move
   * money, recorded properly as a donation" (PLAN_VOLUNTEER_RIKMA §2, §4).
   *
   * Two paths, chosen by the giver:
   *  • Coordinate (default) — an identified supporter announces intent; every
   *    member is notified (requestDonation) so one can arrange receipt. No Sale
   *    yet: coverage counts only money that actually arrived.
   *  • Record a received donation (createDonationSale) — a member logs money
   *    that reached them (holder = self → effective at once) or that reached
   *    another member (→ bilateral saleClaim the holder confirms).
   *
   * Guests can't act (the /api/action endpoint requires login, and guest
   * clearing is P6/blocked) — they get a log-in prompt instead.
   */
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import { lang } from '$lib/stores/lang.js';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { executeAction } from '$lib/client/actionClient';

  let {
    /** @type {boolean} */
    isOpen = $bindable(false),
    /** @type {string} */
    projectId,
    /** @type {string} */
    projectName = '',
    /** @type {Array<{id: string, username: string}>} */
    members = [],
    /** @type {boolean} */
    isRegisteredUser = false,
    /** @type {boolean} */
    isMember = false,
    /** @type {string | null} */
    uid = null,
    /** @type {'support' | 'record'} start mode: supporter-facing or member recording */
    mode = 'support',
    /** called after a successful record/request */
    onDone
  } = $props();

  const rtl = $derived($lang === 'he');

  // One-time form defaults snapshotted from props (mode/isMember/uid are stable
  // for the dialog's lifetime): record mode starts on the record tab with the
  // current member pre-selected as the money-holder (self-report).
  // 'coordinate' → requestDonation ; 'record' → createDonationSale
  let tab = $state(mode === 'record' ? 'record' : 'coordinate');
  let amount = $state(0);
  let from = $state('');
  let msg = $state('');
  let contact = $state('');
  let holderId = $state(mode === 'record' && isMember && uid ? String(uid) : '');
  let busy = $state(false);

  const t = {
    title: { he: 'תרומה', en: 'Donate' },
    intro: {
      he: 'כל תרומה מתחלקת בין העושים בשקיפות ונכנסת למדד הכיסוי.',
      en: 'Every donation is shared transparently among the doers and counts toward coverage.'
    },
    needLogin: {
      he: 'כדי לתאם תרומה דרך האתר צריך להתחבר. אפשר גם לפנות אלינו ישירות דרך הקישורים בעמוד.',
      en: 'To coordinate a donation through the site please log in. You can also reach us directly via the links on this page.'
    },
    login: { he: 'התחברות / הרשמה', en: 'Log in / Sign up' },
    tabCoordinate: { he: 'אני רוצה לתרום', en: 'I want to donate' },
    tabRecord: { he: 'רשום תרומה שהתקבלה', en: 'Record a received donation' },
    coordinateHelp: {
      he: 'נודיע לחברי הריקמה שתרצה/י לתרום, והם יחזרו אליך לתיאום העברת הכסף. אחרי שהכסף יתקבל — הוא יירשם כתרומה.',
      en: "We'll let the rikma's members know you'd like to give; they'll reach out to arrange the transfer. Once received it is recorded as a donation."
    },
    recordHelp: {
      he: 'רשמו תרומה שכבר התקבלה. אם הכסף אצל חבר/ה אחר/ת — הוא יאשר/תאשר את הקבלה לפני שהתרומה תיכנס לחישוב.',
      en: 'Log a donation that already arrived. If the money is held by another member they confirm receipt before it counts.'
    },
    amount: { he: 'סכום (₪)', en: 'Amount (₪)' },
    amountOpt: { he: 'סכום (₪) — לא חובה', en: 'Amount (₪) — optional' },
    name: { he: 'שם התורם/ת (או השאירו ריק לאנונימי)', en: 'Donor name (leave blank for anonymous)' },
    message: { he: 'הקדשה / הודעה', en: 'Dedication / message' },
    contact: { he: 'איך ליצור איתך קשר? (טלפון / אימייל)', en: 'How can we reach you? (phone / email)' },
    holder: { he: 'אצל מי הכסף?', en: 'Who holds the money?' },
    me: { he: 'אצלי', en: 'Me' },
    send: { he: 'שליחה', en: 'Send' },
    record: { he: 'רישום תרומה', en: 'Record donation' },
    cancel: { he: 'ביטול', en: 'Cancel' },
    okReq: {
      he: 'תודה! הודענו לחברי הריקמה והם יחזרו אליך לתיאום.',
      en: 'Thank you! The rikma has been notified and will reach out.'
    },
    okSelf: { he: 'התרומה נרשמה ✓', en: 'Donation recorded ✓' },
    okClaim: {
      he: 'נרשם — ממתין לאישור המחזיק/ה. יאושר אוטומטית בתום זמן התגובה אם אין תגובה.',
      en: 'Recorded — awaiting the holder\'s confirmation (auto-approves after the response time).'
    },
    needAmount: { he: 'נא להזין סכום', en: 'Please enter an amount' },
    needHolder: { he: 'נא לבחור אצל מי הכסף', en: 'Please choose who holds the money' }
  };

  function close() {
    isOpen = false;
    busy = false;
  }

  async function submitCoordinate() {
    busy = true;
    try {
      const res = await executeAction('requestDonation', {
        projectId: String(projectId),
        from: from.trim() || undefined,
        amount: amount > 0 ? Number(amount) : undefined,
        msg: msg.trim() || undefined,
        contact: contact.trim() || undefined
      });
      if (!res.success) throw new Error(res.error?.message ?? 'failed');
      toast.success(t.okReq[$lang]);
      onDone?.();
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      busy = false;
    }
  }

  async function submitRecord() {
    if (!(amount > 0)) {
      toast.error(t.needAmount[$lang]);
      return;
    }
    if (!holderId) {
      toast.error(t.needHolder[$lang]);
      return;
    }
    busy = true;
    try {
      const res = await executeAction('createDonationSale', {
        projectId: String(projectId),
        userId: String(holderId),
        amount: Number(amount),
        from: from.trim() || undefined,
        msg: msg.trim() || undefined,
        via: mode === 'record' ? 'manual' : 'page'
      });
      if (!res.success) throw new Error(res.error?.message ?? 'failed');
      toast.success(res.data?.holderStatus === 'self' ? t.okSelf[$lang] : t.okClaim[$lang]);
      onDone?.();
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      busy = false;
    }
  }
</script>

<DialogOverlay style="z-index: 900;" {isOpen} onDismiss={close}>
  <div style="z-index: 900;" transition:fly|local={{ y: 200, opacity: 0.4, duration: 400 }}>
    <DialogContent class="donate-dialog" aria-label={t.title[$lang]}>
      <div dir={rtl ? 'rtl' : 'ltr'} class="dd-body">
        <div class="dd-head">
          <h2>💗 {t.title[$lang]}</h2>
          <button class="dd-x" onclick={close} aria-label={t.cancel[$lang]}>✕</button>
        </div>
        <p class="dd-intro">{t.intro[$lang]}</p>

        {#if !isRegisteredUser}
          <p class="dd-help">{t.needLogin[$lang]}</p>
          <button class="dd-primary" onclick={() => goto('/')}>{t.login[$lang]}</button>
        {:else}
          <!-- Members can both coordinate and record; supporters just coordinate. -->
          {#if isMember}
            <div class="dd-tabs">
              <button
                class="dd-tab"
                class:active={tab === 'coordinate'}
                onclick={() => (tab = 'coordinate')}>{t.tabCoordinate[$lang]}</button
              >
              <button
                class="dd-tab"
                class:active={tab === 'record'}
                onclick={() => (tab = 'record')}>{t.tabRecord[$lang]}</button
              >
            </div>
          {/if}

          {#if tab === 'coordinate'}
            <p class="dd-help">{t.coordinateHelp[$lang]}</p>
            <label class="dd-field">
              <span>{t.name[$lang]}</span>
              <input type="text" bind:value={from} maxlength="80" />
            </label>
            <label class="dd-field">
              <span>{t.amountOpt[$lang]}</span>
              <input type="number" min="0" bind:value={amount} />
            </label>
            <label class="dd-field">
              <span>{t.contact[$lang]}</span>
              <input type="text" bind:value={contact} maxlength="120" />
            </label>
            <label class="dd-field">
              <span>{t.message[$lang]}</span>
              <textarea rows="2" bind:value={msg} maxlength="300"></textarea>
            </label>
            <button class="dd-primary" disabled={busy} onclick={submitCoordinate}>
              {busy ? '…' : t.send[$lang]}
            </button>
          {:else}
            <p class="dd-help">{t.recordHelp[$lang]}</p>
            <label class="dd-field">
              <span>{t.amount[$lang]}</span>
              <input type="number" min="0" bind:value={amount} />
            </label>
            <label class="dd-field">
              <span>{t.holder[$lang]}</span>
              <select bind:value={holderId}>
                <option value="" disabled>—</option>
                {#each members as m (m.id)}
                  <option value={m.id}>{m.id === uid ? `${m.username} (${t.me[$lang]})` : m.username}</option>
                {/each}
              </select>
            </label>
            <label class="dd-field">
              <span>{t.name[$lang]}</span>
              <input type="text" bind:value={from} maxlength="80" />
            </label>
            <label class="dd-field">
              <span>{t.message[$lang]}</span>
              <textarea rows="2" bind:value={msg} maxlength="300"></textarea>
            </label>
            <button class="dd-primary" disabled={busy} onclick={submitRecord}>
              {busy ? '…' : t.record[$lang]}
            </button>
          {/if}
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<style>
  :global(.donate-dialog) {
    max-width: 92vw !important;
    width: 30rem !important;
    border-radius: 1.25rem !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  .dd-body {
    background: linear-gradient(160deg, #1a0515 0%, #2c0b1e 60%, #120f26 100%);
    color: #fff;
    padding: 1.5rem;
  }
  .dd-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dd-head h2 {
    font-size: 1.4rem;
    font-weight: 800;
    color: #ffd700;
  }
  .dd-x {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 9999px;
    width: 2rem;
    height: 2rem;
    color: #fff;
  }
  .dd-intro {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin: 0.5rem 0 1rem;
  }
  .dd-help {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
  .dd-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .dd-tab {
    flex: 1;
    padding: 0.5rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
  }
  .dd-tab.active {
    background: #ff00ae;
    color: #fff;
    border-color: #ff00ae;
  }
  .dd-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }
  .dd-field span {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.6);
  }
  .dd-field input,
  .dd-field select,
  .dd-field textarea {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.6rem;
    padding: 0.55rem 0.7rem;
    color: #fff;
    font-size: 0.95rem;
  }
  .dd-field select option {
    color: #111;
  }
  .dd-primary {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.8rem;
    border-radius: 9999px;
    font-weight: 800;
    color: #000;
    background: linear-gradient(120deg, #ffd700, #d4af37 55%, #b8860b);
    box-shadow: 0 4px 18px rgba(255, 215, 0, 0.3);
  }
  .dd-primary:disabled {
    opacity: 0.5;
  }
</style>
