# PLAN — כלי MCP לניהול חנות: מוצרים, מלאי והזמנות (Docs Customer Plan → Shop MCP)

> נכתב: 2026-10-18. משלים את [PLAN_SHOP_CUSTOMER_EXPERIENCE](./PLAN_SHOP_CUSTOMER_EXPERIENCE.md) ואת [PLAN_MCP_TOOLS_V2](./PLAN_MCP_TOOLS_V2.md).
> מקור הבקשה: "ראה את כלי ה-MCP בפרויקט ואת התוכנית שבתיקיית docs (תוכנית customer משהו כזה) — תיצור כלי MCP לניהול מלאי, יצירת מוצרים וכל מה שקשור בניהול חנות".

## 0. תקציר

התוכנית האם היא **PLAN_SHOP_CUSTOMER_EXPERIENCE** (שכבת החנות לצרכן חיצוני: וריאנטים SKU, גלריה 12 תמונות, זמינות, בקשת-רכש vs. הזמנה ששולמה, סל, webhooks). רוב ה-API לצרכן כבר חי (S2+S3: `shop.ts` הטהור, DTO מורחב, `POST /orders` מהשרת, `variantId/orderId` ב-`createSale`, scopes `orders:*`).

מה שהיה חסר: **צד המוכר דרך ה-MCP** — כלומר Claude (או כל סוכן חיצוני) שמנהל עבור חבר רקמה את מה שהמוכר עושה היום במסכי `moach/[projectId]/sales/*` (S5): לראות מה על המדף, להוסיף מוצר, לעדכן מלאי, לראות/לקדם הזמנות.

המסמך הזה מגדיר 12 כלי MCP שנסגרו ב-2026-10-18 (`src/mastra/tools/shopTools.ts` + `src/lib/server/mcp/{toolManifest,instructions}.ts`).

---

## 1. מיפוי: מה בתוכנית → מה בכלי

| צורך בתוכנית (§) | מה במוכר היום | כלי MCP חדש | tier |
|---|---|---|---|
| רשימת מוצרים, כרטיס עם מחיר/מלאי/ווריאנטים (§3.1, §4, §7.3 Products tab) | loader `moachShopProducts` | `listRikmaProducts` | read |
| פרט מוצר + גלריה + וריאנטים + unit/delivery/attributes (§5.1) | `moachShopProducts` + `rikmaApiShopAttrs` | `getRikmaProduct` | read |
| מלאי פר-ווריאנט, מלאי -1 ללא הגבלה (§2.5, §7.3 Stock tab) | `setShopStock` action | `getShopInventory`, `listRikmaProductVariants`, `setShopStock` | read / selfWrite |
| צירי וריאציה (מידה/צבע) — `product-option` (§6.1, §6.2) | qid `rikmaApiOptions` | `listRikmaProductOptions`, `listRikmaProductVariants` | read |
| וריאנט SKU: מחיר, מלאי, תמונות (§1, §4.1, §6.2) | lifecycle ב-`1.0b` + `rikmaApiShopVariants` | `listRikmaProductVariants` (קריאה); כתיבת וריאנט דרך Sales/manage ב-UI עד S4 מלא (הכלי מחזיר manageUrl) | read |
| יצירת מוצר במחיר קבוע (§4.6 operational) | `createPersonalMatanot` (simple), `createComplexMatanot` (BOM) | `createRikmaProduct` — שלושה מצבי אירוח (§3.3 ב-`createPersonalMatanot.ts`): ברירת מחדל=home rikma, `projectId`=rikma קיימת, `newRikmaName`=rikma חדשה | selfWrite |
| הסתרה מה-/gift הציבורי, ארכיון (לא מחיקה, §4.3) | `setMatanotDiscovery` / `255setMatanotArchived` / `archivePersonalMatanot` | `updateRikmaProduct`, `archiveRikmaProduct` | selfWrite |
| עדכון מלאי תפעולי — set/add/unlimited (§4.6, §7.3) | `setShopStock` (nextStock) | `setShopStock` — mode set/add, value, unlimited, variantId | selfWrite |
| הזמנה ששולמה: `paid → shipped → fulfilled` / ביטול holder-only (§3.4, §5.4) | `moachShopOrders`, `markOrderShipped/ Fulfilled`, `cancelOrder` | `listRikmaOrders`, `getRikmaOrder`, `updateRikmaOrderStatus` | read / selfWrite |
| תמונת מלאי + oversold/shortUnits + banner (§7.3) | `moachShop.ts` `shortUnitsOf`, `bannerOf`, `loadShopOrders` | `getShopInventory` | read |

עיקרון החתך (§4 בעיקרון 8, §4.6): **מלאי וגלריה הם תפעוליים — חלים מיד; מחיר חדש/וריאנט חדש הם תנאים ודורשים `editObject` ברקמה מרובת-חברים.** הכלים מכבדים את זה: `setShopStock` כתיבה ישירה, `createRikmaProduct` יצירת מוצר פשוט במחיר קבוע, ושינוי מחיר של מוצר רקמה מצביע ל-editObject במסך המתקדם.

---

## 2. הכלים

כלים חשופים רק למפתח מאומת (`/api/mcp`) דרך `wrapMcpTool`, ולכן:
- `projectId` תמיד `project:'member'` — לא חבר ⇒ `denied`.
- `scopes.projects` (מפתח מוגבל לרקמות) נאכף לפני חברות (guard.ts `#checkPolicy`).
- כתיבה וכל סירוב נרשמים ב-audit; AI דלי: read 120/דק, write 20/דק, ai 10/שעה (rateLimit.ts).

### 2.1 קריאה — המוכר רואה מה על המדף

#### `listRikmaProducts(projectId, includeArchived?, kindOf?, search?)`
- רץ על `moachShopProducts` (כולל `variants`, `options`) + אופציונלית `moachShopLowStock` (lowStockAt — אם לא נפרס, אין סימון "נמוך" אבל הטבלה עדיין עולה).
- בונה `shapeProduct`: `price/priceMin/priceMax`, `quant`, `stockTotal`, `hasVariants`, `effectiveStock`, `stockLabel`, `isLowStock/lowVariants`, `coverImageUrl`, `galleryUrls`, `unit/minOrder/maxOrder/leadTimeHours/variantAxes/attributes/deliveryOptions`, `categories`, `projectIds`, ו-`variants[]` הממויינים לפי position.
- מחזיר `summary`: activeCount, withVariants, lowStockCount, outOfStockCount + הרשימה.

#### `getRikmaProduct(projectId, productId)`
- אותו qid + מציאת שורה לפי id (אין qid מוכר-single עשיר; זה חוסך qid וזהים ל-loader).
- מרחיב עם `rikmaApiShopAttrs` (pics, variantAxes, attributes, deliveryOptions) כש-live — אם הסכמה לא live, המוצר עדיין חוזר.
- `editHint`: מוצר quote/estimated ⇒ editObject; וריאנט ⇒ stock על הווריאנט; simple fixed ⇒ direct.
- קישורים: `publicUrl=/gift/[id]`, `manageUrl=/moach/[pid]/sales/manage`.

#### `getShopInventory(projectId, includeArchived?)`
- מקביל ל-Stock tab + banner: קורא `moachShopProducts` (+ lowStockAt) ו-`moachShopOrders` במקביל, בונה טוטאלים (products/variants/orders), `lowStock`/`outOfStock`/`variantsByProduct`, ולכל ממתינה: `shortUnits` מהמלאי עכשיו (כמו `loadShopOrders` ב-`moachShop.ts`).

#### `listRikmaProductOptions(projectId)` / `listRikmaProductVariants(projectId, productIds)`
- Options: qid `rikmaApiOptions` → key/name/values(value,label,hex,imageUrl,position).
- Variants: qid `rikmaApiShopVariants` (SKUs של מוצרי העמוד, §6.8: `SHOP_VARIANTS_LIMIT=1000`) → sku/name/label/optionValues/axisKey/price/compareAtPrice/quant/unlimited/active/position/externalKey/imageUrls/productId.
- אם `product-variant` עוד לא נפרס ⇒ מסר מפורש "not yet deployed" (לא תוצאה ריקה מטעה, §9.3).

#### `listRikmaOrders / getRikmaOrder`
- qid `moachShopOrders` — הרשימה שהרקמה רואה (buyerName/Email/Phone, deliveryAddress, paymentRef/Method, paidAt/shippedAt/fulfilledAt, total/currency, oversold, source, holder, `lines[]`+`sales[]`).
- פרטי קונה §5.6: גלויים לחברי הרקמה בלבד, ולעולם לא ב-webhook/DTO — כאן בדיוק מה שה-loader מראה, באותה רמה.
- `totalCount`, `returned`, ו-`summary` (paid/shipped/fulfilled/cancelled/oversold/waitingToShip). `getRikmaOrder` מקבל ref `57:pi_…` או id וגם צולל ל-`moachShopOrders` כ-fallback לרפרנס id-shaped של היסטוריה.
- `shortUnits` מחושב מחדש מול מלאי עכשיו (כמו Moach).

### 2.2 כתיבה — המוכר מנהל את המדף

כולם `selfWrite` + `project:member` (כל חבר רשאי לתפעל — לקבל חבילה היא עבודת הרקמה, §3.4). Idempotent היכן שרלוונטי; כל שגיאה חוזרת כטקסט ולא כ-exception צורם.

#### `createRikmaProduct({ name, descrip?, price, quant?, kindOf?, pricingMode?, projectId?, newRikmaName?, picId?, location? })`
- עטיפה של `createPersonalMatanot` (M3): אותן שלוש צורות אירוח — ברירת מחדל home (personal, owner_user), `projectId` (חבר באותה רקמה — 274getProjectMembers), `newRikmaName` (crWeaveFull + `createPersonalMatanot`).
- ל-`fixed` פשוט זה המוצר הנמכר בקופה (`checkout:true` כש-status_of_voting=active ו-price≠null — `checkoutOf` ב-shop.ts); `estimated/quote` נוצרים אבל `POST /orders` יסרב אותם ב-`NOT_CHECKOUTABLE` עד שיהפכו ל-fixed בחנות — הכלי מחזיר URL כדי לבדוק `checkout`.
- מחזיר `productId`, `projectId`, `origin`, `url`, `manageUrl`.

#### `updateRikmaProduct({ projectId, productId, hideFromDiscovery?, name?, descrip? })`
- Discovery הוא display-gate (כמו `setSupportPage`): direct update עם פרסום מיידי — `setMatanotDiscovery` (serviceAdmin).
- שינוי שם/תיאור של מוצר רקמה הוא `editObject` (Decision) — אין כאן מחיקה ישירה של טרם. הכלי מסביר ומחזיר manageUrl.
- שדות נוספים (price/category/SEO) נכנסים כאן לכשיתווספו ה-qids ב-S4.

#### `archiveRikmaProduct({ projectId, productId, archived })`
- `255setMatanotArchived` (כל חבר רקמה, soft-archive) + fallback ל-`archivePersonalMatanot` (owner-only, personal). נשאר לקריאה, נעלם מהקטלוג — אין `DELETE`.

#### `setShopStock({ projectId, productId, variantId?, mode?, value?, unlimited? })`
- `setShopStock` action: טוען פרודוקט/וריאנט מהשרת (`ordersApiProducts`/`saleVariantInfo`), שומר tenant (id של רקמה אחרת ⇒ NOT_FOUND), סרב `VARIANT_REQUIRED` למוצר וריאנטי כש-variantId חסר, מחשב `nextStock` (set/add/unlimited) — `add` נקרא מול המלאי ברגע הכתיבה כדי לא לדרוס מכירה שהגיעה בינתיים (§2.2/#1), כותב via `rikmaApiVariantQuant`/`updateMatanotQuant`, מחזיר `before/quant/changed/stockChanges`.

#### `updateRikmaOrderStatus({ projectId, orderRef, action, reason?, restock? })`
- מפה ל-`markOrderShipped` / `markOrderFulfilled` / `cancelOrder` (orderLifecycle.ts):
  - shipped/fulfilled: כל חבר; `same` ⇒ success עם changed=false; `refused` (backwards) ⇒ 409.
  - cancel: holder-only (`holder` של ההזמנה = מחזיק הכסף; דרך ה-API — בעל המפתח). כל מכירה לפי `refundDecisionOf` (§5.4): `self` לא בחלוקה ⇒ 0/0 + הסכום המקורי בהערה; כבר בחלוקה ⇒ נשארת + התראה `review`; מחזיק אחר/`open`/`confirmed` ⇒ לא נוגעים. Retry בטוח: מאפס קודם, סטטוס אחריו, מלאי אחרון; ביטול חוזר לא משחזר מלאי שוב; `restock` ברירת מחדל paid≠shipped.
- מחזיר `status`, `changed/alreadyCancelled`, `refunds`, `stockChanges`, `manageUrl`.

---

## 3. הנחיות לסוכן (instructions.ts)

נוספו סעיפים 7–8 ל-`MCP_INSTRUCTIONS`:

> 7. The shop... 8. Orders + getShopInventory... (see src/lib/server/mcp/instructions.ts)

הסוכן נקרא לסדר עבודה: `findUserProjects → getProjectDetails → listRikmaProducts/getShopInventory →` רק אז כתיבה.

---

## 4. אבטחה / ריבוי-דיירים (§1.1, G1/G2)

- כל כלי חנות נולד ב-`toolManifest.ts` עם `project:'member'` — כלי חדש בלי guard נופל ב-`toolManifest.test.ts` ("takes projectId but has no project policy").
- scoped key (`scopes.projects=[89]`) נאכף לפני שהכלי רץ; ה-qids עצמם מגודרים בקטלוג לרקמה בשאילתה (`projectcreates: {id:{eq:$pid}}`, `project: {id:{eq:$pid}}`), כך ש-id של רקמה אחרת = no row.
- פרטי קונה לא יוצאים ב-webhook/`GET /orders/{ref}` (§5.6); כאן הם שדות של `moachShopOrders` וחוזרים לאן ש-member רואה אותם ב-UI — לא לשום כלי ציבורי.
- `mapProjectProcesses`/`isHiddenProject` וכו' נשארים: רקמות QA מוסתרות נשארות מוסתרות גם מחוץ ל-member.

---

## 5. סדר פריסה

1. `docs` + `src/mastra/tools/shopTools.ts` + `toolManifest.ts` + `instructions.ts` כאן — זה ה-PR.
2. `qidsAccess` כבר מתיר את ה-qids שהכלים קוראים (`moachShop*`, `rikmaApiOptions`, `rikmaApiShopVariants`, `rikmaApiShopAttrs`, `rikmaApiVariantQuant`, `ordersApi*`, `rikmaApiOrderByRef`) ל-serviceAdmin; גלריית מוצר/וריאנט נפרסה עם `upload.breakpoints`, order columns ו-lowStockAt ב-`1.0b@shabab` (PR #17, §6.9).
3. אחרי פריסה: Strapi permissions ל-API token חייבות לכלול `find` ל-product-variant/product-option/order(+lines) ו-`update` ל-order/sale עם holder/product_variant — בדיוק מה ש-§9.6 רשם (עד אז הכלים עונים "not readable with the service role").
4. כל עוד הסכמה לא live: `moachShopOrders` עונה `503 SHOP_NOT_READY`-style או empty; variants מחזירים "shop schema not yet deployed" במקום תוצאה ריקה — אותו דירוג של ה-API הציבורי (§7.1).

---

## 6. מה נשאר (S4/S5/S6)

- עורך וריאנטים מלא (מטריצת SKU, תמונה לכל וריאנט, תמונת Swatch, מחולל) → `saveProductVariants`/`saveProductOptions` (S4) — הכלי `listRikmaProductVariants` כבר הוכן כדי להזין אותו.
- השדות הנגזרים ב-lifecycle (`priceMin/priceMax/stockTotal/variantAxes` §2.4) — ב-1.0b lifecycle, לא כאן.
- מסך מכירות במוח (`/moach/[projectId]/sales` simple → advanced `sales/manage`, ייצוא CSV Shopify, לשונית חיבורים) — S5; התבנית לפתיחה (`1lev1-shop-starter`, §7.4) — S6.
- אוטומציה: ספק תשלום שמאמת חתימה וקורא ל-`POST /orders` ב-server function — מחליף את ההזמנה האנונימית ומסיר את האישור הידני (§3.5).
- `POST /checkout` לסטטי (S7) + changes?since sync (P2).

---

## 7. בדיקות

- `yarn test` (vitest 3.2.7) על `src/lib/server/mcp/*`: guard 20, manifest 11, rateLimit 3, keyDiagnosis 11, lazyListing 7, strapiErrors 6 — כולם עוברים (58 כולל shop imports).
- ידני נגד שרת פיתוח עם מפתח scoped ל-`[89]`: `listRikmaProducts(89)` → פירוט, `getRikmaProduct(89,1842)` → וריאנטים, `getShopInventory(89)` → low/out, `listRikmaOrders(89)` → buyerContact, `setShopStock`/`updateRikmaOrderStatus` כש-holder.

## 8. קישורים

- קוד: `src/mastra/tools/shopTools.ts` (12 כלים), `src/lib/server/mcp/toolManifest.ts` (מניפסט), `src/lib/server/mcp/instructions.ts` (§7–8), `src/lib/server/shop/moachShop.ts`, `src/lib/shop/manage.ts`.
- סכמה: `1.0b/src/api/*/content-types/*/schema.json` (product-option, product-variant, order/line).
- API: `src/lib/server/apiPublic/*` (catalog.ts S2, dto.ts, query.ts, writeApi.ts+ordersApi.ts), `src/lib/server/actions/configs/{shopStock,createPaidOrder,orderLifecycle}.ts`.
