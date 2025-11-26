# Requirements Document

## Introduction

המערכת הנוכחית מטפלת בפעולות מול הסרבר באופן לא מסודר - כל קומפוננטה שולחת בקשות ישירות ל-Strapi דרך QIDS, ללא וולידציה מסודרת, ללא מנגנון עדכונים בזמן אמת אחיד, וללא ניהול מרכזי של התראות. המטרה היא לבנות מערכת מאוחדת שתנהל את כל זרימת הנתונים בצורה מסודרת, מאובטחת ומדורגת.

## Glossary

- **Action System** - המערכת המאוחדת לניהול פעולות מול הסרבר
- **Action Key** - מזהה ייחודי לכל סוג פעולה (דומה ל-QIDS הנוכחי)
- **Validation Rules** - כללי הרשאה ווולידציה לכל Action Key
- **Notification Rules** - כללים להגדרת מי צריך לקבל עדכון על פעולה
- **Socket Server** - שרת Socket.IO נפרד לניהול עדכונים בזמן אמת
- **Strapi** - מסד הנתונים והשרת הראשי
- **Client** - הפרונט-אנד (SvelteKit)
- **Action Handler** - פונקציה שמטפלת בפעולה ספציפית
- **Update Strategy** - אסטרטגיה להגדרת איזה מידע צריך להתעדכן בפרונט
- **Notification Channel** - ערוץ התראה (מייל, טלגרם, push, socket)

## Requirements

### Requirement 1

**User Story:** כמפתח, אני רוצה לשלוח פעולה לשרת עם Action Key ופרמטרים, כך שהמערכת תטפל בכל השלבים באופן אוטומטי

#### Acceptance Criteria

1. WHEN a developer calls the action service with an Action Key and parameters THEN the system SHALL accept the request and return a unique request ID
2. WHEN the action service receives a request THEN the system SHALL validate that all required parameters for that Action Key are present
3. WHEN parameters are missing or invalid THEN the system SHALL return a descriptive error without processing the action
4. WHEN the action service processes a request THEN the system SHALL log the request with timestamp, user ID, and Action Key
5. THE action service SHALL provide a consistent API interface for all Action Keys

### Requirement 2

**User Story:** כמנהל מערכת, אני רוצה להגדיר כללי הרשאה לכל Action Key, כך שרק משתמשים מורשים יוכלו לבצע פעולות

#### Acceptance Criteria

1. WHEN an action is requested THEN the system SHALL validate the user's JWT token before processing
2. WHEN an Action Key has authorization rules defined THEN the system SHALL check all rules before allowing the action
3. IF a user is not authorized for an action THEN the system SHALL return a 403 error with explanation
4. THE system SHALL support authorization rules including: token validation, project membership, role verification, and custom predicates
5. WHEN authorization fails THEN the system SHALL log the failed attempt with user ID and Action Key

### Requirement 3

**User Story:** כמפתח, אני רוצה שהמערכת תשמור נתונים ב-Strapi אוטומטית, כך שלא אצטרך לכתוב GraphQL בכל פעם

#### Acceptance Criteria

1. WHEN an action passes validation THEN the system SHALL execute the corresponding GraphQL mutation or query to Strapi
2. WHEN the Strapi operation succeeds THEN the system SHALL return the result data to the client
3. IF the Strapi operation fails THEN the system SHALL return a descriptive error and rollback any partial changes
4. THE system SHALL use the existing QIDS queries as the initial GraphQL operations
5. WHEN a new Action Key is added THEN the system SHALL allow defining the GraphQL operation in a centralized location

### Requirement 4

**User Story:** כמשתמש, אני רוצה לקבל עדכונים בזמן אמת כשמשהו משתנה, כך שלא אצטרך לרענן את הדף

#### Acceptance Criteria

1. WHEN an action completes successfully THEN the Socket Server SHALL identify which users need to receive updates
2. WHEN the Socket Server identifies target users THEN the system SHALL send real-time updates via Socket.IO to connected clients
3. WHEN a client receives a socket update THEN the system SHALL include the Action Key and relevant data
4. THE Socket Server SHALL maintain a registry of connected users and their active sessions
5. WHEN a user disconnects THEN the Socket Server SHALL clean up their session data

### Requirement 5

**User Story:** כמנהל פרויקט, אני רוצה להגדיר מי מקבל עדכונים על פעולות שונות, כך שכל משתמש יקבל רק מידע רלוונטי

#### Acceptance Criteria

1. WHEN an Action Key is defined THEN the system SHALL allow specifying notification recipient rules
2. THE system SHALL support recipient selection strategies: all project members (via project.user_1s), specific user IDs list, users with specific skills, users with specific roles, and custom predicates
3. WHEN selecting all project members THEN the system SHALL query Strapi using the project ID to get all user_1s
4. WHEN selecting specific users THEN the system SHALL accept an array of user IDs and filter the project members accordingly
5. WHEN an action completes THEN the system SHALL evaluate recipient rules to determine who receives notifications
6. WHEN recipient rules are evaluated THEN the system SHALL include user profile data: email, username, lang, telegramId, noMail flag, and machshirs (devices)
7. THE system SHALL cache project membership data to improve performance for repeated notifications

### Requirement 6

**User Story:** כמשתמש, אני רוצה לקבל התראות במייל, טלגרם ו-push notifications, כך שאדע על עדכונים חשובים גם כשלא באתר

#### Acceptance Criteria

1. WHEN an action triggers notifications THEN the system SHALL send notifications via all configured channels in parallel
2. THE system SHALL support notification channels: email (via sendBolkMail), Telegram (via sendBolkTelegram), push notifications (via pusherer), and Socket.IO
3. WHEN sending notifications THEN the system SHALL use each user's preferred language from their profile
4. WHEN a user has noMail flag set to true THEN the system SHALL skip email notifications for that user
5. WHEN sending push notifications THEN the system SHALL use the user's registered devices (machshirs) with their endpoint configurations
6. WHEN sending Telegram notifications THEN the system SHALL filter only users who have a telegramId configured
7. WHEN rendering email content THEN the system SHALL use Svelte email templates with user-specific data
8. WHEN a notification channel fails THEN the system SHALL log the error but continue with other channels
9. THE system SHALL reuse the existing notification infrastructure (nutifyPm, sendBolkMail, sendBolkTelegram, pusherer)

### Requirement 7

**User Story:** כמפתח, אני רוצה להגדיר איזה מידע צריך להתעדכן בפרונט אחרי פעולה, כך שהממשק יהיה תמיד מעודכן

#### Acceptance Criteria

1. WHEN an Action Key is defined THEN the system SHALL allow specifying an update strategy
2. THE system SHALL support update strategies: full refresh, partial update, optimistic update, and no update
3. WHEN a socket update is received THEN the client SHALL execute the appropriate update strategy
4. WHEN using partial update THEN the system SHALL specify which data keys need to be refreshed
5. THE system SHALL provide helper functions for common update patterns (e.g., update arr1, refresh project data)

### Requirement 8

**User Story:** כמפתח, אני רוצה להוסיף Action Key חדש בקלות, כך שלא אצטרך לשנות קוד במקומות רבים

#### Acceptance Criteria

1. WHEN adding a new Action Key THEN the developer SHALL define it in a single configuration file
2. THE configuration SHALL include: Action Key name, GraphQL operation, validation rules, notification rules, and update strategy
3. WHEN a new Action Key is added THEN the system SHALL automatically register it without code changes in other files
4. THE system SHALL validate the configuration on startup and report errors clearly
5. THE system SHALL provide TypeScript types for Action Key configurations

### Requirement 9

**User Story:** כמנהל מערכת, אני רוצה לראות לוגים של כל הפעולות, כך שאוכל לעקוב אחרי בעיות ולנתח שימוש

#### Acceptance Criteria

1. WHEN an action is processed THEN the system SHALL log: timestamp, user ID, Action Key, parameters, and result
2. WHEN an error occurs THEN the system SHALL log the full error details including stack trace
3. THE system SHALL support different log levels: debug, info, warn, error
4. WHEN in production THEN the system SHALL log only info level and above
5. THE system SHALL provide a way to query logs by user, Action Key, or time range

### Requirement 10

**User Story:** כמפתח, אני רוצה שהמערכת תהיה מהירה, כך שמשתמשים לא יחכו לתגובות

#### Acceptance Criteria

1. WHEN processing an action THEN the system SHALL respond within 500ms for 95% of requests
2. WHEN sending notifications THEN the system SHALL process them asynchronously without blocking the response
3. THE system SHALL cache frequently accessed data (user permissions, project memberships)
4. WHEN cache data is stale THEN the system SHALL refresh it in the background
5. THE Socket Server SHALL handle at least 1000 concurrent connections

### Requirement 11

**User Story:** כמפתח, אני רוצה לבדוק את המערכת בקלות, כך שאוכל לוודא שהכל עובד כמו שצריך

#### Acceptance Criteria

1. THE system SHALL provide a test mode that doesn't send real notifications
2. WHEN in test mode THEN the system SHALL log what notifications would have been sent
3. THE system SHALL provide mock implementations for Strapi and Socket.IO
4. WHEN testing an Action Key THEN the developer SHALL be able to simulate different scenarios
5. THE system SHALL include integration tests for common action flows

### Requirement 12

**User Story:** כמפתח, אני רוצה להעביר את המערכת הישנה לחדשה בהדרגה, כך שלא אצטרך לשנות הכל בבת אחת

#### Acceptance Criteria

1. THE new system SHALL work alongside the existing QIDS system during migration
2. WHEN an Action Key is migrated THEN the old code SHALL continue to work until fully replaced
3. THE system SHALL provide a migration guide for converting QIDS calls to Action System calls
4. WHEN both systems are active THEN the system SHALL log which system handled each request
5. THE system SHALL provide metrics on migration progress (percentage of actions using new system)


### Requirement 13

**User Story:** כמפתח, אני רוצה שהמערכת תתמוך בהתראות מותאמות אישית עם תוכן דינמי, כך שכל משתמש יקבל מידע רלוונטי בשפה שלו

#### Acceptance Criteria

1. WHEN defining an Action Key THEN the system SHALL allow specifying notification content templates with placeholders
2. THE system SHALL support multilingual notification content with separate templates for Hebrew, English, and Arabic
3. WHEN generating notification content THEN the system SHALL replace placeholders with actual data from the action context
4. WHEN rendering email notifications THEN the system SHALL use Svelte components with props: head, body, username, previewText, and lang
5. THE system SHALL support notification metadata including: title object with language keys, body object with language keys, project picture URL, and action-specific data
6. WHEN a user's language is not Hebrew or English THEN the system SHALL fall back to the action initiator's language
7. THE system SHALL allow Action Keys to specify custom notification templates beyond the default SimpleNuti template
