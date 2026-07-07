# Strapi GraphQL Schema Reference
> Auto-generated from `src/generated/graphql.ts`
> Last updated: 2026-07-07
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

## 🏗️ Content Type Entities (115)

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
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
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

### ApiKey
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `key_hash` | `Maybe<Scalars['String']['output']>` |
| `key_prefix` | `Maybe<Scalars['String']['output']>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Argument
| Field | Type |
|-------|------|
| `arguments` | `Maybe<ArgumentRelationResponseCollection>` |
| `authorEmail` | `Maybe<Scalars['String']['output']>` |
| `authorExternalId` | `Maybe<Scalars['String']['output']>` |
| `authorName` | `Maybe<Scalars['String']['output']>` |
| `authorType` | `Maybe<Enum_Argument_Authortype>` |
| `body` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `negotiation` | `Maybe<NegotiationEntityResponse>` |
| `parent` | `Maybe<ArgumentEntityResponse>` |
| `position` | `Maybe<PositionEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `stance` | `Maybe<Enum_Argument_Stance>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `voters` | `Maybe<Scalars['JSON']['output']>` |
| `votes` | `Maybe<Scalars['Int']['output']>` |

### Ask
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `chat` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
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
| `forum` | `Maybe<ForumEntityResponse>` |
| `isSelfProposal` | `Maybe<Scalars['Boolean']['output']>` |
| `nego_mashes` | `Maybe<NegoMashRelationResponseCollection>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `pendingMainVote` | `Maybe<Scalars['Boolean']['output']>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
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
| `forum` | `Maybe<ForumEntityResponse>` |
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
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
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

### Clause
| Field | Type |
|-------|------|
| `authorExternalId` | `Maybe<Scalars['String']['output']>` |
| `authorType` | `Maybe<Enum_Clause_Authortype>` |
| `body` | `Maybe<Scalars['String']['output']>` |
| `confirmedByAuthor` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `issue` | `Maybe<IssueEntityResponse>` |
| `negotiation` | `Maybe<NegotiationEntityResponse>` |
| `origin` | `Maybe<Enum_Clause_Origin>` |
| `position` | `Maybe<PositionEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `stanceValue` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### ConsentEvent
| Field | Type |
|-------|------|
| `action` | `Scalars['String']['output']` |
| `actor` | `Scalars['String']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `eventId` | `Scalars['String']['output']` |
| `payload` | `Scalars['JSON']['output']` |
| `stateRoot` | `Maybe<Scalars['String']['output']>` |
| `subjectId` | `Maybe<Scalars['String']['output']>` |
| `subjectType` | `Maybe<Scalars['String']['output']>` |
| `ts` | `Maybe<Scalars['Long']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

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
| `negotiations` | `Maybe<NegotiationRelationResponseCollection>` |
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
| `discord` | `Maybe<Scalars['String']['output']>` |
| `drive` | `Maybe<Scalars['String']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `github` | `Maybe<Scalars['String']['output']>` |
| `kind` | `Maybe<Enum_Decision_Kind>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `moreHours` | `Maybe<MesimabetahalichEntityResponse>` |
| `negodes` | `Maybe<Array<Maybe<ComponentProjectsNegodes>>>` |
| `negom` | `Maybe<Array<Maybe<ComponentProjectsNegom>>>` |
| `negos` | `Maybe<NegoRelationResponseCollection>` |
| `newFlink` | `Maybe<Scalars['String']['output']>` |
| `newHours` | `Maybe<Scalars['Int']['output']>` |
| `newWlink` | `Maybe<Scalars['String']['output']>` |
| `newname` | `Maybe<Scalars['String']['output']>` |
| `newpic` | `Maybe<UploadFileEntityResponse>` |
| `newprides` | `Maybe<Scalars['String']['output']>` |
| `newpubdes` | `Maybe<Scalars['String']['output']>` |
| `projects` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `sale` | `Maybe<SaleEntityResponse>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `timtoM` | `Maybe<Scalars['String']['output']>` |
| `twitter` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `valluesadd` | `Maybe<VallueRelationResponseCollection>` |
| `valluesles` | `Maybe<VallueRelationResponseCollection>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `whatsapp` | `Maybe<Scalars['String']['output']>` |

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
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |

### Finiapruval
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnished_mission` | `Maybe<FinnishedMissionEntityResponse>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `isTimerSave` | `Maybe<Scalars['Boolean']['output']>` |
| `iskvua` | `Maybe<Scalars['Boolean']['output']>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `missname` | `Maybe<Scalars['String']['output']>` |
| `month` | `Maybe<Scalars['Date']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `timer` | `Maybe<TimerEntityResponse>` |
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
| `isNotFinished` | `Maybe<Scalars['Boolean']['output']>` |
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
| `askm` | `Maybe<AskmEntityResponse>` |
| `asks` | `Maybe<AskRelationResponseCollection>` |
| `askwant` | `Maybe<AskwantEntityResponse>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `decisions` | `Maybe<DecisionRelationResponseCollection>` |
| `done` | `Scalars['Boolean']['output']` |
| `finiapruvals` | `Maybe<FiniapruvalRelationResponseCollection>` |
| `forum_last_seens` | `Maybe<ForumLastSeenRelationResponseCollection>` |
| `haluka` | `Maybe<HalukaEntityResponse>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `matanotpend` | `Maybe<MatanotpendEntityResponse>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `messages` | `Maybe<MessageRelationResponseCollection>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `pgisha` | `Maybe<PgishaEntityResponse>` |
| `pmashes` | `Maybe<PmashRelationResponseCollection>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratson_proposal` | `Maybe<RatsonProposalEntityResponse>` |
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
| `adjustDirection` | `Maybe<Enum_Haluka_Adjustdirection>` |
| `adjustReason` | `Maybe<Scalars['String']['output']>` |
| `amount` | `Maybe<Scalars['Float']['output']>` |
| `autoApproved` | `Maybe<Scalars['Boolean']['output']>` |
| `chatre` | `Maybe<Array<Maybe<ComponentProjectsChatre>>>` |
| `confirmed` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `isSiteShare` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<HalukaRelationResponseCollection>` |
| `matbea` | `Maybe<MatbeaEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `proposedAmount` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson_share` | `Maybe<RatsonShareEntityResponse>` |
| `recive_project` | `Maybe<ProjectEntityResponse>` |
| `senderconf` | `Maybe<Scalars['Boolean']['output']>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `site_share_contribution` | `Maybe<SiteShareContributionEntityResponse>` |
| `source_tosplit` | `Maybe<TosplitEntityResponse>` |
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

### Issue
| Field | Type |
|-------|------|
| `clauses` | `Maybe<ClauseRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `negotiation` | `Maybe<NegotiationEntityResponse>` |
| `order` | `Maybe<Scalars['Int']['output']>` |
| `origin` | `Maybe<Enum_Issue_Origin>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `title` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Maagad
| Field | Type |
|-------|------|
| `canonical_desc` | `Maybe<Scalars['String']['output']>` |
| `categories` | `Maybe<CategoryRelationResponseCollection>` |
| `chat_forum` | `Maybe<ForumEntityResponse>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `frequency` | `Maybe<Scalars['String']['output']>` |
| `lat` | `Maybe<Scalars['Float']['output']>` |
| `lng` | `Maybe<Scalars['Float']['output']>` |
| `members` | `Maybe<MaagadMemberRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `offers` | `Maybe<MaagadOfferRelationResponseCollection>` |
| `origin` | `Maybe<Enum_Maagad_Origin>` |
| `pinecone_id` | `Maybe<Scalars['String']['output']>` |
| `process` | `Maybe<PartofEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `radius` | `Maybe<Scalars['Long']['output']>` |
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
| `scope` | `Maybe<Enum_Maagad_Scope>` |
| `status_maagad` | `Maybe<Enum_Maagad_Status_Maagad>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `vallues` | `Maybe<VallueRelationResponseCollection>` |
| `viability_hint` | `Maybe<Scalars['Int']['output']>` |

### MaagadMember
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `joinedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `leftAt` | `Maybe<Scalars['DateTime']['output']>` |
| `maagad` | `Maybe<MaagadEntityResponse>` |
| `options` | `Maybe<Scalars['JSON']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `signedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `signed_offer` | `Maybe<MaagadOfferEntityResponse>` |
| `status_member` | `Maybe<Enum_Maagadmember_Status_Member>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `visibility` | `Maybe<Enum_Maagadmember_Visibility>` |

### MaagadOffer
| Field | Type |
|-------|------|
| `cancellation_terms` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `currency` | `Maybe<MatbeaEntityResponse>` |
| `cycle_terms` | `Maybe<Scalars['JSON']['output']>` |
| `description` | `Maybe<Scalars['String']['output']>` |
| `maagad` | `Maybe<MaagadEntityResponse>` |
| `max_participants` | `Maybe<Scalars['Int']['output']>` |
| `min_participants` | `Maybe<Scalars['Int']['output']>` |
| `options` | `Maybe<Scalars['JSON']['output']>` |
| `price_tiers` | `Maybe<Scalars['JSON']['output']>` |
| `proposer_project` | `Maybe<ProjectEntityResponse>` |
| `proposer_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `recurrence` | `Maybe<Enum_Maagadoffer_Recurrence>` |
| `sign_deadline` | `Maybe<Scalars['DateTime']['output']>` |
| `signed_count` | `Maybe<Scalars['Int']['output']>` |
| `signed_members` | `Maybe<MaagadMemberRelationResponseCollection>` |
| `status_offer` | `Maybe<Enum_Maagadoffer_Status_Offer>` |
| `title` | `Maybe<Scalars['String']['output']>` |
| `unit_price` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Maap
| Field | Type |
|-------|------|
| `archived` | `Scalars['Boolean']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `cycleEnd` | `Maybe<Scalars['DateTime']['output']>` |
| `cycleIndex` | `Maybe<Scalars['Int']['output']>` |
| `cycleStart` | `Maybe<Scalars['DateTime']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `isAcceptanceMaap` | `Maybe<Scalars['Boolean']['output']>` |
| `isSelfProposal` | `Maybe<Scalars['Boolean']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MaapRelationResponseCollection>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `negos` | `Maybe<NegoRelationResponseCollection>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quantityDelivered` | `Maybe<Scalars['Float']['output']>` |
| `rikmash` | `Maybe<RikmashEntityResponse>` |
| `sheirut_fulfillments` | `Maybe<SheirutFulfillmentRelationResponseCollection>` |
| `sp` | `Maybe<SpEntityResponse>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `unit` | `Maybe<Enum_Maap_Unit>` |
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
| `mashabetahaliches` | `Maybe<MashabetahalichRelationResponseCollection>` |
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
| `allowOverdelivery` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `currency` | `Maybe<MatbeaEntityResponse>` |
| `cycleSize` | `Maybe<Scalars['Int']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `end` | `Maybe<Scalars['DateTime']['output']>` |
| `finnished` | `Maybe<Scalars['Boolean']['output']>` |
| `forappruval` | `Maybe<Scalars['Boolean']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `hoursassigned` | `Maybe<Scalars['Float']['output']>` |
| `howmanyhoursalready` | `Maybe<Scalars['Float']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Mashabetahalich_Kindof>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `matanot_recipe_resources` | `Maybe<MatanotRecipeResourceRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `pricePerUnit` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quantityAssigned` | `Maybe<Scalars['Float']['output']>` |
| `quantityDelivered` | `Maybe<Scalars['Float']['output']>` |
| `recurring` | `Maybe<Scalars['Boolean']['output']>` |
| `reservedQuantity` | `Maybe<Scalars['Float']['output']>` |
| `rikmash` | `Maybe<RikmashEntityResponse>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `status_mashab` | `Maybe<Enum_Mashabetahalich_Status_Mashab>` |
| `summarizeOnClose` | `Maybe<Scalars['Boolean']['output']>` |
| `timers` | `Maybe<TimerRelationResponseCollection>` |
| `unit` | `Maybe<Enum_Mashabetahalich_Unit>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Matanot
| Field | Type |
|-------|------|
| `appruved` | `Maybe<Scalars['Boolean']['output']>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `bakashas` | `Maybe<BakashaRelationResponseCollection>` |
| `categories` | `Maybe<CategoryRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `currency` | `Maybe<MatbeaEntityResponse>` |
| `decision` | `Maybe<DecisionEntityResponse>` |
| `desc` | `Maybe<Scalars['JSON']['output']>` |
| `estimatedPrice` | `Maybe<Scalars['Float']['output']>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `fixPrice` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Matanot_Kindof>` |
| `lat` | `Maybe<Scalars['Float']['output']>` |
| `lng` | `Maybe<Scalars['Float']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MatanotRelationResponseCollection>` |
| `location` | `Maybe<ComponentNewLocation>` |
| `marginPct` | `Maybe<Scalars['Float']['output']>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `matanot_recipe_missions` | `Maybe<MatanotRecipeMissionRelationResponseCollection>` |
| `matanot_recipe_resources` | `Maybe<MatanotRecipeResourceRelationResponseCollection>` |
| `matanotpend` | `Maybe<MatanotpendEntityResponse>` |
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
| `pricingMode` | `Maybe<Enum_Matanot_Pricingmode>` |
| `process` | `Maybe<PartofEntityResponse>` |
| `projectcreates` | `Maybe<ProjectRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `radius` | `Maybe<Scalars['Long']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratson_proposals` | `Maybe<RatsonProposalRelationResponseCollection>` |
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
| `sale` | `Maybe<SaleRelationResponseCollection>` |
| `sales` | `Maybe<Scalars['Float']['output']>` |
| `sheirut_fulfillments` | `Maybe<SheirutFulfillmentRelationResponseCollection>` |
| `sheirutpends` | `Maybe<SheirutpendRelationResponseCollection>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `source_proposals` | `Maybe<RatsonRelationResponseCollection>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `status_of_voting` | `Maybe<Enum_Matanot_Status_Of_Voting>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### MatanotRecipeMission
| Field | Type |
|-------|------|
| `assignedMember` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `hoursPerUnit` | `Maybe<Scalars['Float']['output']>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |
| `mode` | `Maybe<Enum_Matanotrecipemission_Mode>` |
| `nego` | `Maybe<NegoEntityResponse>` |
| `notes` | `Maybe<Scalars['String']['output']>` |
| `partof` | `Maybe<PartofEntityResponse>` |
| `pendm` | `Maybe<PendmEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratePerHour` | `Maybe<Scalars['Float']['output']>` |
| `unitsPerProduct` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### MatanotRecipeResource
| Field | Type |
|-------|------|
| `assignedMember` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `kindOf` | `Maybe<Enum_Matanotreciperesource_Kindof>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `mode` | `Maybe<Enum_Matanotreciperesource_Mode>` |
| `nego` | `Maybe<NegoEntityResponse>` |
| `notes` | `Maybe<Scalars['String']['output']>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `pricePerUnit` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quantityPerUnit` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Matanotpend
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `negos` | `Maybe<NegoRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `resolvedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `status_pend` | `Maybe<Enum_Matanotpend_Status_Pend>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |

### Matbea
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `halukas` | `Maybe<HalukaRelationResponseCollection>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<MatbeaRelationResponseCollection>` |
| `mashabetahaliches` | `Maybe<MashabetahalichRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson_proposals` | `Maybe<RatsonProposalRelationResponseCollection>` |
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
| `matanot_recipe_missions` | `Maybe<MatanotRecipeMissionRelationResponseCollection>` |
| `mission` | `Maybe<MissionEntityResponse>` |
| `monter` | `Maybe<Array<Maybe<ComponentNewMonter>>>` |
| `monters` | `Maybe<MonterRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `privatlinks` | `Maybe<Scalars['String']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publicklinks` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `seeders` | `Maybe<SeederRelationResponseCollection>` |
| `sheirut_fulfillments` | `Maybe<SheirutFulfillmentRelationResponseCollection>` |
| `start` | `Maybe<Scalars['DateTime']['output']>` |
| `status` | `Maybe<Scalars['Int']['output']>` |
| `stname` | `Scalars['String']['output']` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `timegramas` | `Maybe<TimegramaRelationResponseCollection>` |
| `timer` | `Maybe<Scalars['Float']['output']>` |
| `timers` | `Maybe<TimerRelationResponseCollection>` |
| `totalHoursSaved` | `Maybe<Scalars['Float']['output']>` |
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
| `embedding_id` | `Maybe<Scalars['String']['output']>` |
| `finnished_missions` | `Maybe<FinnishedMissionRelationResponseCollection>` |
| `kindOf` | `Maybe<Enum_Mission_Kindof>` |
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
| `synonyms` | `Maybe<Scalars['JSON']['output']>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `usage_count` | `Maybe<Scalars['Int']['output']>` |
| `users_can_do` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
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
| `createApiKey` | `Maybe<ApiKeyEntityResponse>` |
| `createArgument` | `Maybe<ArgumentEntityResponse>` |
| `createAsk` | `Maybe<AskEntityResponse>` |
| `createAskm` | `Maybe<AskmEntityResponse>` |
| `createAskwant` | `Maybe<AskwantEntityResponse>` |
| `createBakasha` | `Maybe<BakashaEntityResponse>` |
| `createCategory` | `Maybe<CategoryEntityResponse>` |
| `createCategoryLocalization` | `Maybe<CategoryEntityResponse>` |
| `createChezin` | `Maybe<ChezinEntityResponse>` |
| `createChezinLocalization` | `Maybe<ChezinEntityResponse>` |
| `createClause` | `Maybe<ClauseEntityResponse>` |
| `createConsentEvent` | `Maybe<ConsentEventEntityResponse>` |
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
| `createIssue` | `Maybe<IssueEntityResponse>` |
| `createMaagad` | `Maybe<MaagadEntityResponse>` |
| `createMaagadMember` | `Maybe<MaagadMemberEntityResponse>` |
| `createMaagadOffer` | `Maybe<MaagadOfferEntityResponse>` |
| `createMaap` | `Maybe<MaapEntityResponse>` |
| `createMaapLocalization` | `Maybe<MaapEntityResponse>` |
| `createMachshir` | `Maybe<MachshirEntityResponse>` |
| `createMashaabim` | `Maybe<MashaabimEntityResponse>` |
| `createMashaabimLocalization` | `Maybe<MashaabimEntityResponse>` |
| `createMashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `createMatanot` | `Maybe<MatanotEntityResponse>` |
| `createMatanotLocalization` | `Maybe<MatanotEntityResponse>` |
| `createMatanotRecipeMission` | `Maybe<MatanotRecipeMissionEntityResponse>` |
| `createMatanotRecipeResource` | `Maybe<MatanotRecipeResourceEntityResponse>` |
| `createMatanotpend` | `Maybe<MatanotpendEntityResponse>` |
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
| `createProviderProfile` | `Maybe<ProviderProfileEntityResponse>` |
| `createRatson` | `Maybe<RatsonEntityResponse>` |
| `createRatsonLocalization` | `Maybe<RatsonEntityResponse>` |
| `createRatsonMatchJob` | `Maybe<RatsonMatchJobEntityResponse>` |
| `createRatsonProposal` | `Maybe<RatsonProposalEntityResponse>` |
| `createRatsonShare` | `Maybe<RatsonShareEntityResponse>` |
| `createRichtext` | `Maybe<RichtextEntityResponse>` |
| `createRichtextLocalization` | `Maybe<RichtextEntityResponse>` |
| `createRikmash` | `Maybe<RikmashEntityResponse>` |
| `createSale` | `Maybe<SaleEntityResponse>` |
| `createSealedEnvelope` | `Maybe<SealedEnvelopeEntityResponse>` |
| `createSeeder` | `Maybe<SeederEntityResponse>` |
| `createSheirut` | `Maybe<SheirutEntityResponse>` |
| `createSheirutFulfillment` | `Maybe<SheirutFulfillmentEntityResponse>` |
| `createSheirutLocalization` | `Maybe<SheirutEntityResponse>` |
| `createSheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `createSheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `createSheirutpendLocalization` | `Maybe<SheirutpendEntityResponse>` |
| `createSidur` | `Maybe<SidurEntityResponse>` |
| `createSiteReport` | `Maybe<SiteReportEntityResponse>` |
| `createSiteShareContribution` | `Maybe<SiteShareContributionEntityResponse>` |
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
| `createUserKey` | `Maybe<UserKeyEntityResponse>` |
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
| `deleteApiKey` | `Maybe<ApiKeyEntityResponse>` |
| `deleteArgument` | `Maybe<ArgumentEntityResponse>` |
| `deleteAsk` | `Maybe<AskEntityResponse>` |
| `deleteAskm` | `Maybe<AskmEntityResponse>` |
| `deleteAskwant` | `Maybe<AskwantEntityResponse>` |
| `deleteBakasha` | `Maybe<BakashaEntityResponse>` |
| `deleteCategory` | `Maybe<CategoryEntityResponse>` |
| `deleteChezin` | `Maybe<ChezinEntityResponse>` |
| `deleteClause` | `Maybe<ClauseEntityResponse>` |
| `deleteConsentEvent` | `Maybe<ConsentEventEntityResponse>` |
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
| `deleteIssue` | `Maybe<IssueEntityResponse>` |
| `deleteMaagad` | `Maybe<MaagadEntityResponse>` |
| `deleteMaagadMember` | `Maybe<MaagadMemberEntityResponse>` |
| `deleteMaagadOffer` | `Maybe<MaagadOfferEntityResponse>` |
| `deleteMaap` | `Maybe<MaapEntityResponse>` |
| `deleteMachshir` | `Maybe<MachshirEntityResponse>` |
| `deleteMashaabim` | `Maybe<MashaabimEntityResponse>` |
| `deleteMashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `deleteMatanot` | `Maybe<MatanotEntityResponse>` |
| `deleteMatanotRecipeMission` | `Maybe<MatanotRecipeMissionEntityResponse>` |
| `deleteMatanotRecipeResource` | `Maybe<MatanotRecipeResourceEntityResponse>` |
| `deleteMatanotpend` | `Maybe<MatanotpendEntityResponse>` |
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
| `deleteProviderProfile` | `Maybe<ProviderProfileEntityResponse>` |
| `deleteRatson` | `Maybe<RatsonEntityResponse>` |
| `deleteRatsonMatchJob` | `Maybe<RatsonMatchJobEntityResponse>` |
| `deleteRatsonProposal` | `Maybe<RatsonProposalEntityResponse>` |
| `deleteRatsonShare` | `Maybe<RatsonShareEntityResponse>` |
| `deleteRichtext` | `Maybe<RichtextEntityResponse>` |
| `deleteRikmash` | `Maybe<RikmashEntityResponse>` |
| `deleteSale` | `Maybe<SaleEntityResponse>` |
| `deleteSealedEnvelope` | `Maybe<SealedEnvelopeEntityResponse>` |
| `deleteSeeder` | `Maybe<SeederEntityResponse>` |
| `deleteSheirut` | `Maybe<SheirutEntityResponse>` |
| `deleteSheirutFulfillment` | `Maybe<SheirutFulfillmentEntityResponse>` |
| `deleteSheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `deleteSheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `deleteSidur` | `Maybe<SidurEntityResponse>` |
| `deleteSiteReport` | `Maybe<SiteReportEntityResponse>` |
| `deleteSiteShareContribution` | `Maybe<SiteShareContributionEntityResponse>` |
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
| `deleteUserKey` | `Maybe<UserKeyEntityResponse>` |
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
| `updateApiKey` | `Maybe<ApiKeyEntityResponse>` |
| `updateArgument` | `Maybe<ArgumentEntityResponse>` |
| `updateAsk` | `Maybe<AskEntityResponse>` |
| `updateAskm` | `Maybe<AskmEntityResponse>` |
| `updateAskwant` | `Maybe<AskwantEntityResponse>` |
| `updateBakasha` | `Maybe<BakashaEntityResponse>` |
| `updateCategory` | `Maybe<CategoryEntityResponse>` |
| `updateChezin` | `Maybe<ChezinEntityResponse>` |
| `updateClause` | `Maybe<ClauseEntityResponse>` |
| `updateConsentEvent` | `Maybe<ConsentEventEntityResponse>` |
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
| `updateIssue` | `Maybe<IssueEntityResponse>` |
| `updateMaagad` | `Maybe<MaagadEntityResponse>` |
| `updateMaagadMember` | `Maybe<MaagadMemberEntityResponse>` |
| `updateMaagadOffer` | `Maybe<MaagadOfferEntityResponse>` |
| `updateMaap` | `Maybe<MaapEntityResponse>` |
| `updateMachshir` | `Maybe<MachshirEntityResponse>` |
| `updateMashaabim` | `Maybe<MashaabimEntityResponse>` |
| `updateMashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `updateMatanot` | `Maybe<MatanotEntityResponse>` |
| `updateMatanotRecipeMission` | `Maybe<MatanotRecipeMissionEntityResponse>` |
| `updateMatanotRecipeResource` | `Maybe<MatanotRecipeResourceEntityResponse>` |
| `updateMatanotpend` | `Maybe<MatanotpendEntityResponse>` |
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
| `updateProviderProfile` | `Maybe<ProviderProfileEntityResponse>` |
| `updateRatson` | `Maybe<RatsonEntityResponse>` |
| `updateRatsonMatchJob` | `Maybe<RatsonMatchJobEntityResponse>` |
| `updateRatsonProposal` | `Maybe<RatsonProposalEntityResponse>` |
| `updateRatsonShare` | `Maybe<RatsonShareEntityResponse>` |
| `updateRichtext` | `Maybe<RichtextEntityResponse>` |
| `updateRikmash` | `Maybe<RikmashEntityResponse>` |
| `updateSale` | `Maybe<SaleEntityResponse>` |
| `updateSealedEnvelope` | `Maybe<SealedEnvelopeEntityResponse>` |
| `updateSeeder` | `Maybe<SeederEntityResponse>` |
| `updateSheirut` | `Maybe<SheirutEntityResponse>` |
| `updateSheirutFulfillment` | `Maybe<SheirutFulfillmentEntityResponse>` |
| `updateSheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `updateSheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `updateSidur` | `Maybe<SidurEntityResponse>` |
| `updateSiteReport` | `Maybe<SiteReportEntityResponse>` |
| `updateSiteShareContribution` | `Maybe<SiteShareContributionEntityResponse>` |
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
| `updateUserKey` | `Maybe<UserKeyEntityResponse>` |
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
| `acceptedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `decision` | `Maybe<DecisionEntityResponse>` |
| `des` | `Maybe<Scalars['JSON']['output']>` |
| `fixprice` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Nego_Kindof>` |
| `location` | `Maybe<Array<Maybe<ComponentNewLocation>>>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `matanotpend` | `Maybe<MatanotpendEntityResponse>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `proposedHours` | `Maybe<Scalars['Float']['output']>` |
| `proposedPrice` | `Maybe<Scalars['Float']['output']>` |
| `proposedQuantity` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `ratson_proposal` | `Maybe<RatsonProposalEntityResponse>` |
| `recipeMission` | `Maybe<MatanotRecipeMissionRelationResponseCollection>` |
| `recipeResource` | `Maybe<MatanotRecipeResourceRelationResponseCollection>` |
| `rejectedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |

### NegoMash
| Field | Type |
|-------|------|
| `askm` | `Maybe<AskmEntityResponse>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `cycleSize` | `Maybe<Scalars['Int']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `isOriginal` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Negomash_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `location` | `Maybe<Array<Maybe<ComponentNewLocation>>>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `ordern` | `Maybe<Scalars['Int']['output']>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `proposedBy` | `Maybe<Enum_Negomash_Proposedby>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `recurring` | `Maybe<Scalars['Boolean']['output']>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |
| `status` | `Maybe<Enum_Negomash_Status>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Negopendmission
| Field | Type |
|-------|------|
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `ask` | `Maybe<AskEntityResponse>` |
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
| `location` | `Maybe<Array<Maybe<ComponentNewLocation>>>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `ordern` | `Maybe<Scalars['Int']['output']>` |
| `pendm` | `Maybe<PendmEntityResponse>` |
| `perhour` | `Maybe<Scalars['Float']['output']>` |
| `proposedBy` | `Maybe<Enum_Negopendmission_Proposedby>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `status` | `Maybe<Enum_Negopendmission_Status>` |
| `tafkidims` | `Maybe<TafkidimRelationResponseCollection>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `vots` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `work_ways` | `Maybe<WorkWayRelationResponseCollection>` |

### Negotiation
| Field | Type |
|-------|------|
| `arguments` | `Maybe<ArgumentRelationResponseCollection>` |
| `clauses` | `Maybe<ClauseRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `createdByEmail` | `Maybe<Scalars['String']['output']>` |
| `creator` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `cuntries` | `Maybe<CuntryRelationResponseCollection>` |
| `currentRound` | `Maybe<Scalars['Int']['output']>` |
| `description` | `Maybe<Scalars['String']['output']>` |
| `isLocal` | `Maybe<Scalars['Boolean']['output']>` |
| `issues` | `Maybe<IssueRelationResponseCollection>` |
| `maxRounds` | `Maybe<Scalars['Int']['output']>` |
| `ownerExternalId` | `Maybe<Scalars['String']['output']>` |
| `participants` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `positions` | `Maybe<PositionRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `resolution` | `Maybe<Scalars['JSON']['output']>` |
| `scaleMax` | `Maybe<Scalars['Int']['output']>` |
| `scaleMin` | `Maybe<Scalars['Int']['output']>` |
| `shareToken` | `Maybe<Scalars['String']['output']>` |
| `sourceId` | `Maybe<Scalars['String']['output']>` |
| `sourceMeta` | `Maybe<Scalars['JSON']['output']>` |
| `sourceType` | `Maybe<Scalars['String']['output']>` |
| `status` | `Maybe<Enum_Negotiation_Status>` |
| `topic` | `Maybe<Scalars['String']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `visibility` | `Maybe<Enum_Negotiation_Visibility>` |

### OpenMashaabim
| Field | Type |
|-------|------|
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `askms` | `Maybe<AskmRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `cycleSize` | `Maybe<Scalars['Int']['output']>` |
| `declinedsps` | `Maybe<SpRelationResponseCollection>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `extractedKey` | `Maybe<Scalars['String']['output']>` |
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
| `location` | `Maybe<ComponentNewLocation>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `nego_mashes` | `Maybe<NegoMashRelationResponseCollection>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `pmash` | `Maybe<PmashEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratson_proposal` | `Maybe<RatsonProposalEntityResponse>` |
| `recurring` | `Maybe<Scalars['Boolean']['output']>` |
| `rikmashes` | `Maybe<RikmashRelationResponseCollection>` |
| `source` | `Maybe<Enum_Openmashaabim_Source>` |
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
| `extractedKey` | `Maybe<Scalars['String']['output']>` |
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
| `location` | `Maybe<ComponentNewLocation>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
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
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratson_proposals` | `Maybe<RatsonProposalRelationResponseCollection>` |
| `rishon` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `rishonves` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `skills` | `Maybe<SkillRelationResponseCollection>` |
| `source` | `Maybe<Enum_Openmission_Source>` |
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
| `acts` | `Maybe<ActRelationResponseCollection>` |
| `askms` | `Maybe<AskmRelationResponseCollection>` |
| `asks` | `Maybe<AskRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `default` | `Maybe<Scalars['Boolean']['output']>` |
| `finiapruvals` | `Maybe<FiniapruvalRelationResponseCollection>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `mashabetahaliches` | `Maybe<MashabetahalichRelationResponseCollection>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `matanot_recipe_missions` | `Maybe<MatanotRecipeMissionRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `open_mashaabims` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `pmashes` | `Maybe<PmashRelationResponseCollection>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `sheirut_fulfillments` | `Maybe<SheirutFulfillmentRelationResponseCollection>` |
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
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `hearotMeyuchadot` | `Maybe<Scalars['String']['output']>` |
| `howMeny` | `Maybe<Scalars['Long']['output']>` |
| `isLast` | `Maybe<Scalars['Boolean']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `isglobal` | `Maybe<Scalars['Boolean']['output']>` |
| `iskvua` | `Maybe<Scalars['Boolean']['output']>` |
| `isshift` | `Maybe<Scalars['Boolean']['output']>` |
| `location` | `Maybe<ComponentNewLocation>` |
| `matanot_recipe_missions` | `Maybe<MatanotRecipeMissionRelationResponseCollection>` |
| `mission` | `Maybe<MissionEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `nego` | `Maybe<Array<Maybe<ComponentNewNego>>>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `noofhours` | `Maybe<Scalars['Float']['output']>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
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
| `askm` | `Maybe<AskmEntityResponse>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `cycleSize` | `Maybe<Scalars['Int']['output']>` |
| `descrip` | `Maybe<Scalars['String']['output']>` |
| `diun` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |
| `easy` | `Maybe<Scalars['Float']['output']>` |
| `forums` | `Maybe<ForumRelationResponseCollection>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `isMaap` | `Maybe<Scalars['Boolean']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isSelfProposal` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Pmash_Kindof>` |
| `linkto` | `Maybe<Scalars['String']['output']>` |
| `location` | `Maybe<ComponentNewLocation>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `mashabetahaliches` | `Maybe<MashabetahalichRelationResponseCollection>` |
| `matanot_recipe_resources` | `Maybe<MatanotRecipeResourceRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `nego_mashes` | `Maybe<NegoMashRelationResponseCollection>` |
| `negom` | `Maybe<Array<Maybe<ComponentNewNegom>>>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `partofs` | `Maybe<PartofRelationResponseCollection>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `recurring` | `Maybe<Scalars['Boolean']['output']>` |
| `selfProposalUser` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `sheirut_fulfillments` | `Maybe<SheirutFulfillmentRelationResponseCollection>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |
| `timegrama` | `Maybe<TimegramaEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users` | `Maybe<Array<Maybe<ComponentProjectsVots>>>` |

### Position
| Field | Type |
|-------|------|
| `aiMeta` | `Maybe<Scalars['JSON']['output']>` |
| `arguments` | `Maybe<ArgumentRelationResponseCollection>` |
| `author` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `authorEmail` | `Maybe<Scalars['String']['output']>` |
| `authorExternalId` | `Maybe<Scalars['String']['output']>` |
| `authorType` | `Maybe<Enum_Position_Authortype>` |
| `clauses` | `Maybe<ClauseRelationResponseCollection>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `description` | `Maybe<Scalars['String']['output']>` |
| `heading` | `Maybe<Scalars['String']['output']>` |
| `intensity` | `Maybe<Scalars['Int']['output']>` |
| `isAnchor` | `Maybe<Scalars['Boolean']['output']>` |
| `kind` | `Maybe<Enum_Position_Kind>` |
| `location` | `Maybe<Scalars['Float']['output']>` |
| `negotiation` | `Maybe<NegotiationEntityResponse>` |
| `order` | `Maybe<Scalars['Int']['output']>` |
| `pole` | `Maybe<Enum_Position_Pole>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `relativePlacement` | `Maybe<Scalars['JSON']['output']>` |
| `selfPlacement` | `Maybe<Scalars['Int']['output']>` |
| `tags` | `Maybe<Scalars['JSON']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `voters` | `Maybe<Scalars['JSON']['output']>` |
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
| `halukas_recive` | `Maybe<HalukaRelationResponseCollection>` |
| `isMachzikim` | `Maybe<Scalars['Boolean']['output']>` |
| `isMachzikimPublik` | `Maybe<Scalars['Boolean']['output']>` |
| `isOt` | `Maybe<Scalars['Boolean']['output']>` |
| `isPlatform` | `Maybe<Scalars['Boolean']['output']>` |
| `linkToWebsite` | `Maybe<Scalars['String']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<ProjectRelationResponseCollection>` |
| `location` | `Maybe<ComponentNewLocation>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `machshirs` | `Maybe<MachshirRelationResponseCollection>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `mashabetahaliches` | `Maybe<MashabetahalichRelationResponseCollection>` |
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
| `ratson_proposals` | `Maybe<RatsonProposalRelationResponseCollection>` |
| `restime` | `Maybe<Enum_Project_Restime>` |
| `rikmashes` | `Maybe<RikmashRelationResponseCollection>` |
| `sales` | `Maybe<SaleRelationResponseCollection>` |
| `sales_source` | `Maybe<SaleRelationResponseCollection>` |
| `sheirutpends` | `Maybe<SheirutpendRelationResponseCollection>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `sheiruts_sourced` | `Maybe<SheirutRelationResponseCollection>` |
| `site_share_contributions` | `Maybe<SiteShareContributionRelationResponseCollection>` |
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

### ProviderProfile
| Field | Type |
|-------|------|
| `ai_meta` | `Maybe<Scalars['JSON']['output']>` |
| `archived` | `Maybe<Scalars['Boolean']['output']>` |
| `avg_rating` | `Maybe<Scalars['Float']['output']>` |
| `bio_raw` | `Maybe<Scalars['String']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `display_name` | `Maybe<Scalars['String']['output']>` |
| `lat` | `Maybe<Scalars['Float']['output']>` |
| `lng` | `Maybe<Scalars['Float']['output']>` |
| `location` | `Maybe<ComponentNewLocation>` |
| `owner_id` | `Maybe<Scalars['String']['output']>` |
| `owner_type` | `Maybe<Enum_Providerprofile_Owner_Type>` |
| `pinecone_id` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `radius_km` | `Maybe<Scalars['Int']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### Query
| Field | Type |
|-------|------|
| `act` | `Maybe<ActEntityResponse>` |
| `acts` | `Maybe<ActEntityResponseCollection>` |
| `actt` | `Maybe<ActtEntityResponse>` |
| `actts` | `Maybe<ActtEntityResponseCollection>` |
| `apiKey` | `Maybe<ApiKeyEntityResponse>` |
| `apiKeys` | `Maybe<ApiKeyEntityResponseCollection>` |
| `argument` | `Maybe<ArgumentEntityResponse>` |
| `arguments` | `Maybe<ArgumentEntityResponseCollection>` |
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
| `clause` | `Maybe<ClauseEntityResponse>` |
| `clauses` | `Maybe<ClauseEntityResponseCollection>` |
| `consentEvent` | `Maybe<ConsentEventEntityResponse>` |
| `consentEvents` | `Maybe<ConsentEventEntityResponseCollection>` |
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
| `issue` | `Maybe<IssueEntityResponse>` |
| `issues` | `Maybe<IssueEntityResponseCollection>` |
| `maagad` | `Maybe<MaagadEntityResponse>` |
| `maagadMember` | `Maybe<MaagadMemberEntityResponse>` |
| `maagadMembers` | `Maybe<MaagadMemberEntityResponseCollection>` |
| `maagadOffer` | `Maybe<MaagadOfferEntityResponse>` |
| `maagadOffers` | `Maybe<MaagadOfferEntityResponseCollection>` |
| `maagads` | `Maybe<MaagadEntityResponseCollection>` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `maaps` | `Maybe<MaapEntityResponseCollection>` |
| `machshir` | `Maybe<MachshirEntityResponse>` |
| `machshirs` | `Maybe<MachshirEntityResponseCollection>` |
| `mashaabim` | `Maybe<MashaabimEntityResponse>` |
| `mashaabims` | `Maybe<MashaabimEntityResponseCollection>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `mashabetahaliches` | `Maybe<MashabetahalichEntityResponseCollection>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `matanotRecipeMission` | `Maybe<MatanotRecipeMissionEntityResponse>` |
| `matanotRecipeMissions` | `Maybe<MatanotRecipeMissionEntityResponseCollection>` |
| `matanotRecipeResource` | `Maybe<MatanotRecipeResourceEntityResponse>` |
| `matanotRecipeResources` | `Maybe<MatanotRecipeResourceEntityResponseCollection>` |
| `matanotpend` | `Maybe<MatanotpendEntityResponse>` |
| `matanotpends` | `Maybe<MatanotpendEntityResponseCollection>` |
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
| `providerProfile` | `Maybe<ProviderProfileEntityResponse>` |
| `providerProfiles` | `Maybe<ProviderProfileEntityResponseCollection>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratsonMatchJob` | `Maybe<RatsonMatchJobEntityResponse>` |
| `ratsonMatchJobs` | `Maybe<RatsonMatchJobEntityResponseCollection>` |
| `ratsonProposal` | `Maybe<RatsonProposalEntityResponse>` |
| `ratsonProposals` | `Maybe<RatsonProposalEntityResponseCollection>` |
| `ratsonShare` | `Maybe<RatsonShareEntityResponse>` |
| `ratsonShares` | `Maybe<RatsonShareEntityResponseCollection>` |
| `ratsons` | `Maybe<RatsonEntityResponseCollection>` |
| `richtext` | `Maybe<RichtextEntityResponse>` |
| `richtexts` | `Maybe<RichtextEntityResponseCollection>` |
| `rikmash` | `Maybe<RikmashEntityResponse>` |
| `rikmashes` | `Maybe<RikmashEntityResponseCollection>` |
| `sale` | `Maybe<SaleEntityResponse>` |
| `sales` | `Maybe<SaleEntityResponseCollection>` |
| `sealedEnvelope` | `Maybe<SealedEnvelopeEntityResponse>` |
| `sealedEnvelopes` | `Maybe<SealedEnvelopeEntityResponseCollection>` |
| `seeder` | `Maybe<SeederEntityResponse>` |
| `seeders` | `Maybe<SeederEntityResponseCollection>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `sheirutFulfillment` | `Maybe<SheirutFulfillmentEntityResponse>` |
| `sheirutFulfillments` | `Maybe<SheirutFulfillmentEntityResponseCollection>` |
| `sheirutnego` | `Maybe<SheirutnegoEntityResponse>` |
| `sheirutnegos` | `Maybe<SheirutnegoEntityResponseCollection>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `sheirutpends` | `Maybe<SheirutpendEntityResponseCollection>` |
| `sheiruts` | `Maybe<SheirutEntityResponseCollection>` |
| `sidur` | `Maybe<SidurEntityResponse>` |
| `sidurs` | `Maybe<SidurEntityResponseCollection>` |
| `siteReport` | `Maybe<SiteReportEntityResponse>` |
| `siteReports` | `Maybe<SiteReportEntityResponseCollection>` |
| `siteShareContribution` | `Maybe<SiteShareContributionEntityResponse>` |
| `siteShareContributions` | `Maybe<SiteShareContributionEntityResponseCollection>` |
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
| `userKey` | `Maybe<UserKeyEntityResponse>` |
| `userKeys` | `Maybe<UserKeyEntityResponseCollection>` |
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
| `access_mode` | `Maybe<Enum_Ratson_Access_Mode>` |
| `age_group` | `Maybe<Scalars['String']['output']>` |
| `aggregation_opt_out` | `Maybe<Scalars['Boolean']['output']>` |
| `ai_meta` | `Maybe<Scalars['JSON']['output']>` |
| `allowJoin` | `Maybe<Scalars['Boolean']['output']>` |
| `bounti` | `Maybe<Scalars['Boolean']['output']>` |
| `categories` | `Maybe<CategoryRelationResponseCollection>` |
| `chat_forum` | `Maybe<ForumEntityResponse>` |
| `consensusRule` | `Maybe<Enum_Ratson_Consensusrule>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `derivedComplexMatanot` | `Maybe<MatanotEntityResponse>` |
| `desc` | `Maybe<Scalars['String']['output']>` |
| `extracted_missions` | `Maybe<Array<Maybe<ComponentNewExtractedMissions>>>` |
| `extracted_resources` | `Maybe<Array<Maybe<ComponentNewExtractedResources>>>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `frequency` | `Maybe<Scalars['String']['output']>` |
| `fulfilled` | `Maybe<Scalars['Boolean']['output']>` |
| `fulfillment_score` | `Maybe<Scalars['Float']['output']>` |
| `isOnline` | `Maybe<Scalars['Boolean']['output']>` |
| `joinDeadline` | `Maybe<Scalars['DateTime']['output']>` |
| `joinKind` | `Maybe<Enum_Ratson_Joinkind>` |
| `language` | `Maybe<Scalars['String']['output']>` |
| `last_matched_at` | `Maybe<Scalars['DateTime']['output']>` |
| `lat` | `Maybe<Scalars['Float']['output']>` |
| `link` | `Maybe<Scalars['String']['output']>` |
| `lng` | `Maybe<Scalars['Float']['output']>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<RatsonRelationResponseCollection>` |
| `location` | `Maybe<Array<Maybe<ComponentNewLocation>>>` |
| `location_hint` | `Maybe<Scalars['String']['output']>` |
| `lockedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `logo` | `Maybe<UploadFileEntityResponse>` |
| `longDes` | `Maybe<Scalars['String']['output']>` |
| `maagad` | `Maybe<MaagadEntityResponse>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `matanots_offered` | `Maybe<MatanotRelationResponseCollection>` |
| `maxJoiners` | `Maybe<Scalars['Int']['output']>` |
| `minJoiners` | `Maybe<Scalars['Int']['output']>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `open_mashaabims` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `partialConsensusFallback` | `Maybe<Enum_Ratson_Partialconsensusfallback>` |
| `pics` | `Maybe<UploadFileRelationResponseCollection>` |
| `pinecone_id` | `Maybe<Scalars['String']['output']>` |
| `process` | `Maybe<PartofEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `radius` | `Maybe<Scalars['Long']['output']>` |
| `ratson_match_jobs` | `Maybe<RatsonMatchJobRelationResponseCollection>` |
| `ratson_proposals` | `Maybe<RatsonProposalRelationResponseCollection>` |
| `ratson_shares` | `Maybe<RatsonShareRelationResponseCollection>` |
| `share_status` | `Maybe<Enum_Ratson_Share_Status>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `status_ratson` | `Maybe<Enum_Ratson_Status_Ratson>` |
| `sub_category` | `Maybe<Scalars['String']['output']>` |
| `totalbounti` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `vallues` | `Maybe<VallueRelationResponseCollection>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |
| `willingnessModel` | `Maybe<Enum_Ratson_Willingnessmodel>` |

### RatsonMatchJob
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `error` | `Maybe<Scalars['String']['output']>` |
| `finished_at` | `Maybe<Scalars['DateTime']['output']>` |
| `mode` | `Maybe<Enum_Ratsonmatchjob_Mode>` |
| `proposals_created` | `Maybe<Scalars['Int']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `started_at` | `Maybe<Scalars['DateTime']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

### RatsonProposal
| Field | Type |
|-------|------|
| `auto_generated` | `Maybe<Scalars['Boolean']['output']>` |
| `covered_missions` | `Maybe<Array<Maybe<ComponentNewCoveredMissions>>>` |
| `covered_resources` | `Maybe<Array<Maybe<ComponentNewCoveredResources>>>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `final_breakdown` | `Maybe<Scalars['JSON']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `kind` | `Maybe<Enum_Ratsonproposal_Kind>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `matbea` | `Maybe<MatbeaEntityResponse>` |
| `match_score` | `Maybe<Scalars['Float']['output']>` |
| `negos` | `Maybe<NegoRelationResponseCollection>` |
| `open_mashaabims` | `Maybe<OpenMashaabimRelationResponseCollection>` |
| `open_mission` | `Maybe<OpenMissionEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `proposer_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratson_willingness_entry` | `Maybe<Array<Maybe<ComponentNewWillingnessEntries>>>` |
| `sheirutpends` | `Maybe<SheirutpendRelationResponseCollection>` |
| `status_proposal` | `Maybe<Enum_Ratsonproposal_Status_Proposal>` |
| `tosplits` | `Maybe<TosplitRelationResponseCollection>` |
| `total_price` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `votes` | `Maybe<VoteRelationResponseCollection>` |

### RatsonShare
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `halukas` | `Maybe<HalukaRelationResponseCollection>` |
| `joinedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `leftAt` | `Maybe<Scalars['DateTime']['output']>` |
| `matbea` | `Maybe<MatbeaEntityResponse>` |
| `maxContribution` | `Maybe<Scalars['Float']['output']>` |
| `notificationsOn` | `Maybe<Scalars['Boolean']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `role` | `Maybe<Enum_Ratsonshare_Role>` |
| `status_share` | `Maybe<Enum_Ratsonshare_Status_Share>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

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
| `cyclesCount` | `Maybe<Scalars['Int']['output']>` |
| `deliveries` | `Maybe<Array<Maybe<ComponentProjectsDeliveries>>>` |
| `firstDeliveryAt` | `Maybe<Scalars['DateTime']['output']>` |
| `haamadas` | `Maybe<HaamadaRelationResponseCollection>` |
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `isMust` | `Maybe<Scalars['Boolean']['output']>` |
| `isYesod` | `Maybe<Scalars['Boolean']['output']>` |
| `kindOf` | `Maybe<Enum_Rikmash_Kindof>` |
| `lastDeliveryAt` | `Maybe<Scalars['DateTime']['output']>` |
| `maaps` | `Maybe<MaapRelationResponseCollection>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quantityDelivered` | `Maybe<Scalars['Float']['output']>` |
| `sp` | `Maybe<SpEntityResponse>` |
| `spnot` | `Maybe<Scalars['String']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualef` | `Maybe<Scalars['DateTime']['output']>` |
| `summary` | `Maybe<Scalars['String']['output']>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### Sale
| Field | Type |
|-------|------|
| `confirmedBy` | `Maybe<Enum_Sale_Confirmedby>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `date` | `Maybe<Scalars['DateTime']['output']>` |
| `decision` | `Maybe<DecisionEntityResponse>` |
| `finishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `holderDecidedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `holderStatus` | `Maybe<Enum_Sale_Holderstatus>` |
| `in` | `Maybe<Scalars['Float']['output']>` |
| `isMonterActive` | `Maybe<Scalars['Boolean']['output']>` |
| `isSiteShareIncome` | `Maybe<Scalars['Boolean']['output']>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `monters` | `Maybe<MonterRelationResponseCollection>` |
| `note` | `Maybe<Scalars['String']['output']>` |
| `pending` | `Maybe<Scalars['Boolean']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `reporter` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `source_project` | `Maybe<ProjectEntityResponse>` |
| `splited` | `Scalars['Boolean']['output']` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `tosplits` | `Maybe<TosplitRelationResponseCollection>` |
| `unit` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

### SealedEnvelope
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `envelopeId` | `Scalars['String']['output']` |
| `payload` | `Scalars['JSON']['output']` |
| `spaceId` | `Scalars['String']['output']` |
| `ts` | `Maybe<Scalars['Long']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

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
| `halukas` | `Maybe<HalukaRelationResponseCollection>` |
| `iCanGetMonay` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `iGotIt` | `Maybe<Scalars['Boolean']['output']>` |
| `iGotMoney` | `Maybe<Array<Maybe<ComponentProjectsIGotMoney>>>` |
| `iTransferMoney` | `Maybe<Scalars['Boolean']['output']>` |
| `iTransferedTo` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `isApruved` | `Maybe<Scalars['Boolean']['output']>` |
| `isItOnlyOneInProject` | `Maybe<Scalars['Boolean']['output']>` |
| `isSiteShareIncome` | `Maybe<Scalars['Boolean']['output']>` |
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
| `sheirut_fulfillments` | `Maybe<SheirutFulfillmentRelationResponseCollection>` |
| `sheirutpend` | `Maybe<SheirutpendEntityResponse>` |
| `site_share_contributions` | `Maybe<SiteShareContributionRelationResponseCollection>` |
| `source_project` | `Maybe<ProjectEntityResponse>` |
| `source_proposals` | `Maybe<RatsonRelationResponseCollection>` |
| `source_tosplit` | `Maybe<TosplitEntityResponse>` |
| `startDate` | `Maybe<Scalars['DateTime']['output']>` |
| `total` | `Maybe<Scalars['Float']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_users` | `Maybe<UsersPermissionsUserRelationResponseCollection>` |
| `wants` | `Maybe<WantRelationResponseCollection>` |
| `weFinnish` | `Maybe<VoteRelationResponseCollection>` |

### SheirutFulfillment
| Field | Type |
|-------|------|
| `agreedPrice` | `Maybe<Scalars['Float']['output']>` |
| `cmdm` | `Maybe<Array<Maybe<ComponentProjectsConsumedMashabetahalichDeliveries>>>` |
| `consumedMissionHours` | `Maybe<Array<Maybe<ComponentProjectsConsumedMissionHours>>>` |
| `consumedOpenMU` | `Maybe<Array<Maybe<ComponentProjectsConsumedOpenMu>>>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `createdMaaps` | `Maybe<MaapEntityResponse>` |
| `createdMissions` | `Maybe<MesimabetahalichEntityResponse>` |
| `createdPmashes` | `Maybe<PmashEntityResponse>` |
| `matanot` | `Maybe<MatanotEntityResponse>` |
| `process` | `Maybe<PartofEntityResponse>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `quantity` | `Maybe<Scalars['Float']['output']>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `status_process` | `Maybe<Enum_Sheirutfulfillment_Status_Process>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |

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
| `conditional` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `finnishDate` | `Maybe<Scalars['DateTime']['output']>` |
| `forum` | `Maybe<ForumEntityResponse>` |
| `locale` | `Maybe<Scalars['String']['output']>` |
| `localizations` | `Maybe<SheirutpendRelationResponseCollection>` |
| `maagad_offer` | `Maybe<MaagadOfferEntityResponse>` |
| `matanots` | `Maybe<MatanotRelationResponseCollection>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `quant` | `Maybe<Scalars['Float']['output']>` |
| `ratson_proposal` | `Maybe<RatsonProposalEntityResponse>` |
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

### SiteReport
| Field | Type |
|-------|------|
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `description` | `Maybe<Scalars['String']['output']>` |
| `lang` | `Maybe<Scalars['String']['output']>` |
| `page` | `Maybe<Scalars['String']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `status` | `Maybe<Enum_Sitereport_Status>` |
| `type` | `Maybe<Enum_Sitereport_Type>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `userEmail` | `Maybe<Scalars['String']['output']>` |
| `userId` | `Maybe<Scalars['String']['output']>` |
| `userName` | `Maybe<Scalars['String']['output']>` |

### SiteShareContribution
| Field | Type |
|-------|------|
| `amount` | `Maybe<Scalars['Float']['output']>` |
| `basisAmount` | `Maybe<Scalars['Float']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `des_status` | `Maybe<Enum_Sitesharecontribution_Des_Status>` |
| `direction` | `Maybe<Enum_Sitesharecontribution_Direction>` |
| `haluka` | `Maybe<HalukaEntityResponse>` |
| `matbea` | `Maybe<MatbeaEntityResponse>` |
| `project` | `Maybe<ProjectEntityResponse>` |
| `proposedAmount` | `Maybe<Scalars['Float']['output']>` |
| `publishedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `reason` | `Maybe<Scalars['String']['output']>` |
| `recive_project` | `Maybe<ProjectEntityResponse>` |
| `sheirut` | `Maybe<SheirutEntityResponse>` |
| `tosplit` | `Maybe<TosplitEntityResponse>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `users_permissions_user` | `Maybe<UsersPermissionsUserEntityResponse>` |

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
| `location` | `Maybe<ComponentNewLocation>` |
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
| `matanotpend` | `Maybe<MatanotpendEntityResponse>` |
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
| `finiapruvals` | `Maybe<FiniapruvalRelationResponseCollection>` |
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
| `ratson_proposal` | `Maybe<RatsonProposalEntityResponse>` |
| `sales` | `Maybe<SaleRelationResponseCollection>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `siteShareHalukas` | `Maybe<HalukaRelationResponseCollection>` |
| `site_share_contributions` | `Maybe<SiteShareContributionRelationResponseCollection>` |
| `split_origin` | `Maybe<Enum_Tosplit_Split_Origin>` |
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

### UserKey
| Field | Type |
|-------|------|
| `addedAt` | `Maybe<Scalars['Long']['output']>` |
| `algo` | `Scalars['String']['output']` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `devicePubB64` | `Scalars['String']['output']` |
| `label` | `Maybe<Scalars['String']['output']>` |
| `payload` | `Scalars['JSON']['output']` |
| `revokedAt` | `Maybe<Scalars['Long']['output']>` |
| `updatedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `userId` | `Scalars['String']['output']` |

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
| `api_keys` | `Maybe<ApiKeyRelationResponseCollection>` |
| `arr1` | `Maybe<Scalars['JSON']['output']>` |
| `arrdate` | `Maybe<Scalars['DateTime']['output']>` |
| `askeds` | `Maybe<OpenMissionRelationResponseCollection>` |
| `askms` | `Maybe<AskmRelationResponseCollection>` |
| `asks` | `Maybe<AskRelationResponseCollection>` |
| `askwants` | `Maybe<AskwantRelationResponseCollection>` |
| `auto_created_via` | `Maybe<Enum_Userspermissionsuser_Auto_Created_Via>` |
| `availability_pref` | `Maybe<Scalars['JSON']['output']>` |
| `bio` | `Maybe<Scalars['String']['output']>` |
| `blocked` | `Maybe<Scalars['Boolean']['output']>` |
| `chezin` | `Maybe<ChezinEntityResponse>` |
| `city` | `Maybe<Scalars['String']['output']>` |
| `confirmed` | `Maybe<Scalars['Boolean']['output']>` |
| `createdAt` | `Maybe<Scalars['DateTime']['output']>` |
| `cuntries` | `Maybe<CuntryRelationResponseCollection>` |
| `cv_extracted_at` | `Maybe<Scalars['DateTime']['output']>` |
| `cv_extraction` | `Maybe<Scalars['JSON']['output']>` |
| `cv_url` | `Maybe<UploadFileRelationResponseCollection>` |
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
| `lat` | `Maybe<Scalars['Float']['output']>` |
| `levManualAlready` | `Maybe<Scalars['Boolean']['output']>` |
| `lng` | `Maybe<Scalars['Float']['output']>` |
| `location` | `Maybe<Array<Maybe<ComponentNewLocation>>>` |
| `machshirs` | `Maybe<MachshirRelationResponseCollection>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `mashabetahaliches` | `Maybe<MashabetahalichRelationResponseCollection>` |
| `matanot_recipe_missions` | `Maybe<MatanotRecipeMissionRelationResponseCollection>` |
| `matanot_recipe_resources` | `Maybe<MatanotRecipeResourceRelationResponseCollection>` |
| `mesimabetahaliches` | `Maybe<MesimabetahalichRelationResponseCollection>` |
| `messages` | `Maybe<MessageRelationResponseCollection>` |
| `missions_i_can_do` | `Maybe<MissionRelationResponseCollection>` |
| `moachManualAlready` | `Maybe<Scalars['Boolean']['output']>` |
| `nego_mashes` | `Maybe<NegoMashRelationResponseCollection>` |
| `negopendmissions` | `Maybe<NegopendmissionRelationResponseCollection>` |
| `negotiations` | `Maybe<NegotiationRelationResponseCollection>` |
| `negotiationsIparticipante` | `Maybe<NegotiationRelationResponseCollection>` |
| `noMail` | `Maybe<Scalars['Boolean']['output']>` |
| `noMoachGuide` | `Maybe<Scalars['Boolean']['output']>` |
| `noOfHoursProject1` | `Maybe<Scalars['Float']['output']>` |
| `onboarding_status` | `Maybe<Enum_Userspermissionsuser_Onboarding_Status>` |
| `onboarding_track` | `Maybe<Enum_Userspermissionsuser_Onboarding_Track>` |
| `open_missions` | `Maybe<OpenMissionRelationResponseCollection>` |
| `pendms` | `Maybe<PendmRelationResponseCollection>` |
| `pendmsforme` | `Maybe<PendmRelationResponseCollection>` |
| `pgishas` | `Maybe<PgishaRelationResponseCollection>` |
| `pgishasPendStrat` | `Maybe<PgishaRelationResponseCollection>` |
| `pgishauserpends` | `Maybe<PgishauserpendRelationResponseCollection>` |
| `pgishausers` | `Maybe<PgishauserRelationResponseCollection>` |
| `pmashes` | `Maybe<PmashRelationResponseCollection>` |
| `positionsAuthor` | `Maybe<PositionRelationResponseCollection>` |
| `preferCards` | `Maybe<Scalars['Boolean']['output']>` |
| `pricing_pref` | `Maybe<Scalars['JSON']['output']>` |
| `profilManualAlready` | `Maybe<Scalars['Boolean']['output']>` |
| `profilePic` | `Maybe<UploadFileEntityResponse>` |
| `projects_1s` | `Maybe<ProjectRelationResponseCollection>` |
| `provider` | `Maybe<Scalars['String']['output']>` |
| `radius` | `Maybe<Scalars['Long']['output']>` |
| `ratson_proposals` | `Maybe<RatsonProposalRelationResponseCollection>` |
| `ratson_shares` | `Maybe<RatsonShareRelationResponseCollection>` |
| `ratsons` | `Maybe<RatsonRelationResponseCollection>` |
| `rikmashes` | `Maybe<RikmashRelationResponseCollection>` |
| `rishonvesopen` | `Maybe<OpenMissionRelationResponseCollection>` |
| `role` | `Maybe<UsersPermissionsRoleEntityResponse>` |
| `sales` | `Maybe<SaleRelationResponseCollection>` |
| `sales_reported` | `Maybe<SaleRelationResponseCollection>` |
| `sheirutnegos` | `Maybe<SheirutnegoRelationResponseCollection>` |
| `sheirutpends` | `Maybe<SheirutpendRelationResponseCollection>` |
| `sheiruts` | `Maybe<SheirutRelationResponseCollection>` |
| `sheiruts_iCanGetMonay` | `Maybe<SheirutRelationResponseCollection>` |
| `shekelsPerHoureProject1` | `Maybe<Scalars['Float']['output']>` |
| `site_share_contributions` | `Maybe<SiteShareContributionRelationResponseCollection>` |
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
| `item_idx` | `Maybe<Scalars['Int']['output']>` |
| `item_kind` | `Maybe<Enum_Vote_Item_Kind>` |
| `matanotpend` | `Maybe<MatanotpendEntityResponse>` |
| `nego` | `Maybe<NegoEntityResponse>` |
| `ok` | `Maybe<Scalars['Boolean']['output']>` |
| `order` | `Maybe<Scalars['Int']['output']>` |
| `ratson` | `Maybe<RatsonEntityResponse>` |
| `ratson_proposal` | `Maybe<RatsonProposalEntityResponse>` |
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

## 🧩 Component Types (92)

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

### ComponentNewCoveredMissions
| Field | Type |
|-------|------|
| `extracted_mission_idx` | `Maybe<Scalars['String']['output']>` |
| `hours` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `price` | `Maybe<Scalars['Float']['output']>` |

### ComponentNewCoveredMissionsFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewCoveredMissionsFiltersInput>>>` |
| `extracted_mission_idx` | `InputMaybe<StringFilterInput>` |
| `hours` | `InputMaybe<FloatFilterInput>` |
| `not` | `InputMaybe<ComponentNewCoveredMissionsFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewCoveredMissionsFiltersInput>>>` |
| `price` | `InputMaybe<FloatFilterInput>` |

### ComponentNewCoveredMissionsInput
| Field | Type |
|-------|------|
| `extracted_mission_idx` | `InputMaybe<Scalars['String']['input']>` |
| `hours` | `InputMaybe<Scalars['Float']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |

### ComponentNewCoveredResources
| Field | Type |
|-------|------|
| `extracted_resource_idx` | `Maybe<Scalars['String']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `quantity` | `Maybe<Scalars['Float']['output']>` |

### ComponentNewCoveredResourcesFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewCoveredResourcesFiltersInput>>>` |
| `extracted_resource_idx` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentNewCoveredResourcesFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewCoveredResourcesFiltersInput>>>` |
| `price` | `InputMaybe<FloatFilterInput>` |
| `quantity` | `InputMaybe<FloatFilterInput>` |

### ComponentNewCoveredResourcesInput
| Field | Type |
|-------|------|
| `extracted_resource_idx` | `InputMaybe<Scalars['String']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `quantity` | `InputMaybe<Scalars['Float']['input']>` |

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

### ComponentNewExtractedMissions
| Field | Type |
|-------|------|
| `hoursEst` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `importance` | `Maybe<Enum_Componentnewextractedmissions_Importance>` |
| `missions` | `Maybe<MissionRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `notes` | `Maybe<Scalars['String']['output']>` |

### ComponentNewExtractedMissionsMissionsArgs
| Field | Type |
|-------|------|
| `filters` | `InputMaybe<MissionFiltersInput>` |
| `pagination` | `InputMaybe<PaginationArg>` |
| `publicationState` | `InputMaybe<PublicationState>` |
| `sort` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |

### ComponentNewExtractedMissionsFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewExtractedMissionsFiltersInput>>>` |
| `hoursEst` | `InputMaybe<FloatFilterInput>` |
| `importance` | `InputMaybe<StringFilterInput>` |
| `missions` | `InputMaybe<MissionFiltersInput>` |
| `name` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentNewExtractedMissionsFiltersInput>` |
| `notes` | `InputMaybe<StringFilterInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewExtractedMissionsFiltersInput>>>` |

### ComponentNewExtractedMissionsInput
| Field | Type |
|-------|------|
| `hoursEst` | `InputMaybe<Scalars['Float']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `importance` | `InputMaybe<Enum_Componentnewextractedmissions_Importance>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `notes` | `InputMaybe<Scalars['String']['input']>` |

### ComponentNewExtractedResources
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `importance` | `Maybe<Enum_Componentnewextractedresources_Importance>` |
| `kindOf` | `Maybe<Enum_Componentnewextractedresources_Kindof>` |
| `mashaabims` | `Maybe<MashaabimRelationResponseCollection>` |
| `name` | `Maybe<Scalars['String']['output']>` |
| `notes` | `Maybe<Scalars['String']['output']>` |
| `quantityEst` | `Maybe<Scalars['Float']['output']>` |

### ComponentNewExtractedResourcesMashaabimsArgs
| Field | Type |
|-------|------|
| `filters` | `InputMaybe<MashaabimFiltersInput>` |
| `pagination` | `InputMaybe<PaginationArg>` |
| `publicationState` | `InputMaybe<PublicationState>` |
| `sort` | `InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>` |

### ComponentNewExtractedResourcesFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewExtractedResourcesFiltersInput>>>` |
| `importance` | `InputMaybe<StringFilterInput>` |
| `kindOf` | `InputMaybe<StringFilterInput>` |
| `mashaabims` | `InputMaybe<MashaabimFiltersInput>` |
| `name` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentNewExtractedResourcesFiltersInput>` |
| `notes` | `InputMaybe<StringFilterInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewExtractedResourcesFiltersInput>>>` |
| `quantityEst` | `InputMaybe<FloatFilterInput>` |

### ComponentNewExtractedResourcesInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `importance` | `InputMaybe<Enum_Componentnewextractedresources_Importance>` |
| `kindOf` | `InputMaybe<Enum_Componentnewextractedresources_Kindof>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `notes` | `InputMaybe<Scalars['String']['input']>` |
| `quantityEst` | `InputMaybe<Scalars['Float']['input']>` |

### ComponentNewLocation
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `lat` | `Maybe<Scalars['Float']['output']>` |
| `lng` | `Maybe<Scalars['Float']['output']>` |
| `location_hint` | `Maybe<Scalars['String']['output']>` |
| `location_mode` | `Maybe<Enum_Componentnewlocation_Location_Mode>` |
| `radius` | `Maybe<Scalars['Long']['output']>` |

### ComponentNewLocationFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewLocationFiltersInput>>>` |
| `lat` | `InputMaybe<FloatFilterInput>` |
| `lng` | `InputMaybe<FloatFilterInput>` |
| `location_hint` | `InputMaybe<StringFilterInput>` |
| `location_mode` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentNewLocationFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewLocationFiltersInput>>>` |
| `radius` | `InputMaybe<LongFilterInput>` |

### ComponentNewLocationInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `lat` | `InputMaybe<Scalars['Float']['input']>` |
| `lng` | `InputMaybe<Scalars['Float']['input']>` |
| `location_hint` | `InputMaybe<Scalars['String']['input']>` |
| `location_mode` | `InputMaybe<Enum_Componentnewlocation_Location_Mode>` |
| `radius` | `InputMaybe<Scalars['Long']['input']>` |

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

### ComponentNewWillingnessEntries
| Field | Type |
|-------|------|
| `agree` | `Maybe<Scalars['Boolean']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `item_idx` | `Maybe<Scalars['Int']['output']>` |
| `item_kind` | `Maybe<Enum_Componentnewwillingnessentries_Item_Kind>` |
| `note` | `Maybe<Scalars['String']['output']>` |
| `submittedAt` | `Maybe<Scalars['DateTime']['output']>` |
| `user` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `willingAmount` | `Maybe<Scalars['Float']['output']>` |
| `willingHours` | `Maybe<Scalars['Float']['output']>` |

### ComponentNewWillingnessEntriesFiltersInput
| Field | Type |
|-------|------|
| `agree` | `InputMaybe<BooleanFilterInput>` |
| `and` | `InputMaybe<Array<InputMaybe<ComponentNewWillingnessEntriesFiltersInput>>>` |
| `item_idx` | `InputMaybe<IntFilterInput>` |
| `item_kind` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentNewWillingnessEntriesFiltersInput>` |
| `note` | `InputMaybe<StringFilterInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentNewWillingnessEntriesFiltersInput>>>` |
| `submittedAt` | `InputMaybe<DateTimeFilterInput>` |
| `user` | `InputMaybe<UsersPermissionsUserFiltersInput>` |
| `willingAmount` | `InputMaybe<FloatFilterInput>` |
| `willingHours` | `InputMaybe<FloatFilterInput>` |

### ComponentNewWillingnessEntriesInput
| Field | Type |
|-------|------|
| `agree` | `InputMaybe<Scalars['Boolean']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `item_idx` | `InputMaybe<Scalars['Int']['input']>` |
| `item_kind` | `InputMaybe<Enum_Componentnewwillingnessentries_Item_Kind>` |
| `note` | `InputMaybe<Scalars['String']['input']>` |
| `submittedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `user` | `InputMaybe<Scalars['ID']['input']>` |
| `willingAmount` | `InputMaybe<Scalars['Float']['input']>` |
| `willingHours` | `InputMaybe<Scalars['Float']['input']>` |

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

### ComponentProjectsConsumedMashabetahalichDeliveries
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `mashabetahalich` | `Maybe<MashabetahalichEntityResponse>` |
| `quantity` | `Maybe<Scalars['Float']['output']>` |

### ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMashabetahalichDeliverie...` |
| `maap` | `InputMaybe<MaapFiltersInput>` |
| `mashabetahalich` | `InputMaybe<MashabetahalichFiltersInput>` |
| `not` | `InputMaybe<ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMashabetahalichDeliverie...` |
| `quantity` | `InputMaybe<FloatFilterInput>` |

### ComponentProjectsConsumedMashabetahalichDeliveriesInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `mashabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `quantity` | `InputMaybe<Scalars['Float']['input']>` |

### ComponentProjectsConsumedMissionHours
| Field | Type |
|-------|------|
| `hours` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `mesimabetahalich` | `Maybe<MesimabetahalichEntityResponse>` |

### ComponentProjectsConsumedMissionHoursFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>>>` |
| `hours` | `InputMaybe<FloatFilterInput>` |
| `mesimabetahalich` | `InputMaybe<MesimabetahalichFiltersInput>` |
| `not` | `InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>>>` |

### ComponentProjectsConsumedMissionHoursInput
| Field | Type |
|-------|------|
| `hours` | `InputMaybe<Scalars['Float']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |

### ComponentProjectsConsumedOpenMu
| Field | Type |
|-------|------|
| `id` | `Scalars['ID']['output']` |
| `open_mashaabim` | `Maybe<OpenMashaabimEntityResponse>` |
| `units` | `Maybe<Scalars['Float']['output']>` |

### ComponentProjectsConsumedOpenMuFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>>>` |
| `not` | `InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>` |
| `open_mashaabim` | `InputMaybe<OpenMashaabimFiltersInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>>>` |
| `units` | `InputMaybe<FloatFilterInput>` |

### ComponentProjectsConsumedOpenMuInput
| Field | Type |
|-------|------|
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `units` | `InputMaybe<Scalars['Float']['input']>` |

### ComponentProjectsDeliveries
| Field | Type |
|-------|------|
| `confirmedBy` | `Maybe<UsersPermissionsUserEntityResponse>` |
| `cycleIndex` | `Maybe<Scalars['Int']['output']>` |
| `deliveredAt` | `Maybe<Scalars['DateTime']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `maap` | `Maybe<MaapEntityResponse>` |
| `note` | `Maybe<Scalars['String']['output']>` |
| `quantity` | `Maybe<Scalars['Float']['output']>` |
| `sheirut_fulfillment` | `Maybe<SheirutFulfillmentEntityResponse>` |

### ComponentProjectsDeliveriesFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsDeliveriesFiltersInput>>>` |
| `confirmedBy` | `InputMaybe<UsersPermissionsUserFiltersInput>` |
| `cycleIndex` | `InputMaybe<IntFilterInput>` |
| `deliveredAt` | `InputMaybe<DateTimeFilterInput>` |
| `maap` | `InputMaybe<MaapFiltersInput>` |
| `not` | `InputMaybe<ComponentProjectsDeliveriesFiltersInput>` |
| `note` | `InputMaybe<StringFilterInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsDeliveriesFiltersInput>>>` |
| `quantity` | `InputMaybe<FloatFilterInput>` |
| `sheirut_fulfillment` | `InputMaybe<SheirutFulfillmentFiltersInput>` |

### ComponentProjectsDeliveriesInput
| Field | Type |
|-------|------|
| `confirmedBy` | `InputMaybe<Scalars['ID']['input']>` |
| `cycleIndex` | `InputMaybe<Scalars['Int']['input']>` |
| `deliveredAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `note` | `InputMaybe<Scalars['String']['input']>` |
| `quantity` | `InputMaybe<Scalars['Float']['input']>` |
| `sheirut_fulfillment` | `InputMaybe<Scalars['ID']['input']>` |

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

### ComponentProjectsNegom
| Field | Type |
|-------|------|
| `hm` | `Maybe<Scalars['Float']['output']>` |
| `id` | `Scalars['ID']['output']` |
| `kindOf` | `Maybe<Enum_Componentprojectsnegom_Kindof>` |
| `notes` | `Maybe<Scalars['String']['output']>` |
| `price` | `Maybe<Scalars['Float']['output']>` |
| `sqadualed` | `Maybe<Scalars['DateTime']['output']>` |
| `sqadualedf` | `Maybe<Scalars['DateTime']['output']>` |
| `total` | `Maybe<Scalars['Float']['output']>` |

### ComponentProjectsNegomFiltersInput
| Field | Type |
|-------|------|
| `and` | `InputMaybe<Array<InputMaybe<ComponentProjectsNegomFiltersInput>>>` |
| `hm` | `InputMaybe<FloatFilterInput>` |
| `kindOf` | `InputMaybe<StringFilterInput>` |
| `not` | `InputMaybe<ComponentProjectsNegomFiltersInput>` |
| `notes` | `InputMaybe<StringFilterInput>` |
| `or` | `InputMaybe<Array<InputMaybe<ComponentProjectsNegomFiltersInput>>>` |
| `price` | `InputMaybe<FloatFilterInput>` |
| `sqadualed` | `InputMaybe<DateTimeFilterInput>` |
| `sqadualedf` | `InputMaybe<DateTimeFilterInput>` |
| `total` | `InputMaybe<FloatFilterInput>` |

### ComponentProjectsNegomInput
| Field | Type |
|-------|------|
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `id` | `InputMaybe<Scalars['ID']['input']>` |
| `kindOf` | `InputMaybe<Enum_Componentprojectsnegom_Kindof>` |
| `notes` | `InputMaybe<Scalars['String']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualedf` | `InputMaybe<Scalars['DateTime']['input']>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |

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

## 📝 Input Types (113)

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
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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

### ApiKeyInput
| Field | Type |
|-------|------|
| `key_hash` | `InputMaybe<Scalars['String']['input']>` |
| `key_prefix` | `InputMaybe<Scalars['String']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### ArgumentInput
| Field | Type |
|-------|------|
| `arguments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `authorEmail` | `InputMaybe<Scalars['String']['input']>` |
| `authorExternalId` | `InputMaybe<Scalars['String']['input']>` |
| `authorName` | `InputMaybe<Scalars['String']['input']>` |
| `authorType` | `InputMaybe<Enum_Argument_Authortype>` |
| `body` | `InputMaybe<Scalars['String']['input']>` |
| `negotiation` | `InputMaybe<Scalars['ID']['input']>` |
| `parent` | `InputMaybe<Scalars['ID']['input']>` |
| `position` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `stance` | `InputMaybe<Enum_Argument_Stance>` |
| `voters` | `InputMaybe<Scalars['JSON']['input']>` |
| `votes` | `InputMaybe<Scalars['Int']['input']>` |

### AskInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `chat` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `isSelfProposal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `nego_mashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendingMainVote` | `InputMaybe<Scalars['Boolean']['input']>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
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
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
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
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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

### ClauseInput
| Field | Type |
|-------|------|
| `authorExternalId` | `InputMaybe<Scalars['String']['input']>` |
| `authorType` | `InputMaybe<Enum_Clause_Authortype>` |
| `body` | `InputMaybe<Scalars['String']['input']>` |
| `confirmedByAuthor` | `InputMaybe<Scalars['Boolean']['input']>` |
| `issue` | `InputMaybe<Scalars['ID']['input']>` |
| `negotiation` | `InputMaybe<Scalars['ID']['input']>` |
| `origin` | `InputMaybe<Enum_Clause_Origin>` |
| `position` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `stanceValue` | `InputMaybe<Scalars['Float']['input']>` |

### ConsentEventInput
| Field | Type |
|-------|------|
| `action` | `InputMaybe<Scalars['String']['input']>` |
| `actor` | `InputMaybe<Scalars['String']['input']>` |
| `eventId` | `InputMaybe<Scalars['String']['input']>` |
| `payload` | `InputMaybe<Scalars['JSON']['input']>` |
| `stateRoot` | `InputMaybe<Scalars['String']['input']>` |
| `subjectId` | `InputMaybe<Scalars['String']['input']>` |
| `subjectType` | `InputMaybe<Scalars['String']['input']>` |
| `ts` | `InputMaybe<Scalars['Long']['input']>` |

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
| `negotiations` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `discord` | `InputMaybe<Scalars['String']['input']>` |
| `drive` | `InputMaybe<Scalars['String']['input']>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `github` | `InputMaybe<Scalars['String']['input']>` |
| `kind` | `InputMaybe<Enum_Decision_Kind>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `moreHours` | `InputMaybe<Scalars['ID']['input']>` |
| `negodes` | `InputMaybe<Array<InputMaybe<ComponentProjectsNegodesInput>>>` |
| `negom` | `InputMaybe<Array<InputMaybe<ComponentProjectsNegomInput>>>` |
| `negos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `newFlink` | `InputMaybe<Scalars['String']['input']>` |
| `newHours` | `InputMaybe<Scalars['Int']['input']>` |
| `newWlink` | `InputMaybe<Scalars['String']['input']>` |
| `newname` | `InputMaybe<Scalars['String']['input']>` |
| `newpic` | `InputMaybe<Scalars['ID']['input']>` |
| `newprides` | `InputMaybe<Scalars['String']['input']>` |
| `newpubdes` | `InputMaybe<Scalars['String']['input']>` |
| `projects` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sale` | `InputMaybe<Scalars['ID']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `timtoM` | `InputMaybe<Scalars['String']['input']>` |
| `twitter` | `InputMaybe<Scalars['String']['input']>` |
| `valluesadd` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `valluesles` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `whatsapp` | `InputMaybe<Scalars['String']['input']>` |

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
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `users_permissions_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### FiniapruvalInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnished_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `isTimerSave` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `missname` | `InputMaybe<Scalars['String']['input']>` |
| `month` | `InputMaybe<Scalars['Date']['input']>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `timer` | `InputMaybe<Scalars['ID']['input']>` |
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
| `isNotFinished` | `InputMaybe<Scalars['Boolean']['input']>` |
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
| `askm` | `InputMaybe<Scalars['ID']['input']>` |
| `asks` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `askwant` | `InputMaybe<Scalars['ID']['input']>` |
| `decisions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `done` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finiapruvals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `forum_last_seens` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `haluka` | `InputMaybe<Scalars['ID']['input']>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `matanotpend` | `InputMaybe<Scalars['ID']['input']>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `messages` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgisha` | `InputMaybe<Scalars['ID']['input']>` |
| `pmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `ratson_proposal` | `InputMaybe<Scalars['ID']['input']>` |
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
| `adjustDirection` | `InputMaybe<Enum_Haluka_Adjustdirection>` |
| `adjustReason` | `InputMaybe<Scalars['String']['input']>` |
| `amount` | `InputMaybe<Scalars['Float']['input']>` |
| `autoApproved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `chatre` | `InputMaybe<Array<InputMaybe<ComponentProjectsChatreInput>>>` |
| `confirmed` | `InputMaybe<Scalars['Boolean']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `isSiteShare` | `InputMaybe<Scalars['Boolean']['input']>` |
| `matbea` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `proposedAmount` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson_share` | `InputMaybe<Scalars['ID']['input']>` |
| `recive_project` | `InputMaybe<Scalars['ID']['input']>` |
| `senderconf` | `InputMaybe<Scalars['Boolean']['input']>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `site_share_contribution` | `InputMaybe<Scalars['ID']['input']>` |
| `source_tosplit` | `InputMaybe<Scalars['ID']['input']>` |
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

### IssueInput
| Field | Type |
|-------|------|
| `clauses` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negotiation` | `InputMaybe<Scalars['ID']['input']>` |
| `order` | `InputMaybe<Scalars['Int']['input']>` |
| `origin` | `InputMaybe<Enum_Issue_Origin>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `title` | `InputMaybe<Scalars['String']['input']>` |

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

### MaagadInput
| Field | Type |
|-------|------|
| `canonical_desc` | `InputMaybe<Scalars['String']['input']>` |
| `categories` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `chat_forum` | `InputMaybe<Scalars['ID']['input']>` |
| `frequency` | `InputMaybe<Scalars['String']['input']>` |
| `lat` | `InputMaybe<Scalars['Float']['input']>` |
| `lng` | `InputMaybe<Scalars['Float']['input']>` |
| `members` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `offers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `origin` | `InputMaybe<Enum_Maagad_Origin>` |
| `pinecone_id` | `InputMaybe<Scalars['String']['input']>` |
| `process` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `radius` | `InputMaybe<Scalars['Long']['input']>` |
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `scope` | `InputMaybe<Enum_Maagad_Scope>` |
| `status_maagad` | `InputMaybe<Enum_Maagad_Status_Maagad>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `viability_hint` | `InputMaybe<Scalars['Int']['input']>` |

### MaagadMemberInput
| Field | Type |
|-------|------|
| `joinedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `leftAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `maagad` | `InputMaybe<Scalars['ID']['input']>` |
| `options` | `InputMaybe<Scalars['JSON']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirutpend` | `InputMaybe<Scalars['ID']['input']>` |
| `signedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `signed_offer` | `InputMaybe<Scalars['ID']['input']>` |
| `status_member` | `InputMaybe<Enum_Maagadmember_Status_Member>` |
| `user` | `InputMaybe<Scalars['ID']['input']>` |
| `visibility` | `InputMaybe<Enum_Maagadmember_Visibility>` |

### MaagadOfferInput
| Field | Type |
|-------|------|
| `cancellation_terms` | `InputMaybe<Scalars['String']['input']>` |
| `currency` | `InputMaybe<Scalars['ID']['input']>` |
| `cycle_terms` | `InputMaybe<Scalars['JSON']['input']>` |
| `description` | `InputMaybe<Scalars['String']['input']>` |
| `maagad` | `InputMaybe<Scalars['ID']['input']>` |
| `max_participants` | `InputMaybe<Scalars['Int']['input']>` |
| `min_participants` | `InputMaybe<Scalars['Int']['input']>` |
| `options` | `InputMaybe<Scalars['JSON']['input']>` |
| `price_tiers` | `InputMaybe<Scalars['JSON']['input']>` |
| `proposer_project` | `InputMaybe<Scalars['ID']['input']>` |
| `proposer_user` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `recurrence` | `InputMaybe<Enum_Maagadoffer_Recurrence>` |
| `sign_deadline` | `InputMaybe<Scalars['DateTime']['input']>` |
| `signed_count` | `InputMaybe<Scalars['Int']['input']>` |
| `signed_members` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `status_offer` | `InputMaybe<Enum_Maagadoffer_Status_Offer>` |
| `title` | `InputMaybe<Scalars['String']['input']>` |
| `unit_price` | `InputMaybe<Scalars['Float']['input']>` |

### MaapInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `cycleEnd` | `InputMaybe<Scalars['DateTime']['input']>` |
| `cycleIndex` | `InputMaybe<Scalars['Int']['input']>` |
| `cycleStart` | `InputMaybe<Scalars['DateTime']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `isAcceptanceMaap` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isSelfProposal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `mashabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `negos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quantityDelivered` | `InputMaybe<Scalars['Float']['input']>` |
| `rikmash` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirut_fulfillments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sp` | `InputMaybe<Scalars['ID']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `unit` | `InputMaybe<Enum_Maap_Unit>` |
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
| `mashabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `allowOverdelivery` | `InputMaybe<Scalars['Boolean']['input']>` |
| `currency` | `InputMaybe<Scalars['ID']['input']>` |
| `cycleSize` | `InputMaybe<Scalars['Int']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `end` | `InputMaybe<Scalars['DateTime']['input']>` |
| `finnished` | `InputMaybe<Scalars['Boolean']['input']>` |
| `forappruval` | `InputMaybe<Scalars['Boolean']['input']>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hoursassigned` | `InputMaybe<Scalars['Float']['input']>` |
| `howmanyhoursalready` | `InputMaybe<Scalars['Float']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Mashabetahalich_Kindof>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `matanot_recipe_resources` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `pricePerUnit` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quantityAssigned` | `InputMaybe<Scalars['Float']['input']>` |
| `quantityDelivered` | `InputMaybe<Scalars['Float']['input']>` |
| `recurring` | `InputMaybe<Scalars['Boolean']['input']>` |
| `reservedQuantity` | `InputMaybe<Scalars['Float']['input']>` |
| `rikmash` | `InputMaybe<Scalars['ID']['input']>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status_mashab` | `InputMaybe<Enum_Mashabetahalich_Status_Mashab>` |
| `summarizeOnClose` | `InputMaybe<Scalars['Boolean']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `unit` | `InputMaybe<Enum_Mashabetahalich_Unit>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### MatanotInput
| Field | Type |
|-------|------|
| `appruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `bakashas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `categories` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `currency` | `InputMaybe<Scalars['ID']['input']>` |
| `decision` | `InputMaybe<Scalars['ID']['input']>` |
| `desc` | `InputMaybe<Scalars['JSON']['input']>` |
| `estimatedPrice` | `InputMaybe<Scalars['Float']['input']>` |
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `fixPrice` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Matanot_Kindof>` |
| `lat` | `InputMaybe<Scalars['Float']['input']>` |
| `lng` | `InputMaybe<Scalars['Float']['input']>` |
| `location` | `InputMaybe<ComponentNewLocationInput>` |
| `marginPct` | `InputMaybe<Scalars['Float']['input']>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot_recipe_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot_recipe_resources` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanotpend` | `InputMaybe<Scalars['ID']['input']>` |
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
| `pricingMode` | `InputMaybe<Enum_Matanot_Pricingmode>` |
| `process` | `InputMaybe<Scalars['ID']['input']>` |
| `projectcreates` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `radius` | `InputMaybe<Scalars['Long']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `ratson_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sale` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sales` | `InputMaybe<Scalars['Float']['input']>` |
| `sheirut_fulfillments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `source_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status_of_voting` | `InputMaybe<Enum_Matanot_Status_Of_Voting>` |

### MatanotRecipeMissionInput
| Field | Type |
|-------|------|
| `assignedMember` | `InputMaybe<Scalars['ID']['input']>` |
| `hoursPerUnit` | `InputMaybe<Scalars['Float']['input']>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `mode` | `InputMaybe<Enum_Matanotrecipemission_Mode>` |
| `nego` | `InputMaybe<Scalars['ID']['input']>` |
| `notes` | `InputMaybe<Scalars['String']['input']>` |
| `partof` | `InputMaybe<Scalars['ID']['input']>` |
| `pendm` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratePerHour` | `InputMaybe<Scalars['Float']['input']>` |
| `unitsPerProduct` | `InputMaybe<Scalars['Float']['input']>` |

### MatanotRecipeResourceInput
| Field | Type |
|-------|------|
| `assignedMember` | `InputMaybe<Scalars['ID']['input']>` |
| `kindOf` | `InputMaybe<Enum_Matanotreciperesource_Kindof>` |
| `mashabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `mode` | `InputMaybe<Enum_Matanotreciperesource_Mode>` |
| `nego` | `InputMaybe<Scalars['ID']['input']>` |
| `notes` | `InputMaybe<Scalars['String']['input']>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `pricePerUnit` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quantityPerUnit` | `InputMaybe<Scalars['Float']['input']>` |

### MatanotpendInput
| Field | Type |
|-------|------|
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `negos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `resolvedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status_pend` | `InputMaybe<Enum_Matanotpend_Status_Pend>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### MatbeaInput
| Field | Type |
|-------|------|
| `halukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `matanot_recipe_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mission` | `InputMaybe<Scalars['ID']['input']>` |
| `monter` | `InputMaybe<Array<InputMaybe<ComponentNewMonterInput>>>` |
| `monters` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `privatlinks` | `InputMaybe<Scalars['String']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publicklinks` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `seeders` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirut_fulfillments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status` | `InputMaybe<Scalars['Int']['input']>` |
| `stname` | `InputMaybe<Scalars['String']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `timegramas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `timer` | `InputMaybe<Scalars['Float']['input']>` |
| `timers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `totalHoursSaved` | `InputMaybe<Scalars['Float']['input']>` |
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
| `embedding_id` | `InputMaybe<Scalars['String']['input']>` |
| `finnished_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `kindOf` | `InputMaybe<Enum_Mission_Kindof>` |
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
| `synonyms` | `InputMaybe<Scalars['JSON']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `usage_count` | `InputMaybe<Scalars['Int']['input']>` |
| `users_can_do` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `acceptedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `decision` | `InputMaybe<Scalars['ID']['input']>` |
| `des` | `InputMaybe<Scalars['JSON']['input']>` |
| `fixprice` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Nego_Kindof>` |
| `location` | `InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `matanotpend` | `InputMaybe<Scalars['ID']['input']>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `proposedHours` | `InputMaybe<Scalars['Float']['input']>` |
| `proposedPrice` | `InputMaybe<Scalars['Float']['input']>` |
| `proposedQuantity` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `ratson_proposal` | `InputMaybe<Scalars['ID']['input']>` |
| `recipeMission` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `recipeResource` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `rejectedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### NegoMashInput
| Field | Type |
|-------|------|
| `askm` | `InputMaybe<Scalars['ID']['input']>` |
| `cycleSize` | `InputMaybe<Scalars['Int']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `easy` | `InputMaybe<Scalars['Float']['input']>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `isOriginal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Negomash_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `location` | `InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `ordern` | `InputMaybe<Scalars['Int']['input']>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `proposedBy` | `InputMaybe<Enum_Negomash_Proposedby>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `recurring` | `InputMaybe<Scalars['Boolean']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualedf` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status` | `InputMaybe<Enum_Negomash_Status>` |
| `users` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### NegopendmissionInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `ask` | `InputMaybe<Scalars['ID']['input']>` |
| `date` | `InputMaybe<Scalars['DateTime']['input']>` |
| `dates` | `InputMaybe<Scalars['DateTime']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `filds` | `InputMaybe<ComponentNewNegoInput>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `howMany` | `InputMaybe<Scalars['Long']['input']>` |
| `isMonth` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isOriginal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isRishon` | `InputMaybe<Scalars['Boolean']['input']>` |
| `location` | `InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `ordern` | `InputMaybe<Scalars['Int']['input']>` |
| `pendm` | `InputMaybe<Scalars['ID']['input']>` |
| `perhour` | `InputMaybe<Scalars['Float']['input']>` |
| `proposedBy` | `InputMaybe<Enum_Negopendmission_Proposedby>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `status` | `InputMaybe<Enum_Negopendmission_Status>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |
| `vots` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### NegotiationInput
| Field | Type |
|-------|------|
| `arguments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `clauses` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `createdByEmail` | `InputMaybe<Scalars['String']['input']>` |
| `creator` | `InputMaybe<Scalars['ID']['input']>` |
| `cuntries` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `currentRound` | `InputMaybe<Scalars['Int']['input']>` |
| `description` | `InputMaybe<Scalars['String']['input']>` |
| `isLocal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `issues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `maxRounds` | `InputMaybe<Scalars['Int']['input']>` |
| `ownerExternalId` | `InputMaybe<Scalars['String']['input']>` |
| `participants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `positions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `resolution` | `InputMaybe<Scalars['JSON']['input']>` |
| `scaleMax` | `InputMaybe<Scalars['Int']['input']>` |
| `scaleMin` | `InputMaybe<Scalars['Int']['input']>` |
| `shareToken` | `InputMaybe<Scalars['String']['input']>` |
| `sourceId` | `InputMaybe<Scalars['String']['input']>` |
| `sourceMeta` | `InputMaybe<Scalars['JSON']['input']>` |
| `sourceType` | `InputMaybe<Scalars['String']['input']>` |
| `status` | `InputMaybe<Enum_Negotiation_Status>` |
| `topic` | `InputMaybe<Scalars['String']['input']>` |
| `visibility` | `InputMaybe<Enum_Negotiation_Visibility>` |

### OpenMashaabimInput
| Field | Type |
|-------|------|
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `askms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `cycleSize` | `InputMaybe<Scalars['Int']['input']>` |
| `declinedsps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `easy` | `InputMaybe<Scalars['Float']['input']>` |
| `extractedKey` | `InputMaybe<Scalars['String']['input']>` |
| `haamadapruvs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `haamadas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `howMeny` | `InputMaybe<Scalars['Long']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Openmashaabim_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `location` | `InputMaybe<ComponentNewLocationInput>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `nego_mashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pmash` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `ratson_proposal` | `InputMaybe<Scalars['ID']['input']>` |
| `recurring` | `InputMaybe<Scalars['Boolean']['input']>` |
| `rikmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `source` | `InputMaybe<Enum_Openmashaabim_Source>` |
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
| `extractedKey` | `InputMaybe<Scalars['String']['input']>` |
| `hatzaas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `howMeny` | `InputMaybe<Scalars['Long']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isRishon` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isglobal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isshift` | `InputMaybe<Scalars['Boolean']['input']>` |
| `location` | `InputMaybe<ComponentNewLocationInput>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `ratson_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `rishon` | `InputMaybe<Scalars['ID']['input']>` |
| `rishonves` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `skills` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `source` | `InputMaybe<Enum_Openmission_Source>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tafkidims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `usersNotRelevant` | `InputMaybe<Scalars['ID']['input']>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `work_ways` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### PartofInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `askms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `asks` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `default` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finiapruvals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `matanot_recipe_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirut_fulfillments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### PendmInput
| Field | Type |
|-------|------|
| `acts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `dates` | `InputMaybe<Scalars['DateTime']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `diun` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hearotMeyuchadot` | `InputMaybe<Scalars['String']['input']>` |
| `howMeny` | `InputMaybe<Scalars['Long']['input']>` |
| `isLast` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isglobal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iskvua` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isshift` | `InputMaybe<Scalars['Boolean']['input']>` |
| `location` | `InputMaybe<ComponentNewLocationInput>` |
| `matanot_recipe_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mission` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `nego` | `InputMaybe<Array<InputMaybe<ComponentNewNegoInput>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `noofhours` | `InputMaybe<Scalars['Float']['input']>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `askm` | `InputMaybe<Scalars['ID']['input']>` |
| `cycleSize` | `InputMaybe<Scalars['Int']['input']>` |
| `descrip` | `InputMaybe<Scalars['String']['input']>` |
| `diun` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |
| `easy` | `InputMaybe<Scalars['Float']['input']>` |
| `forums` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `isMaap` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isSelfProposal` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Pmash_Kindof>` |
| `linkto` | `InputMaybe<Scalars['String']['input']>` |
| `location` | `InputMaybe<ComponentNewLocationInput>` |
| `maap` | `InputMaybe<Scalars['ID']['input']>` |
| `mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `mashabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot_recipe_resources` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `nego_mashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negom` | `InputMaybe<Array<InputMaybe<ComponentNewNegomInput>>>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `partofs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `recurring` | `InputMaybe<Scalars['Boolean']['input']>` |
| `selfProposalUser` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirut_fulfillments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualedf` | `InputMaybe<Scalars['DateTime']['input']>` |
| `timegrama` | `InputMaybe<Scalars['ID']['input']>` |
| `users` | `InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>` |

### PositionInput
| Field | Type |
|-------|------|
| `aiMeta` | `InputMaybe<Scalars['JSON']['input']>` |
| `arguments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `author` | `InputMaybe<Scalars['ID']['input']>` |
| `authorEmail` | `InputMaybe<Scalars['String']['input']>` |
| `authorExternalId` | `InputMaybe<Scalars['String']['input']>` |
| `authorType` | `InputMaybe<Enum_Position_Authortype>` |
| `clauses` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `description` | `InputMaybe<Scalars['String']['input']>` |
| `heading` | `InputMaybe<Scalars['String']['input']>` |
| `intensity` | `InputMaybe<Scalars['Int']['input']>` |
| `isAnchor` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kind` | `InputMaybe<Enum_Position_Kind>` |
| `location` | `InputMaybe<Scalars['Float']['input']>` |
| `negotiation` | `InputMaybe<Scalars['ID']['input']>` |
| `order` | `InputMaybe<Scalars['Int']['input']>` |
| `pole` | `InputMaybe<Enum_Position_Pole>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `relativePlacement` | `InputMaybe<Scalars['JSON']['input']>` |
| `selfPlacement` | `InputMaybe<Scalars['Int']['input']>` |
| `tags` | `InputMaybe<Scalars['JSON']['input']>` |
| `voters` | `InputMaybe<Scalars['JSON']['input']>` |
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
| `halukas_recive` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `isMachzikim` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isMachzikimPublik` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isOt` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isPlatform` | `InputMaybe<Scalars['Boolean']['input']>` |
| `linkToWebsite` | `InputMaybe<Scalars['String']['input']>` |
| `location` | `InputMaybe<ComponentNewLocationInput>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `machshirs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `ratson_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `restime` | `InputMaybe<Enum_Project_Restime>` |
| `rikmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sales` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sales_source` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts_sourced` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `site_share_contributions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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

### ProviderProfileInput
| Field | Type |
|-------|------|
| `ai_meta` | `InputMaybe<Scalars['JSON']['input']>` |
| `archived` | `InputMaybe<Scalars['Boolean']['input']>` |
| `avg_rating` | `InputMaybe<Scalars['Float']['input']>` |
| `bio_raw` | `InputMaybe<Scalars['String']['input']>` |
| `display_name` | `InputMaybe<Scalars['String']['input']>` |
| `lat` | `InputMaybe<Scalars['Float']['input']>` |
| `lng` | `InputMaybe<Scalars['Float']['input']>` |
| `location` | `InputMaybe<ComponentNewLocationInput>` |
| `owner_id` | `InputMaybe<Scalars['String']['input']>` |
| `owner_type` | `InputMaybe<Enum_Providerprofile_Owner_Type>` |
| `pinecone_id` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `radius_km` | `InputMaybe<Scalars['Int']['input']>` |

### RatsonInput
| Field | Type |
|-------|------|
| `access_mode` | `InputMaybe<Enum_Ratson_Access_Mode>` |
| `age_group` | `InputMaybe<Scalars['String']['input']>` |
| `aggregation_opt_out` | `InputMaybe<Scalars['Boolean']['input']>` |
| `ai_meta` | `InputMaybe<Scalars['JSON']['input']>` |
| `allowJoin` | `InputMaybe<Scalars['Boolean']['input']>` |
| `bounti` | `InputMaybe<Scalars['Boolean']['input']>` |
| `categories` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `chat_forum` | `InputMaybe<Scalars['ID']['input']>` |
| `consensusRule` | `InputMaybe<Enum_Ratson_Consensusrule>` |
| `derivedComplexMatanot` | `InputMaybe<Scalars['ID']['input']>` |
| `desc` | `InputMaybe<Scalars['String']['input']>` |
| `extracted_missions` | `InputMaybe<Array<InputMaybe<ComponentNewExtractedMissionsInput>>>` |
| `extracted_resources` | `InputMaybe<Array<InputMaybe<ComponentNewExtractedResourcesInput>>>` |
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `frequency` | `InputMaybe<Scalars['String']['input']>` |
| `fulfilled` | `InputMaybe<Scalars['Boolean']['input']>` |
| `fulfillment_score` | `InputMaybe<Scalars['Float']['input']>` |
| `isOnline` | `InputMaybe<Scalars['Boolean']['input']>` |
| `joinDeadline` | `InputMaybe<Scalars['DateTime']['input']>` |
| `joinKind` | `InputMaybe<Enum_Ratson_Joinkind>` |
| `language` | `InputMaybe<Scalars['String']['input']>` |
| `last_matched_at` | `InputMaybe<Scalars['DateTime']['input']>` |
| `lat` | `InputMaybe<Scalars['Float']['input']>` |
| `link` | `InputMaybe<Scalars['String']['input']>` |
| `lng` | `InputMaybe<Scalars['Float']['input']>` |
| `location` | `InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>` |
| `location_hint` | `InputMaybe<Scalars['String']['input']>` |
| `lockedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `logo` | `InputMaybe<Scalars['ID']['input']>` |
| `longDes` | `InputMaybe<Scalars['String']['input']>` |
| `maagad` | `InputMaybe<Scalars['ID']['input']>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanots_offered` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `maxJoiners` | `InputMaybe<Scalars['Int']['input']>` |
| `minJoiners` | `InputMaybe<Scalars['Int']['input']>` |
| `missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `open_mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `partialConsensusFallback` | `InputMaybe<Enum_Ratson_Partialconsensusfallback>` |
| `pics` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pinecone_id` | `InputMaybe<Scalars['String']['input']>` |
| `process` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `radius` | `InputMaybe<Scalars['Long']['input']>` |
| `ratson_match_jobs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `ratson_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `ratson_shares` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `share_status` | `InputMaybe<Enum_Ratson_Share_Status>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status_ratson` | `InputMaybe<Enum_Ratson_Status_Ratson>` |
| `sub_category` | `InputMaybe<Scalars['String']['input']>` |
| `totalbounti` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `vallues` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `willingnessModel` | `InputMaybe<Enum_Ratson_Willingnessmodel>` |

### RatsonMatchJobInput
| Field | Type |
|-------|------|
| `error` | `InputMaybe<Scalars['String']['input']>` |
| `finished_at` | `InputMaybe<Scalars['DateTime']['input']>` |
| `mode` | `InputMaybe<Enum_Ratsonmatchjob_Mode>` |
| `proposals_created` | `InputMaybe<Scalars['Int']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `started_at` | `InputMaybe<Scalars['DateTime']['input']>` |

### RatsonProposalInput
| Field | Type |
|-------|------|
| `auto_generated` | `InputMaybe<Scalars['Boolean']['input']>` |
| `covered_missions` | `InputMaybe<Array<InputMaybe<ComponentNewCoveredMissionsInput>>>` |
| `covered_resources` | `InputMaybe<Array<InputMaybe<ComponentNewCoveredResourcesInput>>>` |
| `final_breakdown` | `InputMaybe<Scalars['JSON']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `kind` | `InputMaybe<Enum_Ratsonproposal_Kind>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `matbea` | `InputMaybe<Scalars['ID']['input']>` |
| `match_score` | `InputMaybe<Scalars['Float']['input']>` |
| `negos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `open_mission` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `proposer_users` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `ratson_willingness_entry` | `InputMaybe<Array<InputMaybe<ComponentNewWillingnessEntriesInput>>>` |
| `sheirutpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `status_proposal` | `InputMaybe<Enum_Ratsonproposal_Status_Proposal>` |
| `tosplits` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `total_price` | `InputMaybe<Scalars['Float']['input']>` |
| `votes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |

### RatsonShareInput
| Field | Type |
|-------|------|
| `halukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `joinedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `leftAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `matbea` | `InputMaybe<Scalars['ID']['input']>` |
| `maxContribution` | `InputMaybe<Scalars['Float']['input']>` |
| `notificationsOn` | `InputMaybe<Scalars['Boolean']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `role` | `InputMaybe<Enum_Ratsonshare_Role>` |
| `status_share` | `InputMaybe<Enum_Ratsonshare_Status_Share>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### RichtextInput
| Field | Type |
|-------|------|
| `bg` | `InputMaybe<Scalars['String']['input']>` |
| `desc` | `InputMaybe<Scalars['JSON']['input']>` |

### RikmashInput
| Field | Type |
|-------|------|
| `agprice` | `InputMaybe<Scalars['Float']['input']>` |
| `cyclesCount` | `InputMaybe<Scalars['Int']['input']>` |
| `deliveries` | `InputMaybe<Array<InputMaybe<ComponentProjectsDeliveriesInput>>>` |
| `firstDeliveryAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `haamadas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `hm` | `InputMaybe<Scalars['Float']['input']>` |
| `isMust` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isYesod` | `InputMaybe<Scalars['Boolean']['input']>` |
| `kindOf` | `InputMaybe<Enum_Rikmash_Kindof>` |
| `lastDeliveryAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `maaps` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `name` | `InputMaybe<Scalars['String']['input']>` |
| `open_mashaabim` | `InputMaybe<Scalars['ID']['input']>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quantityDelivered` | `InputMaybe<Scalars['Float']['input']>` |
| `sp` | `InputMaybe<Scalars['ID']['input']>` |
| `spnot` | `InputMaybe<Scalars['String']['input']>` |
| `sqadualed` | `InputMaybe<Scalars['DateTime']['input']>` |
| `sqadualef` | `InputMaybe<Scalars['DateTime']['input']>` |
| `summary` | `InputMaybe<Scalars['String']['input']>` |
| `total` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### SaleInput
| Field | Type |
|-------|------|
| `confirmedBy` | `InputMaybe<Enum_Sale_Confirmedby>` |
| `date` | `InputMaybe<Scalars['DateTime']['input']>` |
| `decision` | `InputMaybe<Scalars['ID']['input']>` |
| `finishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `holderDecidedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `holderStatus` | `InputMaybe<Enum_Sale_Holderstatus>` |
| `in` | `InputMaybe<Scalars['Float']['input']>` |
| `isMonterActive` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isSiteShareIncome` | `InputMaybe<Scalars['Boolean']['input']>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `monters` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `note` | `InputMaybe<Scalars['String']['input']>` |
| `pending` | `InputMaybe<Scalars['Boolean']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `reporter` | `InputMaybe<Scalars['ID']['input']>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `source_project` | `InputMaybe<Scalars['ID']['input']>` |
| `splited` | `InputMaybe<Scalars['Boolean']['input']>` |
| `startDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `tosplits` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `unit` | `InputMaybe<Scalars['Float']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

### SealedEnvelopeInput
| Field | Type |
|-------|------|
| `envelopeId` | `InputMaybe<Scalars['String']['input']>` |
| `payload` | `InputMaybe<Scalars['JSON']['input']>` |
| `spaceId` | `InputMaybe<Scalars['String']['input']>` |
| `ts` | `InputMaybe<Scalars['Long']['input']>` |

### SeederInput
| Field | Type |
|-------|------|
| `finnish` | `InputMaybe<Scalars['DateTime']['input']>` |
| `mesimabetahalich` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `start` | `InputMaybe<Scalars['DateTime']['input']>` |

### SheirutFulfillmentInput
| Field | Type |
|-------|------|
| `agreedPrice` | `InputMaybe<Scalars['Float']['input']>` |
| `cmdm` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMashabetahalichDeliverie...` |
| `consumedMissionHours` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMissionHoursInput>>>` |
| `consumedOpenMU` | `InputMaybe<Array<InputMaybe<ComponentProjectsConsumedOpenMuInput>>>` |
| `createdMaaps` | `InputMaybe<Scalars['ID']['input']>` |
| `createdMissions` | `InputMaybe<Scalars['ID']['input']>` |
| `createdPmashes` | `InputMaybe<Scalars['ID']['input']>` |
| `matanot` | `InputMaybe<Scalars['ID']['input']>` |
| `process` | `InputMaybe<Scalars['ID']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `quantity` | `InputMaybe<Scalars['Float']['input']>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `status_process` | `InputMaybe<Enum_Sheirutfulfillment_Status_Process>` |

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
| `halukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `iCanGetMonay` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `iGotIt` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iGotMoney` | `InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyInput>>>` |
| `iTransferMoney` | `InputMaybe<Scalars['Boolean']['input']>` |
| `iTransferedTo` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `isApruved` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isItOnlyOneInProject` | `InputMaybe<Scalars['Boolean']['input']>` |
| `isSiteShareIncome` | `InputMaybe<Scalars['Boolean']['input']>` |
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
| `sheirut_fulfillments` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutpend` | `InputMaybe<Scalars['ID']['input']>` |
| `site_share_contributions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `source_project` | `InputMaybe<Scalars['ID']['input']>` |
| `source_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `source_tosplit` | `InputMaybe<Scalars['ID']['input']>` |
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
| `conditional` | `InputMaybe<Scalars['Boolean']['input']>` |
| `finnishDate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `forum` | `InputMaybe<Scalars['ID']['input']>` |
| `maagad_offer` | `InputMaybe<Scalars['ID']['input']>` |
| `matanots` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `price` | `InputMaybe<Scalars['Float']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `quant` | `InputMaybe<Scalars['Float']['input']>` |
| `ratson_proposal` | `InputMaybe<Scalars['ID']['input']>` |
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

### SiteReportInput
| Field | Type |
|-------|------|
| `description` | `InputMaybe<Scalars['String']['input']>` |
| `lang` | `InputMaybe<Scalars['String']['input']>` |
| `page` | `InputMaybe<Scalars['String']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `status` | `InputMaybe<Enum_Sitereport_Status>` |
| `type` | `InputMaybe<Enum_Sitereport_Type>` |
| `userEmail` | `InputMaybe<Scalars['String']['input']>` |
| `userId` | `InputMaybe<Scalars['String']['input']>` |
| `userName` | `InputMaybe<Scalars['String']['input']>` |

### SiteShareContributionInput
| Field | Type |
|-------|------|
| `amount` | `InputMaybe<Scalars['Float']['input']>` |
| `basisAmount` | `InputMaybe<Scalars['Float']['input']>` |
| `des_status` | `InputMaybe<Enum_Sitesharecontribution_Des_Status>` |
| `direction` | `InputMaybe<Enum_Sitesharecontribution_Direction>` |
| `haluka` | `InputMaybe<Scalars['ID']['input']>` |
| `matbea` | `InputMaybe<Scalars['ID']['input']>` |
| `project` | `InputMaybe<Scalars['ID']['input']>` |
| `proposedAmount` | `InputMaybe<Scalars['Float']['input']>` |
| `publishedAt` | `InputMaybe<Scalars['DateTime']['input']>` |
| `reason` | `InputMaybe<Scalars['String']['input']>` |
| `recive_project` | `InputMaybe<Scalars['ID']['input']>` |
| `sheirut` | `InputMaybe<Scalars['ID']['input']>` |
| `tosplit` | `InputMaybe<Scalars['ID']['input']>` |
| `users_permissions_user` | `InputMaybe<Scalars['ID']['input']>` |

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
| `location` | `InputMaybe<ComponentNewLocationInput>` |
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
| `matanotpend` | `InputMaybe<Scalars['ID']['input']>` |
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
| `finiapruvals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `ratson_proposal` | `InputMaybe<Scalars['ID']['input']>` |
| `sales` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `siteShareHalukas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `site_share_contributions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `split_origin` | `InputMaybe<Enum_Tosplit_Split_Origin>` |
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

### UserKeyInput
| Field | Type |
|-------|------|
| `addedAt` | `InputMaybe<Scalars['Long']['input']>` |
| `algo` | `InputMaybe<Scalars['String']['input']>` |
| `devicePubB64` | `InputMaybe<Scalars['String']['input']>` |
| `label` | `InputMaybe<Scalars['String']['input']>` |
| `payload` | `InputMaybe<Scalars['JSON']['input']>` |
| `revokedAt` | `InputMaybe<Scalars['Long']['input']>` |
| `userId` | `InputMaybe<Scalars['String']['input']>` |

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
| `api_keys` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `arr1` | `InputMaybe<Scalars['JSON']['input']>` |
| `arrdate` | `InputMaybe<Scalars['DateTime']['input']>` |
| `askeds` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `askms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `asks` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `askwants` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `auto_created_via` | `InputMaybe<Enum_Userspermissionsuser_Auto_Created_Via>` |
| `availability_pref` | `InputMaybe<Scalars['JSON']['input']>` |
| `bio` | `InputMaybe<Scalars['String']['input']>` |
| `blocked` | `InputMaybe<Scalars['Boolean']['input']>` |
| `chezin` | `InputMaybe<Scalars['ID']['input']>` |
| `city` | `InputMaybe<Scalars['String']['input']>` |
| `confirmationToken` | `InputMaybe<Scalars['String']['input']>` |
| `confirmed` | `InputMaybe<Scalars['Boolean']['input']>` |
| `cuntries` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `cv_extracted_at` | `InputMaybe<Scalars['DateTime']['input']>` |
| `cv_extraction` | `InputMaybe<Scalars['JSON']['input']>` |
| `cv_url` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `lat` | `InputMaybe<Scalars['Float']['input']>` |
| `levManualAlready` | `InputMaybe<Scalars['Boolean']['input']>` |
| `lng` | `InputMaybe<Scalars['Float']['input']>` |
| `location` | `InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>` |
| `machshirs` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashaabims` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mashabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot_recipe_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `matanot_recipe_resources` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `mesimabetahaliches` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `messages` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `missions_i_can_do` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `moachManualAlready` | `InputMaybe<Scalars['Boolean']['input']>` |
| `nego_mashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negopendmissions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negotiations` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `negotiationsIparticipante` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `noMail` | `InputMaybe<Scalars['Boolean']['input']>` |
| `noMoachGuide` | `InputMaybe<Scalars['Boolean']['input']>` |
| `noOfHoursProject1` | `InputMaybe<Scalars['Float']['input']>` |
| `onboarding_status` | `InputMaybe<Enum_Userspermissionsuser_Onboarding_Status>` |
| `onboarding_track` | `InputMaybe<Enum_Userspermissionsuser_Onboarding_Track>` |
| `open_missions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `password` | `InputMaybe<Scalars['String']['input']>` |
| `pendms` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pendmsforme` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishas` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishasPendStrat` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishauserpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pgishausers` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `pmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `positionsAuthor` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `preferCards` | `InputMaybe<Scalars['Boolean']['input']>` |
| `pricing_pref` | `InputMaybe<Scalars['JSON']['input']>` |
| `profilManualAlready` | `InputMaybe<Scalars['Boolean']['input']>` |
| `profilePic` | `InputMaybe<Scalars['ID']['input']>` |
| `projects_1s` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `provider` | `InputMaybe<Scalars['String']['input']>` |
| `radius` | `InputMaybe<Scalars['Long']['input']>` |
| `ratson_proposals` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `ratson_shares` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `ratsons` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `resetPasswordToken` | `InputMaybe<Scalars['String']['input']>` |
| `rikmashes` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `rishonvesopen` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `role` | `InputMaybe<Scalars['ID']['input']>` |
| `sales` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sales_reported` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutnegos` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheirutpends` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `sheiruts_iCanGetMonay` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
| `shekelsPerHoureProject1` | `InputMaybe<Scalars['Float']['input']>` |
| `site_share_contributions` | `InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>` |
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
| `item_idx` | `InputMaybe<Scalars['Int']['input']>` |
| `item_kind` | `InputMaybe<Enum_Vote_Item_Kind>` |
| `matanotpend` | `InputMaybe<Scalars['ID']['input']>` |
| `nego` | `InputMaybe<Scalars['ID']['input']>` |
| `ok` | `InputMaybe<Scalars['Boolean']['input']>` |
| `order` | `InputMaybe<Scalars['Int']['input']>` |
| `ratson` | `InputMaybe<Scalars['ID']['input']>` |
| `ratson_proposal` | `InputMaybe<Scalars['ID']['input']>` |
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

## 🔍 Filter Input Types (102)

Used for querying/filtering content. Each content type has a corresponding filter input.

<details>
<summary>Click to expand all 102 filter types</summary>

#### ActFiltersInput
Fields: `and`, `createdAt`, `dateF`, `dateS`, `des`, `forums`, `hashivut`, `id`, `isAssigned`, `link`, `locale`, `localizations`, `mesimabetahaliches`, `my`, `myIshur`, `naasa`, `negopendmissions`, `not`, `open_mission`, `or`, `partofs`, `pendm`, `project`, `publishedAt`, `shem`, `status`, `tafkidims`, `taskdis`, `timegrama`, `timers`, `updatedAt`, `userAndIshur`, `vali`, `valiIshur`

#### ActtFiltersInput
Fields: `and`, `createdAt`, `id`, `link`, `name`, `not`, `or`, `publishedAt`, `timegrama`, `updatedAt`

#### ApiKeyFiltersInput
Fields: `and`, `createdAt`, `id`, `key_hash`, `key_prefix`, `name`, `not`, `or`, `updatedAt`, `users_permissions_user`

#### ArgumentFiltersInput
Fields: `and`, `arguments`, `authorEmail`, `authorExternalId`, `authorName`, `authorType`, `body`, `createdAt`, `id`, `negotiation`, `not`, `or`, `parent`, `position`, `publishedAt`, `stance`, `updatedAt`, `voters`, `votes`

#### AskFiltersInput
Fields: `and`, `archived`, `chat`, `createdAt`, `forums`, `id`, `negopendmissions`, `not`, `open_mission`, `or`, `partofs`, `project`, `publishedAt`, `timegrama`, `updatedAt`, `users_permissions_user`, `vots`

#### AskmFiltersInput
Fields: `and`, `archived`, `chat`, `createdAt`, `forum`, `id`, `isSelfProposal`, `nego_mashes`, `not`, `open_mashaabim`, `or`, `partofs`, `pendingMainVote`, `pmash`, `project`, `publishedAt`, `sp`, `timegrama`, `updatedAt`, `users_permissions_user`, `vots`

#### AskwantFiltersInput
Fields: `and`, `archived`, `chat`, `createdAt`, `forum`, `id`, `not`, `or`, `project`, `sheirut`, `timegrama`, `updatedAt`, `users_permissions_user`, `vots`

#### BakashaFiltersInput
Fields: `and`, `createdAt`, `furfiled`, `id`, `mashaabim`, `matanot`, `name`, `not`, `or`, `publishedAt`, `updatedAt`

#### CategoryFiltersInput
Fields: `and`, `createdAt`, `id`, `locale`, `localizations`, `matanots`, `name`, `not`, `or`, `publishedAt`, `ratsons`, `sheiruts`, `updatedAt`

#### ChezinFiltersInput
Fields: `and`, `countries`, `createdAt`, `deffinitions`, `email`, `fullAgreement`, `id`, `locale`, `localizations`, `myQuotes`, `name`, `noOpHours`, `not`, `or`, `phoneNumber`, `publishedAt`, `shekelsPerHoure`, `updatedAt`, `users_permissions_user`

#### ClauseFiltersInput
Fields: `and`, `authorExternalId`, `authorType`, `body`, `confirmedByAuthor`, `createdAt`, `id`, `issue`, `negotiation`, `not`, `or`, `origin`, `position`, `publishedAt`, `stanceValue`, `updatedAt`

#### ConsentEventFiltersInput
Fields: `action`, `actor`, `and`, `createdAt`, `eventId`, `id`, `not`, `or`, `payload`, `stateRoot`, `subjectId`, `subjectType`, `ts`, `updatedAt`

#### ContentReleasesReleaseActionFiltersInput
Fields: `and`, `contentType`, `createdAt`, `id`, `locale`, `not`, `or`, `release`, `type`, `updatedAt`

#### ContentReleasesReleaseFiltersInput
Fields: `actions`, `and`, `createdAt`, `id`, `name`, `not`, `or`, `releasedAt`, `updatedAt`

#### ConventionTextFiltersInput
Fields: `and`, `conventionText`, `createdAt`, `id`, `locale`, `localizations`, `not`, `or`, `publishedAt`, `type`, `updatedAt`

#### CuntryFiltersInput
Fields: `alpha2`, `alpha3`, `and`, `createdAt`, `deffinitions`, `free_people`, `id`, `locale`, `localizations`, `name`, `negotiations`, `not`, `or`, `projects`, `publishedAt`, `signingNumber`, `updatedAt`, `users`

#### DeaFiltersInput
Fields: `and`, `createdAt`, `desc`, `head`, `id`, `not`, `or`, `publishedAt`, `solutions`, `updatedAt`, `votes`

#### DealFiltersInput
Fields: `and`, `costumers`, `createdAt`, `id`, `not`, `or`, `publishedAt`, `salers`, `updatedAt`

#### DecisionFiltersInput
Fields: `and`, `archived`, `createdAt`, `decisionName`, `discord`, `drive`, `forums`, `github`, `id`, `kind`, `matanot`, `moreHours`, `negodes`, `negom`, `negos`, `newFlink`, `newHours`, `newWlink`, `newname`, `newprides`, `newpubdes`, `not`, `or`, `projects`, `publishedAt`, `sale`, `timegrama`, `timtoM`, `twitter`, `updatedAt`, `valluesadd`, `valluesles`, `votes`, `vots`, `whatsapp`

#### DeffinitionFiltersInput
Fields: `and`, `countries`, `createdAt`, `deffinitionName`, `free_people`, `id`, `locale`, `localizations`, `not`, `or`, `projects`, `publishedAt`, `updatedAt`

#### FiltertagFiltersInput
Fields: `and`, `createdAt`, `id`, `locale`, `localizations`, `name`, `not`, `or`, `publishedAt`, `updatedAt`, `users_permissions_users`

#### FiniapruvalFiltersInput
Fields: `and`, `archived`, `createdAt`, `finnished_mission`, `forum`, `id`, `isTimerSave`, `iskvua`, `mesimabetahalich`, `missname`, `month`, `noofhours`, `not`, `or`, `partofs`, `project`, `publishedAt`, `timegrama`, `timer`, `updatedAt`, `users_permissions_user`, `vots`, `why`

#### FinnishedMissionFiltersInput
Fields: `and`, `createdAt`, `descrip`, `finiapruvals`, `finish`, `hearotMeyuchadot`, `id`, `idYesod`, `isFinished`, `isMust`, `isNotFinished`, `isglobal`, `iskvua`, `locale`, `localizations`, `mesimabetahalich`, `mission`, `missionName`, `month`, `noofhours`, `not`, `or`, `perhour`, `project`, `publishedAt`, `start`, `tafkidims`, `total`, `updatedAt`, `users_permissions_user`, `why`

#### ForumFiltersInput
Fields: `acts`, `and`, `askm`, `asks`, `askwant`, `createdAt`, `decisions`, `done`, `finiapruvals`, `forum_last_seens`, `haluka`, `id`, `maaps`, `mashabetahalich`, `matanotpend`, `mesimabetahaliches`, `messages`, `not`, `or`, `partofs`, `pendms`, `pgisha`, `pmashes`, `project`, `publishedAt`, `ratson`, `ratson_proposal`, `sheirutpend`, `sheiruts`, `spec`, `subject`, `updatedAt`

#### ForumLastSeenFiltersInput
Fields: `and`, `archived`, `createdAt`, `forum`, `id`, `lastReadAt`, `not`, `or`, `updatedAt`, `users_permissions_user`

#### HaamadaFiltersInput
Fields: `amount`, `and`, `comition`, `createdAt`, `haamadapruv`, `id`, `isReturned`, `not`, `open_mashaabims`, `or`, `project`, `publishedAt`, `rikmashes`, `updatedAt`, `users_permissions_user`

#### HaamadapruvFiltersInput
Fields: `and`, `archived`, `createdAt`, `haamada`, `id`, `not`, `open_mashaabim`, `or`, `project`, `publishedAt`, `updatedAt`, `vots`

#### HalukaFiltersInput
Fields: `adjustDirection`, `adjustReason`, `amount`, `and`, `autoApproved`, `chatre`, `confirmed`, `createdAt`, `forum`, `id`, `isSiteShare`, `locale`, `localizations`, `matbea`, `not`, `or`, `project`, `proposedAmount`, `publishedAt`, `ratson_share`, `recive_project`, `senderconf`, `sheirut`, `site_share_contribution`, `source_tosplit`, `tosplit`, `updatedAt`, `userrecive`, `usersend`, `ushar`, `want`

#### HatzaaFiltersInput
Fields: `and`, `createdAt`, `id`, `noofhours`, `not`, `open_mission`, `or`, `perhoure`, `publishedAt`, `untilwhen`, `updatedAt`, `users_permissions_user`, `vots`

#### HazbaahFiltersInput
Fields: `and`, `approved`, `createdAt`, `id`, `not`, `or`, `publishedAt`, `updatedAt`, `votes`

#### I18NLocaleFiltersInput
Fields: `and`, `code`, `createdAt`, `id`, `name`, `not`, `or`, `updatedAt`

#### IssueFiltersInput
Fields: `and`, `clauses`, `createdAt`, `id`, `negotiation`, `not`, `or`, `order`, `origin`, `publishedAt`, `title`, `updatedAt`

#### MaagadFiltersInput
Fields: `and`, `canonical_desc`, `categories`, `chat_forum`, `createdAt`, `frequency`, `id`, `lat`, `lng`, `members`, `name`, `not`, `offers`, `or`, `origin`, `pinecone_id`, `process`, `publishedAt`, `radius`, `ratsons`, `scope`, `status_maagad`, `updatedAt`, `vallues`, `viability_hint`

#### MaagadMemberFiltersInput
Fields: `and`, `createdAt`, `id`, `joinedAt`, `leftAt`, `maagad`, `not`, `options`, `or`, `publishedAt`, `ratson`, `sheirutpend`, `signedAt`, `signed_offer`, `status_member`, `updatedAt`, `user`, `visibility`

#### MaagadOfferFiltersInput
Fields: `and`, `cancellation_terms`, `createdAt`, `currency`, `cycle_terms`, `description`, `id`, `maagad`, `max_participants`, `min_participants`, `not`, `options`, `or`, `price_tiers`, `proposer_project`, `proposer_user`, `publishedAt`, `recurrence`, `sign_deadline`, `signed_count`, `signed_members`, `status_offer`, `title`, `unit_price`, `updatedAt`

#### MaapFiltersInput
Fields: `and`, `archived`, `createdAt`, `cycleEnd`, `cycleIndex`, `cycleStart`, `forum`, `id`, `isAcceptanceMaap`, `isSelfProposal`, `locale`, `localizations`, `mashabetahalich`, `name`, `negos`, `not`, `open_mashaabim`, `or`, `partofs`, `pmash`, `project`, `publishedAt`, `quantityDelivered`, `rikmash`, `sheirut_fulfillments`, `sp`, `timegrama`, `unit`, `updatedAt`, `vots`

#### MachshirFiltersInput
Fields: `and`, `archived`, `createdAt`, `id`, `jsoni`, `not`, `or`, `projects`, `publishedAt`, `updatedAt`, `users_permissions_user`

#### MashaabimFiltersInput
Fields: `and`, `bakashas`, `createdAt`, `descrip`, `id`, `kindOf`, `linkto`, `locale`, `localizations`, `mashabetahaliches`, `matanots`, `name`, `negos`, `not`, `open_mashaabims`, `or`, `pmashes`, `price`, `projects`, `publishedAt`, `ratsons`, `sps`, `updatedAt`, `users_permissions_users`

#### MashabetahalichFiltersInput
Fields: `allowOverdelivery`, `and`, `createdAt`, `currency`, `cycleSize`, `descrip`, `end`, `finnished`, `forappruval`, `forums`, `hoursassigned`, `howmanyhoursalready`, `id`, `isMust`, `isYesod`, `kindOf`, `maaps`, `mashaabim`, `matanot_recipe_resources`, `name`, `not`, `or`, `partofs`, `perhour`, `pmash`, `pricePerUnit`, `project`, `publishedAt`, `quantityAssigned`, `quantityDelivered`, `recurring`, `reservedQuantity`, `rikmash`, `start`, `status_mashab`, `summarizeOnClose`, `timers`, `unit`, `updatedAt`, `users_permissions_user`

#### MatanotFiltersInput
Fields: `and`, `appruved`, `archived`, `bakashas`, `categories`, `createdAt`, `currency`, `decision`, `desc`, `estimatedPrice`, `finnishDate`, `fixPrice`, `id`, `kindOf`, `lat`, `lng`, `locale`, `localizations`, `location`, `marginPct`, `mashaabims`, `matanot_recipe_missions`, `matanot_recipe_resources`, `matanotpend`, `maxsaleyearone`, `maxsaleyearsec`, `minsaleyearone`, `minsaleyearsec`, `missions`, `name`, `negos`, `not`, `oneForeProject`, `or`, `partofs`, `price`, `pricingMode`, `process`, `projectcreates`, `publishedAt`, `quant`, `radius`, `ratson`, `ratson_proposals`, `ratsons`, `sale`, `sales`, `sheirut_fulfillments`, `sheirutpends`, `sheiruts`, `source_proposals`, `startDate`, `status_of_voting`, `updatedAt`

#### MatanotRecipeMissionFiltersInput
Fields: `and`, `assignedMember`, `createdAt`, `hoursPerUnit`, `id`, `matanot`, `mesimabetahalich`, `mode`, `nego`, `not`, `notes`, `or`, `partof`, `pendm`, `publishedAt`, `ratePerHour`, `unitsPerProduct`, `updatedAt`

#### MatanotRecipeResourceFiltersInput
Fields: `and`, `assignedMember`, `createdAt`, `id`, `kindOf`, `mashabetahalich`, `matanot`, `mode`, `nego`, `not`, `notes`, `or`, `pmash`, `pricePerUnit`, `publishedAt`, `quantityPerUnit`, `updatedAt`

#### MatanotpendFiltersInput
Fields: `and`, `createdAt`, `forums`, `id`, `matanot`, `negos`, `not`, `or`, `publishedAt`, `resolvedAt`, `status_pend`, `timegrama`, `updatedAt`, `votes`

#### MatbeaFiltersInput
Fields: `and`, `createdAt`, `halukas`, `id`, `locale`, `localizations`, `mashabetahaliches`, `matanots`, `name`, `not`, `or`, `publishedAt`, `ratson_proposals`, `simbol`, `updatedAt`

#### MesimabetahalichFiltersInput
Fields: `activeTimer`, `acts`, `admaticedai`, `and`, `createdAt`, `dates`, `decisions`, `descrip`, `finiapruvals`, `finnished`, `finnished_missions`, `forappruval`, `forums`, `hearotMeyuchadot`, `hoursassinged`, `howmanyhoursalready`, `id`, `isMust`, `isYesod`, `isglobal`, `iskvua`, `matanot_recipe_missions`, `mission`, `monter`, `monters`, `name`, `not`, `open_missions`, `or`, `partofs`, `perhour`, `privatlinks`, `project`, `publicklinks`, `publishedAt`, `seeders`, `sheirut_fulfillments`, `start`, `status`, `stname`, `tafkidims`, `timegramas`, `timer`, `timers`, `totalHoursSaved`, `updatedAt`, `users_permissions_user`, `zohars`

#### MessageFiltersInput
Fields: `and`, `archived`, `content`, `createdAt`, `editHistory`, `fid`, `forum`, `id`, `not`, `or`, `publishedAt`, `raplyTo`, `replys`, `seen`, `updatedAt`, `users_permissions_user`, `when`

#### MissionFiltersInput
Fields: `and`, `createdAt`, `descrip`, `embedding_id`, `finnished_missions`, `id`, `kindOf`, `locale`, `localizations`, `matanots`, `mesimabetahaliches`, `missionName`, `negos`, `not`, `open_missions`, `or`, `pendms`, `projects`, `publishedAt`, `ratsons`, `skills`, `synonyms`, `tafkidims`, `updatedAt`, `usage_count`, `users_can_do`, `work_ways`

#### ModeFiltersInput
Fields: `and`, `createdAt`, `id`, `name`, `not`, `or`, `publishedAt`, `sps`, `updatedAt`, `yat`

#### MonterFiltersInput
Fields: `and`, `ani`, `archived`, `createdAt`, `done`, `finish`, `id`, `mesimabetahalich`, `not`, `or`, `sale`, `sheirut`, `start`, `updatedAt`, `want`

#### NegoFiltersInput
Fields: `acceptedAt`, `and`, `createdAt`, `decision`, `des`, `fixprice`, `id`, `kindOf`, `location`, `maap`, `mashaabims`, `matanot`, `matanotpend`, `missions`, `name`, `not`, `or`, `price`, `proposedHours`, `proposedPrice`, `proposedQuantity`, `publishedAt`, `quant`, `ratson_proposal`, `recipeMission`, `recipeResource`, `rejectedAt`, `updatedAt`, `votes`

#### NegoMashFiltersInput
Fields: `and`, `askm`, `createdAt`, `cycleSize`, `descrip`, `easy`, `hm`, `id`, `isOriginal`, `kindOf`, `linkto`, `location`, `name`, `not`, `open_mashaabim`, `or`, `ordern`, `pmash`, `price`, `proposedBy`, `publishedAt`, `recurring`, `spnot`, `sqadualed`, `sqadualedf`, `status`, `updatedAt`, `users`, `users_permissions_user`

#### NegopendmissionFiltersInput
Fields: `acts`, `and`, `ask`, `createdAt`, `date`, `dates`, `descrip`, `filds`, `hearotMeyuchadot`, `howMany`, `id`, `isMonth`, `isOriginal`, `isRishon`, `location`, `name`, `noofhours`, `not`, `open_mission`, `or`, `ordern`, `pendm`, `perhour`, `proposedBy`, `publishedAt`, `skills`, `status`, `tafkidims`, `total`, `updatedAt`, `users_permissions_user`, `vots`, `work_ways`

#### NegotiationFiltersInput
Fields: `and`, `arguments`, `clauses`, `createdAt`, `createdByEmail`, `creator`, `cuntries`, `currentRound`, `description`, `id`, `isLocal`, `issues`, `maxRounds`, `not`, `or`, `ownerExternalId`, `participants`, `positions`, `publishedAt`, `resolution`, `scaleMax`, `scaleMin`, `shareToken`, `sourceId`, `sourceMeta`, `sourceType`, `status`, `topic`, `updatedAt`, `visibility`

#### OpenMashaabimFiltersInput
Fields: `and`, `archived`, `askms`, `createdAt`, `cycleSize`, `declinedsps`, `descrip`, `easy`, `extractedKey`, `haamadapruvs`, `haamadas`, `hm`, `howMeny`, `id`, `isMust`, `isYesod`, `kindOf`, `linkto`, `locale`, `localizations`, `location`, `maap`, `mashaabim`, `name`, `nego_mashes`, `not`, `or`, `partofs`, `pmash`, `price`, `project`, `publishedAt`, `ratson`, `ratson_proposal`, `recurring`, `rikmashes`, `source`, `splited`, `spnot`, `sps`, `sqadualed`, `sqadualedf`, `updatedAt`, `users`

#### OpenMissionFiltersInput
Fields: `acts`, `and`, `archived`, `asks`, `createdAt`, `dates`, `declined`, `descrip`, `extractedKey`, `hatzaas`, `hearotMeyuchadot`, `howMeny`, `id`, `isMust`, `isRishon`, `isYesod`, `isglobal`, `iskvua`, `isshift`, `locale`, `localizations`, `location`, `mesimabetahaliches`, `mission`, `name`, `negopendmissions`, `noofhours`, `not`, `or`, `partofs`, `pendm`, `perhour`, `privatlinks`, `project`, `publicklinks`, `publishedAt`, `ratson`, `ratson_proposals`, `rishon`, `rishonves`, `skills`, `source`, `sqadualed`, `tafkidims`, `updatedAt`, `users`, `usersNotRelevant`, `vallues`, `work_ways`

#### PartofFiltersInput
Fields: `acts`, `and`, `askms`, `asks`, `createdAt`, `default`, `finiapruvals`, `forums`, `id`, `maaps`, `mashabetahaliches`, `matanot`, `matanot_recipe_missions`, `matanots`, `mesimabetahaliches`, `not`, `open_mashaabims`, `open_missions`, `or`, `pendms`, `pmashes`, `ratson`, `sheirut_fulfillments`, `updatedAt`

#### PendmFiltersInput
Fields: `acts`, `and`, `archived`, `createdAt`, `dates`, `descrip`, `diun`, `forums`, `hearotMeyuchadot`, `howMeny`, `id`, `isLast`, `isMust`, `isYesod`, `isglobal`, `iskvua`, `isshift`, `location`, `matanot_recipe_missions`, `mission`, `name`, `nego`, `negopendmissions`, `noofhours`, `not`, `open_mission`, `or`, `partofs`, `perhour`, `privatlinks`, `project`, `publicklinks`, `publishedAt`, `rishon`, `rishonves`, `skills`, `sqadualed`, `tafkidims`, `timegrama`, `updatedAt`, `users`, `vallues`, `work_ways`

#### PgishaFiltersInput
Fields: `and`, `archived`, `available`, `createdAt`, `desc`, `forum`, `id`, `isLive`, `locale`, `localizations`, `meeting`, `meetingStartedAt`, `name`, `not`, `or`, `pendingStart`, `pgishauserpends`, `pgishausers`, `publishedAt`, `set`, `startRequestedAt`, `startRequestedBy`, `startedBy`, `updatedAt`, `videoLink`

#### PgishauserFiltersInput
Fields: `and`, `available`, `createdAt`, `id`, `not`, `or`, `pgishas`, `publishedAt`, `readyForStart`, `uid`, `updatedAt`, `users_permissions_user`

#### PgishauserpendFiltersInput
Fields: `and`, `approved`, `archived`, `createdAt`, `id`, `not`, `or`, `pgisha`, `updatedAt`, `users_permissions_user`

#### PmashFiltersInput
Fields: `and`, `archived`, `askm`, `createdAt`, `cycleSize`, `descrip`, `diun`, `easy`, `forums`, `hm`, `id`, `isMaap`, `isMust`, `isSelfProposal`, `isYesod`, `kindOf`, `linkto`, `location`, `maap`, `mashaabim`, `mashabetahaliches`, `matanot_recipe_resources`, `name`, `nego_mashes`, `negom`, `not`, `open_mashaabim`, `or`, `partofs`, `price`, `project`, `publishedAt`, `recurring`, `selfProposalUser`, `sheirut_fulfillments`, `spnot`, `sqadualed`, `sqadualedf`, `timegrama`, `updatedAt`, `users`

#### PositionFiltersInput
Fields: `aiMeta`, `and`, `arguments`, `author`, `authorEmail`, `authorExternalId`, `authorType`, `clauses`, `createdAt`, `description`, `heading`, `id`, `intensity`, `isAnchor`, `kind`, `location`, `negotiation`, `not`, `or`, `order`, `pole`, `publishedAt`, `relativePlacement`, `selfPlacement`, `tags`, `updatedAt`, `voters`, `votes`

#### ProjectFiltersInput
Fields: `acts`, `addHoursManualy`, `and`, `askms`, `asks`, `askwants`, `city`, `countries`, `createdAt`, `deals`, `decisions`, `deffinitions`, `descripFor`, `discordlink`, `drivelink`, `fblink`, `finiapruvals`, `finnishedM72HForDecline`, `finnishedMAllApruve`, `finnished_missions`, `forums`, `githublink`, `haamadapruvs`, `haamadas`, `halukas`, `halukas_recive`, `id`, `isMachzikim`, `isMachzikimPublik`, `isOt`, `isPlatform`, `linkToWebsite`, `locale`, `localizations`, `location`, `maaps`, `machshirs`, `mashaabims`, `mashabetahaliches`, `matanotofs`, `mesimabetahaliches`, `missions`, `newMeMissionOuto72ho`, `newOpenMissionAllApruve`, `newOpenMotoAfter72hoursWithnono`, `newmeOpenAllapruve`, `not`, `open_mashaabims`, `open_missions`, `or`, `pendms`, `pmashes`, `projectName`, `publicDescription`, `publishedAt`, `ratson_proposals`, `restime`, `rikmashes`, `sales`, `sales_source`, `sheirutpends`, `sheiruts`, `sheiruts_sourced`, `site_share_contributions`, `sps`, `tafkidims`, `timeToP`, `timerOnlyTOrAlsoManuallyF`, `timers`, `tosplits`, `totalinyearone`, `totalinyearsec`, `totalmaxyearone`, `totalmaxyearsec`, `totalminyearone`, `totalminyearsec`, `twiterlink`, `updatedAt`, `user_1s`, `usersOfP`, `vallues`, `watsapplink`, `welcom_tops`, `work_ways`, `zohars`

#### ProviderProfileFiltersInput
Fields: `ai_meta`, `and`, `archived`, `avg_rating`, `bio_raw`, `createdAt`, `display_name`, `id`, `lat`, `lng`, `location`, `not`, `or`, `owner_id`, `owner_type`, `pinecone_id`, `publishedAt`, `radius_km`, `updatedAt`

#### RatsonFiltersInput
Fields: `access_mode`, `age_group`, `aggregation_opt_out`, `ai_meta`, `allowJoin`, `and`, `bounti`, `categories`, `chat_forum`, `consensusRule`, `createdAt`, `derivedComplexMatanot`, `desc`, `extracted_missions`, `extracted_resources`, `finnishDate`, `frequency`, `fulfilled`, `fulfillment_score`, `id`, `isOnline`, `joinDeadline`, `joinKind`, `language`, `last_matched_at`, `lat`, `link`, `lng`, `locale`, `localizations`, `location`, `location_hint`, `lockedAt`, `longDes`, `maagad`, `mashaabims`, `matanots`, `matanots_offered`, `maxJoiners`, `minJoiners`, `missions`, `name`, `not`, `open_mashaabims`, `open_missions`, `or`, `partialConsensusFallback`, `pinecone_id`, `process`, `publishedAt`, `radius`, `ratson_match_jobs`, `ratson_proposals`, `ratson_shares`, `share_status`, `sheiruts`, `startDate`, `status_ratson`, `sub_category`, `totalbounti`, `updatedAt`, `users_permissions_users`, `vallues`, `votes`, `willingnessModel`

#### RatsonMatchJobFiltersInput
Fields: `and`, `createdAt`, `error`, `finished_at`, `id`, `mode`, `not`, `or`, `proposals_created`, `publishedAt`, `ratson`, `started_at`, `updatedAt`

#### RatsonProposalFiltersInput
Fields: `and`, `auto_generated`, `covered_missions`, `covered_resources`, `createdAt`, `final_breakdown`, `forum`, `id`, `kind`, `matanot`, `matbea`, `match_score`, `negos`, `not`, `open_mashaabims`, `open_mission`, `or`, `project`, `proposer_users`, `publishedAt`, `ratson`, `ratson_willingness_entry`, `sheirutpends`, `status_proposal`, `tosplits`, `total_price`, `updatedAt`, `votes`

#### RatsonShareFiltersInput
Fields: `and`, `createdAt`, `halukas`, `id`, `joinedAt`, `leftAt`, `matbea`, `maxContribution`, `not`, `notificationsOn`, `or`, `publishedAt`, `ratson`, `role`, `status_share`, `updatedAt`, `users_permissions_user`

#### RichtextFiltersInput
Fields: `and`, `bg`, `createdAt`, `desc`, `id`, `locale`, `localizations`, `not`, `or`, `updatedAt`

#### RikmashFiltersInput
Fields: `agprice`, `and`, `createdAt`, `cyclesCount`, `deliveries`, `firstDeliveryAt`, `haamadas`, `hm`, `id`, `isMust`, `isYesod`, `kindOf`, `lastDeliveryAt`, `maaps`, `mashabetahalich`, `name`, `not`, `open_mashaabim`, `or`, `price`, `project`, `publishedAt`, `quantityDelivered`, `sp`, `spnot`, `sqadualed`, `sqadualef`, `summary`, `total`, `updatedAt`, `users_permissions_user`

#### SaleFiltersInput
Fields: `and`, `confirmedBy`, `createdAt`, `date`, `decision`, `finishDate`, `holderDecidedAt`, `holderStatus`, `id`, `in`, `isMonterActive`, `isSiteShareIncome`, `matanot`, `monters`, `not`, `note`, `or`, `pending`, `project`, `publishedAt`, `reporter`, `sheiruts`, `source_project`, `splited`, `startDate`, `tosplits`, `unit`, `updatedAt`, `users_permissions_user`

#### SealedEnvelopeFiltersInput
Fields: `and`, `createdAt`, `envelopeId`, `id`, `not`, `or`, `payload`, `spaceId`, `ts`, `updatedAt`

#### SeederFiltersInput
Fields: `and`, `createdAt`, `finnish`, `id`, `mesimabetahalich`, `not`, `or`, `publishedAt`, `start`, `updatedAt`

#### SheirutFiltersInput
Fields: `and`, `archived`, `askwants`, `categories`, `createdAt`, `descrip`, `equaliSplited`, `finnishDate`, `forums`, `halukas`, `iCanGetMonay`, `iGotIt`, `iGotMoney`, `iTransferMoney`, `iTransferedTo`, `id`, `isApruved`, `isItOnlyOneInProject`, `isSiteShareIncome`, `locale`, `localizations`, `matanot`, `moneyTransfered`, `monters`, `name`, `not`, `oneTime`, `or`, `price`, `productExepted`, `project`, `quant`, `sales`, `sheirut_fulfillments`, `sheirutpend`, `site_share_contributions`, `source_project`, `source_proposals`, `source_tosplit`, `startDate`, `total`, `updatedAt`, `users_permissions_users`, `wants`, `weFinnish`

#### SheirutFulfillmentFiltersInput
Fields: `agreedPrice`, `and`, `cmdm`, `consumedMissionHours`, `consumedOpenMU`, `createdAt`, `createdMaaps`, `createdMissions`, `createdPmashes`, `id`, `matanot`, `not`, `or`, `process`, `publishedAt`, `quantity`, `sheirut`, `status_process`, `updatedAt`

#### SheirutnegoFiltersInput
Fields: `and`, `createdAt`, `finnishDate`, `id`, `isOriginal`, `not`, `or`, `price`, `publishedAt`, `quant`, `sheirutpend`, `startDate`, `updatedAt`, `users_permissions_user`, `vots`

#### SheirutpendFiltersInput
Fields: `and`, `appruved`, `archived`, `conditional`, `createdAt`, `finnishDate`, `forum`, `id`, `locale`, `localizations`, `maagad_offer`, `matanots`, `not`, `or`, `price`, `project`, `quant`, `ratson_proposal`, `sheirut`, `sheirutnegos`, `startDate`, `timegrama`, `total`, `updatedAt`, `users_permissions_user`, `votes`, `vots`

#### SidurFiltersInput
Fields: `and`, `createdAt`, `id`, `lemi`, `not`, `or`, `publishedAt`, `updatedAt`

#### SiteReportFiltersInput
Fields: `and`, `createdAt`, `description`, `id`, `lang`, `not`, `or`, `page`, `publishedAt`, `status`, `type`, `updatedAt`, `userEmail`, `userId`, `userName`

#### SiteShareContributionFiltersInput
Fields: `amount`, `and`, `basisAmount`, `createdAt`, `des_status`, `direction`, `haluka`, `id`, `matbea`, `not`, `or`, `project`, `proposedAmount`, `publishedAt`, `reason`, `recive_project`, `sheirut`, `tosplit`, `updatedAt`, `users_permissions_user`

#### SkillFiltersInput
Fields: `and`, `createdAt`, `descrip`, `id`, `locale`, `localizations`, `missions`, `negopendmissions`, `not`, `open_missions`, `or`, `pendms`, `publishedAt`, `skillName`, `tafkidims`, `updatedAt`, `users`

#### SolutionFiltersInput
Fields: `and`, `createdAt`, `deas`, `id`, `not`, `or`, `publishedAt`, `updatedAt`

#### SpFiltersInput
Fields: `and`, `archived`, `askms`, `createdAt`, `declinedm`, `descrip`, `fdate`, `id`, `kindOf`, `linkto`, `locale`, `localizations`, `location`, `maaps`, `mashaabim`, `mode`, `myp`, `name`, `not`, `openask`, `or`, `panui`, `price`, `project`, `publishedAt`, `rikmash`, `sdate`, `splited`, `spnot`, `unit`, `updatedAt`, `users_permissions_user`, `yat`

#### TafkidimFiltersInput
Fields: `acts`, `and`, `createdAt`, `descrip`, `finnished_missions`, `id`, `locale`, `localizations`, `mesimabetahaliches`, `missions`, `negopendmissions`, `not`, `open_missions`, `or`, `pendms`, `projects`, `publishedAt`, `roleDescription`, `skills`, `updatedAt`, `users_permissions_users`

#### TikunolamFiltersInput
Fields: `amort`, `amortf`, `amorth`, `amorts`, `amortt`, `and`, `createdAt`, `email`, `id`, `locale`, `localizations`, `more`, `name`, `not`, `notes`, `or`, `publishedAt`, `updatedAt`

#### TimegramaFiltersInput
Fields: `act`, `actt`, `and`, `ask`, `askm`, `askwant`, `createdAt`, `date`, `decision`, `done`, `finiapruval`, `id`, `maap`, `matanotpend`, `mesimabetahalich`, `not`, `or`, `pendm`, `pmash`, `sheirutpend`, `timer`, `tosplit`, `updatedAt`, `whatami`

#### TimerFiltersInput
Fields: `activeMesimabetahalich`, `acts`, `and`, `appruved`, `createdAt`, `finiapruvals`, `finnish`, `forApruve`, `id`, `isActive`, `locale`, `localizations`, `mashabetahalich`, `mesimabetahalich`, `not`, `or`, `project`, `saveLinks`, `saveText`, `saved`, `start`, `timegrama`, `timers`, `totalHours`, `updatedAt`, `users_permissions_user`, `votes`

#### TosplitFiltersInput
Fields: `and`, `createdAt`, `finished`, `halukas`, `hervachti`, `id`, `locale`, `localizations`, `name`, `not`, `or`, `prectentage`, `project`, `publishedAt`, `ratson_proposal`, `sales`, `sheiruts`, `siteShareHalukas`, `site_share_contributions`, `split_origin`, `timegrama`, `updatedAt`, `vots`, `whynow`

#### TranslateFiltersInput
Fields: `amort`, `amortf`, `amorth`, `amorts`, `amortt`, `and`, `createdAt`, `email`, `from`, `id`, `lang`, `name`, `not`, `notes`, `or`, `publishedAt`, `updatedAt`

#### UploadFileFiltersInput
Fields: `alternativeText`, `and`, `caption`, `createdAt`, `ext`, `folder`, `folderPath`, `formats`, `hash`, `height`, `id`, `mime`, `name`, `not`, `or`, `previewUrl`, `provider`, `provider_metadata`, `size`, `updatedAt`, `url`, `width`

#### UploadFolderFiltersInput
Fields: `and`, `children`, `createdAt`, `files`, `id`, `name`, `not`, `or`, `parent`, `path`, `pathId`, `updatedAt`

#### UserKeyFiltersInput
Fields: `addedAt`, `algo`, `and`, `createdAt`, `devicePubB64`, `id`, `label`, `not`, `or`, `payload`, `revokedAt`, `updatedAt`, `userId`

#### UsersPermissionsPermissionFiltersInput
Fields: `action`, `and`, `createdAt`, `id`, `not`, `or`, `role`, `updatedAt`

#### UsersPermissionsRoleFiltersInput
Fields: `and`, `createdAt`, `description`, `id`, `name`, `not`, `or`, `permissions`, `type`, `updatedAt`, `users`

#### UsersPermissionsUserFiltersInput
Fields: `acts`, `actsVali`, `and`, `api_keys`, `arr1`, `arrdate`, `askeds`, `askms`, `asks`, `askwants`, `auto_created_via`, `availability_pref`, `bio`, `blocked`, `chezin`, `city`, `confirmationToken`, `confirmed`, `createdAt`, `cuntries`, `cv_extracted_at`, `cv_extraction`, `deals`, `declined`, `declinedByP`, `declinedm`, `device_token`, `discordlink`, `email`, `fblink`, `filtertags`, `finiapruvals`, `finnished_missions`, `forum_last_seens`, `frd`, `free_person`, `githublink`, `haamadas`, `halukasend`, `halukasres`, `haskama`, `haskamac`, `haskamaz`, `hatzaas`, `hervachti`, `iGotMOneyForSheirut`, `id`, `isSigned`, `lang`, `lat`, `levManualAlready`, `lng`, `location`, `machshirs`, `mashaabims`, `mashabetahaliches`, `matanot_recipe_missions`, `matanot_recipe_resources`, `mesimabetahaliches`, `messages`, `missions_i_can_do`, `moachManualAlready`, `nego_mashes`, `negopendmissions`, `negotiations`, `negotiationsIparticipante`, `noMail`, `noMoachGuide`, `noOfHoursProject1`, `not`, `onboarding_status`, `onboarding_track`, `open_missions`, `or`, `password`, `pendms`, `pendmsforme`, `pgishas`, `pgishasPendStrat`, `pgishauserpends`, `pgishausers`, `pmashes`, `positionsAuthor`, `preferCards`, `pricing_pref`, `profilManualAlready`, `projects_1s`, `provider`, `radius`, `ratson_proposals`, `ratson_shares`, `ratsons`, `resetPasswordToken`, `rikmashes`, `rishonvesopen`, `role`, `sales`, `sales_reported`, `sheirutnegos`, `sheirutpends`, `sheiruts`, `sheiruts_iCanGetMonay`, `shekelsPerHoureProject1`, `site_share_contributions`, `skills`, `socketId`, `sphmin`, `sps`, `tafkidims`, `telegramId`, `timeForVid`, `timers`, `twiterlink`, `updatedAt`, `username`, `vallues`, `videoval`, `votes`, `wants`, `welcom_tops`, `work_ways`, `zohars`

#### VallueFiltersInput
Fields: `and`, `createdAt`, `decisions`, `decisionsles`, `descrip`, `id`, `locale`, `localizations`, `not`, `open_missions`, `or`, `pendms`, `projects`, `publishedAt`, `ratsons`, `updatedAt`, `users`, `valueName`

#### VoteFiltersInput
Fields: `and`, `createdAt`, `deas`, `decision`, `hazbaah`, `id`, `item_idx`, `item_kind`, `matanotpend`, `nego`, `not`, `ok`, `or`, `order`, `ratson`, `ratson_proposal`, `sheirut`, `sheirutpend`, `timer`, `updatedAt`, `users_permissions_user`, `what`, `why`

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

## 📦 Entity Response Types (394)

Wrapper types for GraphQL responses.

<details>
<summary>Click to expand all 394 response types</summary>

- **ActEntity**: `attributes: Maybe<Act>`, `id: Maybe<Scalars['ID']['output']>`
- **ActEntityResponse**: `data: Maybe<ActEntity>`
- **ActEntityResponseCollection**: `data: Array<ActEntity>`, `meta: ResponseCollectionMeta`
- **ActRelationResponseCollection**: `data: Array<ActEntity>`
- **ActtEntity**: `attributes: Maybe<Actt>`, `id: Maybe<Scalars['ID']['output']>`
- **ActtEntityResponse**: `data: Maybe<ActtEntity>`
- **ActtEntityResponseCollection**: `data: Array<ActtEntity>`, `meta: ResponseCollectionMeta`
- **ApiKeyEntity**: `attributes: Maybe<ApiKey>`, `id: Maybe<Scalars['ID']['output']>`
- **ApiKeyEntityResponse**: `data: Maybe<ApiKeyEntity>`
- **ApiKeyEntityResponseCollection**: `data: Array<ApiKeyEntity>`, `meta: ResponseCollectionMeta`
- **ApiKeyRelationResponseCollection**: `data: Array<ApiKeyEntity>`
- **ArgumentEntity**: `attributes: Maybe<Argument>`, `id: Maybe<Scalars['ID']['output']>`
- **ArgumentEntityResponse**: `data: Maybe<ArgumentEntity>`
- **ArgumentEntityResponseCollection**: `data: Array<ArgumentEntity>`, `meta: ResponseCollectionMeta`
- **ArgumentRelationResponseCollection**: `data: Array<ArgumentEntity>`
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
- **ClauseEntity**: `attributes: Maybe<Clause>`, `id: Maybe<Scalars['ID']['output']>`
- **ClauseEntityResponse**: `data: Maybe<ClauseEntity>`
- **ClauseEntityResponseCollection**: `data: Array<ClauseEntity>`, `meta: ResponseCollectionMeta`
- **ClauseRelationResponseCollection**: `data: Array<ClauseEntity>`
- **ConsentEventEntity**: `attributes: Maybe<ConsentEvent>`, `id: Maybe<Scalars['ID']['output']>`
- **ConsentEventEntityResponse**: `data: Maybe<ConsentEventEntity>`
- **ConsentEventEntityResponseCollection**: `data: Array<ConsentEventEntity>`, `meta: ResponseCollectionMeta`
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
- **IssueEntity**: `attributes: Maybe<Issue>`, `id: Maybe<Scalars['ID']['output']>`
- **IssueEntityResponse**: `data: Maybe<IssueEntity>`
- **IssueEntityResponseCollection**: `data: Array<IssueEntity>`, `meta: ResponseCollectionMeta`
- **IssueRelationResponseCollection**: `data: Array<IssueEntity>`
- **MaagadEntity**: `attributes: Maybe<Maagad>`, `id: Maybe<Scalars['ID']['output']>`
- **MaagadEntityResponse**: `data: Maybe<MaagadEntity>`
- **MaagadEntityResponseCollection**: `data: Array<MaagadEntity>`, `meta: ResponseCollectionMeta`
- **MaagadMemberEntity**: `attributes: Maybe<MaagadMember>`, `id: Maybe<Scalars['ID']['output']>`
- **MaagadMemberEntityResponse**: `data: Maybe<MaagadMemberEntity>`
- **MaagadMemberEntityResponseCollection**: `data: Array<MaagadMemberEntity>`, `meta: ResponseCollectionMeta`
- **MaagadMemberRelationResponseCollection**: `data: Array<MaagadMemberEntity>`
- **MaagadOfferEntity**: `attributes: Maybe<MaagadOffer>`, `id: Maybe<Scalars['ID']['output']>`
- **MaagadOfferEntityResponse**: `data: Maybe<MaagadOfferEntity>`
- **MaagadOfferEntityResponseCollection**: `data: Array<MaagadOfferEntity>`, `meta: ResponseCollectionMeta`
- **MaagadOfferRelationResponseCollection**: `data: Array<MaagadOfferEntity>`
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
- **MashabetahalichRelationResponseCollection**: `data: Array<MashabetahalichEntity>`
- **MatanotEntity**: `attributes: Maybe<Matanot>`, `id: Maybe<Scalars['ID']['output']>`
- **MatanotEntityResponse**: `data: Maybe<MatanotEntity>`
- **MatanotEntityResponseCollection**: `data: Array<MatanotEntity>`, `meta: ResponseCollectionMeta`
- **MatanotRecipeMissionEntity**: `attributes: Maybe<MatanotRecipeMission>`, `id: Maybe<Scalars['ID']['output']>`
- **MatanotRecipeMissionEntityResponse**: `data: Maybe<MatanotRecipeMissionEntity>`
- **MatanotRecipeMissionEntityResponseCollection**: `data: Array<MatanotRecipeMissionEntity>`, `meta: ResponseCollectionMeta`
- **MatanotRecipeMissionRelationResponseCollection**: `data: Array<MatanotRecipeMissionEntity>`
- **MatanotRecipeResourceEntity**: `attributes: Maybe<MatanotRecipeResource>`, `id: Maybe<Scalars['ID']['output']>`
- **MatanotRecipeResourceEntityResponse**: `data: Maybe<MatanotRecipeResourceEntity>`
- **MatanotRecipeResourceEntityResponseCollection**: `data: Array<MatanotRecipeResourceEntity>`, `meta: ResponseCollectionMeta`
- **MatanotRecipeResourceRelationResponseCollection**: `data: Array<MatanotRecipeResourceEntity>`
- **MatanotRelationResponseCollection**: `data: Array<MatanotEntity>`
- **MatanotpendEntity**: `attributes: Maybe<Matanotpend>`, `id: Maybe<Scalars['ID']['output']>`
- **MatanotpendEntityResponse**: `data: Maybe<MatanotpendEntity>`
- **MatanotpendEntityResponseCollection**: `data: Array<MatanotpendEntity>`, `meta: ResponseCollectionMeta`
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
- **ProviderProfileEntity**: `attributes: Maybe<ProviderProfile>`, `id: Maybe<Scalars['ID']['output']>`
- **ProviderProfileEntityResponse**: `data: Maybe<ProviderProfileEntity>`
- **ProviderProfileEntityResponseCollection**: `data: Array<ProviderProfileEntity>`, `meta: ResponseCollectionMeta`
- **RatsonEntity**: `attributes: Maybe<Ratson>`, `id: Maybe<Scalars['ID']['output']>`
- **RatsonEntityResponse**: `data: Maybe<RatsonEntity>`
- **RatsonEntityResponseCollection**: `data: Array<RatsonEntity>`, `meta: ResponseCollectionMeta`
- **RatsonMatchJobEntity**: `attributes: Maybe<RatsonMatchJob>`, `id: Maybe<Scalars['ID']['output']>`
- **RatsonMatchJobEntityResponse**: `data: Maybe<RatsonMatchJobEntity>`
- **RatsonMatchJobEntityResponseCollection**: `data: Array<RatsonMatchJobEntity>`, `meta: ResponseCollectionMeta`
- **RatsonMatchJobRelationResponseCollection**: `data: Array<RatsonMatchJobEntity>`
- **RatsonProposalEntity**: `attributes: Maybe<RatsonProposal>`, `id: Maybe<Scalars['ID']['output']>`
- **RatsonProposalEntityResponse**: `data: Maybe<RatsonProposalEntity>`
- **RatsonProposalEntityResponseCollection**: `data: Array<RatsonProposalEntity>`, `meta: ResponseCollectionMeta`
- **RatsonProposalRelationResponseCollection**: `data: Array<RatsonProposalEntity>`
- **RatsonRelationResponseCollection**: `data: Array<RatsonEntity>`
- **RatsonShareEntity**: `attributes: Maybe<RatsonShare>`, `id: Maybe<Scalars['ID']['output']>`
- **RatsonShareEntityResponse**: `data: Maybe<RatsonShareEntity>`
- **RatsonShareEntityResponseCollection**: `data: Array<RatsonShareEntity>`, `meta: ResponseCollectionMeta`
- **RatsonShareRelationResponseCollection**: `data: Array<RatsonShareEntity>`
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
- **SealedEnvelopeEntity**: `attributes: Maybe<SealedEnvelope>`, `id: Maybe<Scalars['ID']['output']>`
- **SealedEnvelopeEntityResponse**: `data: Maybe<SealedEnvelopeEntity>`
- **SealedEnvelopeEntityResponseCollection**: `data: Array<SealedEnvelopeEntity>`, `meta: ResponseCollectionMeta`
- **SeederEntity**: `attributes: Maybe<Seeder>`, `id: Maybe<Scalars['ID']['output']>`
- **SeederEntityResponse**: `data: Maybe<SeederEntity>`
- **SeederEntityResponseCollection**: `data: Array<SeederEntity>`, `meta: ResponseCollectionMeta`
- **SeederRelationResponseCollection**: `data: Array<SeederEntity>`
- **SheirutEntity**: `attributes: Maybe<Sheirut>`, `id: Maybe<Scalars['ID']['output']>`
- **SheirutEntityResponse**: `data: Maybe<SheirutEntity>`
- **SheirutEntityResponseCollection**: `data: Array<SheirutEntity>`, `meta: ResponseCollectionMeta`
- **SheirutFulfillmentEntity**: `attributes: Maybe<SheirutFulfillment>`, `id: Maybe<Scalars['ID']['output']>`
- **SheirutFulfillmentEntityResponse**: `data: Maybe<SheirutFulfillmentEntity>`
- **SheirutFulfillmentEntityResponseCollection**: `data: Array<SheirutFulfillmentEntity>`, `meta: ResponseCollectionMeta`
- **SheirutFulfillmentRelationResponseCollection**: `data: Array<SheirutFulfillmentEntity>`
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
- **SiteReportEntity**: `attributes: Maybe<SiteReport>`, `id: Maybe<Scalars['ID']['output']>`
- **SiteReportEntityResponse**: `data: Maybe<SiteReportEntity>`
- **SiteReportEntityResponseCollection**: `data: Array<SiteReportEntity>`, `meta: ResponseCollectionMeta`
- **SiteShareContributionEntity**: `attributes: Maybe<SiteShareContribution>`, `id: Maybe<Scalars['ID']['output']>`
- **SiteShareContributionEntityResponse**: `data: Maybe<SiteShareContributionEntity>`
- **SiteShareContributionEntityResponseCollection**: `data: Array<SiteShareContributionEntity>`, `meta: ResponseCollectionMeta`
- **SiteShareContributionRelationResponseCollection**: `data: Array<SiteShareContributionEntity>`
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
- **UserKeyEntity**: `attributes: Maybe<UserKey>`, `id: Maybe<Scalars['ID']['output']>`
- **UserKeyEntityResponse**: `data: Maybe<UserKeyEntity>`
- **UserKeyEntityResponseCollection**: `data: Array<UserKeyEntity>`, `meta: ResponseCollectionMeta`
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

## 🔢 Enum Types (85)

<details>
<summary>Click to expand all 85 enum types</summary>

- **Enum_Act_Hashivut**: 
- **Enum_Argument_Authortype**: 
- **Enum_Argument_Stance**: 
- **Enum_Clause_Authortype**: 
- **Enum_Clause_Origin**: 
- **Enum_Componentdesisionnegom_Kindof**: 
- **Enum_Componentnewextractedmissions_Importance**: 
- **Enum_Componentnewextractedresources_Importance**: 
- **Enum_Componentnewextractedresources_Kindof**: 
- **Enum_Componentnewlocation_Location_Mode**: 
- **Enum_Componentnewnegom_Kindof**: 
- **Enum_Componentnewwillingnessentries_Item_Kind**: 
- **Enum_Componentprojectsnegom_Kindof**: 
- **Enum_Contentreleasesreleaseaction_Type**: 
- **Enum_Decision_Kind**: 
- **Enum_Forum_Spec**: 
- **Enum_Haluka_Adjustdirection**: 
- **Enum_Issue_Origin**: 
- **Enum_Maagadmember_Status_Member**: 
- **Enum_Maagadmember_Visibility**: 
- **Enum_Maagadoffer_Recurrence**: 
- **Enum_Maagadoffer_Status_Offer**: 
- **Enum_Maagad_Origin**: 
- **Enum_Maagad_Scope**: 
- **Enum_Maagad_Status_Maagad**: 
- **Enum_Maap_Unit**: 
- **Enum_Mashaabim_Kindof**: 
- **Enum_Mashabetahalich_Kindof**: 
- **Enum_Mashabetahalich_Status_Mashab**: 
- **Enum_Mashabetahalich_Unit**: 
- **Enum_Matanotpend_Status_Pend**: 
- **Enum_Matanotrecipemission_Mode**: 
- **Enum_Matanotreciperesource_Kindof**: 
- **Enum_Matanotreciperesource_Mode**: 
- **Enum_Matanot_Kindof**: 
- **Enum_Matanot_Pricingmode**: 
- **Enum_Matanot_Status_Of_Voting**: 
- **Enum_Mission_Kindof**: 
- **Enum_Negomash_Kindof**: 
- **Enum_Negomash_Proposedby**: 
- **Enum_Negomash_Status**: 
- **Enum_Negopendmission_Proposedby**: 
- **Enum_Negopendmission_Status**: 
- **Enum_Negotiation_Status**: 
- **Enum_Negotiation_Visibility**: 
- **Enum_Nego_Kindof**: 
- **Enum_Openmashaabim_Kindof**: 
- **Enum_Openmashaabim_Source**: 
- **Enum_Openmission_Source**: 
- **Enum_Pmash_Kindof**: 
- **Enum_Position_Authortype**: 
- **Enum_Position_Kind**: 
- **Enum_Position_Pole**: 
- **Enum_Project_Restime**: 
- **Enum_Project_Timetop**: 
- **Enum_Providerprofile_Owner_Type**: 
- **Enum_Ratsonmatchjob_Mode**: 
- **Enum_Ratsonproposal_Kind**: 
- **Enum_Ratsonproposal_Status_Proposal**: 
- **Enum_Ratsonshare_Role**: 
- **Enum_Ratsonshare_Status_Share**: 
- **Enum_Ratson_Access_Mode**: 
- **Enum_Ratson_Consensusrule**: 
- **Enum_Ratson_Joinkind**: 
- **Enum_Ratson_Partialconsensusfallback**: 
- **Enum_Ratson_Share_Status**: 
- **Enum_Ratson_Status_Ratson**: 
- **Enum_Ratson_Willingnessmodel**: 
- **Enum_Rikmash_Kindof**: 
- **Enum_Sale_Confirmedby**: 
- **Enum_Sale_Holderstatus**: 
- **Enum_Sheirutfulfillment_Status_Process**: 
- **Enum_Sitereport_Status**: 
- **Enum_Sitereport_Type**: 
- **Enum_Sitesharecontribution_Des_Status**: 
- **Enum_Sitesharecontribution_Direction**: 
- **Enum_Sp_Kindof**: 
- **Enum_Tosplit_Split_Origin**: 
- **Enum_Userspermissionsuser_Auto_Created_Via**: 
- **Enum_Userspermissionsuser_Frd**: 
- **Enum_Userspermissionsuser_Lang**: 
- **Enum_Userspermissionsuser_Onboarding_Status**: 
- **Enum_Userspermissionsuser_Onboarding_Track**: 
- **Enum_Vote_Item_Kind**: 
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
│   ├── graphql.ts              # Auto-generated types (codegen) - 18513 lines
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
