# docs — מפת המסמכים

המסמכים ממוינים לפי **מצב המימוש בקוד**, לא לפי תאריך:

| תיקייה | מה נכנס אליה |
|---|---|
| [`done/`](./done) | התכנית בנויה. מה שנשאר, אם בכלל, הוא ערך סביבה או שורת "עבודה עתידית" שאף אחד לא עובד עליה. המסמך נשאר כתיעוד של *מה* נבנה ו*למה*. |
| [`inprogress/`](./inprogress) | בנוי חלקית, **או בנוי וממתין ל-deploy / בדיקת עשן**, או מסמך מעקב פתוח (FIXES, מעקב מיגרציה, סקירות עם ממצאים פתוחים). |
| [`tbd/`](./tbd) | תכנון, אסטרטגיה או רעיונות שלא התחילו בקוד. |
| השורש (`docs/`) | מדריכים קבועים — איך עושים משהו במערכת הקיימת. אין להם "סוף". |

**כשמצב משתנה — מזיזים את הקובץ** (`git mv docs/inprogress/X.md docs/done/X.md`) ומעדכנים
את ההפניות: `grep -rn "docs/inprogress/X.md"` בקוד, ב-`CLAUDE.md` ובמסמכים האחרים.

---

## done/

| מסמך | הערה |
|---|---|
| PLAN_API_PERMISSIONS | שכבת ה-authz הסטטית, `AUTHZ_MODE=enforce` כברירת מחדל |
| PLAN_PROXY_SECURITY | הושלם ונאכף בפרודקשן (2026-09-02) |
| PLAN_CHAT_MEMORY · PLAN_MASTRA_STORAGE | מיושמים (2026-08) |
| PLAN_MATCH_SUGGESTIONS | המלצות לב מחושבות מראש בשרת |
| PLAN_MISSION_EQUITY_PREVIEW | כל השלבים |
| PLAN_MISSION_AI | כל המשימות ✅ |
| PLAN_SITE_SHARE · PLAN_SITE_SHARE_PER_MEMBER · SITE_SHARE_TRANSFER_SPEC · PLAN_MOACH_SITE_SHARE_DISPLAY | §3–§6 של SITE_SHARE הוחלפו במודל הפר-חבר |
| PLAN_STIPEND | M1–M5 |
| PLAN_sale_holder_consent | `saleClaim` |
| PLAN_OBJECT_ARCHIVAL | נבדק עם שני משתמשים (QA_TWO_MEMBER) |
| PLAN_NEGOTIATION_CANDIDATES · parcer | `parcer.md` הוא עותק משובש (עברית הפוכה) של טבלת המסלולים — מועמד למחיקה |
| PLAN_EXTERNAL_SALES_API · PLAN_EXTERNAL_TASKS_API | `/api/v1/sales`, `/api/v1/tasks` |
| PLAN_MULTI_CURRENCY | C0–C7 (C7 חלקי: חלק מהמחרוזות) |
| PLAN_MCP_OAUTH · PLAN_MCP_SKILL | ה-OAuth בפרודקשן; ה-skill בנוי |
| PLAN_DISCOVERY_MAP · PLAN_HUB_LEV_DEMAND_SYNC · PLAN_LOCATION_MAPS | `/demand`, MapLibre, LocationPicker |
| PLAN_central_page | `/hub` |
| PLAN_DEMO_SIGNUP | |
| PLAN_RECURRING_SALES · PLAN_SALE_CUSTOMER_LINK | ל-SALE_CUSTOMER_LINK יש סעיף "עבודה עתידית" (בקשת תשלום) |
| PLAN_COMPLEX_PRODUCTS · PLAN_USER_OFFERINGS · PLAN_ONBOARDING | |
| PLAN_PROJECT_PLANNING_BOARDS | |
| PLAN_CONCIERGE | ההמשכים ב-`inprogress/PLAN_CONCIERGE_LOCAL_PROVIDERS` ו-`inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES` |
| PLAN_T10_COMPACTION | ✔ לפי HANDOFF_DISTRIBUTED_DB |
| MOACH_MIGRATION_PLAN | `/moach/[projectId]/…` |
| STRAPI_TEXT_TRANSLATION_SETUP | |
| VOCAB_UNIFIED | `VocabSelector` |
| REMOTION_PROMO_PLAN · PROMO2 · PROMO3 | הסצנות ב-`remotion/src/scenes*` |
| QA_NEW_USER_WALKTHROUGH_2026-08 · QA_TWO_MEMBER_2026-08 | דוחות QA שהליקויים בהם טופלו |

## inprogress/

| מסמך | מה נשאר |
|---|---|
| PLAN_AI_SIGNUP_CONCIERGE | בנוי (M0–M13), ממתין ל-deploy ובדיקת עשן |
| PLAN_LEV_TIMESTAMPS | T1–T2 בנויים (`formatWhen` + `<When>`, `when` על 10 סוגים שהתאריך כבר מגיע אליהם); T3 שאילתות לסוגים החסרים, T4 סבב אחרון, T5 מיון — פתוחים |
| PLAN_SHIFTS | P1–P11 ב-commits, סכמת 1.0b ממתינה ל-deploy |
| PLAN_RIKMA_SUBDOMAINS | S0 (כתובת `/r/<slug>`) ו-S1 (מראה מובנה לדף הציבורי + עורך ב-`/moach/<id>/look`) בנויים, ממתינים ל-deploy של 1.0b (שדות בלבד, בלי הרשאות חדשות); S2 סאב-דומיין, S3–S4 פתוחים |
| PLAN_RESOURCE_CALENDAR · PLAN_P2P_PILOT · PLAN_RIKMA_SHARED_INFO (שלב 2) | ממומשים, ממתינים ל-deploy. שלב 3 של SHARED_INFO (כספת E2E ב-`vault:<pid>`) בנוי וכבוי מאחורי `VAULT_ENABLED` |
| PLAN_CODE_RIKMA | S0–S4 חלקי, S6 חלקי |
| PLAN_UGC_TRANSLATION | P4 (משטחים ציבוריים) |
| PLAN_TIMEGRAMA | שלבים 0, 1, 4 הושלמו; השאר פתוח |
| PLAN_DAILY_DIGEST | היסודות בנויים |
| PLAN_LEV_COINS | שלבים 6–7 |
| PLAN_MCP_TOOLS_V2 | P8 (`publishWish` + עדכון ה-skill) |
| PLAN_SELF_NOMINATION | מומש חלקית |
| PLAN_NEGOTIATION_POLARITY | שלב 3 ⏳ |
| PLAN_CONCIERGE_LOCAL_PROVIDERS | פערי P2/P3 ב-§5 |
| PLAN_CONCIERGE_EXTERNAL_SOURCES | E0–E2 בנויים מאחורי `CONCIERGE_EXTERNAL` (כבוי); E3–E5 ובדיקת תנאי Google פתוחים |
| PLAN_HOMEPAGE_MASTER · PLAN_HOMEPAGE_SECTIONS · PLAN_SITE_ARCHITECTURE_FROM_ZERO | שלב א' בוצע, השאר פתוח |
| PLAN_SHARED_PURCHASE | ה-maagad בנוי, הצעות-סף עוד לא |
| PLAN_TAURI_MOBILE | מעטפת לאתר החי; ה-SPA כמסלול המשך |
| PLAN_AI_ERA | מסמך-על, חלקו בוצע |
| **PLAN_DISTRIBUTED_EXECUTION** | **נקודת הכניסה לשכבה המבוזרת**: תור משימות מסודר (S2b חי, הקשחת פורמט, עמידות קוונטית, Tauri, Rust) + פרוטוקול לסוכן — "קרא ופעל לפי §0, תקדם את המשימה הבאה" |
| HANDOFF_DISTRIBUTED_DB · PLAN_IMPLEMENTATION_ROADMAP · PLAN_user_sovereign_consent · PLAN_serverless_p2p_data · PLAN_rikma_as_state_machine · PLAN_restime_in_signed_chain | השכבה המבוזרת: S1 ו-S2a בנויים, S2b בשער החלטה. ליבת Rust/WASM: R0 (מפרט + vectors) בנוי; R1/R2 מתוזמנים ל-SPA של Tauri ול-S3b (HANDOFF §8) |
| PLAN_T9_SOCIAL_RECOVERY | T9a (`epoch.grant` + ריפוי) ו-T9b (אפוטרופסים, חלון מחאה 24ש', UI ב-`/me/settings/recovery`) בנויים, ממתינים לדיפלוי; T9c נדחה |
| PLAN_STRAPI5_UPGRADE | P0 (4.26.2) מוכן ב-`1.0b`, ממתין ל-commit ו-deploy; P1 spikes פתוחים |
| MIGRATION_TRACKING · PLAN_action_migration_vs_p2p | המיגרציה ל-Action System |
| SPEC_CUSTOM_EMAIL | ה-`NotificationOrchestrator` קיים, חלק מהתבניות עוד נשלחות ישירות |
| FIXES | קובץ ממצאים מתגלגל |
| PRODUCTION_READINESS_REVIEW · QA_SOLO_RIKMA_2026-08 | סקירות עם ממצאים פתוחים |
| QA_CONCIERGE_E2E_2026-10 | תכנית בדיקה מקצה לקצה של הקונסיירז' לפני השקה + ממצאים (בריצה) |
| PLAN_DIRECT_OFFER | הצעה אישית (ספק כותב משאלה בשם לקוחה, והיא מקבלת אותה בקישור) + איחוד מסכי גיבוש · אישור · ביצוע. P1 (רצועת שלבי העסקה בשלושת המסכים) בנוי; P2+ ממתינים לסכמה ב-1.0b |
| PLAN_REALTIME_MIGRATION · REALTIME_TRACKING | כל שינוי מגיע לכל מסך שמציג אותו + לאן התראה לבני אדם יוצאת (`intent`). R0–R6 בנויים (2026-10-11): כל action מצהיר scopes, כל הדפים מקשיבים ל-bus, המאזינים הישנים ונתיבי ההתראה הישנים (N7) הוסרו. N5 (הודעה על הבשלה בשתיקה) ו-B9 בתוך הריפו (כתיבות `/api/send` ⇒ actions) בנויים. 2026-10-12: N3 (אין יותר ערוצים שנבחרים ביד), N4 (רשימת נמענים חסרה = אף אחד) ו-B14 סגורים. נשארו הריפואים החיצוניים (magik-meetings, consensus1lev1), הבדיקה החיה, ו-N6/N8/N9/N13 ששייכים לתכניות אחרות (SMART_NOTICES, "אין לא מוחלט") |
| SPEC_SOCKET_REALTIME | presence / "מי עובד" / typing / "השתנה בזמן שערכת" — כל השלבים בנויים (2026-10-12), ממתין לפריסה: 1.0b (`User.hidePresence`) → socket-server → אפליקציה, ו-`P2P_TICKET_SECRET` בשני הצדדים |
| PLAN_SMART_NOTICES | התראות חכמות: שלבים 0–5 בנויים (שרת, משפטים, פעמוני קונסיירז' ו-deals, hub, תצוגת התראות בלב); ההסתרה ממתינה לדיפלוי 1.0b + הרשאות; שלב 6 (ערוצים) ו-7 פתוחים |
| PLAN_SHOP_CUSTOMER_EXPERIENCE | חנות לקונים דרך ה-API: וריאנטים, גלריה, זמינות, והזמנה ששולמה שמדווחת מהשרת של האתר (MVP: מחיר קבוע, קונה אנונימי, בלי אישור ידני). S1 (סכמה) נפרסה ו-S2 (קריאה) בנוי; תיקוני §6.9 בענף של 1.0b ממתינים לפריסה; S3–S6 (הזמנות, עורך וריאנטים, מסך מכירות מתקדם, תבנית פתיחה) פתוחים |
| PLAN_POOL_PRODUCT | מוצר מורכב שנמכר במאגד: צורת עלות לכל שורת BOM (לכל משתתפת / משותף / מדרגות), מחיר צף עם תקרה וחלון "לא מתאים" במקום מחיר חתום, ממתינות / מימון הפרש למצטרפת שמייקרת, החזרים, ביצוע אחד ליציאה, שורה "לפי עלות בפועל" עם קבלה. P0–P2 בנויים 2026-10-13 (הסכמה ב-1.0b נפרסה, עקומת המחיר, הצעת מאגד מתוך מוצר עם תקרה); הבא: P3, תמחור צף וחלון "לא מתאים" |

## tbd/

| מסמך | |
|---|---|
| PLAN_HEADLESS_PRODUCTS_API | מוצרים כ-API: מה חסר כדי שרקמה תנהל קטלוג ותצרוך אותו מהאתר שלה (הכתובת היא הרקמה — `/api/v1/r/{rikma}/…`). השוואה ל-Payload CMS, פערים מדורגים (P0–P2), חוזה API מוצע, טיוטת [OpenAPI](./api/rikma-v1.openapi.yaml) לכל משטח הרקמה (כולל יישור sales/tasks לכתובת הרקמה, §5.8), ונספח §11: המחיר אינו סופי ומכירה מייצרת עבודה לחברי הרקמה (מודעות בלבד, לא חוסם MVP) |
| PLAN_TAURI_WINDOWS | תוכנה ל-Windows מאותה מעטפת Tauri: חלון, אופליין, קישורים חיצוניים, updater, מתקין NSIS/MSI, CI. דף `/download` כבר בנוי ומחכה ל-`DESKTOP_RELEASE_MANIFEST_URL` |
| PLAN_DEADLOCK_PREVENTION | livelock במו"מ + נקודות הסכמה |
| PLAN_MONEY_RAILS | מסילות תשלום (ריבוי מטבעות כבר יצא ממנו ל-done) |
| PLAN_SHARE_BASIS_HOURS_VS_PRICE | שווי שותפות: שעות שאושרו מול המחיר שסוכם (QA C-14). החלטת ביניים: לפי שעות; מוצע `valueBasis` לכל משימה |
| PLAN_TIMER_SESSION_NEGOTIATION | מו"מ על מקטעי זמן של טיימר: שלב 1 (טקסט — סימון מקטעים במחלוקת) בקוד; שלב 2 = הצעה מובנית לכל מקטע |
| PLAN_SERIES_RIKMA | סדרה כרקמה שיתופית: שווי שעה במו"מ לכל משימה (לא תעריפון), זכויות ברקמה, חלוקה לפי יצירה (עונה/פרק) במקום לפי כל הרקמה, מנדט מואצל לסט, כסף מהכיס כהחזר או כתרומה |
| PLAN_VOLUNTEER_RIKMA | טיוטה |
| UX_COPY_SHOP_SALES | נוסח מסך המכירות והמסך המתקדם (S4–S5 של PLAN_SHOP_CUSTOMER_EXPERIENCE): אוצר מילים, מפתחות `shop.*` בעברית ובאנגלית, סטטוסים לפי "מה נשאר לעשות", חסר במלאי, מחיר שממתין לאישור, הנחיות לוקליזציה, וההכרעות: מספר הזמנה של האתר, ביטול רק למי שהכסף אצלו, סף מלאי נמוך לכל מוצר, התראה בלי כרטיס לב ב-MVP |
| PLAN_central_rikma_definition · PLAN_concierge_in_p2p | קונספטואליים, ההמשך של השכבה המבוזרת |
| TIMEGRAMA_REMINDERS | תזכורות R1–R4 |
| SPEC_VOTING_SYSTEM | הוחלף בפועל במודל ה-`Decision` |
| IMPROVEMENT_POINTS | רשימת שיפורים ישנה |
| PLAN_MARKETING_GLOBAL · PLAN_X_ORGANIC · PLAN_VIDEO_OPENMONTAGE · homepage_&_seo_raw_ideas | שיווק ורעיונות |

## השורש — מדריכים

AGENT_ACTION_MIGRATION_GUIDE · CARD_MODERNIZATION_GUIDE · LEV_CARD_CONVENTIONS ·
HOWTO_ADD_LEV_OBJECT · HOWTO_LEV_QUANTUM_LOADING · HOWTO_SPACE_SYNC ·
MOACH_AI_AGENT_GUIDE · DEPLOY_API_DOCKER · GITHUB_APP_SETUP

**מפרטים נורמטיביים** — SPEC_CONSENT_FORMAT: פורמט הבייטים החתום של השכבה
המבוזרת (JSON קנוני, חתימות, projection, state root, הצפנה). החוזה עצמו הוא
ה-vectors ב-[`spec/consent-v1/`](../spec/consent-v1), שכל מימוש (היום TS, בעתיד
ליבת Rust/WASM) חייב לשחזר; `npm run vectors:consent` מייצר אותם מחדש.
