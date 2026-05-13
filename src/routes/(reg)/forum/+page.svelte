<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

  const copy = {
    he: {
      title: 'בחרו פורום מהרשימה',
      body: 'אפשר לפתוח שיחה קיימת, לחפש לפי ריקמה או להעתיק קישור ישיר לכל פורום.',
      hint: 'בדסקטופ השיחה תיפתח כאן. במובייל הרשימה עוברת למסך השיחה.'
    },
    en: {
      title: 'Choose a forum from the list',
      body: 'Open an existing conversation, search by project, or share a direct forum link.',
      hint: 'On desktop the thread opens here. On mobile the list gives way to the conversation.'
    },
    ar: {
      title: 'Choose a forum from the list',
      body: 'Open an existing conversation, search by project, or share a direct forum link.',
      hint: 'On desktop the thread opens here. On mobile the list gives way to the conversation.'
    }
  };

  let t = $derived(copy[$lang] || copy.he);
</script>

<div class="grid h-full min-h-[60vh] place-items-center p-8 text-center">
  <div class="max-w-md">
    <div class="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border border-gold/50 bg-gold/10 text-3xl font-black text-gold shadow-lg shadow-fuchsia-500/15">
      1
    </div>
    <h2 class="text-2xl font-black text-gold">{t.title}</h2>
    <p class="mt-3 text-pink-100/75">{t.body}</p>
    <p class="mt-6 rounded-md border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-pink-100/60">
      {t.hint}
    </p>
  </div>
</div>
