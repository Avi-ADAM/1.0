# Process Chain — Data Model Reference

## Entity hierarchy (mission lifecycle)

```
pendm (pending_missions)
  └─► openMission (open_missions)
        └─► asks[]           ← JOIN REQUESTS on the open mission
        └─► mesimabetahalich (in-progress)
              └─► finiapruvals[]
              └─► forums[]
              └─► finnished_mission (lazy-loaded)
```

## Field paths per entity (Strapi v4 format)

### pendm (`pending_missions`)
| Field | Path |
|-------|------|
| name | `pendm.attributes.name` |
| archived | `pendm.attributes.archived` |

### openMission (`open_missions`)
| Field | Path |
|-------|------|
| name | `openMission.attributes.name` |
| archived | `openMission.attributes.archived` |
| **asks** | **`openMission.attributes.asks.data`** — array of ask entities |

> **Key rule:** Asks (join requests) belong to `openMission`, not to `pendm`.
> Always access via `openMission.attributes.asks.data`.

### ask entity (inside `openMission.attributes.asks.data[]`)
| Field | Path |
|-------|------|
| ask ID | `ask.id` |
| user ID | `ask.attributes.users_permissions_user.data.id` |
| username | `ask.attributes.users_permissions_user.data.attributes.username` |
| profile pic | `ask.attributes.users_permissions_user.data.attributes.profilePic.data.attributes.url` |
| forum ID | `ask.attributes.forums.data[0].id` (`forums` = relation, not `chat`) |
| archived | `ask.attributes.archived` |
| back-ref to mission | `ask.attributes.open_mission.data.id` |
| **chat** field | `chat` הוא `ComponentProjectsVots[]` — component של votes, **לא** forum. לא להשתמש לפתיחת צ׳אט |

### mesimabetahalich (`mesimabetahaliches`)
| Field | Path |
|-------|------|
| name | `mesimabetahalich.attributes.name` |
| status (`'active'` or other) | `mesimabetahalich.attributes.status` |
| assigned user | `mesimabetahalich.attributes.users_permissions_user.data` |
| forums | `mesimabetahalich.attributes.forums.data` (array) |
| linked open_missions | `mesimabetahalich.attributes.open_missions.data` (manyToMany) |
| finiapruvals | `mesimabetahalich.attributes.finiapruvals.data` (array) |

### act (`acts`)
| Field | Path |
|-------|------|
| linked pendm | `act.attributes.pendm.data.id` |
| linked open_mission | `act.attributes.open_mission.data.id` |
| linked mesimabetahalich | `act.attributes.mesimabetahaliches.data[0].id` |

### finnished_mission (lazy-loaded via `handleLazyLoad`)
| Field | Path |
|-------|------|
| mission name | `finnished_mission.attributes.missionName` |
| linked mesimabetahalich | `finnished_mission.attributes.mesimabetahalich.data.id` |

## Resource chain entities

```
openMashaabim (open_mashaabim)
  └─► pmash
  └─► askms[]
  └─► maap
  └─► rikmashes[]
```

## Chain reconstruction (reconstructChains.js)

`reconstructMissionChains(pmiData, omiData, bmiData, fmiData, acts)` returns `MissionChain[]`:
- Links open_missions to pendms via acts cross-reference (not a direct FK)
- Links mesimabetahalich to chain via `open_missions.data[0].id` (primary) or acts (fallback)
- `finnishedMissionId` is set but entity is NOT loaded — call `handleLazyLoad(id)` to fetch

`reconstructResourceChains(opmash, rikmashes)` returns `ResourceChain[]`:
- All nested relations come from `open_mashaabim.attributes.*`

## Component tree

```
ProcessChainView (top-level, receives all flat arrays)
  ├─ MissionChainRow  (one per chain, collapsed strip + expanded detail)
  │    ├─ ChainNode   (pendm / openMission / mesimabetahalich / finiapruval / finnished)
  │    ├─ AsksNode    (expandable badge listing asks from openMission)
  │    ├─ ActsGroup   (lists acts)
  │    └─ ChainConnector (arrow between nodes)
  └─ ResourceChainRow
```
