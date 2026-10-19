/** The `depends()` keys of the sales screens — `invalidate(key)` re-reads them. */
export const shopOrdersKey = (projectId: string) => `shop:orders:${projectId}`;
export const shopProductsKey = (projectId: string) => `shop:products:${projectId}`;
export const shopFulfillmentKey = (projectId: string) => `shop:fulfillment:${projectId}`;
