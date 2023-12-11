export async function load({url}){
    return{
        from: url.searchParams.get('from')
    }
}
