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
| PLAN_SHIFTS | P1–P11 ב-commits, סכמת 1.0b ממתינה ל-deploy |
| PLAN_RESOURCE_CALENDAR · PLAN_P2P_PILOT · PLAN_RIKMA_SHARED_INFO (שלב 2) | ממומשים, ממתינים ל-deploy |
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
| HANDOFF_DISTRIBUTED_DB · PLAN_IMPLEMENTATION_ROADMAP · PLAN_user_sovereign_consent · PLAN_serverless_p2p_data · PLAN_rikma_as_state_machine · PLAN_restime_in_signed_chain | השכבה המבוזרת: S1 ו-S2a בנויים, S2b בשער החלטה |
| MIGRATION_TRACKING · PLAN_action_migration_vs_p2p | המיגרציה ל-Action System |
| SPEC_CUSTOM_EMAIL | ה-`NotificationOrchestrator` קיים, חלק מהתבניות עוד נשלחות ישירות |
| FIXES | קובץ ממצאים מתגלגל |
| PRODUCTION_READINESS_REVIEW · QA_SOLO_RIKMA_2026-08 | סקירות עם ממצאים פתוחים |

## tbd/

| מסמך | |
|---|---|
| PLAN_DEADLOCK_PREVENTION | livelock במו"מ + נקודות הסכמה |
| PLAN_MONEY_RAILS | מסילות תשלום (ריבוי מטבעות כבר יצא ממנו ל-done) |
| PLAN_VOLUNTEER_RIKMA | טיוטה |
| PLAN_central_rikma_definition · PLAN_concierge_in_p2p | קונספטואליים, ההמשך של השכבה המבוזרת |
| TIMEGRAMA_REMINDERS | תזכורות R1–R4 |
| SPEC_VOTING_SYSTEM | הוחלף בפועל במודל ה-`Decision` |
| SPEC_SOCKET_REALTIME | presence ואירועי UI חי |
| IMPROVEMENT_POINTS | רשימת שיפורים ישנה |
| PLAN_MARKETING_GLOBAL · PLAN_X_ORGANIC · PLAN_VIDEO_OPENMONTAGE · homepage_&_seo_raw_ideas | שיווק ורעיונות |

## השורש — מדריכים

AGENT_ACTION_MIGRATION_GUIDE · CARD_MODERNIZATION_GUIDE · LEV_CARD_CONVENTIONS ·
HOWTO_ADD_LEV_OBJECT · HOWTO_LEV_QUANTUM_LOADING · HOWTO_SPACE_SYNC ·
MOACH_AI_AGENT_GUIDE · DEPLOY_API_DOCKER · GITHUB_APP_SETUP
