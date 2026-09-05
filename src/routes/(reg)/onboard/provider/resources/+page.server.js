// Resources step (PLAN_ONBOARDING M5 / PLAN_USER_OFFERINGS §4.2): the editor
// lists and creates the member's own resources, so it needs the logged-in id.
// Same shape as the offerings step next door.
export const load = async ({ locals }) => {
  return { uid: locals.uid };
};
