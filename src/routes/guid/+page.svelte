<script>
  // אם אתה עובד עם SvelteKit, בטל את ההערה בשורה הבאה:
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang';

  // 1. הגדרת טקסטים מורחבת
  const t = {
    he: {
      titleSEO: '1❤1 - המדריך המלא ליצירה משותפת והוגנת',
      descSEO:
        'גלו כיצד להקים שותפויות שקופות, לחלק רווחים לפי תרומה ולעבוד יחד בראש שקט.',
      brand: '1❤1 — ליצור יחד, בהסכמה',
      subtitle: 'הדרך החדשה להקים עסק, ליצור יחד ולהרוויח בהוגנות',
      ctaPrimary: 'התחילו ליצור יחד',
      ctaSecondary: 'איך זה עובד?',
      whatTitle: 'מה זה 1❤1?',
      whatText:
        'מערכת שמאפשרת ליזמים, פרילנסרים ושכירים ליצור שותפויות שקופות — לעבוד יחד על משימות ומוצרים, ולחלוק רווחים לפי תרומה אמיתית.',
      whyTitle: 'למה זה טוב?',
      whyItems: [
        '🚀 ליזמים: הקמת צוות ללא צורך בהשקעה ראשונית גדולה',
        '💎 לפרילנסרים: הופכים לשותפים ומרוויחים מהצלחת המוצר',
        '⚖️ שקיפות מלאה: פנקס משותף ושיטת חלוקה הוגנת ואוטומטית'
      ],
      howTitle: 'איך זה עובד?',
      steps: [
        {
          title: '1. יוצרים רקמה',
          desc: 'מגדירים משימות, כישורים ומשאבים נדרשים.'
        },
        {
          title: '2. מגייסים שותפים',
          desc: 'מזמינים משתתפים מתאימים לפי כישוריהם.'
        },
        {
          title: '3. מנהלים ושקיפות',
          desc: 'משא ומתן מובנה + פנקס שמציג את כל התרומות.'
        },
        {
          title: '4. מייצרים ומוכרים',
          desc: 'דף נחיתה לכל רקמה — לקוחות מזמינים.'
        },
        {
          title: '5. מחלקים רווחים',
          desc: 'החלוקה מתבצעת לפי השיטה הייחודית שלנו.'
        }
      ],
      exampleTitle: 'דוגמה אמיתית',
      exampleText:
        'קבוצות פיתוח, הרכבי מוזיקה ומיזמים חברתיים כבר משתמשים בכלי כדי לחלק הכנסות בשקיפות.',
      footerCTA: 'מוכנים לשינוי? ההרשמה חינם.'
    },
    en: {
      brand: '1❤1 — Create Together, With Agreement',
      subtitle: 'The new way to start a business, collaborate and earn fairly',
      ctaPrimary: 'Start creating together',
      ctaSecondary: 'Join a team that fits you',
      whatTitle: 'What is 1❤1?',
      whatText:
        'A platform that lets founders, freelancers and employees form transparent partnerships — collaborate on tasks and products, and split profits according to real contribution.',
      whyTitle: 'Why use it?',
      whyItems: [
        'Founders: form a team instead of searching for investors and employees',
        'Employees/Freelancers: gain equity and profit share instead of one‑time pay',
        'Transparency: shared ledger and fair-split method'
      ],
      howTitle: 'How it works',
      steps: [
        {
          title: 'Create a team',
          desc: 'Define tasks, skills and needed resources.'
        },
        {
          title: 'Recruit partners',
          desc: 'Invite contributors with matching skills.'
        },
        {
          title: 'Manage transparently',
          desc: 'Built-in negotiation + shared ledger of contributions.'
        },
        {
          title: 'Build & sell',
          desc: 'Each team gets a landing page to sell products.'
        },
        {
          title: 'Share revenue',
          desc: 'Revenue is split using our unique contribution-based method.'
        }
      ],
      exampleTitle: 'Real example',
      exampleText:
        'Several groups already use the tool to create, collaborate and split revenue transparently.',
      footerCTA: 'Sign up? Start creating together — free registration.'
    },

    ar: {
      brand: '1❤1 — أنشئوا معًا، بالاتفاق',
      subtitle: 'الطريقة الجديدة لبدء مشروع، التعاون والكسب بعدل',
      ctaPrimary: 'ابدأوا الإنشاء معًا',
      ctaSecondary: 'انضم إلى فريق مناسب لك',
      whatTitle: 'ما هو 1❤1؟',
      whatText:
        'منصة تتيح للمؤسسين والمحترفين والموظفين تشكيل شراكات شفافة — التعاون في مهام ومنتجات وتقسيم الأرباح وفقًا للمساهمة الحقيقية.',
      whyTitle: 'لماذا تستخدمها؟',
      whyItems: [
        'المؤسسون: تشكيل فريق دون البحث عن مستثمر وموظفين',
        'الموظفون/المحترفون: الحصول على ملكية وحصة من الأرباح بدلاً من دفعة واحدة',
        'الشفافية: دفتر مشترك وطريقة تقسيم عادلة'
      ],
      howTitle: 'كيف تعمل',
      steps: [
        {
          title: 'أنشئ فريقًا',
          desc: 'حدد المهام والمهارات والموارد المطلوبة.'
        },
        { title: 'استقطاب شركاء', desc: 'دعوة مساهمين بمهارات مناسبة.' },
        {
          title: 'إدارة بشفافية',
          desc: 'تفاوض مدمج + دفتر مشترك يسجل المساهمات.'
        },
        { title: 'الإنشاء والبيع', desc: 'صفحة هبوط لكل فريق لبيع المنتجات.' },
        {
          title: 'تقسيم الإيرادات',
          desc: 'التقسيم يتم وفقًا لطريقة المساهمة الفريدة لدينا.'
        }
      ],
      exampleTitle: 'مثال حقيقي',
      exampleText:
        'تستخدم عدة مجموعات الأداة بالفعل للإنشاء والتعاون وتقسيم الإيرادات بشفافية.',
      footerCTA: 'تسجيل؟ ابدأوا الإنشاء معًا — التسجيل مجاني.'
    }
  };
  // Fallback handling
  let L = $derived(t[$lang] || t.he);
  let isRTL = $derived($lang === 'ar' || $lang === 'he');

  // 2. פונקציונליות "בשרנית" - גלילה חלקה
  function scrollToElement(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // 3. ניהול פעולות חכם
  function onPrimary() {
    // אופציה א': ניווט פנימי ב-SvelteKit
    goto('/');

    // אופציה ג': הפניה חיצונית פשוטה
    // window.location.href = 'https://app.1lev1.com/signup';
  }

  function onSecondary() {
    // גלילה לאזור ההסבר במקום סתם אירוע
    scrollToElement('how-it-works');
  }

  // 4. Schema.org לקידום בגוגל (JSON-LD)
  // זה יוצר "כרטיס ביקור" דיגיטלי למנועי חיפוש
  let jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: '1lev1',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'ILS'
      },
      description: L?.whatText || ''
    })
  );
</script>

<!-- הוספת SEO לראש הדף -->
<svelte:head>
  <title>{L.titleSEO || L.brand}</title>
  <meta name="description" content={L.descSEO || L.subtitle} />
  <!-- Schema for Google -->
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
<section class="p-6 md:p-12" dir={isRTL ? 'rtl' : 'ltr'}>
  <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
    <div class="p-8 gold-bg">
      <div class="flex flex-col md:flex-row items-center gap-6">
        <div class="flex-1">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-800">
            {L.brand}
          </h1>
          <p class="mt-3 text-gray-700">{L.subtitle}</p>
          <div class="mt-6 flex gap-3">
            <button
              onclick={onPrimary}
              class="px-5 py-3 rounded-xl font-semibold shadow-lg"
              style="background:linear-gradient(90deg,#d4b04d,#f7c6b6);"
              >{L.ctaPrimary}</button
            >
            <button
              onclick={onSecondary}
              class="px-4 py-2 rounded-xl border-2 border-pink-300 text-pink-700 font-medium"
              >{L.ctaSecondary}</button
            >
          </div>
        </div>

        <div class="w-full md:w-2/5">
          <div
            class="w-full md:h-48 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 overflow-hidden"
          >
            <img
              src="/diagrem.jpg"
              alt="diagram"
              class="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="p-8">
      <div class="grid md:grid-cols-2 gap-8">
        <div>
          <h2 class="text-2xl font-semibold mb-3">{L.whatTitle}</h2>
          <p class="text-gray-700">{L.whatText}</p>

          <h3 class="mt-6 font-semibold">{L.whyTitle}</h3>
          <ul class="list-disc list-inside mt-2 text-gray-700 space-y-1">
            {#each L.whyItems as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>

        <div>
          <h2 class="text-2xl font-semibold mb-3">{L.howTitle}</h2>
          <ol class="list-decimal list-inside space-y-3 text-gray-700">
            {#each L.steps as s}
              <li>
                <strong class="block">{s.title}</strong>
                <span class="text-sm">{s.desc}</span>
              </li>
            {/each}
          </ol>

          <div class="mt-6 p-4 rounded-lg border border-gray-100 bg-gray-50">
            <h4 class="font-semibold">{L.exampleTitle}</h4>
            <p class="text-sm mt-2">{L.exampleText}</p>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-gray-700 mb-4">{L.footerCTA}</p>
        <div class="flex justify-center gap-4">
          <button
            onclick={onPrimary}
            class="px-6 py-3 rounded-full font-semibold"
            style="background:#d4b04d">{L.ctaPrimary}</button
          >
          <button
            onclick={onSecondary}
            class="px-6 py-3 rounded-full border-2 border-pink-300 text-pink-700"
            >{L.ctaSecondary}</button
          >
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* small helper for gold/pink theme when Tailwind not loaded in preview */
  :global(.gold-bg) {
    background: #eee8aa;
  }
  :global(.pink) {
    color: #ff6f91;
  }
</style>
