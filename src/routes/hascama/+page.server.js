/**
 * Capture an email-bound guest invitation token off the register link.
 *
 * The meetings app sends invited guests to `/hascama?invite=<signed-token>`.
 * The onboarding UI is client-driven and hops through /signup, so we stash the
 * token in a short-lived cookie here; the signup action consumes it after the
 * account is created and imports the meeting (see importInvitedMeeting).
 */
export function load({ url, cookies }) {
  const invite = url.searchParams.get('invite');
  if (invite) {
    cookies.set('invite_token', invite, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour — long enough to finish signup
    });
  }
  return {};
}
