<script lang="ts">
  import { isRtl, t } from '$lib/translations';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import axios from 'axios';

  // Import existing UI components
  import Button from '$lib/celim/ui/button.svelte';
  import TextInput from '$lib/celim/ui/input/textInput.svelte';
  import Checkbox from '$lib/celim/ui/input/checkbox.svelte';
  import LoginT from '$lib/func/telegram/loginT.svelte';

  // Import newly created Card component
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
  } from '$lib/components/ui/card';
  import Separator from '$lib/celim/ui/separator.svelte';
  import ObjectChooser from '$lib/celim/ui/objectChooser.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import ConsentStatusBadge from '$lib/components/consent/ConsentStatusBadge.svelte';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';

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
    onGuid
  }: { location?: EditLocation } & Record<string, any> = $props();

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
  let sub = $state(null);
  let initialValues = $state(null);

  // Translations
const dayValues = ['sun', 'mon', 'thu', 'wen', 'teh', 'fri', 'shabat'];

  // Functions
  onMount(async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      sub = await reg.pushManager.getSubscription();
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
        toast.error(err.message || 'Error creating key');
      }
    } catch (e) {
      toast.error('Error creating key');
    }
  }

  async function deleteKey(id, name) {
    if (
      !confirm(
        $lang === 'he'
          ? `למחוק את המפתח "${name}"?`
          : `Delete key "${name}"?`
      )
    )
      return;
    try {
      const response = await fetch(`/api/api-keys?id=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchKeys();
        toast.success('Key deleted');
      }
    } catch (e) {
      toast.error('Error deleting key');
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    copiedKey = true;
    setTimeout(() => (copiedKey = false), 2000);
  }

  $effect(() => {
    console.log(initialValues);
    if (!initialValues) return;
    const changed =
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
    chan = changed;
    console.log('Changed:', changed, {
      un,
      bi,
      githublink,
      twiterlink,
      discordlink,
      fblink,
      frd,
      lango,
      checked,
      noMail
    });
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
    toast.success('השינויים נשמרו');
  }

  function logout() {
    localStorage.clear();
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    goto('/');
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
  async function handleNotificationPermission() {
    if (!('Notification' in window)) {
      toast.error('Browser does not support notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await addDevice();
    }
  }

  async function addDevice() {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    let currentSub = await reg.pushManager.getSubscription();
    if (currentSub) {
      toast.info('Device already registered.');
      return;
    }

    try {
      currentSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_publicKey
      });

      const que = `mutation CreateMachshir($data: MachshirInput!) {
		createMachshir(data: $data) { data { id } }
	  }`;

      const variables = {
        data: {
          users_permissions_user: parseInt(uid),
          jsoni: JSON.stringify(currentSub),
          projects: projectIds.length > 0 ? projectIds : undefined,
          publishedAt: new Date().toISOString()
        }
      };
      // Assuming SendTo handles GraphQL requests
      // await SendTo(que, variables);
      console.log('Sending subscription to server', variables);
      toast.success($t('pages.editBasic.nutiSuccess'));
      sub = currentSub;
    } catch (e) {
      console.error(e);
      toast.error($t('pages.editBasic.error'), { description: e.message });
    }
  }

  // --- Guide ---
  async function toggleGuide(show) {
    pressed = true;
    onGuidMeChange?.(show);
    document.cookie = `guidMe=${show ? 'again' : 'done'}; expires=${new Date(
      2026,
      0,
      1
    ).toUTCString()}; path=/`;

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

<div dir={$isRtl ? 'rtl' : 'ltr'}>
  <h1 class="text-2xl font-bold text-center mb-6 text-gold">{$t('pages.editBasic.head')}</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
    <!-- Personal Details -->
    <Card>
      <CardHeader>
        <CardTitle>{$t('pages.editBasic.personalDetails')}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 ">
        <TextInput lebel={$t('common.labels.name')} bind:text={un} />
        <div>
          <label for="bio" class="block text-gold text-sm font-medium mb-1"
            >{$t('pages.editBasic.bio')}</label
          >
          <textarea
            id="bio"
            bind:value={bi}
            class="w-full p-2 border rounded-md text-gold bg-transparent"
            rows="4"
          ></textarea>
        </div>
      </CardContent>
    </Card>

    <!-- Links -->
    <Card>
      <CardHeader>
        <CardTitle>{$t('pages.editBasic.links')}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <TextInput
          lebel={$t('pages.editBasic.github')}
          bind:text={githublink}
        />
        <TextInput
          lebel={$t('pages.editBasic.twitter')}
          bind:text={twiterlink}
        />
        <TextInput
          lebel={$t('pages.editBasic.discord')}
          bind:text={discordlink}
        />
        <TextInput
          lebel={$t('pages.editBasic.facebook')}
          bind:text={fblink}
        />
      </CardContent>
    </Card>

    <!-- Location -->
    <Card class="md:col-span-2">
      <CardHeader>
        <CardTitle>{$t('pages.editBasic.location')}</CardTitle>
      </CardHeader>
      <CardContent>
        <LocationPicker bind:value={location} />
      </CardContent>
    </Card>

    <!-- Settings -->
    <Card>
      <CardHeader>
        <CardTitle>{$t('pages.editBasic.settings')}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div>
          <label for="free-day" class="block text-sm font-medium mb-1 text-gold"
            >{$t('pages.editBasic.freeDay')}</label
          >
          <select
            id="free-day"
            bind:value={frd}
            class="w-full p-2 border rounded-md bg-barbi text-lg text-gold"
          >
            <option value="na" selected>{$t('pages.editBasic.freeDay')}</option>
            {#each dayValues as day, i (day)}
              <option value={day}>{$t(`pages.editBasic.days.${i}`)}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="language" class="block text-sm font-medium text-gold mb-1"
            >{$t('pages.editBasic.preferredLang')}</label
          >
          <select
            id="language"
            bind:value={lango}
            class="w-full p-2 border rounded-md bg-barbi text-lg text-gold"
          >
            <option value="he">עברית</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="es">Español</option>
            <option value="ru">Русский</option>
          </select>
        </div>
        <ObjectChooser
          level={$t('pages.editBasic.levDisplay')}
          bind:checked
          tr={$t('pages.editBasic.coins')}
          fl={$t('pages.editBasic.cards')}
        />
        <Separator />
        {#if isGuidMe}
          <Button
            text={$t('pages.editBasic.stopGuid')}
            onClick={() => toggleGuide(false)}
            disabled={pressed}
            loading={pressed}
          />
        {:else}
          <Button
            text={$t('pages.editBasic.resumeGuid')}
            onClick={() => toggleGuide(true)}
            disabled={pressed}
            loading={pressed}
          />
        {/if}
      </CardContent>
    </Card>

    <!-- Cryptographic Identity -->
    <Card>
      <CardHeader>
        <CardTitle>{$t('pages.editBasic.identityTitle')}</CardTitle>
        <CardDescription>{$t('pages.editBasic.identityDesc')}</CardDescription>
      </CardHeader>
      <CardContent class="flex items-center justify-between gap-3 flex-wrap">
        <ConsentStatusBadge expanded lang={$lang === 'en' ? 'en' : 'he'} />
        <a
          href="/me/identity"
          data-sveltekit-prefetch
          class="text-sm text-gold hover:underline"
        >
          {$t('pages.editBasic.identityManage')} →
        </a>
      </CardContent>
    </Card>

    <!-- API Keys -->
    <Card>
      <CardHeader>
        <CardTitle>{$t('pages.editBasic.apiKeys')}</CardTitle>
        <CardDescription>{$t('pages.editBasic.apiKeysDesc')}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if lastCreatedKey}
          <div class="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
            <p class="font-semibold text-green-800 mb-1">
              ✅ {$t('pages.editBasic.newKeySuccess')}: <strong>{lastCreatedKey.name}</strong
              >
            </p>
            <p class="text-sm text-green-700 mb-2">
              {$t('pages.editBasic.saveKeyWarning')}
            </p>
            <div
              class="flex items-center gap-2 bg-white border border-green-200 rounded p-2 font-mono text-sm break-all text-black"
            >
              <span class="flex-1 select-all">{lastCreatedKey.raw}</span>
              <button
                onclick={() => copyKey(lastCreatedKey.raw)}
                class="shrink-0 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {copiedKey ? $t('pages.editBasic.copied') : $t('pages.editBasic.copy')}
              </button>
            </div>
            <button
              onclick={() => (lastCreatedKey = null)}
              class="mt-3 text-xs text-gray-500 hover:underline"
            >
              {$t('pages.editBasic.cancel')}
            </button>
          </div>
        {/if}

        {#if isCreatingKey}
          <div class="space-y-2 bg-gray-50/50 p-3 rounded-lg border">
            <label
              for="api-key-name"
              class="block text-sm font-medium text-gold"
              >{$t('pages.editBasic.keyName')}</label
            >
            <div class="flex gap-2">
              <input
                id="api-key-name"
                bind:value={newKeyName}
                placeholder="Claude Desktop"
                class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-transparent text-gold"
                required
                minlength="2"
              />
              <button
                onclick={createKey}
                class="px-4 py-2 bg-gold text-barbi rounded text-sm font-bold hover:brightness-110"
              >
                {$t('pages.editBasic.create')}
              </button>
              <button
                onclick={() => (isCreatingKey = false)}
                class="px-4 py-2 border rounded text-sm hover:bg-gray-100/10 text-gold shadow-md"
              >
                {$t('pages.editBasic.cancel')}
              </button>
            </div>
          </div>
        {:else}
          <Button
            text={$t('pages.editBasic.createKey')}
            onClick={() => (isCreatingKey = true)}
          />
        {/if}

        <div class="space-y-2 mt-4">
          {#if keys.length === 0}
            <p class="text-gray-400 text-sm text-center py-4 border rounded-lg">
              {$t('pages.editBasic.noKeys')}
            </p>
          {:else}
            <div
              class="divide-y border rounded-lg overflow-hidden bg-white/5 shadow-inner"
            >
              {#each keys as key (key.id)}
                <div
                  class="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-gold truncate">
                      {key.name}
                    </p>
                    <p class="text-xs text-gray-400 font-mono">
                      ···· {key.key_prefix}
                    </p>
                  </div>
                  <button
                    onclick={() => deleteKey(key.id, key.name)}
                    class="text-xs text-red-400 hover:text-red-300 hover:underline ms-2"
                  >
                    {$t('pages.editBasic.deleteKey')}
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </CardContent>
    </Card>

    <!-- Security & Notifications -->
    <Card>
      <CardHeader>
        <CardTitle>{$t('pages.editBasic.security')}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <Button
          text={$t('pages.editBasic.deviceNuti')}
          onClick={handleNotificationPermission}
          disabled={!!sub}
        />
        <div>
          <h3 class="flex items-center justify-center text-gold font-bold p-2">
            {teleredy ? $t('pages.editBasic.manageTelegram') : $t('pages.editBasic.telegramNuti')}
            <svg class="h-5 w-5 ms-2" fill="#1da1f2" viewBox="0 0 24 24">
              <path
                d="M18.384,22.779c0.322,0.228 0.737,0.285 1.107,0.145c0.37,-0.141 0.642,-0.457 0.724,-0.84c0.869,-4.084 2.977,-14.421 3.768,-18.136c0.06,-0.28 -0.04,-0.571 -0.26,-0.758c-0.22,-0.187 -0.525,-0.241 -0.797,-0.14c-4.193,1.552 -17.106,6.397 -22.384,8.35c-0.335,0.124 -0.553,0.446 -0.542,0.799c0.012,0.354 0.25,0.661 0.593,0.764c2.367,0.708 5.474,1.693 5.474,1.693c0,0 1.452,4.385 2.209,6.615c0.095,0.28 0.314,0.5 0.603,0.576c0.288,0.075 0.596,-0.004 0.811,-0.207c1.216,-1.148 3.096,-2.923 3.096,-2.923c0,0 3.572,2.619 5.598,4.062Zm-11.01,-8.677l1.679,5.538l0.373,-3.507c0,0 6.487,-5.851 10.185,-9.186c0.108,-0.098 0.123,-0.262 0.033,-0.377c-0.089,-0.115 -0.253,-0.142 -0.376,-0.064c-4.286,2.737 -11.894,7.596 -11.894,7.596Z"
              />
            </svg>
          </h3>
          <LoginT
            uid={parseInt(uid)}
            requestAccess={true}
            username="onelev_bot"
            onAuth={() => (teleredy = true)}
          />
        </div>
        <Separator />
        <Checkbox
          name="noMail"
          lebel={$t('pages.editBasic.noEmails')}
          lang={$lang}
          bind:value={noMail}
        />
        <Separator />
        {#if !changePassword}
          <Button
            text={$t('common.buttons.changePassword')}
            onClick={() => (changePassword = !changePassword)}
          />
        {:else}
          <div class="p-4 border rounded-md mt-4 space-y-4">
            {#if beforePasswordChange}
              <TextInput
                lebel={$t('pages.editBasic.oldPass')}
                type="password"
                bind:text={passi}
                autocomplete="current-password"
              />
              <TextInput
                lebel={$t('pages.editBasic.newPass')}
                type={showPassword ? 'text' : 'password'}
                bind:text={passwordx}
                autocomplete="new-password"
              />
              <!--						<ul class="text-xs space-y-1">
								<li class={validations[0] ? 'text-green-500' : 'text-red-500'}>
									{validations[0] ? '✓' : '✗'} {$t('pages.editBasic.passVal1')}
								</li>
								<li class={validations[1] ? 'text-green-500' : 'text-red-500'}>
									{validations[1] ? '✓' : '✗'} {$t('pages.editBasic.passVal2')}
								</li>
								<li class={validations[2] ? 'text-green-500' : 'text-red-500'}>
									{validations[2] ? '✓' : '✗'} {$t('pages.editBasic.passVal3')}
								</li>
							</ul>
							disabled={Boolean(strength < 3)}
-->
              <Button
                text={$t('common.buttons.changePassword')}
                onClick={handleChangePassword}
                loading={false}
              />
            {:else}
              <p class="text-green-500">{$t('pages.editBasic.passChanged')}</p>
            {/if}
          </div>
        {/if}

        <Separator />
        <button
          onclick={logout}
          class="!bg-red-500 text-white hover:!bg-red-600 px-8 py-2 rounded-xl border-b-[4px] hover:brightness-105 hover:-translate-y-[2px] hover:border-b-[6px] active:border-b-[2px] active:brightness-95 active:translate-y-[2px] border-barbi shadow-lg hover:shadow-xl font-bold font-rubik"
        >
          <div
            class="flex flex-row align-center justify-center items-center gap-4"
          >
            <h2 class="text-lg font-bold text-gold">
              {$t('pages.editBasic.logout')}
            </h2>
          </div>
        </button>
      </CardContent>
    </Card>
  </div>
  {#if chan}
    <div
      class="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.12)]"
    >
      <div
        class="max-w-3xl mx-auto flex items-center justify-between gap-4 px-4 py-3 flex-wrap"
      >
        <p class="text-sm font-medium text-gold">
          {$t('pages.editBasic.unsavedChanges')}
        </p>
        <Button
          text={$t('pages.editBasic.save')}
          size="sm"
          onClick={save}
          disabled={!chan}
        />
      </div>
    </div>
    <div class="h-20"></div>
  {/if}
</div>
