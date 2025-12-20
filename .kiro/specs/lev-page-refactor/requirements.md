# Requirements Document - Lev Page Refactor

## Introduction

עמוד הלב הוא המסך המרכזי של המערכת, אך כיום הוא סובל מבעיות ארכיטקטוניות משמעותיות:
- כל הלוגיקה והעיבוד נמצאים בקובץ אחד ענק (+page.svelte)
- אין הפרדה ברורה בין raw data ל-processed data
- עדכונים חלקיים דורשים רענון מלא של כל הנתונים
- קשה לתחזק ולהוסיף פיצ'רים חדשים
- אין שימוש במערכת הפעולות המאוחדת החדשה

המטרה היא לבנות ארכיטקטורה מודרנית מבוססת stores, derived stores, ואינטגרציה מלאה עם מערכת הפעולות המאוחדת.

## Glossary

- **Raw Store** - Store שמכיל נתונים גולמיים כפי שהתקבלו מהשרת
- **Derived Store** - Store מחושב שמעבד raw data לפורמט מוכן לתצוגה
- **Processor Function** - פונקציה טהורה שמקבלת raw data ומחזירה processed data
- **arr1** - המערך המאוחד הנוכחי שמכיל את כל האובייקטים להצגה
- **finalSwiperArray** - המערך החדש המחושב שיחליף את arr1
- **Snapshot** - שמירת מצב ל-localStorage לטעינה מהירה
- **Partial Update** - עדכון של חלק מהנתונים בלבד במקום רענון מלא
- **Socket Handler** - מטפל באירועי socket לעדכונים בזמן אמת
- **Coin View** - תצוגת מטבעות (התצוגה הקיימת)
- **Card View** - תצוגת קלפים (Swiper)

## Requirements

### Requirement 1

**User Story:** כמפתח, אני רוצה להפריד בין raw data ל-processed data, כך שהקוד יהיה מסודר וקל לתחזוקה

#### Acceptance Criteria

1. WHEN the system receives data from GraphQL THEN the system SHALL store it in dedicated raw stores without processing
2. THE system SHALL provide separate stores for each data type: user, projects, tasks, budgets, notes, messages, asks, halukas, negotiations
3. WHEN raw data changes THEN the system SHALL automatically trigger recomputation of derived stores
4. THE system SHALL maintain a clear separation between data fetching and data processing
5. WHEN a developer needs to add a new data type THEN the system SHALL allow adding a new raw store without modifying existing code

### Requirement 2

**User Story:** כמפתח, אני רוצה שכל העיבודים יהיו בפונקציות טהורות, כך שהקוד יהיה testable ו-predictable

#### Acceptance Criteria

1. WHEN processing raw data THEN the system SHALL use pure functions that receive input and return output without side effects
2. THE system SHALL provide processor functions for each data type: processTasks, processBudgets, processNotes, processMessages, processAsks
3. WHEN a processor function runs THEN the system SHALL not modify the input data
4. WHEN the same input is provided THEN the processor SHALL always return the same output
5. THE system SHALL allow testing processor functions in isolation without mocking

### Requirement 3

**User Story:** כמפתח, אני רוצה derived store אחד שמאחד את כל הנתונים, כך שהקומפוננטות יקבלו מערך מוכן לתצוגה

#### Acceptance Criteria

1. WHEN all raw stores are populated THEN the system SHALL compute a finalSwiperArray derived store
2. THE finalSwiperArray SHALL contain all objects from all data types merged and sorted by priority
3. WHEN any raw store changes THEN the finalSwiperArray SHALL automatically recompute
4. THE finalSwiperArray SHALL replace the current arr1 array
5. WHEN a component subscribes to finalSwiperArray THEN the component SHALL receive updates only when the array actually changes

### Requirement 4

**User Story:** כמשתמש, אני רוצה שהעמוד ייטען מהר, כך שלא אצטרך לחכות לשרת בכל פעם

#### Acceptance Criteria

1. WHEN the page loads THEN the system SHALL first try to restore data from localStorage snapshot
2. WHEN a snapshot exists and is valid THEN the system SHALL display it immediately before fetching from server
3. WHEN fetching from server completes THEN the system SHALL update the stores and save a new snapshot
4. THE system SHALL include a version number in snapshots to invalidate old data structures
5. WHEN the code version changes THEN the system SHALL ignore old snapshots and fetch fresh data

### Requirement 5

**User Story:** כמשתמש, אני רוצה לקבל עדכונים בזמן אמת רק על מה שהשתנה, כך שהעמוד לא ירענן כל הזמן

#### Acceptance Criteria

1. WHEN a socket event arrives THEN the system SHALL identify which raw store needs updating
2. WHEN updating a raw store THEN the system SHALL update only the specific item that changed
3. WHEN an item is updated THEN the system SHALL merge the update with existing data
4. WHEN an item is new THEN the system SHALL add it to the appropriate raw store
5. WHEN an item is deleted THEN the system SHALL remove it from the appropriate raw store

### Requirement 6

**User Story:** כמפתח, אני רוצה שהקומפוננטות יהיו פשוטות ויקבלו רק props, כך שהן יהיו reusable

#### Acceptance Criteria

1. WHEN a component renders THEN the component SHALL receive all data via props
2. THE component SHALL not directly access stores or perform data fetching
3. WHEN a component needs to trigger an action THEN the component SHALL use callbacks passed via props
4. THE component SHALL not contain business logic or data processing
5. WHEN switching between coin and card views THEN the same components SHALL be reused with different props

### Requirement 7

**User Story:** כמפתח, אני רוצה לשלב את מערכת הפעולות המאוחדת, כך שכל הפעולות יעברו דרך actionClient

#### Acceptance Criteria

1. WHEN a user performs an action THEN the system SHALL use actionClient.execute instead of direct API calls
2. WHEN an action completes THEN the system SHALL receive an updateStrategy from the server
3. WHEN updateStrategy is fullRefresh THEN the system SHALL refetch all data
4. WHEN updateStrategy is partialUpdate THEN the system SHALL update only the specified stores
5. WHEN updateStrategy is optimistic THEN the system SHALL update the UI immediately without waiting for server

### Requirement 8

**User Story:** כמפתח, אני רוצה שהסוקט יעבוד עם המערכת החדשה, כך שעדכונים יגיעו דרך socketClient

#### Acceptance Criteria

1. WHEN the page loads THEN the system SHALL use the socketClient from layout instead of creating a new socket
2. WHEN a notification arrives via socketClient THEN the system SHALL handle it according to the updateStrategy
3. WHEN multiple notifications arrive THEN the system SHALL batch updates to avoid multiple re-renders
4. THE system SHALL remove the old socket.io code from +page.svelte
5. WHEN a socket disconnects THEN the system SHALL continue working with cached data

### Requirement 9

**User Story:** כמפתח, אני רוצה מבנה קבצים ברור, כך שאדע איפה למצוא כל דבר

#### Acceptance Criteria

1. THE system SHALL organize stores in src/lib/stores/levStores.ts for raw stores
2. THE system SHALL organize derived stores in src/lib/stores/levDerived.ts
3. THE system SHALL organize processors in src/lib/utils/levProcessors.ts
4. THE system SHALL keep GraphQL queries in src/lib/utils/levGraphQLQueries.ts
5. THE system SHALL maintain the existing component structure in src/lib/components/lev/

### Requirement 10

**User Story:** כמפתח, אני רוצה למגר בהדרגה, כך שהמערכת תמשיך לעבוד בזמן המעבר

#### Acceptance Criteria

1. WHEN implementing the new architecture THEN the system SHALL work alongside the old code
2. THE system SHALL allow switching between old and new implementations via feature flag
3. WHEN a bug is found in the new implementation THEN the system SHALL allow reverting to the old code
4. THE system SHALL provide migration metrics to track progress
5. WHEN migration is complete THEN the system SHALL allow removing the old code safely

### Requirement 11

**User Story:** כמפתח, אני רוצה שהקוד יהיה מתועד, כך שמפתחים אחרים יבינו איך להשתמש בו

#### Acceptance Criteria

1. WHEN creating a new store THEN the system SHALL include JSDoc comments explaining its purpose
2. WHEN creating a processor function THEN the system SHALL document input and output types
3. THE system SHALL provide examples of how to add new data types
4. THE system SHALL document the flow from raw data to final display
5. THE system SHALL include a migration guide for developers

### Requirement 12

**User Story:** כמפתח, אני רוצה שהמערכת תהיה performant, כך שהיא תוכל להתמודד עם הרבה נתונים

#### Acceptance Criteria

1. WHEN processing data THEN the system SHALL avoid unnecessary recomputations
2. WHEN a derived store recomputes THEN the system SHALL only recompute if dependencies actually changed
3. THE system SHALL use memoization for expensive computations
4. WHEN rendering the UI THEN the system SHALL use keys to avoid re-rendering unchanged items
5. THE system SHALL measure and log performance metrics for optimization

### Requirement 13

**User Story:** כמשתמש, אני רוצה שהמעבר יהיה שקוף, כך שלא אשים לב לשינויים

#### Acceptance Criteria

1. WHEN the new architecture is deployed THEN the UI SHALL look and behave exactly the same
2. WHEN switching between views THEN the transition SHALL be smooth without flickering
3. WHEN data updates THEN the update SHALL be seamless without page refresh
4. THE system SHALL maintain all existing features and functionality
5. WHEN an error occurs THEN the system SHALL show the same error messages as before
