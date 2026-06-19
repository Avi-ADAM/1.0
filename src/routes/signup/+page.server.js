import { redirect, fail } from '@sveltejs/kit';

const baseUrl = import.meta.env.VITE_URL;

export async function load({ cookies }) {
  const fpval = cookies.get('fpval');
  if (!fpval) {
    throw redirect(302, '/hascama');
  }
}

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    const displayName = String(data.get('displayName') || cookies.get('un') || '').trim();

    const fpval = cookies.get('fpval');
    const countryCookie = cookies.get('country') || '';
    const countries = countryCookie
      ? countryCookie
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    if (!email || !password) {
      return fail(400, { error: 'נא למלא את כל השדות' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password)) {
      return fail(400, { error: 'הסיסמה חייבת להכיל לפחות 8 תווים ואות גדולה באנגלית' });
    }

    const username = displayName
      ? displayName.trim()
      : `${(email.split('@')[0] || 'u').trim()}_${Math.floor(Math.random() * 9999)}`;

    try {
      const registerBody = { username, email, password };
      if (displayName) registerBody.name = displayName;
      if (fpval) registerBody.chezin = fpval;
      if (countries.length > 0) registerBody.cuntries = countries;

      const res = await fetch(`${baseUrl}/api/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerBody)
      });

      if (!res.ok) {
        const err = await res.json();
        const msg = err?.error?.message || 'שגיאה ברישום';
        if (msg.toLowerCase().includes('already taken') || msg.toLowerCase().includes('already exist')) {
          return fail(400, { error: 'כתובת המייל כבר רשומה במערכת. נסו להתחבר.' });
        }
        return fail(400, { error: msg });
      }

      const { jwt, user } = await res.json();

      const isProduction = import.meta.env.PROD;
      const cookieOptions = {
        path: '/',
        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        secure: isProduction,
        sameSite: /** @type {'none' | 'lax'} */ (isProduction ? 'none' : 'lax'),
        domain: isProduction ? '.1lev1.com' : undefined
      };

      cookies.set('jwt', jwt, { ...cookieOptions, httpOnly: true });
      cookies.set('id', String(user.id), { ...cookieOptions, httpOnly: false });
      cookies.set('un', user.name || displayName || user.username, { ...cookieOptions, httpOnly: false });
      cookies.set('when', Date.now().toString(), { ...cookieOptions, httpOnly: false });
      cookies.set('email', email, { ...cookieOptions, httpOnly: false });
      cookies.set('guidMe', 'again', { ...cookieOptions, httpOnly: false });

      throw redirect(303, '/signup/check-email');
    } catch (err) {
      if (/** @type {any} */ (err)?.status === 303) throw err;
      return fail(400, {
        error: /** @type {any} */ (err)?.message || 'שגיאה לא ידועה, נסו שוב'
      });
    }
  }
};
