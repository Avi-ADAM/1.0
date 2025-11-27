<script lang="ts">
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
  import { page } from '$app/state';

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
    uid = $bindable(''),
    onMessage,
    onGuid
  } = $props();

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
  const noEmails = {
    he: 'אל תשלחו לי מיילים',
    en: 'Do not send me emails'
  };
  const t = {
    he: {
      head: 'עריכת פרופיל',
      save: 'שמור שינויים',
      personalDetails: 'פרטים אישיים',
      name: 'שם',
      nameExists: 'השם כבר קיים, נא לבחור שם אחר',
      bio: 'ביוגרפיה',
      links: 'קישורים',
      github: 'גיטהאב',
      twitter: 'טוויטר',
      discord: 'דיסקורד',
      facebook: 'פייסבוק',
      settings: 'הגדרות',
      freeDay: 'היום החופשי שלי',
      preferredLang: 'שפה מועדפת',
      levDisplay: 'תצוגה מועדפת במסך הלב',
      coins: 'מטבעות',
      cards: 'קלפים',
      security: 'אבטחה והתראות',
      changePass: 'שנה סיסמה',
      newPass: 'סיסמה חדשה',
      oldPass: 'סיסמה ישנה',
      passChanged: 'הסיסמה שונתה בהצלחה!',
      passVal1: 'לפחות 6 תווים',
      passVal2: 'לפחות אות גדולה אחת',
      passVal3: 'לפחות מספר אחד',
      deviceNuti: 'הרשמה להתראות במכשיר זה',
      telegramNuti: 'הרשמה להתראות בטלגרם',
      manageTelegram: 'ניהול הרשמה לטלגרם',
      account: 'ניהול חשבון',
      logout: 'יציאה מהחשבון',
      resumeGuid: 'החזרת המדריך',
      stopGuid: 'ביטול הצגת המדריך',
      guidResumed: 'המדריך חזר! יש לרענן את העמוד',
      guidStopped: 'המדריך לא יוצג שוב',
      error: 'אירעה שגיאה',
      nutiSuccess: 'נרשמת בהצלחה להתראות במכשיר זה'
    },
    en: {
      head: 'Edit Profile',
      save: 'Save Changes',
      personalDetails: 'Personal Details',
      name: 'Name',
      nameExists: 'Name already exists, please choose another one',
      bio: 'Biography',
      links: 'Links',
      github: 'GitHub',
      twitter: 'Twitter',
      discord: 'Discord',
      facebook: 'Facebook',
      settings: 'Settings',
      freeDay: 'My Free Day',
      preferredLang: 'Preferred Language',
      levDisplay: 'Preferred Lev Page Display',
      coins: 'Coins',
      cards: 'Cards',
      noEmails: 'Do not send me emails',
      security: 'Security & Notifications',
      changePass: 'Change Password',
      newPass: 'New Password',
      oldPass: 'Old Password',
      passChanged: 'Password changed successfully!',
      passVal1: 'At least 6 characters',
      passVal2: 'At least one capital letter',
      passVal3: 'At least one number',
      deviceNuti: 'Register for notifications on this device',
      telegramNuti: 'Register for Telegram notifications',
      manageTelegram: 'Manage Telegram subscription',
      account: 'Account Management',
      logout: 'Logout',
      resumeGuid: 'Resume Guide',
      stopGuid: 'Stop Guide',
      guidResumed: 'Guide is back! Please refresh the page',
      guidStopped: 'The guide will not be shown again',
      error: 'An error occurred',
      nutiSuccess: 'Successfully registered for notifications on this device'
    }
  };

  const days = {
    he: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    en: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ]
  };
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
      noMail
    };
  });

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
      noMail !== initialValues.noMail;
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
      cards: checked
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
    const token = page.data.tok;
    if (!token) {
      errorl = 'Authentication error';
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_URL}/api/auth/change-password`,
        {
          currentPassword: passi,
          password: passwordx,
          passwordConfirmation: passwordx
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success(t[$lang].passChanged);
      beforePasswordChange = false;
    } catch (err) {
      console.error(err);
      errorl = err.response?.data?.error?.message || t[$lang].error;
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
      toast.success(t[$lang].nutiSuccess);
      sub = currentSub;
    } catch (e) {
      console.error(e);
      toast.error(t[$lang].error, { description: e.message });
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
      const token = page.data.tok;
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${import.meta.env.VITE_URL}/graphql`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation { 
						updateUsersPermissionsUser(
							id: ${parseInt(uid)}, 
							data: { profilManualAlready: ${!show} }
						) { 
							data { id } 
						} 
					}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update guide status');
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error');
      }

      toast.success(show ? t[$lang].guidResumed : t[$lang].guidStopped);
      if (show) onGuid?.();
    } catch (e) {
      console.error(e);
      toast.error(t[$lang].error);
      // Revert local state on error
      onGuidMeChange?.(!show);
    } finally {
      pressed = false;
    }
  }
</script>

<div dir={$lang === 'he' ? 'rtl' : 'ltr'}>
  <h1 class="text-2xl font-bold text-center mb-6 text-gold">{t[$lang].head}</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
    <!-- Personal Details -->
    <Card>
      <CardHeader>
        <CardTitle>{t[$lang].personalDetails}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 ">
        <TextInput lebel={{ en: 'Name', he: 'שם' }} bind:text={un} />
        <div>
          <label for="bio" class="block text-gold text-sm font-medium mb-1"
            >{t[$lang].bio}</label
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
        <CardTitle>{t[$lang].links}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <TextInput
          lebel={{ en: 'GitHub', he: 'גיטהאב' }}
          bind:text={githublink}
        />
        <TextInput
          lebel={{ en: 'Twitter', he: 'טוויטר' }}
          bind:text={twiterlink}
        />
        <TextInput
          lebel={{ en: 'Discord', he: 'דיסקורד' }}
          bind:text={discordlink}
        />
        <TextInput
          lebel={{ en: 'Facebook', he: 'פייסבוק' }}
          bind:text={fblink}
        />
      </CardContent>
    </Card>

    <!-- Settings -->
    <Card>
      <CardHeader>
        <CardTitle>{t[$lang].settings}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div>
          <label for="free-day" class="block text-sm font-medium mb-1 text-gold"
            >{t[$lang].freeDay}</label
          >
          <select
            id="free-day"
            bind:value={frd}
            class="w-full p-2 border rounded-md bg-barbi text-lg text-gold"
          >
            <option value="na" selected>{t[$lang].freeDay}</option>
            {#each dayValues as day, i}
              <option value={day}>{days[$lang][i]}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="language" class="block text-sm font-medium text-gold mb-1"
            >{t[$lang].preferredLang}</label
          >
          <select
            id="language"
            bind:value={lango}
            class="w-full p-2 border rounded-md bg-barbi text-lg text-gold"
          >
            <option value="he">עברית</option>
            <option value="en">English</option>
          </select>
        </div>
        <ObjectChooser
          level={{ he: t.he.levDisplay, en: t.en.levDisplay }}
          bind:checked
          tr={{ he: t.he.coins, en: t.en.coins }}
          fl={{ he: t.he.cards, en: t.en.cards }}
        />
        <Separator />
        {#if isGuidMe}
          <Button
            text={{ he: t.he.stopGuid, en: t.en.stopGuid }}
            onClick={() => toggleGuide(false)}
            disabled={pressed}
            loading={pressed}
          />
        {:else}
          <Button
            text={{ he: t.he.resumeGuid, en: t.en.resumeGuid }}
            onClick={() => toggleGuide(true)}
            disabled={pressed}
            loading={pressed}
          />
        {/if}
      </CardContent>
    </Card>

    <!-- Security & Notifications -->
    <Card>
      <CardHeader>
        <CardTitle>{t[$lang].security}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <Button
          text={{ he: t.he.deviceNuti, en: t.en.deviceNuti }}
          onClick={handleNotificationPermission}
          disabled={!!sub}
        />
        <div>
          <h3 class="flex items-center justify-center text-gold font-bold p-2">
            {teleredy ? t[$lang].manageTelegram : t[$lang].telegramNuti}
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
          lebel={noEmails}
          lang={$lang}
          bind:value={noMail}
        />
        <Separator />
        {#if !changePassword}
          <Button
            text={{ he: 'שנה סיסמה', en: 'Change Password' }}
            onClick={() => (changePassword = !changePassword)}
          />
        {:else}
          <div class="p-4 border rounded-md mt-4 space-y-4">
            {#if beforePasswordChange}
              <TextInput
                lebel={{ en: t.en.oldPass, he: t.he.oldPass }}
                type="password"
                bind:text={passi}
                autocomplete="current-password"
              />
              <TextInput
                lebel={{ en: t.en.newPass, he: t.he.newPass }}
                type={showPassword ? 'text' : 'password'}
                bind:text={passwordx}
                autocomplete="new-password"
              />
              <!--						<ul class="text-xs space-y-1">
								<li class={validations[0] ? 'text-green-500' : 'text-red-500'}>
									{validations[0] ? '✓' : '✗'} {t[$lang].passVal1}
								</li>
								<li class={validations[1] ? 'text-green-500' : 'text-red-500'}>
									{validations[1] ? '✓' : '✗'} {t[$lang].passVal2}
								</li>
								<li class={validations[2] ? 'text-green-500' : 'text-red-500'}>
									{validations[2] ? '✓' : '✗'} {t[$lang].passVal3}
								</li>
							</ul>
							disabled={Boolean(strength < 3)}
-->
              <Button
                text={{ he: 'שנה סיסמה', en: 'Change Password' }}
                onClick={handleChangePassword}
                loading={false}
              />
            {:else}
              <p class="text-green-500">{t[$lang].passChanged}</p>
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
              {t[$lang].logout}
            </h2>
          </div>
        </button>
      </CardContent>
    </Card>
  </div>
  {#if chan}
    <Button
      text={{ he: t.he.save, en: t.en.save }}
      onClick={save}
      disabled={!chan}
    />
  {/if}
</div>
