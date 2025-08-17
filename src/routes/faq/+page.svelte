<script>
    import { lang } from '$lib/stores/lang.js';

 const q1 = {"he":"מה זה 1💗1?","en":"What is 1💗1?"}
 const e1 = {"he":"1💗1 היא פלטפורמה שמטרתה ליצור עולם טוב יותר באמצעות הסכמה ושיתוף פעולה. הפלטפורמה מאפשרת למשתמשים להתחבר וליצור 'רקמות' - קבוצות בעלות כישורים ומשאבים משותפים אשר פועלות יחד להגשמת חלומות ויצירת ערך.","en":"1💗1 is a platform that aims to create a better world through collaboration and consensus. The platform allows users to connect and create 'missions' - groups with shared skills and resources that work together to achieve goals and create value."}
 const q2 = {"he":' איך 1💗1 עובדת? ', "en":"how is 1💗1 working?"}
 const e2 = {"he":"המשתמשים ב- 1💗1 מצטרפים ל\"ריקמות\" המורכבות מפרטים בעלי ערכים, מטרות וכישורים משותפים. כל ריקמה פועלת להשגת יעד ספציפי באמצעות שיתוף פעולה, תקשורת פתוחה ומנגנוני קבלת החלטות המבוססים על הסכמה. הרווחים וההכנסות מנוהלים בצורה שקופה ומתחלקים בין חברי הריקמה בהתאם להסכמות ותרומתם.","en":"Users of 1💗1 join \"missions\" with shared values, goals, and skills. Each mission works towards a specific goal through collaboration, open communication, and decision-making mechanisms based on consensus. Profits and revenues are managed transparently and shared among mission members according to their commitments and contributions."}
 const q3 = {"he":'מהי "הסכמה עולמית על חירות"?', "en":"what is 'worldwide consensus for peace and security'"}
 const e3 = {"he":'"אמנת החירות העולמית" היא הצהרה הקוראת לדחיית אלימות וכפייה כאמצעי לפתרון סכסוכים וקידום אינטרסים. חתימה על אמנה זו מהווה תנאי להצטרפות לפלטפורמת 1💗1 ומסמלת מחויבות להתנהלות המבוססת על דיאלוג, כבוד הדדי והסכמה.',"en":""}
 const q4 = {"he":'מהי מטרת "מפת ההסכמה"?',"en":""}
 const e4 = {"he":'"מפת ההסכמה" היא ייצוג ויזואלי של כלל המשתמשים ב- 1💗1 אשר חתמו על "אמנת החירות העולמית". מטרת המפה היא להמחיש את היקף התמיכה ברעיון של עולם המבוסס על שלום, שיתוף פעולה והסכמה הדדית.',"en":""}
 const q5 = {"he":"מהם היתרונות בהצטרפות ל- 1💗1?","en":""}
 const e5 = {"he":`הצטרפות ל- 1💗1 פותחת דלת לעולם של הזדמנויות חדשות:
 יצירת קשרים: הזדמנות להכיר אנשים בעלי תחומי עניין דומים וליצור שיתופי פעולה פוריים.
 מימוש עצמי: הזדמנות לתרום מכישוריך וניסיונך למען מטרה משותפת ולקבל הכרה ותגמול הוגן.
 השפעה חברתית: הזדמנות לקחת חלק פעיל ביצירת עולם טוב יותר המבוסס על ערכים של שיתוף פעולה, אמפתיה וכבוד הדדי.
 `,"en":""}
 const q6 = {"he":"האם השימוש בפלטפורמת 1💗1 כרוך בתשלום?","en":""}
 const e6 = {"he":"ההשתתפות בפלטפורמת 1💗1 אינה כרוכה בתשלום קבוע. חברי הריקמה מתחלקים בהכנסות ורווחים בהתאם לתרומתם ובהתבסס על הסכמות מראש.","en":""}
 const q7 = {"he":"מהם הכלים והמשאבים הזמינים למשתמשים בפלטפורמה?","en":""}
 const e7 = {"he":`1💗1 מספקת מגוון כלים ומשאבים המסייעים לתקשורת יעילה, ניהול פרויקטים וקבלת החלטות:
 פנקס דיגיטלי מבוזר: לניהול שקוף של הכספים והמשאבים המשותפים.
מערכת הצבעות ומשא ומתן: לקידום תהליכי קבלת החלטות המבוססים על הסכמה.
כלים לניהול פרויקטים: כגון גרפים, גאנט ולוחות משימות.`,"en":""}
 const q8 = {"he":"כיצד ניתן להצטרף ל- 1💗1?","en":""}
 const e8 = {"he":'כדי להצטרף לפלטפורמת 1💗1 יש להסכים על "הסכמה עולמית על חירות". לאחר מכן, תוכל לחפש "ריקמות" התואמות את תחומי העניין שלך או ליזום הקמת "ריקמה" חדשה משל עצמך.',"en":""}
const questions = [
  { q: q1, a: e1 },
  { q: q2, a: e2 },
  { q: q3, a: e3 },
  { q: q4, a: e4 },
  { q: q5, a: e5 },
  { q: q6, a: e6 },
  { q: q7, a: e7 },
  { q: q8, a: e8 },
];
</script>
<div class="faq-container" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
  <h1>{$lang === 'he' ? 'שאלות ותשובות נפוצות' : 'Frequently Asked Questions'}</h1>
  
  <div class="faq-list">
    {#each questions as { q, a }}
      {#if q[$lang] && a[$lang]} <!-- Only show if translation exists -->
        <div class="faq-item">
          <h2 class="question">{q[$lang]}</h2>
          <div class="answer">{@html a[$lang].split('\n').join('<br>')}</div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .faq-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .faq-item {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .question {
    color: #2a2a2a;
    font-size: 1.2rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .answer {
    color: #444;
    line-height: 1.6;
  }
  
  /* RTL specific styles */
  :global([dir="rtl"]) .faq-item {
    text-align: right;
  }

  :global([dir="ltr"]) .faq-item {
    text-align: left;
  }
</style>