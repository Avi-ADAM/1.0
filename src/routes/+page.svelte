<script>
  import Fpage from '$lib/components/main/fpage.svelte';
  import { lang } from '$lib/stores/lang.js';
</script>

<svelte:head>
  <title>{$lang === 'he' ? '1lev1 - ליצור יחד, בהסכמה' : $lang === 'ar' ? '1lev1 - نبني معاً، بالاتفاق' : '1lev1 - Create Together, by Agreement'}</title>
  <meta name="description" content={$lang === 'he' ? 'פלטפורמה לשיתוף פעולה הוגן — משימות, חלוקת רווחים ושקיפות מלאה' : $lang === 'ar' ? 'منصة للتعاون العادل — مهام، تقاسم الأرباح والشفافية' : 'Fair collaboration platform — missions, profit sharing and full transparency'} />
  <meta property="og:title" content={$lang === 'he' ? '1lev1 - ליצור יחד, בהסכמה' : $lang === 'ar' ? '1lev1 - نبني معاً، بالاتفاق' : '1lev1 - Create Together, by Agreement'} />
  <meta property="og:description" content={$lang === 'he' ? 'פלטפורמה לשיתוף פעולה הוגן — משימות, חלוקת רווחים ושקיפות מלאה' : $lang === 'ar' ? 'منصة للتعاون العادل — مهام، تقاسم الأرباح والشفافية' : 'Fair collaboration platform — missions, profit sharing and full transparency'} />
  <meta property="og:type" content="website" />
</svelte:head>

<Fpage/>
