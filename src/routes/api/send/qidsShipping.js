// Shipping — a rikma's zones, rates and pickup points, and how an order
// travels (docs/inprogress/PLAN_SHOP_SHIPPING.md). Spread into `qids` in
// qids.js; dependency-free for the same reason qids.js is (the scripts import
// it under plain node).
//
// Every one is `serviceAdmin` in qidsAccess.js: they run only inside the
// shipping actions, the quote endpoint and the orders API, after those checked
// membership or the key. `Project.shipping` and `Order.shipping` are read in
// queries of their own, never added to an older query — those keep working on
// the day the columns are not deployed yet (shippingSchemaLive).

export const shippingQids = {
  // Are both columns deployed? A missing field fails validation; empty tables answer [].
  'rikmaApiShippingSchema': `query RikmaApiShippingSchema {
    projects(pagination: { limit: 1 }) { data { id attributes { shipping } } }
    orders(pagination: { limit: 1 }) { data { id attributes { shipping } } }
  }`,

  'shippingConfigGet': `query ShippingConfigGet($pid: ID!) {
    project(id: $pid) { data { id attributes { shipping currencyCode } } }
  }`,

  'shippingConfigSet': `mutation ShippingConfigSet($pid: ID!, $shipping: JSON) {
    updateProject(id: $pid, data: { shipping: $shipping }) { data { id } }
  }`,

  // The weight of the variants a cart names, fenced to the rikma.
  'shippingVariantWeights': `query ShippingVariantWeights($pid: ID!, $ids: [ID]) {
    productVariants(
      filters: { and: [ { project: { id: { eq: $pid } } }, { id: { in: $ids } } ] }
      pagination: { limit: 100 }
    ) {
      data { id attributes { weightGrams } }
    }
  }`,

  // The rikma's products, for the per-product rows of the shipping tab.
  'shippingProducts': `query ShippingProducts($pid: ID!) {
    matanots(
      filters: { and: [
        { projectcreates: { id: { eq: $pid } } },
        { or: [ { lifecycle: { null: true } }, { lifecycle: { ne: "archived" } } ] }
      ] }
      sort: ["name:asc"]
      pagination: { limit: 200 }
    ) {
      data { id attributes { name } }
    }
  }`,

  // Written after the order row, on its own: the order is never refused for
  // its shipping record, and the create mutation stays valid before deploy.
  'rikmaApiOrderSetShipping': `mutation RikmaApiOrderSetShipping($id: ID!, $shipping: JSON) {
    updateOrder(id: $id, data: { shipping: $shipping }) { data { id } }
  }`,

  // The shipping record of the rikma's orders — beside moachShopOrders, keyed by id.
  'moachShopOrdersShipping': `query MoachShopOrdersShipping($pid: ID!) {
    orders(
      filters: { project: { id: { eq: $pid } } }
      sort: ["paidAt:desc", "createdAt:desc"]
      pagination: { limit: 200 }
    ) {
      data { id attributes { shipping } }
    }
  }`,

  'orderShippingById': `query OrderShippingById($pid: ID!, $id: ID!) {
    orders(filters: { and: [ { project: { id: { eq: $pid } } }, { id: { eq: $id } } ] }) {
      data { id attributes { shipping } }
    }
  }`
};
