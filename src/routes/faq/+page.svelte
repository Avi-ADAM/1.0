<script>
  import Header from '$lib/components/header/header.svelte';
    import { lang } from '$lib/stores/lang.js'
 const q1 = {"he":"מה זה 1💗1?","en":"What is 1💗1?"}
 const e1 = {"he":"1💗1 היא פלטפורמה שמטרתה ליצור עולם טוב יותר באמצעות הסכמה ושיתוף פעולה. הפלטפורמה מאפשרת למשתמשים להתחבר וליצור 'רקמות' - קבוצות בעלות כישורים ומשאבים משותפים אשר פועלות יחד להגשמת חלומות ויצירת ערך.","en":"1💗1 is a platform that aims to create a better world through collaboration and consensus. The platform allows users to connect and create 'missions' - groups with shared skills and resources that work together to achieve goals and create value."}
 const q2 = {"he":' איך 1💗1 עובדת? ', "en":"how is 1💗1 working?"}
 const e2 = {"he":"המשתמשים ב- 1💗1 מצטרפים ל\"ריקמות\" המורכבות מפרטים בעלי ערכים, מטרות וכישורים משותפים. כל ריקמה פועלת להשגת יעד ספציפי באמצעות שיתוף פעולה, תקשורת פתוחה ומנגנוני קבלת החלטות המבוססים על הסכמה. הרווחים וההכנסות מנוהלים בצורה שקופה ומתחלקים בין חברי הריקמה בהתאם להסכמות ותרומתם.","en":"Users of 1💗1 join \"missions\" with shared values, goals, and skills. Each mission works towards a specific goal through collaboration, open communication, and decision-making mechanisms based on consensus. Profits and revenues are managed transparently and shared among mission members according to their commitments and contributions."}
 const q3 = {"he":'מהי "אמנת החירות העולמית"?', "en":"what is 'worldwide consensus for peace and security'"}
 const e3 = {"he":'"אמנת החירות העולמית" היא הצהרה הקוראת לדחיית אלימות וכפייה כאמצעי לפתרון סכסוכים וקידום אינטרסים. חתימה על אמנה זו מהווה תנאי להצטרפות לפלטפורמת 1💗1 ומסמלת מחויבות להתנהלות המבוססת על דיאלוג, כבוד הדדי והסכמה.',
 "en":" The Worldwide Peace and Security Consensus is a declaration to join the 1💗1 platform and represent commitments to dialog, justice, and consensus."}
 const q4 = {"he":'מהי מטרת "מפת ההסכמה"?',"en":" what is the purpose of the 'consensus map'?"}
 const e4 = {"he":'"מפת ההסכמה" היא ייצוג ויזואלי של כלל המשתמשים ב- 1💗1 אשר חתמו על "אמנת החירות העולמית". מטרת המפה היא להמחיש את היקף התמיכה ברעיון של עולם המבוסס על שלום, שיתוף פעולה והסכמה הדדית.',
 "en":" The purpose of the Consensus Map is to visualize and illustrate the collective support for the world's commitment to peace, collaboration, and consensus."}
 const q5 = {"he":"מהם היתרונות בהצטרפות ל- 1💗1?",
 "en":" What are the benefits of joining 1💗1?"}
 const e5 = {"he":`הצטרפות ל- 1💗1 פותחת דלת לעולם של הזדמנויות חדשות:
 יצירת קשרים: הזדמנות להכיר אנשים בעלי תחומי עניין דומים וליצור שיתופי פעולה פוריים.
 מימוש עצמי: הזדמנות לתרום מכישוריך וניסיונך למען מטרה משותפת ולקבל הכרה ותגמול הוגן.
 השפעה חברתית: הזדמנות לקחת חלק פעיל ביצירת עולם טוב יותר המבוסס על ערכים של שיתוף פעולה, אמפתיה וכבוד הדדי.
 `,"en":` Joining 1💗1 opens doors to new opportunities:
  Connection: Opportunity to meet people with similar interests and form friendships.
 Self-sufficiency: Opportunity to donate your skills and experiences to a shared goal and receive recognition and recognition.
 Social impact: Opportunity to take part in creating a better world based on collaboration, empathy, and justice."}
`}
 const q6 = {"he":"האם השימוש בפלטפורמת 1💗1 כרוך בתשלום?",
 "en":" Is the use of the 1💗1 platform free of charge?"}
 const e6 = {"he":"ההשתתפות בפלטפורמת 1💗1 אינה כרוכה בתשלום קבוע. חברי הריקמה מתחלקים בהכנסות ורווחים בהתאם לתרומתם ובהתבסס על הסכמות מראש.",
 "en":" The use of the 1💗1 platform is not free of charge. Donors contribute and receive rewards based on their contributions and based on the consensus at the beginning."}
 const q7 = {"he":"מהם הכלים והמשאבים הזמינים למשתמשים בפלטפורמה?",
 "en":" What tools and resources are available to users in the platform?"}
 const e7 = {"he":`1💗1 מספקת מגוון כלים ומשאבים המסייעים לתקשורת יעילה, ניהול פרויקטים וקבלת החלטות:
 פנקס דיגיטלי מבוזר: לניהול שקוף של הכספים והמשאבים המשותפים.
מערכת הצבעות ומשא ומתן: לקידום תהליכי קבלת החלטות המבוססים על הסכמה.
כלים לניהול פרויקטים: כגון גרפים, גאנט ולוחות משימות.`,"en":`
1💗1 provides a wide range of tools and resources to support effective communication, project management, and decision-making

Digital Cash Palette: Managing shared funds and resources
Color Palette and Voting System: Supporting decision-making based on consensus
Tools for Project Management: Such as graphs, gauges, and to-do lists.`}
 const q8 = {"he":"כיצד ניתן להצטרף ל- 1💗1?",
 "en":"How can I join 1💗1?"}
 const e8 = {"he":'כדי להצטרף לפלטפורמת 1💗1 יש לחתום על "אמנת החירות העולמית" ולהביע את הסכמתך לעקרונותיה. לאחר מכן, תוכל לחפש "ריקמות" התואמות את תחומי העניין שלך או ליזום הקמת "ריקמה" חדשה משל עצמך.',
 "en":" To join the 1💗1 platform, you need to pledge to the International Pledge. Afterward, you can search for missions that match your interests or create a new mission for yourself."}

</script>
<Header second="/" secondTitle={{"he":"לדף הבית", "en":"to the home page"}}/>


<div class="bg-gold p-6 rounded-lg shadow-lg min-h-screen" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
  <h1 class="text-2xl font-bold text-center mb-4">{ $lang === 'he' ? 'שאלות ותשובות' : 'Questions and Answers' }</h1>
  
  {#each [q1, q2, q3, q4, q5, q6, q7, q8] as question, index}
    <div class="mb-4">
      <h2 class="text-xl font-semibold">{question[$lang]}</h2>
      <p class="text-gray-800">{eval('e' + (index + 1))[$lang]}</p>
    </div>
  {/each}
</div>