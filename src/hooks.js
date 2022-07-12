export function getSession(event) {
    return {
        userAgent: event.request.headers.get('accept-language')
    }
}