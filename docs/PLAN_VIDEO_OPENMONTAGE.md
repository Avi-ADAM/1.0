# תכנית: וידאו שיווקי עם Remotion + OpenMontage

> מסמך תכנון בלבד. נכתב: 2026-07-06.
> משלים את [PLAN_MARKETING_GLOBAL.md](./PLAN_MARKETING_GLOBAL.md) §6.2 ("מפעל הווידאו") ואת
> תכניות ה-Remotion הקיימות ([REMOTION_PROMO_PLAN](./REMOTION_PROMO_PLAN.md), PROMO2, PROMO3).
> המטרה: לעבור מ"סרטון פרומו שמפיקים ידנית" ל**קו ייצור אג'נטי** שמפיק סרטון שיווקי בשעות,
> לא בימים — והפיילוט הוא סרטון הטריז של **קוורום** (מאגד + קונסיירז').

---

## 1. מה זה OpenMontage ולמה הוא מתאים לנו

[OpenMontage](https://github.com/calesthio/OpenMontage) היא מערכת הפקת וידאו **אג'נטית**
בקוד פתוח: 12 pipelines, ‏52 כלים, מאות agent-skills שהופכים את Claude Code לאולפן הפקה.
הסוכן קורא מניפסטים (YAML) וסקילים (Markdown), מריץ כלי Python, ומנהל את כל השרשרת:
**מחקר → treatment לאישור → תסריט → תכנון סצנות → נכסים (תמונות/קריינות/מוזיקה) →
עריכה → קומפוזיציה → self-review → MP4**. יש שערי אישור יצירתיים — אנחנו מאשרים, הוא מבצע.

למה זה נכון לנו במיוחד:

1. **מנוע הקומפוזיציה הוא Remotion** — בדיוק הסטאק שכבר יש לנו ב-[`/remotion`](../remotion):
   theme.ts עם טוקני מותג חיים, קומפוננטות משותפות, ו-4 פרומואים עם ~30 סצנות מוכנות
   לשימוש חוזר. OpenMontage יודע לקבל קומפוננטות React קיימות בשלב תכנון הסצנות.
2. **מסלול אפס-עלות אמיתי**: Piper TTS (אופליין, חינם) + רינדור Remotion + FFmpeg + פוטג'
   חינמי — בלי אף API בתשלום. עקבי עם עקרון האפס-ממומן של תכנית השיווק.
3. **Localization pipeline מובנה** — דיבוב וכתוביות רב-לשוני. אנחנו צריכים en/he/ar/ru,
   וזה בדיוק ה-pipeline השמיני.
4. **תוכן מדאטה**: כמו שכתבנו ב-PLAN_MARKETING_GLOBAL §6.2 — סרטוני "המאגד הופעל" נוצרים
   מ-props. קו ייצור אג'נטי הופך את זה משאיפה לפקודה אחת.

מקורות: [ריפו OpenMontage](https://github.com/calesthio/OpenMontage) ·
[מדריך התקנה](https://knightli.com/en/2026/06/22/openmontage-ai-video-production-guide/) ·
[סקירת Pinggy](https://pinggy.io/blog/openmontage_agentic_video_production/)

---

## 2. מה כבר יש לנו (המלאי לשימוש חוזר)

| נכס | איפה | שימוש בסרטון החדש |
| --- | --- | --- |
| טוקני מותג (זהב gra/grb/grc, ורוד, ירוק, navy, Rubik) | `remotion/src/theme.ts` | חובה — כל סצנה חדשה צורכת מכאן |
| קומפוננטות משותפות (טרנזישנים, טקסט, כרטיסים) | `remotion/src/components.tsx` | בסיס לסצנות החדשות |
| Promo3 — סצנות קונסיירז' (CreateWish, Matching, ProviderSide, Fulfilled) | `remotion/src/scenes3/` | סקשן הקונסיירז' של הסרטון — כמעט מוכן |
| Promo4 — סצנות demand-first (S5_DemandFirst, S6_Circle) | `remotion/src/scenes4/` | חומר גלם לסקשן המאגד |
| עמוד `/quorum` החדש (טבעת הקוורום החיה + כרטיס ההצעה + דמו החילוץ) | `src/routes/quorum/` | **הכוכב** — הקלטות מסך של הדמו הרץ הן ה-visual הראשי |
| מפת הביקוש `/demand` | `src/routes/(regandnon)/demand/` | הקלטת מסך: "הביקוש כבר שם" |
| 3 פורמטים מקומפוזיציה אחת (16:9 / 9:16 / 1:1) | `remotion/src/Root.tsx` | קיים — נשמר |

> חסר במלאי (נכסים חדשים שהסרטון ידרוש): הקלטות מסך נקיות (§5.4), voice-over,
> ומוזיקת רקע. את שלושתם OpenMontage מייצר/מאתר בעצמו.

---

## 3. ארכיטקטורת האינטגרציה

**OpenMontage לא נכנס לריפו 1.0.** הוא מערכת Python+Node עצמאית שחיה ליד הפרויקטים:

```
~/studio/OpenMontage/          ← clone של המערכת (הכלים, ה-pipelines, ה-skills)
~/studio/OpenMontage/projects/ ← כל סרטון = פרויקט (תסריט, נכסים, checkpoints, renders)
/home/.../1.0/remotion/        ← נשאר מקור האמת לסצנות/theme של המותג
```

חיבור בין השניים:

1. **Theme bridge** — בשלב תכנון הסצנות מפנים את הסוכן ל-`1.0/remotion/src/theme.ts`
   ול-`components.tsx`; מגדירים playbook סגנון ב-`styles/` של OpenMontage ("1lev1 brand")
   שמצטט את הטוקנים, כך שכל treatment עתידי נפתח כבר בשפה שלנו.
2. **סצנות קיימות** — קומפוננטות מ-`scenes3/`/`scenes4/` מועתקות/מיובאות ל-composer של
   הפרויקט לפי הצורך (הן React טהור — עוברות כמו שהן, עם עדכון imports).
3. **תוצרים חוזרים** — סצנות חדשות וטובות שנוצרות בהפקה מוחזרות ל-`1.0/remotion/src/`
   בקומיט, כדי שהמלאי יגדל מסרטון לסרטון.

---

## 4. התקנה (פעם אחת)

דרישות: Python 3.10+, Node 18+, FFmpeg.

```bash
git clone https://github.com/calesthio/OpenMontage.git && cd OpenMontage
make setup            # venv + pip deps + npm i ב-remotion-composer + piper-tts + .env
make demo             # בדיקת עשן: מרנדר סרטוני דמו בלי אף API key
python -m backlot open  # לוח ההפקה החי (סטטוס, שערי אישור)
```

ללא Make (Windows): ליצור venv, `pip install -r requirements.txt`,
`cd remotion-composer && npm install`, `pip install piper-tts`, `cp .env.example .env`.

מפתחות אופציונליים ב-`.env` (לא חובה): ElevenLabs/Google/OpenAI TTS, Suno למוזיקה.
**מתחילים בלי כלום** — Piper + סטוק חינמי (Pixabay אוטומטי) מספיקים לפיילוט.

העבודה עצמה: פותחים את תיקיית OpenMontage ב-Claude Code (יש שם `CLAUDE.md` שמכוון את
הסוכן ל-`AGENT_GUIDE.md`), ומנסחים בקשה — למשל: *"Make a 60-second explainer for Quorum
using the brief in projects/quorum-wedge/brief.md"*. הסוכן מציע treatment, עוצר לאישורים,
ומרנדר ל-`projects/<name>/renders/final.mp4`.

---

## 5. הפיילוט: סרטון הטריז — "Quorum"

### 5.1 בחירת pipeline

**Hybrid**: שילוב **Screen Demo** (הקלטות מסך אמיתיות של `/quorum`, `/demand`,
`/wish/new`) עם **Animated Explainer** (סצנות Remotion ממותגות למכניקה ולמסרים).
מוצר אמיתי על המסך = אמינות; אנימציה = בהירות המכניקה. זה גם ה-pipeline שממחזר
הכי הרבה מהמלאי הקיים.

### 5.2 מפרט

| | |
| --- | --- |
| אורך | 60 שניות (גרסת master); גזירה ל-30s ול-15s hook לאחר האישור |
| פורמטים | 16:9 (יוטיוב/אתר), 9:16 (Shorts/Reels/TikTok), 1:1 (פיד) — מאותו מקור |
| שפה ראשית | **אנגלית** (גלובלי-תחילה, לפי האסטרטגיה); עברית מיד אחריה דרך Localization pipeline |
| קריינות | Piper (חינם, אופליין) לאנגלית; לעברית — Google TTS או הקלטה עצמית (ראה §6) |
| כתוביות | word-by-word (סגנון TikTok, מובנה ב-composer) — רוב הצפייה בלי סאונד |
| מוזיקה | סטוק חינמי (Pixabay אוטומטי) — חם, אופטימי, בילדאפ לקראת ההפעלה |
| מסר-על | "Group buying, without the group chat" — אותו קופי כמו עמוד `/quorum` (עקביות!) |

### 5.3 תסריט וסצנות (treatment לאישור מול הסוכן)

| # | זמן | סצנה | ויז'ואל | VO (en) |
| --- | --- | --- | --- | --- |
| 1 | 0–5s | **Hook** | טבעת הקוורום מ-`/quorum` (הקלטת מסך של ההירו): כדורים נכנסים לטבעת | "Some things only exist when enough people want them." |
| 2 | 5–14s | **הבעיה** | אנימציה: בועות צ'אט קבוצתי נערמות לכאוס, נצבעות אדום, קורסות | "A farm box. A minibus line. A workshop. One person isn't enough — and the group chat? It ends in arguments." |
| 3 | 14–28s | **המכניקה** | כרטיס ההצעה החי (הקלטה): 7/10 → 10/10 → "Activated!"; חותמת "you sign only for yourself" | "Quorum gathers the demand. You sign only for yourself. Nothing happens until enough people sign too — then every deal activates at once." |
| 4 | 28–40s | **קונסיירז'** | הקלטת מסך: כתיבת משאלה ב-`/wish/new` + צ'יפים קופצים (החילוץ החי); רה-יוז מ-scenes3 (S2_CreateWish, S4_Matching) | "Can't find it? Wish it. Describe it in your own words — and watch it become real tasks, real people, one plan." |
| 5 | 40–50s | **ספקים** | אנימציה: ספקית מפרסמת "I'll open it if 10 sign", לינק משותף, אולם מתמלא | "Suppliers — open it only when it's worth opening. Share the link. Full house, or a free walk-away." |
| 6 | 50–60s | **CTA** | מפת `/demand` חיה → לוגו קוורום ♥ 1lev1, URL | "The demand is already there. Come see it. Quorum — by 1lev1." → `1lev1.com/quorum` |

עוגן רגשי אחד לאורך כל הסרטון: **בר ההתקדמות**. הוא מופיע בכל סצנה בצורה אחרת
(טבעת, מד, אולם שמתמלא) ומתמלא במלואו רק ב-CTA — הצופה "משלים את הקוורום" בעצמו.

### 5.4 נכסים להכין לפני ההרצה (היחידים שידניים)

- [ ] הקלטות מסך 1080p+ נקיות (בלי bookmarks/דבאג): הירו `/quorum` (לולאה מלאה אחת של
      הדמו כולל ה-Activated), דמו החילוץ בגלילה, `/wish/new` עם הקלדה אמיתית, מפת `/demand`.
      טיפ: לצלם ב-devtools device-mode גם 9:16 כדי שהפורמט האנכי לא יהיה crop עצלן.
- [ ] `brief.md` בתיקיית הפרויקט: הקופי מ-`src/routes/quorum/copy.js` (en) + טבלת §5.3 +
      הפניות ל-theme.ts. הסוכן עובד הכי טוב כשה-brief מצביע על מקורות אמת.
- [ ] לוגו/wordmark "Quorum" (אפשר טיפוגרפי בלבד בשלב זה — Fraunces italic כמו בעמוד).

### 5.5 הרצה

```text
"Read projects/quorum-wedge/brief.md. Propose a treatment for a 60s hybrid
 (screen-demo + animated explainer) video. Use the 1lev1 style playbook,
 reuse scenes from the referenced Remotion project where possible.
 Piper TTS, free stock music. Stop for my approval at treatment,
 script, and scene plan."
```

מאשרים בשלושת השערים → רינדור → `projects/quorum-wedge/renders/final.mp4` →
self-review של הסוכן → צפייה שלנו (checklist §7) → גזירת 30s/15s.

---

## 6. לוקליזציה (he/ar/ru)

- **Pipeline ייעודי:** Localization & Dub — מקבל את ה-master האנגלי, מייצר דיבוב+כתוביות.
- **עברית/ערבית:** איכות TTS חינמית בעברית עדיין לא אחידה — שלוש אופציות לפי סדר העדפה:
  (1) הקלטה עצמית של הקריינות (60 שניות — זול, אותנטי, והקול של המייסד הוא נכס
  building-in-public); (2) Google TTS (יש עברית וערבית); (3) ElevenLabs אם נפתח תקציב.
- **RTL:** הכתוביות והכיתובים בעברית/ערבית דורשים בדיקת כיווניות ב-composer — הקופי
  הדו-לשוני כבר קיים ב-`copy.js`, אותם מפתחות בדיוק.
- סדר: en (master) → he → ru/ar לפי ביקוש. כל גרסה = פרויקט-בת שמפנה לאותם נכסים.

---

## 7. Checklist איכות לפני פרסום

- [ ] מותג: צבעים מ-theme.ts בלבד; Rubik/Fraunces; בלי סטוק-לוק גנרי בסצנות אנימציה.
- [ ] קופי זהה מילה-במילה לעמוד `/quorum` (עקביות מסר בכל הטאצ'פוינטים).
- [ ] נצפה בלי סאונד? (כתוביות word-by-word בכל הסצנות, המסר עובר גם על mute).
- [ ] 3 השניות הראשונות עומדות לבד כ-hook (בפורמט 9:16 זה כל מה שרוב הצופים יראו).
- [ ] CTA קריא: URL על המסך ≥ 3 שניות, גם ב-1:1.
- [ ] הקלטות המסך ללא מידע אישי/דמו-דאטה מביך.
- [ ] רישיונות: מוזיקה/פוטג' חינמיים מתועדים ב-`projects/*/assets/credits.md`.

---

## 8. מעבר מפיילוט לקו ייצור (הקשר לאסטרטגיה §6.2)

אחרי שהפיילוט עובר מקצה-לקצה, מקבעים **שלוש תבניות-פרויקט** ב-OpenMontage, אחת לכל
סוג תוכן מהאסטרטגיה — כך ש"סרטון חדש" הוא brief של 10 דקות + הרצה:

| תבנית | קלט | תדירות | pipeline |
| --- | --- | --- | --- |
| **Feature short** (30–45s) | פיצ'ר/עיקרון אחד + הקלטת מסך | 2 בשבוע | Screen Demo |
| **Case study mini-doc** (60–90s) | סיפור white-glove אמיתי + מספרים | לכל קייס | Documentary Montage |
| **Pool activated** (15s, data-driven) | props: שם המאגד, N חתומים, ימים לסף | אוטומטי לכל הפעלה | Clip Factory + Remotion props |

תבנית "Pool activated" היא ההצטלבות עם המוצר: בהמשך, hook על `activateMaagadOffer`
יוכל להזין את ה-props ולהפיק את סרטון החגיגה שהחברים משתפים — הלולאה הויראלית
ומפעל התוכן נפגשים.

---

## 9. אבני דרך

| # | תוצר נבדק | הערכה |
| --- | --- | --- |
| V0 | OpenMontage מותקן, `make demo` עובר, style playbook "1lev1" מוגדר | חצי יום |
| V1 | נכסי §5.4 מוכנים (הקלטות מסך + brief) | חצי יום |
| V2 | **master אנגלי 60s** מרונדר ומאושר (כולל 9:16, 1:1) | יום־יומיים |
| V3 | גרסת עברית + גזירות 30s/15s | חצי יום |
| V4 | פרסום: עמוד `/quorum` (embed), יוטיוב, Shorts/Reels/TikTok, פוסט building-in-public על התהליך עצמו ("הפקנו את הסרטון עם סוכן") — התהליך הוא סיפור בפני עצמו | — |
| V5 | שלוש תבניות קו-הייצור (§8) מקובעות | אחרי V4 |

> הערה: סצנות חדשות שנוצרות ב-V2 ושוות שימור — להחזיר בקומיט ל-`remotion/src/`
> (למשל כ-`scenes5/` + `Promo5.tsx` ב-Root), כדי שהמלאי ימשיך לגדול.
