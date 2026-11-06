// The cookie that carries a rikma-event registrant's token from /hascama to the
// signup action (docs/inprogress/PLAN_EVENTS_WEBINARS.md W4). Its own module so
// both routes name it once; plain .js so the .js routes import it untyped.
export const EVENT_SIGNUP_COOKIE = 'event_signup';
