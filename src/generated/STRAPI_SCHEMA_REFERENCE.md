# Strapi GraphQL Schema Reference
> Auto-generated from `src/generated/graphql.ts`
> Last updated: 2026-02-24
> Source: `codegen.ts` → `http://localhost:1337/graphql`

This file provides a compact reference of all types available from the Strapi backend.
AI agents should use this to validate that code follows the correct schema.

---

## 📋 How to Use These Types

```typescript
// Import types from the generated file
import type { UsersPermissionsUser, Project, Act } from '$generated/graphql';

// Or from the index
import type { UsersPermissionsUser } from '../generated/graphql';

// Use with Strapi helpers from src/lib/types/strapiTypes.ts
import type { StrapiEntity, StrapiCollection, StrapiMedia } from '$lib/types/strapiTypes';
```

---

## 🏗️ Content Type Entities (95)

These are the main content types in the Strapi backend.

### Act
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `dateF` | `Maybe<Scalars['DateTime']['output']>` |
| `dateS` | `Maybe<Scalars['DateTime']['output']>` |
| `des` | `Maybe<Scalars['String']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `hashivut` | `Maybe<Enum_Act_Hashivut>` |
| `isAssigned` | `Maybe<Scalars['Boolean']['output']>` |
| `link` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<ActRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `my` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `myIshur` | `Maybe<Scalars['Boolean']['output']>` |
| `naasa` | `Maybe<Scalars['Boolean']['output']>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `pendm` | `Maybe<PendmEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `shem` | `Maybe<Scalars['String']['output']>` |
| `status` | `Maybe<Scalars['Int']['output']>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `taskdis` | `Maybe<Array<Maybe<ComponentProjectsTaskdis>>>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `timers` | `Maybe<TimerRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `userAndIshur` | `Maybe<Array<Maybe<ComponentNewUserAndIshur>>>` |
| `vali` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `valiIshur` | `Maybe<Scalars['Boolean']['output']>` |

### Actt
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `link` | `Maybe<Scalars['String']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Ask
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `chat` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Askm
| Field | Type |
|-------|------|
| `archived` | `Scalars['Boolean']['output']` |
| `chat` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sp` | `Maybe<SpEntityResponse>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Askwant
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `chat` | `Maybe<Array<Maybe<ComponentProjectsChatre>>>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Bakasha
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `furfiled` | `Maybe<Scalars['Boolean']['output']>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Category
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<CategoryRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Chezin
| Field | Type |
|-------|------|
| `countries` | `Maybe<CuntryRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `deffinitions` | `Maybe<DeffinitionRelationResponseCollection>` |
| `email` | `Scalars['String']['output']` |
| `fullAgreement` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<ChezinRelationResponseCollection>` |
| `myQuotes` | `Maybe<Scalars['String']['output']>` |
| `name` | `Scalars['String']['output']` |
| `noOpHours` | `Maybe<Scalars['Float']['output']>` |
| `phoneNumber` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `shekelsPerHoure` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ContentReleasesRelease
| Field | Type |
|-------|------|
| `actions` | `Maybe<ContentReleasesReleaseActionRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `name` | `Scalars['String']['output']` |
| `releasedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### ContentReleasesReleaseAction
| Field | Type |
|-------|------|
| `contentType` | `Scalars['String']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `entry` | `Maybe<GenericMorph>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `release` | `Maybe<ContentReleasesReleaseEntityResponse>` |
| `type` | `Enum_Contentreleasesreleaseaction_Type` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### ConventionText
| Field | Type |
|-------|------|
| `conventionText` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<ConventionTextRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `type` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Cuntry
| Field | Type |
|-------|------|
| `alpha2` | `Maybe<Scalars['String']['output']>` |
| `alpha3` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `deffinitions` | `Maybe<DeffinitionRelationResponseCollection>` |
| `flug` | `Maybe<UploadFileRelationResponseCollection>` |
| `free_people` | `Maybe<ChezinRelationResponseCollection>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<CuntryRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `signingNumber` | `Maybe<Scalars['Long']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### Dea
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `desc` | `Maybe<Scalars['JSON']['output']>` |
| `head` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `solutions` | `Maybe<SolutionRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |

### Deal
| Field | Type |
|-------|------|
| `costumers` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `salers` | `Maybe<ProjectRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Decision
| Field | Type |
|-------|------|
| `archived` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `decisionName` | `Maybe<Scalars['String']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `kind` | `Maybe<Enum_Decision_Kind>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `moreHours` | `Maybe<MesimabetahalichEntityResponse>` |
| `negodes` | `Maybe<Array<Maybe<ComponentProjectsNegodes>>>` |
| `newFlink` | `Maybe<Scalars['String']['output']>` |
| `newHours` | `Maybe<Scalars['Int']['output']>` |
| `newWlink` | `Maybe<Scalars['String']['output']>` |
| `newname` | `Maybe<Scalars['String']['output']>` |
| `newpic` | `Maybe<UploadFileEntityResponse>` |
| `newprides` | `Maybe<Scalars['String']['output']>` |
| `newpubdes` | `Maybe<Scalars['String']['output']>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `timtoM` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `valluesadd` | `Maybe<VallueRelationResponseCollection>` |
| `valluesles` | `Maybe<VallueRelationResponseCollection>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Deffinition
| Field | Type |
|-------|------|
| `countries` | `Maybe<CuntryRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `deffinitionName` | `Scalars['String']['output']` |
| `free_people` | `Maybe<ChezinRelationResponseCollection>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<DeffinitionRelationResponseCollection>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Filtertag
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<FiltertagRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `positions` | `Maybe<PositionRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### Finiapruval
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnished_mission` | `Maybe<FinnishedMissionEntityResponse>` |
| `iskvua` | `Maybe<Scalars['Boolean']['output']>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `missname` | `Maybe<Scalars['String']['output']>` |
| `month` | `Maybe<Scalars['Date']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `what` | `Maybe<UploadFileRelationResponseCollection>` |
| `why` | `Maybe<Scalars['String']['output']>` |

### FinnishedMission
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `finiapruvals` | `Maybe<FiniapruvalRelationResponseCollection>` |
| `finish` | `Maybe<Scalars['DateTime']['output']>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `idYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `isFinished` | `Maybe<Scalars['Boolean']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isglobal` | `Maybe<Scalars['Boolean']['output']>` |
| `iskvua` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<FinnishedMissionRelationResponseCollection>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `mission` | `Maybe<MissionEntityResponse>` |
| `missionName` | `Maybe<Scalars['String']['output']>` |
| `month` | `Maybe<Scalars['Date']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `what` | `Maybe<UploadFileRelationResponseCollection>` |
| `why` | `Maybe<Scalars['String']['output']>` |

### Forum
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `asks` | `Maybe<AskRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `decisions` | `Maybe<DecisionRelationResponseCollection>` |
| `done` | `Scalars['Boolean']['output']` |
| `forum_last_seens` | `Maybe<ForumLastSeenRelationResponseCollection>` |
| `haluka` | `Maybe<HalukaEntityResponse>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `messages` | `Maybe<MessageRelationResponseCollection>` |
| `pgisha` | `Maybe<PgishaEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `spec` | `Maybe<Enum_Forum_Spec>` |
| `subject` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### ForumLastSeen
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `lastReadAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Haamada
| Field | Type |
|-------|------|
| `amount` | `Maybe<Scalars['Float']['output']>` |
| `comition` | `Maybe<Scalars['Float']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `haamadapruv` | `Maybe<HaamadapruvEntityResponse>` |
| `isReturned` | `Scalars['Boolean']['output']` |
| `open_mashaabims` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `rikmashes` | `Maybe<RikmashRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Haamadapruv
| Field | Type |
|-------|------|
| `archived` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `haamada` | `Maybe<HaamadaEntityResponse>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Haluka
| Field | Type |
|-------|------|
| `amount` | `Maybe<Scalars['Float']['output']>` |
| `chatre` | `Maybe<Array<Maybe<ComponentProjectsChatre>>>` |
| `confirmed` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<HalukaRelationResponseCollection>` |
| `matbea` | `Maybe<MatbeaEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `senderconf` | `Maybe<Scalars['Boolean']['output']>` |
| `tosplit` | `Maybe<TosplitEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `userrecive` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `usersend` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `ushar` | `Maybe<Scalars['Boolean']['output']>` |
| `want` | `Maybe<WantEntityResponse>` |

### Hatzaa
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `perhoure` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `untilwhen` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Hazbaah
| Field | Type |
|-------|------|
| `approved` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |

### I18NLocale
| Field | Type |
|-------|------|
| `code` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Maap
| Field | Type |
|-------|------|
| `archived` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MaapRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `rikmash` | `Maybe<RikmashEntityResponse>` |
| `sp` | `Maybe<SpEntityResponse>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Machshir
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `jsoni` | `Maybe<Scalars['JSON']['output']>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Mashaabim
| Field | Type |
|-------|------|
| `bakashas` | `Maybe<BakashaRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `kindOf` | `Maybe<Enum_Mashaabim_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MashaabimRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `name` | `Scalars['String']['output']` |
| `negos` | `Maybe<NegoRelationResponseCollection>` |
| `open_mashaabims` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `pmashes` | `Maybe<PmashRelationResponseCollection>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
| `sps` | `Maybe<SpRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### Mashabetahalich
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `hoursassigned` | `Maybe<Scalars['Float']['output']>` |
| `howmanyhoursalready` | `Maybe<Scalars['Float']['output']>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `timers` | `Maybe<TimerRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Matanot
| Field | Type |
|-------|------|
| `appruved` | `Maybe<Scalars['Boolean']['output']>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `bakashas` | `Maybe<BakashaRelationResponseCollection>` |
| `categories` | `Maybe<CategoryRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `decision` | `Maybe<DecisionEntityResponse>` |
| `desc` | `Maybe<Scalars['JSON']['output']>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `fixPrice` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Matanot_Kindof>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MatanotRelationResponseCollection>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `maxsaleyearone` | `Maybe<Scalars['Float']['output']>` |
| `maxsaleyearsec` | `Maybe<Scalars['Float']['output']>` |
| `minsaleyearone` | `Maybe<Scalars['Float']['output']>` |
| `minsaleyearsec` | `Maybe<Scalars['Float']['output']>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `negos` | `Maybe<NegoRelationResponseCollection>` |
| `oneForeProject` | `Maybe<Scalars['Boolean']['output']>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `pic` | `Maybe<UploadFileEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `projectcreates` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `sale` | `Maybe<SaleRelationResponseCollection>` |
| `sales` | `Maybe<Scalars['Float']['output']>` |
| `sheirutpends` | `Maybe<SheirutpendRelationResponseCollection>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Matbea
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `halukas` | `Maybe<HalukaRelationResponseCollection>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MatbeaRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `simbol` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Mesimabetahalich
| Field | Type |
|-------|------|
| `activeTimer` | `Maybe<TimerEntityResponse>` |
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `admaticedai` | `Maybe<Scalars['DateTime']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `dates` | `Maybe<Scalars['DateTime']['output']>` |
| `decisions` | `Maybe<DecisionRelationResponseCollection>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `finiapruvals` | `Maybe<FiniapruvalRelationResponseCollection>` |
| `finnished` | `Maybe<Scalars['Boolean']['output']>` |
| `finnished_missions` | `Maybe<FinnishedMissionRelationResponseCollection>` |
| `forappruval` | `Maybe<Scalars['Boolean']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `hoursassinged` | `Maybe<Scalars['Float']['output']>` |
| `howmanyhoursalready` | `Maybe<Scalars['Float']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `isglobal` | `Maybe<Scalars['Boolean']['output']>` |
| `iskvua` | `Maybe<Scalars['Boolean']['output']>` |
| `mission` | `Maybe<MissionEntityResponse>` |
| `monter` | `Maybe<Array<Maybe<ComponentNewMonter>>>` |
| `monters` | `Maybe<MonterRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `privatlinks` | `Maybe<Scalars['String']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publicklinks` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `seeders` | `Maybe<SeederRelationResponseCollection>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `status` | `Maybe<Scalars['Int']['output']>` |
| `stname` | `Scalars['String']['output']` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `timegramas` | `Maybe<TimegramaRelationResponseCollection>` |
| `timer` | `Maybe<Scalars['Float']['output']>` |
| `timers` | `Maybe<TimerRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `zohars` | `Maybe<ZoharRelationResponseCollection>` |

### Message
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `content` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `editHistory` | `Maybe<Array<Maybe<ComponentNewEdits>>>` |
| `fid` | `Maybe<Scalars['Int']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `raplyTo` | `Maybe<MessageEntityResponse>` |
| `replys` | `Maybe<MessageRelationResponseCollection>` |
| `seen` | `Maybe<Array<Maybe<ComponentNewSeen>>>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `when` | `Maybe<Scalars['DateTime']['output']>` |

### Mission
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `finnished_missions` | `Maybe<FinnishedMissionRelationResponseCollection>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MissionRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `missionName` | `Scalars['String']['output']` |
| `negos` | `Maybe<NegoRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `work_ways` | `Maybe<WorkWayRelationResponseCollection>` |

### Mode
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sps` | `Maybe<SpRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `yat` | `Maybe<YatEntityResponse>` |

### Monter
| Field | Type |
|-------|------|
| `ani` | `Maybe<Scalars['String']['output']>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `done` | `Maybe<Scalars['Boolean']['output']>` |
| `finish` | `Maybe<Scalars['DateTime']['output']>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `sale` | `Maybe<SaleEntityResponse>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `want` | `Maybe<WantEntityResponse>` |

### Mutation
| Field | Type |
|-------|------|
| `changePassword` | `Maybe<UsersPermissionsLoginPayload>` |
| `createAct` | `Maybe<ActEntityResponse>` |
| `createActLocalization` | `Maybe<ActEntityResponse>` |
| `createActt` | `Maybe<ActtEntityResponse>` |
| `createAsk` | `Maybe<AskEntityResponse>` |
| `createAskm` | `Maybe<AskmEntityResponse>` |
| `createAskwant` | `Maybe<AskwantEntityResponse>` |
| `createBakasha` | `Maybe<BakashaEntityResponse>` |
| `createCategory` | `Maybe<CategoryEntityResponse>` |
| `createCategoryLocalization` | `Maybe<CategoryEntityResponse>` |
| `createChezin` | `Maybe<ChezinEntityResponse>` |
| `createChezinLocalization` | `Maybe<ChezinEntityResponse>` |
| `createContentReleasesRelease` | `Maybe<ContentReleasesReleaseEntityResponse>` |
| `createContentReleasesReleaseAction` | `Maybe<ContentReleasesReleaseActionEntityResponse>` |
| `createConventionText` | `Maybe<ConventionTextEntityResponse>` |
| `createConventionTextLocalization` | `Maybe<ConventionTextEntityResponse>` |
| `createCuntry` | `Maybe<CuntryEntityResponse>` |
| `createCuntryLocalization` | `Maybe<CuntryEntityResponse>` |
| `createDea` | `Maybe<DeaEntityResponse>` |
| `createDeal` | `Maybe<DealEntityResponse>` |
| `createDecision` | `Maybe<DecisionEntityResponse>` |
| `createDeffinition` | `Maybe<DeffinitionEntityResponse>` |
| `createDeffinitionLocalization` | `Maybe<DeffinitionEntityResponse>` |
| `createFiltertag` | `Maybe<FiltertagEntityResponse>` |
| `createFiltertagLocalization` | `Maybe<FiltertagEntityResponse>` |
| `createFiniapruval` | `Maybe<FiniapruvalEntityResponse>` |
| `createFinnishedMission` | `Maybe<FinnishedMissionEntityResponse>` |
| `createFinnishedMissionLocalization` | `Maybe<FinnishedMissionEntityResponse>` |
| `createForum` | `Maybe<ForumEntityResponse>` |
| `createForumLastSeen` | `Maybe<ForumLastSeenEntityResponse>` |
| `createHaamada` | `Maybe<HaamadaEntityResponse>` |
| `createHaamadapruv` | `Maybe<HaamadapruvEntityResponse>` |
| `createHaluka` | `Maybe<HalukaEntityResponse>` |
| `createHalukaLocalization` | `Maybe<HalukaEntityResponse>` |
| `createHatzaa` | `Maybe<HatzaaEntityResponse>` |
| `createHazbaah` | `Maybe<HazbaahEntityResponse>` |
| `createMaap` | `Maybe<MaapEntityResponse>` |
| `createMaapLocalization` | `Maybe<MaapEntityResponse>` |
| `createMachshir` | `Maybe<MachshirEntityResponse>` |
| `createMashaabim` | `Maybe<MashaabimEntityResponse>` |
| `createMashaabimLocalization` | `Maybe<MashaabimEntityResponse>` |
| `createMashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `createMatanot` | `Maybe<MatanotEntityResponse>` |
| `createMatanotLocalization` | `Maybe<MatanotEntityResponse>` |
| `createMatbea` | `Maybe<MatbeaEntityResponse>` |
| `createMatbeaLocalization` | `Maybe<MatbeaEntityResponse>` |
| `createMesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `createMessage` | `Maybe<MessageEntityResponse>` |
| `createMission` | `Maybe<MissionEntityResponse>` |
| `createMissionLocalization` | `Maybe<MissionEntityResponse>` |
| `createMode` | `Maybe<ModeEntityResponse>` |
| `createMonter` | `Maybe<MonterEntityResponse>` |
| `createNego` | `Maybe<NegoEntityResponse>` |
| `createNegoMash` | `Maybe<NegoMashEntityResponse>` |
| `createNegopendmission` | `Maybe<NegopendmissionEntityResponse>` |
| `createNegotiation` | `Maybe<NegotiationEntityResponse>` |
| `createOpenMashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `createOpenMashaabimLocalization` | `Maybe<OpenMashaabimEntityResponse>` |
| `createOpenMission` | `Maybe<OpenMissionEntityResponse>` |
| `createOpenMissionLocalization` | `Maybe<OpenMissionEntityResponse>` |
| `createPartof` | `Maybe<PartofEntityResponse>` |
| `createPendm` | `Maybe<PendmEntityResponse>` |
| `createPgisha` | `Maybe<PgishaEntityResponse>` |
| `createPgishaLocalization` | `Maybe<PgishaEntityResponse>` |
| `createPgishauser` | `Maybe<PgishauserEntityResponse>` |
| `createPgishauserpend` | `Maybe<PgishauserpendEntityResponse>` |
| `createPmash` | `Maybe<PmashEntityResponse>` |
| `createPosition` | `Maybe<PositionEntityResponse>` |
| `createProject` | `Maybe<ProjectEntityResponse>` |
| `createProjectLocalization` | `Maybe<ProjectEntityResponse>` |
| `createRatson` | `Maybe<RatsonEntityResponse>` |
| `createRatsonLocalization` | `Maybe<RatsonEntityResponse>` |
| `createRichtext` | `Maybe<RichtextEntityResponse>` |
| `createRichtextLocalization` | `Maybe<RichtextEntityResponse>` |
| `createRikmash` | `Maybe<RikmashEntityResponse>` |
| `createSale` | `Maybe<SaleEntityResponse>` |
| `createSeeder` | `Maybe<SeederEntityResponse>` |
| `createSheirut` | `Maybe<SheirutEntityResponse>` |
| `createSheirutLocalization` | `Maybe<SheirutEntityResponse>` |
| `createSheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `createSheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `createSheirutpendLocalization` | `Maybe<SheirutpendEntityResponse>` |
| `createSidur` | `Maybe<SidurEntityResponse>` |
| `createSkill` | `Maybe<SkillEntityResponse>` |
| `createSkillLocalization` | `Maybe<SkillEntityResponse>` |
| `createSolution` | `Maybe<SolutionEntityResponse>` |
| `createSp` | `Maybe<SpEntityResponse>` |
| `createSpLocalization` | `Maybe<SpEntityResponse>` |
| `createTafkidim` | `Maybe<TafkidimEntityResponse>` |
| `createTafkidimLocalization` | `Maybe<TafkidimEntityResponse>` |
| `createTikunolam` | `Maybe<TikunolamEntityResponse>` |
| `createTikunolamLocalization` | `Maybe<TikunolamEntityResponse>` |
| `createTimegrama` | `Maybe<TimegramaEntityResponse>` |
| `createTimer` | `Maybe<TimerEntityResponse>` |
| `createTimerLocalization` | `Maybe<TimerEntityResponse>` |
| `createTosplit` | `Maybe<TosplitEntityResponse>` |
| `createTosplitLocalization` | `Maybe<TosplitEntityResponse>` |
| `createTranslate` | `Maybe<TranslateEntityResponse>` |
| `createUploadFile` | `Maybe<UploadFileEntityResponse>` |
| `createUploadFolder` | `Maybe<UploadFolderEntityResponse>` |
| `createUsersPermissionsRole` | `Maybe<UsersPermissionsCreateRolePayload>` |
| `createUsersPermissionsUser` | `UsersPermissionsUserEntityResponse` |
| `createVallue` | `Maybe<VallueEntityResponse>` |
| `createVallueLocalization` | `Maybe<VallueEntityResponse>` |
| `createVote` | `Maybe<VoteEntityResponse>` |
| `createWant` | `Maybe<WantEntityResponse>` |
| `createWantLocalization` | `Maybe<WantEntityResponse>` |
| `createWelcomTop` | `Maybe<WelcomTopEntityResponse>` |
| `createWhatandwhyLocalization` | `Maybe<WhatandwhyEntityResponse>` |
| `createWorkWay` | `Maybe<WorkWayEntityResponse>` |
| `createWorkWayLocalization` | `Maybe<WorkWayEntityResponse>` |
| `createYat` | `Maybe<YatEntityResponse>` |
| `createZohar` | `Maybe<ZoharEntityResponse>` |
| `deleteAct` | `Maybe<ActEntityResponse>` |
| `deleteActt` | `Maybe<ActtEntityResponse>` |
| `deleteAsk` | `Maybe<AskEntityResponse>` |
| `deleteAskm` | `Maybe<AskmEntityResponse>` |
| `deleteAskwant` | `Maybe<AskwantEntityResponse>` |
| `deleteBakasha` | `Maybe<BakashaEntityResponse>` |
| `deleteCategory` | `Maybe<CategoryEntityResponse>` |
| `deleteChezin` | `Maybe<ChezinEntityResponse>` |
| `deleteContentReleasesRelease` | `Maybe<ContentReleasesReleaseEntityResponse>` |
| `deleteContentReleasesReleaseAction` | `Maybe<ContentReleasesReleaseActionEntityResponse>` |
| `deleteConventionText` | `Maybe<ConventionTextEntityResponse>` |
| `deleteCuntry` | `Maybe<CuntryEntityResponse>` |
| `deleteDea` | `Maybe<DeaEntityResponse>` |
| `deleteDeal` | `Maybe<DealEntityResponse>` |
| `deleteDecision` | `Maybe<DecisionEntityResponse>` |
| `deleteDeffinition` | `Maybe<DeffinitionEntityResponse>` |
| `deleteFiltertag` | `Maybe<FiltertagEntityResponse>` |
| `deleteFiniapruval` | `Maybe<FiniapruvalEntityResponse>` |
| `deleteFinnishedMission` | `Maybe<FinnishedMissionEntityResponse>` |
| `deleteForum` | `Maybe<ForumEntityResponse>` |
| `deleteForumLastSeen` | `Maybe<ForumLastSeenEntityResponse>` |
| `deleteHaamada` | `Maybe<HaamadaEntityResponse>` |
| `deleteHaamadapruv` | `Maybe<HaamadapruvEntityResponse>` |
| `deleteHaluka` | `Maybe<HalukaEntityResponse>` |
| `deleteHatzaa` | `Maybe<HatzaaEntityResponse>` |
| `deleteHazbaah` | `Maybe<HazbaahEntityResponse>` |
| `deleteMaap` | `Maybe<MaapEntityResponse>` |
| `deleteMachshir` | `Maybe<MachshirEntityResponse>` |
| `deleteMashaabim` | `Maybe<MashaabimEntityResponse>` |
| `deleteMashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `deleteMatanot` | `Maybe<MatanotEntityResponse>` |
| `deleteMatbea` | `Maybe<MatbeaEntityResponse>` |
| `deleteMesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `deleteMessage` | `Maybe<MessageEntityResponse>` |
| `deleteMission` | `Maybe<MissionEntityResponse>` |
| `deleteMode` | `Maybe<ModeEntityResponse>` |
| `deleteMonter` | `Maybe<MonterEntityResponse>` |
| `deleteNego` | `Maybe<NegoEntityResponse>` |
| `deleteNegoMash` | `Maybe<NegoMashEntityResponse>` |
| `deleteNegopendmission` | `Maybe<NegopendmissionEntityResponse>` |
| `deleteNegotiation` | `Maybe<NegotiationEntityResponse>` |
| `deleteOpenMashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `deleteOpenMission` | `Maybe<OpenMissionEntityResponse>` |
| `deletePartof` | `Maybe<PartofEntityResponse>` |
| `deletePendm` | `Maybe<PendmEntityResponse>` |
| `deletePgisha` | `Maybe<PgishaEntityResponse>` |
| `deletePgishauser` | `Maybe<PgishauserEntityResponse>` |
| `deletePgishauserpend` | `Maybe<PgishauserpendEntityResponse>` |
| `deletePmash` | `Maybe<PmashEntityResponse>` |
| `deletePosition` | `Maybe<PositionEntityResponse>` |
| `deleteProject` | `Maybe<ProjectEntityResponse>` |
| `deleteRatson` | `Maybe<RatsonEntityResponse>` |
| `deleteRichtext` | `Maybe<RichtextEntityResponse>` |
| `deleteRikmash` | `Maybe<RikmashEntityResponse>` |
| `deleteSale` | `Maybe<SaleEntityResponse>` |
| `deleteSeeder` | `Maybe<SeederEntityResponse>` |
| `deleteSheirut` | `Maybe<SheirutEntityResponse>` |
| `deleteSheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `deleteSheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `deleteSidur` | `Maybe<SidurEntityResponse>` |
| `deleteSkill` | `Maybe<SkillEntityResponse>` |
| `deleteSolution` | `Maybe<SolutionEntityResponse>` |
| `deleteSp` | `Maybe<SpEntityResponse>` |
| `deleteTafkidim` | `Maybe<TafkidimEntityResponse>` |
| `deleteTikunolam` | `Maybe<TikunolamEntityResponse>` |
| `deleteTimegrama` | `Maybe<TimegramaEntityResponse>` |
| `deleteTimer` | `Maybe<TimerEntityResponse>` |
| `deleteTosplit` | `Maybe<TosplitEntityResponse>` |
| `deleteTranslate` | `Maybe<TranslateEntityResponse>` |
| `deleteUploadFile` | `Maybe<UploadFileEntityResponse>` |
| `deleteUploadFolder` | `Maybe<UploadFolderEntityResponse>` |
| `deleteUsersPermissionsRole` | `Maybe<UsersPermissionsDeleteRolePayload>` |
| `deleteUsersPermissionsUser` | `UsersPermissionsUserEntityResponse` |
| `deleteVallue` | `Maybe<VallueEntityResponse>` |
| `deleteVote` | `Maybe<VoteEntityResponse>` |
| `deleteWant` | `Maybe<WantEntityResponse>` |
| `deleteWelcomTop` | `Maybe<WelcomTopEntityResponse>` |
| `deleteWhatandwhy` | `Maybe<WhatandwhyEntityResponse>` |
| `deleteWorkWay` | `Maybe<WorkWayEntityResponse>` |
| `deleteYat` | `Maybe<YatEntityResponse>` |
| `deleteZohar` | `Maybe<ZoharEntityResponse>` |
| `emailConfirmation` | `Maybe<UsersPermissionsLoginPayload>` |
| `forgotPassword` | `Maybe<UsersPermissionsPasswordPayload>` |
| `login` | `UsersPermissionsLoginPayload` |
| `multipleUpload` | `Array<Maybe<UploadFileEntityResponse>>` |
| `register` | `UsersPermissionsLoginPayload` |
| `removeFile` | `Maybe<UploadFileEntityResponse>` |
| `resetPassword` | `Maybe<UsersPermissionsLoginPayload>` |
| `updateAct` | `Maybe<ActEntityResponse>` |
| `updateActt` | `Maybe<ActtEntityResponse>` |
| `updateAsk` | `Maybe<AskEntityResponse>` |
| `updateAskm` | `Maybe<AskmEntityResponse>` |
| `updateAskwant` | `Maybe<AskwantEntityResponse>` |
| `updateBakasha` | `Maybe<BakashaEntityResponse>` |
| `updateCategory` | `Maybe<CategoryEntityResponse>` |
| `updateChezin` | `Maybe<ChezinEntityResponse>` |
| `updateContentReleasesRelease` | `Maybe<ContentReleasesReleaseEntityResponse>` |
| `updateContentReleasesReleaseAction` | `Maybe<ContentReleasesReleaseActionEntityResponse>` |
| `updateConventionText` | `Maybe<ConventionTextEntityResponse>` |
| `updateCuntry` | `Maybe<CuntryEntityResponse>` |
| `updateDea` | `Maybe<DeaEntityResponse>` |
| `updateDeal` | `Maybe<DealEntityResponse>` |
| `updateDecision` | `Maybe<DecisionEntityResponse>` |
| `updateDeffinition` | `Maybe<DeffinitionEntityResponse>` |
| `updateFileInfo` | `UploadFileEntityResponse` |
| `updateFiltertag` | `Maybe<FiltertagEntityResponse>` |
| `updateFiniapruval` | `Maybe<FiniapruvalEntityResponse>` |
| `updateFinnishedMission` | `Maybe<FinnishedMissionEntityResponse>` |
| `updateForum` | `Maybe<ForumEntityResponse>` |
| `updateForumLastSeen` | `Maybe<ForumLastSeenEntityResponse>` |
| `updateHaamada` | `Maybe<HaamadaEntityResponse>` |
| `updateHaamadapruv` | `Maybe<HaamadapruvEntityResponse>` |
| `updateHaluka` | `Maybe<HalukaEntityResponse>` |
| `updateHatzaa` | `Maybe<HatzaaEntityResponse>` |
| `updateHazbaah` | `Maybe<HazbaahEntityResponse>` |
| `updateMaap` | `Maybe<MaapEntityResponse>` |
| `updateMachshir` | `Maybe<MachshirEntityResponse>` |
| `updateMashaabim` | `Maybe<MashaabimEntityResponse>` |
| `updateMashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `updateMatanot` | `Maybe<MatanotEntityResponse>` |
| `updateMatbea` | `Maybe<MatbeaEntityResponse>` |
| `updateMesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `updateMessage` | `Maybe<MessageEntityResponse>` |
| `updateMission` | `Maybe<MissionEntityResponse>` |
| `updateMode` | `Maybe<ModeEntityResponse>` |
| `updateMonter` | `Maybe<MonterEntityResponse>` |
| `updateNego` | `Maybe<NegoEntityResponse>` |
| `updateNegoMash` | `Maybe<NegoMashEntityResponse>` |
| `updateNegopendmission` | `Maybe<NegopendmissionEntityResponse>` |
| `updateNegotiation` | `Maybe<NegotiationEntityResponse>` |
| `updateOpenMashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `updateOpenMission` | `Maybe<OpenMissionEntityResponse>` |
| `updatePartof` | `Maybe<PartofEntityResponse>` |
| `updatePendm` | `Maybe<PendmEntityResponse>` |
| `updatePgisha` | `Maybe<PgishaEntityResponse>` |
| `updatePgishauser` | `Maybe<PgishauserEntityResponse>` |
| `updatePgishauserpend` | `Maybe<PgishauserpendEntityResponse>` |
| `updatePmash` | `Maybe<PmashEntityResponse>` |
| `updatePosition` | `Maybe<PositionEntityResponse>` |
| `updateProject` | `Maybe<ProjectEntityResponse>` |
| `updateRatson` | `Maybe<RatsonEntityResponse>` |
| `updateRichtext` | `Maybe<RichtextEntityResponse>` |
| `updateRikmash` | `Maybe<RikmashEntityResponse>` |
| `updateSale` | `Maybe<SaleEntityResponse>` |
| `updateSeeder` | `Maybe<SeederEntityResponse>` |
| `updateSheirut` | `Maybe<SheirutEntityResponse>` |
| `updateSheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `updateSheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `updateSidur` | `Maybe<SidurEntityResponse>` |
| `updateSkill` | `Maybe<SkillEntityResponse>` |
| `updateSolution` | `Maybe<SolutionEntityResponse>` |
| `updateSp` | `Maybe<SpEntityResponse>` |
| `updateTafkidim` | `Maybe<TafkidimEntityResponse>` |
| `updateTikunolam` | `Maybe<TikunolamEntityResponse>` |
| `updateTimegrama` | `Maybe<TimegramaEntityResponse>` |
| `updateTimer` | `Maybe<TimerEntityResponse>` |
| `updateTosplit` | `Maybe<TosplitEntityResponse>` |
| `updateTranslate` | `Maybe<TranslateEntityResponse>` |
| `updateUploadFile` | `Maybe<UploadFileEntityResponse>` |
| `updateUploadFolder` | `Maybe<UploadFolderEntityResponse>` |
| `updateUsersPermissionsRole` | `Maybe<UsersPermissionsUpdateRolePayload>` |
| `updateUsersPermissionsUser` | `UsersPermissionsUserEntityResponse` |
| `updateVallue` | `Maybe<VallueEntityResponse>` |
| `updateVote` | `Maybe<VoteEntityResponse>` |
| `updateWant` | `Maybe<WantEntityResponse>` |
| `updateWelcomTop` | `Maybe<WelcomTopEntityResponse>` |
| `updateWhatandwhy` | `Maybe<WhatandwhyEntityResponse>` |
| `updateWorkWay` | `Maybe<WorkWayEntityResponse>` |
| `updateYat` | `Maybe<YatEntityResponse>` |
| `updateZohar` | `Maybe<ZoharEntityResponse>` |
| `upload` | `UploadFileEntityResponse` |

### Nego
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `des` | `Maybe<Scalars['JSON']['output']>` |
| `fixprice` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Nego_Kindof>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |

### NegoMash
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `isOriginal` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Negomash_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Negopendmission
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `date` | `Maybe<Scalars['DateTime']['output']>` |
| `dates` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `filds` | `Maybe<ComponentNewNego>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `howMany` | `Maybe<Scalars['Long']['output']>` |
| `isMonth` | `Maybe<Scalars['Boolean']['output']>` |
| `isOriginal` | `Maybe<Scalars['Boolean']['output']>` |
| `isRishon` | `Maybe<Scalars['Boolean']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `pendm` | `Maybe<PendmEntityResponse>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `work_ways` | `Maybe<WorkWayRelationResponseCollection>` |

### Negotiation
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `createdByEmail` | `Maybe<Scalars['String']['output']>` |
| `creator` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `currentRound` | `Maybe<Scalars['Int']['output']>` |
| `description` | `Maybe<Scalars['String']['output']>` |
| `maxRounds` | `Maybe<Scalars['Int']['output']>` |
| `participants` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `positions` | `Maybe<PositionRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `status` | `Maybe<Enum_Negotiation_Status>` |
| `topic` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### OpenMashaabim
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `askms` | `Maybe<AskmRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `declinedsps` | `Maybe<SpRelationResponseCollection>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `haamadapruvs` | `Maybe<HaamadapruvRelationResponseCollection>` |
| `haamadas` | `Maybe<HaamadaRelationResponseCollection>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `howMeny` | `Maybe<Scalars['Long']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Openmashaabim_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `rikmashes` | `Maybe<RikmashRelationResponseCollection>` |
| `splited` | `Maybe<Scalars['Boolean']['output']>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sps` | `Maybe<SpRelationResponseCollection>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### OpenMission
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `archived` | `Scalars['Boolean']['output']` |
| `asks` | `Maybe<AskRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `dates` | `Maybe<Scalars['DateTime']['output']>` |
| `declined` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `hatzaas` | `Maybe<HatzaaRelationResponseCollection>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `howMeny` | `Maybe<Scalars['Long']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isRishon` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `isglobal` | `Maybe<Scalars['Boolean']['output']>` |
| `iskvua` | `Maybe<Scalars['Boolean']['output']>` |
| `isshift` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<OpenMissionRelationResponseCollection>` |
| `mission` | `Maybe<MissionEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `pendm` | `Maybe<PendmEntityResponse>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `privatlinks` | `Maybe<Scalars['String']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publicklinks` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `rishon` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `rishonves` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `usersNotRelevant` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vallues` | `Maybe<VallueRelationResponseCollection>` |
| `work_ways` | `Maybe<WorkWayRelationResponseCollection>` |

### Pagination
| Field | Type |
|-------|------|
| `page` | `Scalars['Int']['output']` |
| `pageCount` | `Scalars['Int']['output']` |
| `pageSize` | `Scalars['Int']['output']` |
| `total` | `Scalars['Int']['output']` |

### PaginationArg
| Field | Type |
|-------|------|
| `limit` | `InputMaybe<Scalars['Int']['input']>` |
| `page` | `InputMaybe<Scalars['Int']['input']>` |
| `pageSize` | `InputMaybe<Scalars['Int']['input']>` |
| `start` | `InputMaybe<Scalars['Int']['input']>` |

### Partof
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `default` | `Maybe<Scalars['Boolean']['output']>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `open_mashaabims` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Pendm
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `dates` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `diun` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `howMeny` | `Maybe<Scalars['Long']['output']>` |
| `isLast` | `Maybe<Scalars['Boolean']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `isglobal` | `Maybe<Scalars['Boolean']['output']>` |
| `iskvua` | `Maybe<Scalars['Boolean']['output']>` |
| `isshift` | `Maybe<Scalars['Boolean']['output']>` |
| `mission` | `Maybe<MissionEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `nego` | `Maybe<Array<Maybe<ComponentNewNego>>>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `privatlinks` | `Maybe<Scalars['String']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publicklinks` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `rishon` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `rishonves` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<Array<Maybe<ComponentProjectsPendmnego>>>` |
| `vallues` | `Maybe<VallueRelationResponseCollection>` |
| `work_ways` | `Maybe<WorkWayRelationResponseCollection>` |

### Pgisha
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `available` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `desc` | `Maybe<Scalars['String']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `isLive` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<PgishaRelationResponseCollection>` |
| `meeting` | `Maybe<Array<Maybe<ComponentNewMeeting>>>` |
| `meetingStartedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `pendingStart` | `Maybe<Scalars['Boolean']['output']>` |
| `pgishauserpends` | `Maybe<PgishauserpendRelationResponseCollection>` |
| `pgishausers` | `Maybe<PgishauserRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `set` | `Maybe<Scalars['Boolean']['output']>` |
| `startRequestedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `startRequestedBy` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `startedBy` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `videoLink` | `Maybe<Scalars['String']['output']>` |

### Pgishauser
| Field | Type |
|-------|------|
| `available` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `pgishas` | `Maybe<PgishaRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `readyForStart` | `Maybe<Scalars['Boolean']['output']>` |
| `uid` | `Scalars['String']['output']` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Pgishauserpend
| Field | Type |
|-------|------|
| `approved` | `Maybe<Scalars['Boolean']['output']>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `pgisha` | `Maybe<PgishaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Pmash
| Field | Type |
|-------|------|
| `archived` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `diun` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Pmash_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `nego_mashes` | `Maybe<NegoMashRelationResponseCollection>` |
| `negom` | `Maybe<Array<Maybe<ComponentNewNegom>>>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Position
| Field | Type |
|-------|------|
| `aiMeta` | `Maybe<Scalars['String']['output']>` |
| `author` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `authorEmail` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `description` | `Maybe<Scalars['String']['output']>` |
| `heading` | `Maybe<Scalars['String']['output']>` |
| `intensity` | `Maybe<Scalars['Int']['output']>` |
| `location` | `Maybe<Scalars['Float']['output']>` |
| `negotiation` | `Maybe<NegotiationEntityResponse>` |
| `order` | `Maybe<Scalars['Int']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `tags` | `Maybe<FiltertagRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `voters` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `votes` | `Maybe<Scalars['Int']['output']>` |

### Project
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `addHoursManualy` | `Maybe<Scalars['Boolean']['output']>` |
| `askms` | `Maybe<AskmRelationResponseCollection>` |
| `asks` | `Maybe<AskRelationResponseCollection>` |
| `askwants` | `Maybe<AskwantRelationResponseCollection>` |
| `city` | `Maybe<Scalars['String']['output']>` |
| `countries` | `Maybe<CuntryRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `deals` | `Maybe<DealRelationResponseCollection>` |
| `decisions` | `Maybe<DecisionRelationResponseCollection>` |
| `deffinitions` | `Maybe<DeffinitionRelationResponseCollection>` |
| `descripFor` | `Maybe<Scalars['String']['output']>` |
| `discordlink` | `Maybe<Scalars['String']['output']>` |
| `drivelink` | `Maybe<Scalars['String']['output']>` |
| `fblink` | `Maybe<Scalars['String']['output']>` |
| `finiapruvals` | `Maybe<FiniapruvalRelationResponseCollection>` |
| `finnishedM72HForDecline` | `Maybe<Scalars['Boolean']['output']>` |
| `finnishedMAllApruve` | `Maybe<Scalars['Boolean']['output']>` |
| `finnished_missions` | `Maybe<FinnishedMissionRelationResponseCollection>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `githublink` | `Maybe<Scalars['String']['output']>` |
| `haamadapruvs` | `Maybe<HaamadapruvRelationResponseCollection>` |
| `haamadas` | `Maybe<HaamadaRelationResponseCollection>` |
| `halukas` | `Maybe<HalukaRelationResponseCollection>` |
| `isMachzikim` | `Maybe<Scalars['Boolean']['output']>` |
| `isMachzikimPublik` | `Maybe<Scalars['Boolean']['output']>` |
| `isOt` | `Maybe<Scalars['Boolean']['output']>` |
| `linkToWebsite` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<ProjectRelationResponseCollection>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `machshirs` | `Maybe<MachshirRelationResponseCollection>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `matanotofs` | `Maybe<MatanotRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `newMeMissionOuto72ho` | `Maybe<Scalars['Boolean']['output']>` |
| `newOpenMissionAllApruve` | `Maybe<Scalars['Boolean']['output']>` |
| `newOpenMotoAfter72hoursWithnono` | `Maybe<Scalars['Boolean']['output']>` |
| `newmeOpenAllapruve` | `Maybe<Scalars['Boolean']['output']>` |
| `open_mashaabims` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `pics` | `Maybe<UploadFileRelationResponseCollection>` |
| `pmashes` | `Maybe<PmashRelationResponseCollection>` |
| `profilePic` | `Maybe<UploadFileEntityResponse>` |
| `projectName` | `Scalars['String']['output']` |
| `publicDescription` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `restime` | `Maybe<Enum_Project_Restime>` |
| `rikmashes` | `Maybe<RikmashRelationResponseCollection>` |
| `sales` | `Maybe<SaleRelationResponseCollection>` |
| `sheirutpends` | `Maybe<SheirutpendRelationResponseCollection>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `sps` | `Maybe<SpRelationResponseCollection>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `timeToP` | `Maybe<Enum_Project_Timetop>` |
| `timerOnlyTOrAlsoManuallyF` | `Maybe<Scalars['Boolean']['output']>` |
| `timers` | `Maybe<TimerRelationResponseCollection>` |
| `tosplits` | `Maybe<TosplitRelationResponseCollection>` |
| `totalinyearone` | `Maybe<Scalars['Float']['output']>` |
| `totalinyearsec` | `Maybe<Scalars['Float']['output']>` |
| `totalmaxyearone` | `Maybe<Scalars['Float']['output']>` |
| `totalmaxyearsec` | `Maybe<Scalars['Float']['output']>` |
| `totalminyearone` | `Maybe<Scalars['Float']['output']>` |
| `totalminyearsec` | `Maybe<Scalars['Float']['output']>` |
| `twiterlink` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `user_1s` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `usersOfP` | `Maybe<Array<Maybe<ComponentProjectsUsersOf>>>` |
| `vallues` | `Maybe<VallueRelationResponseCollection>` |
| `watsapplink` | `Maybe<Scalars['String']['output']>` |
| `welcom_tops` | `Maybe<WelcomTopRelationResponseCollection>` |
| `work_ways` | `Maybe<WorkWayRelationResponseCollection>` |
| `zohars` | `Maybe<ZoharRelationResponseCollection>` |

### Query
| Field | Type |
|-------|------|
| `act` | `Maybe<ActEntityResponse>` |
| `acts` | `Maybe<ActEntityResponseCollection>` |
| `actt` | `Maybe<ActtEntityResponse>` |
| `actts` | `Maybe<ActtEntityResponseCollection>` |
| `ask` | `Maybe<AskEntityResponse>` |
| `askm` | `Maybe<AskmEntityResponse>` |
| `askms` | `Maybe<AskmEntityResponseCollection>` |
| `asks` | `Maybe<AskEntityResponseCollection>` |
| `askwant` | `Maybe<AskwantEntityResponse>` |
| `askwants` | `Maybe<AskwantEntityResponseCollection>` |
| `bakasha` | `Maybe<BakashaEntityResponse>` |
| `bakashas` | `Maybe<BakashaEntityResponseCollection>` |
| `categories` | `Maybe<CategoryEntityResponseCollection>` |
| `category` | `Maybe<CategoryEntityResponse>` |
| `chezin` | `Maybe<ChezinEntityResponse>` |
| `chezins` | `Maybe<ChezinEntityResponseCollection>` |
| `contentReleasesRelease` | `Maybe<ContentReleasesReleaseEntityResponse>` |
| `contentReleasesReleaseAction` | `Maybe<ContentReleasesReleaseActionEntityResponse>` |
| `contentReleasesReleaseActions` | `Maybe<ContentReleasesReleaseActionEntityResponseCollection>` |
| `contentReleasesReleases` | `Maybe<ContentReleasesReleaseEntityResponseCollection>` |
| `conventionText` | `Maybe<ConventionTextEntityResponse>` |
| `conventionTexts` | `Maybe<ConventionTextEntityResponseCollection>` |
| `cuntries` | `Maybe<CuntryEntityResponseCollection>` |
| `cuntry` | `Maybe<CuntryEntityResponse>` |
| `dea` | `Maybe<DeaEntityResponse>` |
| `deal` | `Maybe<DealEntityResponse>` |
| `deals` | `Maybe<DealEntityResponseCollection>` |
| `deas` | `Maybe<DeaEntityResponseCollection>` |
| `decision` | `Maybe<DecisionEntityResponse>` |
| `decisions` | `Maybe<DecisionEntityResponseCollection>` |
| `deffinition` | `Maybe<DeffinitionEntityResponse>` |
| `deffinitions` | `Maybe<DeffinitionEntityResponseCollection>` |
| `filtertag` | `Maybe<FiltertagEntityResponse>` |
| `filtertags` | `Maybe<FiltertagEntityResponseCollection>` |
| `finiapruval` | `Maybe<FiniapruvalEntityResponse>` |
| `finiapruvals` | `Maybe<FiniapruvalEntityResponseCollection>` |
| `finnishedMission` | `Maybe<FinnishedMissionEntityResponse>` |
| `finnishedMissions` | `Maybe<FinnishedMissionEntityResponseCollection>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `forumLastSeen` | `Maybe<ForumLastSeenEntityResponse>` |
| `forumLastSeens` | `Maybe<ForumLastSeenEntityResponseCollection>` |
| `forums` | `Maybe<ForumEntityResponseCollection>` |
| `haamada` | `Maybe<HaamadaEntityResponse>` |
| `haamadapruv` | `Maybe<HaamadapruvEntityResponse>` |
| `haamadapruvs` | `Maybe<HaamadapruvEntityResponseCollection>` |
| `haamadas` | `Maybe<HaamadaEntityResponseCollection>` |
| `haluka` | `Maybe<HalukaEntityResponse>` |
| `halukas` | `Maybe<HalukaEntityResponseCollection>` |
| `hatzaa` | `Maybe<HatzaaEntityResponse>` |
| `hatzaas` | `Maybe<HatzaaEntityResponseCollection>` |
| `hazbaah` | `Maybe<HazbaahEntityResponse>` |
| `hazbaahs` | `Maybe<HazbaahEntityResponseCollection>` |
| `i18NLocale` | `Maybe<I18NLocaleEntityResponse>` |
| `i18NLocales` | `Maybe<I18NLocaleEntityResponseCollection>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `maaps` | `Maybe<MaapEntityResponseCollection>` |
| `machshir` | `Maybe<MachshirEntityResponse>` |
| `machshirs` | `Maybe<MachshirEntityResponseCollection>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `mashaabims` | `Maybe<MashaabimEntityResponseCollection>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `mashabetahaliches` | `Maybe<MashabetahalichEntityResponseCollection>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `matanots` | `Maybe<MatanotEntityResponseCollection>` |
| `matbea` | `Maybe<MatbeaEntityResponse>` |
| `matbeas` | `Maybe<MatbeaEntityResponseCollection>` |
| `me` | `Maybe<UsersPermissionsMe>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichEntityResponseCollection>` |
| `message` | `Maybe<MessageEntityResponse>` |
| `messages` | `Maybe<MessageEntityResponseCollection>` |
| `mission` | `Maybe<MissionEntityResponse>` |
| `missions` | `Maybe<MissionEntityResponseCollection>` |
| `mode` | `Maybe<ModeEntityResponse>` |
| `modes` | `Maybe<ModeEntityResponseCollection>` |
| `monter` | `Maybe<MonterEntityResponse>` |
| `monters` | `Maybe<MonterEntityResponseCollection>` |
| `nego` | `Maybe<NegoEntityResponse>` |
| `negoMash` | `Maybe<NegoMashEntityResponse>` |
| `negoMashes` | `Maybe<NegoMashEntityResponseCollection>` |
| `negopendmission` | `Maybe<NegopendmissionEntityResponse>` |
| `negopendmissions` | `Maybe<NegopendmissionEntityResponseCollection>` |
| `negos` | `Maybe<NegoEntityResponseCollection>` |
| `negotiation` | `Maybe<NegotiationEntityResponse>` |
| `negotiations` | `Maybe<NegotiationEntityResponseCollection>` |
| `openMashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `openMashaabims` | `Maybe<OpenMashaabimEntityResponseCollection>` |
| `openMission` | `Maybe<OpenMissionEntityResponse>` |
| `openMissions` | `Maybe<OpenMissionEntityResponseCollection>` |
| `partof` | `Maybe<PartofEntityResponse>` |
| `partofs` | `Maybe<PartofEntityResponseCollection>` |
| `pendm` | `Maybe<PendmEntityResponse>` |
| `pendms` | `Maybe<PendmEntityResponseCollection>` |
| `pgisha` | `Maybe<PgishaEntityResponse>` |
| `pgishas` | `Maybe<PgishaEntityResponseCollection>` |
| `pgishauser` | `Maybe<PgishauserEntityResponse>` |
| `pgishauserpend` | `Maybe<PgishauserpendEntityResponse>` |
| `pgishauserpends` | `Maybe<PgishauserpendEntityResponseCollection>` |
| `pgishausers` | `Maybe<PgishauserEntityResponseCollection>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `pmashes` | `Maybe<PmashEntityResponseCollection>` |
| `position` | `Maybe<PositionEntityResponse>` |
| `positions` | `Maybe<PositionEntityResponseCollection>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `projects` | `Maybe<ProjectEntityResponseCollection>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratsons` | `Maybe<RatsonEntityResponseCollection>` |
| `richtext` | `Maybe<RichtextEntityResponse>` |
| `richtexts` | `Maybe<RichtextEntityResponseCollection>` |
| `rikmash` | `Maybe<RikmashEntityResponse>` |
| `rikmashes` | `Maybe<RikmashEntityResponseCollection>` |
| `sale` | `Maybe<SaleEntityResponse>` |
| `sales` | `Maybe<SaleEntityResponseCollection>` |
| `seeder` | `Maybe<SeederEntityResponse>` |
| `seeders` | `Maybe<SeederEntityResponseCollection>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `sheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `sheirutnegos` | `Maybe<SheirutnegoEntityResponseCollection>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `sheirutpends` | `Maybe<SheirutpendEntityResponseCollection>` |
| `sheiruts` | `Maybe<SheirutEntityResponseCollection>` |
| `sidur` | `Maybe<SidurEntityResponse>` |
| `sidurs` | `Maybe<SidurEntityResponseCollection>` |
| `skill` | `Maybe<SkillEntityResponse>` |
| `skills` | `Maybe<SkillEntityResponseCollection>` |
| `solution` | `Maybe<SolutionEntityResponse>` |
| `solutions` | `Maybe<SolutionEntityResponseCollection>` |
| `sp` | `Maybe<SpEntityResponse>` |
| `sps` | `Maybe<SpEntityResponseCollection>` |
| `tafkidim` | `Maybe<TafkidimEntityResponse>` |
| `tafkidims` | `Maybe<TafkidimEntityResponseCollection>` |
| `tikunolam` | `Maybe<TikunolamEntityResponse>` |
| `tikunolams` | `Maybe<TikunolamEntityResponseCollection>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `timegramas` | `Maybe<TimegramaEntityResponseCollection>` |
| `timer` | `Maybe<TimerEntityResponse>` |
| `timers` | `Maybe<TimerEntityResponseCollection>` |
| `tosplit` | `Maybe<TosplitEntityResponse>` |
| `tosplits` | `Maybe<TosplitEntityResponseCollection>` |
| `translate` | `Maybe<TranslateEntityResponse>` |
| `translates` | `Maybe<TranslateEntityResponseCollection>` |
| `uploadFile` | `Maybe<UploadFileEntityResponse>` |
| `uploadFiles` | `Maybe<UploadFileEntityResponseCollection>` |
| `uploadFolder` | `Maybe<UploadFolderEntityResponse>` |
| `uploadFolders` | `Maybe<UploadFolderEntityResponseCollection>` |
| `usersPermissionsRole` | `Maybe<UsersPermissionsRoleEntityResponse>` |
| `usersPermissionsRoles` | `Maybe<UsersPermissionsRoleEntityResponseCollection>` |
| `usersPermissionsUser` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `usersPermissionsUsers` | `Maybe<UsersPermissionsUserEntityResponseCollection>` |
| `vallue` | `Maybe<VallueEntityResponse>` |
| `vallues` | `Maybe<VallueEntityResponseCollection>` |
| `vote` | `Maybe<VoteEntityResponse>` |
| `votes` | `Maybe<VoteEntityResponseCollection>` |
| `want` | `Maybe<WantEntityResponse>` |
| `wants` | `Maybe<WantEntityResponseCollection>` |
| `welcomTop` | `Maybe<WelcomTopEntityResponse>` |
| `welcomTops` | `Maybe<WelcomTopEntityResponseCollection>` |
| `whatandwhy` | `Maybe<WhatandwhyEntityResponse>` |
| `workWay` | `Maybe<WorkWayEntityResponse>` |
| `workWays` | `Maybe<WorkWayEntityResponseCollection>` |
| `yat` | `Maybe<YatEntityResponse>` |
| `yats` | `Maybe<YatEntityResponseCollection>` |
| `zohar` | `Maybe<ZoharEntityResponse>` |
| `zohars` | `Maybe<ZoharEntityResponseCollection>` |

### Ratson
| Field | Type |
|-------|------|
| `allowJoin` | `Maybe<Scalars['Boolean']['output']>` |
| `bounti` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `desc` | `Maybe<Scalars['String']['output']>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `fulfilled` | `Maybe<Scalars['Boolean']['output']>` |
| `link` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<RatsonRelationResponseCollection>` |
| `logo` | `Maybe<UploadFileEntityResponse>` |
| `longDes` | `Maybe<Scalars['String']['output']>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `pics` | `Maybe<UploadFileRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `totalbounti` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `vallues` | `Maybe<VallueRelationResponseCollection>` |

### ResponseCollectionMeta
| Field | Type |
|-------|------|
| `pagination` | `Pagination` |

### Richtext
| Field | Type |
|-------|------|
| `bg` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `desc` | `Maybe<Scalars['JSON']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<RichtextRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Rikmash
| Field | Type |
|-------|------|
| `agprice` | `Maybe<Scalars['Float']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `haamadas` | `Maybe<HaamadaRelationResponseCollection>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Rikmash_Kindof>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sp` | `Maybe<SpEntityResponse>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualef` | `Maybe<Scalars['DateTime']['output']>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Sale
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `date` | `Maybe<Scalars['DateTime']['output']>` |
| `finishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `in` | `Maybe<Scalars['Float']['output']>` |
| `isMonterActive` | `Maybe<Scalars['Boolean']['output']>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `monters` | `Maybe<MonterRelationResponseCollection>` |
| `note` | `Maybe<Scalars['String']['output']>` |
| `pending` | `Maybe<Scalars['Boolean']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `splited` | `Scalars['Boolean']['output']` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `tosplits` | `Maybe<TosplitRelationResponseCollection>` |
| `unit` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Seeder
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnish` | `Maybe<Scalars['DateTime']['output']>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Sheirut
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `askwants` | `Maybe<AskwantRelationResponseCollection>` |
| `categories` | `Maybe<CategoryRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `equaliSplited` | `Maybe<Scalars['Boolean']['output']>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `iCanGetMonay` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `iGotIt` | `Maybe<Scalars['Boolean']['output']>` |
| `iGotMoney` | `Maybe<Array<Maybe<ComponentProjectsIGotMoney>>>` |
| `iTransferMoney` | `Maybe<Scalars['Boolean']['output']>` |
| `iTransferedTo` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `isApruved` | `Maybe<Scalars['Boolean']['output']>` |
| `isItOnlyOneInProject` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<SheirutRelationResponseCollection>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `moneyTransfered` | `Maybe<Scalars['Boolean']['output']>` |
| `monters` | `Maybe<MonterRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `oneTime` | `Maybe<Scalars['Boolean']['output']>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `productExepted` | `Maybe<Scalars['Boolean']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `sales` | `Maybe<SaleRelationResponseCollection>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `wants` | `Maybe<WantRelationResponseCollection>` |
| `weFinnish` | `Maybe<VoteRelationResponseCollection>` |

### Sheirutnego
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `isOriginal` | `Maybe<Scalars['Boolean']['output']>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Sheirutpend
| Field | Type |
|-------|------|
| `appruved` | `Maybe<Scalars['Boolean']['output']>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<SheirutpendRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `sheirutnegos` | `Maybe<SheirutnegoRelationResponseCollection>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Sidur
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `lemi` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Skill
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<SkillRelationResponseCollection>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `skillName` | `Scalars['String']['output']` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### Solution
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `deas` | `Maybe<DeaRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Sp
| Field | Type |
|-------|------|
| `archived` | `Scalars['Boolean']['output']` |
| `askms` | `Maybe<AskmRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `declinedm` | `Maybe<OpenMashaabimEntityResponse>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `fdate` | `Maybe<Scalars['DateTime']['output']>` |
| `kindOf` | `Maybe<Enum_Sp_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<SpRelationResponseCollection>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `mode` | `Maybe<ModeEntityResponse>` |
| `myp` | `Maybe<Scalars['Float']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `openask` | `Maybe<OpenMashaabimEntityResponse>` |
| `panui` | `Maybe<Scalars['Boolean']['output']>` |
| `pics` | `Maybe<UploadFileRelationResponseCollection>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `rikmash` | `Maybe<RikmashEntityResponse>` |
| `sdate` | `Maybe<Scalars['DateTime']['output']>` |
| `splited` | `Maybe<Scalars['Boolean']['output']>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `unit` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `yat` | `Maybe<YatEntityResponse>` |

### Tafkidim
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `finnished_missions` | `Maybe<FinnishedMissionRelationResponseCollection>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<TafkidimRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `roleDescription` | `Scalars['String']['output']` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### Tikunolam
| Field | Type |
|-------|------|
| `amort` | `Maybe<Scalars['String']['output']>` |
| `amortf` | `Maybe<Scalars['String']['output']>` |
| `amorth` | `Maybe<Scalars['String']['output']>` |
| `amorts` | `Maybe<Scalars['String']['output']>` |
| `amortt` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `email` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<TikunolamRelationResponseCollection>` |
| `more` | `Maybe<Scalars['String']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `notes` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Timegrama
| Field | Type |
|-------|------|
| `act` | `Maybe<ActEntityResponse>` |
| `actt` | `Maybe<ActtEntityResponse>` |
| `ask` | `Maybe<AskEntityResponse>` |
| `askm` | `Maybe<AskmEntityResponse>` |
| `askwant` | `Maybe<AskwantEntityResponse>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `date` | `Maybe<Scalars['DateTime']['output']>` |
| `decision` | `Maybe<DecisionEntityResponse>` |
| `done` | `Maybe<Scalars['Boolean']['output']>` |
| `finiapruval` | `Maybe<FiniapruvalEntityResponse>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `pendm` | `Maybe<PendmEntityResponse>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `timer` | `Maybe<TimerEntityResponse>` |
| `tosplit` | `Maybe<TosplitEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `whatami` | `Maybe<Scalars['String']['output']>` |

### Timer
| Field | Type |
|-------|------|
| `activeMesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `appruved` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnish` | `Maybe<Scalars['DateTime']['output']>` |
| `forApruve` | `Maybe<Scalars['Boolean']['output']>` |
| `isActive` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<TimerRelationResponseCollection>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `saveFiles` | `Maybe<UploadFileRelationResponseCollection>` |
| `saveLinks` | `Maybe<Scalars['String']['output']>` |
| `saveText` | `Maybe<Scalars['String']['output']>` |
| `saved` | `Maybe<Scalars['Boolean']['output']>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `timers` | `Maybe<Array<Maybe<ComponentNewTimes>>>` |
| `totalHours` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |

### Tosplit
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finished` | `Maybe<Scalars['Boolean']['output']>` |
| `halukas` | `Maybe<HalukaRelationResponseCollection>` |
| `hervachti` | `Maybe<Array<Maybe<ComponentProjectsHervachti>>>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<TosplitRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `prectentage` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sales` | `Maybe<SaleRelationResponseCollection>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `whynow` | `Maybe<Scalars['String']['output']>` |

### Translate
| Field | Type |
|-------|------|
| `amort` | `Maybe<Scalars['String']['output']>` |
| `amortf` | `Maybe<Scalars['String']['output']>` |
| `amorth` | `Maybe<Scalars['String']['output']>` |
| `amorts` | `Maybe<Scalars['String']['output']>` |
| `amortt` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `email` | `Maybe<Scalars['String']['output']>` |
| `from` | `Maybe<Scalars['String']['output']>` |
| `lang` | `Maybe<Scalars['String']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `notes` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### UploadFile
| Field | Type |
|-------|------|
| `alternativeText` | `Maybe<Scalars['String']['output']>` |
| `caption` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ext` | `Maybe<Scalars['String']['output']>` |
| `formats` | `Maybe<Scalars['JSON']['output']>` |
| `hash` | `Scalars['String']['output']` |
| `height` | `Maybe<Scalars['Int']['output']>` |
| `mime` | `Scalars['String']['output']` |
| `name` | `Scalars['String']['output']` |
| `previewUrl` | `Maybe<Scalars['String']['output']>` |
| `provider` | `Scalars['String']['output']` |
| `provider_metadata` | `Maybe<Scalars['JSON']['output']>` |
| `related` | `Maybe<Array<Maybe<GenericMorph>>>` |
| `size` | `Scalars['Float']['output']` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `url` | `Scalars['String']['output']` |
| `width` | `Maybe<Scalars['Int']['output']>` |

### UploadFolder
| Field | Type |
|-------|------|
| `children` | `Maybe<UploadFolderRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `files` | `Maybe<UploadFileRelationResponseCollection>` |
| `name` | `Scalars['String']['output']` |
| `parent` | `Maybe<UploadFolderEntityResponse>` |
| `path` | `Scalars['String']['output']` |
| `pathId` | `Scalars['Int']['output']` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### UsersPermissionsCreateRolePayload
| Field | Type |
|-------|------|
| `ok` | `Scalars['Boolean']['output']` |

### UsersPermissionsDeleteRolePayload
| Field | Type |
|-------|------|
| `ok` | `Scalars['Boolean']['output']` |

### UsersPermissionsLoginPayload
| Field | Type |
|-------|------|
| `jwt` | `Maybe<Scalars['String']['output']>` |
| `user` | `UsersPermissionsMe` |

### UsersPermissionsMe
| Field | Type |
|-------|------|
| `blocked` | `Maybe<Scalars['Boolean']['output']>` |
| `confirmed` | `Maybe<Scalars['Boolean']['output']>` |
| `email` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `role` | `Maybe<UsersPermissionsMeRole>` |
| `username` | `Scalars['String']['output']` |

### UsersPermissionsMeRole
| Field | Type |
|-------|------|
| `description` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `name` | `Scalars['String']['output']` |
| `type` | `Maybe<Scalars['String']['output']>` |

### UsersPermissionsPasswordPayload
| Field | Type |
|-------|------|
| `ok` | `Scalars['Boolean']['output']` |

### UsersPermissionsPermission
| Field | Type |
|-------|------|
| `action` | `Scalars['String']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `role` | `Maybe<UsersPermissionsRoleEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### UsersPermissionsRole
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `description` | `Maybe<Scalars['String']['output']>` |
| `name` | `Scalars['String']['output']` |
| `permissions` | `Maybe<UsersPermissionsPermissionRelationResponseCollection>` |
| `type` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### UsersPermissionsUpdateRolePayload
| Field | Type |
|-------|------|
| `ok` | `Scalars['Boolean']['output']` |

### UsersPermissionsUser
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `actsVali` | `Maybe<ActRelationResponseCollection>` |
| `arr1` | `Maybe<Scalars['JSON']['output']>` |
| `arrdate` | `Maybe<Scalars['DateTime']['output']>` |
| `askeds` | `Maybe<OpenMissionRelationResponseCollection>` |
| `askms` | `Maybe<AskmRelationResponseCollection>` |
| `asks` | `Maybe<AskRelationResponseCollection>` |
| `askwants` | `Maybe<AskwantRelationResponseCollection>` |
| `bio` | `Maybe<Scalars['String']['output']>` |
| `blocked` | `Maybe<Scalars['Boolean']['output']>` |
| `chezin` | `Maybe<ChezinEntityResponse>` |
| `city` | `Maybe<Scalars['String']['output']>` |
| `confirmed` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `cuntries` | `Maybe<CuntryRelationResponseCollection>` |
| `deals` | `Maybe<DealRelationResponseCollection>` |
| `declined` | `Maybe<OpenMissionRelationResponseCollection>` |
| `declinedByP` | `Maybe<OpenMissionRelationResponseCollection>` |
| `declinedm` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `device_token` | `Maybe<Scalars['String']['output']>` |
| `discordlink` | `Maybe<Scalars['String']['output']>` |
| `email` | `Scalars['String']['output']` |
| `fblink` | `Maybe<Scalars['String']['output']>` |
| `filtertags` | `Maybe<FiltertagRelationResponseCollection>` |
| `finiapruvals` | `Maybe<FiniapruvalRelationResponseCollection>` |
| `finnished_missions` | `Maybe<FinnishedMissionRelationResponseCollection>` |
| `forum_last_seens` | `Maybe<ForumLastSeenRelationResponseCollection>` |
| `frd` | `Maybe<Enum_Userspermissionsuser_Frd>` |
| `free_person` | `Maybe<Scalars['Int']['output']>` |
| `githublink` | `Maybe<Scalars['String']['output']>` |
| `haamadas` | `Maybe<HaamadaRelationResponseCollection>` |
| `halukasend` | `Maybe<HalukaRelationResponseCollection>` |
| `halukasres` | `Maybe<HalukaRelationResponseCollection>` |
| `haskama` | `Maybe<Scalars['Long']['output']>` |
| `haskamac` | `Maybe<Scalars['Long']['output']>` |
| `haskamaz` | `Maybe<Scalars['Long']['output']>` |
| `hatzaas` | `Maybe<HatzaaRelationResponseCollection>` |
| `hervachti` | `Maybe<Scalars['Float']['output']>` |
| `iGotMOneyForSheirut` | `Maybe<SheirutRelationResponseCollection>` |
| `isSigned` | `Maybe<Scalars['Boolean']['output']>` |
| `lang` | `Maybe<Enum_Userspermissionsuser_Lang>` |
| `levManualAlready` | `Maybe<Scalars['Boolean']['output']>` |
| `machshirs` | `Maybe<MachshirRelationResponseCollection>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `messages` | `Maybe<MessageRelationResponseCollection>` |
| `moachManualAlready` | `Maybe<Scalars['Boolean']['output']>` |
| `nego_mashes` | `Maybe<NegoMashRelationResponseCollection>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `negotiations` | `Maybe<NegotiationRelationResponseCollection>` |
| `negotiationsIparticipante` | `Maybe<NegotiationRelationResponseCollection>` |
| `noMail` | `Maybe<Scalars['Boolean']['output']>` |
| `noOfHoursProject1` | `Maybe<Scalars['Float']['output']>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `pendmsforme` | `Maybe<PendmRelationResponseCollection>` |
| `pgishas` | `Maybe<PgishaRelationResponseCollection>` |
| `pgishasPendStrat` | `Maybe<PgishaRelationResponseCollection>` |
| `pgishauserpends` | `Maybe<PgishauserpendRelationResponseCollection>` |
| `pgishausers` | `Maybe<PgishauserRelationResponseCollection>` |
| `positionsAuthor` | `Maybe<PositionRelationResponseCollection>` |
| `positionsVoted` | `Maybe<PositionRelationResponseCollection>` |
| `preferCards` | `Maybe<Scalars['Boolean']['output']>` |
| `profilManualAlready` | `Maybe<Scalars['Boolean']['output']>` |
| `profilePic` | `Maybe<UploadFileEntityResponse>` |
| `projects_1s` | `Maybe<ProjectRelationResponseCollection>` |
| `provider` | `Maybe<Scalars['String']['output']>` |
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
| `rikmashes` | `Maybe<RikmashRelationResponseCollection>` |
| `rishonvesopen` | `Maybe<OpenMissionRelationResponseCollection>` |
| `role` | `Maybe<UsersPermissionsRoleEntityResponse>` |
| `sales` | `Maybe<SaleRelationResponseCollection>` |
| `sheirutnegos` | `Maybe<SheirutnegoRelationResponseCollection>` |
| `sheirutpends` | `Maybe<SheirutpendRelationResponseCollection>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `shekelsPerHoureProject1` | `Maybe<Scalars['Float']['output']>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `socketId` | `Maybe<Scalars['String']['output']>` |
| `sphmin` | `Maybe<Scalars['Float']['output']>` |
| `sps` | `Maybe<SpRelationResponseCollection>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `telegramId` | `Maybe<Scalars['String']['output']>` |
| `timeForVid` | `Maybe<Scalars['DateTime']['output']>` |
| `timers` | `Maybe<TimerRelationResponseCollection>` |
| `twiterlink` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `username` | `Scalars['String']['output']` |
| `vallues` | `Maybe<VallueRelationResponseCollection>` |
| `videoval` | `Maybe<Scalars['Boolean']['output']>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |
| `wants` | `Maybe<WantRelationResponseCollection>` |
| `welcom_tops` | `Maybe<WelcomTopRelationResponseCollection>` |
| `work_ways` | `Maybe<WorkWayRelationResponseCollection>` |
| `zohars` | `Maybe<ZoharRelationResponseCollection>` |

### Vallue
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `decisions` | `Maybe<DecisionRelationResponseCollection>` |
| `decisionsles` | `Maybe<DecisionRelationResponseCollection>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<VallueRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `valueName` | `Scalars['String']['output']` |

### Vote
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `deas` | `Maybe<DeaRelationResponseCollection>` |
| `decision` | `Maybe<DecisionEntityResponse>` |
| `hazbaah` | `Maybe<HazbaahEntityResponse>` |
| `nego` | `Maybe<NegoEntityResponse>` |
| `ok` | `Maybe<Scalars['Boolean']['output']>` |
| `order` | `Maybe<Scalars['Int']['output']>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `timer` | `Maybe<TimerEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `what` | `Maybe<Scalars['Boolean']['output']>` |
| `why` | `Maybe<Scalars['String']['output']>` |

### Want
| Field | Type |
|-------|------|
| `amountalready` | `Maybe<Scalars['Float']['output']>` |
| `appruved` | `Maybe<Scalars['Boolean']['output']>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnish` | `Maybe<Scalars['DateTime']['output']>` |
| `halukas` | `Maybe<HalukaRelationResponseCollection>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<WantRelationResponseCollection>` |
| `monters` | `Maybe<MonterRelationResponseCollection>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `starte` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### WelcomTop
| Field | Type |
|-------|------|
| `clicked` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Whatandwhy
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<WhatandwhyRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `what` | `Scalars['Boolean']['output']` |
| `why` | `Scalars['String']['output']` |

### WorkWay
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<WorkWayRelationResponseCollection>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `workWayName` | `Scalars['String']['output']` |

### Yat
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `modes` | `Maybe<ModeRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sps` | `Maybe<SpRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Zohar
| Field | Type |
|-------|------|
| `allSubmited` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `done` | `Maybe<Scalars['Boolean']['output']>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `weekSt` | `Maybe<Scalars['Date']['output']>` |

---

## 🧩 Component Types (57)

These are Strapi components (reusable field groups).

### ComponentDesisionEditPend
| Field | Type |
|-------|------|
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `skills` | `Maybe<SkillEntityResponse>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `tafkidims` | `Maybe<TafkidimEntityResponse>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `work_ways` | `Maybe<WorkWayEntityResponse>` |

### ComponentDesisionNegodes
| Field | Type |
|-------|------|
| `des` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `pic` | `Maybe<UploadFileEntityResponse>` |
| `richdes` | `Maybe<Scalars['String']['output']>` |
| `text` | `Maybe<Scalars['String']['output']>` |

### ComponentDesisionNegom
| Field | Type |
|-------|------|
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `kindOf` | `Maybe<Enum_Componentdesisionnegom_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |

### ComponentNewEdits
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `versionText` | `Maybe<Scalars['String']['output']>` |

### ComponentNewEditsFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewEditsFiltersInput>>>` |
| `not` | `InputMaybe<ComponentNewEditsFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewEditsFiltersInput>>>` |
| `versionText` | `InputMaybe<StringFilterInput>` |

### ComponentNewEditsInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `versionText` | `InputMaybe<Scalars['String']['input']>` |

### ComponentNewMeeting
| Field | Type |
|-------|------|
| `available` | `Maybe<Scalars['Boolean']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ComponentNewMeetingFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewMeetingFiltersInput>>>` |
| `available` | `InputMaybe<BooleanFilterInput>` |
| `not` | `InputMaybe<ComponentNewMeetingFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewMeetingFiltersInput>>>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |

### ComponentNewMeetingInput
| Field | Type |
|-------|------|
| `available` | `InputMaybe<Scalars['Boolean']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### ComponentNewMonter
| Field | Type |
|-------|------|
| `finnished_mission` | `Maybe<FinnishedMissionEntityResponse>` |
| `hours` | `Maybe<Scalars['Float']['output']>` |
| `hoursDone` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `isDone` | `Maybe<Scalars['Boolean']['output']>` |
| `monthStart` | `Maybe<Scalars['Date']['output']>` |

### ComponentNewMonterFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewMonterFiltersInput>>>` |
| `finnished_mission` | `InputMaybe<FinnishedMissionFiltersInput>` |
| `hours` | `InputMaybe<FloatFilterInput>` |
| `hoursDone` | `InputMaybe<FloatFilterInput>` |
| `isDone` | `InputMaybe<BooleanFilterInput>` |
| `monthStart` | `InputMaybe<DateFilterInput>` |
| `not` | `InputMaybe<ComponentNewMonterFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewMonterFiltersInput>>>` |

### ComponentNewMonterInput
| Field | Type |
|-------|------|
| `finnished_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `hours` | `InputMaybe<Scalars['Float']['input']>` |
| `hoursDone` | `InputMaybe<Scalars['Float']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `isDone` | `InputMaybe<Scalars['Boolean']['input']>` |
| `monthStart` | `InputMaybe<Scalars['Date']['input']>` |

### ComponentNewNego
| Field | Type |
|-------|------|
| `dates` | `Maybe<Scalars['DateTime']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `ide` | `Maybe<Scalars['Int']['output']>` |
| `isOriginal` | `Maybe<Scalars['Boolean']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `tafkidim` | `Maybe<TafkidimEntityResponse>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `work_way` | `Maybe<WorkWayEntityResponse>` |

### ComponentNewNegoSkillsArgs
| Field | Type |
|-------|------|
| `filters` | `InputMaybe<SkillFiltersInput>` |
| `pagination` | `InputMaybe<PaginationArg>` |
| `publicationState` | `InputMaybe<PublicationState>` |
| `sort` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |

### ComponentNewNegoFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewNegoFiltersInput>>>` |
| `dates` | `InputMaybe<DateTimeFilterInput>` |
| `descrip` | `InputMaybe<StringFilterInput>` |
| `hearotMeyuchadot` | `InputMaybe<StringFilterInput>` |
| `ide` | `InputMaybe<IntFilterInput>` |
| `isOriginal` | `InputMaybe<BooleanFilterInput>` |
| `name` | `InputMaybe<StringFilterInput>` |
| `noofhours` | `InputMaybe<FloatFilterInput>` |
| `not` | `InputMaybe<ComponentNewNegoFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewNegoFiltersInput>>>` |
| `perhour` | `InputMaybe<FloatFilterInput>` |
| `skills` | `InputMaybe<SkillFiltersInput>` |
| `sqadualed` | `InputMaybe<DateTimeFilterInput>` |
| `tafkidim` | `InputMaybe<TafkidimFiltersInput>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |
| `work_way` | `InputMaybe<WorkWayFiltersInput>` |

### ComponentNewNegoInput
| Field | Type |
|-------|------|
| `dates` | `InputMaybe<Scalars['DateTime']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `ide` | `InputMaybe<Scalars['Int']['input']>` |
| `isOriginal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tafkidim` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `work_way` | `InputMaybe<Scalars['ID']['input']>` |

### ComponentNewNegom
| Field | Type |
|-------|------|
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `kindOf` | `Maybe<Enum_Componentnewnegom_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### ComponentNewNegomVotsArgs
| Field | Type |
|-------|------|
| `filters` | `InputMaybe<ComponentProjectsVotsFiltersInput>` |
| `pagination` | `InputMaybe<PaginationArg>` |
| `sort` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |

### ComponentNewNegomFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewNegomFiltersInput>>>` |
| `descrip` | `InputMaybe<StringFilterInput>` |
| `easy` | `InputMaybe<FloatFilterInput>` |
| `hm` | `InputMaybe<FloatFilterInput>` |
| `kindOf` | `InputMaybe<StringFilterInput>` |
| `linkto` | `InputMaybe<StringFilterInput>` |
| `name` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentNewNegomFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewNegomFiltersInput>>>` |
| `price` | `InputMaybe<FloatFilterInput>` |
| `spnot` | `InputMaybe<StringFilterInput>` |
| `sqadualed` | `InputMaybe<DateTimeFilterInput>` |
| `sqadualedf` | `InputMaybe<DateTimeFilterInput>` |
| `vots` | `InputMaybe<ComponentProjectsVotsFiltersInput>` |

### ComponentNewNegomInput
| Field | Type |
|-------|------|
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `easy` | `InputMaybe<Scalars['Float']['input']>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `kindOf` | `InputMaybe<Enum_Componentnewnegom_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualedf` | `InputMaybe<Scalars['DateTime']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### ComponentNewSeen
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `seenBy` | `Maybe<Scalars['Boolean']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ComponentNewSeenFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewSeenFiltersInput>>>` |
| `not` | `InputMaybe<ComponentNewSeenFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewSeenFiltersInput>>>` |
| `seenBy` | `InputMaybe<BooleanFilterInput>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |

### ComponentNewSeenInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `seenBy` | `InputMaybe<Scalars['Boolean']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### ComponentNewTimes
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `stop` | `Maybe<Scalars['DateTime']['output']>` |

### ComponentNewTimesFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewTimesFiltersInput>>>` |
| `not` | `InputMaybe<ComponentNewTimesFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewTimesFiltersInput>>>` |
| `start` | `InputMaybe<DateTimeFilterInput>` |
| `stop` | `InputMaybe<DateTimeFilterInput>` |

### ComponentNewTimesInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |
| `stop` | `InputMaybe<Scalars['DateTime']['input']>` |

### ComponentNewUserAndIshur
| Field | Type |
|-------|------|
| `appruved` | `Maybe<Scalars['Boolean']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ComponentNewUserAndIshurFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewUserAndIshurFiltersInput>>>` |
| `appruved` | `InputMaybe<BooleanFilterInput>` |
| `not` | `InputMaybe<ComponentNewUserAndIshurFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewUserAndIshurFiltersInput>>>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |

### ComponentNewUserAndIshurInput
| Field | Type |
|-------|------|
| `appruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### ComponentProjectsChatre
| Field | Type |
|-------|------|
| `freetext` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `seen` | `Maybe<Scalars['Boolean']['output']>` |
| `send` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `when` | `Maybe<Scalars['DateTime']['output']>` |

### ComponentProjectsChatreFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsChatreFiltersInput>>>` |
| `freetext` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentProjectsChatreFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsChatreFiltersInput>>>` |
| `seen` | `InputMaybe<BooleanFilterInput>` |
| `send` | `InputMaybe<UsersPermissionsUserFiltersInput>` |
| `when` | `InputMaybe<DateTimeFilterInput>` |

### ComponentProjectsChatreInput
| Field | Type |
|-------|------|
| `freetext` | `InputMaybe<Scalars['String']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `seen` | `InputMaybe<Scalars['Boolean']['input']>` |
| `send` | `InputMaybe<Scalars['ID']['input']>` |
| `when` | `InputMaybe<Scalars['DateTime']['input']>` |

### ComponentProjectsHervachti
| Field | Type |
|-------|------|
| `amount` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `matbea` | `Maybe<MatbeaEntityResponse>` |
| `mekabel` | `Maybe<Scalars['Boolean']['output']>` |
| `nirsham` | `Maybe<Scalars['Boolean']['output']>` |
| `noten` | `Maybe<Scalars['Boolean']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ComponentProjectsHervachtiFiltersInput
| Field | Type |
|-------|------|
| `amount` | `InputMaybe<FloatFilterInput>` |
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsHervachtiFiltersInput>>>` |
| `matbea` | `InputMaybe<MatbeaFiltersInput>` |
| `mekabel` | `InputMaybe<BooleanFilterInput>` |
| `nirsham` | `InputMaybe<BooleanFilterInput>` |
| `not` | `InputMaybe<ComponentProjectsHervachtiFiltersInput>` |
| `noten` | `InputMaybe<BooleanFilterInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsHervachtiFiltersInput>>>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |

### ComponentProjectsHervachtiInput
| Field | Type |
|-------|------|
| `amount` | `InputMaybe<Scalars['Float']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `matbea` | `InputMaybe<Scalars['ID']['input']>` |
| `mekabel` | `InputMaybe<Scalars['Boolean']['input']>` |
| `nirsham` | `InputMaybe<Scalars['Boolean']['input']>` |
| `noten` | `InputMaybe<Scalars['Boolean']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### ComponentProjectsIGotMoney
| Field | Type |
|-------|------|
| `iGotMoney` | `Maybe<Scalars['Boolean']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ComponentProjectsIGotMoneyFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyFiltersInput>>>` |
| `iGotMoney` | `InputMaybe<BooleanFilterInput>` |
| `not` | `InputMaybe<ComponentProjectsIGotMoneyFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyFiltersInput>>>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |

### ComponentProjectsIGotMoneyInput
| Field | Type |
|-------|------|
| `iGotMoney` | `InputMaybe<Scalars['Boolean']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### ComponentProjectsMeeting
| Field | Type |
|-------|------|
| `available` | `Maybe<Scalars['Boolean']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ComponentProjectsMonter
| Field | Type |
|-------|------|
| `finnished_mission` | `Maybe<FinnishedMissionEntityResponse>` |
| `hours` | `Maybe<Scalars['Float']['output']>` |
| `hoursdon` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `isDone` | `Maybe<Scalars['Boolean']['output']>` |
| `monthStart` | `Maybe<Scalars['Date']['output']>` |

### ComponentProjectsNegodes
| Field | Type |
|-------|------|
| `des` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `newHours` | `Maybe<Scalars['Int']['output']>` |
| `pic` | `Maybe<UploadFileEntityResponse>` |
| `rechdes` | `Maybe<Scalars['String']['output']>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### ComponentProjectsNegodesVotsArgs
| Field | Type |
|-------|------|
| `filters` | `InputMaybe<ComponentProjectsVotsFiltersInput>` |
| `pagination` | `InputMaybe<PaginationArg>` |
| `sort` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |

### ComponentProjectsNegodesFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsNegodesFiltersInput>>>` |
| `des` | `InputMaybe<StringFilterInput>` |
| `name` | `InputMaybe<StringFilterInput>` |
| `newHours` | `InputMaybe<IntFilterInput>` |
| `not` | `InputMaybe<ComponentProjectsNegodesFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsNegodesFiltersInput>>>` |
| `rechdes` | `InputMaybe<StringFilterInput>` |
| `vots` | `InputMaybe<ComponentProjectsVotsFiltersInput>` |

### ComponentProjectsNegodesInput
| Field | Type |
|-------|------|
| `des` | `InputMaybe<Scalars['String']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `newHours` | `InputMaybe<Scalars['Int']['input']>` |
| `pic` | `InputMaybe<Scalars['ID']['input']>` |
| `rechdes` | `InputMaybe<Scalars['String']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### ComponentProjectsPendmnego
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `ide` | `Maybe<Scalars['Int']['output']>` |
| `negopendmission` | `Maybe<NegopendmissionEntityResponse>` |
| `order` | `Maybe<Scalars['Int']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `what` | `Maybe<Scalars['Boolean']['output']>` |
| `why` | `Maybe<Scalars['String']['output']>` |
| `zman` | `Maybe<Scalars['DateTime']['output']>` |

### ComponentProjectsPendmnegoFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsPendmnegoFiltersInput>>>` |
| `ide` | `InputMaybe<IntFilterInput>` |
| `negopendmission` | `InputMaybe<NegopendmissionFiltersInput>` |
| `not` | `InputMaybe<ComponentProjectsPendmnegoFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsPendmnegoFiltersInput>>>` |
| `order` | `InputMaybe<IntFilterInput>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |
| `what` | `InputMaybe<BooleanFilterInput>` |
| `why` | `InputMaybe<StringFilterInput>` |
| `zman` | `InputMaybe<DateTimeFilterInput>` |

### ComponentProjectsPendmnegoInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `ide` | `InputMaybe<Scalars['Int']['input']>` |
| `negopendmission` | `InputMaybe<Scalars['ID']['input']>` |
| `order` | `InputMaybe<Scalars['Int']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `what` | `InputMaybe<Scalars['Boolean']['input']>` |
| `why` | `InputMaybe<Scalars['String']['input']>` |
| `zman` | `InputMaybe<Scalars['DateTime']['input']>` |

### ComponentProjectsShift
| Field | Type |
|-------|------|
| `finnish` | `Maybe<Scalars['DateTime']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `noofp` | `Maybe<Scalars['Int']['output']>` |
| `sidur` | `Maybe<SidurEntityResponse>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `taken` | `Maybe<Scalars['Boolean']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### ComponentProjectsTaskdis
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `myWhy` | `Maybe<Scalars['String']['output']>` |
| `valiWhy` | `Maybe<Scalars['String']['output']>` |

### ComponentProjectsTaskdisFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsTaskdisFiltersInput>>>` |
| `myWhy` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentProjectsTaskdisFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsTaskdisFiltersInput>>>` |
| `valiWhy` | `InputMaybe<StringFilterInput>` |

### ComponentProjectsTaskdisInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `myWhy` | `InputMaybe<Scalars['String']['input']>` |
| `valiWhy` | `InputMaybe<Scalars['String']['input']>` |

### ComponentProjectsUsersOf
| Field | Type |
|-------|------|
| `finnished_mission` | `Maybe<FinnishedMissionEntityResponse>` |
| `id` | `Scalars['ID']['output']` |
| `joined` | `Maybe<Scalars['Date']['output']>` |
| `mesimabetahaliche` | `Maybe<MesimabetahalichEntityResponse>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `why` | `Maybe<Scalars['String']['output']>` |

### ComponentProjectsUsersOfFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsUsersOfFiltersInput>>>` |
| `finnished_mission` | `InputMaybe<FinnishedMissionFiltersInput>` |
| `joined` | `InputMaybe<DateFilterInput>` |
| `mesimabetahaliche` | `InputMaybe<MesimabetahalichFiltersInput>` |
| `not` | `InputMaybe<ComponentProjectsUsersOfFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsUsersOfFiltersInput>>>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |
| `why` | `InputMaybe<StringFilterInput>` |

### ComponentProjectsUsersOfInput
| Field | Type |
|-------|------|
| `finnished_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `joined` | `InputMaybe<Scalars['Date']['input']>` |
| `mesimabetahaliche` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `why` | `InputMaybe<Scalars['String']['input']>` |

### ComponentProjectsVots
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `ide` | `Maybe<Scalars['Int']['output']>` |
| `order` | `Maybe<Scalars['Int']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `what` | `Maybe<Scalars['Boolean']['output']>` |
| `why` | `Maybe<Scalars['String']['output']>` |
| `zman` | `Maybe<Scalars['DateTime']['output']>` |

### ComponentProjectsVotsFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsFiltersInput>>>` |
| `ide` | `InputMaybe<IntFilterInput>` |
| `not` | `InputMaybe<ComponentProjectsVotsFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsFiltersInput>>>` |
| `order` | `InputMaybe<IntFilterInput>` |
| `users_permissions_user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |
| `what` | `InputMaybe<BooleanFilterInput>` |
| `why` | `InputMaybe<StringFilterInput>` |
| `zman` | `InputMaybe<DateTimeFilterInput>` |

### ComponentProjectsVotsInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `ide` | `InputMaybe<Scalars['Int']['input']>` |
| `order` | `InputMaybe<Scalars['Int']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `what` | `InputMaybe<Scalars['Boolean']['input']>` |
| `why` | `InputMaybe<Scalars['String']['input']>` |
| `zman` | `InputMaybe<Scalars['DateTime']['input']>` |

---

## 📝 Input Types (93)

Used for creating/updating content.

### ActInput
| Field | Type |
|-------|------|
| `dateF` | `InputMaybe<Scalars['DateTime']['input']>` |
| `dateS` | `InputMaybe<Scalars['DateTime']['input']>` |
| `des` | `InputMaybe<Scalars['String']['input']>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hashivut` | `InputMaybe<Enum_Act_Hashivut>` |
| `isAssigned` | `InputMaybe<Scalars['Boolean']['input']>` |
| `link` | `InputMaybe<Scalars['String']['input']>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `my` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `myIshur` | `InputMaybe<Scalars['Boolean']['input']>` |
| `naasa` | `InputMaybe<Scalars['Boolean']['input']>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `pendm` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `shem` | `InputMaybe<Scalars['String']['input']>` |
| `status` | `InputMaybe<Scalars['Int']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `taskdis` | `InputMaybe<Array<InputMaybe<ComponentProjectsTaskdisInput>>>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `userAndIshur` | `InputMaybe<Array<InputMaybe<ComponentNewUserAndIshurInput>>>` |
| `vali` | `InputMaybe<Scalars['ID']['input']>` |
| `valiIshur` | `InputMaybe<Scalars['Boolean']['input']>` |

### ActtInput
| Field | Type |
|-------|------|
| `link` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |

### AskInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `chat` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### AskmInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `chat` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sp` | `InputMaybe<Scalars['ID']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### AskwantInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `chat` | `InputMaybe<Array<InputMaybe<ComponentProjectsChatreInput>>>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### BakashaInput
| Field | Type |
|-------|------|
| `furfiled` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |

### BooleanFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>` |
| `contains` | `InputMaybe<Scalars['Boolean']['input']>` |
| `containsi` | `InputMaybe<Scalars['Boolean']['input']>` |
| `endsWith` | `InputMaybe<Scalars['Boolean']['input']>` |
| `eq` | `InputMaybe<Scalars['Boolean']['input']>` |
| `eqi` | `InputMaybe<Scalars['Boolean']['input']>` |
| `gt` | `InputMaybe<Scalars['Boolean']['input']>` |
| `gte` | `InputMaybe<Scalars['Boolean']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>` |
| `lt` | `InputMaybe<Scalars['Boolean']['input']>` |
| `lte` | `InputMaybe<Scalars['Boolean']['input']>` |
| `ne` | `InputMaybe<Scalars['Boolean']['input']>` |
| `nei` | `InputMaybe<Scalars['Boolean']['input']>` |
| `not` | `InputMaybe<BooleanFilterInput>` |
| `notContains` | `InputMaybe<Scalars['Boolean']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['Boolean']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['Boolean']['input']>` |

### CategoryInput
| Field | Type |
|-------|------|
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### ChezinInput
| Field | Type |
|-------|------|
| `countries` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `deffinitions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `email` | `InputMaybe<Scalars['String']['input']>` |
| `fullAgreement` | `InputMaybe<Scalars['Boolean']['input']>` |
| `myQuotes` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `noOpHours` | `InputMaybe<Scalars['Float']['input']>` |
| `phoneNumber` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `shekelsPerHoure` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### ContentReleasesReleaseActionInput
| Field | Type |
|-------|------|
| `contentType` | `InputMaybe<Scalars['String']['input']>` |
| `locale` | `InputMaybe<Scalars['String']['input']>` |
| `release` | `InputMaybe<Scalars['ID']['input']>` |
| `type` | `InputMaybe<Enum_Contentreleasesreleaseaction_Type>` |

### ContentReleasesReleaseInput
| Field | Type |
|-------|------|
| `actions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `releasedAt` | `InputMaybe<Scalars['DateTime']['input']>` |

### ConventionTextInput
| Field | Type |
|-------|------|
| `conventionText` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `type` | `InputMaybe<Scalars['String']['input']>` |

### CuntryInput
| Field | Type |
|-------|------|
| `alpha2` | `InputMaybe<Scalars['String']['input']>` |
| `alpha3` | `InputMaybe<Scalars['String']['input']>` |
| `deffinitions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `flug` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `free_people` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `signingNumber` | `InputMaybe<Scalars['Long']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### DateFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>` |
| `contains` | `InputMaybe<Scalars['Date']['input']>` |
| `containsi` | `InputMaybe<Scalars['Date']['input']>` |
| `endsWith` | `InputMaybe<Scalars['Date']['input']>` |
| `eq` | `InputMaybe<Scalars['Date']['input']>` |
| `eqi` | `InputMaybe<Scalars['Date']['input']>` |
| `gt` | `InputMaybe<Scalars['Date']['input']>` |
| `gte` | `InputMaybe<Scalars['Date']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>` |
| `lt` | `InputMaybe<Scalars['Date']['input']>` |
| `lte` | `InputMaybe<Scalars['Date']['input']>` |
| `ne` | `InputMaybe<Scalars['Date']['input']>` |
| `nei` | `InputMaybe<Scalars['Date']['input']>` |
| `not` | `InputMaybe<DateFilterInput>` |
| `notContains` | `InputMaybe<Scalars['Date']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['Date']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['Date']['input']>` |

### DateTimeFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>` |
| `contains` | `InputMaybe<Scalars['DateTime']['input']>` |
| `containsi` | `InputMaybe<Scalars['DateTime']['input']>` |
| `endsWith` | `InputMaybe<Scalars['DateTime']['input']>` |
| `eq` | `InputMaybe<Scalars['DateTime']['input']>` |
| `eqi` | `InputMaybe<Scalars['DateTime']['input']>` |
| `gt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `gte` | `InputMaybe<Scalars['DateTime']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>` |
| `lt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `lte` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ne` | `InputMaybe<Scalars['DateTime']['input']>` |
| `nei` | `InputMaybe<Scalars['DateTime']['input']>` |
| `not` | `InputMaybe<DateTimeFilterInput>` |
| `notContains` | `InputMaybe<Scalars['DateTime']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['DateTime']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['DateTime']['input']>` |

### DeaInput
| Field | Type |
|-------|------|
| `desc` | `InputMaybe<Scalars['JSON']['input']>` |
| `head` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `solutions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### DealInput
| Field | Type |
|-------|------|
| `costumers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `salers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### DecisionInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `decisionName` | `InputMaybe<Scalars['String']['input']>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `kind` | `InputMaybe<Enum_Decision_Kind>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `moreHours` | `InputMaybe<Scalars['ID']['input']>` |
| `negodes` | `InputMaybe<Array<InputMaybe<ComponentProjectsNegodesInput>>>` |
| `newFlink` | `InputMaybe<Scalars['String']['input']>` |
| `newHours` | `InputMaybe<Scalars['Int']['input']>` |
| `newWlink` | `InputMaybe<Scalars['String']['input']>` |
| `newname` | `InputMaybe<Scalars['String']['input']>` |
| `newpic` | `InputMaybe<Scalars['ID']['input']>` |
| `newprides` | `InputMaybe<Scalars['String']['input']>` |
| `newpubdes` | `InputMaybe<Scalars['String']['input']>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `timtoM` | `InputMaybe<Scalars['String']['input']>` |
| `valluesadd` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `valluesles` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### DeffinitionInput
| Field | Type |
|-------|------|
| `countries` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `deffinitionName` | `InputMaybe<Scalars['String']['input']>` |
| `free_people` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |

### FileInfoInput
| Field | Type |
|-------|------|
| `alternativeText` | `InputMaybe<Scalars['String']['input']>` |
| `caption` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |

### FiltertagInput
| Field | Type |
|-------|------|
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `positions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### FiniapruvalInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnished_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `missname` | `InputMaybe<Scalars['String']['input']>` |
| `month` | `InputMaybe<Scalars['Date']['input']>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `what` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `why` | `InputMaybe<Scalars['String']['input']>` |

### FinnishedMissionInput
| Field | Type |
|-------|------|
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `finiapruvals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `finish` | `InputMaybe<Scalars['DateTime']['input']>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `idYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isFinished` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isglobal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `mission` | `InputMaybe<Scalars['ID']['input']>` |
| `missionName` | `InputMaybe<Scalars['String']['input']>` |
| `month` | `InputMaybe<Scalars['Date']['input']>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `what` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `why` | `InputMaybe<Scalars['String']['input']>` |

### FloatFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>` |
| `contains` | `InputMaybe<Scalars['Float']['input']>` |
| `containsi` | `InputMaybe<Scalars['Float']['input']>` |
| `endsWith` | `InputMaybe<Scalars['Float']['input']>` |
| `eq` | `InputMaybe<Scalars['Float']['input']>` |
| `eqi` | `InputMaybe<Scalars['Float']['input']>` |
| `gt` | `InputMaybe<Scalars['Float']['input']>` |
| `gte` | `InputMaybe<Scalars['Float']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>` |
| `lt` | `InputMaybe<Scalars['Float']['input']>` |
| `lte` | `InputMaybe<Scalars['Float']['input']>` |
| `ne` | `InputMaybe<Scalars['Float']['input']>` |
| `nei` | `InputMaybe<Scalars['Float']['input']>` |
| `not` | `InputMaybe<FloatFilterInput>` |
| `notContains` | `InputMaybe<Scalars['Float']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['Float']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['Float']['input']>` |

### ForumInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `asks` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `decisions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `done` | `InputMaybe<Scalars['Boolean']['input']>` |
| `forum_last_seens` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `haluka` | `InputMaybe<Scalars['ID']['input']>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `messages` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgisha` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sheirutpend` | `InputMaybe<Scalars['ID']['input']>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `spec` | `InputMaybe<Enum_Forum_Spec>` |
| `subject` | `InputMaybe<Scalars['String']['input']>` |

### ForumLastSeenInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `lastReadAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### HaamadaInput
| Field | Type |
|-------|------|
| `amount` | `InputMaybe<Scalars['Float']['input']>` |
| `comition` | `InputMaybe<Scalars['Float']['input']>` |
| `haamadapruv` | `InputMaybe<Scalars['ID']['input']>` |
| `isReturned` | `InputMaybe<Scalars['Boolean']['input']>` |
| `open_mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `rikmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### HaamadapruvInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `haamada` | `InputMaybe<Scalars['ID']['input']>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### HalukaInput
| Field | Type |
|-------|------|
| `amount` | `InputMaybe<Scalars['Float']['input']>` |
| `chatre` | `InputMaybe<Array<InputMaybe<ComponentProjectsChatreInput>>>` |
| `confirmed` | `InputMaybe<Scalars['Boolean']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `matbea` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `senderconf` | `InputMaybe<Scalars['Boolean']['input']>` |
| `tosplit` | `InputMaybe<Scalars['ID']['input']>` |
| `userrecive` | `InputMaybe<Scalars['ID']['input']>` |
| `usersend` | `InputMaybe<Scalars['ID']['input']>` |
| `ushar` | `InputMaybe<Scalars['Boolean']['input']>` |
| `want` | `InputMaybe<Scalars['ID']['input']>` |

### HatzaaInput
| Field | Type |
|-------|------|
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `perhoure` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `untilwhen` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### HazbaahInput
| Field | Type |
|-------|------|
| `approved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### IdFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `contains` | `InputMaybe<Scalars['ID']['input']>` |
| `containsi` | `InputMaybe<Scalars['ID']['input']>` |
| `endsWith` | `InputMaybe<Scalars['ID']['input']>` |
| `eq` | `InputMaybe<Scalars['ID']['input']>` |
| `eqi` | `InputMaybe<Scalars['ID']['input']>` |
| `gt` | `InputMaybe<Scalars['ID']['input']>` |
| `gte` | `InputMaybe<Scalars['ID']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `lt` | `InputMaybe<Scalars['ID']['input']>` |
| `lte` | `InputMaybe<Scalars['ID']['input']>` |
| `ne` | `InputMaybe<Scalars['ID']['input']>` |
| `nei` | `InputMaybe<Scalars['ID']['input']>` |
| `not` | `InputMaybe<IdFilterInput>` |
| `notContains` | `InputMaybe<Scalars['ID']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['ID']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['ID']['input']>` |

### IntFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>` |
| `contains` | `InputMaybe<Scalars['Int']['input']>` |
| `containsi` | `InputMaybe<Scalars['Int']['input']>` |
| `endsWith` | `InputMaybe<Scalars['Int']['input']>` |
| `eq` | `InputMaybe<Scalars['Int']['input']>` |
| `eqi` | `InputMaybe<Scalars['Int']['input']>` |
| `gt` | `InputMaybe<Scalars['Int']['input']>` |
| `gte` | `InputMaybe<Scalars['Int']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>` |
| `lt` | `InputMaybe<Scalars['Int']['input']>` |
| `lte` | `InputMaybe<Scalars['Int']['input']>` |
| `ne` | `InputMaybe<Scalars['Int']['input']>` |
| `nei` | `InputMaybe<Scalars['Int']['input']>` |
| `not` | `InputMaybe<IntFilterInput>` |
| `notContains` | `InputMaybe<Scalars['Int']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['Int']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['Int']['input']>` |

### JsonFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>` |
| `contains` | `InputMaybe<Scalars['JSON']['input']>` |
| `containsi` | `InputMaybe<Scalars['JSON']['input']>` |
| `endsWith` | `InputMaybe<Scalars['JSON']['input']>` |
| `eq` | `InputMaybe<Scalars['JSON']['input']>` |
| `eqi` | `InputMaybe<Scalars['JSON']['input']>` |
| `gt` | `InputMaybe<Scalars['JSON']['input']>` |
| `gte` | `InputMaybe<Scalars['JSON']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>` |
| `lt` | `InputMaybe<Scalars['JSON']['input']>` |
| `lte` | `InputMaybe<Scalars['JSON']['input']>` |
| `ne` | `InputMaybe<Scalars['JSON']['input']>` |
| `nei` | `InputMaybe<Scalars['JSON']['input']>` |
| `not` | `InputMaybe<JsonFilterInput>` |
| `notContains` | `InputMaybe<Scalars['JSON']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['JSON']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['JSON']['input']>` |

### LongFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>` |
| `contains` | `InputMaybe<Scalars['Long']['input']>` |
| `containsi` | `InputMaybe<Scalars['Long']['input']>` |
| `endsWith` | `InputMaybe<Scalars['Long']['input']>` |
| `eq` | `InputMaybe<Scalars['Long']['input']>` |
| `eqi` | `InputMaybe<Scalars['Long']['input']>` |
| `gt` | `InputMaybe<Scalars['Long']['input']>` |
| `gte` | `InputMaybe<Scalars['Long']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>` |
| `lt` | `InputMaybe<Scalars['Long']['input']>` |
| `lte` | `InputMaybe<Scalars['Long']['input']>` |
| `ne` | `InputMaybe<Scalars['Long']['input']>` |
| `nei` | `InputMaybe<Scalars['Long']['input']>` |
| `not` | `InputMaybe<LongFilterInput>` |
| `notContains` | `InputMaybe<Scalars['Long']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['Long']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['Long']['input']>` |

### MaapInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `rikmash` | `InputMaybe<Scalars['ID']['input']>` |
| `sp` | `InputMaybe<Scalars['ID']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### MachshirInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `jsoni` | `InputMaybe<Scalars['JSON']['input']>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### MashaabimInput
| Field | Type |
|-------|------|
| `bakashas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `kindOf` | `InputMaybe<Enum_Mashaabim_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `negos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users_permissions_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### MashabetahalichInput
| Field | Type |
|-------|------|
| `hoursassigned` | `InputMaybe<Scalars['Float']['input']>` |
| `howmanyhoursalready` | `InputMaybe<Scalars['Float']['input']>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### MatanotInput
| Field | Type |
|-------|------|
| `appruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `bakashas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `categories` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `decision` | `InputMaybe<Scalars['ID']['input']>` |
| `desc` | `InputMaybe<Scalars['JSON']['input']>` |
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `fixPrice` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Matanot_Kindof>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `maxsaleyearone` | `InputMaybe<Scalars['Float']['input']>` |
| `maxsaleyearsec` | `InputMaybe<Scalars['Float']['input']>` |
| `minsaleyearone` | `InputMaybe<Scalars['Float']['input']>` |
| `minsaleyearsec` | `InputMaybe<Scalars['Float']['input']>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `negos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `oneForeProject` | `InputMaybe<Scalars['Boolean']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pic` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `projectcreates` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `sale` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sales` | `InputMaybe<Scalars['Float']['input']>` |
| `sheirutpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |

### MatbeaInput
| Field | Type |
|-------|------|
| `halukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `simbol` | `InputMaybe<Scalars['String']['input']>` |

### MesimabetahalichInput
| Field | Type |
|-------|------|
| `activeTimer` | `InputMaybe<Scalars['ID']['input']>` |
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `admaticedai` | `InputMaybe<Scalars['DateTime']['input']>` |
| `dates` | `InputMaybe<Scalars['DateTime']['input']>` |
| `decisions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `finiapruvals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `finnished` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnished_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `forappruval` | `InputMaybe<Scalars['Boolean']['input']>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `hoursassinged` | `InputMaybe<Scalars['Float']['input']>` |
| `howmanyhoursalready` | `InputMaybe<Scalars['Float']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isglobal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mission` | `InputMaybe<Scalars['ID']['input']>` |
| `monter` | `InputMaybe<Array<InputMaybe<ComponentNewMonterInput>>>` |
| `monters` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `privatlinks` | `InputMaybe<Scalars['String']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publicklinks` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `seeders` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status` | `InputMaybe<Scalars['Int']['input']>` |
| `stname` | `InputMaybe<Scalars['String']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `timegramas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `timer` | `InputMaybe<Scalars['Float']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `zohars` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### MessageInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `content` | `InputMaybe<Scalars['String']['input']>` |
| `editHistory` | `InputMaybe<Array<InputMaybe<ComponentNewEditsInput>>>` |
| `fid` | `InputMaybe<Scalars['Int']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `raplyTo` | `InputMaybe<Scalars['ID']['input']>` |
| `replys` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `seen` | `InputMaybe<Array<InputMaybe<ComponentNewSeenInput>>>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `when` | `InputMaybe<Scalars['DateTime']['input']>` |

### MissionInput
| Field | Type |
|-------|------|
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `finnished_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `missionName` | `InputMaybe<Scalars['String']['input']>` |
| `negos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### ModeInput
| Field | Type |
|-------|------|
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `yat` | `InputMaybe<Scalars['ID']['input']>` |

### MonterInput
| Field | Type |
|-------|------|
| `ani` | `InputMaybe<Scalars['String']['input']>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `done` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finish` | `InputMaybe<Scalars['DateTime']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `sale` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |
| `want` | `InputMaybe<Scalars['ID']['input']>` |

### NegoInput
| Field | Type |
|-------|------|
| `des` | `InputMaybe<Scalars['JSON']['input']>` |
| `fixprice` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Nego_Kindof>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### NegoMashInput
| Field | Type |
|-------|------|
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `easy` | `InputMaybe<Scalars['Float']['input']>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `isOriginal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Negomash_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualedf` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### NegopendmissionInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `date` | `InputMaybe<Scalars['DateTime']['input']>` |
| `dates` | `InputMaybe<Scalars['DateTime']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `filds` | `InputMaybe<ComponentNewNegoInput>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `howMany` | `InputMaybe<Scalars['Long']['input']>` |
| `isMonth` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isOriginal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isRishon` | `InputMaybe<Scalars['Boolean']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `pendm` | `InputMaybe<Scalars['ID']['input']>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### NegotiationInput
| Field | Type |
|-------|------|
| `createdByEmail` | `InputMaybe<Scalars['String']['input']>` |
| `creator` | `InputMaybe<Scalars['ID']['input']>` |
| `currentRound` | `InputMaybe<Scalars['Int']['input']>` |
| `description` | `InputMaybe<Scalars['String']['input']>` |
| `maxRounds` | `InputMaybe<Scalars['Int']['input']>` |
| `participants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `positions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status` | `InputMaybe<Enum_Negotiation_Status>` |
| `topic` | `InputMaybe<Scalars['String']['input']>` |

### OpenMashaabimInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `askms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `declinedsps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `easy` | `InputMaybe<Scalars['Float']['input']>` |
| `haamadapruvs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `haamadas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `howMeny` | `InputMaybe<Scalars['Long']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Openmashaabim_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `rikmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `splited` | `InputMaybe<Scalars['Boolean']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualedf` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### OpenMissionInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `asks` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `dates` | `InputMaybe<Scalars['DateTime']['input']>` |
| `declined` | `InputMaybe<Scalars['ID']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `hatzaas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `howMeny` | `InputMaybe<Scalars['Long']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isRishon` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isglobal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isshift` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mission` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendm` | `InputMaybe<Scalars['ID']['input']>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `privatlinks` | `InputMaybe<Scalars['String']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publicklinks` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `rishon` | `InputMaybe<Scalars['ID']['input']>` |
| `rishonves` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `usersNotRelevant` | `InputMaybe<Scalars['ID']['input']>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### PartofInput
| Field | Type |
|-------|------|
| `default` | `InputMaybe<Scalars['Boolean']['input']>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### PendmInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `dates` | `InputMaybe<Scalars['DateTime']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `diun` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `howMeny` | `InputMaybe<Scalars['Long']['input']>` |
| `isLast` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isglobal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isshift` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mission` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `nego` | `InputMaybe<Array<InputMaybe<ComponentNewNegoInput>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `privatlinks` | `InputMaybe<Scalars['String']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publicklinks` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `rishon` | `InputMaybe<Scalars['ID']['input']>` |
| `rishonves` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<ComponentProjectsPendmnegoInput>>>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### PgishaInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `available` | `InputMaybe<Scalars['Boolean']['input']>` |
| `desc` | `InputMaybe<Scalars['String']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `isLive` | `InputMaybe<Scalars['Boolean']['input']>` |
| `meeting` | `InputMaybe<Array<InputMaybe<ComponentNewMeetingInput>>>` |
| `meetingStartedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `pendingStart` | `InputMaybe<Scalars['Boolean']['input']>` |
| `pgishauserpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishausers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `set` | `InputMaybe<Scalars['Boolean']['input']>` |
| `startRequestedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `startRequestedBy` | `InputMaybe<Scalars['ID']['input']>` |
| `startedBy` | `InputMaybe<Scalars['ID']['input']>` |
| `videoLink` | `InputMaybe<Scalars['String']['input']>` |

### PgishauserInput
| Field | Type |
|-------|------|
| `available` | `InputMaybe<Scalars['Boolean']['input']>` |
| `pgishas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `readyForStart` | `InputMaybe<Scalars['Boolean']['input']>` |
| `uid` | `InputMaybe<Scalars['String']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### PgishauserpendInput
| Field | Type |
|-------|------|
| `approved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `pgisha` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### PmashInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `diun` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `easy` | `InputMaybe<Scalars['Float']['input']>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Pmash_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `nego_mashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negom` | `InputMaybe<Array<InputMaybe<ComponentNewNegomInput>>>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualedf` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### PositionInput
| Field | Type |
|-------|------|
| `aiMeta` | `InputMaybe<Scalars['String']['input']>` |
| `author` | `InputMaybe<Scalars['ID']['input']>` |
| `authorEmail` | `InputMaybe<Scalars['String']['input']>` |
| `description` | `InputMaybe<Scalars['String']['input']>` |
| `heading` | `InputMaybe<Scalars['String']['input']>` |
| `intensity` | `InputMaybe<Scalars['Int']['input']>` |
| `location` | `InputMaybe<Scalars['Float']['input']>` |
| `negotiation` | `InputMaybe<Scalars['ID']['input']>` |
| `order` | `InputMaybe<Scalars['Int']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tags` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `voters` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `votes` | `InputMaybe<Scalars['Int']['input']>` |

### ProjectInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `addHoursManualy` | `InputMaybe<Scalars['Boolean']['input']>` |
| `askms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `asks` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `askwants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `city` | `InputMaybe<Scalars['String']['input']>` |
| `countries` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `deals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `decisions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `deffinitions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descripFor` | `InputMaybe<Scalars['String']['input']>` |
| `discordlink` | `InputMaybe<Scalars['String']['input']>` |
| `drivelink` | `InputMaybe<Scalars['String']['input']>` |
| `fblink` | `InputMaybe<Scalars['String']['input']>` |
| `finiapruvals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `finnishedM72HForDecline` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnishedMAllApruve` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnished_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `githublink` | `InputMaybe<Scalars['String']['input']>` |
| `haamadapruvs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `haamadas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `halukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `isMachzikim` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isMachzikimPublik` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isOt` | `InputMaybe<Scalars['Boolean']['input']>` |
| `linkToWebsite` | `InputMaybe<Scalars['String']['input']>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `machshirs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanotofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `newMeMissionOuto72ho` | `InputMaybe<Scalars['Boolean']['input']>` |
| `newOpenMissionAllApruve` | `InputMaybe<Scalars['Boolean']['input']>` |
| `newOpenMotoAfter72hoursWithnono` | `InputMaybe<Scalars['Boolean']['input']>` |
| `newmeOpenAllapruve` | `InputMaybe<Scalars['Boolean']['input']>` |
| `open_mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pics` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `profilePic` | `InputMaybe<Scalars['ID']['input']>` |
| `projectName` | `InputMaybe<Scalars['String']['input']>` |
| `publicDescription` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `restime` | `InputMaybe<Enum_Project_Restime>` |
| `rikmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sales` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `timeToP` | `InputMaybe<Enum_Project_Timetop>` |
| `timerOnlyTOrAlsoManuallyF` | `InputMaybe<Scalars['Boolean']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `tosplits` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `totalinyearone` | `InputMaybe<Scalars['Float']['input']>` |
| `totalinyearsec` | `InputMaybe<Scalars['Float']['input']>` |
| `totalmaxyearone` | `InputMaybe<Scalars['Float']['input']>` |
| `totalmaxyearsec` | `InputMaybe<Scalars['Float']['input']>` |
| `totalminyearone` | `InputMaybe<Scalars['Float']['input']>` |
| `totalminyearsec` | `InputMaybe<Scalars['Float']['input']>` |
| `twiterlink` | `InputMaybe<Scalars['String']['input']>` |
| `user_1s` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `usersOfP` | `InputMaybe<Array<InputMaybe<ComponentProjectsUsersOfInput>>>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `watsapplink` | `InputMaybe<Scalars['String']['input']>` |
| `welcom_tops` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `zohars` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### RatsonInput
| Field | Type |
|-------|------|
| `allowJoin` | `InputMaybe<Scalars['Boolean']['input']>` |
| `bounti` | `InputMaybe<Scalars['Boolean']['input']>` |
| `desc` | `InputMaybe<Scalars['String']['input']>` |
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `fulfilled` | `InputMaybe<Scalars['Boolean']['input']>` |
| `link` | `InputMaybe<Scalars['String']['input']>` |
| `logo` | `InputMaybe<Scalars['ID']['input']>` |
| `longDes` | `InputMaybe<Scalars['String']['input']>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `pics` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `totalbounti` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### RichtextInput
| Field | Type |
|-------|------|
| `bg` | `InputMaybe<Scalars['String']['input']>` |
| `desc` | `InputMaybe<Scalars['JSON']['input']>` |

### RikmashInput
| Field | Type |
|-------|------|
| `agprice` | `InputMaybe<Scalars['Float']['input']>` |
| `haamadas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Rikmash_Kindof>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sp` | `InputMaybe<Scalars['ID']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualef` | `InputMaybe<Scalars['DateTime']['input']>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### SaleInput
| Field | Type |
|-------|------|
| `date` | `InputMaybe<Scalars['DateTime']['input']>` |
| `finishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `in` | `InputMaybe<Scalars['Float']['input']>` |
| `isMonterActive` | `InputMaybe<Scalars['Boolean']['input']>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `monters` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `note` | `InputMaybe<Scalars['String']['input']>` |
| `pending` | `InputMaybe<Scalars['Boolean']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `splited` | `InputMaybe<Scalars['Boolean']['input']>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tosplits` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `unit` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### SeederInput
| Field | Type |
|-------|------|
| `finnish` | `InputMaybe<Scalars['DateTime']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |

### SheirutInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `askwants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `categories` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `equaliSplited` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `iCanGetMonay` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `iGotIt` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iGotMoney` | `InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyInput>>>` |
| `iTransferMoney` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iTransferedTo` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `isApruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isItOnlyOneInProject` | `InputMaybe<Scalars['Boolean']['input']>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `moneyTransfered` | `InputMaybe<Scalars['Boolean']['input']>` |
| `monters` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `oneTime` | `InputMaybe<Scalars['Boolean']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `productExepted` | `InputMaybe<Scalars['Boolean']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `sales` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutpend` | `InputMaybe<Scalars['ID']['input']>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `wants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `weFinnish` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### SheirutnegoInput
| Field | Type |
|-------|------|
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `isOriginal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `sheirutpend` | `InputMaybe<Scalars['ID']['input']>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### SheirutpendInput
| Field | Type |
|-------|------|
| `appruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirutnegos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### SidurInput
| Field | Type |
|-------|------|
| `lemi` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |

### SkillInput
| Field | Type |
|-------|------|
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `skillName` | `InputMaybe<Scalars['String']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### SolutionInput
| Field | Type |
|-------|------|
| `deas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |

### SpInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `askms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `declinedm` | `InputMaybe<Scalars['ID']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `fdate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `kindOf` | `InputMaybe<Enum_Sp_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `mode` | `InputMaybe<Scalars['ID']['input']>` |
| `myp` | `InputMaybe<Scalars['Float']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `openask` | `InputMaybe<Scalars['ID']['input']>` |
| `panui` | `InputMaybe<Scalars['Boolean']['input']>` |
| `pics` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `rikmash` | `InputMaybe<Scalars['ID']['input']>` |
| `sdate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `splited` | `InputMaybe<Scalars['Boolean']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `unit` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `yat` | `InputMaybe<Scalars['ID']['input']>` |

### StringFilterInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |
| `between` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |
| `contains` | `InputMaybe<Scalars['String']['input']>` |
| `containsi` | `InputMaybe<Scalars['String']['input']>` |
| `endsWith` | `InputMaybe<Scalars['String']['input']>` |
| `eq` | `InputMaybe<Scalars['String']['input']>` |
| `eqi` | `InputMaybe<Scalars['String']['input']>` |
| `gt` | `InputMaybe<Scalars['String']['input']>` |
| `gte` | `InputMaybe<Scalars['String']['input']>` |
| `in` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |
| `lt` | `InputMaybe<Scalars['String']['input']>` |
| `lte` | `InputMaybe<Scalars['String']['input']>` |
| `ne` | `InputMaybe<Scalars['String']['input']>` |
| `nei` | `InputMaybe<Scalars['String']['input']>` |
| `not` | `InputMaybe<StringFilterInput>` |
| `notContains` | `InputMaybe<Scalars['String']['input']>` |
| `notContainsi` | `InputMaybe<Scalars['String']['input']>` |
| `notIn` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |
| `notNull` | `InputMaybe<Scalars['Boolean']['input']>` |
| `null` | `InputMaybe<Scalars['Boolean']['input']>` |
| `or` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |
| `startsWith` | `InputMaybe<Scalars['String']['input']>` |

### TafkidimInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `finnished_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `roleDescription` | `InputMaybe<Scalars['String']['input']>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users_permissions_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### TikunolamInput
| Field | Type |
|-------|------|
| `amort` | `InputMaybe<Scalars['String']['input']>` |
| `amortf` | `InputMaybe<Scalars['String']['input']>` |
| `amorth` | `InputMaybe<Scalars['String']['input']>` |
| `amorts` | `InputMaybe<Scalars['String']['input']>` |
| `amortt` | `InputMaybe<Scalars['String']['input']>` |
| `email` | `InputMaybe<Scalars['String']['input']>` |
| `more` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `notes` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |

### TimegramaInput
| Field | Type |
|-------|------|
| `act` | `InputMaybe<Scalars['ID']['input']>` |
| `actt` | `InputMaybe<Scalars['ID']['input']>` |
| `ask` | `InputMaybe<Scalars['ID']['input']>` |
| `askm` | `InputMaybe<Scalars['ID']['input']>` |
| `askwant` | `InputMaybe<Scalars['ID']['input']>` |
| `date` | `InputMaybe<Scalars['DateTime']['input']>` |
| `decision` | `InputMaybe<Scalars['ID']['input']>` |
| `done` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finiapruval` | `InputMaybe<Scalars['ID']['input']>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `pendm` | `InputMaybe<Scalars['ID']['input']>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirutpend` | `InputMaybe<Scalars['ID']['input']>` |
| `timer` | `InputMaybe<Scalars['ID']['input']>` |
| `tosplit` | `InputMaybe<Scalars['ID']['input']>` |
| `whatami` | `InputMaybe<Scalars['String']['input']>` |

### TimerInput
| Field | Type |
|-------|------|
| `activeMesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `appruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnish` | `InputMaybe<Scalars['DateTime']['input']>` |
| `forApruve` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isActive` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mashabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `saveFiles` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `saveLinks` | `InputMaybe<Scalars['String']['input']>` |
| `saveText` | `InputMaybe<Scalars['String']['input']>` |
| `saved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<ComponentNewTimesInput>>>` |
| `totalHours` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### TosplitInput
| Field | Type |
|-------|------|
| `finished` | `InputMaybe<Scalars['Boolean']['input']>` |
| `halukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hervachti` | `InputMaybe<Array<InputMaybe<ComponentProjectsHervachtiInput>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `prectentage` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sales` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `whynow` | `InputMaybe<Scalars['String']['input']>` |

### TranslateInput
| Field | Type |
|-------|------|
| `amort` | `InputMaybe<Scalars['String']['input']>` |
| `amortf` | `InputMaybe<Scalars['String']['input']>` |
| `amorth` | `InputMaybe<Scalars['String']['input']>` |
| `amorts` | `InputMaybe<Scalars['String']['input']>` |
| `amortt` | `InputMaybe<Scalars['String']['input']>` |
| `email` | `InputMaybe<Scalars['String']['input']>` |
| `from` | `InputMaybe<Scalars['String']['input']>` |
| `lang` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `notes` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |

### UploadFileInput
| Field | Type |
|-------|------|
| `alternativeText` | `InputMaybe<Scalars['String']['input']>` |
| `caption` | `InputMaybe<Scalars['String']['input']>` |
| `ext` | `InputMaybe<Scalars['String']['input']>` |
| `folder` | `InputMaybe<Scalars['ID']['input']>` |
| `folderPath` | `InputMaybe<Scalars['String']['input']>` |
| `formats` | `InputMaybe<Scalars['JSON']['input']>` |
| `hash` | `InputMaybe<Scalars['String']['input']>` |
| `height` | `InputMaybe<Scalars['Int']['input']>` |
| `mime` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `previewUrl` | `InputMaybe<Scalars['String']['input']>` |
| `provider` | `InputMaybe<Scalars['String']['input']>` |
| `provider_metadata` | `InputMaybe<Scalars['JSON']['input']>` |
| `size` | `InputMaybe<Scalars['Float']['input']>` |
| `url` | `InputMaybe<Scalars['String']['input']>` |
| `width` | `InputMaybe<Scalars['Int']['input']>` |

### UploadFolderInput
| Field | Type |
|-------|------|
| `children` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `files` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `parent` | `InputMaybe<Scalars['ID']['input']>` |
| `path` | `InputMaybe<Scalars['String']['input']>` |
| `pathId` | `InputMaybe<Scalars['Int']['input']>` |

### UsersPermissionsLoginInput
| Field | Type |
|-------|------|
| `identifier` | `Scalars['String']['input']` |
| `password` | `Scalars['String']['input']` |
| `provider` | `Scalars['String']['input']` |

### UsersPermissionsRegisterInput
| Field | Type |
|-------|------|
| `email` | `Scalars['String']['input']` |
| `password` | `Scalars['String']['input']` |
| `username` | `Scalars['String']['input']` |

### UsersPermissionsRoleInput
| Field | Type |
|-------|------|
| `description` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `permissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `type` | `InputMaybe<Scalars['String']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### UsersPermissionsUserInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `actsVali` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `arr1` | `InputMaybe<Scalars['JSON']['input']>` |
| `arrdate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `askeds` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `askms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `asks` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `askwants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `bio` | `InputMaybe<Scalars['String']['input']>` |
| `blocked` | `InputMaybe<Scalars['Boolean']['input']>` |
| `chezin` | `InputMaybe<Scalars['ID']['input']>` |
| `city` | `InputMaybe<Scalars['String']['input']>` |
| `confirmationToken` | `InputMaybe<Scalars['String']['input']>` |
| `confirmed` | `InputMaybe<Scalars['Boolean']['input']>` |
| `cuntries` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `deals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `declined` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `declinedByP` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `declinedm` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `device_token` | `InputMaybe<Scalars['String']['input']>` |
| `discordlink` | `InputMaybe<Scalars['String']['input']>` |
| `email` | `InputMaybe<Scalars['String']['input']>` |
| `fblink` | `InputMaybe<Scalars['String']['input']>` |
| `filtertags` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `finiapruvals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `finnished_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `forum_last_seens` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `frd` | `InputMaybe<Enum_Userspermissionsuser_Frd>` |
| `free_person` | `InputMaybe<Scalars['Int']['input']>` |
| `githublink` | `InputMaybe<Scalars['String']['input']>` |
| `haamadas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `halukasend` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `halukasres` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `haskama` | `InputMaybe<Scalars['Long']['input']>` |
| `haskamac` | `InputMaybe<Scalars['Long']['input']>` |
| `haskamaz` | `InputMaybe<Scalars['Long']['input']>` |
| `hatzaas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hervachti` | `InputMaybe<Scalars['Float']['input']>` |
| `iGotMOneyForSheirut` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `isSigned` | `InputMaybe<Scalars['Boolean']['input']>` |
| `lang` | `InputMaybe<Enum_Userspermissionsuser_Lang>` |
| `levManualAlready` | `InputMaybe<Scalars['Boolean']['input']>` |
| `machshirs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `messages` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `moachManualAlready` | `InputMaybe<Scalars['Boolean']['input']>` |
| `nego_mashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negotiations` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negotiationsIparticipante` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `noMail` | `InputMaybe<Scalars['Boolean']['input']>` |
| `noOfHoursProject1` | `InputMaybe<Scalars['Float']['input']>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `password` | `InputMaybe<Scalars['String']['input']>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendmsforme` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishasPendStrat` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishauserpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishausers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `positionsAuthor` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `positionsVoted` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `preferCards` | `InputMaybe<Scalars['Boolean']['input']>` |
| `profilManualAlready` | `InputMaybe<Scalars['Boolean']['input']>` |
| `profilePic` | `InputMaybe<Scalars['ID']['input']>` |
| `projects_1s` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `provider` | `InputMaybe<Scalars['String']['input']>` |
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `resetPasswordToken` | `InputMaybe<Scalars['String']['input']>` |
| `rikmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `rishonvesopen` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `role` | `InputMaybe<Scalars['ID']['input']>` |
| `sales` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutnegos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `shekelsPerHoureProject1` | `InputMaybe<Scalars['Float']['input']>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `socketId` | `InputMaybe<Scalars['String']['input']>` |
| `sphmin` | `InputMaybe<Scalars['Float']['input']>` |
| `sps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `telegramId` | `InputMaybe<Scalars['String']['input']>` |
| `timeForVid` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `twiterlink` | `InputMaybe<Scalars['String']['input']>` |
| `username` | `InputMaybe<Scalars['String']['input']>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `videoval` | `InputMaybe<Scalars['Boolean']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `wants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `welcom_tops` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `zohars` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### VallueInput
| Field | Type |
|-------|------|
| `decisions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `decisionsles` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `valueName` | `InputMaybe<Scalars['String']['input']>` |

### VoteInput
| Field | Type |
|-------|------|
| `deas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `decision` | `InputMaybe<Scalars['ID']['input']>` |
| `hazbaah` | `InputMaybe<Scalars['ID']['input']>` |
| `nego` | `InputMaybe<Scalars['ID']['input']>` |
| `ok` | `InputMaybe<Scalars['Boolean']['input']>` |
| `order` | `InputMaybe<Scalars['Int']['input']>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirutpend` | `InputMaybe<Scalars['ID']['input']>` |
| `timer` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `what` | `InputMaybe<Scalars['Boolean']['input']>` |
| `why` | `InputMaybe<Scalars['String']['input']>` |

### WantInput
| Field | Type |
|-------|------|
| `amountalready` | `InputMaybe<Scalars['Float']['input']>` |
| `appruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnish` | `InputMaybe<Scalars['DateTime']['input']>` |
| `halukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `monters` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `starte` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### WelcomTopInput
| Field | Type |
|-------|------|
| `clicked` | `InputMaybe<Scalars['Boolean']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### WhatandwhyInput
| Field | Type |
|-------|------|
| `what` | `InputMaybe<Scalars['Boolean']['input']>` |
| `why` | `InputMaybe<Scalars['String']['input']>` |

### WorkWayInput
| Field | Type |
|-------|------|
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `workWayName` | `InputMaybe<Scalars['String']['input']>` |

### YatInput
| Field | Type |
|-------|------|
| `modes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### ZoharInput
| Field | Type |
|-------|------|
| `allSubmited` | `InputMaybe<Scalars['Boolean']['input']>` |
| `done` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `weekSt` | `InputMaybe<Scalars['Date']['input']>` |

---

## 🔍 Filter Input Types (82)

Used for querying/filtering content. Each content type has a corresponding filter input.

<details>
<summary>Click to expand all 82 filter types</summary>

#### ActFiltersInput
Fields: `and`, `createdAt`, `dateF`, `dateS`, `des`, `forums`, `hashivut`, `id`, `isAssigned`, `link`, `locale`, `localizations`, `mesimabetahaliches`, `my`, `myIshur`, `naasa`, `negopendmissions`, `not`, `open_mission`, `or`, `pendm`, `project`, `publishedAt`, `shem`, `status`, `tafkidims`, `taskdis`, `timegrama`, `timers`, `updatedAt`, `userAndIshur`, `vali`, `valiIshur`

#### ActtFiltersInput
Fields: `and`, `createdAt`, `id`, `link`, `name`, `not`, `or`, `publishedAt`, `timegrama`, `updatedAt`

#### AskFiltersInput
Fields: `and`, `archived`, `chat`, `createdAt`, `forums`, `id`, `not`, `open_mission`, `or`, `project`, `publishedAt`, `timegrama`, `updatedAt`, `users_permissions_user`, `vots`

#### AskmFiltersInput
Fields: `and`, `archived`, `chat`, `createdAt`, `id`, `not`, `open_mashaabim`, `or`, `project`, `publishedAt`, `sp`, `timegrama`, `updatedAt`, `users_permissions_user`, `vots`

#### AskwantFiltersInput
Fields: `and`, `archived`, `chat`, `createdAt`, `id`, `not`, `or`, `project`, `sheirut`, `timegrama`, `updatedAt`, `users_permissions_user`, `vots`

#### BakashaFiltersInput
Fields: `and`, `createdAt`, `furfiled`, `id`, `mashaabim`, `matanot`, `name`, `not`, `or`, `publishedAt`, `updatedAt`

#### CategoryFiltersInput
Fields: `and`, `createdAt`, `id`, `locale`, `localizations`, `matanots`, `name`, `not`, `or`, `publishedAt`, `sheiruts`, `updatedAt`

#### ChezinFiltersInput
Fields: `and`, `countries`, `createdAt`, `deffinitions`, `email`, `fullAgreement`, `id`, `locale`, `localizations`, `myQuotes`, `name`, `noOpHours`, `not`, `or`, `phoneNumber`, `publishedAt`, `shekelsPerHoure`, `updatedAt`, `users_permissions_user`

#### ContentReleasesReleaseActionFiltersInput
Fields: `and`, `contentType`, `createdAt`, `id`, `locale`, `not`, `or`, `release`, `type`, `updatedAt`

#### ContentReleasesReleaseFiltersInput
Fields: `actions`, `and`, `createdAt`, `id`, `name`, `not`, `or`, `releasedAt`, `updatedAt`

#### ConventionTextFiltersInput
Fields: `and`, `conventionText`, `createdAt`, `id`, `locale`, `localizations`, `not`, `or`, `publishedAt`, `type`, `updatedAt`

#### CuntryFiltersInput
Fields: `alpha2`, `alpha3`, `and`, `createdAt`, `deffinitions`, `free_people`, `id`, `locale`, `localizations`, `name`, `not`, `or`, `projects`, `publishedAt`, `signingNumber`, `updatedAt`, `users`

#### DeaFiltersInput
Fields: `and`, `createdAt`, `desc`, `head`, `id`, `not`, `or`, `publishedAt`, `solutions`, `updatedAt`, `votes`

#### DealFiltersInput
Fields: `and`, `costumers`, `createdAt`, `id`, `not`, `or`, `publishedAt`, `salers`, `updatedAt`

#### DecisionFiltersInput
Fields: `and`, `archived`, `createdAt`, `decisionName`, `forums`, `id`, `kind`, `matanot`, `moreHours`, `negodes`, `newFlink`, `newHours`, `newWlink`, `newname`, `newprides`, `newpubdes`, `not`, `or`, `projects`, `publishedAt`, `timegrama`, `timtoM`, `updatedAt`, `valluesadd`, `valluesles`, `votes`, `vots`

#### DeffinitionFiltersInput
Fields: `and`, `countries`, `createdAt`, `deffinitionName`, `free_people`, `id`, `locale`, `localizations`, `not`, `or`, `projects`, `publishedAt`, `updatedAt`

#### FiltertagFiltersInput
Fields: `and`, `createdAt`, `id`, `locale`, `localizations`, `name`, `not`, `or`, `positions`, `publishedAt`, `updatedAt`, `users_permissions_users`

#### FiniapruvalFiltersInput
Fields: `and`, `archived`, `createdAt`, `finnished_mission`, `id`, `iskvua`, `mesimabetahalich`, `missname`, `month`, `noofhours`, `not`, `or`, `project`, `publishedAt`, `timegrama`, `updatedAt`, `users_permissions_user`, `vots`, `why`

#### FinnishedMissionFiltersInput
Fields: `and`, `createdAt`, `descrip`, `finiapruvals`, `finish`, `hearotMeyuchadot`, `id`, `idYesod`, `isFinished`, `isMust`, `isglobal`, `iskvua`, `locale`, `localizations`, `mesimabetahalich`, `mission`, `missionName`, `month`, `noofhours`, `not`, `or`, `perhour`, `project`, `publishedAt`, `start`, `tafkidims`, `total`, `updatedAt`, `users_permissions_user`, `why`

#### ForumFiltersInput
Fields: `acts`, `and`, `asks`, `createdAt`, `decisions`, `done`, `forum_last_seens`, `haluka`, `id`, `mesimabetahaliches`, `messages`, `not`, `or`, `pgisha`, `project`, `publishedAt`, `sheirutpend`, `sheiruts`, `spec`, `subject`, `updatedAt`

#### ForumLastSeenFiltersInput
Fields: `and`, `archived`, `createdAt`, `forum`, `id`, `lastReadAt`, `not`, `or`, `updatedAt`, `users_permissions_user`

#### HaamadaFiltersInput
Fields: `amount`, `and`, `comition`, `createdAt`, `haamadapruv`, `id`, `isReturned`, `not`, `open_mashaabims`, `or`, `project`, `publishedAt`, `rikmashes`, `updatedAt`, `users_permissions_user`

#### HaamadapruvFiltersInput
Fields: `and`, `archived`, `createdAt`, `haamada`, `id`, `not`, `open_mashaabim`, `or`, `project`, `publishedAt`, `updatedAt`, `vots`

#### HalukaFiltersInput
Fields: `amount`, `and`, `chatre`, `confirmed`, `createdAt`, `forum`, `id`, `locale`, `localizations`, `matbea`, `not`, `or`, `project`, `publishedAt`, `senderconf`, `tosplit`, `updatedAt`, `userrecive`, `usersend`, `ushar`, `want`

#### HatzaaFiltersInput
Fields: `and`, `createdAt`, `id`, `noofhours`, `not`, `open_mission`, `or`, `perhoure`, `publishedAt`, `untilwhen`, `updatedAt`, `users_permissions_user`, `vots`

#### HazbaahFiltersInput
Fields: `and`, `approved`, `createdAt`, `id`, `not`, `or`, `publishedAt`, `updatedAt`, `votes`

#### I18NLocaleFiltersInput
Fields: `and`, `code`, `createdAt`, `id`, `name`, `not`, `or`, `updatedAt`

#### MaapFiltersInput
Fields: `and`, `archived`, `createdAt`, `id`, `locale`, `localizations`, `name`, `not`, `open_mashaabim`, `or`, `partofs`, `project`, `publishedAt`, `rikmash`, `sp`, `timegrama`, `updatedAt`, `vots`

#### MachshirFiltersInput
Fields: `and`, `archived`, `createdAt`, `id`, `jsoni`, `not`, `or`, `projects`, `publishedAt`, `updatedAt`, `users_permissions_user`

#### MashaabimFiltersInput
Fields: `and`, `bakashas`, `createdAt`, `descrip`, `id`, `kindOf`, `linkto`, `locale`, `localizations`, `matanots`, `name`, `negos`, `not`, `open_mashaabims`, `or`, `pmashes`, `price`, `projects`, `publishedAt`, `ratsons`, `sps`, `updatedAt`, `users_permissions_users`

#### MashabetahalichFiltersInput
Fields: `and`, `createdAt`, `hoursassigned`, `howmanyhoursalready`, `id`, `not`, `or`, `perhour`, `publishedAt`, `timers`, `updatedAt`

#### MatanotFiltersInput
Fields: `and`, `appruved`, `archived`, `bakashas`, `categories`, `createdAt`, `decision`, `desc`, `finnishDate`, `fixPrice`, `id`, `kindOf`, `locale`, `localizations`, `mashaabims`, `maxsaleyearone`, `maxsaleyearsec`, `minsaleyearone`, `minsaleyearsec`, `missions`, `name`, `negos`, `not`, `oneForeProject`, `or`, `partofs`, `price`, `projectcreates`, `publishedAt`, `quant`, `sale`, `sales`, `sheirutpends`, `sheiruts`, `startDate`, `updatedAt`

#### MatbeaFiltersInput
Fields: `and`, `createdAt`, `halukas`, `id`, `locale`, `localizations`, `name`, `not`, `or`, `publishedAt`, `simbol`, `updatedAt`

#### MesimabetahalichFiltersInput
Fields: `activeTimer`, `acts`, `admaticedai`, `and`, `createdAt`, `dates`, `decisions`, `descrip`, `finiapruvals`, `finnished`, `finnished_missions`, `forappruval`, `forums`, `hearotMeyuchadot`, `hoursassinged`, `howmanyhoursalready`, `id`, `isMust`, `isYesod`, `isglobal`, `iskvua`, `mission`, `monter`, `monters`, `name`, `not`, `or`, `partofs`, `perhour`, `privatlinks`, `project`, `publicklinks`, `publishedAt`, `seeders`, `start`, `status`, `stname`, `tafkidims`, `timegramas`, `timer`, `timers`, `updatedAt`, `users_permissions_user`, `zohars`

#### MessageFiltersInput
Fields: `and`, `archived`, `content`, `createdAt`, `editHistory`, `fid`, `forum`, `id`, `not`, `or`, `publishedAt`, `raplyTo`, `replys`, `seen`, `updatedAt`, `users_permissions_user`, `when`

#### MissionFiltersInput
Fields: `and`, `createdAt`, `descrip`, `finnished_missions`, `id`, `locale`, `localizations`, `matanots`, `mesimabetahaliches`, `missionName`, `negos`, `not`, `open_missions`, `or`, `pendms`, `projects`, `publishedAt`, `ratsons`, `skills`, `tafkidims`, `updatedAt`, `work_ways`

#### ModeFiltersInput
Fields: `and`, `createdAt`, `id`, `name`, `not`, `or`, `publishedAt`, `sps`, `updatedAt`, `yat`

#### MonterFiltersInput
Fields: `and`, `ani`, `archived`, `createdAt`, `done`, `finish`, `id`, `mesimabetahalich`, `not`, `or`, `sale`, `sheirut`, `start`, `updatedAt`, `want`

#### NegoFiltersInput
Fields: `and`, `createdAt`, `des`, `fixprice`, `id`, `kindOf`, `mashaabims`, `matanot`, `missions`, `name`, `not`, `or`, `price`, `publishedAt`, `quant`, `updatedAt`, `votes`

#### NegoMashFiltersInput
Fields: `and`, `createdAt`, `descrip`, `easy`, `hm`, `id`, `isOriginal`, `kindOf`, `linkto`, `name`, `not`, `or`, `pmash`, `price`, `publishedAt`, `spnot`, `sqadualed`, `sqadualedf`, `updatedAt`, `users`, `users_permissions_user`

#### NegopendmissionFiltersInput
Fields: `acts`, `and`, `createdAt`, `date`, `dates`, `descrip`, `filds`, `hearotMeyuchadot`, `howMany`, `id`, `isMonth`, `isOriginal`, `isRishon`, `name`, `noofhours`, `not`, `open_mission`, `or`, `pendm`, `perhour`, `publishedAt`, `skills`, `tafkidims`, `total`, `updatedAt`, `users_permissions_user`, `vots`, `work_ways`

#### NegotiationFiltersInput
Fields: `and`, `createdAt`, `createdByEmail`, `creator`, `currentRound`, `description`, `id`, `maxRounds`, `not`, `or`, `participants`, `positions`, `publishedAt`, `status`, `topic`, `updatedAt`

#### OpenMashaabimFiltersInput
Fields: `and`, `archived`, `askms`, `createdAt`, `declinedsps`, `descrip`, `easy`, `haamadapruvs`, `haamadas`, `hm`, `howMeny`, `id`, `isMust`, `isYesod`, `kindOf`, `linkto`, `locale`, `localizations`, `maap`, `mashaabim`, `name`, `not`, `or`, `partofs`, `pmash`, `price`, `project`, `publishedAt`, `rikmashes`, `splited`, `spnot`, `sps`, `sqadualed`, `sqadualedf`, `updatedAt`, `users`

#### OpenMissionFiltersInput
Fields: `acts`, `and`, `archived`, `asks`, `createdAt`, `dates`, `declined`, `descrip`, `hatzaas`, `hearotMeyuchadot`, `howMeny`, `id`, `isMust`, `isRishon`, `isYesod`, `isglobal`, `iskvua`, `isshift`, `locale`, `localizations`, `mission`, `name`, `negopendmissions`, `noofhours`, `not`, `or`, `partofs`, `pendm`, `perhour`, `privatlinks`, `project`, `publicklinks`, `publishedAt`, `rishon`, `rishonves`, `skills`, `sqadualed`, `tafkidims`, `updatedAt`, `users`, `usersNotRelevant`, `vallues`, `work_ways`

#### PartofFiltersInput
Fields: `and`, `createdAt`, `default`, `id`, `maaps`, `matanots`, `mesimabetahaliches`, `not`, `open_mashaabims`, `open_missions`, `or`, `updatedAt`

#### PendmFiltersInput
Fields: `acts`, `and`, `archived`, `createdAt`, `dates`, `descrip`, `diun`, `hearotMeyuchadot`, `howMeny`, `id`, `isLast`, `isMust`, `isYesod`, `isglobal`, `iskvua`, `isshift`, `mission`, `name`, `nego`, `negopendmissions`, `noofhours`, `not`, `open_mission`, `or`, `perhour`, `privatlinks`, `project`, `publicklinks`, `publishedAt`, `rishon`, `rishonves`, `skills`, `sqadualed`, `tafkidims`, `timegrama`, `updatedAt`, `users`, `vallues`, `work_ways`

#### PgishaFiltersInput
Fields: `and`, `archived`, `available`, `createdAt`, `desc`, `forum`, `id`, `isLive`, `locale`, `localizations`, `meeting`, `meetingStartedAt`, `name`, `not`, `or`, `pendingStart`, `pgishauserpends`, `pgishausers`, `publishedAt`, `set`, `startRequestedAt`, `startRequestedBy`, `startedBy`, `updatedAt`, `videoLink`

#### PgishauserFiltersInput
Fields: `and`, `available`, `createdAt`, `id`, `not`, `or`, `pgishas`, `publishedAt`, `readyForStart`, `uid`, `updatedAt`, `users_permissions_user`

#### PgishauserpendFiltersInput
Fields: `and`, `approved`, `archived`, `createdAt`, `id`, `not`, `or`, `pgisha`, `updatedAt`, `users_permissions_user`

#### PmashFiltersInput
Fields: `and`, `archived`, `createdAt`, `descrip`, `diun`, `easy`, `hm`, `id`, `isMust`, `isYesod`, `kindOf`, `linkto`, `mashaabim`, `name`, `nego_mashes`, `negom`, `not`, `open_mashaabim`, `or`, `price`, `project`, `publishedAt`, `spnot`, `sqadualed`, `sqadualedf`, `timegrama`, `updatedAt`, `users`

#### PositionFiltersInput
Fields: `aiMeta`, `and`, `author`, `authorEmail`, `createdAt`, `description`, `heading`, `id`, `intensity`, `location`, `negotiation`, `not`, `or`, `order`, `publishedAt`, `tags`, `updatedAt`, `voters`, `votes`

#### ProjectFiltersInput
Fields: `acts`, `addHoursManualy`, `and`, `askms`, `asks`, `askwants`, `city`, `countries`, `createdAt`, `deals`, `decisions`, `deffinitions`, `descripFor`, `discordlink`, `drivelink`, `fblink`, `finiapruvals`, `finnishedM72HForDecline`, `finnishedMAllApruve`, `finnished_missions`, `forums`, `githublink`, `haamadapruvs`, `haamadas`, `halukas`, `id`, `isMachzikim`, `isMachzikimPublik`, `isOt`, `linkToWebsite`, `locale`, `localizations`, `maaps`, `machshirs`, `mashaabims`, `matanotofs`, `mesimabetahaliches`, `missions`, `newMeMissionOuto72ho`, `newOpenMissionAllApruve`, `newOpenMotoAfter72hoursWithnono`, `newmeOpenAllapruve`, `not`, `open_mashaabims`, `open_missions`, `or`, `pendms`, `pmashes`, `projectName`, `publicDescription`, `publishedAt`, `restime`, `rikmashes`, `sales`, `sheirutpends`, `sheiruts`, `sps`, `tafkidims`, `timeToP`, `timerOnlyTOrAlsoManuallyF`, `timers`, `tosplits`, `totalinyearone`, `totalinyearsec`, `totalmaxyearone`, `totalmaxyearsec`, `totalminyearone`, `totalminyearsec`, `twiterlink`, `updatedAt`, `user_1s`, `usersOfP`, `vallues`, `watsapplink`, `welcom_tops`, `work_ways`, `zohars`

#### RatsonFiltersInput
Fields: `allowJoin`, `and`, `bounti`, `createdAt`, `desc`, `finnishDate`, `fulfilled`, `id`, `link`, `locale`, `localizations`, `longDes`, `mashaabims`, `missions`, `name`, `not`, `or`, `publishedAt`, `startDate`, `totalbounti`, `updatedAt`, `users_permissions_users`, `vallues`

#### RichtextFiltersInput
Fields: `and`, `bg`, `createdAt`, `desc`, `id`, `locale`, `localizations`, `not`, `or`, `updatedAt`

#### RikmashFiltersInput
Fields: `agprice`, `and`, `createdAt`, `haamadas`, `hm`, `id`, `isMust`, `isYesod`, `kindOf`, `maap`, `name`, `not`, `open_mashaabim`, `or`, `price`, `project`, `publishedAt`, `sp`, `spnot`, `sqadualed`, `sqadualef`, `total`, `updatedAt`, `users_permissions_user`

#### SaleFiltersInput
Fields: `and`, `createdAt`, `date`, `finishDate`, `id`, `in`, `isMonterActive`, `matanot`, `monters`, `not`, `note`, `or`, `pending`, `project`, `publishedAt`, `sheiruts`, `splited`, `startDate`, `tosplits`, `unit`, `updatedAt`, `users_permissions_user`

#### SeederFiltersInput
Fields: `and`, `createdAt`, `finnish`, `id`, `mesimabetahalich`, `not`, `or`, `publishedAt`, `start`, `updatedAt`

#### SheirutFiltersInput
Fields: `and`, `archived`, `askwants`, `categories`, `createdAt`, `descrip`, `equaliSplited`, `finnishDate`, `forums`, `iCanGetMonay`, `iGotIt`, `iGotMoney`, `iTransferMoney`, `iTransferedTo`, `id`, `isApruved`, `isItOnlyOneInProject`, `locale`, `localizations`, `matanot`, `moneyTransfered`, `monters`, `name`, `not`, `oneTime`, `or`, `price`, `productExepted`, `project`, `quant`, `sales`, `sheirutpend`, `startDate`, `total`, `updatedAt`, `users_permissions_users`, `wants`, `weFinnish`

#### SheirutnegoFiltersInput
Fields: `and`, `createdAt`, `finnishDate`, `id`, `isOriginal`, `not`, `or`, `price`, `publishedAt`, `quant`, `sheirutpend`, `startDate`, `updatedAt`, `users_permissions_user`, `vots`

#### SheirutpendFiltersInput
Fields: `and`, `appruved`, `archived`, `createdAt`, `finnishDate`, `forum`, `id`, `locale`, `localizations`, `matanots`, `not`, `or`, `price`, `project`, `quant`, `sheirut`, `sheirutnegos`, `startDate`, `timegrama`, `total`, `updatedAt`, `users_permissions_user`, `votes`, `vots`

#### SidurFiltersInput
Fields: `and`, `createdAt`, `id`, `lemi`, `not`, `or`, `publishedAt`, `updatedAt`

#### SkillFiltersInput
Fields: `and`, `createdAt`, `descrip`, `id`, `locale`, `localizations`, `missions`, `negopendmissions`, `not`, `open_missions`, `or`, `pendms`, `publishedAt`, `skillName`, `tafkidims`, `updatedAt`, `users`

#### SolutionFiltersInput
Fields: `and`, `createdAt`, `deas`, `id`, `not`, `or`, `publishedAt`, `updatedAt`

#### SpFiltersInput
Fields: `and`, `archived`, `askms`, `createdAt`, `declinedm`, `descrip`, `fdate`, `id`, `kindOf`, `linkto`, `locale`, `localizations`, `maaps`, `mashaabim`, `mode`, `myp`, `name`, `not`, `openask`, `or`, `panui`, `price`, `project`, `publishedAt`, `rikmash`, `sdate`, `splited`, `spnot`, `unit`, `updatedAt`, `users_permissions_user`, `yat`

#### TafkidimFiltersInput
Fields: `acts`, `and`, `createdAt`, `descrip`, `finnished_missions`, `id`, `locale`, `localizations`, `mesimabetahaliches`, `missions`, `negopendmissions`, `not`, `open_missions`, `or`, `pendms`, `projects`, `publishedAt`, `roleDescription`, `skills`, `updatedAt`, `users_permissions_users`

#### TikunolamFiltersInput
Fields: `amort`, `amortf`, `amorth`, `amorts`, `amortt`, `and`, `createdAt`, `email`, `id`, `locale`, `localizations`, `more`, `name`, `not`, `notes`, `or`, `publishedAt`, `updatedAt`

#### TimegramaFiltersInput
Fields: `act`, `actt`, `and`, `ask`, `askm`, `askwant`, `createdAt`, `date`, `decision`, `done`, `finiapruval`, `id`, `maap`, `mesimabetahalich`, `not`, `or`, `pendm`, `pmash`, `sheirutpend`, `timer`, `tosplit`, `updatedAt`, `whatami`

#### TimerFiltersInput
Fields: `activeMesimabetahalich`, `acts`, `and`, `appruved`, `createdAt`, `finnish`, `forApruve`, `id`, `isActive`, `locale`, `localizations`, `mashabetahalich`, `mesimabetahalich`, `not`, `or`, `project`, `saveLinks`, `saveText`, `saved`, `start`, `timegrama`, `timers`, `totalHours`, `updatedAt`, `users_permissions_user`, `votes`

#### TosplitFiltersInput
Fields: `and`, `createdAt`, `finished`, `halukas`, `hervachti`, `id`, `locale`, `localizations`, `name`, `not`, `or`, `prectentage`, `project`, `publishedAt`, `sales`, `timegrama`, `updatedAt`, `vots`, `whynow`

#### TranslateFiltersInput
Fields: `amort`, `amortf`, `amorth`, `amorts`, `amortt`, `and`, `createdAt`, `email`, `from`, `id`, `lang`, `name`, `not`, `notes`, `or`, `publishedAt`, `updatedAt`

#### UploadFileFiltersInput
Fields: `alternativeText`, `and`, `caption`, `createdAt`, `ext`, `folder`, `folderPath`, `formats`, `hash`, `height`, `id`, `mime`, `name`, `not`, `or`, `previewUrl`, `provider`, `provider_metadata`, `size`, `updatedAt`, `url`, `width`

#### UploadFolderFiltersInput
Fields: `and`, `children`, `createdAt`, `files`, `id`, `name`, `not`, `or`, `parent`, `path`, `pathId`, `updatedAt`

#### UsersPermissionsPermissionFiltersInput
Fields: `action`, `and`, `createdAt`, `id`, `not`, `or`, `role`, `updatedAt`

#### UsersPermissionsRoleFiltersInput
Fields: `and`, `createdAt`, `description`, `id`, `name`, `not`, `or`, `permissions`, `type`, `updatedAt`, `users`

#### UsersPermissionsUserFiltersInput
Fields: `acts`, `actsVali`, `and`, `arr1`, `arrdate`, `askeds`, `askms`, `asks`, `askwants`, `bio`, `blocked`, `chezin`, `city`, `confirmationToken`, `confirmed`, `createdAt`, `cuntries`, `deals`, `declined`, `declinedByP`, `declinedm`, `device_token`, `discordlink`, `email`, `fblink`, `filtertags`, `finiapruvals`, `finnished_missions`, `forum_last_seens`, `frd`, `free_person`, `githublink`, `haamadas`, `halukasend`, `halukasres`, `haskama`, `haskamac`, `haskamaz`, `hatzaas`, `hervachti`, `iGotMOneyForSheirut`, `id`, `isSigned`, `lang`, `levManualAlready`, `machshirs`, `mashaabims`, `mesimabetahaliches`, `messages`, `moachManualAlready`, `nego_mashes`, `negopendmissions`, `negotiations`, `negotiationsIparticipante`, `noMail`, `noOfHoursProject1`, `not`, `open_missions`, `or`, `password`, `pendms`, `pendmsforme`, `pgishas`, `pgishasPendStrat`, `pgishauserpends`, `pgishausers`, `positionsAuthor`, `positionsVoted`, `preferCards`, `profilManualAlready`, `projects_1s`, `provider`, `ratsons`, `resetPasswordToken`, `rikmashes`, `rishonvesopen`, `role`, `sales`, `sheirutnegos`, `sheirutpends`, `sheiruts`, `shekelsPerHoureProject1`, `skills`, `socketId`, `sphmin`, `sps`, `tafkidims`, `telegramId`, `timeForVid`, `timers`, `twiterlink`, `updatedAt`, `username`, `vallues`, `videoval`, `votes`, `wants`, `welcom_tops`, `work_ways`, `zohars`

#### VallueFiltersInput
Fields: `and`, `createdAt`, `decisions`, `decisionsles`, `descrip`, `id`, `locale`, `localizations`, `not`, `open_missions`, `or`, `pendms`, `projects`, `publishedAt`, `ratsons`, `updatedAt`, `users`, `valueName`

#### VoteFiltersInput
Fields: `and`, `createdAt`, `deas`, `decision`, `hazbaah`, `id`, `nego`, `not`, `ok`, `or`, `order`, `sheirut`, `sheirutpend`, `timer`, `updatedAt`, `users_permissions_user`, `what`, `why`

#### WantFiltersInput
Fields: `amountalready`, `and`, `appruved`, `archived`, `createdAt`, `finnish`, `halukas`, `id`, `locale`, `localizations`, `monters`, `not`, `or`, `sheirut`, `starte`, `updatedAt`, `users_permissions_user`

#### WelcomTopFiltersInput
Fields: `and`, `clicked`, `createdAt`, `id`, `not`, `or`, `project`, `publishedAt`, `updatedAt`, `users_permissions_user`

#### WorkWayFiltersInput
Fields: `and`, `createdAt`, `id`, `locale`, `localizations`, `missions`, `negopendmissions`, `not`, `open_missions`, `or`, `pendms`, `projects`, `publishedAt`, `updatedAt`, `users`, `workWayName`

#### YatFiltersInput
Fields: `and`, `createdAt`, `id`, `modes`, `name`, `not`, `or`, `publishedAt`, `sps`, `updatedAt`

#### ZoharFiltersInput
Fields: `allSubmited`, `and`, `createdAt`, `done`, `id`, `mesimabetahalich`, `not`, `or`, `project`, `publishedAt`, `updatedAt`, `users_permissions_user`, `weekSt`

</details>

---

## 📦 Entity Response Types (320)

Wrapper types for GraphQL responses.

<details>
<summary>Click to expand all 320 response types</summary>

- **ActEntity**: `attributes: Maybe<Act>`, `id: Maybe<Scalars['ID']['output']>`
- **ActEntityResponse**: `data: Maybe<ActEntity>`
- **ActEntityResponseCollection**: `data: Array<ActEntity>`, `meta: ResponseCollectionMeta`
- **ActRelationResponseCollection**: `data: Array<ActEntity>`
- **ActtEntity**: `attributes: Maybe<Actt>`, `id: Maybe<Scalars['ID']['output']>`
- **ActtEntityResponse**: `data: Maybe<ActtEntity>`
- **ActtEntityResponseCollection**: `data: Array<ActtEntity>`, `meta: ResponseCollectionMeta`
- **AskEntity**: `attributes: Maybe<Ask>`, `id: Maybe<Scalars['ID']['output']>`
- **AskEntityResponse**: `data: Maybe<AskEntity>`
- **AskEntityResponseCollection**: `data: Array<AskEntity>`, `meta: ResponseCollectionMeta`
- **AskRelationResponseCollection**: `data: Array<AskEntity>`
- **AskmEntity**: `attributes: Maybe<Askm>`, `id: Maybe<Scalars['ID']['output']>`
- **AskmEntityResponse**: `data: Maybe<AskmEntity>`
- **AskmEntityResponseCollection**: `data: Array<AskmEntity>`, `meta: ResponseCollectionMeta`
- **AskmRelationResponseCollection**: `data: Array<AskmEntity>`
- **AskwantEntity**: `attributes: Maybe<Askwant>`, `id: Maybe<Scalars['ID']['output']>`
- **AskwantEntityResponse**: `data: Maybe<AskwantEntity>`
- **AskwantEntityResponseCollection**: `data: Array<AskwantEntity>`, `meta: ResponseCollectionMeta`
- **AskwantRelationResponseCollection**: `data: Array<AskwantEntity>`
- **BakashaEntity**: `attributes: Maybe<Bakasha>`, `id: Maybe<Scalars['ID']['output']>`
- **BakashaEntityResponse**: `data: Maybe<BakashaEntity>`
- **BakashaEntityResponseCollection**: `data: Array<BakashaEntity>`, `meta: ResponseCollectionMeta`
- **BakashaRelationResponseCollection**: `data: Array<BakashaEntity>`
- **CategoryEntity**: `attributes: Maybe<Category>`, `id: Maybe<Scalars['ID']['output']>`
- **CategoryEntityResponse**: `data: Maybe<CategoryEntity>`
- **CategoryEntityResponseCollection**: `data: Array<CategoryEntity>`, `meta: ResponseCollectionMeta`
- **CategoryRelationResponseCollection**: `data: Array<CategoryEntity>`
- **ChezinEntity**: `attributes: Maybe<Chezin>`, `id: Maybe<Scalars['ID']['output']>`
- **ChezinEntityResponse**: `data: Maybe<ChezinEntity>`
- **ChezinEntityResponseCollection**: `data: Array<ChezinEntity>`, `meta: ResponseCollectionMeta`
- **ChezinRelationResponseCollection**: `data: Array<ChezinEntity>`
- **ContentReleasesReleaseActionEntity**: `attributes: Maybe<ContentReleasesReleaseAction>`, `id: Maybe<Scalars['ID']['output']>`
- **ContentReleasesReleaseActionEntityResponse**: `data: Maybe<ContentReleasesReleaseActionEntity>`
- **ContentReleasesReleaseActionEntityResponseCollection**: `data: Array<ContentReleasesReleaseActionEntity>`, `meta: ResponseCollectionMeta`
- **ContentReleasesReleaseActionRelationResponseCollection**: `data: Array<ContentReleasesReleaseActionEntity>`
- **ContentReleasesReleaseEntity**: `attributes: Maybe<ContentReleasesRelease>`, `id: Maybe<Scalars['ID']['output']>`
- **ContentReleasesReleaseEntityResponse**: `data: Maybe<ContentReleasesReleaseEntity>`
- **ContentReleasesReleaseEntityResponseCollection**: `data: Array<ContentReleasesReleaseEntity>`, `meta: ResponseCollectionMeta`
- **ConventionTextEntity**: `attributes: Maybe<ConventionText>`, `id: Maybe<Scalars['ID']['output']>`
- **ConventionTextEntityResponse**: `data: Maybe<ConventionTextEntity>`
- **ConventionTextEntityResponseCollection**: `data: Array<ConventionTextEntity>`, `meta: ResponseCollectionMeta`
- **ConventionTextRelationResponseCollection**: `data: Array<ConventionTextEntity>`
- **CuntryEntity**: `attributes: Maybe<Cuntry>`, `id: Maybe<Scalars['ID']['output']>`
- **CuntryEntityResponse**: `data: Maybe<CuntryEntity>`
- **CuntryEntityResponseCollection**: `data: Array<CuntryEntity>`, `meta: ResponseCollectionMeta`
- **CuntryRelationResponseCollection**: `data: Array<CuntryEntity>`
- **DeaEntity**: `attributes: Maybe<Dea>`, `id: Maybe<Scalars['ID']['output']>`
- **DeaEntityResponse**: `data: Maybe<DeaEntity>`
- **DeaEntityResponseCollection**: `data: Array<DeaEntity>`, `meta: ResponseCollectionMeta`
- **DeaRelationResponseCollection**: `data: Array<DeaEntity>`
- **DealEntity**: `attributes: Maybe<Deal>`, `id: Maybe<Scalars['ID']['output']>`
- **DealEntityResponse**: `data: Maybe<DealEntity>`
- **DealEntityResponseCollection**: `data: Array<DealEntity>`, `meta: ResponseCollectionMeta`
- **DealRelationResponseCollection**: `data: Array<DealEntity>`
- **DecisionEntity**: `attributes: Maybe<Decision>`, `id: Maybe<Scalars['ID']['output']>`
- **DecisionEntityResponse**: `data: Maybe<DecisionEntity>`
- **DecisionEntityResponseCollection**: `data: Array<DecisionEntity>`, `meta: ResponseCollectionMeta`
- **DecisionRelationResponseCollection**: `data: Array<DecisionEntity>`
- **DeffinitionEntity**: `attributes: Maybe<Deffinition>`, `id: Maybe<Scalars['ID']['output']>`
- **DeffinitionEntityResponse**: `data: Maybe<DeffinitionEntity>`
- **DeffinitionEntityResponseCollection**: `data: Array<DeffinitionEntity>`, `meta: ResponseCollectionMeta`
- **DeffinitionRelationResponseCollection**: `data: Array<DeffinitionEntity>`
- **FiltertagEntity**: `attributes: Maybe<Filtertag>`, `id: Maybe<Scalars['ID']['output']>`
- **FiltertagEntityResponse**: `data: Maybe<FiltertagEntity>`
- **FiltertagEntityResponseCollection**: `data: Array<FiltertagEntity>`, `meta: ResponseCollectionMeta`
- **FiltertagRelationResponseCollection**: `data: Array<FiltertagEntity>`
- **FiniapruvalEntity**: `attributes: Maybe<Finiapruval>`, `id: Maybe<Scalars['ID']['output']>`
- **FiniapruvalEntityResponse**: `data: Maybe<FiniapruvalEntity>`
- **FiniapruvalEntityResponseCollection**: `data: Array<FiniapruvalEntity>`, `meta: ResponseCollectionMeta`
- **FiniapruvalRelationResponseCollection**: `data: Array<FiniapruvalEntity>`
- **FinnishedMissionEntity**: `attributes: Maybe<FinnishedMission>`, `id: Maybe<Scalars['ID']['output']>`
- **FinnishedMissionEntityResponse**: `data: Maybe<FinnishedMissionEntity>`
- **FinnishedMissionEntityResponseCollection**: `data: Array<FinnishedMissionEntity>`, `meta: ResponseCollectionMeta`
- **FinnishedMissionRelationResponseCollection**: `data: Array<FinnishedMissionEntity>`
- **ForumEntity**: `attributes: Maybe<Forum>`, `id: Maybe<Scalars['ID']['output']>`
- **ForumEntityResponse**: `data: Maybe<ForumEntity>`
- **ForumEntityResponseCollection**: `data: Array<ForumEntity>`, `meta: ResponseCollectionMeta`
- **ForumLastSeenEntity**: `attributes: Maybe<ForumLastSeen>`, `id: Maybe<Scalars['ID']['output']>`
- **ForumLastSeenEntityResponse**: `data: Maybe<ForumLastSeenEntity>`
- **ForumLastSeenEntityResponseCollection**: `data: Array<ForumLastSeenEntity>`, `meta: ResponseCollectionMeta`
- **ForumLastSeenRelationResponseCollection**: `data: Array<ForumLastSeenEntity>`
- **ForumRelationResponseCollection**: `data: Array<ForumEntity>`
- **HaamadaEntity**: `attributes: Maybe<Haamada>`, `id: Maybe<Scalars['ID']['output']>`
- **HaamadaEntityResponse**: `data: Maybe<HaamadaEntity>`
- **HaamadaEntityResponseCollection**: `data: Array<HaamadaEntity>`, `meta: ResponseCollectionMeta`
- **HaamadaRelationResponseCollection**: `data: Array<HaamadaEntity>`
- **HaamadapruvEntity**: `attributes: Maybe<Haamadapruv>`, `id: Maybe<Scalars['ID']['output']>`
- **HaamadapruvEntityResponse**: `data: Maybe<HaamadapruvEntity>`
- **HaamadapruvEntityResponseCollection**: `data: Array<HaamadapruvEntity>`, `meta: ResponseCollectionMeta`
- **HaamadapruvRelationResponseCollection**: `data: Array<HaamadapruvEntity>`
- **HalukaEntity**: `attributes: Maybe<Haluka>`, `id: Maybe<Scalars['ID']['output']>`
- **HalukaEntityResponse**: `data: Maybe<HalukaEntity>`
- **HalukaEntityResponseCollection**: `data: Array<HalukaEntity>`, `meta: ResponseCollectionMeta`
- **HalukaRelationResponseCollection**: `data: Array<HalukaEntity>`
- **HatzaaEntity**: `attributes: Maybe<Hatzaa>`, `id: Maybe<Scalars['ID']['output']>`
- **HatzaaEntityResponse**: `data: Maybe<HatzaaEntity>`
- **HatzaaEntityResponseCollection**: `data: Array<HatzaaEntity>`, `meta: ResponseCollectionMeta`
- **HatzaaRelationResponseCollection**: `data: Array<HatzaaEntity>`
- **HazbaahEntity**: `attributes: Maybe<Hazbaah>`, `id: Maybe<Scalars['ID']['output']>`
- **HazbaahEntityResponse**: `data: Maybe<HazbaahEntity>`
- **HazbaahEntityResponseCollection**: `data: Array<HazbaahEntity>`, `meta: ResponseCollectionMeta`
- **I18NLocaleEntity**: `attributes: Maybe<I18NLocale>`, `id: Maybe<Scalars['ID']['output']>`
- **I18NLocaleEntityResponse**: `data: Maybe<I18NLocaleEntity>`
- **I18NLocaleEntityResponseCollection**: `data: Array<I18NLocaleEntity>`, `meta: ResponseCollectionMeta`
- **MaapEntity**: `attributes: Maybe<Maap>`, `id: Maybe<Scalars['ID']['output']>`
- **MaapEntityResponse**: `data: Maybe<MaapEntity>`
- **MaapEntityResponseCollection**: `data: Array<MaapEntity>`, `meta: ResponseCollectionMeta`
- **MaapRelationResponseCollection**: `data: Array<MaapEntity>`
- **MachshirEntity**: `attributes: Maybe<Machshir>`, `id: Maybe<Scalars['ID']['output']>`
- **MachshirEntityResponse**: `data: Maybe<MachshirEntity>`
- **MachshirEntityResponseCollection**: `data: Array<MachshirEntity>`, `meta: ResponseCollectionMeta`
- **MachshirRelationResponseCollection**: `data: Array<MachshirEntity>`
- **MashaabimEntity**: `attributes: Maybe<Mashaabim>`, `id: Maybe<Scalars['ID']['output']>`
- **MashaabimEntityResponse**: `data: Maybe<MashaabimEntity>`
- **MashaabimEntityResponseCollection**: `data: Array<MashaabimEntity>`, `meta: ResponseCollectionMeta`
- **MashaabimRelationResponseCollection**: `data: Array<MashaabimEntity>`
- **MashabetahalichEntity**: `attributes: Maybe<Mashabetahalich>`, `id: Maybe<Scalars['ID']['output']>`
- **MashabetahalichEntityResponse**: `data: Maybe<MashabetahalichEntity>`
- **MashabetahalichEntityResponseCollection**: `data: Array<MashabetahalichEntity>`, `meta: ResponseCollectionMeta`
- **MatanotEntity**: `attributes: Maybe<Matanot>`, `id: Maybe<Scalars['ID']['output']>`
- **MatanotEntityResponse**: `data: Maybe<MatanotEntity>`
- **MatanotEntityResponseCollection**: `data: Array<MatanotEntity>`, `meta: ResponseCollectionMeta`
- **MatanotRelationResponseCollection**: `data: Array<MatanotEntity>`
- **MatbeaEntity**: `attributes: Maybe<Matbea>`, `id: Maybe<Scalars['ID']['output']>`
- **MatbeaEntityResponse**: `data: Maybe<MatbeaEntity>`
- **MatbeaEntityResponseCollection**: `data: Array<MatbeaEntity>`, `meta: ResponseCollectionMeta`
- **MatbeaRelationResponseCollection**: `data: Array<MatbeaEntity>`
- **MesimabetahalichEntity**: `attributes: Maybe<Mesimabetahalich>`, `id: Maybe<Scalars['ID']['output']>`
- **MesimabetahalichEntityResponse**: `data: Maybe<MesimabetahalichEntity>`
- **MesimabetahalichEntityResponseCollection**: `data: Array<MesimabetahalichEntity>`, `meta: ResponseCollectionMeta`
- **MesimabetahalichRelationResponseCollection**: `data: Array<MesimabetahalichEntity>`
- **MessageEntity**: `attributes: Maybe<Message>`, `id: Maybe<Scalars['ID']['output']>`
- **MessageEntityResponse**: `data: Maybe<MessageEntity>`
- **MessageEntityResponseCollection**: `data: Array<MessageEntity>`, `meta: ResponseCollectionMeta`
- **MessageRelationResponseCollection**: `data: Array<MessageEntity>`
- **MissionEntity**: `attributes: Maybe<Mission>`, `id: Maybe<Scalars['ID']['output']>`
- **MissionEntityResponse**: `data: Maybe<MissionEntity>`
- **MissionEntityResponseCollection**: `data: Array<MissionEntity>`, `meta: ResponseCollectionMeta`
- **MissionRelationResponseCollection**: `data: Array<MissionEntity>`
- **ModeEntity**: `attributes: Maybe<Mode>`, `id: Maybe<Scalars['ID']['output']>`
- **ModeEntityResponse**: `data: Maybe<ModeEntity>`
- **ModeEntityResponseCollection**: `data: Array<ModeEntity>`, `meta: ResponseCollectionMeta`
- **ModeRelationResponseCollection**: `data: Array<ModeEntity>`
- **MonterEntity**: `attributes: Maybe<Monter>`, `id: Maybe<Scalars['ID']['output']>`
- **MonterEntityResponse**: `data: Maybe<MonterEntity>`
- **MonterEntityResponseCollection**: `data: Array<MonterEntity>`, `meta: ResponseCollectionMeta`
- **MonterRelationResponseCollection**: `data: Array<MonterEntity>`
- **NegoEntity**: `attributes: Maybe<Nego>`, `id: Maybe<Scalars['ID']['output']>`
- **NegoEntityResponse**: `data: Maybe<NegoEntity>`
- **NegoEntityResponseCollection**: `data: Array<NegoEntity>`, `meta: ResponseCollectionMeta`
- **NegoMashEntity**: `attributes: Maybe<NegoMash>`, `id: Maybe<Scalars['ID']['output']>`
- **NegoMashEntityResponse**: `data: Maybe<NegoMashEntity>`
- **NegoMashEntityResponseCollection**: `data: Array<NegoMashEntity>`, `meta: ResponseCollectionMeta`
- **NegoMashRelationResponseCollection**: `data: Array<NegoMashEntity>`
- **NegoRelationResponseCollection**: `data: Array<NegoEntity>`
- **NegopendmissionEntity**: `attributes: Maybe<Negopendmission>`, `id: Maybe<Scalars['ID']['output']>`
- **NegopendmissionEntityResponse**: `data: Maybe<NegopendmissionEntity>`
- **NegopendmissionEntityResponseCollection**: `data: Array<NegopendmissionEntity>`, `meta: ResponseCollectionMeta`
- **NegopendmissionRelationResponseCollection**: `data: Array<NegopendmissionEntity>`
- **NegotiationEntity**: `attributes: Maybe<Negotiation>`, `id: Maybe<Scalars['ID']['output']>`
- **NegotiationEntityResponse**: `data: Maybe<NegotiationEntity>`
- **NegotiationEntityResponseCollection**: `data: Array<NegotiationEntity>`, `meta: ResponseCollectionMeta`
- **NegotiationRelationResponseCollection**: `data: Array<NegotiationEntity>`
- **OpenMashaabimEntity**: `attributes: Maybe<OpenMashaabim>`, `id: Maybe<Scalars['ID']['output']>`
- **OpenMashaabimEntityResponse**: `data: Maybe<OpenMashaabimEntity>`
- **OpenMashaabimEntityResponseCollection**: `data: Array<OpenMashaabimEntity>`, `meta: ResponseCollectionMeta`
- **OpenMashaabimRelationResponseCollection**: `data: Array<OpenMashaabimEntity>`
- **OpenMissionEntity**: `attributes: Maybe<OpenMission>`, `id: Maybe<Scalars['ID']['output']>`
- **OpenMissionEntityResponse**: `data: Maybe<OpenMissionEntity>`
- **OpenMissionEntityResponseCollection**: `data: Array<OpenMissionEntity>`, `meta: ResponseCollectionMeta`
- **OpenMissionRelationResponseCollection**: `data: Array<OpenMissionEntity>`
- **PartofEntity**: `attributes: Maybe<Partof>`, `id: Maybe<Scalars['ID']['output']>`
- **PartofEntityResponse**: `data: Maybe<PartofEntity>`
- **PartofEntityResponseCollection**: `data: Array<PartofEntity>`, `meta: ResponseCollectionMeta`
- **PartofRelationResponseCollection**: `data: Array<PartofEntity>`
- **PendmEntity**: `attributes: Maybe<Pendm>`, `id: Maybe<Scalars['ID']['output']>`
- **PendmEntityResponse**: `data: Maybe<PendmEntity>`
- **PendmEntityResponseCollection**: `data: Array<PendmEntity>`, `meta: ResponseCollectionMeta`
- **PendmRelationResponseCollection**: `data: Array<PendmEntity>`
- **PgishaEntity**: `attributes: Maybe<Pgisha>`, `id: Maybe<Scalars['ID']['output']>`
- **PgishaEntityResponse**: `data: Maybe<PgishaEntity>`
- **PgishaEntityResponseCollection**: `data: Array<PgishaEntity>`, `meta: ResponseCollectionMeta`
- **PgishaRelationResponseCollection**: `data: Array<PgishaEntity>`
- **PgishauserEntity**: `attributes: Maybe<Pgishauser>`, `id: Maybe<Scalars['ID']['output']>`
- **PgishauserEntityResponse**: `data: Maybe<PgishauserEntity>`
- **PgishauserEntityResponseCollection**: `data: Array<PgishauserEntity>`, `meta: ResponseCollectionMeta`
- **PgishauserRelationResponseCollection**: `data: Array<PgishauserEntity>`
- **PgishauserpendEntity**: `attributes: Maybe<Pgishauserpend>`, `id: Maybe<Scalars['ID']['output']>`
- **PgishauserpendEntityResponse**: `data: Maybe<PgishauserpendEntity>`
- **PgishauserpendEntityResponseCollection**: `data: Array<PgishauserpendEntity>`, `meta: ResponseCollectionMeta`
- **PgishauserpendRelationResponseCollection**: `data: Array<PgishauserpendEntity>`
- **PmashEntity**: `attributes: Maybe<Pmash>`, `id: Maybe<Scalars['ID']['output']>`
- **PmashEntityResponse**: `data: Maybe<PmashEntity>`
- **PmashEntityResponseCollection**: `data: Array<PmashEntity>`, `meta: ResponseCollectionMeta`
- **PmashRelationResponseCollection**: `data: Array<PmashEntity>`
- **PositionEntity**: `attributes: Maybe<Position>`, `id: Maybe<Scalars['ID']['output']>`
- **PositionEntityResponse**: `data: Maybe<PositionEntity>`
- **PositionEntityResponseCollection**: `data: Array<PositionEntity>`, `meta: ResponseCollectionMeta`
- **PositionRelationResponseCollection**: `data: Array<PositionEntity>`
- **ProjectEntity**: `attributes: Maybe<Project>`, `id: Maybe<Scalars['ID']['output']>`
- **ProjectEntityResponse**: `data: Maybe<ProjectEntity>`
- **ProjectEntityResponseCollection**: `data: Array<ProjectEntity>`, `meta: ResponseCollectionMeta`
- **ProjectRelationResponseCollection**: `data: Array<ProjectEntity>`
- **RatsonEntity**: `attributes: Maybe<Ratson>`, `id: Maybe<Scalars['ID']['output']>`
- **RatsonEntityResponse**: `data: Maybe<RatsonEntity>`
- **RatsonEntityResponseCollection**: `data: Array<RatsonEntity>`, `meta: ResponseCollectionMeta`
- **RatsonRelationResponseCollection**: `data: Array<RatsonEntity>`
- **RichtextEntity**: `attributes: Maybe<Richtext>`, `id: Maybe<Scalars['ID']['output']>`
- **RichtextEntityResponse**: `data: Maybe<RichtextEntity>`
- **RichtextEntityResponseCollection**: `data: Array<RichtextEntity>`, `meta: ResponseCollectionMeta`
- **RichtextRelationResponseCollection**: `data: Array<RichtextEntity>`
- **RikmashEntity**: `attributes: Maybe<Rikmash>`, `id: Maybe<Scalars['ID']['output']>`
- **RikmashEntityResponse**: `data: Maybe<RikmashEntity>`
- **RikmashEntityResponseCollection**: `data: Array<RikmashEntity>`, `meta: ResponseCollectionMeta`
- **RikmashRelationResponseCollection**: `data: Array<RikmashEntity>`
- **SaleEntity**: `attributes: Maybe<Sale>`, `id: Maybe<Scalars['ID']['output']>`
- **SaleEntityResponse**: `data: Maybe<SaleEntity>`
- **SaleEntityResponseCollection**: `data: Array<SaleEntity>`, `meta: ResponseCollectionMeta`
- **SaleRelationResponseCollection**: `data: Array<SaleEntity>`
- **SeederEntity**: `attributes: Maybe<Seeder>`, `id: Maybe<Scalars['ID']['output']>`
- **SeederEntityResponse**: `data: Maybe<SeederEntity>`
- **SeederEntityResponseCollection**: `data: Array<SeederEntity>`, `meta: ResponseCollectionMeta`
- **SeederRelationResponseCollection**: `data: Array<SeederEntity>`
- **SheirutEntity**: `attributes: Maybe<Sheirut>`, `id: Maybe<Scalars['ID']['output']>`
- **SheirutEntityResponse**: `data: Maybe<SheirutEntity>`
- **SheirutEntityResponseCollection**: `data: Array<SheirutEntity>`, `meta: ResponseCollectionMeta`
- **SheirutRelationResponseCollection**: `data: Array<SheirutEntity>`
- **SheirutnegoEntity**: `attributes: Maybe<Sheirutnego>`, `id: Maybe<Scalars['ID']['output']>`
- **SheirutnegoEntityResponse**: `data: Maybe<SheirutnegoEntity>`
- **SheirutnegoEntityResponseCollection**: `data: Array<SheirutnegoEntity>`, `meta: ResponseCollectionMeta`
- **SheirutnegoRelationResponseCollection**: `data: Array<SheirutnegoEntity>`
- **SheirutpendEntity**: `attributes: Maybe<Sheirutpend>`, `id: Maybe<Scalars['ID']['output']>`
- **SheirutpendEntityResponse**: `data: Maybe<SheirutpendEntity>`
- **SheirutpendEntityResponseCollection**: `data: Array<SheirutpendEntity>`, `meta: ResponseCollectionMeta`
- **SheirutpendRelationResponseCollection**: `data: Array<SheirutpendEntity>`
- **SidurEntity**: `attributes: Maybe<Sidur>`, `id: Maybe<Scalars['ID']['output']>`
- **SidurEntityResponse**: `data: Maybe<SidurEntity>`
- **SidurEntityResponseCollection**: `data: Array<SidurEntity>`, `meta: ResponseCollectionMeta`
- **SkillEntity**: `attributes: Maybe<Skill>`, `id: Maybe<Scalars['ID']['output']>`
- **SkillEntityResponse**: `data: Maybe<SkillEntity>`
- **SkillEntityResponseCollection**: `data: Array<SkillEntity>`, `meta: ResponseCollectionMeta`
- **SkillRelationResponseCollection**: `data: Array<SkillEntity>`
- **SolutionEntity**: `attributes: Maybe<Solution>`, `id: Maybe<Scalars['ID']['output']>`
- **SolutionEntityResponse**: `data: Maybe<SolutionEntity>`
- **SolutionEntityResponseCollection**: `data: Array<SolutionEntity>`, `meta: ResponseCollectionMeta`
- **SolutionRelationResponseCollection**: `data: Array<SolutionEntity>`
- **SpEntity**: `attributes: Maybe<Sp>`, `id: Maybe<Scalars['ID']['output']>`
- **SpEntityResponse**: `data: Maybe<SpEntity>`
- **SpEntityResponseCollection**: `data: Array<SpEntity>`, `meta: ResponseCollectionMeta`
- **SpRelationResponseCollection**: `data: Array<SpEntity>`
- **TafkidimEntity**: `attributes: Maybe<Tafkidim>`, `id: Maybe<Scalars['ID']['output']>`
- **TafkidimEntityResponse**: `data: Maybe<TafkidimEntity>`
- **TafkidimEntityResponseCollection**: `data: Array<TafkidimEntity>`, `meta: ResponseCollectionMeta`
- **TafkidimRelationResponseCollection**: `data: Array<TafkidimEntity>`
- **TikunolamEntity**: `attributes: Maybe<Tikunolam>`, `id: Maybe<Scalars['ID']['output']>`
- **TikunolamEntityResponse**: `data: Maybe<TikunolamEntity>`
- **TikunolamEntityResponseCollection**: `data: Array<TikunolamEntity>`, `meta: ResponseCollectionMeta`
- **TikunolamRelationResponseCollection**: `data: Array<TikunolamEntity>`
- **TimegramaEntity**: `attributes: Maybe<Timegrama>`, `id: Maybe<Scalars['ID']['output']>`
- **TimegramaEntityResponse**: `data: Maybe<TimegramaEntity>`
- **TimegramaEntityResponseCollection**: `data: Array<TimegramaEntity>`, `meta: ResponseCollectionMeta`
- **TimegramaRelationResponseCollection**: `data: Array<TimegramaEntity>`
- **TimerEntity**: `attributes: Maybe<Timer>`, `id: Maybe<Scalars['ID']['output']>`
- **TimerEntityResponse**: `data: Maybe<TimerEntity>`
- **TimerEntityResponseCollection**: `data: Array<TimerEntity>`, `meta: ResponseCollectionMeta`
- **TimerRelationResponseCollection**: `data: Array<TimerEntity>`
- **TosplitEntity**: `attributes: Maybe<Tosplit>`, `id: Maybe<Scalars['ID']['output']>`
- **TosplitEntityResponse**: `data: Maybe<TosplitEntity>`
- **TosplitEntityResponseCollection**: `data: Array<TosplitEntity>`, `meta: ResponseCollectionMeta`
- **TosplitRelationResponseCollection**: `data: Array<TosplitEntity>`
- **TranslateEntity**: `attributes: Maybe<Translate>`, `id: Maybe<Scalars['ID']['output']>`
- **TranslateEntityResponse**: `data: Maybe<TranslateEntity>`
- **TranslateEntityResponseCollection**: `data: Array<TranslateEntity>`, `meta: ResponseCollectionMeta`
- **UploadFileEntity**: `attributes: Maybe<UploadFile>`, `id: Maybe<Scalars['ID']['output']>`
- **UploadFileEntityResponse**: `data: Maybe<UploadFileEntity>`
- **UploadFileEntityResponseCollection**: `data: Array<UploadFileEntity>`, `meta: ResponseCollectionMeta`
- **UploadFileRelationResponseCollection**: `data: Array<UploadFileEntity>`
- **UploadFolderEntity**: `attributes: Maybe<UploadFolder>`, `id: Maybe<Scalars['ID']['output']>`
- **UploadFolderEntityResponse**: `data: Maybe<UploadFolderEntity>`
- **UploadFolderEntityResponseCollection**: `data: Array<UploadFolderEntity>`, `meta: ResponseCollectionMeta`
- **UploadFolderRelationResponseCollection**: `data: Array<UploadFolderEntity>`
- **UsersPermissionsPermissionEntity**: `attributes: Maybe<UsersPermissionsPermission>`, `id: Maybe<Scalars['ID']['output']>`
- **UsersPermissionsPermissionRelationResponseCollection**: `data: Array<UsersPermissionsPermissionEntity>`
- **UsersPermissionsRoleEntity**: `attributes: Maybe<UsersPermissionsRole>`, `id: Maybe<Scalars['ID']['output']>`
- **UsersPermissionsRoleEntityResponse**: `data: Maybe<UsersPermissionsRoleEntity>`
- **UsersPermissionsRoleEntityResponseCollection**: `data: Array<UsersPermissionsRoleEntity>`, `meta: ResponseCollectionMeta`
- **UsersPermissionsUserEntity**: `attributes: Maybe<UsersPermissionsUser>`, `id: Maybe<Scalars['ID']['output']>`
- **UsersPermissionsUserEntityResponse**: `data: Maybe<UsersPermissionsUserEntity>`
- **UsersPermissionsUserEntityResponseCollection**: `data: Array<UsersPermissionsUserEntity>`, `meta: ResponseCollectionMeta`
- **UsersPermissionsUserRelationResponseCollection**: `data: Array<UsersPermissionsUserEntity>`
- **VallueEntity**: `attributes: Maybe<Vallue>`, `id: Maybe<Scalars['ID']['output']>`
- **VallueEntityResponse**: `data: Maybe<VallueEntity>`
- **VallueEntityResponseCollection**: `data: Array<VallueEntity>`, `meta: ResponseCollectionMeta`
- **VallueRelationResponseCollection**: `data: Array<VallueEntity>`
- **VoteEntity**: `attributes: Maybe<Vote>`, `id: Maybe<Scalars['ID']['output']>`
- **VoteEntityResponse**: `data: Maybe<VoteEntity>`
- **VoteEntityResponseCollection**: `data: Array<VoteEntity>`, `meta: ResponseCollectionMeta`
- **VoteRelationResponseCollection**: `data: Array<VoteEntity>`
- **WantEntity**: `attributes: Maybe<Want>`, `id: Maybe<Scalars['ID']['output']>`
- **WantEntityResponse**: `data: Maybe<WantEntity>`
- **WantEntityResponseCollection**: `data: Array<WantEntity>`, `meta: ResponseCollectionMeta`
- **WantRelationResponseCollection**: `data: Array<WantEntity>`
- **WelcomTopEntity**: `attributes: Maybe<WelcomTop>`, `id: Maybe<Scalars['ID']['output']>`
- **WelcomTopEntityResponse**: `data: Maybe<WelcomTopEntity>`
- **WelcomTopEntityResponseCollection**: `data: Array<WelcomTopEntity>`, `meta: ResponseCollectionMeta`
- **WelcomTopRelationResponseCollection**: `data: Array<WelcomTopEntity>`
- **WhatandwhyEntity**: `attributes: Maybe<Whatandwhy>`, `id: Maybe<Scalars['ID']['output']>`
- **WhatandwhyEntityResponse**: `data: Maybe<WhatandwhyEntity>`
- **WhatandwhyRelationResponseCollection**: `data: Array<WhatandwhyEntity>`
- **WorkWayEntity**: `attributes: Maybe<WorkWay>`, `id: Maybe<Scalars['ID']['output']>`
- **WorkWayEntityResponse**: `data: Maybe<WorkWayEntity>`
- **WorkWayEntityResponseCollection**: `data: Array<WorkWayEntity>`, `meta: ResponseCollectionMeta`
- **WorkWayRelationResponseCollection**: `data: Array<WorkWayEntity>`
- **YatEntity**: `attributes: Maybe<Yat>`, `id: Maybe<Scalars['ID']['output']>`
- **YatEntityResponse**: `data: Maybe<YatEntity>`
- **YatEntityResponseCollection**: `data: Array<YatEntity>`, `meta: ResponseCollectionMeta`
- **ZoharEntity**: `attributes: Maybe<Zohar>`, `id: Maybe<Scalars['ID']['output']>`
- **ZoharEntityResponse**: `data: Maybe<ZoharEntity>`
- **ZoharEntityResponseCollection**: `data: Array<ZoharEntity>`, `meta: ResponseCollectionMeta`
- **ZoharRelationResponseCollection**: `data: Array<ZoharEntity>`
</details>

---

## 🔢 Enum Types (20)

<details>
<summary>Click to expand all 20 enum types</summary>

- **Enum_Act_Hashivut**: 
- **Enum_Componentdesisionnegom_Kindof**: 
- **Enum_Componentnewnegom_Kindof**: 
- **Enum_Contentreleasesreleaseaction_Type**: 
- **Enum_Decision_Kind**: 
- **Enum_Forum_Spec**: 
- **Enum_Mashaabim_Kindof**: 
- **Enum_Matanot_Kindof**: 
- **Enum_Negomash_Kindof**: 
- **Enum_Negotiation_Status**: 
- **Enum_Nego_Kindof**: 
- **Enum_Openmashaabim_Kindof**: 
- **Enum_Pmash_Kindof**: 
- **Enum_Project_Restime**: 
- **Enum_Project_Timetop**: 
- **Enum_Rikmash_Kindof**: 
- **Enum_Sp_Kindof**: 
- **Enum_Userspermissionsuser_Frd**: 
- **Enum_Userspermissionsuser_Lang**: 
- **PublicationState**: 
</details>

---

## 🛠️ Utility Types (1)

- **Scalars**: `ID: { input: string; output: string; }`, `String: { input: string; output: string; }`, `Boolean: { input: boolean; output: boolean; }`, `Int: { input: number; output: number; }`, `Float: { input: number; output: number; }`, `Date: { input: any; output: any; }`, `DateTime: { input: any; output: any; }`, `I18NLocaleCode: { input: any; output: any; }`, `JSON: { input: any; output: any; }`, `Long: { input: any; output: any; }`, `Upload: { input: any; output: any; }`

---

## File Structure

```
src/
├── generated/
│   ├── graphql.ts              # Auto-generated types (codegen) - 13676 lines
│   ├── index.ts                # Re-export hub
│   └── STRAPI_SCHEMA_REFERENCE.md  # This file (AI agent reference)
├── lib/
│   ├── generated/
│   │   ├── contentTypes.d.ts   # Strapi content type definitions (server-side)
│   │   └── components.d.ts     # Strapi component definitions (server-side)
│   └── types/
│       ├── strapiTypes.ts      # Helper types (StrapiEntity, StrapiCollection, etc.)
│       ├── queryTypes.ts       # Pre-defined query response types
│       ├── validation.ts       # Yup runtime validation schemas
│       ├── chat.ts             # Chat-specific types
│       └── README.md           # Usage documentation
```
