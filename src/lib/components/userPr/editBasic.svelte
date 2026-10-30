<script lang="ts">
  /**
   * The body of /me/settings: every section, in the order of SETTINGS_SECTIONS.
   * The few rows whose state lives on the page itself (reading-translation,
   * currency, GitHub link) come in as snippets so their logic stays there.
   */
  import { t } from '$lib/translations';
  import { onMount, type Snippet } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import axios from 'axios';

  import LoginT from '$lib/func/telegram/loginT.svelte';
  import LevViewSwitch from '$lib/components/lev/LevViewSwitch.svelte';
  import { levView } from '$lib/stores/levStores';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import ConsentStatusBadge from '$lib/components/consent/ConsentStatusBadge.svelte';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
  import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
  import {
    SETTINGS_SECTIONS,
    btnPrimary,
    btnSecondary,
    btnDanger,
    field,
    fieldLabel
  } from '$lib/components/settings/ui.js';

  type EditLocation = {
    location_mode: 'online' | 'onsite' | 'hybrid' | 'unspecified';
    isOnline?: boolean;
    lat?: number | null;
    lng?: number | null;
    radius?: number | null;
    location_hint?: string | null;
  };

  // Props
  let {
    isGuidMe = false,
    onGuidMeChange,
    projectIds = [],
    teleredy = $bindable(false),
    machshirs,
    checked = $bindable(false),
    fblink = $bindable(''),
    twiterlink = $bindable(''),
    discordlink = $bindable(''),
    githublink = $bindable(''),
    noMail = $bindable(false),

    mail,
    un = $bindable(''),
    bi = $bindable(''),
    frd = $bindable(''),
    lango = $bindable(''),
    location = $bindable<EditLocation>({
      location_mode: 'unspecified',
      isOnline: false,
      lat: null,
      lng: null,
      radius: 15,
      location_hint: ''
    }),
    uid = $bindable(''),
    onMessage,
    onGuid,
    translationPref,
    currencyPref,
    githubAccount
  }: {
    location?: EditLocation;
    translationPref?: Snippet;
    currencyPref?: Snippet;
    githubAccount?: Snippet;
  } & Record<string, any> = $props();

  function section(id: string) {
    const s = SETTINGS_SECTIONS.find((x) => x.id === id);
    const desc = $t(`pages.meSettings.sectionsDesc.${id}`);
    return {
      id,
      icon: s?.icon ?? '',
      title: $t(`pages.meSettings.sections.${id}`),
      desc: desc === `pages.meSettings.sectionsDesc.${id}` ? '' : desc
    };
  }

  // State
  let chan = $state(false);
  let changePassword = $state(false);
  let beforePasswordChange = $state(true);
  let passwordx = $state('');
  let passi = $state('');
  let errorl = $state(null);
  let strength = $state(0);
  let validations = $state([false, false, false]);
  let showPassword = $state(false);
  let pressed = $state(false);
  let sub = $state<PushSubscription | null>(null);
  let nutiPermission = $state<NotificationPermission | 'unsupported'>('default');
  let nutiBusy = $state(false);
  let initialValues = $state(null);

  const dayValues = ['sun', 'mon', 'thu', 'wen', 'teh', 'fri', 'shabat'];

  // Functions
  onMount(async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      nutiPermission = Notification.permission;
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      // Re-send it: a device subscribed while the save was missing (Aug 2025 –
      // Oct 2026) has a browser subscription and no machshir. Idempotent.
      if (existing && nutiPermission === 'granted') {
        sub = existing;
        saveDevice(existing).catch((e) => console.warn('[push] re-register failed', e));
      }
    } else {
      nutiPermission = 'unsupported';
    }
    // Set initialValues at the end of onMount
    initialValues = {
      un,
      bi,
      githublink,
      twiterlink,
      discordlink,
      fblink,
      frd,
      lango,
      checked,
      noMail,
      location: JSON.stringify(location)
    };
    fetchKeys();
  });

  // API Keys state
  let keys = $state([]);
  let isCreatingKey = $state(false);
  let newKeyName = $state('');
  let lastCreatedKey = $state(null);
  let copiedKey = $state(false);

  async function fetchKeys() {
    try {
      const response = await fetch('/api/api-keys');
      if (response.ok) {
        keys = await response.json();
      }
    } catch (e) {
      console.error('Failed to fetch keys', e);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newKeyName
        })
      });
      if (response.ok) {
        const result = await response.json();
        lastCreatedKey = result;
        newKeyName = '';
        isCreatingKey = false;
        await fetchKeys();
        toast.success($t('pages.editBasic.newKeySuccess'));
      } else {
        const err = await response.json();
        toast.error(err.message || $t('pages.editBasic.keyCreateError'));
      }
    } catch (e) {
      toast.error($t('pages.editBasic.keyCreateError'));
    }
  }

  async function deleteKey(id, name) {
    if (!confirm($t('pages.editBasic.deleteKeyConfirm', { name }))) return;
    try {
      const response = await fetch(`/api/api-keys?id=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchKeys();
        toast.success($t('pages.editBasic.keyDeleted'));
      }
    } catch (e) {
      toast.error($t('pages.editBasic.error'));
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    copiedKey = true;
    setTimeout(() => (copiedKey = false), 2000);
  }

  $effect(() => {
    if (!initialValues) return;
    chan =
      un !== initialValues.un ||
      bi !== initialValues.bi ||
      githublink !== initialValues.githublink ||
      twiterlink !== initialValues.twiterlink ||
      discordlink !== initialValues.discordlink ||
      fblink !== initialValues.fblink ||
      frd !== initialValues.frd ||
      lango !== initialValues.lango ||
      checked !== initialValues.checked ||
      noMail !== initialValues.noMail ||
      JSON.stringify(location) !== initialValues.location;
  });

  function save() {
    onMessage?.({
      fblink,
      twiterlink,
      discordlink,
      githublink,
      noMail,
      frd,
      bi,
      un,
      em: mail,
      lango,
      cards: checked,
      location
    });
    chan = false;
    toast.success($t('pages.editBasic.saved'));
  }

  let loggingOut = $state(false);

  // Signing out has to happen on the server. `jwt` is HttpOnly and the cookies
  // are written on the `.1lev1.com` domain scope, so the old client-side
  // `document.cookie = '…expires=…'` loop could not touch either of them — the
  // visitor stayed signed in. /logout deletes every scope, then a full
  // `location.href` navigation (not `goto`) throws away every client store and
  // cached load so nothing of the previous session survives.
  async function logout() {
    if (loggingOut) return;
    loggingOut = true;
    try {
      await fetch('/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {
      console.error('logout request failed', e);
    }
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // storage disabled (private mode / blocked cookies) — nothing cached
    }
    // Client-readable leftovers only; the real auth cookies are already gone.
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0].trim();
      if (!name || name === 'lang' || name === 'theme') continue;
      document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
    }
    window.location.href = '/login';
  }

  // --- Password Change ---
  function validatePassword(e) {
    const password = e.target.value;
    passwordx = password;
    validations = [
      password.length > 5,
      password.search(/[A-Z]/) > -1,
      password.search(/[0-9]/) > -1
    ];
    strength = validations.reduce((acc, cur) => acc + (cur ? 1 : 0), 0);
  }

  async function handleChangePassword() {
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passi,
        password: passwordx,
        passwordConfirmation: passwordx
      });
      toast.success($t('pages.editBasic.passChanged'));
      beforePasswordChange = false;
    } catch (err) {
      console.error(err);
      errorl = err.response?.data?.error?.message || $t('pages.editBasic.error');
      toast.error(errorl);
    }
  }

  // --- Notifications ---
  // The browser's subscription is only half of it: pushes go to the member's
  // machshirs on the server, so `sub` counts only once registerPushDevice saved it.
  async function saveDevice(s: PushSubscription) {
    const result = await executeAction('registerPushDevice', { subscription: s.toJSON() });
    if (!result.success) throw new Error(result.error?.message || 'registerPushDevice failed');
  }

  async function handleNotificationPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error($t('pages.editBasic.nutiUnsupported'));
      return;
    }
    nutiBusy = true;
    try {
      const permission = await Notification.requestPermission();
      nutiPermission = permission;
      if (permission !== 'granted') {
        if (permission === 'denied') toast.error($t('pages.editBasic.nutiBlocked'));
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const currentSub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_publicKey
        }));
      await saveDevice(currentSub);
      sub = currentSub;
      toast.success($t('pages.editBasic.nutiSuccess'));
    } catch (e) {
      console.error(e);
      toast.error($t('pages.editBasic.error'), { description: e.message });
    } finally {
      nutiBusy = false;
    }
  }

  // The server row needs no call: the next push to a dropped subscription gets
  // a 410 and /api/pusher removes the machshir.
  async function turnOffNotifications() {
    if (!sub) return;
    nutiBusy = true;
    try {
      await sub.unsubscribe();
      sub = null;
      toast.success($t('pages.editBasic.nutiOff'));
    } catch (e) {
      console.error(e);
      toast.error($t('pages.editBasic.error'), { description: e.message });
    } finally {
      nutiBusy = false;
    }
  }

  let pushStatus = $derived(
    sub
      ? $t('pages.editBasic.nutiOn')
      : nutiPermission === 'denied'
        ? $t('pages.editBasic.nutiBlocked')
        : nutiPermission === 'unsupported'
          ? $t('pages.editBasic.nutiUnsupported')
          : $t('pages.meSettings.pushDesc')
  );

  // --- Guide ---
  async function toggleGuide(show) {
    pressed = true;
    onGuidMeChange?.(show);
    // A year ahead, not a fixed date: a date already past deletes the cookie.
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `guidMe=${show ? 'again' : 'done'}; expires=${expires}; path=/`;

    try {
      const result = await executeAction('toggleGuideStatus', { show });
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update guide status');
      }

      toast.success(show ? $t('pages.editBasic.guidResumed') : $t('pages.editBasic.guidStopped'));
      if (show) onGuid?.();
    } catch (e) {
      console.error(e);
      toast.error($t('pages.editBasic.error'));
      // Revert local state on error
      onGuidMeChange?.(!show);
    } finally {
      pressed = false;
    }
  }
</script>

<div class="flex flex-col gap-6">
  <!-- Profile — what other members see -->
  <SettingsSection {...section('profile')}>
    <SettingsRow title={$t('pages.editBasic.personalDetails')}>
      <div class="space-y-3">
        <div>
          <label for="settings-name" class={fieldLabel}>{$t('common.labels.name')}</label>
          <input id="settings-name" bind:value={un} autocomplete="off" class={field} />
        </div>
        <div>
          <label for="bio" class={fieldLabel}>{$t('pages.editBasic.bio')}</label>
          <textarea id="bio" bind:value={bi} class={field} rows="4"></textarea>
        </div>
      </div>
    </SettingsRow>

    <SettingsRow title={$t('pages.editBasic.links')}>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="link-github" class={fieldLabel}>{$t('pages.editBasic.github')}</label>
          <input id="link-github" bind:value={githublink} dir="ltr" class={field} />
        </div>
        <div>
          <label for="link-twitter" class={fieldLabel}>{$t('pages.editBasic.twitter')}</label>
          <input id="link-twitter" bind:value={twiterlink} dir="ltr" class={field} />
        </div>
        <div>
          <label for="link-discord" class={fieldLabel}>{$t('pages.editBasic.discord')}</label>
          <input id="link-discord" bind:value={discordlink} dir="ltr" class={field} />
        </div>
        <div>
          <label for="link-facebook" class={fieldLabel}>{$t('pages.editBasic.facebook')}</label>
          <input id="link-facebook" bind:value={fblink} dir="ltr" class={field} />
        </div>
      </div>
    </SettingsRow>

    <SettingsRow title={$t('pages.editBasic.location')}>
      <LocationPicker bind:value={location} />
    </SettingsRow>
  </SettingsSection>

  <!-- Preferences — how the site looks and counts for me -->
  <SettingsSection {...section('preferences')}>
    <SettingsRow title={$t('pages.editBasic.preferredLang')}>
      {#snippet action()}
        <select id="language" bind:value={lango} aria-label={$t('pages.editBasic.preferredLang')} class="{field} w-auto">
          <option value="he">עברית</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
          <option value="es">Español</option>
          <option value="ru">Русский</option>
        </select>
      {/snippet}
    </SettingsRow>

    {@render translationPref?.()}

    {@render currencyPref?.()}

    <SettingsRow title={$t('pages.editBasic.freeDay')}>
      {#snippet action()}
        <select id="free-day" bind:value={frd} aria-label={$t('pages.editBasic.freeDay')} class="{field} w-auto">
          <option value="na" selected>{$t('pages.editBasic.freeDay')}</option>
          {#each dayValues as day, i (day)}
            <option value={day}>{$t(`pages.editBasic.days.${i}`)}</option>
          {/each}
        </select>
      {/snippet}
    </SettingsRow>

    <SettingsRow title={$t('pages.editBasic.levDisplay')}>
      {#snippet action()}
        <!-- The heart's own switch: the view is remembered per browser
             (levStores LEV_VIEW_KEY), the same choice the heart page makes. -->
        <LevViewSwitch value={$levView} onChange={(v) => levView.set(v)} />
      {/snippet}
    </SettingsRow>
  </SettingsSection>

  <!-- Notifications — where to reach me -->
  <SettingsSection {...section('notifications')}>
    <SettingsRow title={$t('pages.meSettings.pushTitle')} desc={pushStatus}>
      {#snippet action()}
        {#if sub}
          <button class={btnSecondary} onclick={turnOffNotifications} disabled={nutiBusy}>
            {$t('pages.editBasic.nutiTurnOff')}
          </button>
        {:else if nutiPermission !== 'denied' && nutiPermission !== 'unsupported'}
          <button class={btnPrimary} onclick={handleNotificationPermission} disabled={nutiBusy}>
            {#if nutiBusy}<Spinner size="xs" color="var(--gold)" />{/if}
            {$t('pages.editBasic.deviceNuti')}
          </button>
        {/if}
      {/snippet}
    </SettingsRow>

    <SettingsRow
      title={teleredy ? $t('pages.editBasic.manageTelegram') : $t('pages.editBasic.telegramNuti')}
      desc={$t('pages.meSettings.telegramDesc')}
    >
      {#snippet icon()}
        <svg class="h-5 w-5 shrink-0" fill="#1da1f2" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M18.384,22.779c0.322,0.228 0.737,0.285 1.107,0.145c0.37,-0.141 0.642,-0.457 0.724,-0.84c0.869,-4.084 2.977,-14.421 3.768,-18.136c0.06,-0.28 -0.04,-0.571 -0.26,-0.758c-0.22,-0.187 -0.525,-0.241 -0.797,-0.14c-4.193,1.552 -17.106,6.397 -22.384,8.35c-0.335,0.124 -0.553,0.446 -0.542,0.799c0.012,0.354 0.25,0.661 0.593,0.764c2.367,0.708 5.474,1.693 5.474,1.693c0,0 1.452,4.385 2.209,6.615c0.095,0.28 0.314,0.5 0.603,0.576c0.288,0.075 0.596,-0.004 0.811,-0.207c1.216,-1.148 3.096,-2.923 3.096,-2.923c0,0 3.572,2.619 5.598,4.062Zm-11.01,-8.677l1.679,5.538l0.373,-3.507c0,0 6.487,-5.851 10.185,-9.186c0.108,-0.098 0.123,-0.262 0.033,-0.377c-0.089,-0.115 -0.253,-0.142 -0.376,-0.064c-4.286,2.737 -11.894,7.596 -11.894,7.596Z"
          />
        </svg>
      {/snippet}
      <LoginT
        uid={parseInt(uid)}
        requestAccess={true}
        username="onelev_bot"
        onAuth={() => (teleredy = true)}
      />
    </SettingsRow>

    <SettingsRow title={$t('pages.meSettings.emailTitle')} desc={$t('pages.meSettings.emailDesc')}>
      {#snippet action()}
        <label class="flex items-center gap-2 text-sm cursor-pointer text-surfaceInk">
          <input type="checkbox" name="noMail" bind:checked={noMail} class="h-4 w-4 accent-barbi" />
          {$t('pages.editBasic.noEmails')}
        </label>
      {/snippet}
    </SettingsRow>
  </SettingsSection>

  <!-- Connections — accounts, AI agents and keys that act for me -->
  <SettingsSection {...section('connections')}>
    {@render githubAccount?.()}

    <SettingsRow title="🤖 {$t('mcp.banner.title')}" desc={$t('mcp.banner.desc')}>
      {#snippet action()}
        <a href="/me/settings/mcp" data-sveltekit-prefetch class={btnSecondary}>
          {$t('mcp.banner.cta')}
        </a>
      {/snippet}
    </SettingsRow>

    <SettingsRow title={$t('pages.editBasic.apiKeys')} desc={$t('pages.editBasic.apiKeysDesc')}>
      {#snippet action()}
        {#if !isCreatingKey}
          <button class={btnSecondary} onclick={() => (isCreatingKey = true)}>
            {$t('pages.editBasic.createKey')}
          </button>
        {/if}
      {/snippet}

      <div class="space-y-3">
        {#if lastCreatedKey}
          <div class="rounded-xl border border-green-500/40 bg-green-500/10 p-4">
            <p class="font-semibold text-surfaceInk mb-1">
              ✅ {$t('pages.editBasic.newKeySuccess')}: <strong>{lastCreatedKey.name}</strong>
            </p>
            <p class="text-sm text-surfaceMuted mb-2">{$t('pages.editBasic.saveKeyWarning')}</p>
            <div
              class="flex items-center gap-2 rounded-lg border border-surfaceLine bg-surface2 p-2 font-mono text-sm break-all text-surfaceInk"
              dir="ltr"
            >
              <span class="flex-1 select-all">{lastCreatedKey.raw}</span>
              <button onclick={() => copyKey(lastCreatedKey.raw)} class="{btnPrimary} !px-3 !py-1 text-xs">
                {copiedKey ? $t('pages.editBasic.copied') : $t('pages.editBasic.copy')}
              </button>
            </div>
            <button
              onclick={() => (lastCreatedKey = null)}
              class="mt-3 text-xs text-surfaceMuted hover:underline"
            >
              {$t('pages.editBasic.cancel')}
            </button>
          </div>
        {/if}

        {#if isCreatingKey}
          <div class="space-y-2 rounded-xl border border-surfaceLine bg-surface2 p-3">
            <label for="api-key-name" class={fieldLabel}>{$t('pages.editBasic.keyName')}</label>
            <div class="flex flex-wrap gap-2">
              <input
                id="api-key-name"
                bind:value={newKeyName}
                placeholder="Claude Desktop"
                class="{field} flex-1 min-w-[10rem]"
                required
                minlength="2"
              />
              <button onclick={createKey} class={btnPrimary}>
                {$t('pages.editBasic.create')}
              </button>
              <button onclick={() => (isCreatingKey = false)} class={btnSecondary}>
                {$t('pages.editBasic.cancel')}
              </button>
            </div>
          </div>
        {/if}

        {#if keys.length === 0}
          <p
            class="rounded-xl border border-dashed border-surfaceLine py-4 text-center text-sm text-surfaceMuted"
          >
            {$t('pages.editBasic.noKeys')}
          </p>
        {:else}
          <ul class="divide-y divide-surfaceLine overflow-hidden rounded-xl border border-surfaceLine">
            {#each keys as key (key.id)}
              <li class="flex items-center justify-between gap-2 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-surfaceInk">{key.name}</p>
                  <p class="font-mono text-xs text-surfaceMuted" dir="ltr">···· {key.key_prefix}</p>
                </div>
                <button
                  onclick={() => deleteKey(key.id, key.name)}
                  class="text-sm font-medium text-red-600 hover:underline"
                >
                  {$t('pages.editBasic.deleteKey')}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </SettingsRow>
  </SettingsSection>

  <!-- Security — identity, recovery, password -->
  <SettingsSection {...section('security')}>
    <SettingsRow title={$t('pages.editBasic.identityTitle')} desc={$t('pages.editBasic.identityDesc')}>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <ConsentStatusBadge expanded lang={$lang === 'en' ? 'en' : 'he'} />
        <a href="/me/identity" data-sveltekit-prefetch class={btnSecondary}>
          {$t('pages.editBasic.identityManage')}
        </a>
      </div>
    </SettingsRow>

    <!-- Same words as <RecoveryBanner>, laid out as a row of this card. -->
    <SettingsRow title="🛡️ {$t('recovery.banner.title')}" desc={$t('recovery.banner.desc')}>
      {#snippet action()}
        <a href="/me/settings/recovery" data-sveltekit-prefetch class={btnSecondary}>
          {$t('recovery.banner.cta')}
        </a>
      {/snippet}
    </SettingsRow>

    <SettingsRow title={$t('common.buttons.changePassword')} desc={$t('pages.meSettings.passwordDesc')}>
      {#snippet action()}
        {#if !changePassword}
          <button class={btnSecondary} onclick={() => (changePassword = true)}>
            {$t('common.buttons.changePassword')}
          </button>
        {/if}
      {/snippet}
      {#if changePassword}
        <div class="space-y-3 rounded-xl border border-surfaceLine bg-surface2 p-4">
          {#if beforePasswordChange}
            <div>
              <label for="old-pass" class={fieldLabel}>{$t('pages.editBasic.oldPass')}</label>
              <input
                id="old-pass"
                type="password"
                bind:value={passi}
                autocomplete="current-password"
                class={field}
              />
            </div>
            <div>
              <label for="new-pass" class={fieldLabel}>{$t('pages.editBasic.newPass')}</label>
              <input
                id="new-pass"
                type={showPassword ? 'text' : 'password'}
                bind:value={passwordx}
                autocomplete="new-password"
                class={field}
              />
            </div>
            <div class="flex flex-wrap gap-2">
              <button class={btnPrimary} onclick={handleChangePassword}>
                {$t('common.buttons.changePassword')}
              </button>
              <button class={btnSecondary} onclick={() => (changePassword = false)}>
                {$t('pages.editBasic.cancel')}
              </button>
            </div>
          {:else}
            <p class="font-medium text-green-600" role="status">{$t('pages.editBasic.passChanged')}</p>
          {/if}
        </div>
      {/if}
    </SettingsRow>
  </SettingsSection>

  <!-- Help — getting to know the platform again -->
  <SettingsSection {...section('help')}>
    <SettingsRow title={$t('pages.meSettings.onboarding')} desc={$t('pages.meSettings.onboardingDesc')}>
      {#snippet action()}
        <a href="/onboard" data-sveltekit-prefetch class={btnPrimary}>
          {$t('pages.meSettings.onboarding')}
        </a>
      {/snippet}
    </SettingsRow>

    <SettingsRow title={$t('pages.meSettings.tourTitle')} desc={$t('pages.meSettings.tourDesc')}>
      {#snippet action()}
        <button class={btnSecondary} onclick={() => toggleGuide(!isGuidMe)} disabled={pressed}>
          {#if pressed}<Spinner size="xs" color="var(--goldink)" />{/if}
          {isGuidMe ? $t('pages.editBasic.stopGuid') : $t('pages.editBasic.resumeGuid')}
        </button>
      {/snippet}
    </SettingsRow>
  </SettingsSection>

  <!-- Account -->
  <SettingsSection {...section('account')}>
    <SettingsRow title={$t('pages.editBasic.logout')} desc={$t('pages.meSettings.logoutDesc')}>
      {#snippet action()}
        <button class="{btnDanger} disabled:cursor-wait" onclick={logout} disabled={loggingOut}>
          {#if loggingOut}<Spinner size="xs" color="#fff" />{/if}
          {$t('pages.editBasic.logout')}
        </button>
      {/snippet}
    </SettingsRow>
  </SettingsSection>
</div>

{#if chan}
  <div
    class="fixed inset-x-0 bottom-0 z-50 border-t border-surfaceLine bg-surface/95 text-surfaceInk backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.12)]"
  >
    <div class="max-w-3xl mx-auto flex items-center justify-between gap-4 px-4 py-3 flex-wrap">
      <p class="text-sm font-medium text-goldink">{$t('pages.editBasic.unsavedChanges')}</p>
      <button class={btnPrimary} onclick={save} disabled={!chan}>
        {$t('pages.editBasic.save')}
      </button>
    </div>
  </div>
  <div class="h-20"></div>
{/if}
