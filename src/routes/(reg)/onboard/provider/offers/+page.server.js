// Offerings step (PLAN_USER_OFFERINGS §4.2 / M7): the editors need the
// logged-in user's id for their own list queries.
export const load = async ({ locals }) => {
  return { uid: locals.uid };
};
