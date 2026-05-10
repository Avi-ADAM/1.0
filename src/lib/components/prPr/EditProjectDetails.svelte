<script>
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { executeAction } from '$lib/client/actionClient.js';
  import { invalidateAll } from '$app/navigation';
  import MultiSelect from 'svelte-multiselect';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { onMount } from 'svelte';
  import Uplad from '$lib/components/userPr/uploadPic.svelte';



  let { projectBase, projectId, memberCount = 1, onSuccess, onCancel } = $props();

  // Form state initialized from projectBase
  let projectName = $state(projectBase?.projectName ?? '');
  let publicDescription = $state(projectBase?.publicDescription ?? '');
  let descripFor = $state(projectBase?.descripFor ?? '');
  let linkToWebsite = $state(projectBase?.linkToWebsite ?? '');
  let githublink = $state(projectBase?.githublink ?? '');
  let fblink = $state(projectBase?.fblink ?? '');
  let discordlink = $state(projectBase?.discordlink ?? '');
  let drivelink = $state(projectBase?.drivelink ?? '');
  let twiterlink = $state(projectBase?.twiterlink ?? '');
  let watsapplink = $state(projectBase?.watsapplink ?? '');
  let restime = $state(projectBase?.restime ?? 'feh');
  let srcP = $state(projectBase?.profilePic?.data?.attributes?.url ?? '');
  let newPicId = $state(null);

  // Values selection
  let allVallues = $state([]);

  function localizedVallueName(v) {
    if ($lang === 'he') {
      const loc = v.attributes.localizations?.data?.[0]?.attributes?.valueName;
      if (loc) return loc;
    }
    return v.attributes.valueName;
  }

  let selectedVallueNames = $state(
    (projectBase?.vallues?.data ?? []).map(localizedVallueName)
  );

  let loading = $state(false);
  let successMsg = $state('');
  let errorMsg = $state('');

  const isMultiUser = memberCount > 1;

  const i18n = {
    he: {
      title: 'עריכת פרטי פרויקט',
      name: 'שם הפרויקט',
      nameTaken: 'שם זה כבר קיים',
      pubDesc: 'תיאור קצר (גלוי לכולם)',
      privDesc: 'תיאור מפורט (נראות סלקטיבית)',
      website: 'לינק לאתר',
      github: 'לינק לגיטהאב',
      facebook: 'לינק לפייסבוק',
      discord: 'לינק לדיסקורד',
      drive: 'לינק לגוגל דרייב',
      twitter: 'לינק לטוויטר',
      whatsapp: 'לינק לוואטסאפ',
      restime: 'זמן תגובה להחלטות',
      restime48: '48 שעות',
      restime72: '72 שעות',
      restime96: '96 שעות',
      restimeWeek: 'שבוע',
      restimeNote: 'לאחר זמן זה, חוסר מענה יחשב כהסכמה',
      values: 'ערכים ומטרות',
      save: 'שמירת שינויים',
      cancel: 'ביטול',
      saving: 'שומר...',
      successSingle: 'הפרטים עודכנו בהצלחה!',
      successMulti: 'השינויים הועלו להצבעה!',
      successNoChange: 'לא זוהו שינויים',
      errorMsg: 'שגיאה בשמירה, נסה שנית',
      multiUserNote: 'פרויקט עם מספר חברים - השינויים יועלו להצבעה',
      addValue: 'הוסף ערך',
      uploadPic: 'תמונת פרופיל'
    },
    en: {
      title: 'Edit Project Details',
      name: 'Project Name',
      nameTaken: 'This name already exists',
      pubDesc: 'Short public description',
      privDesc: 'Detailed private description',
      website: 'Website link',
      github: 'GitHub link',
      facebook: 'Facebook link',
      discord: 'Discord link',
      drive: 'Google Drive link',
      twitter: 'Twitter link',
      whatsapp: 'WhatsApp link',
      restime: 'Decision response time',
      restime48: '48 hours',
      restime72: '72 hours',
      restime96: '96 hours',
      restimeWeek: '1 week',
      restimeNote: 'After this time, no response = approval',
      values: 'Values & goals',
      save: 'Save changes',
      cancel: 'Cancel',
      saving: 'Saving...',
      successSingle: 'Details updated successfully!',
      successMulti: 'Changes submitted for voting!',
      successNoChange: 'No changes detected',
      errorMsg: 'Error saving, please try again',
      multiUserNote: 'Multi-member project — changes will go to a vote',
      addValue: 'Add value',
      uploadPic: 'Profile Picture'
    },
    ar: {
      title: 'تعديل تفاصيل المشروع',
      name: 'اسم المشروع',
      nameTaken: 'هذا الاسم موجود مسبقاً',
      pubDesc: 'وصف قصير عام',
      privDesc: 'وصف مفصل (رؤية انتقائية)',
      website: 'رابط الموقع',
      github: 'رابط GitHub',
      facebook: 'رابط Facebook',
      discord: 'رابط Discord',
      drive: 'رابط Google Drive',
      twitter: 'رابط Twitter',
      whatsapp: 'رابط WhatsApp',
      restime: 'وقت الاستجابة للقرارات',
      restime48: '48 ساعة',
      restime72: '72 ساعة',
      restime96: '96 ساعة',
      restimeWeek: 'أسبوع',
      restimeNote: 'بعد هذا الوقت، غياب الرد يعتبر موافقة',
      values: 'القيم والأهداف',
      save: 'حفظ التغييرات',
      cancel: 'إلغاء',
      saving: 'جاري الحفظ...',
      successSingle: 'تم تحديث التفاصيل بنجاح!',
      successMulti: 'تم رفع التغييرات للتصويت!',
      successNoChange: 'لم يتم اكتشاف أي تغييرات',
      errorMsg: 'خطأ في الحفظ، يرجى المحاولة مرة أخرى',
      multiUserNote: 'مشروع متعدد الأعضاء - ستخضع التغييرات للتصويت',
      addValue: 'إضافة قيمة',
      uploadPic: 'صورة الملف الشخصي'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);
  /** @type {'rtl' | 'ltr'} */
  let dir = $derived($lang === 'he' || $lang === 'ar' ? 'rtl' : 'ltr');

  onMount(async () => {
    try {
      const res = await sendToSer({}, 'getAllVallues', 0, 0, false, fetch);
      let vallues = res?.data?.vallues?.data ?? [];
      if ($lang === 'he') {
        vallues = vallues.map((v) => {
          const loc = v.attributes.localizations?.data?.[0]?.attributes?.valueName;
          return loc ? { ...v, attributes: { ...v.attributes, valueName: loc } } : v;
        });
      }
      allVallues = vallues;
    } catch (e) {
      console.error('Failed to load vallues', e);
    }
  });

  // Original IDs from projectBase, used as fallback if allVallues hasn't loaded yet
  const originalVallueIds = (projectBase?.vallues?.data ?? []).map((v) => v.id);

  function resolveVallueIds(names) {
    if (allVallues.length === 0) {
      // allVallues not loaded yet — keep original to avoid wiping the relation
      return originalVallueIds;
    }
    return names
      .map((name) => allVallues.find((v) => v.attributes.valueName === name)?.id)
      .filter(Boolean);
  }

  async function handleUpload(event) {
    const files = event.files;
    loading = true;
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: files
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      if (data?.[0]?.id) {
        newPicId = String(data[0].id);
        srcP = data[0].url;
      }
    } catch (e) {
      console.error('Upload failed', e);
      errorMsg = t.errorMsg;
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    if (!projectName.trim()) return;
    loading = true;
    successMsg = '';
    errorMsg = '';

    const result = await executeAction('updateProjectDetails', {
      projectId,
      projectName: projectName.trim(),
      publicDescription,
      descripFor,
      linkToWebsite,
      githublink,
      fblink,
      discordlink,
      drivelink,
      twiterlink,
      watsapplink,
      restime,
      vallueIds: resolveVallueIds(selectedVallueNames),
      newPicId
    });

    loading = false;

    if (result.success) {
      const count = result.data?.decisionsCreated ?? 0;
      if (isMultiUser && count === 0 && !result.data?.projectName) {
        successMsg = t.successNoChange;
      } else if (isMultiUser) {
        successMsg = t.successMulti;
      } else {
        successMsg = t.successSingle;
        await invalidateAll();
      }
      onSuccess?.();
    } else {
      errorMsg = result.error?.message || t.errorMsg;
    }
  }
</script>

<div {dir} class="edit-project-details space-y-5 p-4 bg-white rounded-xl shadow-md">
  <h2 class="text-xl font-bold text-primary">{t.title}</h2>

  {#if isMultiUser}
    <div class="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-3 text-sm">
      {t.multiUserNote}
    </div>
  {/if}

  <!-- Profile Pic -->
  <div class="field-group">
    <label class="field-label">{t.uploadPic}</label>
    <div class="flex justify-center bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gold/30">
      <Uplad onMessage={handleUpload} current={srcP} noHeader={true} />
    </div>
  </div>

  <!-- Name -->
  <div class="field-group">
    <label class="field-label" for="epd-name">{t.name}</label>
    <input id="epd-name" class="field-input" type="text" bind:value={projectName} required />
  </div>

  <!-- Public description -->
  <div class="field-group">
    <label class="field-label" for="epd-pubdesc">{t.pubDesc}</label>
    <RichText bind:outpot={publicDescription} sml={true} />
  </div>

  <!-- Private description -->
  <div class="field-group">
    <label class="field-label" for="epd-privdesc">{t.privDesc}</label>
    <RichText bind:outpot={descripFor} sml={true} />
  </div>

  <!-- Website -->
  <div class="field-group">
    <label class="field-label" for="epd-website">{t.website}</label>
    <input id="epd-website" class="field-input" type="url" bind:value={linkToWebsite} />
  </div>

  <!-- GitHub -->
  <div class="field-group">
    <label class="field-label" for="epd-github">{t.github}</label>
    <input id="epd-github" class="field-input" type="url" bind:value={githublink} />
  </div>

  <!-- Facebook -->
  <div class="field-group">
    <label class="field-label" for="epd-facebook">{t.facebook}</label>
    <input id="epd-facebook" class="field-input" type="url" bind:value={fblink} />
  </div>

  <!-- Discord -->
  <div class="field-group">
    <label class="field-label" for="epd-discord">{t.discord}</label>
    <input id="epd-discord" class="field-input" type="url" bind:value={discordlink} />
  </div>

  <!-- Drive -->
  <div class="field-group">
    <label class="field-label" for="epd-drive">{t.drive}</label>
    <input id="epd-drive" class="field-input" type="url" bind:value={drivelink} />
  </div>

  <!-- Twitter -->
  <div class="field-group">
    <label class="field-label" for="epd-twitter">{t.twitter}</label>
    <input id="epd-twitter" class="field-input" type="url" bind:value={twiterlink} />
  </div>

  <!-- WhatsApp -->
  <div class="field-group">
    <label class="field-label" for="epd-whatsapp">{t.whatsapp}</label>
    <input id="epd-whatsapp" class="field-input" type="url" bind:value={watsapplink} />
  </div>

  <!-- Response time -->
  <div class="field-group">
    <label class="field-label" for="epd-restime">{t.restime}</label>
    <select id="epd-restime" class="field-select" bind:value={restime}>
      <option value="feh">{t.restime48}</option>
      <option value="sth">{t.restime72}</option>
      <option value="nsh">{t.restime96}</option>
      <option value="sevend">{t.restimeWeek}</option>
    </select>
    <small class="text-gold">{t.restimeNote}</small>
  </div>

  <!-- Values -->
  {#if allVallues.length > 0}
    <div class="field-group">
      <label class="field-label">{t.values}</label>
      <MultiSelect
        bind:selected={selectedVallueNames}
        options={allVallues.map((v) => v.attributes.valueName)}
        placeholder={t.addValue}
        --sms-li-selected-bg="var(--gold)"
        outerDivClass="!bg-gold !text-barbi"
        inputClass="!bg-gold !text-barbi"
        liSelectedClass="!bg-barbi !text-gold"
      />
    </div>
  {/if}

  <!-- Messages -->
  {#if successMsg}
    <div class="text-green-700 bg-green-50 border border-green-300 rounded-lg p-3 text-sm">
      {successMsg}
    </div>
  {/if}
  {#if errorMsg}
    <div class="text-red-700 bg-red-50 border border-red-300 rounded-lg p-3 text-sm">
      {errorMsg}
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex gap-3 justify-end flex-wrap">
    <button
      class="btn-secondary"
      onclick={onCancel}
      disabled={loading}
    >
      {t.cancel}
    </button>
    <button
      class="btn-primary"
      onclick={handleSubmit}
      disabled={loading || !projectName.trim()}
    >
      {loading ? t.saving : t.save}
    </button>
  </div>
</div>

<style>
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field-label {
    font-size: 13px;
    color: var(--barbi-pink);
    font-weight: 500;
  }
  .field-input,
  .field-select {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--gold);
    padding: 8px 0;
    font-size: 14px;
    color: var(--barbi-pink);
    outline: none;
    width: 100%;
  }
  .field-input:focus,
  .field-select:focus {
    border-bottom-color: #2196f3;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--barbi-pink), var(--mpink));
    color: var(--gold);
    font-weight: bold;
    padding: 10px 24px;
    border-radius: 9999px;
    transition: opacity 0.2s;
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-secondary {
    border: 1px solid var(--gold);
    color: var(--barbi-pink);
    padding: 10px 24px;
    border-radius: 9999px;
    transition: background 0.2s;
  }
  .btn-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }
</style>
