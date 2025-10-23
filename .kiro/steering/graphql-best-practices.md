---
inclusion: always
---

# GraphQL Best Practices with sendToSer

## Using sendToSer for GraphQL Queries

The `sendToSer.js` utility in `src/lib/send/sendToSer.js` is the recommended way to interact with our GraphQL server. It provides a consistent interface for making API calls.

### Basic Usage

```javascript
import { sendToSer } from '$lib/send/sendToSer.js';

// Example usage
const result = await sendToSer(
  { uid: userId }, // variables
  "64getUserProjectList", // query ID from qids.js
  0, // me parameter
  0, // project parameter
  false, // isSer flag
  fetch // fetch function
);
```

### GraphQL Schema Structure

When writing GraphQL queries, use the correct schema structure:

#### User Projects Structure
- `projects_1s` - User's projects (correct field name)

#### Correct Query Pattern
```graphql
query GetUserProjectList($uid: ID!) {
  usersPermissionsUser(id: $uid) {
    data {
      attributes {
        projects_1s {
          data {
            id
            attributes {
              projectName
              profilePic {
                data {
                  attributes {
                    url
                  }
                }
              }
              createdAt
            }
          }
        }
      }
    }
  }
}
```

### Common Mistakes to Avoid

1. **Wrong field names**: Use `projects_1s`, not `projectcreates` or `projectmembers`
2. **Missing nested structure**: Always include the full `data.attributes` path
3. **Inconsistent query structure**: Follow the established pattern from working queries

### Query Storage

All GraphQL queries should be stored in `src/routes/api/send/qids.js` with descriptive IDs for easy reference.