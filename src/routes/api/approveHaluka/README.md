# Approve Haluka API

## Overview

This API endpoint handles the approval of a haluka (division) when all participants agree. It replaces the old inline GraphQL mutations with a clean, centralized approach.

## What Happens When a Haluka is Approved

1. **Update Tosplit**: Marks the tosplit as `finished: true` and adds all votes
2. **Update Sales**: Marks all related sales as `splited: true`
3. **Update Halukot**: Marks all individual halukot as `ushar: true` (approved)
4. **Send Notifications**: Sends customized notifications to all participants via:
   - Socket.IO (real-time updates)
   - Email (with beautiful HTML template)
   - Telegram (if user has telegramId)
   - Push notifications (to all user devices)

## Notification Customization

The system sends **different notifications** based on whether the user is receiving or giving money:

### For Users Receiving Money 🎉
- **Title**: "מזל טוב! קיבלת X ש״ח" (with confetti emoji)
- **Email**: Beautiful gradient design with confetti animation
- **Tone**: Celebratory and exciting

### For Users Giving Money 📋
- **Title**: "חלוקה אושרה - X ש״ח"
- **Email**: Professional, formal design
- **Tone**: Respectful and informative

## API Usage

### Endpoint
```
POST /api/approveHaluka
```

### Request Body
```json
{
  "tosplitId": "123",
  "userId": "456",
  "users": [
    { "id": "456" },
    { "id": "789" }
  ],
  "halukot": [
    {
      "id": "1",
      "noten": true,
      "mekabel": false,
      "amount": 100,
      "users_permissions_user": {
        "data": { "id": "456" }
      }
    },
    {
      "id": "2",
      "noten": false,
      "mekabel": true,
      "amount": 100,
      "users_permissions_user": {
        "data": { "id": "789" }
      }
    }
  ],
  "sales": []
}
```

### Response
```json
{
  "success": true,
  "data": {
    "updateTosplit": {
      "data": {
        "id": "123",
        "attributes": {
          "vots": [...],
          "sales": {
            "data": [...]
          }
        }
      }
    }
  }
}
```

## GraphQL Queries Used

The endpoint uses the following QIDS:

- **79approveTosplit**: Updates tosplit with votes and marks as finished
- **80updateSale**: Marks a sale as splited
- **81updateHaluka**: Marks a haluka as ushar (approved)

## Migration from Old Code

### Before (in halukaask.svelte)
```javascript
// 200+ lines of inline GraphQL mutations
await fetch(linkg, {
  method: 'POST',
  body: JSON.stringify({
    query: `mutation { updateTosplit(...) }`
  })
});
// Then manually update each sale...
// Then manually update each haluka...
// No notifications!
```

### After
```javascript
// Clean, simple API call
const response = await fetch('/api/approveHaluka', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tosplitId, userId, users, halukot, sales
  })
});
// Everything handled automatically + beautiful notifications!
```

## Benefits

1. **Cleaner Code**: Component code reduced from 200+ lines to ~20 lines
2. **Better UX**: Automatic notifications in all channels
3. **Customized Messages**: Different messages for givers vs receivers
4. **Maintainable**: All logic in one place
5. **Testable**: Easy to test server-side logic
6. **Scalable**: Can add more features without touching component

## Future Enhancements

- [ ] Add notification preferences (let users choose channels)
- [ ] Add digest notifications (batch multiple updates)
- [ ] Add notification history
- [ ] Add undo functionality
- [ ] Add analytics tracking
