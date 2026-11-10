// A serverless function is frozen the moment it answers its request. Most bot
// handlers fire `ctx.reply(...)` without awaiting it, so the webhook answered
// 200 while the message was still on its way out: the send stayed suspended
// until the next update woke the function, and the member who tapped /start
// again, because nothing came back, then got both answers at once.
//
// Tracking the calls here, rather than adding `await` at each of the ~90 sites,
// also covers the next handler someone writes the same way.

/**
 * Records every Bot API call made through one update's `ctx.telegram`.
 * Telegraf builds a new Telegram client per update, so nothing leaks between
 * updates that overlap in the same instance.
 *
 * @param {{ callApi: (...args: any[]) => Promise<any> }} telegram
 * @returns {() => Promise<void>} resolves once every call has finished
 */
export function trackTelegramCalls(telegram) {
    const pending = new Set();
    const callApi = telegram.callApi.bind(telegram);

    telegram.callApi = (method, ...rest) => {
        const call = callApi(method, ...rest);
        // The caller keeps the original promise, so its own `.catch` still runs.
        const tracked = call
            .catch((error) => {
                console.warn(`[telegram] ${method} failed:`, error?.description ?? error?.message ?? error);
            })
            .finally(() => pending.delete(tracked));
        pending.add(tracked);
        return call;
    };

    return async function settled() {
        // A finished call can release a handler that makes the next one.
        while (pending.size > 0) {
            await Promise.all(pending);
        }
    };
}
