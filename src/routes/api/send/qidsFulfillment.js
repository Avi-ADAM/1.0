// The rikma's order automation (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2–§3,
// A1). Spread into `qids` in qids.js; dependency-free for the same reason
// qids.js is (the scripts import it under plain node).
//
// Every one of these is `serviceAdmin` in qidsAccess.js: they run only inside
// the fulfillment actions (fulfillment.ts, stockResource.ts), the engine
// (applyFulfillment) and the timegrama finalizers, after those checked
// membership and consent — a direct /api/send call could otherwise switch on a
// rule that lands work on someone who never agreed, or move a shelf.
// Each read is fenced to the rikma in the query itself, or reached only from a
// row the caller already fenced.
//
// A2/A3 reads that touch fields `1.0b` adds (the `fulfillmentRule` Decision,
// `Mashabetahalich.quantityConsumed/accounting/lowStockAt`, the `none` price
// mode, `Order.stockMoves`, `Maap.unitPrice`) are separate qids on purpose:
// until the deploy they fail on their own and the caller reads that as "not
// ready", while the A1 queries above keep working.

const STEP_FIELDS = `
  name position scope per when target routing batching waveAt dueHours effect
  fields consentState exportAddress archived createdAt
  mesimabetahalich { data { id attributes { name } } }
  tafkidim { data { id attributes { roleDescription } } }
  member { data { id attributes { username } } }
  proposedBy { data { id attributes { username } } }
  consentedBy(pagination: { limit: 50 }) { data { id } }
  matanots(pagination: { limit: 50 }) { data { id attributes { name } } }
  product_variants(pagination: { limit: 50 }) { data { id } }
`;

export const fulfillmentQids = {
  // The rikma's steps — the engine reads the live ones, the editor all of them.
  'fulfillmentSteps': `query FulfillmentSteps($pid: ID!) {
    fulfillmentSteps(
      filters: { and: [ { project: { id: { eq: $pid } } }, { archived: { ne: true } } ] }
      sort: ["position:asc", "id:asc"]
      pagination: { limit: 100 }
    ) {
      data { id attributes { ${STEP_FIELDS} } }
    }
  }`,

  // One step, fenced to the rikma — for edit / consent / pause.
  'fulfillmentStep': `query FulfillmentStep($pid: ID!, $id: ID!) {
    fulfillmentSteps(filters: { and: [ { project: { id: { eq: $pid } } }, { id: { eq: $id } } ] }) {
      data { id attributes { ${STEP_FIELDS} } }
    }
  }`,

  'fulfillmentStepCreate': `mutation FulfillmentStepCreate($data: FulfillmentStepInput!) {
    createFulfillmentStep(data: $data) { data { id attributes { consentState } } }
  }`,

  'fulfillmentStepUpdate': `mutation FulfillmentStepUpdate($id: ID!, $data: FulfillmentStepInput!) {
    updateFulfillmentStep(id: $id, data: $data) { data { id attributes { consentState } } }
  }`,

  // The rikma's running missions with their holder and roles — who a step can
  // land on. Closed ones are read too, so a rule on a finished mission says so.
  'fulfillmentMissions': `query FulfillmentMissions($pid: ID!) {
    mesimabetahaliches(
      filters: { project: { id: { eq: $pid } } }
      pagination: { limit: 300 }
    ) {
      data { id attributes {
        name finnished lifecycle
        users_permissions_user { data { id attributes { username } } }
        tafkidims(pagination: { limit: 20 }) { data { id attributes { roleDescription } } }
      } }
    }
  }`,

  // The order as the engine plans it — by id, fenced to the rikma.
  'fulfillmentOrder': `query FulfillmentOrder($pid: ID!, $id: ID!) {
    orders(filters: { and: [ { project: { id: { eq: $pid } } }, { id: { eq: $id } } ] }) {
      data { id attributes {
        ref displayNumber status deliveryPreference deliveryAddress buyerName paidAt fulfillmentPending
        lines(pagination: { limit: 100 }) { data { id attributes {
          position quantity nameSnapshot optionLabelSnapshot
          matanot { data { id } }
          variant { data { id } }
        } } }
      } }
    }
  }`,

  // Every act already written for an order — drafts included, so an act closed
  // by a cancel is not reopened by a retry.
  'fulfillmentOrderActs': `query FulfillmentOrderActs($oid: ID!) {
    acts(
      filters: { order: { id: { eq: $oid } } }
      publicationState: PREVIEW
      pagination: { limit: 200 }
    ) {
      data { id attributes { externalId naasa publishedAt des } }
    }
  }`,

  // An order's open acts with what their step does on completion — when the
  // status moves elsewhere (the orders screen, an API key, an agent), the acts
  // whose whole point was that change follow it (A2). Published = still open.
  'fulfillmentOrderEffectActs': `query FulfillmentOrderEffectActs($oid: ID!) {
    acts(filters: { order: { id: { eq: $oid } } }, pagination: { limit: 200 }) {
      data { id attributes { naasa externalId fulfillment_step { data { id attributes { effect per } } } } }
    }
  }`,

  // Close an act whose order was cancelled: it stays as history, unpublished.
  'fulfillmentActClose': `mutation FulfillmentActClose($id: ID!, $des: String) {
    updateAct(id: $id, data: { publishedAt: null, des: $des }) { data { id } }
  }`,

  // The order flag the sales screen reads when the engine failed (risk 2).
  'fulfillmentOrderFlag': `mutation FulfillmentOrderFlag($id: ID!, $pending: Boolean!) {
    updateOrder(id: $id, data: { fulfillmentPending: $pending }) { data { id } }
  }`,

  // One automatic act, with what the heart card and its completion need.
  'fulfillmentAct': `query FulfillmentAct($id: ID!) {
    act(id: $id) { data { id attributes {
      shem des naasa dateF externalId source
      project { data { id } }
      my { data { id attributes { username } } }
      tafkidims { data { id } }
      mesimabetahaliches { data { id } }
      order { data { id attributes { ref status displayNumber } } }
      fulfillment_step { data { id attributes {
        name effect routing target
        tafkidim { data { id attributes { roleDescription } } }
        mesimabetahalich { data { id } }
        consentedBy(pagination: { limit: 50 }) { data { id } }
      } } }
    } } }
  }`,

  // My open automatic acts — assigned to me, or open to a role I hold through a
  // running mission, in a rikma I belong to. The heart's `fulfill` cards.
  'fulfillmentMyActs': `query FulfillmentMyActs($uid: ID!) {
    acts(
      filters: { and: [
        { fulfillment_step: { id: { notNull: true } } }
        { naasa: { ne: true } }
        { project: { user_1s: { id: { eq: $uid } } } }
        { or: [
          { my: { id: { eq: $uid } } }
          { and: [
            { my: { id: { null: true } } }
            { tafkidims: { mesimabetahaliches: { users_permissions_user: { id: { eq: $uid } } } } }
          ] }
          { and: [
            { my: { id: { null: true } } }
            { tafkidims: { id: { null: true } } }
          ] }
        ] }
      ] }
      sort: ["dateF:asc", "id:asc"]
      pagination: { limit: 100 }
    ) {
      data { id attributes {
        shem des dateF createdAt externalId
        project { data { id } }
        my { data { id } }
        tafkidims { data { id attributes { roleDescription } } }
        mesimabetahaliches { data { id attributes { name } } }
        order { data { id attributes {
          ref displayNumber status deliveryPreference deliveryAddress buyerName buyerPhone
        } } }
        order_line { data { id attributes { nameSnapshot optionLabelSnapshot quantity } } }
        fulfillment_step { data { id attributes { name effect batching per } } }
      } }
    }
  }`,

  // Take an act that opened for a role — it becomes mine, inside my mission.
  'fulfillmentActTake': `mutation FulfillmentActTake($id: ID!, $uid: [ID], $mids: [ID]) {
    updateAct(id: $id, data: { my: $uid, mesimabetahaliches: $mids, isAssigned: true, myIshur: true }) { data { id } }
  }`,

  // ── A2 ────────────────────────────────────────────────────────────────────

  // The product categories of an order's lines — read only when a rule narrows
  // by category, so the order query stays as small as A1's.
  'fulfillmentOrderCategories': `query FulfillmentOrderCategories($pid: ID!, $id: ID!) {
    orders(filters: { and: [ { project: { id: { eq: $pid } } }, { id: { eq: $id } } ] }) {
      data { id attributes {
        lines(pagination: { limit: 100 }) { data { id attributes {
          matanot { data { id attributes { categories(pagination: { limit: 20 }) { data { id } } } } }
        } } }
      } }
    }
  }`,

  // Products of the rikma by id — a rule scoped to products names only its own.
  'fulfillmentProducts': `query FulfillmentProducts($pid: ID!, $ids: [ID]) {
    matanots(filters: { and: [ { id: { in: $ids } }, { projectcreates: { id: { eq: $pid } } } ] }, pagination: { limit: 100 }) {
      data { id attributes { name } }
    }
  }`,

  // What a rule's conditions can name, for the editor: categories in use by the
  // rikma's products, and the products themselves.
  'fulfillmentChoices': `query FulfillmentChoices($pid: ID!) {
    matanots(
      filters: { and: [ { projectcreates: { id: { eq: $pid } } }, { or: [ { archived: { null: true } }, { archived: { eq: false } } ] } ] }
      pagination: { limit: 300 }
    ) {
      data { id attributes { name categories(pagination: { limit: 20 }) { data { id attributes { name } } } } }
    }
  }`,

  // The rikma's recent automatic acts: who holds how many open ones (leastOpen)
  // and who each step's last act went to (roundRobin).
  'fulfillmentRoutingActs': `query FulfillmentRoutingActs($pid: ID!) {
    acts(
      filters: { and: [ { project: { id: { eq: $pid } } }, { fulfillment_step: { id: { notNull: true } } } ] }
      sort: ["id:desc"]
      pagination: { limit: 300 }
    ) {
      data { id attributes { naasa my { data { id } } fulfillment_step { data { id } } } }
    }
  }`,

  // A reminder before an automatic act is due (whatami "act", finalized by
  // $lib/server/fulfillment/reminder.ts).
  'fulfillmentReminderCreate': `mutation FulfillmentReminderCreate($date: DateTime!, $act: ID!) {
    createTimegrama(data: { date: $date, done: false, whatami: "act", act: $act }) { data { id } }
  }`,

  // The act a reminder is for. A closed (unpublished) act reads as null: nothing to remind.
  'fulfillmentReminderAct': `query FulfillmentReminderAct($id: ID!) {
    act(id: $id) { data { id attributes {
      shem naasa dateF externalId
      project { data { id } }
      my { data { id } }
      tafkidims { data { id } }
      order { data { id attributes { status } } }
    } } }
  }`,

  // Hand-off: the roles an act is open to.
  'fulfillmentActRoles': `mutation FulfillmentActRoles($id: ID!, $roles: [ID]) {
    updateAct(id: $id, data: { tafkidims: $roles }) { data { id } }
  }`,

  // Hand-off: who holds it (through updateTask it would also need a mission;
  // this is the "open it again" write — nobody, inside no mission).
  'fulfillmentActRelease': `mutation FulfillmentActRelease($id: ID!) {
    updateAct(id: $id, data: { my: [], mesimabetahaliches: [], isAssigned: false, myIshur: false }) { data { id } }
  }`,

  // The order's shipping record beside my acts — the heart shows the dispatch day.
  'fulfillmentOrdersShipping': `query FulfillmentOrdersShipping($ids: [ID]) {
    orders(filters: { id: { in: $ids } }, pagination: { limit: 100 }) {
      data { id attributes { shipping } }
    }
  }`,

  // ── the fulfillmentRule Decision (§2.3) ──
  // Deliberately not linked to \`projects\`: every open project Decision becomes a
  // vote card for the whole rikma (levDataExtractors.extractDecisions); this one
  // is between the author and the people the rule lands on.

  'fulfillmentRuleDecisions': `query FulfillmentRuleDecisions($sid: ID!) {
    decisions(
      filters: { and: [ { kind: { eq: "fulfillmentRule" } }, { fulfillmentStep: { id: { eq: $sid } } }, { archived: { ne: true } } ] }
      sort: ["id:desc"]
      pagination: { limit: 5 }
    ) {
      data { id attributes {
        archived
        vots { what why order zman ide users_permissions_user { data { id } } }
        timegrama { data { id attributes { date done } } }
      } }
    }
  }`,

  'fulfillmentRuleDecision': `query FulfillmentRuleDecision($id: ID!) {
    decision(id: $id) { data { id attributes {
      kind archived
      vots { what why order zman ide users_permissions_user { data { id } } }
      timegrama { data { id } }
      fulfillmentStep { data { id attributes { ${STEP_FIELDS} project { data { id } } } } }
    } } }
  }`,

  'fulfillmentRuleDecisionCreate': `mutation FulfillmentRuleDecisionCreate($data: DecisionInput!) {
    createDecision(data: $data) { data { id } }
  }`,

  'fulfillmentRuleDecisionUpdate': `mutation FulfillmentRuleDecisionUpdate($id: ID!, $data: DecisionInput!) {
    updateDecision(id: $id, data: $data) { data { id } }
  }`,

  'fulfillmentRuleClock': `mutation FulfillmentRuleClock($date: DateTime!, $decision: ID!) {
    createTimegrama(data: { date: $date, done: false, whatami: "decision", decision: $decision }) { data { id } }
  }`,

  // The heart: rules in my rikmas that may wait for my answer…
  'fulfillmentMyRuleSteps': `query FulfillmentMyRuleSteps($uid: ID!) {
    fulfillmentSteps(
      filters: { and: [
        { project: { user_1s: { id: { eq: $uid } } } }
        { archived: { ne: true } }
        { consentState: { in: ["proposed", "active"] } }
      ] }
      pagination: { limit: 100 }
    ) {
      data { id attributes { ${STEP_FIELDS} project { data { id attributes { projectName } } } } }
    }
  }`,

  // …through the missions I hold (a role rule lands on me through them).
  'fulfillmentMyMissions': `query FulfillmentMyMissions($uid: ID!) {
    mesimabetahaliches(filters: { users_permissions_user: { id: { eq: $uid } } }, pagination: { limit: 200 }) {
      data { id attributes {
        finnished lifecycle
        project { data { id } }
        tafkidims(pagination: { limit: 20 }) { data { id } }
      } }
    }
  }`,

  // …and when their silence becomes a yes.
  'fulfillmentRuleDeadlines': `query FulfillmentRuleDeadlines($sids: [ID]) {
    decisions(
      filters: { and: [ { kind: { eq: "fulfillmentRule" } }, { fulfillmentStep: { id: { in: $sids } } }, { archived: { ne: true } } ] }
      pagination: { limit: 100 }
    ) {
      data { id attributes {
        fulfillmentStep { data { id } }
        timegrama { data { attributes { date done } } }
        vots { what order why zman ide users_permissions_user { data { id attributes { username } } } }
      } }
    }
  }`,

  // ── A3: stock from a resource (§2.4) ──────────────────────────────────────

  // The essence-only BOM rows of an order's products, fenced to the rikma
  // through the resource they consume. A link is never deleted, only archived
  // (history) — null = legacy = live, so a bare `ne` would hide every old row.
  'stockRecipesForProducts': `query StockRecipesForProducts($pid: ID!, $products: [ID]) {
    matanotRecipeResources(
      filters: { and: [
        { priceMode: { eq: "none" } }
        { or: [ { archived: { null: true } }, { archived: { eq: false } } ] }
        { matanot: { id: { in: $products } } }
        { mashabetahalich: { project: { id: { eq: $pid } } } }
      ] }
      pagination: { limit: 200 }
    ) {
      data { id attributes {
        priceMode quantityPerUnit
        matanot { data { id } }
        product_variant { data { id } }
        mashabetahalich { data { id } }
      } }
    }
  }`,

  // The rikma's resources with their shelves — the stock screen and the editor.
  'stockResources': `query StockResources($pid: ID!) {
    mashabetahaliches(
      filters: { and: [
        { project: { id: { eq: $pid } } }
        { or: [ { lifecycle: { null: true } }, { lifecycle: { ne: "archived" } } ] }
      ] }
      sort: ["name:asc"]
      pagination: { limit: 200 }
    ) {
      data { id attributes {
        name unit kindOf recurring finnished pricePerUnit
        quantityDelivered quantityConsumed lowStockAt accounting
        users_permissions_user { data { id attributes { username } } }
        matanot_recipe_resources(filters: { and: [
          { priceMode: { eq: "none" } }
          { or: [ { archived: { null: true } }, { archived: { eq: false } } ] }
        ] }, pagination: { limit: 50 }) { data { id attributes {
          quantityPerUnit
          matanot { data { id attributes { name } } }
          product_variant { data { id attributes { name sku } } }
        } } }
        maaps(filters: { archived: { eq: false } }, sort: ["id:desc"], pagination: { limit: 10 }) { data { id attributes {
          name quantityDelivered unitPrice unit createdAt
          timegrama { data { attributes { date done } } }
        } } }
      } }
    }
  }`,

  // One resource, fenced to the rikma — for every stock action.
  'stockResource': `query StockResource($pid: ID!, $id: ID!) {
    mashabetahaliches(filters: { and: [ { project: { id: { eq: $pid } } }, { id: { eq: $id } } ] }) {
      data { id attributes {
        name unit kindOf recurring finnished lifecycle pricePerUnit
        quantityDelivered quantityConsumed lowStockAt accounting
        users_permissions_user { data { id attributes { username } } }
        project { data { id } }
        rikmash { data { id } }
        maaps(pagination: { limit: 200 }) { data { id attributes { cycleIndex } } }
      } }
    }
  }`,

  // Resources by id — consumption, the low-stock check and the heart's stock cards.
  'stockResourcesByIds': `query StockResourcesByIds($ids: [ID]) {
    mashabetahaliches(filters: { id: { in: $ids } }, pagination: { limit: 100 }) {
      data { id attributes {
        name pricePerUnit quantityDelivered quantityConsumed lowStockAt accounting
        users_permissions_user { data { id } }
        project { data { id } }
      } }
    }
  }`,

  'stockResourceSet': `mutation StockResourceSet($id: ID!, $data: MashabetahalichInput!) {
    updateMashabetahalich(id: $id, data: $data) { data { id } }
  }`,

  // An order's stock ledger (what it took, what a cancel gave back).
  'orderStockMoves': `query OrderStockMoves($pid: ID!, $id: ID!) {
    orders(filters: { and: [ { project: { id: { eq: $pid } } }, { id: { eq: $id } } ] }) {
      data { id attributes { ref status stockMoves } }
    }
  }`,

  'orderStockMovesSet': `mutation OrderStockMovesSet($id: ID!, $moves: JSON) {
    updateOrder(id: $id, data: { stockMoves: $moves }) { data { id } }
  }`,

  // Link / unlink a product (or one variant) to the resource it consumes.
  'stockRecipeCreate': `mutation StockRecipeCreate($data: MatanotRecipeResourceInput!) {
    createMatanotRecipeResource(data: $data) { data { id } }
  }`,

  // Unlinking archives the row — never a delete, so the history stays.
  'stockRecipeArchive': `mutation StockRecipeArchive($id: ID!, $at: DateTime) {
    updateMatanotRecipeResource(id: $id, data: { archived: true, archivedAt: $at }) { data { id } }
  }`,

  // One essence-only row, fenced to the rikma through its resource.
  'stockRecipe': `query StockRecipe($pid: ID!, $id: ID!) {
    matanotRecipeResources(filters: { and: [
      { id: { eq: $id } }
      { mashabetahalich: { project: { id: { eq: $pid } } } }
    ] }) {
      data { id attributes { priceMode quantityPerUnit archived mashabetahalich { data { id } } matanot { data { id } } product_variant { data { id } } } }
    }
  }`,

  // A product (and its variants) of the rikma — the link form names one.
  'stockProduct': `query StockProduct($pid: ID!, $id: ID!) {
    matanots(filters: { and: [ { id: { eq: $id } }, { projectcreates: { id: { eq: $pid } } } ] }) {
      data { id attributes { name product_variants(pagination: { limit: 100 }) { data { id } } } }
    }
  }`,

  // Does the rikma link any product to a resource at all? One cheap read, so a
  // rikma without automation or stock still pays almost nothing per order.
  'stockLinksExist': `query StockLinksExist($pid: ID!) {
    matanotRecipeResources(
      filters: { and: [
        { priceMode: { eq: "none" } }
        { or: [ { archived: { null: true } }, { archived: { eq: false } } ] }
        { mashabetahalich: { project: { id: { eq: $pid } } } }
      ] }
      pagination: { limit: 1 }
    ) { data { id } }
  }`,

  // The purchase acts already opened for a resource (externalId `stock:<id>:low:…`).
  'fulfillmentStockActs': `query FulfillmentStockActs($pid: ID!, $prefix: String!) {
    acts(
      filters: { and: [ { project: { id: { eq: $pid } } }, { externalId: { startsWith: $prefix } } ] }
      publicationState: PREVIEW
      pagination: { limit: 50 }
    ) { data { id attributes { externalId naasa } } }
  }`,

  // A supply portion (receiveStock): a cycle Maap on the resource.
  'stockReceiptCreate': `mutation StockReceiptCreate($data: MaapInput!) {
    createMaap(data: $data) { data { id } }
  }`,

  // What a settlement needs to tell a supply portion from a recurring month.
  'stockReceiptMaap': `query StockReceiptMaap($id: ID!) {
    maap(id: $id) { data { id attributes { unit unitPrice quantityDelivered } } }
  }`
};
