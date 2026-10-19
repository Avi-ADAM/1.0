// The rikma's order automation (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2–§3,
// A1). Spread into `qids` in qids.js; dependency-free for the same reason
// qids.js is (the scripts import it under plain node).
//
// Every one of these is `serviceAdmin` in qidsAccess.js: they run only inside
// the fulfillment actions (fulfillment.ts) and the engine (applyFulfillment),
// after those checked membership and consent — a direct /api/send call could
// otherwise switch on a rule that lands work on someone who never agreed.
// Each read is fenced to the rikma in the query itself.

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
      my { data { id } }
      tafkidims { data { id } }
      mesimabetahaliches { data { id } }
      order { data { id attributes { ref status displayNumber } } }
      fulfillment_step { data { id attributes { name effect } } }
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
        ] }
      ] }
      sort: ["dateF:asc", "id:asc"]
      pagination: { limit: 100 }
    ) {
      data { id attributes {
        shem des dateF createdAt
        project { data { id } }
        my { data { id } }
        tafkidims { data { id attributes { roleDescription } } }
        mesimabetahaliches { data { id attributes { name } } }
        order { data { id attributes {
          ref displayNumber status deliveryPreference deliveryAddress buyerName buyerPhone
        } } }
        order_line { data { id attributes { nameSnapshot optionLabelSnapshot quantity } } }
        fulfillment_step { data { id attributes { name effect } } }
      } }
    }
  }`,

  // Take an act that opened for a role — it becomes mine, inside my mission.
  'fulfillmentActTake': `mutation FulfillmentActTake($id: ID!, $uid: [ID], $mids: [ID]) {
    updateAct(id: $id, data: { my: $uid, mesimabetahaliches: $mids, isAssigned: true, myIshur: true }) { data { id } }
  }`
};
