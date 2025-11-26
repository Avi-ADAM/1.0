# Task 27 Complete: Create Haluka & Tosplit Actions

## Summary

Successfully implemented action configurations for the haluka/tosplit profit distribution system.

## What Was Implemented

### 1. createHaluka Action (`src/lib/server/actions/configs/createHaluka.ts`)

**Purpose**: Create individual transfer (haluka) from one user to another

**Key Features**:
- ✅ Parameter validation (project, usersend, userrecive, amount)
- ✅ Authorization (JWT + project membership)
- ✅ Validates sender ≠ receiver
- ✅ Validates amount > 0
- ❌ **No notifications** (to avoid duplicates when creating multiple halukot)

**QIDS**: `69createHaluka`

### 2. createTosplit Action (`src/lib/server/actions/configs/createTosplit.ts`)

**Purpose**: Create complete profit distribution proposal requiring votes

**Key Features**:
- ✅ Parameter validation (project, halukas, hervachti, vots)
- ✅ Authorization (JWT + project membership)
- ✅ **Full notification support**:
  - Recipients: All project members
  - excludeSender: true (don't notify creator)
  - Channels: socket, email, telegram, push
  - Priority: high (requires action)
  - Message: "הוגשה הצעה חדשה לחלוקת רווחים. היכנס ללב כדי להצביע"
  - URL: Links to `lev` page for voting

**QIDS**: `70.5createTosplit` (newly created)

## Architecture Decision

### Why Two Separate Actions?

1. **createHaluka** - Building block
   - Created multiple times in a loop
   - No notifications to avoid spam
   - Part of larger tosplit

2. **createTosplit** - Complete proposal
   - Created once per distribution
   - Sends ONE notification to all members
   - Requires voting from all participants

### Notification Flow

```
User creates profit distribution:
├─> Loop: Create haluka #1 (no notification)
├─> Loop: Create haluka #2 (no notification)
├─> Loop: Create haluka #3 (no notification)
└─> Create tosplit (ONE notification to all members)
    └─> "Go to Lev to vote!"
```

## Files Modified

1. **New Files**:
   - `src/lib/server/actions/configs/createHaluka.ts`
   - `src/lib/server/actions/configs/createTosplit.ts`

2. **Modified Files**:
   - `src/routes/api/send/qids.js` - Added `70.5createTosplit` query
   - `src/lib/server/actions/registry.ts` - Registered both actions

## Testing

✅ All tests passing:
- Registry tests: 16/16 passed
- ActionService tests: 14/14 passed
- No TypeScript diagnostics errors

## Next Steps

To use these actions in the application:

1. Replace the manual GraphQL calls in `whowhat.svelte` with action calls
2. Use `executeAction('createHaluka', { data: {...} })` for each transfer
3. Use `executeAction('createTosplit', { data: {...} })` for the complete proposal
4. Notifications will be sent automatically to all project members

## Related Actions

- **approveHaluka** - Already implemented, handles voting and approval
- **updateTosplit** - Already exists (QIDS 68)
- **updateHaluka** - Already exists (QIDS 70)

## Requirements Satisfied

- ✅ Requirement 8.1: Action defined in single configuration file
- ✅ Requirement 8.2: Complete configuration with all required fields
- ✅ Requirement 5.2: Notification rules properly evaluated
- ✅ Requirement 6.1: Multi-channel notifications
- ✅ Requirement 6.2: User language preferences respected
- ✅ Requirement 6.3: noMail flag filtering
- ✅ Requirement 6.4: telegramId filtering
