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
  }
};
