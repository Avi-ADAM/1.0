<script>
  /**
   * What the inviter sees after creating a mission with "invite someone new"
   * (docs/inprogress/PLAN_INVITE_PARTNER_TO_MISSION.md). Whatever happened to the
   * email, the link always works — so the card always offers to send it by
   * hand, and never dead-ends.
   */
  import { t as trans } from '$lib/translations';

  /**
   * @typedef {Object} Props
   * @property {{ result: string, link: string, registered?: boolean }} invite
   * @property {string} [missionName]
   * @property {string} [projectName]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let { invite, missionName = '', projectName = '', onDone } = $props();

  let copied = $state(false);

  const statusKey = $derived.by(() => {
    switch (invite?.result) {
      case 'invited':
        return invite.registered ? 'mission.invite.sentRegistered' : 'mission.invite.sentEmail';
      case 'notRegistered':
        // The engine's "email sent to an address with no account yet".
        return 'mission.invite.sentEmail';
      case 'linkOnly':
        return 'mission.invite.linkOnly';
      case 'self':
        return 'mission.invite.self';
      default:
        // emailFailed · emailSkipped · rateLimited · failed — the link still works.
        return 'mission.invite.emailNotSent';
    }
  });

  const message = $derived(
    $trans('mission.invite.shareMessage', { project: projectName, mission: missionName }) + '\n' + invite.link
  );
  const whatsapp = $derived(`https://wa.me/?text=${encodeURIComponent(message)}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(invite.link);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      // No clipboard (insecure context, old browser): the link is selectable below.
      copied = false;
    }
  }
</script>

<div class="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/60 p-4" dir="auto">
  <div
    class="w-full max-w-md rounded-2xl border border-gold bg-gradient-to-br from-black to-slate-900 p-5 text-gold shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-labelledby="invite-result-title"
  >
    <h2 id="invite-result-title" class="text-xl font-bold text-barbi">{$trans('mission.invite.title')}</h2>
    <p class="mt-2 text-white/90">{$trans(statusKey)}</p>

    <input
      class="mt-4 w-full rounded-lg border border-gold/50 bg-black/40 px-3 py-2 text-sm text-white"
      dir="ltr"
      readonly
      value={invite.link}
      aria-label={$trans('mission.invite.linkLabel')}
      onfocus={(e) => e.currentTarget.select()}
    />

    <div class="mt-4 flex flex-col gap-2 sm:flex-row">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 rounded-lg bg-[#25D366] px-4 py-3 text-center font-semibold text-black hover:brightness-110"
      >
        {$trans('mission.invite.whatsapp')}
      </a>
      <button
        type="button"
        onclick={copyLink}
        class="flex-1 rounded-lg border border-gold px-4 py-3 font-semibold hover:bg-gold hover:text-barbi"
      >
        {copied ? $trans('mission.invite.copied') : $trans('mission.invite.copy')}
      </button>
    </div>

    <button
      type="button"
      onclick={() => onDone?.()}
      class="mt-4 w-full rounded-lg bg-barbi px-4 py-3 font-semibold text-gold hover:brightness-110"
    >
      {$trans('mission.invite.done')}
    </button>
  </div>
</div>
