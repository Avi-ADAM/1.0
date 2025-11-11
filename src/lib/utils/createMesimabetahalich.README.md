# createMesimabetahalich Utility

## Overview
Utility functions for creating a mesimabetahalich (mission in progress) from an open mission using the secure `sendToSer` API pattern.

## Security
✅ **Token never exposed to client** - All API calls go through `/api/send` which handles JWT from httpOnly cookies
✅ **Centralized validation** - All queries validated through `qids.js`
✅ **Type-safe parameters** - Structured arguments prevent injection attacks

## Functions

### `createMesimabetahalich(params)`
Creates a mesimabetahalich and handles all related mutations.

**Use Cases:**
- Single user in project wants to perform mission (no voting)
- All project users voted to approve mission
- Converting open mission to in-progress mission

**Parameters:**
- `projectId` - Project ID
- `missId` - Mission ID (from mission.data.id, not openMission.id)
- `openMid` - Open mission ID
- `askId` - Ask ID (optional, for voting)
- `userId` - User who will perform mission
- `currentUserId` - Current logged in user
- `openmissionName` - Mission name
- `missionDetails` - Mission description
- `nhours` - Hours assigned
- `valph` - Value per hour
- `iskvua` - Is scheduled/recurring
- `hearotMeyuchadot` - Special notes
- `privatlinks` - Private links
- `publicklinks` - Public links
- `tafkidims` - Array of role objects/IDs
- `deadline` - Deadline date (optional)
- `sqedualed` - Scheduled start date (optional)
- `timegramaId` - Timegrama ID (optional)
- `projectUserIds` - Array of project user IDs
- `userss` - Current votes array (optional)
- `sendToSer` - sendToSer function reference

**Returns:** Promise<Object> with structure:
```javascript
{
  data: {
    createMesimabetahalich: { data: { id, attributes: {...} } },
    updateOpenMission: { data: { attributes: { acts, asks } } }
  }
}
```

### `afterMesimabetahalikhCreation(params)`
Handles post-creation tasks.

**Tasks:**
1. Creates monter if `iskvua === true`
2. Archives other asks
3. Sends email if new user
4. Updates acts with mesimabetahalich reference

**Parameters:**
- `miDatan` - Result from createMesimabetahalich
- `isNewUser` - Whether user is new to project
- `iskvua` - Is scheduled/recurring
- `sqedualed` - Scheduled start date
- `deadline` - Deadline date
- `userId` - User ID
- `currentUserId` - Current logged in user ID
- `useraplyname` - User display name
- `projectName` - Project name
- `src2` - Project image URL
- `openmissionName` - Mission name
- `lang` - Language code
- `sendToSer` - sendToSer function reference
- `projectUserData` - Project user data (optional, for email)

## Related Queries (qids.js)

- `72createMesimabetahalich` - Creates mesimabetahalich
- `73archiveOpenMission` - Archives open mission
- `74addUserToProject` - Adds user to project
- `75createWelcomeTop` - Creates welcome notification
- `76archiveAsk` - Archives ask with votes
- `77createMonter` - Creates recurring task monitor
- `31updateTask` - Updates task with mesimabetahalich reference
- `35updateTimeGrama` - Updates timegrama status

## Example Usage

```javascript
import { createMesimabetahalich, afterMesimabetahalikhCreation } from '$lib/utils/createMesimabetahalich.js';
import { sendToSer } from '$lib/send/sendToSer.js';

// Create mesimabetahalich
const result = await createMesimabetahalich({
  projectId: '75',
  missId: '203',
  openMid: '456',
  userId: '1',
  currentUserId: '1',
  openmissionName: 'Build feature',
  missionDetails: 'Description here',
  nhours: 10,
  valph: 50,
  iskvua: false,
  hearotMeyuchadot: '',
  privatlinks: '',
  publicklinks: '',
  tafkidims: [{ id: '1' }, { id: '2' }],
  deadline: null,
  sqedualed: null,
  projectUserIds: ['1'],
  sendToSer
});

// Handle post-creation
await afterMesimabetahalikhCreation({
  miDatan: result,
  isNewUser: false,
  iskvua: false,
  sqedualed: null,
  deadline: null,
  userId: '1',
  currentUserId: '1',
  useraplyname: 'John Doe',
  projectName: 'My Project',
  src2: 'https://...',
  openmissionName: 'Build feature',
  lang: 'he',
  sendToSer,
  projectUserData: null
});
```

## Migration Notes

**Before (Direct GraphQL):**
- Token passed from client
- Complex mutation string building
- Direct fetch to GraphQL endpoint

**After (sendToSer Pattern):**
- Token handled server-side
- Structured parameters
- Multiple smaller queries
- Better error handling
- Centralized validation

## Testing

Test both scenarios:
1. **Single user** - User alone in project
2. **All approved** - All users voted yes

Verify:
- Mesimabetahalich created
- Open mission archived
- Welcome created (if new user)
- User added to project (if new)
- Ask archived (if voting)
- Monter created (if iskvua)
- Acts updated
