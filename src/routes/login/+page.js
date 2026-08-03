export async function load({url, data}){
    return{
        ...data,
        from: url.searchParams.get('from'),
        // /confirm-email lands here after a successful email confirmation when
        // there is no session cookie to continue (a different browser/device).
        confirmed: url.searchParams.get('confirmed') === '1'
    }
}
