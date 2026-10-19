// The seller's product editor (docs/inprogress/PLAN_SHOP_CUSTOMER_EXPERIENCE.md
// §7 S4). Spread into `qids` in qids.js; dependency-free for the same reason
// qids.js is (the scripts import it under plain node).
//
// Every one of these is `serviceAdmin` in qidsAccess.js: they are called only
// from the editor's loader (after the moach layout's membership check) and from
// the `saveProductVariants` / `saveProductOptions` actions, never from a
// component. Each read is fenced to the rikma in the query itself — an id from
// another rikma is "not found", never a row.
//
// `lowStockAt`, `leadTimeHours` and the `unlimited` flag are not here: they
// deploy on their own days and a query naming a missing column fails whole.

export const shopEditorQids = {
  // The product with everything the editor draws: gallery, axes, variants,
  // whether an edit proposal is already open on it, and who its partners are
  // (a rikma of one is sovereign, like a personal product).
  'shopEditorProduct': `query ShopEditorProduct($pid: ID!, $id: ID!) {
    matanots(filters: { id: { eq: $id }, projectcreates: { id: { eq: $pid } } }) {
      data { id attributes {
        name price pricingMode quant origin hasVariants status_of_voting archived lifecycle kindOf
        pic { data { id attributes { url formats width height alternativeText } } }
        pics(pagination: { limit: 12 }) { data { id attributes { url formats width height alternativeText } } }
        options(pagination: { limit: 10 }) { data { id attributes { key name position active values { value label position hex } } } }
        variants(pagination: { limit: 100 }) { data { id attributes {
          sku name axisKey optionValues price compareAtPrice quant active position
          pics(pagination: { limit: 12 }) { data { id attributes { url formats } } }
        } } }
        archive_decisions(filters: { archived: { eq: false } }) { data { id attributes { kind createdAt } } }
        projectcreates { data { id attributes { restime user_1s { data { id } } } } }
      } }
    }
  }`,

  // The rikma's option vocabulary — an axis the seller already named on another
  // product is offered back instead of a second "מידה".
  'shopEditorRikmaOptions': `query ShopEditorRikmaOptions($pid: ID!) {
    productOptions(filters: { project: { id: { eq: $pid } } }, sort: ["position:asc"], pagination: { limit: 100 }) {
      data { id attributes { key name position active archived values { value label position hex } } }
    }
  }`,

  // Every SKU of the rikma, for `DUPLICATE_SKU` (unique per rikma, §6.9 #1).
  'shopEditorRikmaSkus': `query ShopEditorRikmaSkus($pid: ID!) {
    productVariants(filters: { project: { id: { eq: $pid } } }, pagination: { limit: 1000 }) {
      data { id attributes { sku matanot { data { id } } } }
    }
  }`,

  'shopOptionCreate': `mutation ShopOptionCreate($data: ProductOptionInput!) {
    createProductOption(data: $data) { data { id } }
  }`,

  'shopOptionUpdate': `mutation ShopOptionUpdate($id: ID!, $data: ProductOptionInput!) {
    updateProductOption(id: $id, data: $data) { data { id } }
  }`,

  'shopVariantCreate': `mutation ShopVariantCreate($data: ProductVariantInput!) {
    createProductVariant(data: $data) { data { id } }
  }`,

  'shopVariantUpdate': `mutation ShopVariantUpdate($id: ID!, $data: ProductVariantInput!) {
    updateProductVariant(id: $id, data: $data) { data { id } }
  }`,

  // Gallery, cover, axes and the derived fields. The action builds `data`
  // field by field; nothing the seller sends reaches it unread.
  'shopProductUpdate': `mutation ShopProductUpdate($id: ID!, $data: MatanotInput!) {
    updateMatanot(id: $id, data: $data) { data { id } }
  }`,

  // `lowStockAt` deploys apart (1.0b 06318d5) — its own mutation, so a save
  // without the column still saves everything else.
  'shopProductLowStock': `mutation ShopProductLowStock($id: ID!, $lowStockAt: Float) {
    updateMatanot(id: $id, data: { lowStockAt: $lowStockAt }) { data { id } }
  }`
};
