export function load({ locals }) {
    const userAgent = locals.userAgent;
    console.log(userAgent);
    return {
        userAgent
    };
}