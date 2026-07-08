// Self-contained copy for the Quorum landing page (en + he).
// Kept local (not in translations/) so the whole /quorum folder can be
// lifted into the thin standalone repo later with zero wiring.

export const demoOffers = {
  en: [
    { name: 'Weekly organic veggie box', unit: '$24 / week', min: 10, seed: 7 },
    { name: 'Minibus line to the city', unit: '$6 / seat', min: 12, seed: 8 },
    { name: 'Pottery workshop, 6 sessions', unit: '$95', min: 8, seed: 5 },
    { name: 'Neighborhood yoga teacher', unit: '$11 / class', min: 9, seed: 6 }
  ],
  he: [
    { name: 'סל ירקות אורגני שבועי', unit: '90₪ / שבוע', min: 10, seed: 7 },
    { name: 'קו מיניבוס לעיר', unit: '22₪ / מושב', min: 12, seed: 8 },
    { name: 'סדנת קדרות, 6 מפגשים', unit: '350₪', min: 8, seed: 5 },
    { name: 'מורת יוגה שכונתית', unit: '40₪ / שיעור', min: 9, seed: 6 }
  ],
  ar: [
    { name: 'صندوق خضار عضوي أسبوعي', unit: '90₪ / أسبوع', min: 10, seed: 7 },
    { name: 'خط حافلة صغيرة إلى المدينة', unit: '22₪ / مقعد', min: 12, seed: 8 },
    { name: 'ورشة فخّار، 6 لقاءات', unit: '350₪', min: 8, seed: 5 },
    { name: 'مُدرّسة يوغا للحيّ', unit: '40₪ / حصة', min: 9, seed: 6 }
  ],
  ru: [
    { name: 'Еженедельный ящик органических овощей', unit: '90₪ / неделя', min: 10, seed: 7 },
    { name: 'Маршрут микроавтобуса в город', unit: '22₪ / место', min: 12, seed: 8 },
    { name: 'Гончарная мастерская, 6 занятий', unit: '350₪', min: 8, seed: 5 },
    { name: 'Районный преподаватель йоги', unit: '40₪ / занятие', min: 9, seed: 6 }
  ]
};

export const copy = {
  en: {
    dir: 'ltr',
    metaTitle: 'Quorum — group buying, without the group chat',
    metaDesc:
      'Some things only exist when enough people want them. Quorum gathers the demand: you sign only for yourself, and it happens only when enough sign too.',
    eyebrow: 'QUORUM',
    byline: 'by 1💗1',
    h1a: 'Group buying,',
    h1b: 'without the group chat.',
    sub: 'A farm box, a minibus line, a workshop — some things only exist when enough people want them. Quorum gathers that demand. You sign only for yourself. It happens only when enough sign too.',
    ctaDemand: 'See live demand',
    ctaSupply: 'I have something to offer',
    signed: 'signed',
    daysLeft: 'days left',
    activated: 'Activated!',
    activatedSub: 'personal deals created — no committee required.',
    principlesTitle: 'We removed the group from group buying',
    principles: [
      {
        t: 'Zero group decisions',
        d: 'The supplier defines the offer. You pick your own options. Nothing — nothing — is put to a vote.'
      },
      {
        t: 'You sign only for yourself',
        d: 'One personal deal between you and the supplier. No shared wallet, no splitting bills with strangers.'
      },
      {
        t: 'All or nothing',
        d: 'Deals activate together, atomically, only when the threshold is met. Below it, nobody owes anything.'
      },
      {
        t: 'Quiet expiry',
        d: 'If it doesn’t ripen — nothing happens. No guilt, no fallout. The demand keeps gathering for next time.'
      }
    ],
    howTitle: 'How it works',
    how: [
      {
        t: 'Find your pool',
        d: 'People near you (or online) already want the same thing. Join with one tap — it’s interest, not commitment.'
      },
      {
        t: 'Sign the offer you like',
        d: 'A supplier posts a concrete offer: price, terms, minimum, deadline. Signing creates your own personal deal — pending.'
      },
      {
        t: 'Quorum reached → it’s on',
        d: 'The moment enough people sign, all deals activate at once. Everyone gets exactly what they signed for.'
      }
    ],
    wishTitle: 'Can’t find it? Wish it.',
    wishDesc:
      'Describe what you want in your own words. The concierge breaks it into real tasks and resources — live, as you type — finds matching people and makers nearby, and assembles them into one plan. And if others are wishing for the same thing, you become a pool.',
    wishCta: 'Open a wish',
    wishDemoLabel: 'A wish, as you type it',
    wishDemoText:
      '“A day off for my mom — a spa treatment, a good meal, a babysitter for the kids, and someone to drive her there…”',
    wishChips: ['🧸 Babysitter · 6h', '🚗 Ride there & back', '💆 Spa · 2h', '🍽 Dinner for two'],
    wishCoverage: 'matched from people nearby',
    wishOnePlan: 'One wish → four providers → one plan. You approve, they weave.',
    supTitle: 'Suppliers: open it only when it’s worth opening',
    supDesc:
      'Publish a threshold offer — “I’ll run it if 10 sign by Thursday.” Share the link with your audience. Quorum arrives? You start with a full house, everyone already signed. It doesn’t? It cost you nothing.',
    supCta: 'Publish a threshold offer',
    supNote: 'Free for suppliers. Your audience stays yours.',
    footA: 'Quorum is the front door of',
    footB: '1💗1 — a platform for partnerships that run on consent.',
    footCta: 'Explore the platform'
  },
  he: {
    dir: 'rtl',
    metaTitle: 'קוורום — קנייה קבוצתית, בלי הקבוצה',
    metaDesc:
      'יש דברים שקיימים רק כשמספיק אנשים רוצים אותם. קוורום מאגד את הביקוש: חותמים רק בשם עצמכם, וזה קורה רק אם נחתם מספיק.',
    eyebrow: 'קוורום',
    byline: 'מבית 1💗1',
    h1a: 'קנייה קבוצתית,',
    h1b: 'בלי הקבוצה.',
    sub: 'סל ירקות, קו הסעה, סדנה — יש דברים שקיימים רק כשמספיק אנשים רוצים אותם. קוורום מאגד את הביקוש הזה. חותמים רק בשם עצמכם, וזה יוצא לדרך רק כשמספיק חתמו גם.',
    ctaDemand: 'לביקוש החי',
    ctaSupply: 'יש לי מה להציע',
    signed: 'חתמו',
    daysLeft: 'ימים נותרו',
    activated: 'יצא לדרך!',
    activatedSub: 'עסקאות אישיות נוצרו — בלי ועד, בלי אסיפה.',
    principlesTitle: 'הוצאנו את הקבוצה מהקנייה הקבוצתית',
    principles: [
      {
        t: 'אפס החלטות משותפות',
        d: 'הספק מגדיר את ההצעה. אתם בוחרים אופציות אישיות. שום דבר — שום דבר — לא עולה להצבעה.'
      },
      {
        t: 'חותמים רק בשם עצמכם',
        d: 'עסקה אישית אחת בינכם לבין הספק. אין קופה משותפת, אין התחשבנות עם זרים.'
      },
      {
        t: 'הכל או כלום',
        d: 'העסקאות מופעלות יחד, אטומית, רק כשהסף הושג. מתחתיו — אף אחד לא חייב כלום.'
      },
      {
        t: 'פקיעה שקטה',
        d: 'לא הבשיל? לא קרה כלום. בלי אשמה, בלי דרמה. הביקוש ממשיך להצטבר לפעם הבאה.'
      }
    ],
    howTitle: 'איך זה עובד',
    how: [
      {
        t: 'מוצאים את המאגד שלכם',
        d: 'אנשים לידכם (או אונליין) כבר רוצים את אותו הדבר. מצטרפים בלחיצה — זה עניין, לא התחייבות.'
      },
      {
        t: 'חותמים על ההצעה שמתאימה',
        d: 'ספק מפרסם הצעה קונקרטית: מחיר, תנאים, מינימום, דדליין. חתימה יוצרת עסקה אישית שלכם — ממתינה.'
      },
      {
        t: 'הסף הושג ← יוצאים לדרך',
        d: 'ברגע שמספיק חתמו, כל העסקאות מופעלות בבת אחת. כל אחד מקבל בדיוק את מה שהוא חתם עליו.'
      }
    ],
    wishTitle: 'לא מצאתם? תבקשו.',
    wishDesc:
      'תארו מה אתם רוצים במילים שלכם. הקונסיירז׳ מפרק את זה למשימות ומשאבים אמיתיים — חי, תוך כדי כתיבה — מאתר אנשים ויוצרים מתאימים בסביבה, ומרכיב מהם תכנית אחת. ואם עוד אנשים מבקשים את אותו הדבר — נהייתם מאגד.',
    wishCta: 'לפתוח משאלה',
    wishDemoLabel: 'משאלה, תוך כדי כתיבה',
    wishDemoText:
      '"יום חופש לאמא שלי — טיפול ספא, ארוחה טובה, בייביסיטר לילדים, ומישהו שיסיע אותה…"',
    wishChips: ['🧸 בייביסיטר · 6ש׳', '🚗 הסעה הלוך-חזור', '💆 ספא · 2ש׳', '🍽 ארוחה זוגית'],
    wishCoverage: 'הותאמו מאנשים בסביבה',
    wishOnePlan: 'משאלה אחת ← ארבעה ספקים ← תכנית אחת. אתם מאשרים, הם רוקמים.',
    supTitle: 'ספקים: תפתחו את זה רק כשמשתלם לפתוח',
    supDesc:
      'פרסמו הצעת-סף — "אני פותח אם 10 יחתמו עד חמישי". שתפו את הלינק עם הקהל שלכם. הגיע קוורום? אתם מתחילים עם אולם מלא, כולם כבר חתומים. לא הגיע? לא עלה לכם כלום.',
    supCta: 'לפרסם הצעת-סף',
    supNote: 'חינם לספקים. הקהל שלכם נשאר שלכם.',
    footA: 'קוורום הוא דלת הכניסה של',
    footB: '1💗1 — פלטפורמה לשותפויות שפועלות בהסכמה.',
    footCta: 'להכיר את הפלטפורמה'
  },
  ar: {
    dir: 'rtl',
    metaTitle: 'كوورَم — شراء جماعي، بدون المجموعة',
    metaDesc:
      'بعض الأشياء لا توجد إلا عندما يريدها عدد كافٍ من الناس. كوورَم يجمع الطلب: توقّع باسمك أنت فقط، ويتحقّق الأمر فقط عندما يوقّع عدد كافٍ أيضاً.',
    eyebrow: 'كوورَم',
    byline: 'من 1💗1',
    h1a: 'شراء جماعي،',
    h1b: 'بدون المجموعة.',
    sub: 'صندوق مزرعة، خط حافلة صغيرة، ورشة — بعض الأشياء لا توجد إلا عندما يريدها عدد كافٍ من الناس. كوورَم يجمع هذا الطلب. توقّع باسمك أنت فقط، ويخرج إلى النور فقط عندما يوقّع عدد كافٍ أيضاً.',
    ctaDemand: 'شاهد الطلب الحيّ',
    ctaSupply: 'لديّ ما أقدّمه',
    signed: 'وقّعوا',
    daysLeft: 'أيام متبقية',
    activated: 'انطلق!',
    activatedSub: 'صفقات شخصية أُنشئت — بلا لجنة ولا اجتماع.',
    principlesTitle: 'أخرجنا المجموعة من الشراء الجماعي',
    principles: [
      {
        t: 'صفر قرارات مشتركة',
        d: 'المورّد يحدّد العرض. أنت تختار خياراتك الشخصية. لا شيء — لا شيء — يُطرح للتصويت.'
      },
      {
        t: 'توقّع باسمك أنت فقط',
        d: 'صفقة شخصية واحدة بينك وبين المورّد. لا صندوق مشترك، ولا تقاسم فواتير مع غرباء.'
      },
      {
        t: 'الكل أو لا شيء',
        d: 'تُفعَّل الصفقات معاً، دفعة واحدة، فقط عند بلوغ الحدّ الأدنى. دونه — لا أحد مدين بشيء.'
      },
      {
        t: 'انتهاء هادئ',
        d: 'لم ينضج؟ لم يحدث شيء. بلا ذنب ولا دراما. يبقى الطلب يتجمّع للمرة القادمة.'
      }
    ],
    howTitle: 'كيف يعمل',
    how: [
      {
        t: 'اعثر على مجمّعك',
        d: 'أناس قربك (أو عبر الإنترنت) يريدون الشيء نفسه بالفعل. انضمّ بنقرة واحدة — إنه اهتمام، لا التزام.'
      },
      {
        t: 'وقّع على العرض الذي يناسبك',
        d: 'يَنشر مورّد عرضاً ملموساً: سعر، شروط، حدّ أدنى، موعد نهائي. التوقيع يُنشئ صفقتك الشخصية — قيد الانتظار.'
      },
      {
        t: 'بلغ الحدّ ← انطلقنا',
        d: 'لحظة توقيع عدد كافٍ، تُفعَّل كل الصفقات دفعة واحدة. كلٌّ يحصل تماماً على ما وقّع عليه.'
      }
    ],
    wishTitle: 'لم تجده؟ تمنّاه.',
    wishDesc:
      'صِف ما تريده بكلماتك. الكونسيرج يفكّكه إلى مهام وموارد حقيقية — حيّاً، أثناء كتابتك — يعثر على أناس وصنّاع مناسبين قربك، ويجمعهم في خطة واحدة. وإن تمنّى آخرون الشيء نفسه — صرتم مجمّعاً.',
    wishCta: 'افتح أمنية',
    wishDemoLabel: 'أمنية، أثناء كتابتها',
    wishDemoText:
      '«يوم إجازة لأمي — جلسة سبا، وجبة طيّبة، جليسة أطفال، ومن يوصلها إلى هناك…»',
    wishChips: ['🧸 جليسة أطفال · 6س', '🚗 توصيل ذهاباً وإياباً', '💆 سبا · ساعتان', '🍽 عشاء لشخصين'],
    wishCoverage: 'مطابَقة من أناس قربك',
    wishOnePlan: 'أمنية واحدة ← أربعة مزوّدين ← خطة واحدة. أنت تصادق، وهم ينسجون.',
    supTitle: 'المورّدون: افتحوه فقط حين يستحقّ الفتح',
    supDesc:
      'انشر عرض-عتبة — «أشغّله إذا وقّع 10 حتى الخميس». شارك الرابط مع جمهورك. حضر الكوورَم؟ تبدأ بقاعة ممتلئة، الجميع وقّعوا بالفعل. لم يحضر؟ لم يكلّفك شيئاً.',
    supCta: 'انشر عرض-عتبة',
    supNote: 'مجّاني للمورّدين. جمهورك يبقى لك.',
    footA: 'كوورَم هو باب الدخول إلى',
    footB: '1💗1 — منصّة لشراكات تعمل بالتراضي.',
    footCta: 'تعرّف على المنصّة'
  },
  ru: {
    dir: 'ltr',
    metaTitle: 'Кворум — групповая покупка, без группового чата',
    metaDesc:
      'Некоторые вещи существуют, только когда их хочет достаточно людей. Кворум собирает спрос: вы подписываетесь только за себя, и это происходит, только когда подпишется достаточно других.',
    eyebrow: 'КВОРУМ',
    byline: 'от 1💗1',
    h1a: 'Групповая покупка,',
    h1b: 'без группового чата.',
    sub: 'Ящик с фермы, маршрут микроавтобуса, мастер-класс — некоторые вещи существуют, только когда их хочет достаточно людей. Кворум собирает этот спрос. Вы подписываетесь только за себя. И это происходит, только когда подпишется достаточно других.',
    ctaDemand: 'Смотреть живой спрос',
    ctaSupply: 'Мне есть что предложить',
    signed: 'подписались',
    daysLeft: 'дней осталось',
    activated: 'Запущено!',
    activatedSub: 'личные сделки созданы — без комитета.',
    principlesTitle: 'Мы убрали группу из групповой покупки',
    principles: [
      {
        t: 'Ноль групповых решений',
        d: 'Поставщик определяет предложение. Вы выбираете свои опции. Ничто — ничто — не выносится на голосование.'
      },
      {
        t: 'Вы подписываетесь только за себя',
        d: 'Одна личная сделка между вами и поставщиком. Ни общего кошелька, ни дележа счетов с незнакомцами.'
      },
      {
        t: 'Всё или ничего',
        d: 'Сделки активируются вместе, разом, только когда достигнут порог. Ниже него — никто ничего не должен.'
      },
      {
        t: 'Тихое истечение',
        d: 'Не созрело — ничего не произошло. Без вины, без последствий. Спрос продолжает копиться к следующему разу.'
      }
    ],
    howTitle: 'Как это работает',
    how: [
      {
        t: 'Найдите свой пул',
        d: 'Люди рядом с вами (или онлайн) уже хотят того же самого. Присоединяйтесь в одно касание — это интерес, а не обязательство.'
      },
      {
        t: 'Подпишите понравившееся предложение',
        d: 'Поставщик публикует конкретное предложение: цена, условия, минимум, срок. Подпись создаёт вашу личную сделку — в ожидании.'
      },
      {
        t: 'Кворум набран → всё запускается',
        d: 'Как только подпишется достаточно людей, все сделки активируются разом. Каждый получает ровно то, за что подписался.'
      }
    ],
    wishTitle: 'Не нашли? Пожелайте.',
    wishDesc:
      'Опишите, что вы хотите, своими словами. Консьерж раскладывает это на реальные задачи и ресурсы — вживую, пока вы печатаете — находит подходящих людей и мастеров рядом и собирает их в один план. А если того же желают другие — вы становитесь пулом.',
    wishCta: 'Открыть желание',
    wishDemoLabel: 'Желание, пока вы его печатаете',
    wishDemoText:
      '«Выходной для моей мамы — процедура в спа, хороший обед, няня для детей и кто-то, кто её отвезёт…»',
    wishChips: ['🧸 Няня · 6ч', '🚗 Дорога туда и обратно', '💆 Спа · 2ч', '🍽 Ужин на двоих'],
    wishCoverage: 'подобрано из людей поблизости',
    wishOnePlan: 'Одно желание → четыре исполнителя → один план. Вы одобряете, они сплетают.',
    supTitle: 'Поставщикам: открывайте, только когда это того стоит',
    supDesc:
      'Опубликуйте пороговое предложение — «Запущу, если 10 подпишутся до четверга». Поделитесь ссылкой со своей аудиторией. Кворум набран? Вы стартуете с полным залом, все уже подписаны. Нет? Это ничего вам не стоило.',
    supCta: 'Опубликовать пороговое предложение',
    supNote: 'Бесплатно для поставщиков. Ваша аудитория остаётся вашей.',
    footA: 'Кворум — это парадная дверь',
    footB: '1💗1 — платформы для партнёрств, работающих на согласии.',
    footCta: 'Исследовать платформу'
  }
};
