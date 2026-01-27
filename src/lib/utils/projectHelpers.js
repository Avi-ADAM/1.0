/**
 * Project Helper Functions
 * 
 * פונקציות עזר לעבודה עם נתוני פרויקטים.
 * כל פונקציה מחזירה בדיוק את אותם שדות שהקוד הקיים מצפה להם.
 * 
 * IMPORTANT: אלו פונקציות עזר בלבד - הן לא משנות את הלוגיקה הקיימת!
 */

import { getProjectData } from '$lib/stores/projectStore.js';
export { getProjectData };

/**
 * יצירת אובייקט מידע פרויקט בסיסי
 * 
 * מחליף את הדפוס החוזר:
 * ```
 * projectId: t.project.data.id,
 * projectName: getProjectData(t.project.data.id, 'pn'),
 * noof: getProjectData(t.project.data.id, 'noof'),
 * src2: getProjectData(t.project.data.id, 'pp'),
 * pid: getProjectData(t.project.data.id, 'uids')
 * ```
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @returns {Object} אובייקט עם מידע בסיסי על הפרויקט
 * 
 * @example
 * const projectInfo = createProjectInfo(projectId);
 * // Returns: { projectId, projectName, noof, src2, pid }
 */
export function createProjectInfo(projectId) {
  return {
    projectId: projectId,
    projectName: getProjectData(projectId, 'pn'),
    noof: getProjectData(projectId, 'noof'),
    src2: getProjectData(projectId, 'pp'),
    pid: getProjectData(projectId, 'uids'),
    user_1s: getProjectData(projectId, 'us')
  };
}

/**
 * יצירת אובייקט מידע משתמש בפרויקט
 * 
 * מחליף את הדפוס החוזר:
 * ```
 * uid: userId,
 * username: getProjectData(projectId, 'un', userId),
 * src: getProjectData(projectId, 'upic', userId)
 * ```
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @param {string|number} userId - מזהה המשתמש
 * @returns {Object} אובייקט עם מידע על המשתמש
 * 
 * @example
 * const userInfo = createUserInfo(projectId, userId);
 * // Returns: { uid, username, src }
 */
export function createUserInfo(projectId, userId) {
  return {
    uid: userId,
    username: getProjectData(projectId, 'un', userId),
    src: getProjectData(projectId, 'upic', userId)
  };
}

/**
 * יצירת אובייקט הודעה
 * 
 * מחליף את הדפוס החוזר של יצירת הודעות בצ'אט
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @param {string|number} userId - מזהה המשתמש ששלח
 * @param {string} message - תוכן ההודעה
 * @param {Object} options - אפשרויות נוספות
 * @param {Date} [options.timestamp] - זמן השליחה (ברירת מחדל: עכשיו)
 * @param {boolean} [options.sentByMe] - האם נשלח על ידי המשתמש הנוכחי
 * @param {boolean} [options.what] - סטטוס ההודעה (true/false)
 * @param {boolean} [options.changed] - האם ההודעה שונתה
 * @returns {Object} אובייקט הודעה
 * 
 * @example
 * const msg = createMessage(projectId, userId, 'שלום', { sentByMe: true });
 * // Returns: { message, pic, timestamp, sentByMe, what, changed }
 */
export function createMessage(projectId, userId, message, options = {}) {
  const {
    timestamp = new Date(),
    sentByMe = false,
    what = true,
    changed = false
  } = options;

  return {
    message: message,
    pic: getProjectData(projectId, 'upic', userId),
    timestamp: timestamp,
    sentByMe: sentByMe,
    what: what,
    changed: changed
  };
}

/**
 * יצירת אובייקט מידע מלא על פרויקט ומשתמש
 * 
 * משלב את createProjectInfo ו-createUserInfo לאובייקט אחד.
 * שימושי כאשר צריך גם מידע על הפרויקט וגם על המשתמש.
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @param {string|number} userId - מזהה המשתמש
 * @param {string|number} myId - מזהה המשתמש הנוכחי
 * @returns {Object} אובייקט משולב
 * 
 * @example
 * const fullInfo = createProjectUserInfo(projectId, userId, myId);
 * // Returns: { projectId, projectName, noof, src2, pid, uid, username, src, myid }
 */
export function createProjectUserInfo(projectId, userId, myId) {
  return {
    ...createProjectInfo(projectId),
    ...createUserInfo(projectId, userId),
    myid: myId
  };
}

/**
 * בדיקה אם משתמש הוא חבר בפרויקט
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @param {string|number} userId - מזהה המשתמש
 * @returns {boolean} true אם המשתמש חבר בפרויקט
 * 
 * @example
 * if (isUserInProject(projectId, userId)) {
 *   // המשתמש חבר בפרויקט
 * }
 */
export function isUserInProject(projectId, userId) {
  const userIds = getProjectData(projectId, 'uids');
  if (!userIds) return false;
  
  return userIds.includes(String(userId)) || userIds.includes(Number(userId));
}

/**
 * קבלת רשימת כל חברי הפרויקט
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @returns {Array} מערך של אובייקטי משתמשים
 * 
 * @example
 * const members = getProjectMembers(projectId);
 * // Returns: [{ uid, username, src }, ...]
 */
export function getProjectMembers(projectId) {
  const users = getProjectData(projectId, 'us');
  if (!users || !Array.isArray(users)) return [];
  
  return users.map(user => ({
    uid: user.id,
    username: user.attributes?.username || '',
    src: getProjectData(projectId, 'upic', user.id)
  }));
}

/**
 * קבלת רשימת חברי הפרויקט (מבנה גולמי)
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @returns {Array} מערך של אובייקטי משתמשים כפי שהם ב-Strapi
 */
export function getProjectUsers(projectId) {
  return getProjectData(projectId, 'us');
}

/**
 * חישוב תאריך סיום פרויקט
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @returns {Date|null} תאריך הסיום או null אם אין
 * 
 * @example
 * const finishDate = getProjectFinishDate(projectId);
 */
export function getProjectFinishDate(projectId) {
  return getProjectData(projectId, 'finishDate');
}

/**
 * קבלת זמן התחדשות פרויקט
 * 
 * @param {string|number} projectId - מזהה הפרויקט
 * @returns {string|null} זמן התחדשות או null
 * 
 * @example
 * const restime = getProjectRestime(projectId);
 */
export function getProjectRestime(projectId) {
  return getProjectData(projectId, 'restime');
}

/**
 * יצירת אובייקט מידע מלא לקומפוננטות
 * 
 * פונקציה מקיפה שמחזירה את כל המידע הנדרש לרוב הקומפוננטות.
 * זה מה שרוב הקומפוננטות מצפות לקבל.
 * 
 * @param {Object} params - פרמטרים
 * @param {string|number} params.projectId - מזהה הפרויקט
 * @param {string|number} params.userId - מזהה המשתמש
 * @param {string|number} params.myId - מזהה המשתמש הנוכחי
 * @param {string} params.ani - סוג האובייקט (למשל: 'askedcoin', 'mtaha')
 * @param {string} params.azmi - קטגוריה (למשל: 'ziruf', 'mesima')
 * @param {number} params.pl - עדיפות למיון
 * @param {Object} [params.additional] - שדות נוספים ספציפיים
 * @returns {Object} אובייקט מלא עם כל המידע
 * 
 * @example
 * const itemData = createFullItemData({
 *   projectId,
 *   userId,
 *   myId,
 *   ani: 'askedcoin',
 *   azmi: 'ziruf',
 *   pl: 1,
 *   additional: { askId: 123, omid: 456 }
 * });
 */
export function createFullItemData({ projectId, userId, myId, ani, azmi, pl, additional = {} }) {
  return {
    ...createProjectInfo(projectId),
    ...createUserInfo(projectId, userId),
    myid: myId,
    ani: ani,
    azmi: azmi,
    pl: pl,
    ...additional
  };
}

/**
 * BACKWARD COMPATIBILITY HELPERS
 * 
 * פונקציות אלו מבטיחות תאימות לאחור מלאה עם הקוד הקיים.
 * הן מחזירות בדיוק את אותה מבנה שהקוד הישן מצפה לו.
 */

/**
 * יצירת אובייקט בסגנון הישן (לתאימות לאחור)
 * 
 * @deprecated השתמש ב-createFullItemData במקום
 */
export function createLegacyProjectObject(projectId, userId, myId) {
  return {
    projectId: projectId,
    projectName: getProjectData(projectId, 'pn'),
    noof: getProjectData(projectId, 'noof'),
    src2: getProjectData(projectId, 'pp'),
    myid: myId,
    pid: getProjectData(projectId, 'uids'),
    uid: userId,
    username: getProjectData(projectId, 'un', userId),
    src: getProjectData(projectId, 'upic', userId)
  };
}
