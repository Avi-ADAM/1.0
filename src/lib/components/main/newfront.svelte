<script>
  import { locale } from '$lib/translations';
  import { AnimatedHeadline } from 'svelte-animated-headline';
  import { goto } from '$app/navigation';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import { Canvas } from '@threlte/core';
  import Scene from '$lib/components/Scene.svelte';
  import ResizeHandler from '$lib/components/ResizeHandler.svelte';
  import { useProgress } from '@threlte/extras';
  import CircleProgresBar from '$lib/celim/ui/circleProgresBar.svelte';
  import { lang, langUs, doesLang } from '$lib/stores/lang';
  const { progress } = useProgress();
  const url = 'https://1lev1.com/';
  const title = '1️💗1️';
  const setitle = {
    he: 'ליצור מציאות חדשה, יחד',
    en: 'Creating a new reality, together',
    ar: 'خلق واقع جديد، معًا'
  }; //"טעם לחיים!"
  function change(lan) {
    if (lan == 'en') {
      doesLang.set(true);
      langUs.set('en');
      lang.set('en');
      locale.set('en');
      document.cookie =
        `lang=${$lang}; expires=` + new Date(2027, 0, 1).toUTCString();
    } else if (lan == 'he') {
      doesLang.set(true);
      langUs.set('he');
      lang.set('he');
      locale.set('he');
      document.cookie =
        `lang=${$lang}; expires=` + new Date(2027, 0, 1).toUTCString();
    } else if (lan == 'ar') {
      doesLang.set(true);
      langUs.set('ar');
      lang.set('ar');
      locale.set('ar');
      document.cookie =
        `lang=${$lang}; expires=` + new Date(2027, 0, 1).toUTCString();
    }
    trans = false;
  }
  const changel = {
    en: 'English',
    he: 'עברית',
    ar: 'العربية'
  };
  const desc = {
    he: ['חיבור מתוך חירות', 'שותפות מתוך הסכמה', 'עשייה מתוך חיבור'],
    en: [
      'Connection through freedom',
      'Partnership through agreement',
      'Action through connection'
    ],
    ar: ['اتصال من خلال الحرية', 'شراكة من خلال الاتفاق', 'عمل من خلال القلب']
  };

  const introQuestions = {
    he: {
      q1: 'האם את מרגישה שיש לך מה לתת – אבל לבד זה קשה',
      q2: 'האם אתה יודע שאתה נועד ליותר – אבל מחפש את האנשים הנכונים לצעוד איתם     '
    },
    en: {
      q1: "Do you feel you have something to give – but it's hard alone?",
      q2: "Do you know you're meant for more – but looking for the right people to walk with?"
    },
    ar: {
      q1: 'هل تشعرين أن لديك ما تقدمينه – لكنه صعب بمفردك؟',
      q2: 'هل تعرف أنك مخصص لأكثر من ذلك – لكنك تبحث عن الأشخاص المناسبين للمشي معهم؟'
    }
  };

  const desc2 = {
    he: 'האם את מרגישה שיש לך מה לתת – אבל לבד זה קשה?',
    en: "Do you feel you have something to give – but it's hard alone?",
    ar: 'هل تشعرين أن لديك ما تقدمينه – لكنه صعب بمفردك؟'
  };
  const word1 = {
    he: "הקמת 'ריקמה' – שותפות דינמית ומבוססת ערכים",
    en: "Creating a 'Rikma' – a dynamic, value-based partnership",
    ar: "إنشاء 'ريكما' – شراكة ديناميكية قائمة على القيم"
  };
  const wordNew = {
    he: 'נעים להכיר: 1💗1 – פלטפורמה של שותפות חדשה. כאן, כל אחת היא מלכה. כל אחד הוא מלך. כאן יוצרים יחד – בלי לוותר על העצמאות.',
    en: 'Welcome to 1💗1 – a new partnership platform. Here, every woman is a queen. Every man is a king. Here we create together – without giving up independence.',
    ar: 'مرحبًا بك في 1💗1 – منصة شراكة جديدة. هنا، كل امرأة هي ملكة. كل رجل هو ملك. هنا نخلق معًا – دون التخلي عن الاستقلالية.'
  };

  const word2 = {
    he: 'הצטרפות לריקמות קיימות שמתאימות בדיוק ללוח הזמנים, הכישורים ולתשוקה שלך',
    en: 'Joining existing Rikmas that perfectly match your schedule, skills, and passion',
    ar: 'الانضمام إلى ريكمات موجودة تتطابق تمامًا مع جدولك الزمني ومهاراتك وشغفك'
  };
  const word3 = {
    he: 'הכנסות פאסיביות אמיתיות – רווחים לכל החיים, לפי השקעה, לפי הסכמה',
    en: 'Real passive income – lifetime profits, based on investment, based on agreement',
    ar: 'دخل سلبي حقيقي – أرباح مدى الحياة، بناءً على الاستثمار، بناءً على الاتفاق'
  };
  const word4 = {
    he: 'ניהול משותף: הצבעות, החלטות, תקציבים – בהסכמה מלאה של כל קבוצת השותפות',
    en: 'Shared management: voting, decisions, budgets – with full agreement of the entire partnership group',
    ar: 'إدارة مشتركة: التصويت، القرارات، الميزانيات – بموافقة كاملة من مجموعة الشراكة بأكملها'
  };

  const word5 = {
    he: 'פנקס דיגיטלי מבוזר – שקיפות מלאה, בלי בירוקרטיה',
    en: 'Distributed digital ledger – full transparency, no bureaucracy',
    ar: 'دفتر أستاذ رقمي موزع – شفافية كاملة، بدون بيروقراطية'
  };

  const word6 = {
    he: 'משימות, לוחות, גרפים, בוט בינה מלאכותית עוזר אישי, וכלים נוספים לניהול שיתופי פשוט ויעיל',
    en: 'Tasks, boards, graphs, and additional tools for simple and efficient collaborative management',
    ar: 'مهام، لوحات، رسوم بيانية، وأدوات إضافية لإدارة تعاونية بسيطة وفعالة'
  };

  const word7 = {
    he: 'שיתוף חפצים ושפע בין ריקמות ואנשים – ממחזר, מחבר ומרוויח',
    en: 'Sharing items and abundance between Rikmas and people – recycling, connecting, and earning',
    ar: 'مشاركة العناصر والوفرة بين الريكمات والناس – إعادة التدوير، الاتصال، والكسب'
  };

  const word8 = {
    he: 'רוצה לצעוד איתנו? זה פשוט. עליך להסכים לאמנת החירות העולמית – מסמך של ערכים, לא של חוקים.',
    en: "Want to walk with us? It's simple. You need to agree to the Global Freedom Charter – a document of values, not laws.",
    ar: 'هل تريد المشي معنا؟ الأمر بسيط. عليك الموافقة على ميثاق الحرية العالمي – وثيقة قيم، وليست قوانين.'
  };

  const word9 = {
    he: 'כמתך תופיע במפת ההסכמה ותפתח עבורך את הדרך ליצירת מציאות חדשה',
    en: 'Your agreement will appear on the Agreement Map and open the way for you to create a new reality',
    ar: 'ستظهر موافقتك على خريطة الاتفاق وستفتح لك الطريق لخلق واقع جديد'
  };

  const word10 = {
    he: 'ריקמה היא קבוצה של אנשים בעלי כישורים ומשאבים שונים, היוצרים יחד מוצר או נותנים שירות ומתחלקים ברווחים לפי השקעה יחסית והסכמה',
    en: 'A Rikma is a group of people with different skills and resources, creating together a product or providing a service and sharing profits based on relative investment and agreement',
    ar: 'الريكما هي مجموعة من الأشخاص ذوي المهارات والموارد المختلفة، يخلقون معًا منتجًا أو يقدمون خدمة ويتقاسمون الأرباح بناءً على الاستثمار النسبي والاتفاق'
  };

  const regesh1 = {
    he: '?רוצה להביא משמעות ושמחה לחיים שלך',
    en: 'Want to bring meaning and joy to your life?',
    ar: 'هل تريد إضفاء الدلالة والفرح على حياتك؟'
  };

  const regesh2 = {
    he: '?רוצה לפתוח דלת אל מציאות חדשה',
    en: 'Want to open the door to a new reality?',
    ar: 'هل تريد فتح الباب أمام واقع جديد؟'
  };

  const login = {
    he: 'להתחברות',
    en: 'Login',
    ar: 'تسجيل الدخول'
  };

  const reg = {
    he: 'להסכמה והרשמה',
    en: 'Agreement and Registration',
    ar: 'الموافقة والتسجيل'
  };
  const loadingTitle = {
    he: 'טעינת אלמנט עיצובי תלת מימדי',
    en: 'Loading a three-dimensional design element',
    ar: 'تحميل عنصر تصميم ثلاثي الأبعاد'
  };
  const agree = {
    he: 'רוצה להביא משמעות ושמחה לחיים שלך? רוצה לפתוח דלת אל מציאות חדשה? התחבר/י להסכמה – והירשם/י עכשיו. הסכמתך תופיע ב',
    en: 'Want to bring meaning and joy to your life? Want to open the door to a new reality? Connect to agreement – and register now. Your agreement will appear on the ',
    ar: 'هل تريد إضفاء المعنى والفرح على حياتك؟ هل تريد فتح الباب أمام واقع جديد؟ تواصل مع الاتفاق – وسجل الآن. ستظهر موافقتك على '
  };

  const agree2 = {
    he: 'מפת ההסכמה',
    en: 'Agreement Map',
    ar: 'خريطة الاتفاق'
  };

  const agree3 = {
    he: ' ותפתח עבורך את הדרך ליצירת מציאות חדשה. \n יחד ניצור עולם טוב יותר',
    en: ' and open the way for you to create a new reality. Together we will create a better world',
    ar: ' وستفتح لك الطريق لخلق واقع جديد. معًا سنخلق عالمًا أفضل'
  };

  const statsText = {
    he: {
      currently: 'כרגע יש באתר',
      partnerships: 'רקמות (שותפויות) פעילות',
      members: 'חברים וחברות',
      loading: 'טוען נתונים...'
    },
    en: {
      currently: 'Currently on the site',
      partnerships: 'active partnerships',
      members: 'members',
      loading: 'Loading data...'
    },
    ar: {
      currently: 'حاليًا على الموقع',
      partnerships: 'شراكات نشطة',
      members: 'أعضاء',
      loading: 'تحميل البيانات...'
    }
  };

  const mapa = {
    he: 'מפת ההסכמה',
    ar: 'خريطة الاتفاق',
    en: 'Agreement Map'
  };

  let loading = $state(false);
  let loadinga = $state(false);
  let fi = $state(false);
  let btna = $state(false);
  let btnb = $state(false);
  let trans = $state(false);
  let scrolli = $state(false);

  let w = $state(0),
    h = $state(0);

  $effect(() => {
    if (scrolli) {
      setTimeout(() => (scrolli = false), 1500);
    }
  });

  //רוצה להתפרנס מהתשוקה.אהבה שלך
  //w*1.8 < h ? w : h > 639 ? w*0.8 : h

  import { Head } from 'svead';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';

  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;

  let projectsCount = $state(0);
  let membersCount = $state(0);
  let statsLoaded = $state(false);
  const description = {
    he: '1💗1 הסכמה עולמית על חי | ליצור יחד בהסכמה. לכל 1 יש כישרונות ויכולות ייחודים, לכל 1 יש חלום. ביחד ניתן ליצור כל דבר, לשתף פעולה, לחלום, להעז, להצליח ולהרוויח בגדול.',
    en: '1💗1 WorldWide consensus for Security and Peace | colaboration platform, create together harmoniously | consensus based partnerships manegment platform | we can together',
    ar: '1💗1 اتفاق عالمي للحرية والسلام، منصة تعاون، نخلق معًا بتناغم | نظام إدارة الشراكات القائم على التوافق، يمكننا معًا'
  };
  //To establish consensus for non-violence, To allow a network of harmoneus creation
  const pagetitle = {
    en: '1💗1 | Create together harmoniously | Worldwide Consensus for Freedom',
    he: ' ליצור ביחד בהסכמה | הסכמה עולמית על חירות וביטחון | 1💗1',
    ar: '1💗1 | نخلق معًا بتناغم | اتفاق عالمي للحرية'
  };
  let pageurl = {
    ar: 'https://1lev1.com/ar',
    en: 'https://1lev1.com/en',
    he: 'https://1lev1.com/he'
  };
  let size = $derived({
    width: w < 320 ? w : Math.min(w * 1.15, h * 1.5), // הגבל רוחב לפי יחס גובה
    height: w > 320 ? Math.min(h, w * 0.8) : h / 2 // הגבל גובה לפי יחס רוחב
  });
  $effect(() => {
    console.log(size, h);
  });

  // פונקציה לטעינת נתוני הסטטיסטיקות
  async function loadStats() {
    try {
      // קבלת מספר הפרויקטים
      const projectsResult = await sendToSer(
        {},
        '66getProjectsCount',
        0,
        0,
        true, // isSer = true כדי לאפשר גישה למשתמשים לא רשומים
        fetch
      );

      // קבלת מספר החברים
      const membersResult = await sendToSer(
        {},
        '67getMembersCount',
        0,
        0,
        true, // isSer = true כדי לאפשר גישה למשתמשים לא רשומים
        fetch
      );

      if (projectsResult?.data?.projects?.meta?.pagination?.total) {
        projectsCount = projectsResult.data.projects.meta.pagination.total;
      }

      if (membersResult?.data?.chezins?.meta?.pagination?.total) {
        membersCount = membersResult.data.chezins.meta.pagination.total;
      }

      statsLoaded = true;
    } catch (error) {
      console.error('Error loading stats:', error);
      statsLoaded = true; // עדיין מציינים שהטעינה הסתיימה
    }
  }

  onMount(() => {
    loadStats();
  });
</script>

<Head
  title={pagetitle[$lang]}
  description={description[$lang]}
  {image}
  url={pageurl[$lang]}
/>
<!-- 
	מבנה העמוד הראשי:
	flex-col = במובייל זה עמודה (אחד מתחת לשני).
	md:flex-row = במחשב זה שורה (אחד ליד השני).
	h-screen = גובה מלא של המסך.
	overflow-hidden = מונע גלילה כפולה מיותרת ברמת העמוד.
-->
<div
  class="flex flex-col md:flex-row w-full min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#fff0f5] overflow-x-hidden"
>
  <!-- 
		חלק 1: האנימציה (3D)
		במובייל: h-[45vh] (כמעט חצי מסך עליון).
		במחשב: w-1/2 (חצי רוחב), h-screen (גובה מלא), sticky (נשאר במקום).
		order-1: מופיע ראשון ויזואלית.
	-->
  <div
    class="relative w-full h-[40vh] md:w-1/2 md:h-screen order-1 md:order-2 md:sticky md:top-0 bg-opacity-0"
  >
    <Canvas>
      <Scene />
    </Canvas>
    <!-- אפקט מעבר עדין בין האנימציה לטקסט במובייל -->
    <div
      class="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#fdfbf7] to-transparent md:hidden"
    ></div>
  </div>

  <!-- 
		חלק 2: הטקסט והתוכן (הקוד המקורי שלך)
		במובייל: h-auto (גובה לפי התוכן).
		במחשב: w-1/2 (חצי רוחב), h-screen + overflow-y-auto (נגלל עצמאית).
		order-2: מופיע שני ויזואלית (אחרי האנימציה במובייל, או לפניה ב-RTL במחשב).
		z-10: מוודא שהטקסט מעל אלמנטים צפים אם יש.
	-->
  <div
    class="w-full md:w-1/2 h-auto md:h-screen overflow-y-auto order-2 md:order-1 flex flex-col items-center p-4 relative z-10"
  >
    <!-- כפתורי שפה -->
    <div class="w-full flex justify-between items-center mb-4 px-2">
      {#if trans === false}
        <button onclick={() => (trans = !trans)} class="text-2xl">🌐</button>
      {:else}
        <div
          class="flex gap-2 items-center bg-white/80 p-2 rounded-lg shadow-sm animate-fade-in"
        >
          <button
            onclick={() => (trans = !trans)}
            class="text-barbi hover:text-gold p-0.5 font-bold">X</button
          >
          {#if $lang != 'en'}
            <button
              onclick={() => change('en')}
              title="English"
              class="text-barbi border border-lturk hover:text-gold bg-white text-center hover:bg-gray-50 px-2 py-0.5 rounded text-sm"
              >{changel['en']}</button
            >
          {/if}
          {#if $lang != 'ar'}
            <button
              onclick={() => change('ar')}
              title="Arabic"
              class="text-barbi border border-lturk hover:text-gold bg-white text-center hover:bg-gray-50 px-2 py-0.5 rounded text-sm"
              >{changel['ar']}</button
            >
          {/if}
          {#if $lang != 'he'}
            <button
              onclick={() => change('he')}
              title="Hebrew"
              class="text-barbi border border-lturk hover:text-gold bg-white text-center hover:bg-gray-50 px-2 py-0.5 rounded text-sm"
              >{changel['he']}</button
            >
          {/if}
        </div>
        {#if $lang == 'he'}
          <a href="/about" class="text-sm font-bold text-barbi underline"
            >אודות</a
          >
        {/if}
      {/if}

      <!-- המפה (אם קיימת בקומפוננטה שלך) -->
      {#if mapa && mapa[$lang]}
        {mapa[$lang]}
      {/if}
    </div>

    <!-- תוכן ראשי (מרוכז) -->
    <div
      class="flex flex-col items-center justify-center w-full max-w-md gap-6 mt-4 md:mt-10"
    >
      <!-- לוגו -->
      <img
        src="/logo.png"
        alt="logo"
        class="w-32 h-32 object-contain drop-shadow-md transition-transform hover:scale-105"
      />

      <!-- כותרת -->
      <h1
        class="text-3xl md:text-4xl font-bold text-center text-barbi leading-tight"
      >
        1<span class="text-gold">💗</span>1 <br />
        {setitle[$lang]}
      </h1>

      <!-- שאלות אינטרו -->
      {#if scrolli}
        <div class="text-center animate-pulse text-gold font-bold text-lg">
          ???
        </div>
      {:else}
        <div class="text-center space-y-2 text-gray-700">
          <p>{introQuestions[$lang].q1}</p>
          <p>{introQuestions[$lang].q2}</p>
        </div>
      {/if}

      <!-- סטטיסטיקה -->
      <div
        class="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white w-full"
      >
        {#if statsLoaded}
          <div class="text-center text-sm text-gray-500 mb-4">
            {statsText[$lang].currently}
          </div>
          <div class="flex justify-around items-center">
            <div class="flex flex-col items-center">
              <span class="text-2xl font-bold text-barbi">{projectsCount}</span>
              <span class="text-xs text-gray-600"
                >{statsText[$lang].partnerships}</span
              >
            </div>
            <div class="h-8 w-px bg-gray-300"></div>
            <div class="flex flex-col items-center">
              <span class="text-2xl font-bold text-gold">{membersCount}</span>
              <span class="text-xs text-gray-600"
                >{statsText[$lang].members}</span
              >
            </div>
          </div>
        {:else}
          <div class="text-center text-gray-400 animate-pulse">
            {statsText[$lang].loading}
          </div>
        {/if}
      </div>

      <!-- הסכם וכפתורים -->
      <div class="text-xs text-center text-gray-500 px-4">
        {agree[$lang]} <span class="font-bold">{agree2[$lang]}</span>
        {agree3[$lang]}
      </div>

      <div class="flex flex-col w-full gap-3">
        <!-- כפתור כניסה -->
        <button
          onclick={() => {
            goto('/login');
            loadinga = true;
            fi = true;
          }}
          class="w-full py-3 rounded-full font-bold transition-all duration-300 shadow-md transform hover:-translate-y-1
					{btna
            ? 'bg-gold text-white ring-2 ring-gold/50'
            : 'bg-white text-barbi border-2 border-barbi'}"
          onfocus={() => (btna = true)}
          onmouseover={() => (btna = true)}
          onmouseleave={() => (btna = false)}
        >
          <div class="flex justify-center items-center gap-2">
            {login[$lang]}
            {#if loadinga}
              <div
                class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              ></div>
            {/if}
          </div>
        </button>

        <!-- כפתור הרשמה -->
        <button
          onclick={() => {
            goto(
              $lang == 'he'
                ? '/hascama'
                : $lang == 'ar'
                  ? '/aitifaqia'
                  : '/convention'
            );
            loading = true;
            fi = true;
          }}
          class="w-full py-3 rounded-full font-bold transition-all duration-300 shadow-md transform hover:-translate-y-1
					{btnb
            ? 'bg-gold text-white ring-2 ring-gold/50'
            : 'bg-white text-lturk border-2 border-lturk'}"
          onfocus={() => (btnb = true)}
          onmouseover={() => (btnb = true)}
          onmouseleave={() => (btnb = false)}
        >
          <div class="flex justify-center items-center gap-2">
            {reg[$lang]}
            {#if loading}
              <div
                class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              ></div>
            {/if}
          </div>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- מסך טעינה ראשי (Overlay) -->
{#if $progress < 1}
  <div
    class="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center transition-opacity duration-500"
  >
    <img src="/logo.png" alt="Loading" class="w-24 h-24 mb-4 animate-bounce" />
    <div class="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div
        class="h-full bg-barbi transition-all duration-300"
        style="width: {$progress * 100}%"
      ></div>
    </div>
  </div>
{/if}

<!----
<div
  style="position:absolute ; left: 1%; top: 1%; display: flex; flex-direction: column ; z-index: 699;"
>
  {#if trans === false}
    <button onclick={() => (trans = !trans)}
      ><img
        class="shadow-xl rounded"
        alt="translat-icon-by-barbi"
        src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"
      /></button
    >
  {:else}
    <button
      onclick={() => (trans = !trans)}
      class=" text-barbi hover:text-gold p-0.5"
      ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
        />
      </svg></button
    >
    {#if $lang != 'en'}
      <button
        onclick={() => change('en')}
        title="change language to English"
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        >{changel['en']}</button
      >
    {/if}

    {#if $lang != 'ar'}
      <button
        onclick={() => change('ar')}
        title="change language to Arabic"
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        >{changel['ar']}</button
      >
    {/if}
    {#if $lang != 'he'}
      <button
        onclick={() => change('he')}
        title="change language to Hebrew"
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        >{changel['he']}</button
      >
    {/if}
    {#if $lang == 'he'}
      <a
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        title=" 1💗1 אודות "
        data-sveltekit-prefetch
        href="/about"
      >
        אודות</a
      >
    {/if}
    <a
      class="text-barbi border-2 border-lturk text-bold hover:text-gold text-center bg-gold hover:bg-barbi px-1 py-0.5"
      data-sveltekit-prefetch
      href="/love">{mapa[$lang]}</a
    >
  {/if}
</div>
<div
  dir={$lang === 'he' || $lang == 'ar' ? 'rtl' : 'ltr'}
  class="flex flex-col md:flex-row w-full min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#fff0f5] overflow-x-hidden"
>
  <div
    id="text"
    class="z-10 flex flex-col text-center align-middle justify-center items-center sm:w-1/2 h-2/3 sm:h-screen"
  >
    <img
      src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
      alt="logo"
      class="sm:w-24 mt-2 h-6 w-6 sm:h-24 z-0"
    />

    <div
      dir="ltr"
      style="text-shadow:none;"
      class="pt-2 sm:pt-6 font-bold sm:text-2xl text-xl text-transparent
          bg-clip-text bg-[length:auto_200%] animate-gradienty
          bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]
          flex-wrap flex flex-row"
    >
      <div class="flip">
        <h1
          class="font-bold sm:text-4xl text-2xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
            bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
        >
          1
        </h1>
      </div>
      <div>
        <h1
          class="font-bold mt-2 sm:text-xl text-lg text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
          bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
        >
          💗
        </h1>
      </div>
      <div>
        <h1
          class="font-bold sm:text-4xl text-2xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
            bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
        >
          1
        </h1>
      </div>
    </div>
    <div
      class="overflow-auto d"
      dir={$lang !== 'en' ? 'ltr' : 'rtl'}
      onscroll={() => {
        scrolli = true;
        setTimeout(() => (scrolli = false), 1500);
      }}
    >
      <h2
        class="font-bold mt-3 sm:text-5xl text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx bg-[linear-gradient(to_left,theme(colors.fuchsia.300),theme(colors.sky.400),theme(colors.barbi),theme(colors.mpink),theme(colors.barbi),theme(colors.sky.400),theme(colors.fuchsia.300))] overline decoration-mturk text-xl"
        style="text-shadow:none;"
      >
        {setitle[$lang]}
      </h2>

      <h3
        class="sababa text-2xl sm:text-3xl p-2 px-2 text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx bg-goldGrad"
        style="font-family: Sababa, system-ui;text-shadow:none;"
      >
        <AnimatedHeadline
          texts={desc[$lang]}
          wait={3000}
          fade={500}
          slide={300}
          y={0}
        />
      </h3>

      <div
        class="intro-questions relative bg-gradient-to-r from-[#c67c7f] via-barbi to-[#c67c7f] p-4 my-4 rounded-lg shadow-lg border-2 border-"
      >
        <div class="absolute inset-0 overflow-hidden opacity-10">
          <span class="absolute text-6xl font-bold text-white">?</span>
          <span class="absolute right-0 text-6xl font-bold text-white">?</span>
        </div>
        <p
          class="text-xl sm:text-2xl mb-2 text-white font-semibold relative"
          style="font-family: 'Sababa', sans-serif;"
        >
          {introQuestions[$lang].q1}
        </p>
        <p
          class="text-xl sm:text-2xl text-white font-semibold relative"
          style="font-family: 'Sababa', sans-serif;"
        >
          {introQuestions[$lang].q2}
        </p>
      </div>

      <div dir={$lang == 'en' ? 'ltr' : 'rtl'}>
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={wordNew[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word1[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word2[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word3[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word4[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word5[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word6[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word7[$lang]}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={word8[$lang]}
        />-->
<!-- <Tile bg={"neww"} big={true} sm={true} reverse={true} openi={true} word={word9[$lang]} />-->
<!---   <Tile bg={'gold'} big={true} sm={true} word={word10[$lang]} />-->
<!--<Tile bg={"pink"} big={true} sm={true} word={"<div>"+agree[$lang]+`<a style="color:var(--barbi-pink)" href="./love">`+agree2[$lang]+"</a>"+agree3[$lang]+"</div>"}/>-->
<!---- </div>
      <div
        class="bg-gradient-to-br from-sky-400 via-mturk to-sky-400 px-4 py-3 mt-2 rounded-lg border-2 border-gold shadow-lg"
      >
        {#if statsLoaded}
          <div class="text-center">
            <p class="text-white font-semibold text-lg mb-2" style="font-family: 'Sababa', sans-serif;">
              {statsText[$lang].currently}
            </p>
            <div class="flex justify-center items-center gap-4 flex-wrap">
              <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div class="text-2xl font-bold text-gold">{projectsCount}</div>
                <div class="text-white text-sm">{statsText[$lang].partnerships}</div>
              </div>
              <div class="text-gold text-2xl">•</div>
              <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div class="text-2xl font-bold text-gold">{membersCount}</div>
                <div class="text-white text-sm">{statsText[$lang].members}</div>
              </div>
            </div>
          </div>
        {:else}
          <div class="text-center text-white font-semibold" style="font-family: 'Sababa', sans-serif;">
            {statsText[$lang].loading}
          </div>
        {/if}
      </div>

      <div
        class="bg-gradient-to-br from-[#c67c7f] via-barbi to-[#c67c7f] px-3 py-4 mt-1 border-4 border-spacing-2"
      >
        <h2
          style="text-shadow:none;"
          class="text-bold sm:text-2xl text-xl mx-6 text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]"
        >
          {agree[$lang]}<a
            class="text-gold hover:text-lturk font-bold underline"
            href="/love">{agree2[$lang]}</a
          >
          {agree3[$lang]}
        </h2>
      </div>
    </div>
    <div style="font-family:Gan, Power;" class="flex flex-row">
      <button
        class="transition-all duration-300 flex flex-row text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl"
        onclick={() => {
          goto('/login');
          loadinga = true;
          fi = true;
        }}
        class:button-perl={btna == false}
        class:button-gold={btna == true}
        onfocus={() => (btna = true)}
        onmouseover={() => (btna = true)}
        onmouseleave={() => (btna = false)}
        >{login[$lang]}
        {#if btna == true && loadinga == false}
          <span class="mx-2 mb-0.5"
            ><Arrow
              back={$lang == 'he' || $lang == 'ar' ? false : true}
              height="32"
              color={'var(--gold)'}
              fill="var(--barbi-pink)"
            /></span
          >
        {/if}
        {#if loadinga == true}
          <Lowding width="24px" height="24px" />
        {/if}
      </button>
      <button
        class="transition-all duration-300 text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl flex flex-row"
        onclick={() => {
          goto(
            `${$lang == 'he' ? '/hascama' : $lang == 'ar' ? '/aitifaqia' : '/convention'}`
          );
          loading = true;
          fi = true;
        }}
        class:button-perl={btnb == false}
        class:button-gold={btnb == true}
        onfocus={() => (btnb = true)}
        onmouseover={() => (btnb = true)}
        onmouseleave={() => (btnb = false)}
        >{reg[$lang]}
        {#if btnb == true && loading == false}
          <span class="mx-2 mb-0.5"
            ><Arrow
              back={$lang == 'he' || $lang == 'ar' ? false : true}
              height="32"
              color={'var(--gold)'}
              fill="var(--barbi-pink)"
            /></span
          >
        {/if}
        {#if loading == true}
          <Lowding width="24px" height="24px" />
        {/if}
      </button>
    </div>
  </div>
  <div
    id="levi"
    bind:clientHeight={h}
    bind:clientWidth={w}
    class:flex={$progress == 1}
    class="sm:w-1/2 h-1/3 sm:h-screen z-0 items-center justify-center sm:justify-end"
  >
    {#if $progress < 1}
      <div
        class="w-full h-full sm:h-screen flex flex-col items-center justify-end sm:justify-center"
        title={loadingTitle[$lang]}
      >
        <img
          class="ani"
          src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
          alt="logo"
        />
        <CircleProgresBar progress={$progress} />
      </div>
    {/if}
    <div class=" z-0">-->
<!--- "gold coin" (https://skfb.ly/oyPLs) by alex.yefremov is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).-->
<!---- <Canvas {size}>
        <ResizeHandler {size} />
        <Scene
          {fi}
          {size}
          hover={btna == true || btnb == true ? true : false}
          {scrolli}
        />
      </Canvas>
    </div>
  </div>
</div>-->

<style>
  .sababa > span,
  .sababa > div > span {
    font-family: 'Sababa', system-ui !important;
    text-shadow: none;
  }
  .flip {
    -moz-transform: scale(-1, 1);
    -webkit-transform: scale(-1, 1);
    -o-transform: scale(-1, 1);
    -ms-transform: scale(-1, 1);
    transform: scale(-1, 1);
  }
  img {
    animation: wiggle 2s linear infinite;
    max-height: 25vh;
  }
  @media (min-width: 640px) {
    img {
      animation: wiggle 2s linear infinite;
      max-height: 50vh;
    }
  }

  /* Keyframes */
  @keyframes wiggle {
    0%,
    7% {
      transform: rotateZ(0);
    }
    15% {
      transform: rotateZ(-15deg);
    }
    20% {
      transform: rotateZ(10deg);
    }
    25% {
      transform: rotateZ(-10deg);
    }
    30% {
      transform: rotateZ(6deg);
    }
    35% {
      transform: rotateZ(-4deg);
    }
    40%,
    100% {
      transform: rotateZ(0);
    }
  }
</style>
