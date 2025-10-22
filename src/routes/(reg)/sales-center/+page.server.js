export function load({ locals }) {
    // Pass authentication data from the layout
    return {
        tok: locals.tok,
        uid: locals.uid,
        un: locals.un
    };
}