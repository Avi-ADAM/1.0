/**
 * This file defines the context and specific information for each page of the site.
 * The bot can use this information to provide better assistance based on where the user is.
 */

export const pageContexts = {
  '/': {
    title: 'דף הבית',
    description: 'דף הבית של המערכת. כאן ניתן לראות סקירה כללית וגישה מהירה לאזורים שונים.',
    actions: ['חיפוש כללי', 'צפייה בעדכונים אחרונים']
  },
  '/login': {
    title: 'דף התחברות',
    description: 'כאן משתמשים יכולים להתחבר למערכת או להירשם.',
    actions: ['התחברות', 'הרשמה', 'שחזור סיסמה']
  },
  '/lev': {
    title: 'מערכת לב',
    description: 'המערכת המרכזית לניהול תהליכים ומידע.',
    actions: ['ניהול בקשות', 'צפייה בנתונים']
  }
  // ניתן להוסיף עוד דפים כאן
};

/**
 * Returns the context for a given path.
 * Falls back to a general context if path is not found.
 */
export function getContextForPath(path) {
  // Normalize path (remove trailing slash, etc.)
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
  
  return pageContexts[normalizedPath] || {
    title: 'דף כללי',
    description: 'נראה שאתה נמצא בדף שטרם הוגדר לו קונטקסט ספציפי.',
    actions: []
  };
}
