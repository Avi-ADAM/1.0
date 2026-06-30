export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  I18NLocaleCode: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Long: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export type Act = {
  __typename?: 'Act';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dateF?: Maybe<Scalars['DateTime']['output']>;
  dateS?: Maybe<Scalars['DateTime']['output']>;
  des?: Maybe<Scalars['String']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  hashivut?: Maybe<Enum_Act_Hashivut>;
  isAssigned?: Maybe<Scalars['Boolean']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<ActRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  my?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  myIshur?: Maybe<Scalars['Boolean']['output']>;
  naasa?: Maybe<Scalars['Boolean']['output']>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pendm?: Maybe<PendmEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  shem?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  taskdis?: Maybe<Array<Maybe<ComponentProjectsTaskdis>>>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  timers?: Maybe<TimerRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userAndIshur?: Maybe<Array<Maybe<ComponentNewUserAndIshur>>>;
  vali?: Maybe<UsersPermissionsUserEntityResponse>;
  valiIshur?: Maybe<Scalars['Boolean']['output']>;
};


export type ActForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActLocalizationsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActMyArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActTaskdisArgs = {
  filters?: InputMaybe<ComponentProjectsTaskdisFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActTimersArgs = {
  filters?: InputMaybe<TimerFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActUserAndIshurArgs = {
  filters?: InputMaybe<ComponentNewUserAndIshurFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ActEntity = {
  __typename?: 'ActEntity';
  attributes?: Maybe<Act>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ActEntityResponse = {
  __typename?: 'ActEntityResponse';
  data?: Maybe<ActEntity>;
};

export type ActEntityResponseCollection = {
  __typename?: 'ActEntityResponseCollection';
  data: Array<ActEntity>;
  meta: ResponseCollectionMeta;
};

export type ActFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ActFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  dateF?: InputMaybe<DateTimeFilterInput>;
  dateS?: InputMaybe<DateTimeFilterInput>;
  des?: InputMaybe<StringFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  hashivut?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isAssigned?: InputMaybe<BooleanFilterInput>;
  link?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<ActFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  my?: InputMaybe<UsersPermissionsUserFiltersInput>;
  myIshur?: InputMaybe<BooleanFilterInput>;
  naasa?: InputMaybe<BooleanFilterInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  not?: InputMaybe<ActFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ActFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  pendm?: InputMaybe<PendmFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  shem?: InputMaybe<StringFilterInput>;
  status?: InputMaybe<IntFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  taskdis?: InputMaybe<ComponentProjectsTaskdisFiltersInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  timers?: InputMaybe<TimerFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  userAndIshur?: InputMaybe<ComponentNewUserAndIshurFiltersInput>;
  vali?: InputMaybe<UsersPermissionsUserFiltersInput>;
  valiIshur?: InputMaybe<BooleanFilterInput>;
};

export type ActInput = {
  dateF?: InputMaybe<Scalars['DateTime']['input']>;
  dateS?: InputMaybe<Scalars['DateTime']['input']>;
  des?: InputMaybe<Scalars['String']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hashivut?: InputMaybe<Enum_Act_Hashivut>;
  isAssigned?: InputMaybe<Scalars['Boolean']['input']>;
  link?: InputMaybe<Scalars['String']['input']>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  my?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  myIshur?: InputMaybe<Scalars['Boolean']['input']>;
  naasa?: InputMaybe<Scalars['Boolean']['input']>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendm?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  shem?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['Int']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  taskdis?: InputMaybe<Array<InputMaybe<ComponentProjectsTaskdisInput>>>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  timers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  userAndIshur?: InputMaybe<Array<InputMaybe<ComponentNewUserAndIshurInput>>>;
  vali?: InputMaybe<Scalars['ID']['input']>;
  valiIshur?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ActRelationResponseCollection = {
  __typename?: 'ActRelationResponseCollection';
  data: Array<ActEntity>;
};

export type Actt = {
  __typename?: 'Actt';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ActtEntity = {
  __typename?: 'ActtEntity';
  attributes?: Maybe<Actt>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ActtEntityResponse = {
  __typename?: 'ActtEntityResponse';
  data?: Maybe<ActtEntity>;
};

export type ActtEntityResponseCollection = {
  __typename?: 'ActtEntityResponseCollection';
  data: Array<ActtEntity>;
  meta: ResponseCollectionMeta;
};

export type ActtFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ActtFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  link?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ActtFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ActtFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ActtInput = {
  link?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
};

export type ApiKey = {
  __typename?: 'ApiKey';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  key_hash?: Maybe<Scalars['String']['output']>;
  key_prefix?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ApiKeyEntity = {
  __typename?: 'ApiKeyEntity';
  attributes?: Maybe<ApiKey>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ApiKeyEntityResponse = {
  __typename?: 'ApiKeyEntityResponse';
  data?: Maybe<ApiKeyEntity>;
};

export type ApiKeyEntityResponseCollection = {
  __typename?: 'ApiKeyEntityResponseCollection';
  data: Array<ApiKeyEntity>;
  meta: ResponseCollectionMeta;
};

export type ApiKeyFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ApiKeyFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  key_hash?: InputMaybe<StringFilterInput>;
  key_prefix?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ApiKeyFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ApiKeyFiltersInput>>>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ApiKeyInput = {
  key_hash?: InputMaybe<Scalars['String']['input']>;
  key_prefix?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ApiKeyRelationResponseCollection = {
  __typename?: 'ApiKeyRelationResponseCollection';
  data: Array<ApiKeyEntity>;
};

export type Argument = {
  __typename?: 'Argument';
  arguments?: Maybe<ArgumentRelationResponseCollection>;
  authorEmail?: Maybe<Scalars['String']['output']>;
  authorExternalId?: Maybe<Scalars['String']['output']>;
  authorName?: Maybe<Scalars['String']['output']>;
  authorType?: Maybe<Enum_Argument_Authortype>;
  body?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  negotiation?: Maybe<NegotiationEntityResponse>;
  parent?: Maybe<ArgumentEntityResponse>;
  position?: Maybe<PositionEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  stance?: Maybe<Enum_Argument_Stance>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  voters?: Maybe<Scalars['JSON']['output']>;
  votes?: Maybe<Scalars['Int']['output']>;
};


export type ArgumentArgumentsArgs = {
  filters?: InputMaybe<ArgumentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ArgumentEntity = {
  __typename?: 'ArgumentEntity';
  attributes?: Maybe<Argument>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ArgumentEntityResponse = {
  __typename?: 'ArgumentEntityResponse';
  data?: Maybe<ArgumentEntity>;
};

export type ArgumentEntityResponseCollection = {
  __typename?: 'ArgumentEntityResponseCollection';
  data: Array<ArgumentEntity>;
  meta: ResponseCollectionMeta;
};

export type ArgumentFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ArgumentFiltersInput>>>;
  arguments?: InputMaybe<ArgumentFiltersInput>;
  authorEmail?: InputMaybe<StringFilterInput>;
  authorExternalId?: InputMaybe<StringFilterInput>;
  authorName?: InputMaybe<StringFilterInput>;
  authorType?: InputMaybe<StringFilterInput>;
  body?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  negotiation?: InputMaybe<NegotiationFiltersInput>;
  not?: InputMaybe<ArgumentFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ArgumentFiltersInput>>>;
  parent?: InputMaybe<ArgumentFiltersInput>;
  position?: InputMaybe<PositionFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  stance?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  voters?: InputMaybe<JsonFilterInput>;
  votes?: InputMaybe<IntFilterInput>;
};

export type ArgumentInput = {
  arguments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  authorEmail?: InputMaybe<Scalars['String']['input']>;
  authorExternalId?: InputMaybe<Scalars['String']['input']>;
  authorName?: InputMaybe<Scalars['String']['input']>;
  authorType?: InputMaybe<Enum_Argument_Authortype>;
  body?: InputMaybe<Scalars['String']['input']>;
  negotiation?: InputMaybe<Scalars['ID']['input']>;
  parent?: InputMaybe<Scalars['ID']['input']>;
  position?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  stance?: InputMaybe<Enum_Argument_Stance>;
  voters?: InputMaybe<Scalars['JSON']['input']>;
  votes?: InputMaybe<Scalars['Int']['input']>;
};

export type ArgumentRelationResponseCollection = {
  __typename?: 'ArgumentRelationResponseCollection';
  data: Array<ArgumentEntity>;
};

export type Ask = {
  __typename?: 'Ask';
  archived?: Maybe<Scalars['Boolean']['output']>;
  chat?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type AskChatArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type AskEntity = {
  __typename?: 'AskEntity';
  attributes?: Maybe<Ask>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type AskEntityResponse = {
  __typename?: 'AskEntityResponse';
  data?: Maybe<AskEntity>;
};

export type AskEntityResponseCollection = {
  __typename?: 'AskEntityResponseCollection';
  data: Array<AskEntity>;
  meta: ResponseCollectionMeta;
};

export type AskFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<AskFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  chat?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  not?: InputMaybe<AskFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<AskFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type AskInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  chat?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type AskRelationResponseCollection = {
  __typename?: 'AskRelationResponseCollection';
  data: Array<AskEntity>;
};

export type Askm = {
  __typename?: 'Askm';
  archived: Scalars['Boolean']['output'];
  chat?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  isSelfProposal?: Maybe<Scalars['Boolean']['output']>;
  nego_mashes?: Maybe<NegoMashRelationResponseCollection>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pendingMainVote?: Maybe<Scalars['Boolean']['output']>;
  pmash?: Maybe<PmashEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  sp?: Maybe<SpEntityResponse>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type AskmChatArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskmNego_MashesArgs = {
  filters?: InputMaybe<NegoMashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskmPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskmVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type AskmEntity = {
  __typename?: 'AskmEntity';
  attributes?: Maybe<Askm>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type AskmEntityResponse = {
  __typename?: 'AskmEntityResponse';
  data?: Maybe<AskmEntity>;
};

export type AskmEntityResponseCollection = {
  __typename?: 'AskmEntityResponseCollection';
  data: Array<AskmEntity>;
  meta: ResponseCollectionMeta;
};

export type AskmFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<AskmFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  chat?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isSelfProposal?: InputMaybe<BooleanFilterInput>;
  nego_mashes?: InputMaybe<NegoMashFiltersInput>;
  not?: InputMaybe<AskmFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<AskmFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  pendingMainVote?: InputMaybe<BooleanFilterInput>;
  pmash?: InputMaybe<PmashFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  sp?: InputMaybe<SpFiltersInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type AskmInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  chat?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  isSelfProposal?: InputMaybe<Scalars['Boolean']['input']>;
  nego_mashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendingMainVote?: InputMaybe<Scalars['Boolean']['input']>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  sp?: InputMaybe<Scalars['ID']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type AskmRelationResponseCollection = {
  __typename?: 'AskmRelationResponseCollection';
  data: Array<AskmEntity>;
};

export type Askwant = {
  __typename?: 'Askwant';
  archived?: Maybe<Scalars['Boolean']['output']>;
  chat?: Maybe<Array<Maybe<ComponentProjectsChatre>>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  sheirut?: Maybe<SheirutEntityResponse>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type AskwantChatArgs = {
  filters?: InputMaybe<ComponentProjectsChatreFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type AskwantVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type AskwantEntity = {
  __typename?: 'AskwantEntity';
  attributes?: Maybe<Askwant>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type AskwantEntityResponse = {
  __typename?: 'AskwantEntityResponse';
  data?: Maybe<AskwantEntity>;
};

export type AskwantEntityResponseCollection = {
  __typename?: 'AskwantEntityResponseCollection';
  data: Array<AskwantEntity>;
  meta: ResponseCollectionMeta;
};

export type AskwantFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<AskwantFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  chat?: InputMaybe<ComponentProjectsChatreFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<AskwantFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<AskwantFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type AskwantInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  chat?: InputMaybe<Array<InputMaybe<ComponentProjectsChatreInput>>>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type AskwantRelationResponseCollection = {
  __typename?: 'AskwantRelationResponseCollection';
  data: Array<AskwantEntity>;
};

export type Bakasha = {
  __typename?: 'Bakasha';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  furfiled?: Maybe<Scalars['Boolean']['output']>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  matanot?: Maybe<MatanotEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type BakashaEntity = {
  __typename?: 'BakashaEntity';
  attributes?: Maybe<Bakasha>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type BakashaEntityResponse = {
  __typename?: 'BakashaEntityResponse';
  data?: Maybe<BakashaEntity>;
};

export type BakashaEntityResponseCollection = {
  __typename?: 'BakashaEntityResponseCollection';
  data: Array<BakashaEntity>;
  meta: ResponseCollectionMeta;
};

export type BakashaFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<BakashaFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  furfiled?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  mashaabim?: InputMaybe<MashaabimFiltersInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<BakashaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<BakashaFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type BakashaInput = {
  furfiled?: InputMaybe<Scalars['Boolean']['input']>;
  mashaabim?: InputMaybe<Scalars['ID']['input']>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type BakashaRelationResponseCollection = {
  __typename?: 'BakashaRelationResponseCollection';
  data: Array<BakashaEntity>;
};

export type BooleanFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  contains?: InputMaybe<Scalars['Boolean']['input']>;
  containsi?: InputMaybe<Scalars['Boolean']['input']>;
  endsWith?: InputMaybe<Scalars['Boolean']['input']>;
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  eqi?: InputMaybe<Scalars['Boolean']['input']>;
  gt?: InputMaybe<Scalars['Boolean']['input']>;
  gte?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  lt?: InputMaybe<Scalars['Boolean']['input']>;
  lte?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
  nei?: InputMaybe<Scalars['Boolean']['input']>;
  not?: InputMaybe<BooleanFilterInput>;
  notContains?: InputMaybe<Scalars['Boolean']['input']>;
  notContainsi?: InputMaybe<Scalars['Boolean']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  startsWith?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Category = {
  __typename?: 'Category';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<CategoryRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratsons?: Maybe<RatsonRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type CategoryLocalizationsArgs = {
  filters?: InputMaybe<CategoryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CategoryMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CategoryRatsonsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CategorySheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type CategoryEntity = {
  __typename?: 'CategoryEntity';
  attributes?: Maybe<Category>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type CategoryEntityResponse = {
  __typename?: 'CategoryEntityResponse';
  data?: Maybe<CategoryEntity>;
};

export type CategoryEntityResponseCollection = {
  __typename?: 'CategoryEntityResponseCollection';
  data: Array<CategoryEntity>;
  meta: ResponseCollectionMeta;
};

export type CategoryFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<CategoryFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<CategoryFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<CategoryFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<CategoryFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratsons?: InputMaybe<RatsonFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type CategoryInput = {
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratsons?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type CategoryRelationResponseCollection = {
  __typename?: 'CategoryRelationResponseCollection';
  data: Array<CategoryEntity>;
};

export type Chezin = {
  __typename?: 'Chezin';
  countries?: Maybe<CuntryRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deffinitions?: Maybe<DeffinitionRelationResponseCollection>;
  email: Scalars['String']['output'];
  fullAgreement?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<ChezinRelationResponseCollection>;
  myQuotes?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  noOpHours?: Maybe<Scalars['Float']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  shekelsPerHoure?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type ChezinCountriesArgs = {
  filters?: InputMaybe<CuntryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ChezinDeffinitionsArgs = {
  filters?: InputMaybe<DeffinitionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ChezinLocalizationsArgs = {
  filters?: InputMaybe<ChezinFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ChezinEntity = {
  __typename?: 'ChezinEntity';
  attributes?: Maybe<Chezin>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ChezinEntityResponse = {
  __typename?: 'ChezinEntityResponse';
  data?: Maybe<ChezinEntity>;
};

export type ChezinEntityResponseCollection = {
  __typename?: 'ChezinEntityResponseCollection';
  data: Array<ChezinEntity>;
  meta: ResponseCollectionMeta;
};

export type ChezinFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ChezinFiltersInput>>>;
  countries?: InputMaybe<CuntryFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  deffinitions?: InputMaybe<DeffinitionFiltersInput>;
  email?: InputMaybe<StringFilterInput>;
  fullAgreement?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<ChezinFiltersInput>;
  myQuotes?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  noOpHours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<ChezinFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ChezinFiltersInput>>>;
  phoneNumber?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  shekelsPerHoure?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ChezinInput = {
  countries?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  deffinitions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  email?: InputMaybe<Scalars['String']['input']>;
  fullAgreement?: InputMaybe<Scalars['Boolean']['input']>;
  myQuotes?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  noOpHours?: InputMaybe<Scalars['Float']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  shekelsPerHoure?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ChezinRelationResponseCollection = {
  __typename?: 'ChezinRelationResponseCollection';
  data: Array<ChezinEntity>;
};

export type Clause = {
  __typename?: 'Clause';
  authorExternalId?: Maybe<Scalars['String']['output']>;
  authorType?: Maybe<Enum_Clause_Authortype>;
  body?: Maybe<Scalars['String']['output']>;
  confirmedByAuthor?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  issue?: Maybe<IssueEntityResponse>;
  negotiation?: Maybe<NegotiationEntityResponse>;
  origin?: Maybe<Enum_Clause_Origin>;
  position?: Maybe<PositionEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  stanceValue?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ClauseEntity = {
  __typename?: 'ClauseEntity';
  attributes?: Maybe<Clause>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ClauseEntityResponse = {
  __typename?: 'ClauseEntityResponse';
  data?: Maybe<ClauseEntity>;
};

export type ClauseEntityResponseCollection = {
  __typename?: 'ClauseEntityResponseCollection';
  data: Array<ClauseEntity>;
  meta: ResponseCollectionMeta;
};

export type ClauseFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ClauseFiltersInput>>>;
  authorExternalId?: InputMaybe<StringFilterInput>;
  authorType?: InputMaybe<StringFilterInput>;
  body?: InputMaybe<StringFilterInput>;
  confirmedByAuthor?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  issue?: InputMaybe<IssueFiltersInput>;
  negotiation?: InputMaybe<NegotiationFiltersInput>;
  not?: InputMaybe<ClauseFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ClauseFiltersInput>>>;
  origin?: InputMaybe<StringFilterInput>;
  position?: InputMaybe<PositionFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  stanceValue?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ClauseInput = {
  authorExternalId?: InputMaybe<Scalars['String']['input']>;
  authorType?: InputMaybe<Enum_Clause_Authortype>;
  body?: InputMaybe<Scalars['String']['input']>;
  confirmedByAuthor?: InputMaybe<Scalars['Boolean']['input']>;
  issue?: InputMaybe<Scalars['ID']['input']>;
  negotiation?: InputMaybe<Scalars['ID']['input']>;
  origin?: InputMaybe<Enum_Clause_Origin>;
  position?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  stanceValue?: InputMaybe<Scalars['Float']['input']>;
};

export type ClauseRelationResponseCollection = {
  __typename?: 'ClauseRelationResponseCollection';
  data: Array<ClauseEntity>;
};

export type ComponentDesisionEditPend = {
  __typename?: 'ComponentDesisionEditPend';
  descrip?: Maybe<Scalars['String']['output']>;
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  perhour?: Maybe<Scalars['Float']['output']>;
  skills?: Maybe<SkillEntityResponse>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  tafkidims?: Maybe<TafkidimEntityResponse>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  work_ways?: Maybe<WorkWayEntityResponse>;
};

export type ComponentDesisionNegodes = {
  __typename?: 'ComponentDesisionNegodes';
  des?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  pic?: Maybe<UploadFileEntityResponse>;
  richdes?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
};

export type ComponentDesisionNegom = {
  __typename?: 'ComponentDesisionNegom';
  descrip?: Maybe<Scalars['String']['output']>;
  easy?: Maybe<Scalars['Float']['output']>;
  hm?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  kindOf?: Maybe<Enum_Componentdesisionnegom_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  spnot?: Maybe<Scalars['String']['output']>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualedf?: Maybe<Scalars['DateTime']['output']>;
};

export type ComponentNewCoveredMissions = {
  __typename?: 'ComponentNewCoveredMissions';
  extracted_mission_idx?: Maybe<Scalars['String']['output']>;
  hours?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  price?: Maybe<Scalars['Float']['output']>;
};

export type ComponentNewCoveredMissionsFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewCoveredMissionsFiltersInput>>>;
  extracted_mission_idx?: InputMaybe<StringFilterInput>;
  hours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<ComponentNewCoveredMissionsFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewCoveredMissionsFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
};

export type ComponentNewCoveredMissionsInput = {
  extracted_mission_idx?: InputMaybe<Scalars['String']['input']>;
  hours?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
};

export type ComponentNewCoveredResources = {
  __typename?: 'ComponentNewCoveredResources';
  extracted_resource_idx?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  price?: Maybe<Scalars['Float']['output']>;
  quantity?: Maybe<Scalars['Float']['output']>;
};

export type ComponentNewCoveredResourcesFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewCoveredResourcesFiltersInput>>>;
  extracted_resource_idx?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentNewCoveredResourcesFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewCoveredResourcesFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  quantity?: InputMaybe<FloatFilterInput>;
};

export type ComponentNewCoveredResourcesInput = {
  extracted_resource_idx?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
};

export type ComponentNewEdits = {
  __typename?: 'ComponentNewEdits';
  id: Scalars['ID']['output'];
  versionText?: Maybe<Scalars['String']['output']>;
};

export type ComponentNewEditsFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewEditsFiltersInput>>>;
  not?: InputMaybe<ComponentNewEditsFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewEditsFiltersInput>>>;
  versionText?: InputMaybe<StringFilterInput>;
};

export type ComponentNewEditsInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  versionText?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentNewExtractedMissions = {
  __typename?: 'ComponentNewExtractedMissions';
  hoursEst?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  importance?: Maybe<Enum_Componentnewextractedmissions_Importance>;
  missions?: Maybe<MissionRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
};


export type ComponentNewExtractedMissionsMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ComponentNewExtractedMissionsFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewExtractedMissionsFiltersInput>>>;
  hoursEst?: InputMaybe<FloatFilterInput>;
  importance?: InputMaybe<StringFilterInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentNewExtractedMissionsFiltersInput>;
  notes?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewExtractedMissionsFiltersInput>>>;
};

export type ComponentNewExtractedMissionsInput = {
  hoursEst?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  importance?: InputMaybe<Enum_Componentnewextractedmissions_Importance>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentNewExtractedResources = {
  __typename?: 'ComponentNewExtractedResources';
  id: Scalars['ID']['output'];
  importance?: Maybe<Enum_Componentnewextractedresources_Importance>;
  kindOf?: Maybe<Enum_Componentnewextractedresources_Kindof>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  quantityEst?: Maybe<Scalars['Float']['output']>;
};


export type ComponentNewExtractedResourcesMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ComponentNewExtractedResourcesFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewExtractedResourcesFiltersInput>>>;
  importance?: InputMaybe<StringFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentNewExtractedResourcesFiltersInput>;
  notes?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewExtractedResourcesFiltersInput>>>;
  quantityEst?: InputMaybe<FloatFilterInput>;
};

export type ComponentNewExtractedResourcesInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  importance?: InputMaybe<Enum_Componentnewextractedresources_Importance>;
  kindOf?: InputMaybe<Enum_Componentnewextractedresources_Kindof>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  quantityEst?: InputMaybe<Scalars['Float']['input']>;
};

export type ComponentNewLocation = {
  __typename?: 'ComponentNewLocation';
  id: Scalars['ID']['output'];
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  location_hint?: Maybe<Scalars['String']['output']>;
  location_mode?: Maybe<Enum_Componentnewlocation_Location_Mode>;
  radius?: Maybe<Scalars['Long']['output']>;
};

export type ComponentNewLocationFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewLocationFiltersInput>>>;
  lat?: InputMaybe<FloatFilterInput>;
  lng?: InputMaybe<FloatFilterInput>;
  location_hint?: InputMaybe<StringFilterInput>;
  location_mode?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentNewLocationFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewLocationFiltersInput>>>;
  radius?: InputMaybe<LongFilterInput>;
};

export type ComponentNewLocationInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  location_hint?: InputMaybe<Scalars['String']['input']>;
  location_mode?: InputMaybe<Enum_Componentnewlocation_Location_Mode>;
  radius?: InputMaybe<Scalars['Long']['input']>;
};

export type ComponentNewMeeting = {
  __typename?: 'ComponentNewMeeting';
  available?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ComponentNewMeetingFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewMeetingFiltersInput>>>;
  available?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<ComponentNewMeetingFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewMeetingFiltersInput>>>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ComponentNewMeetingInput = {
  available?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentNewMonter = {
  __typename?: 'ComponentNewMonter';
  finnished_mission?: Maybe<FinnishedMissionEntityResponse>;
  hours?: Maybe<Scalars['Float']['output']>;
  hoursDone?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  isDone?: Maybe<Scalars['Boolean']['output']>;
  monthStart?: Maybe<Scalars['Date']['output']>;
};

export type ComponentNewMonterFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewMonterFiltersInput>>>;
  finnished_mission?: InputMaybe<FinnishedMissionFiltersInput>;
  hours?: InputMaybe<FloatFilterInput>;
  hoursDone?: InputMaybe<FloatFilterInput>;
  isDone?: InputMaybe<BooleanFilterInput>;
  monthStart?: InputMaybe<DateFilterInput>;
  not?: InputMaybe<ComponentNewMonterFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewMonterFiltersInput>>>;
};

export type ComponentNewMonterInput = {
  finnished_mission?: InputMaybe<Scalars['ID']['input']>;
  hours?: InputMaybe<Scalars['Float']['input']>;
  hoursDone?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isDone?: InputMaybe<Scalars['Boolean']['input']>;
  monthStart?: InputMaybe<Scalars['Date']['input']>;
};

export type ComponentNewNego = {
  __typename?: 'ComponentNewNego';
  dates?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  ide?: Maybe<Scalars['Int']['output']>;
  isOriginal?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  perhour?: Maybe<Scalars['Float']['output']>;
  skills?: Maybe<SkillRelationResponseCollection>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  tafkidim?: Maybe<TafkidimEntityResponse>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  work_way?: Maybe<WorkWayEntityResponse>;
};


export type ComponentNewNegoSkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ComponentNewNegoFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewNegoFiltersInput>>>;
  dates?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  hearotMeyuchadot?: InputMaybe<StringFilterInput>;
  ide?: InputMaybe<IntFilterInput>;
  isOriginal?: InputMaybe<BooleanFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<ComponentNewNegoFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewNegoFiltersInput>>>;
  perhour?: InputMaybe<FloatFilterInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  tafkidim?: InputMaybe<TafkidimFiltersInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  work_way?: InputMaybe<WorkWayFiltersInput>;
};

export type ComponentNewNegoInput = {
  dates?: InputMaybe<Scalars['DateTime']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  ide?: InputMaybe<Scalars['Int']['input']>;
  isOriginal?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  tafkidim?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  work_way?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentNewNegom = {
  __typename?: 'ComponentNewNegom';
  descrip?: Maybe<Scalars['String']['output']>;
  easy?: Maybe<Scalars['Float']['output']>;
  hm?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  kindOf?: Maybe<Enum_Componentnewnegom_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  spnot?: Maybe<Scalars['String']['output']>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualedf?: Maybe<Scalars['DateTime']['output']>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type ComponentNewNegomVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ComponentNewNegomFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewNegomFiltersInput>>>;
  descrip?: InputMaybe<StringFilterInput>;
  easy?: InputMaybe<FloatFilterInput>;
  hm?: InputMaybe<FloatFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentNewNegomFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewNegomFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualedf?: InputMaybe<DateTimeFilterInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type ComponentNewNegomInput = {
  descrip?: InputMaybe<Scalars['String']['input']>;
  easy?: InputMaybe<Scalars['Float']['input']>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  kindOf?: InputMaybe<Enum_Componentnewnegom_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  sqadualedf?: InputMaybe<Scalars['DateTime']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type ComponentNewSeen = {
  __typename?: 'ComponentNewSeen';
  id: Scalars['ID']['output'];
  seenBy?: Maybe<Scalars['Boolean']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ComponentNewSeenFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewSeenFiltersInput>>>;
  not?: InputMaybe<ComponentNewSeenFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewSeenFiltersInput>>>;
  seenBy?: InputMaybe<BooleanFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ComponentNewSeenInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  seenBy?: InputMaybe<Scalars['Boolean']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentNewTimes = {
  __typename?: 'ComponentNewTimes';
  id: Scalars['ID']['output'];
  start?: Maybe<Scalars['DateTime']['output']>;
  stop?: Maybe<Scalars['DateTime']['output']>;
};

export type ComponentNewTimesFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewTimesFiltersInput>>>;
  not?: InputMaybe<ComponentNewTimesFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewTimesFiltersInput>>>;
  start?: InputMaybe<DateTimeFilterInput>;
  stop?: InputMaybe<DateTimeFilterInput>;
};

export type ComponentNewTimesInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
  stop?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ComponentNewUserAndIshur = {
  __typename?: 'ComponentNewUserAndIshur';
  appruved?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ComponentNewUserAndIshurFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentNewUserAndIshurFiltersInput>>>;
  appruved?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<ComponentNewUserAndIshurFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewUserAndIshurFiltersInput>>>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ComponentNewUserAndIshurInput = {
  appruved?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentNewWillingnessEntries = {
  __typename?: 'ComponentNewWillingnessEntries';
  agree?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  item_idx?: Maybe<Scalars['Int']['output']>;
  item_kind?: Maybe<Enum_Componentnewwillingnessentries_Item_Kind>;
  note?: Maybe<Scalars['String']['output']>;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<UsersPermissionsUserEntityResponse>;
  willingAmount?: Maybe<Scalars['Float']['output']>;
  willingHours?: Maybe<Scalars['Float']['output']>;
};

export type ComponentNewWillingnessEntriesFiltersInput = {
  agree?: InputMaybe<BooleanFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ComponentNewWillingnessEntriesFiltersInput>>>;
  item_idx?: InputMaybe<IntFilterInput>;
  item_kind?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentNewWillingnessEntriesFiltersInput>;
  note?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentNewWillingnessEntriesFiltersInput>>>;
  submittedAt?: InputMaybe<DateTimeFilterInput>;
  user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  willingAmount?: InputMaybe<FloatFilterInput>;
  willingHours?: InputMaybe<FloatFilterInput>;
};

export type ComponentNewWillingnessEntriesInput = {
  agree?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  item_idx?: InputMaybe<Scalars['Int']['input']>;
  item_kind?: InputMaybe<Enum_Componentnewwillingnessentries_Item_Kind>;
  note?: InputMaybe<Scalars['String']['input']>;
  submittedAt?: InputMaybe<Scalars['DateTime']['input']>;
  user?: InputMaybe<Scalars['ID']['input']>;
  willingAmount?: InputMaybe<Scalars['Float']['input']>;
  willingHours?: InputMaybe<Scalars['Float']['input']>;
};

export type ComponentProjectsChatre = {
  __typename?: 'ComponentProjectsChatre';
  freetext?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  seen?: Maybe<Scalars['Boolean']['output']>;
  send?: Maybe<UsersPermissionsUserEntityResponse>;
  when?: Maybe<Scalars['DateTime']['output']>;
};

export type ComponentProjectsChatreFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsChatreFiltersInput>>>;
  freetext?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentProjectsChatreFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsChatreFiltersInput>>>;
  seen?: InputMaybe<BooleanFilterInput>;
  send?: InputMaybe<UsersPermissionsUserFiltersInput>;
  when?: InputMaybe<DateTimeFilterInput>;
};

export type ComponentProjectsChatreInput = {
  freetext?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  seen?: InputMaybe<Scalars['Boolean']['input']>;
  send?: InputMaybe<Scalars['ID']['input']>;
  when?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ComponentProjectsConsumedMashabetahalichDeliveries = {
  __typename?: 'ComponentProjectsConsumedMashabetahalichDeliveries';
  id: Scalars['ID']['output'];
  maap?: Maybe<MaapEntityResponse>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  quantity?: Maybe<Scalars['Float']['output']>;
};

export type ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput>>>;
  maap?: InputMaybe<MaapFiltersInput>;
  mashabetahalich?: InputMaybe<MashabetahalichFiltersInput>;
  not?: InputMaybe<ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput>>>;
  quantity?: InputMaybe<FloatFilterInput>;
};

export type ComponentProjectsConsumedMashabetahalichDeliveriesInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  maap?: InputMaybe<Scalars['ID']['input']>;
  mashabetahalich?: InputMaybe<Scalars['ID']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
};

export type ComponentProjectsConsumedMissionHours = {
  __typename?: 'ComponentProjectsConsumedMissionHours';
  hours?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
};

export type ComponentProjectsConsumedMissionHoursFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>>>;
  hours?: InputMaybe<FloatFilterInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>>>;
};

export type ComponentProjectsConsumedMissionHoursInput = {
  hours?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentProjectsConsumedOpenMu = {
  __typename?: 'ComponentProjectsConsumedOpenMu';
  id: Scalars['ID']['output'];
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  units?: Maybe<Scalars['Float']['output']>;
};

export type ComponentProjectsConsumedOpenMuFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>>>;
  not?: InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>>>;
  units?: InputMaybe<FloatFilterInput>;
};

export type ComponentProjectsConsumedOpenMuInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  units?: InputMaybe<Scalars['Float']['input']>;
};

export type ComponentProjectsDeliveries = {
  __typename?: 'ComponentProjectsDeliveries';
  confirmedBy?: Maybe<UsersPermissionsUserEntityResponse>;
  cycleIndex?: Maybe<Scalars['Int']['output']>;
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  maap?: Maybe<MaapEntityResponse>;
  note?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['Float']['output']>;
  sheirut_fulfillment?: Maybe<SheirutFulfillmentEntityResponse>;
};

export type ComponentProjectsDeliveriesFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsDeliveriesFiltersInput>>>;
  confirmedBy?: InputMaybe<UsersPermissionsUserFiltersInput>;
  cycleIndex?: InputMaybe<IntFilterInput>;
  deliveredAt?: InputMaybe<DateTimeFilterInput>;
  maap?: InputMaybe<MaapFiltersInput>;
  not?: InputMaybe<ComponentProjectsDeliveriesFiltersInput>;
  note?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsDeliveriesFiltersInput>>>;
  quantity?: InputMaybe<FloatFilterInput>;
  sheirut_fulfillment?: InputMaybe<SheirutFulfillmentFiltersInput>;
};

export type ComponentProjectsDeliveriesInput = {
  confirmedBy?: InputMaybe<Scalars['ID']['input']>;
  cycleIndex?: InputMaybe<Scalars['Int']['input']>;
  deliveredAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  maap?: InputMaybe<Scalars['ID']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
  sheirut_fulfillment?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentProjectsHervachti = {
  __typename?: 'ComponentProjectsHervachti';
  amount?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  matbea?: Maybe<MatbeaEntityResponse>;
  mekabel?: Maybe<Scalars['Boolean']['output']>;
  nirsham?: Maybe<Scalars['Boolean']['output']>;
  noten?: Maybe<Scalars['Boolean']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ComponentProjectsHervachtiFiltersInput = {
  amount?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsHervachtiFiltersInput>>>;
  matbea?: InputMaybe<MatbeaFiltersInput>;
  mekabel?: InputMaybe<BooleanFilterInput>;
  nirsham?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<ComponentProjectsHervachtiFiltersInput>;
  noten?: InputMaybe<BooleanFilterInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsHervachtiFiltersInput>>>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ComponentProjectsHervachtiInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  matbea?: InputMaybe<Scalars['ID']['input']>;
  mekabel?: InputMaybe<Scalars['Boolean']['input']>;
  nirsham?: InputMaybe<Scalars['Boolean']['input']>;
  noten?: InputMaybe<Scalars['Boolean']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentProjectsIGotMoney = {
  __typename?: 'ComponentProjectsIGotMoney';
  iGotMoney?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ComponentProjectsIGotMoneyFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyFiltersInput>>>;
  iGotMoney?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<ComponentProjectsIGotMoneyFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyFiltersInput>>>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ComponentProjectsIGotMoneyInput = {
  iGotMoney?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentProjectsMeeting = {
  __typename?: 'ComponentProjectsMeeting';
  available?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ComponentProjectsMonter = {
  __typename?: 'ComponentProjectsMonter';
  finnished_mission?: Maybe<FinnishedMissionEntityResponse>;
  hours?: Maybe<Scalars['Float']['output']>;
  hoursdon?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  isDone?: Maybe<Scalars['Boolean']['output']>;
  monthStart?: Maybe<Scalars['Date']['output']>;
};

export type ComponentProjectsNegodes = {
  __typename?: 'ComponentProjectsNegodes';
  des?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  newHours?: Maybe<Scalars['Int']['output']>;
  pic?: Maybe<UploadFileEntityResponse>;
  rechdes?: Maybe<Scalars['String']['output']>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type ComponentProjectsNegodesVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ComponentProjectsNegodesFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsNegodesFiltersInput>>>;
  des?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  newHours?: InputMaybe<IntFilterInput>;
  not?: InputMaybe<ComponentProjectsNegodesFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsNegodesFiltersInput>>>;
  rechdes?: InputMaybe<StringFilterInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type ComponentProjectsNegodesInput = {
  des?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  newHours?: InputMaybe<Scalars['Int']['input']>;
  pic?: InputMaybe<Scalars['ID']['input']>;
  rechdes?: InputMaybe<Scalars['String']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type ComponentProjectsPendmnego = {
  __typename?: 'ComponentProjectsPendmnego';
  id: Scalars['ID']['output'];
  ide?: Maybe<Scalars['Int']['output']>;
  negopendmission?: Maybe<NegopendmissionEntityResponse>;
  order?: Maybe<Scalars['Int']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  what?: Maybe<Scalars['Boolean']['output']>;
  why?: Maybe<Scalars['String']['output']>;
  zman?: Maybe<Scalars['DateTime']['output']>;
};

export type ComponentProjectsPendmnegoFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsPendmnegoFiltersInput>>>;
  ide?: InputMaybe<IntFilterInput>;
  negopendmission?: InputMaybe<NegopendmissionFiltersInput>;
  not?: InputMaybe<ComponentProjectsPendmnegoFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsPendmnegoFiltersInput>>>;
  order?: InputMaybe<IntFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  what?: InputMaybe<BooleanFilterInput>;
  why?: InputMaybe<StringFilterInput>;
  zman?: InputMaybe<DateTimeFilterInput>;
};

export type ComponentProjectsPendmnegoInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  ide?: InputMaybe<Scalars['Int']['input']>;
  negopendmission?: InputMaybe<Scalars['ID']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  what?: InputMaybe<Scalars['Boolean']['input']>;
  why?: InputMaybe<Scalars['String']['input']>;
  zman?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ComponentProjectsShift = {
  __typename?: 'ComponentProjectsShift';
  finnish?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  noofp?: Maybe<Scalars['Int']['output']>;
  sidur?: Maybe<SidurEntityResponse>;
  start?: Maybe<Scalars['DateTime']['output']>;
  taken?: Maybe<Scalars['Boolean']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ComponentProjectsTaskdis = {
  __typename?: 'ComponentProjectsTaskdis';
  id: Scalars['ID']['output'];
  myWhy?: Maybe<Scalars['String']['output']>;
  valiWhy?: Maybe<Scalars['String']['output']>;
};

export type ComponentProjectsTaskdisFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsTaskdisFiltersInput>>>;
  myWhy?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentProjectsTaskdisFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsTaskdisFiltersInput>>>;
  valiWhy?: InputMaybe<StringFilterInput>;
};

export type ComponentProjectsTaskdisInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  myWhy?: InputMaybe<Scalars['String']['input']>;
  valiWhy?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentProjectsUsersOf = {
  __typename?: 'ComponentProjectsUsersOf';
  finnished_mission?: Maybe<FinnishedMissionEntityResponse>;
  id: Scalars['ID']['output'];
  joined?: Maybe<Scalars['Date']['output']>;
  mesimabetahaliche?: Maybe<MesimabetahalichEntityResponse>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  why?: Maybe<Scalars['String']['output']>;
};

export type ComponentProjectsUsersOfFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsUsersOfFiltersInput>>>;
  finnished_mission?: InputMaybe<FinnishedMissionFiltersInput>;
  joined?: InputMaybe<DateFilterInput>;
  mesimabetahaliche?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<ComponentProjectsUsersOfFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsUsersOfFiltersInput>>>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  why?: InputMaybe<StringFilterInput>;
};

export type ComponentProjectsUsersOfInput = {
  finnished_mission?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  joined?: InputMaybe<Scalars['Date']['input']>;
  mesimabetahaliche?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  why?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentProjectsVots = {
  __typename?: 'ComponentProjectsVots';
  id: Scalars['ID']['output'];
  ide?: Maybe<Scalars['Int']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  what?: Maybe<Scalars['Boolean']['output']>;
  why?: Maybe<Scalars['String']['output']>;
  zman?: Maybe<Scalars['DateTime']['output']>;
};

export type ComponentProjectsVotsFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsFiltersInput>>>;
  ide?: InputMaybe<IntFilterInput>;
  not?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsFiltersInput>>>;
  order?: InputMaybe<IntFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  what?: InputMaybe<BooleanFilterInput>;
  why?: InputMaybe<StringFilterInput>;
  zman?: InputMaybe<DateTimeFilterInput>;
};

export type ComponentProjectsVotsInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  ide?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  what?: InputMaybe<Scalars['Boolean']['input']>;
  why?: InputMaybe<Scalars['String']['input']>;
  zman?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ContentReleasesRelease = {
  __typename?: 'ContentReleasesRelease';
  actions?: Maybe<ContentReleasesReleaseActionRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  releasedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type ContentReleasesReleaseActionsArgs = {
  filters?: InputMaybe<ContentReleasesReleaseActionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ContentReleasesReleaseAction = {
  __typename?: 'ContentReleasesReleaseAction';
  contentType: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  entry?: Maybe<GenericMorph>;
  locale?: Maybe<Scalars['String']['output']>;
  release?: Maybe<ContentReleasesReleaseEntityResponse>;
  type: Enum_Contentreleasesreleaseaction_Type;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ContentReleasesReleaseActionEntity = {
  __typename?: 'ContentReleasesReleaseActionEntity';
  attributes?: Maybe<ContentReleasesReleaseAction>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ContentReleasesReleaseActionEntityResponse = {
  __typename?: 'ContentReleasesReleaseActionEntityResponse';
  data?: Maybe<ContentReleasesReleaseActionEntity>;
};

export type ContentReleasesReleaseActionEntityResponseCollection = {
  __typename?: 'ContentReleasesReleaseActionEntityResponseCollection';
  data: Array<ContentReleasesReleaseActionEntity>;
  meta: ResponseCollectionMeta;
};

export type ContentReleasesReleaseActionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ContentReleasesReleaseActionFiltersInput>>>;
  contentType?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ContentReleasesReleaseActionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ContentReleasesReleaseActionFiltersInput>>>;
  release?: InputMaybe<ContentReleasesReleaseFiltersInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ContentReleasesReleaseActionInput = {
  contentType?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  release?: InputMaybe<Scalars['ID']['input']>;
  type?: InputMaybe<Enum_Contentreleasesreleaseaction_Type>;
};

export type ContentReleasesReleaseActionRelationResponseCollection = {
  __typename?: 'ContentReleasesReleaseActionRelationResponseCollection';
  data: Array<ContentReleasesReleaseActionEntity>;
};

export type ContentReleasesReleaseEntity = {
  __typename?: 'ContentReleasesReleaseEntity';
  attributes?: Maybe<ContentReleasesRelease>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ContentReleasesReleaseEntityResponse = {
  __typename?: 'ContentReleasesReleaseEntityResponse';
  data?: Maybe<ContentReleasesReleaseEntity>;
};

export type ContentReleasesReleaseEntityResponseCollection = {
  __typename?: 'ContentReleasesReleaseEntityResponseCollection';
  data: Array<ContentReleasesReleaseEntity>;
  meta: ResponseCollectionMeta;
};

export type ContentReleasesReleaseFiltersInput = {
  actions?: InputMaybe<ContentReleasesReleaseActionFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<ContentReleasesReleaseFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ContentReleasesReleaseFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ContentReleasesReleaseFiltersInput>>>;
  releasedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ContentReleasesReleaseInput = {
  actions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  releasedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ConventionText = {
  __typename?: 'ConventionText';
  conventionText?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<ConventionTextRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type ConventionTextLocalizationsArgs = {
  filters?: InputMaybe<ConventionTextFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ConventionTextEntity = {
  __typename?: 'ConventionTextEntity';
  attributes?: Maybe<ConventionText>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ConventionTextEntityResponse = {
  __typename?: 'ConventionTextEntityResponse';
  data?: Maybe<ConventionTextEntity>;
};

export type ConventionTextEntityResponseCollection = {
  __typename?: 'ConventionTextEntityResponseCollection';
  data: Array<ConventionTextEntity>;
  meta: ResponseCollectionMeta;
};

export type ConventionTextFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ConventionTextFiltersInput>>>;
  conventionText?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<ConventionTextFiltersInput>;
  not?: InputMaybe<ConventionTextFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ConventionTextFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ConventionTextInput = {
  conventionText?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type ConventionTextRelationResponseCollection = {
  __typename?: 'ConventionTextRelationResponseCollection';
  data: Array<ConventionTextEntity>;
};

export type Cuntry = {
  __typename?: 'Cuntry';
  alpha2?: Maybe<Scalars['String']['output']>;
  alpha3?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deffinitions?: Maybe<DeffinitionRelationResponseCollection>;
  flug?: Maybe<UploadFileRelationResponseCollection>;
  free_people?: Maybe<ChezinRelationResponseCollection>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<CuntryRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  negotiations?: Maybe<NegotiationRelationResponseCollection>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  signingNumber?: Maybe<Scalars['Long']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type CuntryDeffinitionsArgs = {
  filters?: InputMaybe<DeffinitionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CuntryFlugArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CuntryFree_PeopleArgs = {
  filters?: InputMaybe<ChezinFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CuntryLocalizationsArgs = {
  filters?: InputMaybe<CuntryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CuntryNegotiationsArgs = {
  filters?: InputMaybe<NegotiationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CuntryProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CuntryUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type CuntryEntity = {
  __typename?: 'CuntryEntity';
  attributes?: Maybe<Cuntry>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type CuntryEntityResponse = {
  __typename?: 'CuntryEntityResponse';
  data?: Maybe<CuntryEntity>;
};

export type CuntryEntityResponseCollection = {
  __typename?: 'CuntryEntityResponseCollection';
  data: Array<CuntryEntity>;
  meta: ResponseCollectionMeta;
};

export type CuntryFiltersInput = {
  alpha2?: InputMaybe<StringFilterInput>;
  alpha3?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<CuntryFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  deffinitions?: InputMaybe<DeffinitionFiltersInput>;
  free_people?: InputMaybe<ChezinFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<CuntryFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  negotiations?: InputMaybe<NegotiationFiltersInput>;
  not?: InputMaybe<CuntryFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<CuntryFiltersInput>>>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  signingNumber?: InputMaybe<LongFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type CuntryInput = {
  alpha2?: InputMaybe<Scalars['String']['input']>;
  alpha3?: InputMaybe<Scalars['String']['input']>;
  deffinitions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  flug?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  free_people?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  negotiations?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  signingNumber?: InputMaybe<Scalars['Long']['input']>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type CuntryRelationResponseCollection = {
  __typename?: 'CuntryRelationResponseCollection';
  data: Array<CuntryEntity>;
};

export type DateFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  contains?: InputMaybe<Scalars['Date']['input']>;
  containsi?: InputMaybe<Scalars['Date']['input']>;
  endsWith?: InputMaybe<Scalars['Date']['input']>;
  eq?: InputMaybe<Scalars['Date']['input']>;
  eqi?: InputMaybe<Scalars['Date']['input']>;
  gt?: InputMaybe<Scalars['Date']['input']>;
  gte?: InputMaybe<Scalars['Date']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  lt?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
  ne?: InputMaybe<Scalars['Date']['input']>;
  nei?: InputMaybe<Scalars['Date']['input']>;
  not?: InputMaybe<DateFilterInput>;
  notContains?: InputMaybe<Scalars['Date']['input']>;
  notContainsi?: InputMaybe<Scalars['Date']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  startsWith?: InputMaybe<Scalars['Date']['input']>;
};

export type DateTimeFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  contains?: InputMaybe<Scalars['DateTime']['input']>;
  containsi?: InputMaybe<Scalars['DateTime']['input']>;
  endsWith?: InputMaybe<Scalars['DateTime']['input']>;
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  eqi?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  ne?: InputMaybe<Scalars['DateTime']['input']>;
  nei?: InputMaybe<Scalars['DateTime']['input']>;
  not?: InputMaybe<DateTimeFilterInput>;
  notContains?: InputMaybe<Scalars['DateTime']['input']>;
  notContainsi?: InputMaybe<Scalars['DateTime']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  startsWith?: InputMaybe<Scalars['DateTime']['input']>;
};

export type Dea = {
  __typename?: 'Dea';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  desc?: Maybe<Scalars['JSON']['output']>;
  head?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  solutions?: Maybe<SolutionRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  votes?: Maybe<VoteRelationResponseCollection>;
};


export type DeaSolutionsArgs = {
  filters?: InputMaybe<SolutionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DeaVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type DeaEntity = {
  __typename?: 'DeaEntity';
  attributes?: Maybe<Dea>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type DeaEntityResponse = {
  __typename?: 'DeaEntityResponse';
  data?: Maybe<DeaEntity>;
};

export type DeaEntityResponseCollection = {
  __typename?: 'DeaEntityResponseCollection';
  data: Array<DeaEntity>;
  meta: ResponseCollectionMeta;
};

export type DeaFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<DeaFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  desc?: InputMaybe<JsonFilterInput>;
  head?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<DeaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<DeaFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  solutions?: InputMaybe<SolutionFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  votes?: InputMaybe<VoteFiltersInput>;
};

export type DeaInput = {
  desc?: InputMaybe<Scalars['JSON']['input']>;
  head?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  solutions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type DeaRelationResponseCollection = {
  __typename?: 'DeaRelationResponseCollection';
  data: Array<DeaEntity>;
};

export type Deal = {
  __typename?: 'Deal';
  costumers?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  salers?: Maybe<ProjectRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type DealCostumersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DealSalersArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type DealEntity = {
  __typename?: 'DealEntity';
  attributes?: Maybe<Deal>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type DealEntityResponse = {
  __typename?: 'DealEntityResponse';
  data?: Maybe<DealEntity>;
};

export type DealEntityResponseCollection = {
  __typename?: 'DealEntityResponseCollection';
  data: Array<DealEntity>;
  meta: ResponseCollectionMeta;
};

export type DealFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<DealFiltersInput>>>;
  costumers?: InputMaybe<UsersPermissionsUserFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<DealFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<DealFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  salers?: InputMaybe<ProjectFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type DealInput = {
  costumers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  salers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type DealRelationResponseCollection = {
  __typename?: 'DealRelationResponseCollection';
  data: Array<DealEntity>;
};

export type Decision = {
  __typename?: 'Decision';
  archived: Scalars['Boolean']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  decisionName?: Maybe<Scalars['String']['output']>;
  discord?: Maybe<Scalars['String']['output']>;
  drive?: Maybe<Scalars['String']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  github?: Maybe<Scalars['String']['output']>;
  kind?: Maybe<Enum_Decision_Kind>;
  matanot?: Maybe<MatanotEntityResponse>;
  moreHours?: Maybe<MesimabetahalichEntityResponse>;
  negodes?: Maybe<Array<Maybe<ComponentProjectsNegodes>>>;
  newFlink?: Maybe<Scalars['String']['output']>;
  newHours?: Maybe<Scalars['Int']['output']>;
  newWlink?: Maybe<Scalars['String']['output']>;
  newname?: Maybe<Scalars['String']['output']>;
  newpic?: Maybe<UploadFileEntityResponse>;
  newprides?: Maybe<Scalars['String']['output']>;
  newpubdes?: Maybe<Scalars['String']['output']>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  timtoM?: Maybe<Scalars['String']['output']>;
  twitter?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  valluesadd?: Maybe<VallueRelationResponseCollection>;
  valluesles?: Maybe<VallueRelationResponseCollection>;
  votes?: Maybe<VoteRelationResponseCollection>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  whatsapp?: Maybe<Scalars['String']['output']>;
};


export type DecisionForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DecisionNegodesArgs = {
  filters?: InputMaybe<ComponentProjectsNegodesFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DecisionProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DecisionValluesaddArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DecisionVallueslesArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DecisionVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DecisionVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type DecisionEntity = {
  __typename?: 'DecisionEntity';
  attributes?: Maybe<Decision>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type DecisionEntityResponse = {
  __typename?: 'DecisionEntityResponse';
  data?: Maybe<DecisionEntity>;
};

export type DecisionEntityResponseCollection = {
  __typename?: 'DecisionEntityResponseCollection';
  data: Array<DecisionEntity>;
  meta: ResponseCollectionMeta;
};

export type DecisionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<DecisionFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  decisionName?: InputMaybe<StringFilterInput>;
  discord?: InputMaybe<StringFilterInput>;
  drive?: InputMaybe<StringFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  github?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kind?: InputMaybe<StringFilterInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  moreHours?: InputMaybe<MesimabetahalichFiltersInput>;
  negodes?: InputMaybe<ComponentProjectsNegodesFiltersInput>;
  newFlink?: InputMaybe<StringFilterInput>;
  newHours?: InputMaybe<IntFilterInput>;
  newWlink?: InputMaybe<StringFilterInput>;
  newname?: InputMaybe<StringFilterInput>;
  newprides?: InputMaybe<StringFilterInput>;
  newpubdes?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<DecisionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<DecisionFiltersInput>>>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  timtoM?: InputMaybe<StringFilterInput>;
  twitter?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  valluesadd?: InputMaybe<VallueFiltersInput>;
  valluesles?: InputMaybe<VallueFiltersInput>;
  votes?: InputMaybe<VoteFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  whatsapp?: InputMaybe<StringFilterInput>;
};

export type DecisionInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  decisionName?: InputMaybe<Scalars['String']['input']>;
  discord?: InputMaybe<Scalars['String']['input']>;
  drive?: InputMaybe<Scalars['String']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  github?: InputMaybe<Scalars['String']['input']>;
  kind?: InputMaybe<Enum_Decision_Kind>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  moreHours?: InputMaybe<Scalars['ID']['input']>;
  negodes?: InputMaybe<Array<InputMaybe<ComponentProjectsNegodesInput>>>;
  newFlink?: InputMaybe<Scalars['String']['input']>;
  newHours?: InputMaybe<Scalars['Int']['input']>;
  newWlink?: InputMaybe<Scalars['String']['input']>;
  newname?: InputMaybe<Scalars['String']['input']>;
  newpic?: InputMaybe<Scalars['ID']['input']>;
  newprides?: InputMaybe<Scalars['String']['input']>;
  newpubdes?: InputMaybe<Scalars['String']['input']>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  timtoM?: InputMaybe<Scalars['String']['input']>;
  twitter?: InputMaybe<Scalars['String']['input']>;
  valluesadd?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  valluesles?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  whatsapp?: InputMaybe<Scalars['String']['input']>;
};

export type DecisionRelationResponseCollection = {
  __typename?: 'DecisionRelationResponseCollection';
  data: Array<DecisionEntity>;
};

export type Deffinition = {
  __typename?: 'Deffinition';
  countries?: Maybe<CuntryRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deffinitionName: Scalars['String']['output'];
  free_people?: Maybe<ChezinRelationResponseCollection>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<DeffinitionRelationResponseCollection>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type DeffinitionCountriesArgs = {
  filters?: InputMaybe<CuntryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DeffinitionFree_PeopleArgs = {
  filters?: InputMaybe<ChezinFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DeffinitionLocalizationsArgs = {
  filters?: InputMaybe<DeffinitionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DeffinitionProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type DeffinitionEntity = {
  __typename?: 'DeffinitionEntity';
  attributes?: Maybe<Deffinition>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type DeffinitionEntityResponse = {
  __typename?: 'DeffinitionEntityResponse';
  data?: Maybe<DeffinitionEntity>;
};

export type DeffinitionEntityResponseCollection = {
  __typename?: 'DeffinitionEntityResponseCollection';
  data: Array<DeffinitionEntity>;
  meta: ResponseCollectionMeta;
};

export type DeffinitionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<DeffinitionFiltersInput>>>;
  countries?: InputMaybe<CuntryFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  deffinitionName?: InputMaybe<StringFilterInput>;
  free_people?: InputMaybe<ChezinFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<DeffinitionFiltersInput>;
  not?: InputMaybe<DeffinitionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<DeffinitionFiltersInput>>>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type DeffinitionInput = {
  countries?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  deffinitionName?: InputMaybe<Scalars['String']['input']>;
  free_people?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type DeffinitionRelationResponseCollection = {
  __typename?: 'DeffinitionRelationResponseCollection';
  data: Array<DeffinitionEntity>;
};

export enum Enum_Act_Hashivut {
  Green = 'green',
  Red = 'red',
  White = 'white',
  Yellow = 'yellow'
}

export enum Enum_Argument_Authortype {
  Charter = 'charter',
  Guest = 'guest',
  Registered = 'registered'
}

export enum Enum_Argument_Stance {
  Con = 'con',
  Pro = 'pro'
}

export enum Enum_Clause_Authortype {
  Charter = 'charter',
  Guest = 'guest',
  Registered = 'registered'
}

export enum Enum_Clause_Origin {
  Ai = 'ai',
  Human = 'human'
}

export enum Enum_Componentdesisionnegom_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Componentnewextractedmissions_Importance {
  Must = 'must',
  Nice = 'nice'
}

export enum Enum_Componentnewextractedresources_Importance {
  Must = 'must',
  Nice = 'nice'
}

export enum Enum_Componentnewextractedresources_Kindof {
  Monthly = 'monthly',
  Total = 'total',
  Unlimited = 'unlimited',
  Yearly = 'yearly'
}

export enum Enum_Componentnewlocation_Location_Mode {
  Hybrid = 'hybrid',
  Online = 'online',
  Onsite = 'onsite',
  Unspecified = 'unspecified'
}

export enum Enum_Componentnewnegom_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Yearly = 'yearly'
}

export enum Enum_Componentnewwillingnessentries_Item_Kind {
  CoveredMission = 'covered_mission',
  CoveredResource = 'covered_resource',
  Proposal = 'proposal'
}

export enum Enum_Contentreleasesreleaseaction_Type {
  Publish = 'publish',
  Unpublish = 'unpublish'
}

export enum Enum_Decision_Kind {
  Discord = 'discord',
  Drive = 'drive',
  Github = 'github',
  Name = 'name',
  NewFlink = 'newFlink',
  NewWlink = 'newWlink',
  PendMatana = 'pendMatana',
  Pic = 'pic',
  Prides = 'prides',
  Pubdes = 'pubdes',
  TimtoM = 'timtoM',
  Twitter = 'twitter',
  Vallueadd = 'vallueadd',
  Vallueles = 'vallueles',
  Whatsapp = 'whatsapp'
}

export enum Enum_Forum_Spec {
  General = 'general',
  Spesifica = 'spesifica',
  Spesificm = 'spesificm'
}

export enum Enum_Haluka_Adjustdirection {
  AsIs = 'as_is',
  Less = 'less',
  More = 'more'
}

export enum Enum_Issue_Origin {
  Ai = 'ai',
  Human = 'human'
}

export enum Enum_Maap_Unit {
  Day = 'day',
  Hour = 'hour',
  Month = 'month',
  Unit = 'unit',
  Week = 'week',
  Year = 'year'
}

export enum Enum_Mashaabim_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Mashabetahalich_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Mashabetahalich_Status_Mashab {
  Active = 'active',
  Cancelled = 'cancelled',
  Closed = 'closed',
  Draft = 'draft',
  Paused = 'paused'
}

export enum Enum_Mashabetahalich_Unit {
  Day = 'day',
  Hour = 'hour',
  Month = 'month',
  Unit = 'unit',
  Week = 'week',
  Year = 'year'
}

export enum Enum_Matanotpend_Status_Pend {
  Approved = 'approved',
  Expired = 'expired',
  Open = 'open',
  Rejected = 'rejected'
}

export enum Enum_Matanotrecipemission_Mode {
  ConsumeExisting = 'consumeExisting',
  CreateNew = 'createNew'
}

export enum Enum_Matanotreciperesource_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Matanotreciperesource_Mode {
  ConsumeExisting = 'consumeExisting',
  CreateNew = 'createNew',
  ReuseSp = 'reuseSp'
}

export enum Enum_Matanot_Kindof {
  Daily = 'daily',
  Monthly = 'monthly',
  Total = 'total',
  Unlimited = 'unlimited',
  Yearly = 'yearly'
}

export enum Enum_Matanot_Pricingmode {
  Estimated = 'estimated',
  Fixed = 'fixed',
  Quote = 'quote'
}

export enum Enum_Matanot_Status_Of_Voting {
  Active = 'active',
  Archived = 'archived',
  Draft = 'draft',
  Voting = 'voting'
}

export enum Enum_Mission_Kindof {
  Admin = 'admin',
  Creative = 'creative',
  Digital = 'digital',
  Other = 'other',
  Physical = 'physical',
  SkillTask = 'skill_task'
}

export enum Enum_Negomash_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Negomash_Proposedby {
  Candidate = 'candidate',
  Project = 'project'
}

export enum Enum_Negomash_Status {
  Accepted = 'accepted',
  Countered = 'countered',
  Proposed = 'proposed',
  Rejected = 'rejected',
  Withdrawn = 'withdrawn'
}

export enum Enum_Negopendmission_Proposedby {
  Candidate = 'candidate',
  Project = 'project'
}

export enum Enum_Negopendmission_Status {
  Accepted = 'accepted',
  Countered = 'countered',
  Proposed = 'proposed',
  Rejected = 'rejected',
  Withdrawn = 'withdrawn'
}

export enum Enum_Negotiation_Status {
  Active = 'active',
  Completed = 'completed',
  Paused = 'paused'
}

export enum Enum_Negotiation_Visibility {
  Local = 'local',
  Private = 'private',
  Unlisted = 'unlisted'
}

export enum Enum_Nego_Kindof {
  Daily = 'daily',
  Monthly = 'monthly',
  Total = 'total',
  Unlimited = 'unlimited',
  Yearly = 'yearly'
}

export enum Enum_Openmashaabim_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Openmashaabim_Source {
  Concierge = 'concierge',
  Project = 'project'
}

export enum Enum_Openmission_Source {
  Concierge = 'concierge',
  Project = 'project'
}

export enum Enum_Pmash_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Position_Authortype {
  Charter = 'charter',
  Guest = 'guest',
  Registered = 'registered'
}

export enum Enum_Position_Kind {
  Opinion = 'opinion',
  ProposedSolution = 'proposed_solution'
}

export enum Enum_Position_Pole {
  Bottom = 'bottom',
  None = 'none',
  Pole = 'pole'
}

export enum Enum_Project_Restime {
  Feh = 'feh',
  Nsh = 'nsh',
  Sevend = 'sevend',
  Sth = 'sth'
}

export enum Enum_Project_Timetop {
  Already = 'already',
  Month = 'month',
  More = 'more',
  Never = 'never',
  OneY = 'oneY',
  SixM = 'sixM',
  ThreeM = 'threeM',
  TwoY = 'twoY',
  Week = 'week'
}

export enum Enum_Providerprofile_Owner_Type {
  Project = 'project',
  User = 'user'
}

export enum Enum_Ratsonmatchjob_Mode {
  AiFull = 'ai_full',
  Keyword = 'keyword',
  Vector = 'vector'
}

export enum Enum_Ratsonproposal_Kind {
  CustomOffer = 'custom_offer',
  ExistingMatanot = 'existing_matanot',
  ExistingProject = 'existing_project',
  Partial = 'partial'
}

export enum Enum_Ratsonproposal_Status_Proposal {
  Accepted = 'accepted',
  Expired = 'expired',
  Rejected = 'rejected',
  Suggested = 'suggested',
  Viewed = 'viewed'
}

export enum Enum_Ratsonshare_Role {
  Initiator = 'initiator',
  Joiner = 'joiner',
  Observer = 'observer'
}

export enum Enum_Ratsonshare_Status_Share {
  Active = 'active',
  Completed = 'completed',
  Left = 'left'
}

export enum Enum_Ratson_Access_Mode {
  FreeThreshold = 'free_threshold',
  PayToAccess = 'pay_to_access',
  Personal = 'personal'
}

export enum Enum_Ratson_Consensusrule {
  AgreersOnly = 'agreers_only',
  Unanimous = 'unanimous'
}

export enum Enum_Ratson_Joinkind {
  CommunityEvent = 'community_event',
  GroupPurchase = 'group_purchase',
  GroupTrip = 'group_trip',
  Other = 'other',
  PublicRenovation = 'public_renovation',
  RecurringSubscription = 'recurring_subscription',
  Solo = 'solo'
}

export enum Enum_Ratson_Partialconsensusfallback {
  AgreersOnly = 'agreers_only',
  Skip = 'skip',
  WillingnessPricing = 'willingness_pricing'
}

export enum Enum_Ratson_Share_Status {
  Cancelled = 'cancelled',
  Completed = 'completed',
  Executing = 'executing',
  Expired = 'expired',
  Locked = 'locked',
  Recruiting = 'recruiting'
}

export enum Enum_Ratson_Status_Ratson {
  Cancelled = 'cancelled',
  Draft = 'draft',
  Expired = 'expired',
  Fulfilled = 'fulfilled',
  Matching = 'matching',
  Negotiating = 'negotiating',
  Open = 'open'
}

export enum Enum_Ratson_Willingnessmodel {
  ManualSplit = 'manual_split',
  ParetoSum = 'pareto_sum',
  ProportionalCap = 'proportional_cap',
  VickreyLight = 'vickrey_light'
}

export enum Enum_Rikmash_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Sheirutfulfillment_Status_Process {
  Active = 'active',
  Completed = 'completed',
  Delivered = 'delivered',
  Pending = 'pending'
}

export enum Enum_Sitereport_Status {
  InReview = 'in_review',
  New = 'new',
  Resolved = 'resolved'
}

export enum Enum_Sitereport_Type {
  Bug = 'bug',
  Contact = 'contact',
  Feature = 'feature',
  Partnership = 'partnership'
}

export enum Enum_Sitesharecontribution_Des_Status {
  Decided = 'decided',
  Pending = 'pending',
  Skipped = 'skipped'
}

export enum Enum_Sitesharecontribution_Direction {
  AsIs = 'as_is',
  Less = 'less',
  More = 'more'
}

export enum Enum_Sp_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Tosplit_Split_Origin {
  Equal = 'equal',
  Manual = 'manual',
  WillingnessPareto = 'willingness_pareto',
  WillingnessProportional = 'willingness_proportional',
  WillingnessVickrey = 'willingness_vickrey'
}

export enum Enum_Userspermissionsuser_Auto_Created_Via {
  Cv = 'cv',
  DescriptionAi = 'description_ai',
  Manual = 'manual',
  UrlScrape = 'url_scrape'
}

export enum Enum_Userspermissionsuser_Frd {
  Fri = 'fri',
  Mon = 'mon',
  Na = 'na',
  Shabat = 'shabat',
  Sun = 'sun',
  Teh = 'teh',
  Thu = 'thu',
  Wen = 'wen'
}

export enum Enum_Userspermissionsuser_Lang {
  Ar = 'ar',
  En = 'en',
  He = 'he'
}

export enum Enum_Userspermissionsuser_Onboarding_Status {
  Done = 'done',
  EmailConfirmed = 'email_confirmed',
  EmailPending = 'email_pending',
  ProfileBasic = 'profile_basic',
  ProfileFull = 'profile_full',
  SignedUp = 'signed_up'
}

export enum Enum_Userspermissionsuser_Onboarding_Track {
  Business = 'business',
  Provider = 'provider',
  Unset = 'unset'
}

export enum Enum_Vote_Item_Kind {
  CoveredMission = 'covered_mission',
  CoveredResource = 'covered_resource',
  Proposal = 'proposal'
}

export type FileInfoInput = {
  alternativeText?: InputMaybe<Scalars['String']['input']>;
  caption?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Filtertag = {
  __typename?: 'Filtertag';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<FiltertagRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type FiltertagLocalizationsArgs = {
  filters?: InputMaybe<FiltertagFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type FiltertagUsers_Permissions_UsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type FiltertagEntity = {
  __typename?: 'FiltertagEntity';
  attributes?: Maybe<Filtertag>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type FiltertagEntityResponse = {
  __typename?: 'FiltertagEntityResponse';
  data?: Maybe<FiltertagEntity>;
};

export type FiltertagEntityResponseCollection = {
  __typename?: 'FiltertagEntityResponseCollection';
  data: Array<FiltertagEntity>;
  meta: ResponseCollectionMeta;
};

export type FiltertagFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<FiltertagFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<FiltertagFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<FiltertagFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<FiltertagFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type FiltertagInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type FiltertagRelationResponseCollection = {
  __typename?: 'FiltertagRelationResponseCollection';
  data: Array<FiltertagEntity>;
};

export type Finiapruval = {
  __typename?: 'Finiapruval';
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  finnished_mission?: Maybe<FinnishedMissionEntityResponse>;
  forum?: Maybe<ForumEntityResponse>;
  isTimerSave?: Maybe<Scalars['Boolean']['output']>;
  iskvua?: Maybe<Scalars['Boolean']['output']>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  missname?: Maybe<Scalars['String']['output']>;
  month?: Maybe<Scalars['Date']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  timer?: Maybe<TimerEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  what?: Maybe<UploadFileRelationResponseCollection>;
  why?: Maybe<Scalars['String']['output']>;
};


export type FiniapruvalPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type FiniapruvalVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type FiniapruvalWhatArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type FiniapruvalEntity = {
  __typename?: 'FiniapruvalEntity';
  attributes?: Maybe<Finiapruval>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type FiniapruvalEntityResponse = {
  __typename?: 'FiniapruvalEntityResponse';
  data?: Maybe<FiniapruvalEntity>;
};

export type FiniapruvalEntityResponseCollection = {
  __typename?: 'FiniapruvalEntityResponseCollection';
  data: Array<FiniapruvalEntity>;
  meta: ResponseCollectionMeta;
};

export type FiniapruvalFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<FiniapruvalFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  finnished_mission?: InputMaybe<FinnishedMissionFiltersInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isTimerSave?: InputMaybe<BooleanFilterInput>;
  iskvua?: InputMaybe<BooleanFilterInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  missname?: InputMaybe<StringFilterInput>;
  month?: InputMaybe<DateFilterInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<FiniapruvalFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<FiniapruvalFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  timer?: InputMaybe<TimerFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  why?: InputMaybe<StringFilterInput>;
};

export type FiniapruvalInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  finnished_mission?: InputMaybe<Scalars['ID']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  isTimerSave?: InputMaybe<Scalars['Boolean']['input']>;
  iskvua?: InputMaybe<Scalars['Boolean']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  missname?: InputMaybe<Scalars['String']['input']>;
  month?: InputMaybe<Scalars['Date']['input']>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  timer?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  what?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  why?: InputMaybe<Scalars['String']['input']>;
};

export type FiniapruvalRelationResponseCollection = {
  __typename?: 'FiniapruvalRelationResponseCollection';
  data: Array<FiniapruvalEntity>;
};

export type FinnishedMission = {
  __typename?: 'FinnishedMission';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  finiapruvals?: Maybe<FiniapruvalRelationResponseCollection>;
  finish?: Maybe<Scalars['DateTime']['output']>;
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  idYesod?: Maybe<Scalars['Boolean']['output']>;
  isFinished?: Maybe<Scalars['Boolean']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isNotFinished?: Maybe<Scalars['Boolean']['output']>;
  isglobal?: Maybe<Scalars['Boolean']['output']>;
  iskvua?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<FinnishedMissionRelationResponseCollection>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  mission?: Maybe<MissionEntityResponse>;
  missionName?: Maybe<Scalars['String']['output']>;
  month?: Maybe<Scalars['Date']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  perhour?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  start?: Maybe<Scalars['DateTime']['output']>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  total?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  what?: Maybe<UploadFileRelationResponseCollection>;
  why?: Maybe<Scalars['String']['output']>;
};


export type FinnishedMissionFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type FinnishedMissionLocalizationsArgs = {
  filters?: InputMaybe<FinnishedMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type FinnishedMissionTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type FinnishedMissionWhatArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type FinnishedMissionEntity = {
  __typename?: 'FinnishedMissionEntity';
  attributes?: Maybe<FinnishedMission>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type FinnishedMissionEntityResponse = {
  __typename?: 'FinnishedMissionEntityResponse';
  data?: Maybe<FinnishedMissionEntity>;
};

export type FinnishedMissionEntityResponseCollection = {
  __typename?: 'FinnishedMissionEntityResponseCollection';
  data: Array<FinnishedMissionEntity>;
  meta: ResponseCollectionMeta;
};

export type FinnishedMissionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<FinnishedMissionFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  finiapruvals?: InputMaybe<FiniapruvalFiltersInput>;
  finish?: InputMaybe<DateTimeFilterInput>;
  hearotMeyuchadot?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  idYesod?: InputMaybe<BooleanFilterInput>;
  isFinished?: InputMaybe<BooleanFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isNotFinished?: InputMaybe<BooleanFilterInput>;
  isglobal?: InputMaybe<BooleanFilterInput>;
  iskvua?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<FinnishedMissionFiltersInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  mission?: InputMaybe<MissionFiltersInput>;
  missionName?: InputMaybe<StringFilterInput>;
  month?: InputMaybe<DateFilterInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<FinnishedMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<FinnishedMissionFiltersInput>>>;
  perhour?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  start?: InputMaybe<DateTimeFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  why?: InputMaybe<StringFilterInput>;
};

export type FinnishedMissionInput = {
  descrip?: InputMaybe<Scalars['String']['input']>;
  finiapruvals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  finish?: InputMaybe<Scalars['DateTime']['input']>;
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  idYesod?: InputMaybe<Scalars['Boolean']['input']>;
  isFinished?: InputMaybe<Scalars['Boolean']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isNotFinished?: InputMaybe<Scalars['Boolean']['input']>;
  isglobal?: InputMaybe<Scalars['Boolean']['input']>;
  iskvua?: InputMaybe<Scalars['Boolean']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  mission?: InputMaybe<Scalars['ID']['input']>;
  missionName?: InputMaybe<Scalars['String']['input']>;
  month?: InputMaybe<Scalars['Date']['input']>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  total?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  what?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  why?: InputMaybe<Scalars['String']['input']>;
};

export type FinnishedMissionRelationResponseCollection = {
  __typename?: 'FinnishedMissionRelationResponseCollection';
  data: Array<FinnishedMissionEntity>;
};

export type FloatFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  contains?: InputMaybe<Scalars['Float']['input']>;
  containsi?: InputMaybe<Scalars['Float']['input']>;
  endsWith?: InputMaybe<Scalars['Float']['input']>;
  eq?: InputMaybe<Scalars['Float']['input']>;
  eqi?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<Scalars['Float']['input']>;
  nei?: InputMaybe<Scalars['Float']['input']>;
  not?: InputMaybe<FloatFilterInput>;
  notContains?: InputMaybe<Scalars['Float']['input']>;
  notContainsi?: InputMaybe<Scalars['Float']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  startsWith?: InputMaybe<Scalars['Float']['input']>;
};

export type Forum = {
  __typename?: 'Forum';
  acts?: Maybe<ActRelationResponseCollection>;
  askm?: Maybe<AskmEntityResponse>;
  asks?: Maybe<AskRelationResponseCollection>;
  askwant?: Maybe<AskwantEntityResponse>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  decisions?: Maybe<DecisionRelationResponseCollection>;
  done: Scalars['Boolean']['output'];
  finiapruvals?: Maybe<FiniapruvalRelationResponseCollection>;
  forum_last_seens?: Maybe<ForumLastSeenRelationResponseCollection>;
  haluka?: Maybe<HalukaEntityResponse>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  matanotpend?: Maybe<MatanotpendEntityResponse>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  messages?: Maybe<MessageRelationResponseCollection>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  pgisha?: Maybe<PgishaEntityResponse>;
  pmashes?: Maybe<PmashRelationResponseCollection>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  ratson_proposal?: Maybe<RatsonProposalEntityResponse>;
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  spec?: Maybe<Enum_Forum_Spec>;
  subject?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type ForumActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumAsksArgs = {
  filters?: InputMaybe<AskFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumDecisionsArgs = {
  filters?: InputMaybe<DecisionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumForum_Last_SeensArgs = {
  filters?: InputMaybe<ForumLastSeenFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumMessagesArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumPmashesArgs = {
  filters?: InputMaybe<PmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ForumSheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ForumEntity = {
  __typename?: 'ForumEntity';
  attributes?: Maybe<Forum>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ForumEntityResponse = {
  __typename?: 'ForumEntityResponse';
  data?: Maybe<ForumEntity>;
};

export type ForumEntityResponseCollection = {
  __typename?: 'ForumEntityResponseCollection';
  data: Array<ForumEntity>;
  meta: ResponseCollectionMeta;
};

export type ForumFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<ForumFiltersInput>>>;
  askm?: InputMaybe<AskmFiltersInput>;
  asks?: InputMaybe<AskFiltersInput>;
  askwant?: InputMaybe<AskwantFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  decisions?: InputMaybe<DecisionFiltersInput>;
  done?: InputMaybe<BooleanFilterInput>;
  finiapruvals?: InputMaybe<FiniapruvalFiltersInput>;
  forum_last_seens?: InputMaybe<ForumLastSeenFiltersInput>;
  haluka?: InputMaybe<HalukaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  mashabetahalich?: InputMaybe<MashabetahalichFiltersInput>;
  matanotpend?: InputMaybe<MatanotpendFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  messages?: InputMaybe<MessageFiltersInput>;
  not?: InputMaybe<ForumFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ForumFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  pendms?: InputMaybe<PendmFiltersInput>;
  pgisha?: InputMaybe<PgishaFiltersInput>;
  pmashes?: InputMaybe<PmashFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  ratson_proposal?: InputMaybe<RatsonProposalFiltersInput>;
  sheirutpend?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  spec?: InputMaybe<StringFilterInput>;
  subject?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ForumInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askm?: InputMaybe<Scalars['ID']['input']>;
  asks?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askwant?: InputMaybe<Scalars['ID']['input']>;
  decisions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  finiapruvals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  forum_last_seens?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  haluka?: InputMaybe<Scalars['ID']['input']>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashabetahalich?: InputMaybe<Scalars['ID']['input']>;
  matanotpend?: InputMaybe<Scalars['ID']['input']>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  messages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgisha?: InputMaybe<Scalars['ID']['input']>;
  pmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  ratson_proposal?: InputMaybe<Scalars['ID']['input']>;
  sheirutpend?: InputMaybe<Scalars['ID']['input']>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  spec?: InputMaybe<Enum_Forum_Spec>;
  subject?: InputMaybe<Scalars['String']['input']>;
};

export type ForumLastSeen = {
  __typename?: 'ForumLastSeen';
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  lastReadAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type ForumLastSeenEntity = {
  __typename?: 'ForumLastSeenEntity';
  attributes?: Maybe<ForumLastSeen>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ForumLastSeenEntityResponse = {
  __typename?: 'ForumLastSeenEntityResponse';
  data?: Maybe<ForumLastSeenEntity>;
};

export type ForumLastSeenEntityResponseCollection = {
  __typename?: 'ForumLastSeenEntityResponseCollection';
  data: Array<ForumLastSeenEntity>;
  meta: ResponseCollectionMeta;
};

export type ForumLastSeenFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ForumLastSeenFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  lastReadAt?: InputMaybe<DateTimeFilterInput>;
  not?: InputMaybe<ForumLastSeenFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ForumLastSeenFiltersInput>>>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ForumLastSeenInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  lastReadAt?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type ForumLastSeenRelationResponseCollection = {
  __typename?: 'ForumLastSeenRelationResponseCollection';
  data: Array<ForumLastSeenEntity>;
};

export type ForumRelationResponseCollection = {
  __typename?: 'ForumRelationResponseCollection';
  data: Array<ForumEntity>;
};

export type GenericMorph = Act | Actt | ApiKey | Argument | Ask | Askm | Askwant | Bakasha | Category | Chezin | Clause | ComponentDesisionEditPend | ComponentDesisionNegodes | ComponentDesisionNegom | ComponentNewCoveredMissions | ComponentNewCoveredResources | ComponentNewEdits | ComponentNewExtractedMissions | ComponentNewExtractedResources | ComponentNewLocation | ComponentNewMeeting | ComponentNewMonter | ComponentNewNego | ComponentNewNegom | ComponentNewSeen | ComponentNewTimes | ComponentNewUserAndIshur | ComponentNewWillingnessEntries | ComponentProjectsChatre | ComponentProjectsConsumedMashabetahalichDeliveries | ComponentProjectsConsumedMissionHours | ComponentProjectsConsumedOpenMu | ComponentProjectsDeliveries | ComponentProjectsHervachti | ComponentProjectsIGotMoney | ComponentProjectsMeeting | ComponentProjectsMonter | ComponentProjectsNegodes | ComponentProjectsPendmnego | ComponentProjectsShift | ComponentProjectsTaskdis | ComponentProjectsUsersOf | ComponentProjectsVots | ContentReleasesRelease | ContentReleasesReleaseAction | ConventionText | Cuntry | Dea | Deal | Decision | Deffinition | Filtertag | Finiapruval | FinnishedMission | Forum | ForumLastSeen | Haamada | Haamadapruv | Haluka | Hatzaa | Hazbaah | I18NLocale | Issue | Maap | Machshir | Mashaabim | Mashabetahalich | Matanot | MatanotRecipeMission | MatanotRecipeResource | Matanotpend | Matbea | Mesimabetahalich | Message | Mission | Mode | Monter | Nego | NegoMash | Negopendmission | Negotiation | OpenMashaabim | OpenMission | Partof | Pendm | Pgisha | Pgishauser | Pgishauserpend | Pmash | Position | Project | ProviderProfile | Ratson | RatsonMatchJob | RatsonProposal | RatsonShare | Richtext | Rikmash | Sale | Seeder | Sheirut | SheirutFulfillment | Sheirutnego | Sheirutpend | Sidur | SiteReport | SiteShareContribution | Skill | Solution | Sp | Tafkidim | Tikunolam | Timegrama | Timer | Tosplit | Translate | UploadFile | UploadFolder | UsersPermissionsPermission | UsersPermissionsRole | UsersPermissionsUser | Vallue | Vote | Want | WelcomTop | Whatandwhy | WorkWay | Yat | Zohar;

export type Haamada = {
  __typename?: 'Haamada';
  amount?: Maybe<Scalars['Float']['output']>;
  comition?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  haamadapruv?: Maybe<HaamadapruvEntityResponse>;
  isReturned: Scalars['Boolean']['output'];
  open_mashaabims?: Maybe<OpenMashaabimRelationResponseCollection>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  rikmashes?: Maybe<RikmashRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type HaamadaOpen_MashaabimsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type HaamadaRikmashesArgs = {
  filters?: InputMaybe<RikmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type HaamadaEntity = {
  __typename?: 'HaamadaEntity';
  attributes?: Maybe<Haamada>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type HaamadaEntityResponse = {
  __typename?: 'HaamadaEntityResponse';
  data?: Maybe<HaamadaEntity>;
};

export type HaamadaEntityResponseCollection = {
  __typename?: 'HaamadaEntityResponseCollection';
  data: Array<HaamadaEntity>;
  meta: ResponseCollectionMeta;
};

export type HaamadaFiltersInput = {
  amount?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<HaamadaFiltersInput>>>;
  comition?: InputMaybe<FloatFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  haamadapruv?: InputMaybe<HaamadapruvFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isReturned?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<HaamadaFiltersInput>;
  open_mashaabims?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<HaamadaFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  rikmashes?: InputMaybe<RikmashFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type HaamadaInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  comition?: InputMaybe<Scalars['Float']['input']>;
  haamadapruv?: InputMaybe<Scalars['ID']['input']>;
  isReturned?: InputMaybe<Scalars['Boolean']['input']>;
  open_mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  rikmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type HaamadaRelationResponseCollection = {
  __typename?: 'HaamadaRelationResponseCollection';
  data: Array<HaamadaEntity>;
};

export type Haamadapruv = {
  __typename?: 'Haamadapruv';
  archived: Scalars['Boolean']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  haamada?: Maybe<HaamadaEntityResponse>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type HaamadapruvVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type HaamadapruvEntity = {
  __typename?: 'HaamadapruvEntity';
  attributes?: Maybe<Haamadapruv>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type HaamadapruvEntityResponse = {
  __typename?: 'HaamadapruvEntityResponse';
  data?: Maybe<HaamadapruvEntity>;
};

export type HaamadapruvEntityResponseCollection = {
  __typename?: 'HaamadapruvEntityResponseCollection';
  data: Array<HaamadapruvEntity>;
  meta: ResponseCollectionMeta;
};

export type HaamadapruvFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<HaamadapruvFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  haamada?: InputMaybe<HaamadaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<HaamadapruvFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<HaamadapruvFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type HaamadapruvInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  haamada?: InputMaybe<Scalars['ID']['input']>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type HaamadapruvRelationResponseCollection = {
  __typename?: 'HaamadapruvRelationResponseCollection';
  data: Array<HaamadapruvEntity>;
};

export type Haluka = {
  __typename?: 'Haluka';
  adjustDirection?: Maybe<Enum_Haluka_Adjustdirection>;
  adjustReason?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['Float']['output']>;
  autoApproved?: Maybe<Scalars['Boolean']['output']>;
  chatre?: Maybe<Array<Maybe<ComponentProjectsChatre>>>;
  confirmed: Scalars['Boolean']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  isSiteShare?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<HalukaRelationResponseCollection>;
  matbea?: Maybe<MatbeaEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  proposedAmount?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson_share?: Maybe<RatsonShareEntityResponse>;
  recive_project?: Maybe<ProjectEntityResponse>;
  senderconf?: Maybe<Scalars['Boolean']['output']>;
  sheirut?: Maybe<SheirutEntityResponse>;
  site_share_contribution?: Maybe<SiteShareContributionEntityResponse>;
  source_tosplit?: Maybe<TosplitEntityResponse>;
  tosplit?: Maybe<TosplitEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userrecive?: Maybe<UsersPermissionsUserEntityResponse>;
  usersend?: Maybe<UsersPermissionsUserEntityResponse>;
  ushar?: Maybe<Scalars['Boolean']['output']>;
  want?: Maybe<WantEntityResponse>;
};


export type HalukaChatreArgs = {
  filters?: InputMaybe<ComponentProjectsChatreFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type HalukaLocalizationsArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type HalukaEntity = {
  __typename?: 'HalukaEntity';
  attributes?: Maybe<Haluka>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type HalukaEntityResponse = {
  __typename?: 'HalukaEntityResponse';
  data?: Maybe<HalukaEntity>;
};

export type HalukaEntityResponseCollection = {
  __typename?: 'HalukaEntityResponseCollection';
  data: Array<HalukaEntity>;
  meta: ResponseCollectionMeta;
};

export type HalukaFiltersInput = {
  adjustDirection?: InputMaybe<StringFilterInput>;
  adjustReason?: InputMaybe<StringFilterInput>;
  amount?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<HalukaFiltersInput>>>;
  autoApproved?: InputMaybe<BooleanFilterInput>;
  chatre?: InputMaybe<ComponentProjectsChatreFiltersInput>;
  confirmed?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isSiteShare?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<HalukaFiltersInput>;
  matbea?: InputMaybe<MatbeaFiltersInput>;
  not?: InputMaybe<HalukaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<HalukaFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  proposedAmount?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson_share?: InputMaybe<RatsonShareFiltersInput>;
  recive_project?: InputMaybe<ProjectFiltersInput>;
  senderconf?: InputMaybe<BooleanFilterInput>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  site_share_contribution?: InputMaybe<SiteShareContributionFiltersInput>;
  source_tosplit?: InputMaybe<TosplitFiltersInput>;
  tosplit?: InputMaybe<TosplitFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  userrecive?: InputMaybe<UsersPermissionsUserFiltersInput>;
  usersend?: InputMaybe<UsersPermissionsUserFiltersInput>;
  ushar?: InputMaybe<BooleanFilterInput>;
  want?: InputMaybe<WantFiltersInput>;
};

export type HalukaInput = {
  adjustDirection?: InputMaybe<Enum_Haluka_Adjustdirection>;
  adjustReason?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['Float']['input']>;
  autoApproved?: InputMaybe<Scalars['Boolean']['input']>;
  chatre?: InputMaybe<Array<InputMaybe<ComponentProjectsChatreInput>>>;
  confirmed?: InputMaybe<Scalars['Boolean']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  isSiteShare?: InputMaybe<Scalars['Boolean']['input']>;
  matbea?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  proposedAmount?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson_share?: InputMaybe<Scalars['ID']['input']>;
  recive_project?: InputMaybe<Scalars['ID']['input']>;
  senderconf?: InputMaybe<Scalars['Boolean']['input']>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  site_share_contribution?: InputMaybe<Scalars['ID']['input']>;
  source_tosplit?: InputMaybe<Scalars['ID']['input']>;
  tosplit?: InputMaybe<Scalars['ID']['input']>;
  userrecive?: InputMaybe<Scalars['ID']['input']>;
  usersend?: InputMaybe<Scalars['ID']['input']>;
  ushar?: InputMaybe<Scalars['Boolean']['input']>;
  want?: InputMaybe<Scalars['ID']['input']>;
};

export type HalukaRelationResponseCollection = {
  __typename?: 'HalukaRelationResponseCollection';
  data: Array<HalukaEntity>;
};

export type Hatzaa = {
  __typename?: 'Hatzaa';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
  perhoure?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  untilwhen?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type HatzaaVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type HatzaaEntity = {
  __typename?: 'HatzaaEntity';
  attributes?: Maybe<Hatzaa>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type HatzaaEntityResponse = {
  __typename?: 'HatzaaEntityResponse';
  data?: Maybe<HatzaaEntity>;
};

export type HatzaaEntityResponseCollection = {
  __typename?: 'HatzaaEntityResponseCollection';
  data: Array<HatzaaEntity>;
  meta: ResponseCollectionMeta;
};

export type HatzaaFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<HatzaaFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<HatzaaFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<HatzaaFiltersInput>>>;
  perhoure?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  untilwhen?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type HatzaaInput = {
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
  perhoure?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  untilwhen?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type HatzaaRelationResponseCollection = {
  __typename?: 'HatzaaRelationResponseCollection';
  data: Array<HatzaaEntity>;
};

export type Hazbaah = {
  __typename?: 'Hazbaah';
  approved?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  votes?: Maybe<VoteRelationResponseCollection>;
};


export type HazbaahVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type HazbaahEntity = {
  __typename?: 'HazbaahEntity';
  attributes?: Maybe<Hazbaah>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type HazbaahEntityResponse = {
  __typename?: 'HazbaahEntityResponse';
  data?: Maybe<HazbaahEntity>;
};

export type HazbaahEntityResponseCollection = {
  __typename?: 'HazbaahEntityResponseCollection';
  data: Array<HazbaahEntity>;
  meta: ResponseCollectionMeta;
};

export type HazbaahFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<HazbaahFiltersInput>>>;
  approved?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<HazbaahFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<HazbaahFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  votes?: InputMaybe<VoteFiltersInput>;
};

export type HazbaahInput = {
  approved?: InputMaybe<Scalars['Boolean']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type I18NLocale = {
  __typename?: 'I18NLocale';
  code?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type I18NLocaleEntity = {
  __typename?: 'I18NLocaleEntity';
  attributes?: Maybe<I18NLocale>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type I18NLocaleEntityResponse = {
  __typename?: 'I18NLocaleEntityResponse';
  data?: Maybe<I18NLocaleEntity>;
};

export type I18NLocaleEntityResponseCollection = {
  __typename?: 'I18NLocaleEntityResponseCollection';
  data: Array<I18NLocaleEntity>;
  meta: ResponseCollectionMeta;
};

export type I18NLocaleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>;
  code?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<I18NLocaleFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type IdFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  contains?: InputMaybe<Scalars['ID']['input']>;
  containsi?: InputMaybe<Scalars['ID']['input']>;
  endsWith?: InputMaybe<Scalars['ID']['input']>;
  eq?: InputMaybe<Scalars['ID']['input']>;
  eqi?: InputMaybe<Scalars['ID']['input']>;
  gt?: InputMaybe<Scalars['ID']['input']>;
  gte?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  lt?: InputMaybe<Scalars['ID']['input']>;
  lte?: InputMaybe<Scalars['ID']['input']>;
  ne?: InputMaybe<Scalars['ID']['input']>;
  nei?: InputMaybe<Scalars['ID']['input']>;
  not?: InputMaybe<IdFilterInput>;
  notContains?: InputMaybe<Scalars['ID']['input']>;
  notContainsi?: InputMaybe<Scalars['ID']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  startsWith?: InputMaybe<Scalars['ID']['input']>;
};

export type IntFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  contains?: InputMaybe<Scalars['Int']['input']>;
  containsi?: InputMaybe<Scalars['Int']['input']>;
  endsWith?: InputMaybe<Scalars['Int']['input']>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  eqi?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  nei?: InputMaybe<Scalars['Int']['input']>;
  not?: InputMaybe<IntFilterInput>;
  notContains?: InputMaybe<Scalars['Int']['input']>;
  notContainsi?: InputMaybe<Scalars['Int']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  startsWith?: InputMaybe<Scalars['Int']['input']>;
};

export type Issue = {
  __typename?: 'Issue';
  clauses?: Maybe<ClauseRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  negotiation?: Maybe<NegotiationEntityResponse>;
  order?: Maybe<Scalars['Int']['output']>;
  origin?: Maybe<Enum_Issue_Origin>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type IssueClausesArgs = {
  filters?: InputMaybe<ClauseFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type IssueEntity = {
  __typename?: 'IssueEntity';
  attributes?: Maybe<Issue>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type IssueEntityResponse = {
  __typename?: 'IssueEntityResponse';
  data?: Maybe<IssueEntity>;
};

export type IssueEntityResponseCollection = {
  __typename?: 'IssueEntityResponseCollection';
  data: Array<IssueEntity>;
  meta: ResponseCollectionMeta;
};

export type IssueFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<IssueFiltersInput>>>;
  clauses?: InputMaybe<ClauseFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  negotiation?: InputMaybe<NegotiationFiltersInput>;
  not?: InputMaybe<IssueFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<IssueFiltersInput>>>;
  order?: InputMaybe<IntFilterInput>;
  origin?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  title?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type IssueInput = {
  clauses?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negotiation?: InputMaybe<Scalars['ID']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  origin?: InputMaybe<Enum_Issue_Origin>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IssueRelationResponseCollection = {
  __typename?: 'IssueRelationResponseCollection';
  data: Array<IssueEntity>;
};

export type JsonFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  contains?: InputMaybe<Scalars['JSON']['input']>;
  containsi?: InputMaybe<Scalars['JSON']['input']>;
  endsWith?: InputMaybe<Scalars['JSON']['input']>;
  eq?: InputMaybe<Scalars['JSON']['input']>;
  eqi?: InputMaybe<Scalars['JSON']['input']>;
  gt?: InputMaybe<Scalars['JSON']['input']>;
  gte?: InputMaybe<Scalars['JSON']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  lt?: InputMaybe<Scalars['JSON']['input']>;
  lte?: InputMaybe<Scalars['JSON']['input']>;
  ne?: InputMaybe<Scalars['JSON']['input']>;
  nei?: InputMaybe<Scalars['JSON']['input']>;
  not?: InputMaybe<JsonFilterInput>;
  notContains?: InputMaybe<Scalars['JSON']['input']>;
  notContainsi?: InputMaybe<Scalars['JSON']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  startsWith?: InputMaybe<Scalars['JSON']['input']>;
};

export type LongFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  contains?: InputMaybe<Scalars['Long']['input']>;
  containsi?: InputMaybe<Scalars['Long']['input']>;
  endsWith?: InputMaybe<Scalars['Long']['input']>;
  eq?: InputMaybe<Scalars['Long']['input']>;
  eqi?: InputMaybe<Scalars['Long']['input']>;
  gt?: InputMaybe<Scalars['Long']['input']>;
  gte?: InputMaybe<Scalars['Long']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  lt?: InputMaybe<Scalars['Long']['input']>;
  lte?: InputMaybe<Scalars['Long']['input']>;
  ne?: InputMaybe<Scalars['Long']['input']>;
  nei?: InputMaybe<Scalars['Long']['input']>;
  not?: InputMaybe<LongFilterInput>;
  notContains?: InputMaybe<Scalars['Long']['input']>;
  notContainsi?: InputMaybe<Scalars['Long']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  startsWith?: InputMaybe<Scalars['Long']['input']>;
};

export type Maap = {
  __typename?: 'Maap';
  archived: Scalars['Boolean']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cycleEnd?: Maybe<Scalars['DateTime']['output']>;
  cycleIndex?: Maybe<Scalars['Int']['output']>;
  cycleStart?: Maybe<Scalars['DateTime']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  isAcceptanceMaap?: Maybe<Scalars['Boolean']['output']>;
  isSelfProposal?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MaapRelationResponseCollection>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  negos?: Maybe<NegoRelationResponseCollection>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pmash?: Maybe<PmashEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quantityDelivered?: Maybe<Scalars['Float']['output']>;
  rikmash?: Maybe<RikmashEntityResponse>;
  sheirut_fulfillments?: Maybe<SheirutFulfillmentRelationResponseCollection>;
  sp?: Maybe<SpEntityResponse>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  unit?: Maybe<Enum_Maap_Unit>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type MaapLocalizationsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MaapNegosArgs = {
  filters?: InputMaybe<NegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MaapPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MaapSheirut_FulfillmentsArgs = {
  filters?: InputMaybe<SheirutFulfillmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MaapVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MaapEntity = {
  __typename?: 'MaapEntity';
  attributes?: Maybe<Maap>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MaapEntityResponse = {
  __typename?: 'MaapEntityResponse';
  data?: Maybe<MaapEntity>;
};

export type MaapEntityResponseCollection = {
  __typename?: 'MaapEntityResponseCollection';
  data: Array<MaapEntity>;
  meta: ResponseCollectionMeta;
};

export type MaapFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MaapFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  cycleEnd?: InputMaybe<DateTimeFilterInput>;
  cycleIndex?: InputMaybe<IntFilterInput>;
  cycleStart?: InputMaybe<DateTimeFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isAcceptanceMaap?: InputMaybe<BooleanFilterInput>;
  isSelfProposal?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MaapFiltersInput>;
  mashabetahalich?: InputMaybe<MashabetahalichFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  negos?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<MaapFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MaapFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  pmash?: InputMaybe<PmashFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quantityDelivered?: InputMaybe<FloatFilterInput>;
  rikmash?: InputMaybe<RikmashFiltersInput>;
  sheirut_fulfillments?: InputMaybe<SheirutFulfillmentFiltersInput>;
  sp?: InputMaybe<SpFiltersInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  unit?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type MaapInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  cycleEnd?: InputMaybe<Scalars['DateTime']['input']>;
  cycleIndex?: InputMaybe<Scalars['Int']['input']>;
  cycleStart?: InputMaybe<Scalars['DateTime']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  isAcceptanceMaap?: InputMaybe<Scalars['Boolean']['input']>;
  isSelfProposal?: InputMaybe<Scalars['Boolean']['input']>;
  mashabetahalich?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  negos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quantityDelivered?: InputMaybe<Scalars['Float']['input']>;
  rikmash?: InputMaybe<Scalars['ID']['input']>;
  sheirut_fulfillments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sp?: InputMaybe<Scalars['ID']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  unit?: InputMaybe<Enum_Maap_Unit>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type MaapRelationResponseCollection = {
  __typename?: 'MaapRelationResponseCollection';
  data: Array<MaapEntity>;
};

export type Machshir = {
  __typename?: 'Machshir';
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  jsoni?: Maybe<Scalars['JSON']['output']>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type MachshirProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MachshirEntity = {
  __typename?: 'MachshirEntity';
  attributes?: Maybe<Machshir>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MachshirEntityResponse = {
  __typename?: 'MachshirEntityResponse';
  data?: Maybe<MachshirEntity>;
};

export type MachshirEntityResponseCollection = {
  __typename?: 'MachshirEntityResponseCollection';
  data: Array<MachshirEntity>;
  meta: ResponseCollectionMeta;
};

export type MachshirFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MachshirFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  jsoni?: InputMaybe<JsonFilterInput>;
  not?: InputMaybe<MachshirFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MachshirFiltersInput>>>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type MachshirInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  jsoni?: InputMaybe<Scalars['JSON']['input']>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type MachshirRelationResponseCollection = {
  __typename?: 'MachshirRelationResponseCollection';
  data: Array<MachshirEntity>;
};

export type Mashaabim = {
  __typename?: 'Mashaabim';
  bakashas?: Maybe<BakashaRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  kindOf?: Maybe<Enum_Mashaabim_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MashaabimRelationResponseCollection>;
  mashabetahaliches?: Maybe<MashabetahalichRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  name: Scalars['String']['output'];
  negos?: Maybe<NegoRelationResponseCollection>;
  open_mashaabims?: Maybe<OpenMashaabimRelationResponseCollection>;
  pmashes?: Maybe<PmashRelationResponseCollection>;
  price?: Maybe<Scalars['Float']['output']>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratsons?: Maybe<RatsonRelationResponseCollection>;
  sps?: Maybe<SpRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type MashaabimBakashasArgs = {
  filters?: InputMaybe<BakashaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimLocalizationsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimMashabetahalichesArgs = {
  filters?: InputMaybe<MashabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimNegosArgs = {
  filters?: InputMaybe<NegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimOpen_MashaabimsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimPmashesArgs = {
  filters?: InputMaybe<PmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimRatsonsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimSpsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashaabimUsers_Permissions_UsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MashaabimEntity = {
  __typename?: 'MashaabimEntity';
  attributes?: Maybe<Mashaabim>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MashaabimEntityResponse = {
  __typename?: 'MashaabimEntityResponse';
  data?: Maybe<MashaabimEntity>;
};

export type MashaabimEntityResponseCollection = {
  __typename?: 'MashaabimEntityResponseCollection';
  data: Array<MashaabimEntity>;
  meta: ResponseCollectionMeta;
};

export type MashaabimFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MashaabimFiltersInput>>>;
  bakashas?: InputMaybe<BakashaFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MashaabimFiltersInput>;
  mashabetahaliches?: InputMaybe<MashabetahalichFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  negos?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<MashaabimFiltersInput>;
  open_mashaabims?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MashaabimFiltersInput>>>;
  pmashes?: InputMaybe<PmashFiltersInput>;
  price?: InputMaybe<FloatFilterInput>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratsons?: InputMaybe<RatsonFiltersInput>;
  sps?: InputMaybe<SpFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type MashaabimInput = {
  bakashas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  kindOf?: InputMaybe<Enum_Mashaabim_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  mashabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  negos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  price?: InputMaybe<Scalars['Float']['input']>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratsons?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  users_permissions_users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type MashaabimRelationResponseCollection = {
  __typename?: 'MashaabimRelationResponseCollection';
  data: Array<MashaabimEntity>;
};

export type Mashabetahalich = {
  __typename?: 'Mashabetahalich';
  allowOverdelivery?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  currency?: Maybe<MatbeaEntityResponse>;
  cycleSize?: Maybe<Scalars['Int']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  end?: Maybe<Scalars['DateTime']['output']>;
  finnished?: Maybe<Scalars['Boolean']['output']>;
  forappruval?: Maybe<Scalars['Boolean']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  hoursassigned?: Maybe<Scalars['Float']['output']>;
  howmanyhoursalready?: Maybe<Scalars['Float']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Mashabetahalich_Kindof>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  matanot_recipe_resources?: Maybe<MatanotRecipeResourceRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  perhour?: Maybe<Scalars['Float']['output']>;
  pmash?: Maybe<PmashEntityResponse>;
  pricePerUnit?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quantityAssigned?: Maybe<Scalars['Float']['output']>;
  quantityDelivered?: Maybe<Scalars['Float']['output']>;
  recurring?: Maybe<Scalars['Boolean']['output']>;
  reservedQuantity?: Maybe<Scalars['Float']['output']>;
  rikmash?: Maybe<RikmashEntityResponse>;
  start?: Maybe<Scalars['DateTime']['output']>;
  status_mashab?: Maybe<Enum_Mashabetahalich_Status_Mashab>;
  summarizeOnClose?: Maybe<Scalars['Boolean']['output']>;
  timers?: Maybe<TimerRelationResponseCollection>;
  unit?: Maybe<Enum_Mashabetahalich_Unit>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type MashabetahalichForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashabetahalichMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashabetahalichMatanot_Recipe_ResourcesArgs = {
  filters?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashabetahalichPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MashabetahalichTimersArgs = {
  filters?: InputMaybe<TimerFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MashabetahalichEntity = {
  __typename?: 'MashabetahalichEntity';
  attributes?: Maybe<Mashabetahalich>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MashabetahalichEntityResponse = {
  __typename?: 'MashabetahalichEntityResponse';
  data?: Maybe<MashabetahalichEntity>;
};

export type MashabetahalichEntityResponseCollection = {
  __typename?: 'MashabetahalichEntityResponseCollection';
  data: Array<MashabetahalichEntity>;
  meta: ResponseCollectionMeta;
};

export type MashabetahalichFiltersInput = {
  allowOverdelivery?: InputMaybe<BooleanFilterInput>;
  and?: InputMaybe<Array<InputMaybe<MashabetahalichFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  currency?: InputMaybe<MatbeaFiltersInput>;
  cycleSize?: InputMaybe<IntFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  end?: InputMaybe<DateTimeFilterInput>;
  finnished?: InputMaybe<BooleanFilterInput>;
  forappruval?: InputMaybe<BooleanFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  hoursassigned?: InputMaybe<FloatFilterInput>;
  howmanyhoursalready?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  mashaabim?: InputMaybe<MashaabimFiltersInput>;
  matanot_recipe_resources?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MashabetahalichFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MashabetahalichFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  perhour?: InputMaybe<FloatFilterInput>;
  pmash?: InputMaybe<PmashFiltersInput>;
  pricePerUnit?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quantityAssigned?: InputMaybe<FloatFilterInput>;
  quantityDelivered?: InputMaybe<FloatFilterInput>;
  recurring?: InputMaybe<BooleanFilterInput>;
  reservedQuantity?: InputMaybe<FloatFilterInput>;
  rikmash?: InputMaybe<RikmashFiltersInput>;
  start?: InputMaybe<DateTimeFilterInput>;
  status_mashab?: InputMaybe<StringFilterInput>;
  summarizeOnClose?: InputMaybe<BooleanFilterInput>;
  timers?: InputMaybe<TimerFiltersInput>;
  unit?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type MashabetahalichInput = {
  allowOverdelivery?: InputMaybe<Scalars['Boolean']['input']>;
  currency?: InputMaybe<Scalars['ID']['input']>;
  cycleSize?: InputMaybe<Scalars['Int']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  end?: InputMaybe<Scalars['DateTime']['input']>;
  finnished?: InputMaybe<Scalars['Boolean']['input']>;
  forappruval?: InputMaybe<Scalars['Boolean']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hoursassigned?: InputMaybe<Scalars['Float']['input']>;
  howmanyhoursalready?: InputMaybe<Scalars['Float']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Mashabetahalich_Kindof>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashaabim?: InputMaybe<Scalars['ID']['input']>;
  matanot_recipe_resources?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  pricePerUnit?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quantityAssigned?: InputMaybe<Scalars['Float']['input']>;
  quantityDelivered?: InputMaybe<Scalars['Float']['input']>;
  recurring?: InputMaybe<Scalars['Boolean']['input']>;
  reservedQuantity?: InputMaybe<Scalars['Float']['input']>;
  rikmash?: InputMaybe<Scalars['ID']['input']>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
  status_mashab?: InputMaybe<Enum_Mashabetahalich_Status_Mashab>;
  summarizeOnClose?: InputMaybe<Scalars['Boolean']['input']>;
  timers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  unit?: InputMaybe<Enum_Mashabetahalich_Unit>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type MashabetahalichRelationResponseCollection = {
  __typename?: 'MashabetahalichRelationResponseCollection';
  data: Array<MashabetahalichEntity>;
};

export type Matanot = {
  __typename?: 'Matanot';
  appruved?: Maybe<Scalars['Boolean']['output']>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  bakashas?: Maybe<BakashaRelationResponseCollection>;
  categories?: Maybe<CategoryRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  currency?: Maybe<MatbeaEntityResponse>;
  decision?: Maybe<DecisionEntityResponse>;
  desc?: Maybe<Scalars['JSON']['output']>;
  estimatedPrice?: Maybe<Scalars['Float']['output']>;
  finnishDate?: Maybe<Scalars['DateTime']['output']>;
  fixPrice?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Matanot_Kindof>;
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MatanotRelationResponseCollection>;
  location?: Maybe<ComponentNewLocation>;
  marginPct?: Maybe<Scalars['Float']['output']>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  matanot_recipe_missions?: Maybe<MatanotRecipeMissionRelationResponseCollection>;
  matanot_recipe_resources?: Maybe<MatanotRecipeResourceRelationResponseCollection>;
  matanotpend?: Maybe<MatanotpendEntityResponse>;
  maxsaleyearone?: Maybe<Scalars['Float']['output']>;
  maxsaleyearsec?: Maybe<Scalars['Float']['output']>;
  minsaleyearone?: Maybe<Scalars['Float']['output']>;
  minsaleyearsec?: Maybe<Scalars['Float']['output']>;
  missions?: Maybe<MissionRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  negos?: Maybe<NegoRelationResponseCollection>;
  oneForeProject?: Maybe<Scalars['Boolean']['output']>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pic?: Maybe<UploadFileEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  pricingMode?: Maybe<Enum_Matanot_Pricingmode>;
  process?: Maybe<PartofEntityResponse>;
  projectcreates?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quant?: Maybe<Scalars['Float']['output']>;
  radius?: Maybe<Scalars['Long']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  ratson_proposals?: Maybe<RatsonProposalRelationResponseCollection>;
  ratsons?: Maybe<RatsonRelationResponseCollection>;
  sale?: Maybe<SaleRelationResponseCollection>;
  sales?: Maybe<Scalars['Float']['output']>;
  sheirut_fulfillments?: Maybe<SheirutFulfillmentRelationResponseCollection>;
  sheirutpends?: Maybe<SheirutpendRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  source_proposals?: Maybe<RatsonRelationResponseCollection>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  status_of_voting?: Maybe<Enum_Matanot_Status_Of_Voting>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type MatanotBakashasArgs = {
  filters?: InputMaybe<BakashaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotCategoriesArgs = {
  filters?: InputMaybe<CategoryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotLocalizationsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotMatanot_Recipe_MissionsArgs = {
  filters?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotMatanot_Recipe_ResourcesArgs = {
  filters?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotNegosArgs = {
  filters?: InputMaybe<NegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotProjectcreatesArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotRatson_ProposalsArgs = {
  filters?: InputMaybe<RatsonProposalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotRatsonsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotSaleArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotSheirut_FulfillmentsArgs = {
  filters?: InputMaybe<SheirutFulfillmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotSheirutpendsArgs = {
  filters?: InputMaybe<SheirutpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotSheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotSource_ProposalsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MatanotEntity = {
  __typename?: 'MatanotEntity';
  attributes?: Maybe<Matanot>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MatanotEntityResponse = {
  __typename?: 'MatanotEntityResponse';
  data?: Maybe<MatanotEntity>;
};

export type MatanotEntityResponseCollection = {
  __typename?: 'MatanotEntityResponseCollection';
  data: Array<MatanotEntity>;
  meta: ResponseCollectionMeta;
};

export type MatanotFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MatanotFiltersInput>>>;
  appruved?: InputMaybe<BooleanFilterInput>;
  archived?: InputMaybe<BooleanFilterInput>;
  bakashas?: InputMaybe<BakashaFiltersInput>;
  categories?: InputMaybe<CategoryFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  currency?: InputMaybe<MatbeaFiltersInput>;
  decision?: InputMaybe<DecisionFiltersInput>;
  desc?: InputMaybe<JsonFilterInput>;
  estimatedPrice?: InputMaybe<FloatFilterInput>;
  finnishDate?: InputMaybe<DateTimeFilterInput>;
  fixPrice?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  lat?: InputMaybe<FloatFilterInput>;
  lng?: InputMaybe<FloatFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MatanotFiltersInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  marginPct?: InputMaybe<FloatFilterInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  matanot_recipe_missions?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  matanot_recipe_resources?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  matanotpend?: InputMaybe<MatanotpendFiltersInput>;
  maxsaleyearone?: InputMaybe<FloatFilterInput>;
  maxsaleyearsec?: InputMaybe<FloatFilterInput>;
  minsaleyearone?: InputMaybe<FloatFilterInput>;
  minsaleyearsec?: InputMaybe<FloatFilterInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  negos?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<MatanotFiltersInput>;
  oneForeProject?: InputMaybe<BooleanFilterInput>;
  or?: InputMaybe<Array<InputMaybe<MatanotFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  price?: InputMaybe<FloatFilterInput>;
  pricingMode?: InputMaybe<StringFilterInput>;
  process?: InputMaybe<PartofFiltersInput>;
  projectcreates?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quant?: InputMaybe<FloatFilterInput>;
  radius?: InputMaybe<LongFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  ratson_proposals?: InputMaybe<RatsonProposalFiltersInput>;
  ratsons?: InputMaybe<RatsonFiltersInput>;
  sale?: InputMaybe<SaleFiltersInput>;
  sales?: InputMaybe<FloatFilterInput>;
  sheirut_fulfillments?: InputMaybe<SheirutFulfillmentFiltersInput>;
  sheirutpends?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  source_proposals?: InputMaybe<RatsonFiltersInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  status_of_voting?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MatanotInput = {
  appruved?: InputMaybe<Scalars['Boolean']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  bakashas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  currency?: InputMaybe<Scalars['ID']['input']>;
  decision?: InputMaybe<Scalars['ID']['input']>;
  desc?: InputMaybe<Scalars['JSON']['input']>;
  estimatedPrice?: InputMaybe<Scalars['Float']['input']>;
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  fixPrice?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Matanot_Kindof>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  marginPct?: InputMaybe<Scalars['Float']['input']>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot_recipe_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot_recipe_resources?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanotpend?: InputMaybe<Scalars['ID']['input']>;
  maxsaleyearone?: InputMaybe<Scalars['Float']['input']>;
  maxsaleyearsec?: InputMaybe<Scalars['Float']['input']>;
  minsaleyearone?: InputMaybe<Scalars['Float']['input']>;
  minsaleyearsec?: InputMaybe<Scalars['Float']['input']>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  negos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  oneForeProject?: InputMaybe<Scalars['Boolean']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pic?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  pricingMode?: InputMaybe<Enum_Matanot_Pricingmode>;
  process?: InputMaybe<Scalars['ID']['input']>;
  projectcreates?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quant?: InputMaybe<Scalars['Float']['input']>;
  radius?: InputMaybe<Scalars['Long']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  ratson_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ratsons?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sale?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sales?: InputMaybe<Scalars['Float']['input']>;
  sheirut_fulfillments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  source_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  status_of_voting?: InputMaybe<Enum_Matanot_Status_Of_Voting>;
};

export type MatanotRecipeMission = {
  __typename?: 'MatanotRecipeMission';
  assignedMember?: Maybe<UsersPermissionsUserEntityResponse>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  hoursPerUnit?: Maybe<Scalars['Float']['output']>;
  matanot?: Maybe<MatanotEntityResponse>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  mode?: Maybe<Enum_Matanotrecipemission_Mode>;
  nego?: Maybe<NegoEntityResponse>;
  notes?: Maybe<Scalars['String']['output']>;
  partof?: Maybe<PartofEntityResponse>;
  pendm?: Maybe<PendmEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratePerHour?: Maybe<Scalars['Float']['output']>;
  unitsPerProduct?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MatanotRecipeMissionEntity = {
  __typename?: 'MatanotRecipeMissionEntity';
  attributes?: Maybe<MatanotRecipeMission>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MatanotRecipeMissionEntityResponse = {
  __typename?: 'MatanotRecipeMissionEntityResponse';
  data?: Maybe<MatanotRecipeMissionEntity>;
};

export type MatanotRecipeMissionEntityResponseCollection = {
  __typename?: 'MatanotRecipeMissionEntityResponseCollection';
  data: Array<MatanotRecipeMissionEntity>;
  meta: ResponseCollectionMeta;
};

export type MatanotRecipeMissionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MatanotRecipeMissionFiltersInput>>>;
  assignedMember?: InputMaybe<UsersPermissionsUserFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  hoursPerUnit?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  mode?: InputMaybe<StringFilterInput>;
  nego?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  notes?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<MatanotRecipeMissionFiltersInput>>>;
  partof?: InputMaybe<PartofFiltersInput>;
  pendm?: InputMaybe<PendmFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratePerHour?: InputMaybe<FloatFilterInput>;
  unitsPerProduct?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MatanotRecipeMissionInput = {
  assignedMember?: InputMaybe<Scalars['ID']['input']>;
  hoursPerUnit?: InputMaybe<Scalars['Float']['input']>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  mode?: InputMaybe<Enum_Matanotrecipemission_Mode>;
  nego?: InputMaybe<Scalars['ID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  partof?: InputMaybe<Scalars['ID']['input']>;
  pendm?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratePerHour?: InputMaybe<Scalars['Float']['input']>;
  unitsPerProduct?: InputMaybe<Scalars['Float']['input']>;
};

export type MatanotRecipeMissionRelationResponseCollection = {
  __typename?: 'MatanotRecipeMissionRelationResponseCollection';
  data: Array<MatanotRecipeMissionEntity>;
};

export type MatanotRecipeResource = {
  __typename?: 'MatanotRecipeResource';
  assignedMember?: Maybe<UsersPermissionsUserEntityResponse>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  kindOf?: Maybe<Enum_Matanotreciperesource_Kindof>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  matanot?: Maybe<MatanotEntityResponse>;
  mode?: Maybe<Enum_Matanotreciperesource_Mode>;
  nego?: Maybe<NegoEntityResponse>;
  notes?: Maybe<Scalars['String']['output']>;
  pmash?: Maybe<PmashEntityResponse>;
  pricePerUnit?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quantityPerUnit?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MatanotRecipeResourceEntity = {
  __typename?: 'MatanotRecipeResourceEntity';
  attributes?: Maybe<MatanotRecipeResource>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MatanotRecipeResourceEntityResponse = {
  __typename?: 'MatanotRecipeResourceEntityResponse';
  data?: Maybe<MatanotRecipeResourceEntity>;
};

export type MatanotRecipeResourceEntityResponseCollection = {
  __typename?: 'MatanotRecipeResourceEntityResponseCollection';
  data: Array<MatanotRecipeResourceEntity>;
  meta: ResponseCollectionMeta;
};

export type MatanotRecipeResourceFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MatanotRecipeResourceFiltersInput>>>;
  assignedMember?: InputMaybe<UsersPermissionsUserFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  mashabetahalich?: InputMaybe<MashabetahalichFiltersInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  mode?: InputMaybe<StringFilterInput>;
  nego?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  notes?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<MatanotRecipeResourceFiltersInput>>>;
  pmash?: InputMaybe<PmashFiltersInput>;
  pricePerUnit?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quantityPerUnit?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MatanotRecipeResourceInput = {
  assignedMember?: InputMaybe<Scalars['ID']['input']>;
  kindOf?: InputMaybe<Enum_Matanotreciperesource_Kindof>;
  mashabetahalich?: InputMaybe<Scalars['ID']['input']>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  mode?: InputMaybe<Enum_Matanotreciperesource_Mode>;
  nego?: InputMaybe<Scalars['ID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  pricePerUnit?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quantityPerUnit?: InputMaybe<Scalars['Float']['input']>;
};

export type MatanotRecipeResourceRelationResponseCollection = {
  __typename?: 'MatanotRecipeResourceRelationResponseCollection';
  data: Array<MatanotRecipeResourceEntity>;
};

export type MatanotRelationResponseCollection = {
  __typename?: 'MatanotRelationResponseCollection';
  data: Array<MatanotEntity>;
};

export type Matanotpend = {
  __typename?: 'Matanotpend';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  matanot?: Maybe<MatanotEntityResponse>;
  negos?: Maybe<NegoRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  status_pend?: Maybe<Enum_Matanotpend_Status_Pend>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  votes?: Maybe<VoteRelationResponseCollection>;
};


export type MatanotpendForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotpendNegosArgs = {
  filters?: InputMaybe<NegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatanotpendVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MatanotpendEntity = {
  __typename?: 'MatanotpendEntity';
  attributes?: Maybe<Matanotpend>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MatanotpendEntityResponse = {
  __typename?: 'MatanotpendEntityResponse';
  data?: Maybe<MatanotpendEntity>;
};

export type MatanotpendEntityResponseCollection = {
  __typename?: 'MatanotpendEntityResponseCollection';
  data: Array<MatanotpendEntity>;
  meta: ResponseCollectionMeta;
};

export type MatanotpendFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MatanotpendFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  negos?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<MatanotpendFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MatanotpendFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  resolvedAt?: InputMaybe<DateTimeFilterInput>;
  status_pend?: InputMaybe<StringFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  votes?: InputMaybe<VoteFiltersInput>;
};

export type MatanotpendInput = {
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  negos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  resolvedAt?: InputMaybe<Scalars['DateTime']['input']>;
  status_pend?: InputMaybe<Enum_Matanotpend_Status_Pend>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type Matbea = {
  __typename?: 'Matbea';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  halukas?: Maybe<HalukaRelationResponseCollection>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MatbeaRelationResponseCollection>;
  mashabetahaliches?: Maybe<MashabetahalichRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson_proposals?: Maybe<RatsonProposalRelationResponseCollection>;
  simbol?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type MatbeaHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatbeaLocalizationsArgs = {
  filters?: InputMaybe<MatbeaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatbeaMashabetahalichesArgs = {
  filters?: InputMaybe<MashabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatbeaMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MatbeaRatson_ProposalsArgs = {
  filters?: InputMaybe<RatsonProposalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MatbeaEntity = {
  __typename?: 'MatbeaEntity';
  attributes?: Maybe<Matbea>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MatbeaEntityResponse = {
  __typename?: 'MatbeaEntityResponse';
  data?: Maybe<MatbeaEntity>;
};

export type MatbeaEntityResponseCollection = {
  __typename?: 'MatbeaEntityResponseCollection';
  data: Array<MatbeaEntity>;
  meta: ResponseCollectionMeta;
};

export type MatbeaFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MatbeaFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  halukas?: InputMaybe<HalukaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MatbeaFiltersInput>;
  mashabetahaliches?: InputMaybe<MashabetahalichFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MatbeaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MatbeaFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson_proposals?: InputMaybe<RatsonProposalFiltersInput>;
  simbol?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MatbeaInput = {
  halukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  simbol?: InputMaybe<Scalars['String']['input']>;
};

export type MatbeaRelationResponseCollection = {
  __typename?: 'MatbeaRelationResponseCollection';
  data: Array<MatbeaEntity>;
};

export type Mesimabetahalich = {
  __typename?: 'Mesimabetahalich';
  activeTimer?: Maybe<TimerEntityResponse>;
  acts?: Maybe<ActRelationResponseCollection>;
  admaticedai?: Maybe<Scalars['DateTime']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dates?: Maybe<Scalars['DateTime']['output']>;
  decisions?: Maybe<DecisionRelationResponseCollection>;
  descrip?: Maybe<Scalars['String']['output']>;
  finiapruvals?: Maybe<FiniapruvalRelationResponseCollection>;
  finnished?: Maybe<Scalars['Boolean']['output']>;
  finnished_missions?: Maybe<FinnishedMissionRelationResponseCollection>;
  forappruval?: Maybe<Scalars['Boolean']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  hoursassinged?: Maybe<Scalars['Float']['output']>;
  howmanyhoursalready?: Maybe<Scalars['Float']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  isglobal?: Maybe<Scalars['Boolean']['output']>;
  iskvua?: Maybe<Scalars['Boolean']['output']>;
  matanot_recipe_missions?: Maybe<MatanotRecipeMissionRelationResponseCollection>;
  mission?: Maybe<MissionEntityResponse>;
  monter?: Maybe<Array<Maybe<ComponentNewMonter>>>;
  monters?: Maybe<MonterRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  perhour?: Maybe<Scalars['Float']['output']>;
  privatlinks?: Maybe<Scalars['String']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publicklinks?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  seeders?: Maybe<SeederRelationResponseCollection>;
  sheirut_fulfillments?: Maybe<SheirutFulfillmentRelationResponseCollection>;
  start?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  stname: Scalars['String']['output'];
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  timegramas?: Maybe<TimegramaRelationResponseCollection>;
  timer?: Maybe<Scalars['Float']['output']>;
  timers?: Maybe<TimerRelationResponseCollection>;
  totalHoursSaved?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  zohars?: Maybe<ZoharRelationResponseCollection>;
};


export type MesimabetahalichActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichDecisionsArgs = {
  filters?: InputMaybe<DecisionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichFinnished_MissionsArgs = {
  filters?: InputMaybe<FinnishedMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichMatanot_Recipe_MissionsArgs = {
  filters?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichMonterArgs = {
  filters?: InputMaybe<ComponentNewMonterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichMontersArgs = {
  filters?: InputMaybe<MonterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichSeedersArgs = {
  filters?: InputMaybe<SeederFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichSheirut_FulfillmentsArgs = {
  filters?: InputMaybe<SheirutFulfillmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichTimegramasArgs = {
  filters?: InputMaybe<TimegramaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichTimersArgs = {
  filters?: InputMaybe<TimerFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MesimabetahalichZoharsArgs = {
  filters?: InputMaybe<ZoharFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MesimabetahalichEntity = {
  __typename?: 'MesimabetahalichEntity';
  attributes?: Maybe<Mesimabetahalich>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MesimabetahalichEntityResponse = {
  __typename?: 'MesimabetahalichEntityResponse';
  data?: Maybe<MesimabetahalichEntity>;
};

export type MesimabetahalichEntityResponseCollection = {
  __typename?: 'MesimabetahalichEntityResponseCollection';
  data: Array<MesimabetahalichEntity>;
  meta: ResponseCollectionMeta;
};

export type MesimabetahalichFiltersInput = {
  activeTimer?: InputMaybe<TimerFiltersInput>;
  acts?: InputMaybe<ActFiltersInput>;
  admaticedai?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<MesimabetahalichFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  dates?: InputMaybe<DateTimeFilterInput>;
  decisions?: InputMaybe<DecisionFiltersInput>;
  descrip?: InputMaybe<StringFilterInput>;
  finiapruvals?: InputMaybe<FiniapruvalFiltersInput>;
  finnished?: InputMaybe<BooleanFilterInput>;
  finnished_missions?: InputMaybe<FinnishedMissionFiltersInput>;
  forappruval?: InputMaybe<BooleanFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  hearotMeyuchadot?: InputMaybe<StringFilterInput>;
  hoursassinged?: InputMaybe<FloatFilterInput>;
  howmanyhoursalready?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  isglobal?: InputMaybe<BooleanFilterInput>;
  iskvua?: InputMaybe<BooleanFilterInput>;
  matanot_recipe_missions?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  mission?: InputMaybe<MissionFiltersInput>;
  monter?: InputMaybe<ComponentNewMonterFiltersInput>;
  monters?: InputMaybe<MonterFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MesimabetahalichFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MesimabetahalichFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  perhour?: InputMaybe<FloatFilterInput>;
  privatlinks?: InputMaybe<StringFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publicklinks?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  seeders?: InputMaybe<SeederFiltersInput>;
  sheirut_fulfillments?: InputMaybe<SheirutFulfillmentFiltersInput>;
  start?: InputMaybe<DateTimeFilterInput>;
  status?: InputMaybe<IntFilterInput>;
  stname?: InputMaybe<StringFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  timegramas?: InputMaybe<TimegramaFiltersInput>;
  timer?: InputMaybe<FloatFilterInput>;
  timers?: InputMaybe<TimerFiltersInput>;
  totalHoursSaved?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  zohars?: InputMaybe<ZoharFiltersInput>;
};

export type MesimabetahalichInput = {
  activeTimer?: InputMaybe<Scalars['ID']['input']>;
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  admaticedai?: InputMaybe<Scalars['DateTime']['input']>;
  dates?: InputMaybe<Scalars['DateTime']['input']>;
  decisions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  finiapruvals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  finnished?: InputMaybe<Scalars['Boolean']['input']>;
  finnished_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  forappruval?: InputMaybe<Scalars['Boolean']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  hoursassinged?: InputMaybe<Scalars['Float']['input']>;
  howmanyhoursalready?: InputMaybe<Scalars['Float']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  isglobal?: InputMaybe<Scalars['Boolean']['input']>;
  iskvua?: InputMaybe<Scalars['Boolean']['input']>;
  matanot_recipe_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mission?: InputMaybe<Scalars['ID']['input']>;
  monter?: InputMaybe<Array<InputMaybe<ComponentNewMonterInput>>>;
  monters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  privatlinks?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publicklinks?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  seeders?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirut_fulfillments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<Scalars['Int']['input']>;
  stname?: InputMaybe<Scalars['String']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  timegramas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  timer?: InputMaybe<Scalars['Float']['input']>;
  timers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  totalHoursSaved?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  zohars?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type MesimabetahalichRelationResponseCollection = {
  __typename?: 'MesimabetahalichRelationResponseCollection';
  data: Array<MesimabetahalichEntity>;
};

export type Message = {
  __typename?: 'Message';
  archived?: Maybe<Scalars['Boolean']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  editHistory?: Maybe<Array<Maybe<ComponentNewEdits>>>;
  fid?: Maybe<Scalars['Int']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  raplyTo?: Maybe<MessageEntityResponse>;
  replys?: Maybe<MessageRelationResponseCollection>;
  seen?: Maybe<Array<Maybe<ComponentNewSeen>>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  when?: Maybe<Scalars['DateTime']['output']>;
};


export type MessageEditHistoryArgs = {
  filters?: InputMaybe<ComponentNewEditsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MessageReplysArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MessageSeenArgs = {
  filters?: InputMaybe<ComponentNewSeenFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MessageEntity = {
  __typename?: 'MessageEntity';
  attributes?: Maybe<Message>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MessageEntityResponse = {
  __typename?: 'MessageEntityResponse';
  data?: Maybe<MessageEntity>;
};

export type MessageEntityResponseCollection = {
  __typename?: 'MessageEntityResponseCollection';
  data: Array<MessageEntity>;
  meta: ResponseCollectionMeta;
};

export type MessageFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MessageFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  content?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  editHistory?: InputMaybe<ComponentNewEditsFiltersInput>;
  fid?: InputMaybe<IntFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<MessageFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MessageFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  raplyTo?: InputMaybe<MessageFiltersInput>;
  replys?: InputMaybe<MessageFiltersInput>;
  seen?: InputMaybe<ComponentNewSeenFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  when?: InputMaybe<DateTimeFilterInput>;
};

export type MessageInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  editHistory?: InputMaybe<Array<InputMaybe<ComponentNewEditsInput>>>;
  fid?: InputMaybe<Scalars['Int']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  raplyTo?: InputMaybe<Scalars['ID']['input']>;
  replys?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  seen?: InputMaybe<Array<InputMaybe<ComponentNewSeenInput>>>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  when?: InputMaybe<Scalars['DateTime']['input']>;
};

export type MessageRelationResponseCollection = {
  __typename?: 'MessageRelationResponseCollection';
  data: Array<MessageEntity>;
};

export type Mission = {
  __typename?: 'Mission';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  embedding_id?: Maybe<Scalars['String']['output']>;
  finnished_missions?: Maybe<FinnishedMissionRelationResponseCollection>;
  kindOf?: Maybe<Enum_Mission_Kindof>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MissionRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  missionName: Scalars['String']['output'];
  negos?: Maybe<NegoRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratsons?: Maybe<RatsonRelationResponseCollection>;
  skills?: Maybe<SkillRelationResponseCollection>;
  synonyms?: Maybe<Scalars['JSON']['output']>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  usage_count?: Maybe<Scalars['Int']['output']>;
  users_can_do?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  work_ways?: Maybe<WorkWayRelationResponseCollection>;
};


export type MissionFinnished_MissionsArgs = {
  filters?: InputMaybe<FinnishedMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionLocalizationsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionNegosArgs = {
  filters?: InputMaybe<NegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionRatsonsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionSkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionUsers_Can_DoArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MissionWork_WaysArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MissionEntity = {
  __typename?: 'MissionEntity';
  attributes?: Maybe<Mission>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MissionEntityResponse = {
  __typename?: 'MissionEntityResponse';
  data?: Maybe<MissionEntity>;
};

export type MissionEntityResponseCollection = {
  __typename?: 'MissionEntityResponseCollection';
  data: Array<MissionEntity>;
  meta: ResponseCollectionMeta;
};

export type MissionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MissionFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  embedding_id?: InputMaybe<StringFilterInput>;
  finnished_missions?: InputMaybe<FinnishedMissionFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MissionFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  missionName?: InputMaybe<StringFilterInput>;
  negos?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<MissionFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MissionFiltersInput>>>;
  pendms?: InputMaybe<PendmFiltersInput>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratsons?: InputMaybe<RatsonFiltersInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  synonyms?: InputMaybe<JsonFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  usage_count?: InputMaybe<IntFilterInput>;
  users_can_do?: InputMaybe<UsersPermissionsUserFiltersInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
};

export type MissionInput = {
  descrip?: InputMaybe<Scalars['String']['input']>;
  embedding_id?: InputMaybe<Scalars['String']['input']>;
  finnished_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  kindOf?: InputMaybe<Enum_Mission_Kindof>;
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  missionName?: InputMaybe<Scalars['String']['input']>;
  negos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratsons?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  synonyms?: InputMaybe<Scalars['JSON']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  usage_count?: InputMaybe<Scalars['Int']['input']>;
  users_can_do?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  work_ways?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type MissionRelationResponseCollection = {
  __typename?: 'MissionRelationResponseCollection';
  data: Array<MissionEntity>;
};

export type Mode = {
  __typename?: 'Mode';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  sps?: Maybe<SpRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  yat?: Maybe<YatEntityResponse>;
};


export type ModeSpsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ModeEntity = {
  __typename?: 'ModeEntity';
  attributes?: Maybe<Mode>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ModeEntityResponse = {
  __typename?: 'ModeEntityResponse';
  data?: Maybe<ModeEntity>;
};

export type ModeEntityResponseCollection = {
  __typename?: 'ModeEntityResponseCollection';
  data: Array<ModeEntity>;
  meta: ResponseCollectionMeta;
};

export type ModeFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ModeFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ModeFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ModeFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  sps?: InputMaybe<SpFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  yat?: InputMaybe<YatFiltersInput>;
};

export type ModeInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  sps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  yat?: InputMaybe<Scalars['ID']['input']>;
};

export type ModeRelationResponseCollection = {
  __typename?: 'ModeRelationResponseCollection';
  data: Array<ModeEntity>;
};

export type Monter = {
  __typename?: 'Monter';
  ani?: Maybe<Scalars['String']['output']>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  done?: Maybe<Scalars['Boolean']['output']>;
  finish?: Maybe<Scalars['DateTime']['output']>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  sale?: Maybe<SaleEntityResponse>;
  sheirut?: Maybe<SheirutEntityResponse>;
  start?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  want?: Maybe<WantEntityResponse>;
};

export type MonterEntity = {
  __typename?: 'MonterEntity';
  attributes?: Maybe<Monter>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type MonterEntityResponse = {
  __typename?: 'MonterEntityResponse';
  data?: Maybe<MonterEntity>;
};

export type MonterEntityResponseCollection = {
  __typename?: 'MonterEntityResponseCollection';
  data: Array<MonterEntity>;
  meta: ResponseCollectionMeta;
};

export type MonterFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MonterFiltersInput>>>;
  ani?: InputMaybe<StringFilterInput>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  done?: InputMaybe<BooleanFilterInput>;
  finish?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<MonterFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MonterFiltersInput>>>;
  sale?: InputMaybe<SaleFiltersInput>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  start?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  want?: InputMaybe<WantFiltersInput>;
};

export type MonterInput = {
  ani?: InputMaybe<Scalars['String']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  finish?: InputMaybe<Scalars['DateTime']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  sale?: InputMaybe<Scalars['ID']['input']>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
  want?: InputMaybe<Scalars['ID']['input']>;
};

export type MonterRelationResponseCollection = {
  __typename?: 'MonterRelationResponseCollection';
  data: Array<MonterEntity>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Change user password. Confirm with the current password. */
  changePassword?: Maybe<UsersPermissionsLoginPayload>;
  createAct?: Maybe<ActEntityResponse>;
  createActLocalization?: Maybe<ActEntityResponse>;
  createActt?: Maybe<ActtEntityResponse>;
  createApiKey?: Maybe<ApiKeyEntityResponse>;
  createArgument?: Maybe<ArgumentEntityResponse>;
  createAsk?: Maybe<AskEntityResponse>;
  createAskm?: Maybe<AskmEntityResponse>;
  createAskwant?: Maybe<AskwantEntityResponse>;
  createBakasha?: Maybe<BakashaEntityResponse>;
  createCategory?: Maybe<CategoryEntityResponse>;
  createCategoryLocalization?: Maybe<CategoryEntityResponse>;
  createChezin?: Maybe<ChezinEntityResponse>;
  createChezinLocalization?: Maybe<ChezinEntityResponse>;
  createClause?: Maybe<ClauseEntityResponse>;
  createContentReleasesRelease?: Maybe<ContentReleasesReleaseEntityResponse>;
  createContentReleasesReleaseAction?: Maybe<ContentReleasesReleaseActionEntityResponse>;
  createConventionText?: Maybe<ConventionTextEntityResponse>;
  createConventionTextLocalization?: Maybe<ConventionTextEntityResponse>;
  createCuntry?: Maybe<CuntryEntityResponse>;
  createCuntryLocalization?: Maybe<CuntryEntityResponse>;
  createDea?: Maybe<DeaEntityResponse>;
  createDeal?: Maybe<DealEntityResponse>;
  createDecision?: Maybe<DecisionEntityResponse>;
  createDeffinition?: Maybe<DeffinitionEntityResponse>;
  createDeffinitionLocalization?: Maybe<DeffinitionEntityResponse>;
  createFiltertag?: Maybe<FiltertagEntityResponse>;
  createFiltertagLocalization?: Maybe<FiltertagEntityResponse>;
  createFiniapruval?: Maybe<FiniapruvalEntityResponse>;
  createFinnishedMission?: Maybe<FinnishedMissionEntityResponse>;
  createFinnishedMissionLocalization?: Maybe<FinnishedMissionEntityResponse>;
  createForum?: Maybe<ForumEntityResponse>;
  createForumLastSeen?: Maybe<ForumLastSeenEntityResponse>;
  createHaamada?: Maybe<HaamadaEntityResponse>;
  createHaamadapruv?: Maybe<HaamadapruvEntityResponse>;
  createHaluka?: Maybe<HalukaEntityResponse>;
  createHalukaLocalization?: Maybe<HalukaEntityResponse>;
  createHatzaa?: Maybe<HatzaaEntityResponse>;
  createHazbaah?: Maybe<HazbaahEntityResponse>;
  createIssue?: Maybe<IssueEntityResponse>;
  createMaap?: Maybe<MaapEntityResponse>;
  createMaapLocalization?: Maybe<MaapEntityResponse>;
  createMachshir?: Maybe<MachshirEntityResponse>;
  createMashaabim?: Maybe<MashaabimEntityResponse>;
  createMashaabimLocalization?: Maybe<MashaabimEntityResponse>;
  createMashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  createMatanot?: Maybe<MatanotEntityResponse>;
  createMatanotLocalization?: Maybe<MatanotEntityResponse>;
  createMatanotRecipeMission?: Maybe<MatanotRecipeMissionEntityResponse>;
  createMatanotRecipeResource?: Maybe<MatanotRecipeResourceEntityResponse>;
  createMatanotpend?: Maybe<MatanotpendEntityResponse>;
  createMatbea?: Maybe<MatbeaEntityResponse>;
  createMatbeaLocalization?: Maybe<MatbeaEntityResponse>;
  createMesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  createMessage?: Maybe<MessageEntityResponse>;
  createMission?: Maybe<MissionEntityResponse>;
  createMissionLocalization?: Maybe<MissionEntityResponse>;
  createMode?: Maybe<ModeEntityResponse>;
  createMonter?: Maybe<MonterEntityResponse>;
  createNego?: Maybe<NegoEntityResponse>;
  createNegoMash?: Maybe<NegoMashEntityResponse>;
  createNegopendmission?: Maybe<NegopendmissionEntityResponse>;
  createNegotiation?: Maybe<NegotiationEntityResponse>;
  createOpenMashaabim?: Maybe<OpenMashaabimEntityResponse>;
  createOpenMashaabimLocalization?: Maybe<OpenMashaabimEntityResponse>;
  createOpenMission?: Maybe<OpenMissionEntityResponse>;
  createOpenMissionLocalization?: Maybe<OpenMissionEntityResponse>;
  createPartof?: Maybe<PartofEntityResponse>;
  createPendm?: Maybe<PendmEntityResponse>;
  createPgisha?: Maybe<PgishaEntityResponse>;
  createPgishaLocalization?: Maybe<PgishaEntityResponse>;
  createPgishauser?: Maybe<PgishauserEntityResponse>;
  createPgishauserpend?: Maybe<PgishauserpendEntityResponse>;
  createPmash?: Maybe<PmashEntityResponse>;
  createPosition?: Maybe<PositionEntityResponse>;
  createProject?: Maybe<ProjectEntityResponse>;
  createProjectLocalization?: Maybe<ProjectEntityResponse>;
  createProviderProfile?: Maybe<ProviderProfileEntityResponse>;
  createRatson?: Maybe<RatsonEntityResponse>;
  createRatsonLocalization?: Maybe<RatsonEntityResponse>;
  createRatsonMatchJob?: Maybe<RatsonMatchJobEntityResponse>;
  createRatsonProposal?: Maybe<RatsonProposalEntityResponse>;
  createRatsonShare?: Maybe<RatsonShareEntityResponse>;
  createRichtext?: Maybe<RichtextEntityResponse>;
  createRichtextLocalization?: Maybe<RichtextEntityResponse>;
  createRikmash?: Maybe<RikmashEntityResponse>;
  createSale?: Maybe<SaleEntityResponse>;
  createSeeder?: Maybe<SeederEntityResponse>;
  createSheirut?: Maybe<SheirutEntityResponse>;
  createSheirutFulfillment?: Maybe<SheirutFulfillmentEntityResponse>;
  createSheirutLocalization?: Maybe<SheirutEntityResponse>;
  createSheirutnego?: Maybe<SheirutnegoEntityResponse>;
  createSheirutpend?: Maybe<SheirutpendEntityResponse>;
  createSheirutpendLocalization?: Maybe<SheirutpendEntityResponse>;
  createSidur?: Maybe<SidurEntityResponse>;
  createSiteReport?: Maybe<SiteReportEntityResponse>;
  createSiteShareContribution?: Maybe<SiteShareContributionEntityResponse>;
  createSkill?: Maybe<SkillEntityResponse>;
  createSkillLocalization?: Maybe<SkillEntityResponse>;
  createSolution?: Maybe<SolutionEntityResponse>;
  createSp?: Maybe<SpEntityResponse>;
  createSpLocalization?: Maybe<SpEntityResponse>;
  createTafkidim?: Maybe<TafkidimEntityResponse>;
  createTafkidimLocalization?: Maybe<TafkidimEntityResponse>;
  createTikunolam?: Maybe<TikunolamEntityResponse>;
  createTikunolamLocalization?: Maybe<TikunolamEntityResponse>;
  createTimegrama?: Maybe<TimegramaEntityResponse>;
  createTimer?: Maybe<TimerEntityResponse>;
  createTimerLocalization?: Maybe<TimerEntityResponse>;
  createTosplit?: Maybe<TosplitEntityResponse>;
  createTosplitLocalization?: Maybe<TosplitEntityResponse>;
  createTranslate?: Maybe<TranslateEntityResponse>;
  createUploadFile?: Maybe<UploadFileEntityResponse>;
  createUploadFolder?: Maybe<UploadFolderEntityResponse>;
  /** Create a new role */
  createUsersPermissionsRole?: Maybe<UsersPermissionsCreateRolePayload>;
  /** Create a new user */
  createUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  createVallue?: Maybe<VallueEntityResponse>;
  createVallueLocalization?: Maybe<VallueEntityResponse>;
  createVote?: Maybe<VoteEntityResponse>;
  createWant?: Maybe<WantEntityResponse>;
  createWantLocalization?: Maybe<WantEntityResponse>;
  createWelcomTop?: Maybe<WelcomTopEntityResponse>;
  createWhatandwhyLocalization?: Maybe<WhatandwhyEntityResponse>;
  createWorkWay?: Maybe<WorkWayEntityResponse>;
  createWorkWayLocalization?: Maybe<WorkWayEntityResponse>;
  createYat?: Maybe<YatEntityResponse>;
  createZohar?: Maybe<ZoharEntityResponse>;
  deleteAct?: Maybe<ActEntityResponse>;
  deleteActt?: Maybe<ActtEntityResponse>;
  deleteApiKey?: Maybe<ApiKeyEntityResponse>;
  deleteArgument?: Maybe<ArgumentEntityResponse>;
  deleteAsk?: Maybe<AskEntityResponse>;
  deleteAskm?: Maybe<AskmEntityResponse>;
  deleteAskwant?: Maybe<AskwantEntityResponse>;
  deleteBakasha?: Maybe<BakashaEntityResponse>;
  deleteCategory?: Maybe<CategoryEntityResponse>;
  deleteChezin?: Maybe<ChezinEntityResponse>;
  deleteClause?: Maybe<ClauseEntityResponse>;
  deleteContentReleasesRelease?: Maybe<ContentReleasesReleaseEntityResponse>;
  deleteContentReleasesReleaseAction?: Maybe<ContentReleasesReleaseActionEntityResponse>;
  deleteConventionText?: Maybe<ConventionTextEntityResponse>;
  deleteCuntry?: Maybe<CuntryEntityResponse>;
  deleteDea?: Maybe<DeaEntityResponse>;
  deleteDeal?: Maybe<DealEntityResponse>;
  deleteDecision?: Maybe<DecisionEntityResponse>;
  deleteDeffinition?: Maybe<DeffinitionEntityResponse>;
  deleteFiltertag?: Maybe<FiltertagEntityResponse>;
  deleteFiniapruval?: Maybe<FiniapruvalEntityResponse>;
  deleteFinnishedMission?: Maybe<FinnishedMissionEntityResponse>;
  deleteForum?: Maybe<ForumEntityResponse>;
  deleteForumLastSeen?: Maybe<ForumLastSeenEntityResponse>;
  deleteHaamada?: Maybe<HaamadaEntityResponse>;
  deleteHaamadapruv?: Maybe<HaamadapruvEntityResponse>;
  deleteHaluka?: Maybe<HalukaEntityResponse>;
  deleteHatzaa?: Maybe<HatzaaEntityResponse>;
  deleteHazbaah?: Maybe<HazbaahEntityResponse>;
  deleteIssue?: Maybe<IssueEntityResponse>;
  deleteMaap?: Maybe<MaapEntityResponse>;
  deleteMachshir?: Maybe<MachshirEntityResponse>;
  deleteMashaabim?: Maybe<MashaabimEntityResponse>;
  deleteMashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  deleteMatanot?: Maybe<MatanotEntityResponse>;
  deleteMatanotRecipeMission?: Maybe<MatanotRecipeMissionEntityResponse>;
  deleteMatanotRecipeResource?: Maybe<MatanotRecipeResourceEntityResponse>;
  deleteMatanotpend?: Maybe<MatanotpendEntityResponse>;
  deleteMatbea?: Maybe<MatbeaEntityResponse>;
  deleteMesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  deleteMessage?: Maybe<MessageEntityResponse>;
  deleteMission?: Maybe<MissionEntityResponse>;
  deleteMode?: Maybe<ModeEntityResponse>;
  deleteMonter?: Maybe<MonterEntityResponse>;
  deleteNego?: Maybe<NegoEntityResponse>;
  deleteNegoMash?: Maybe<NegoMashEntityResponse>;
  deleteNegopendmission?: Maybe<NegopendmissionEntityResponse>;
  deleteNegotiation?: Maybe<NegotiationEntityResponse>;
  deleteOpenMashaabim?: Maybe<OpenMashaabimEntityResponse>;
  deleteOpenMission?: Maybe<OpenMissionEntityResponse>;
  deletePartof?: Maybe<PartofEntityResponse>;
  deletePendm?: Maybe<PendmEntityResponse>;
  deletePgisha?: Maybe<PgishaEntityResponse>;
  deletePgishauser?: Maybe<PgishauserEntityResponse>;
  deletePgishauserpend?: Maybe<PgishauserpendEntityResponse>;
  deletePmash?: Maybe<PmashEntityResponse>;
  deletePosition?: Maybe<PositionEntityResponse>;
  deleteProject?: Maybe<ProjectEntityResponse>;
  deleteProviderProfile?: Maybe<ProviderProfileEntityResponse>;
  deleteRatson?: Maybe<RatsonEntityResponse>;
  deleteRatsonMatchJob?: Maybe<RatsonMatchJobEntityResponse>;
  deleteRatsonProposal?: Maybe<RatsonProposalEntityResponse>;
  deleteRatsonShare?: Maybe<RatsonShareEntityResponse>;
  deleteRichtext?: Maybe<RichtextEntityResponse>;
  deleteRikmash?: Maybe<RikmashEntityResponse>;
  deleteSale?: Maybe<SaleEntityResponse>;
  deleteSeeder?: Maybe<SeederEntityResponse>;
  deleteSheirut?: Maybe<SheirutEntityResponse>;
  deleteSheirutFulfillment?: Maybe<SheirutFulfillmentEntityResponse>;
  deleteSheirutnego?: Maybe<SheirutnegoEntityResponse>;
  deleteSheirutpend?: Maybe<SheirutpendEntityResponse>;
  deleteSidur?: Maybe<SidurEntityResponse>;
  deleteSiteReport?: Maybe<SiteReportEntityResponse>;
  deleteSiteShareContribution?: Maybe<SiteShareContributionEntityResponse>;
  deleteSkill?: Maybe<SkillEntityResponse>;
  deleteSolution?: Maybe<SolutionEntityResponse>;
  deleteSp?: Maybe<SpEntityResponse>;
  deleteTafkidim?: Maybe<TafkidimEntityResponse>;
  deleteTikunolam?: Maybe<TikunolamEntityResponse>;
  deleteTimegrama?: Maybe<TimegramaEntityResponse>;
  deleteTimer?: Maybe<TimerEntityResponse>;
  deleteTosplit?: Maybe<TosplitEntityResponse>;
  deleteTranslate?: Maybe<TranslateEntityResponse>;
  deleteUploadFile?: Maybe<UploadFileEntityResponse>;
  deleteUploadFolder?: Maybe<UploadFolderEntityResponse>;
  /** Delete an existing role */
  deleteUsersPermissionsRole?: Maybe<UsersPermissionsDeleteRolePayload>;
  /** Delete an existing user */
  deleteUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  deleteVallue?: Maybe<VallueEntityResponse>;
  deleteVote?: Maybe<VoteEntityResponse>;
  deleteWant?: Maybe<WantEntityResponse>;
  deleteWelcomTop?: Maybe<WelcomTopEntityResponse>;
  deleteWhatandwhy?: Maybe<WhatandwhyEntityResponse>;
  deleteWorkWay?: Maybe<WorkWayEntityResponse>;
  deleteYat?: Maybe<YatEntityResponse>;
  deleteZohar?: Maybe<ZoharEntityResponse>;
  /** Confirm an email users email address */
  emailConfirmation?: Maybe<UsersPermissionsLoginPayload>;
  /** Request a reset password token */
  forgotPassword?: Maybe<UsersPermissionsPasswordPayload>;
  login: UsersPermissionsLoginPayload;
  multipleUpload: Array<Maybe<UploadFileEntityResponse>>;
  /** Register a user */
  register: UsersPermissionsLoginPayload;
  removeFile?: Maybe<UploadFileEntityResponse>;
  /** Reset user password. Confirm with a code (resetToken from forgotPassword) */
  resetPassword?: Maybe<UsersPermissionsLoginPayload>;
  updateAct?: Maybe<ActEntityResponse>;
  updateActt?: Maybe<ActtEntityResponse>;
  updateApiKey?: Maybe<ApiKeyEntityResponse>;
  updateArgument?: Maybe<ArgumentEntityResponse>;
  updateAsk?: Maybe<AskEntityResponse>;
  updateAskm?: Maybe<AskmEntityResponse>;
  updateAskwant?: Maybe<AskwantEntityResponse>;
  updateBakasha?: Maybe<BakashaEntityResponse>;
  updateCategory?: Maybe<CategoryEntityResponse>;
  updateChezin?: Maybe<ChezinEntityResponse>;
  updateClause?: Maybe<ClauseEntityResponse>;
  updateContentReleasesRelease?: Maybe<ContentReleasesReleaseEntityResponse>;
  updateContentReleasesReleaseAction?: Maybe<ContentReleasesReleaseActionEntityResponse>;
  updateConventionText?: Maybe<ConventionTextEntityResponse>;
  updateCuntry?: Maybe<CuntryEntityResponse>;
  updateDea?: Maybe<DeaEntityResponse>;
  updateDeal?: Maybe<DealEntityResponse>;
  updateDecision?: Maybe<DecisionEntityResponse>;
  updateDeffinition?: Maybe<DeffinitionEntityResponse>;
  updateFileInfo: UploadFileEntityResponse;
  updateFiltertag?: Maybe<FiltertagEntityResponse>;
  updateFiniapruval?: Maybe<FiniapruvalEntityResponse>;
  updateFinnishedMission?: Maybe<FinnishedMissionEntityResponse>;
  updateForum?: Maybe<ForumEntityResponse>;
  updateForumLastSeen?: Maybe<ForumLastSeenEntityResponse>;
  updateHaamada?: Maybe<HaamadaEntityResponse>;
  updateHaamadapruv?: Maybe<HaamadapruvEntityResponse>;
  updateHaluka?: Maybe<HalukaEntityResponse>;
  updateHatzaa?: Maybe<HatzaaEntityResponse>;
  updateHazbaah?: Maybe<HazbaahEntityResponse>;
  updateIssue?: Maybe<IssueEntityResponse>;
  updateMaap?: Maybe<MaapEntityResponse>;
  updateMachshir?: Maybe<MachshirEntityResponse>;
  updateMashaabim?: Maybe<MashaabimEntityResponse>;
  updateMashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  updateMatanot?: Maybe<MatanotEntityResponse>;
  updateMatanotRecipeMission?: Maybe<MatanotRecipeMissionEntityResponse>;
  updateMatanotRecipeResource?: Maybe<MatanotRecipeResourceEntityResponse>;
  updateMatanotpend?: Maybe<MatanotpendEntityResponse>;
  updateMatbea?: Maybe<MatbeaEntityResponse>;
  updateMesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  updateMessage?: Maybe<MessageEntityResponse>;
  updateMission?: Maybe<MissionEntityResponse>;
  updateMode?: Maybe<ModeEntityResponse>;
  updateMonter?: Maybe<MonterEntityResponse>;
  updateNego?: Maybe<NegoEntityResponse>;
  updateNegoMash?: Maybe<NegoMashEntityResponse>;
  updateNegopendmission?: Maybe<NegopendmissionEntityResponse>;
  updateNegotiation?: Maybe<NegotiationEntityResponse>;
  updateOpenMashaabim?: Maybe<OpenMashaabimEntityResponse>;
  updateOpenMission?: Maybe<OpenMissionEntityResponse>;
  updatePartof?: Maybe<PartofEntityResponse>;
  updatePendm?: Maybe<PendmEntityResponse>;
  updatePgisha?: Maybe<PgishaEntityResponse>;
  updatePgishauser?: Maybe<PgishauserEntityResponse>;
  updatePgishauserpend?: Maybe<PgishauserpendEntityResponse>;
  updatePmash?: Maybe<PmashEntityResponse>;
  updatePosition?: Maybe<PositionEntityResponse>;
  updateProject?: Maybe<ProjectEntityResponse>;
  updateProviderProfile?: Maybe<ProviderProfileEntityResponse>;
  updateRatson?: Maybe<RatsonEntityResponse>;
  updateRatsonMatchJob?: Maybe<RatsonMatchJobEntityResponse>;
  updateRatsonProposal?: Maybe<RatsonProposalEntityResponse>;
  updateRatsonShare?: Maybe<RatsonShareEntityResponse>;
  updateRichtext?: Maybe<RichtextEntityResponse>;
  updateRikmash?: Maybe<RikmashEntityResponse>;
  updateSale?: Maybe<SaleEntityResponse>;
  updateSeeder?: Maybe<SeederEntityResponse>;
  updateSheirut?: Maybe<SheirutEntityResponse>;
  updateSheirutFulfillment?: Maybe<SheirutFulfillmentEntityResponse>;
  updateSheirutnego?: Maybe<SheirutnegoEntityResponse>;
  updateSheirutpend?: Maybe<SheirutpendEntityResponse>;
  updateSidur?: Maybe<SidurEntityResponse>;
  updateSiteReport?: Maybe<SiteReportEntityResponse>;
  updateSiteShareContribution?: Maybe<SiteShareContributionEntityResponse>;
  updateSkill?: Maybe<SkillEntityResponse>;
  updateSolution?: Maybe<SolutionEntityResponse>;
  updateSp?: Maybe<SpEntityResponse>;
  updateTafkidim?: Maybe<TafkidimEntityResponse>;
  updateTikunolam?: Maybe<TikunolamEntityResponse>;
  updateTimegrama?: Maybe<TimegramaEntityResponse>;
  updateTimer?: Maybe<TimerEntityResponse>;
  updateTosplit?: Maybe<TosplitEntityResponse>;
  updateTranslate?: Maybe<TranslateEntityResponse>;
  updateUploadFile?: Maybe<UploadFileEntityResponse>;
  updateUploadFolder?: Maybe<UploadFolderEntityResponse>;
  /** Update an existing role */
  updateUsersPermissionsRole?: Maybe<UsersPermissionsUpdateRolePayload>;
  /** Update an existing user */
  updateUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  updateVallue?: Maybe<VallueEntityResponse>;
  updateVote?: Maybe<VoteEntityResponse>;
  updateWant?: Maybe<WantEntityResponse>;
  updateWelcomTop?: Maybe<WelcomTopEntityResponse>;
  updateWhatandwhy?: Maybe<WhatandwhyEntityResponse>;
  updateWorkWay?: Maybe<WorkWayEntityResponse>;
  updateYat?: Maybe<YatEntityResponse>;
  updateZohar?: Maybe<ZoharEntityResponse>;
  upload: UploadFileEntityResponse;
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  password: Scalars['String']['input'];
  passwordConfirmation: Scalars['String']['input'];
};


export type MutationCreateActArgs = {
  data: ActInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateActLocalizationArgs = {
  data?: InputMaybe<ActInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateActtArgs = {
  data: ActtInput;
};


export type MutationCreateApiKeyArgs = {
  data: ApiKeyInput;
};


export type MutationCreateArgumentArgs = {
  data: ArgumentInput;
};


export type MutationCreateAskArgs = {
  data: AskInput;
};


export type MutationCreateAskmArgs = {
  data: AskmInput;
};


export type MutationCreateAskwantArgs = {
  data: AskwantInput;
};


export type MutationCreateBakashaArgs = {
  data: BakashaInput;
};


export type MutationCreateCategoryArgs = {
  data: CategoryInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateCategoryLocalizationArgs = {
  data?: InputMaybe<CategoryInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateChezinArgs = {
  data: ChezinInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateChezinLocalizationArgs = {
  data?: InputMaybe<ChezinInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateClauseArgs = {
  data: ClauseInput;
};


export type MutationCreateContentReleasesReleaseArgs = {
  data: ContentReleasesReleaseInput;
};


export type MutationCreateContentReleasesReleaseActionArgs = {
  data: ContentReleasesReleaseActionInput;
};


export type MutationCreateConventionTextArgs = {
  data: ConventionTextInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateConventionTextLocalizationArgs = {
  data?: InputMaybe<ConventionTextInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateCuntryArgs = {
  data: CuntryInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateCuntryLocalizationArgs = {
  data?: InputMaybe<CuntryInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateDeaArgs = {
  data: DeaInput;
};


export type MutationCreateDealArgs = {
  data: DealInput;
};


export type MutationCreateDecisionArgs = {
  data: DecisionInput;
};


export type MutationCreateDeffinitionArgs = {
  data: DeffinitionInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateDeffinitionLocalizationArgs = {
  data?: InputMaybe<DeffinitionInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateFiltertagArgs = {
  data: FiltertagInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateFiltertagLocalizationArgs = {
  data?: InputMaybe<FiltertagInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateFiniapruvalArgs = {
  data: FiniapruvalInput;
};


export type MutationCreateFinnishedMissionArgs = {
  data: FinnishedMissionInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateFinnishedMissionLocalizationArgs = {
  data?: InputMaybe<FinnishedMissionInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateForumArgs = {
  data: ForumInput;
};


export type MutationCreateForumLastSeenArgs = {
  data: ForumLastSeenInput;
};


export type MutationCreateHaamadaArgs = {
  data: HaamadaInput;
};


export type MutationCreateHaamadapruvArgs = {
  data: HaamadapruvInput;
};


export type MutationCreateHalukaArgs = {
  data: HalukaInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateHalukaLocalizationArgs = {
  data?: InputMaybe<HalukaInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateHatzaaArgs = {
  data: HatzaaInput;
};


export type MutationCreateHazbaahArgs = {
  data: HazbaahInput;
};


export type MutationCreateIssueArgs = {
  data: IssueInput;
};


export type MutationCreateMaapArgs = {
  data: MaapInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMaapLocalizationArgs = {
  data?: InputMaybe<MaapInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMachshirArgs = {
  data: MachshirInput;
};


export type MutationCreateMashaabimArgs = {
  data: MashaabimInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMashaabimLocalizationArgs = {
  data?: InputMaybe<MashaabimInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMashabetahalichArgs = {
  data: MashabetahalichInput;
};


export type MutationCreateMatanotArgs = {
  data: MatanotInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMatanotLocalizationArgs = {
  data?: InputMaybe<MatanotInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMatanotRecipeMissionArgs = {
  data: MatanotRecipeMissionInput;
};


export type MutationCreateMatanotRecipeResourceArgs = {
  data: MatanotRecipeResourceInput;
};


export type MutationCreateMatanotpendArgs = {
  data: MatanotpendInput;
};


export type MutationCreateMatbeaArgs = {
  data: MatbeaInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMatbeaLocalizationArgs = {
  data?: InputMaybe<MatbeaInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMesimabetahalichArgs = {
  data: MesimabetahalichInput;
};


export type MutationCreateMessageArgs = {
  data: MessageInput;
};


export type MutationCreateMissionArgs = {
  data: MissionInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateMissionLocalizationArgs = {
  data?: InputMaybe<MissionInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateModeArgs = {
  data: ModeInput;
};


export type MutationCreateMonterArgs = {
  data: MonterInput;
};


export type MutationCreateNegoArgs = {
  data: NegoInput;
};


export type MutationCreateNegoMashArgs = {
  data: NegoMashInput;
};


export type MutationCreateNegopendmissionArgs = {
  data: NegopendmissionInput;
};


export type MutationCreateNegotiationArgs = {
  data: NegotiationInput;
};


export type MutationCreateOpenMashaabimArgs = {
  data: OpenMashaabimInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateOpenMashaabimLocalizationArgs = {
  data?: InputMaybe<OpenMashaabimInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateOpenMissionArgs = {
  data: OpenMissionInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateOpenMissionLocalizationArgs = {
  data?: InputMaybe<OpenMissionInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreatePartofArgs = {
  data: PartofInput;
};


export type MutationCreatePendmArgs = {
  data: PendmInput;
};


export type MutationCreatePgishaArgs = {
  data: PgishaInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreatePgishaLocalizationArgs = {
  data?: InputMaybe<PgishaInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreatePgishauserArgs = {
  data: PgishauserInput;
};


export type MutationCreatePgishauserpendArgs = {
  data: PgishauserpendInput;
};


export type MutationCreatePmashArgs = {
  data: PmashInput;
};


export type MutationCreatePositionArgs = {
  data: PositionInput;
};


export type MutationCreateProjectArgs = {
  data: ProjectInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateProjectLocalizationArgs = {
  data?: InputMaybe<ProjectInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateProviderProfileArgs = {
  data: ProviderProfileInput;
};


export type MutationCreateRatsonArgs = {
  data: RatsonInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateRatsonLocalizationArgs = {
  data?: InputMaybe<RatsonInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateRatsonMatchJobArgs = {
  data: RatsonMatchJobInput;
};


export type MutationCreateRatsonProposalArgs = {
  data: RatsonProposalInput;
};


export type MutationCreateRatsonShareArgs = {
  data: RatsonShareInput;
};


export type MutationCreateRichtextArgs = {
  data: RichtextInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateRichtextLocalizationArgs = {
  data?: InputMaybe<RichtextInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateRikmashArgs = {
  data: RikmashInput;
};


export type MutationCreateSaleArgs = {
  data: SaleInput;
};


export type MutationCreateSeederArgs = {
  data: SeederInput;
};


export type MutationCreateSheirutArgs = {
  data: SheirutInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateSheirutFulfillmentArgs = {
  data: SheirutFulfillmentInput;
};


export type MutationCreateSheirutLocalizationArgs = {
  data?: InputMaybe<SheirutInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateSheirutnegoArgs = {
  data: SheirutnegoInput;
};


export type MutationCreateSheirutpendArgs = {
  data: SheirutpendInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateSheirutpendLocalizationArgs = {
  data?: InputMaybe<SheirutpendInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateSidurArgs = {
  data: SidurInput;
};


export type MutationCreateSiteReportArgs = {
  data: SiteReportInput;
};


export type MutationCreateSiteShareContributionArgs = {
  data: SiteShareContributionInput;
};


export type MutationCreateSkillArgs = {
  data: SkillInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateSkillLocalizationArgs = {
  data?: InputMaybe<SkillInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateSolutionArgs = {
  data: SolutionInput;
};


export type MutationCreateSpArgs = {
  data: SpInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateSpLocalizationArgs = {
  data?: InputMaybe<SpInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTafkidimArgs = {
  data: TafkidimInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTafkidimLocalizationArgs = {
  data?: InputMaybe<TafkidimInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTikunolamArgs = {
  data: TikunolamInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTikunolamLocalizationArgs = {
  data?: InputMaybe<TikunolamInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTimegramaArgs = {
  data: TimegramaInput;
};


export type MutationCreateTimerArgs = {
  data: TimerInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTimerLocalizationArgs = {
  data?: InputMaybe<TimerInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTosplitArgs = {
  data: TosplitInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTosplitLocalizationArgs = {
  data?: InputMaybe<TosplitInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateTranslateArgs = {
  data: TranslateInput;
};


export type MutationCreateUploadFileArgs = {
  data: UploadFileInput;
};


export type MutationCreateUploadFolderArgs = {
  data: UploadFolderInput;
};


export type MutationCreateUsersPermissionsRoleArgs = {
  data: UsersPermissionsRoleInput;
};


export type MutationCreateUsersPermissionsUserArgs = {
  data: UsersPermissionsUserInput;
};


export type MutationCreateVallueArgs = {
  data: VallueInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateVallueLocalizationArgs = {
  data?: InputMaybe<VallueInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateVoteArgs = {
  data: VoteInput;
};


export type MutationCreateWantArgs = {
  data: WantInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateWantLocalizationArgs = {
  data?: InputMaybe<WantInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateWelcomTopArgs = {
  data: WelcomTopInput;
};


export type MutationCreateWhatandwhyLocalizationArgs = {
  data?: InputMaybe<WhatandwhyInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateWorkWayArgs = {
  data: WorkWayInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateWorkWayLocalizationArgs = {
  data?: InputMaybe<WorkWayInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateYatArgs = {
  data: YatInput;
};


export type MutationCreateZoharArgs = {
  data: ZoharInput;
};


export type MutationDeleteActArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteActtArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteApiKeyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteArgumentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAskmArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAskwantArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteBakashaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCategoryArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteChezinArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteClauseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContentReleasesReleaseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContentReleasesReleaseActionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteConventionTextArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteCuntryArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteDeaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDealArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDecisionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDeffinitionArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteFiltertagArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteFiniapruvalArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFinnishedMissionArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteForumArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteForumLastSeenArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHaamadaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHaamadapruvArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHalukaArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteHatzaaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHazbaahArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteIssueArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMaapArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteMachshirArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMashaabimArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteMashabetahalichArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMatanotArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteMatanotRecipeMissionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMatanotRecipeResourceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMatanotpendArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMatbeaArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteMesimabetahalichArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMessageArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMissionArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteModeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMonterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNegoArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNegoMashArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNegopendmissionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNegotiationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOpenMashaabimArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteOpenMissionArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeletePartofArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePendmArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePgishaArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeletePgishauserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePgishauserpendArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePmashArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePositionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteProviderProfileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRatsonArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteRatsonMatchJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRatsonProposalArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRatsonShareArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRichtextArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteRikmashArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSaleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSeederArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSheirutArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteSheirutFulfillmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSheirutnegoArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSheirutpendArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteSidurArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSiteReportArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSiteShareContributionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSkillArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteSolutionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSpArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteTafkidimArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteTikunolamArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteTimegramaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTimerArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteTosplitArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteTranslateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUploadFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUploadFolderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUsersPermissionsRoleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUsersPermissionsUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteVallueArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteVoteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWantArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteWelcomTopArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWhatandwhyArgs = {
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteWorkWayArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteYatArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteZoharArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEmailConfirmationArgs = {
  confirmation: Scalars['String']['input'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  input: UsersPermissionsLoginInput;
};


export type MutationMultipleUploadArgs = {
  field?: InputMaybe<Scalars['String']['input']>;
  files: Array<InputMaybe<Scalars['Upload']['input']>>;
  ref?: InputMaybe<Scalars['String']['input']>;
  refId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationRegisterArgs = {
  input: UsersPermissionsRegisterInput;
};


export type MutationRemoveFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResetPasswordArgs = {
  code: Scalars['String']['input'];
  password: Scalars['String']['input'];
  passwordConfirmation: Scalars['String']['input'];
};


export type MutationUpdateActArgs = {
  data: ActInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateActtArgs = {
  data: ActtInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateApiKeyArgs = {
  data: ApiKeyInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateArgumentArgs = {
  data: ArgumentInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAskArgs = {
  data: AskInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAskmArgs = {
  data: AskmInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAskwantArgs = {
  data: AskwantInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateBakashaArgs = {
  data: BakashaInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateCategoryArgs = {
  data: CategoryInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateChezinArgs = {
  data: ChezinInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateClauseArgs = {
  data: ClauseInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateContentReleasesReleaseArgs = {
  data: ContentReleasesReleaseInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateContentReleasesReleaseActionArgs = {
  data: ContentReleasesReleaseActionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateConventionTextArgs = {
  data: ConventionTextInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateCuntryArgs = {
  data: CuntryInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateDeaArgs = {
  data: DeaInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateDealArgs = {
  data: DealInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateDecisionArgs = {
  data: DecisionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateDeffinitionArgs = {
  data: DeffinitionInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateFileInfoArgs = {
  id: Scalars['ID']['input'];
  info?: InputMaybe<FileInfoInput>;
};


export type MutationUpdateFiltertagArgs = {
  data: FiltertagInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateFiniapruvalArgs = {
  data: FiniapruvalInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateFinnishedMissionArgs = {
  data: FinnishedMissionInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateForumArgs = {
  data: ForumInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateForumLastSeenArgs = {
  data: ForumLastSeenInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateHaamadaArgs = {
  data: HaamadaInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateHaamadapruvArgs = {
  data: HaamadapruvInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateHalukaArgs = {
  data: HalukaInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateHatzaaArgs = {
  data: HatzaaInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateHazbaahArgs = {
  data: HazbaahInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateIssueArgs = {
  data: IssueInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMaapArgs = {
  data: MaapInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateMachshirArgs = {
  data: MachshirInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMashaabimArgs = {
  data: MashaabimInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateMashabetahalichArgs = {
  data: MashabetahalichInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMatanotArgs = {
  data: MatanotInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateMatanotRecipeMissionArgs = {
  data: MatanotRecipeMissionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMatanotRecipeResourceArgs = {
  data: MatanotRecipeResourceInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMatanotpendArgs = {
  data: MatanotpendInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMatbeaArgs = {
  data: MatbeaInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateMesimabetahalichArgs = {
  data: MesimabetahalichInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMessageArgs = {
  data: MessageInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMissionArgs = {
  data: MissionInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateModeArgs = {
  data: ModeInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateMonterArgs = {
  data: MonterInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateNegoArgs = {
  data: NegoInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateNegoMashArgs = {
  data: NegoMashInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateNegopendmissionArgs = {
  data: NegopendmissionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateNegotiationArgs = {
  data: NegotiationInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateOpenMashaabimArgs = {
  data: OpenMashaabimInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateOpenMissionArgs = {
  data: OpenMissionInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdatePartofArgs = {
  data: PartofInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdatePendmArgs = {
  data: PendmInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdatePgishaArgs = {
  data: PgishaInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdatePgishauserArgs = {
  data: PgishauserInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdatePgishauserpendArgs = {
  data: PgishauserpendInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdatePmashArgs = {
  data: PmashInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdatePositionArgs = {
  data: PositionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateProjectArgs = {
  data: ProjectInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateProviderProfileArgs = {
  data: ProviderProfileInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateRatsonArgs = {
  data: RatsonInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateRatsonMatchJobArgs = {
  data: RatsonMatchJobInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateRatsonProposalArgs = {
  data: RatsonProposalInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateRatsonShareArgs = {
  data: RatsonShareInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateRichtextArgs = {
  data: RichtextInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateRikmashArgs = {
  data: RikmashInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSaleArgs = {
  data: SaleInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSeederArgs = {
  data: SeederInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSheirutArgs = {
  data: SheirutInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateSheirutFulfillmentArgs = {
  data: SheirutFulfillmentInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSheirutnegoArgs = {
  data: SheirutnegoInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSheirutpendArgs = {
  data: SheirutpendInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateSidurArgs = {
  data: SidurInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSiteReportArgs = {
  data: SiteReportInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSiteShareContributionArgs = {
  data: SiteShareContributionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSkillArgs = {
  data: SkillInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateSolutionArgs = {
  data: SolutionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSpArgs = {
  data: SpInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateTafkidimArgs = {
  data: TafkidimInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateTikunolamArgs = {
  data: TikunolamInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateTimegramaArgs = {
  data: TimegramaInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateTimerArgs = {
  data: TimerInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateTosplitArgs = {
  data: TosplitInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateTranslateArgs = {
  data: TranslateInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUploadFileArgs = {
  data: UploadFileInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUploadFolderArgs = {
  data: UploadFolderInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUsersPermissionsRoleArgs = {
  data: UsersPermissionsRoleInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUsersPermissionsUserArgs = {
  data: UsersPermissionsUserInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateVallueArgs = {
  data: VallueInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateVoteArgs = {
  data: VoteInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateWantArgs = {
  data: WantInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateWelcomTopArgs = {
  data: WelcomTopInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateWhatandwhyArgs = {
  data: WhatandwhyInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateWorkWayArgs = {
  data: WorkWayInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateYatArgs = {
  data: YatInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateZoharArgs = {
  data: ZoharInput;
  id: Scalars['ID']['input'];
};


export type MutationUploadArgs = {
  field?: InputMaybe<Scalars['String']['input']>;
  file: Scalars['Upload']['input'];
  info?: InputMaybe<FileInfoInput>;
  ref?: InputMaybe<Scalars['String']['input']>;
  refId?: InputMaybe<Scalars['ID']['input']>;
};

export type Nego = {
  __typename?: 'Nego';
  acceptedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  des?: Maybe<Scalars['JSON']['output']>;
  fixprice?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Nego_Kindof>;
  location?: Maybe<Array<Maybe<ComponentNewLocation>>>;
  maap?: Maybe<MaapEntityResponse>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  matanot?: Maybe<MatanotEntityResponse>;
  matanotpend?: Maybe<MatanotpendEntityResponse>;
  missions?: Maybe<MissionRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  proposedHours?: Maybe<Scalars['Float']['output']>;
  proposedPrice?: Maybe<Scalars['Float']['output']>;
  proposedQuantity?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quant?: Maybe<Scalars['Float']['output']>;
  ratson_proposal?: Maybe<RatsonProposalEntityResponse>;
  recipeMission?: Maybe<MatanotRecipeMissionRelationResponseCollection>;
  recipeResource?: Maybe<MatanotRecipeResourceRelationResponseCollection>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  votes?: Maybe<VoteRelationResponseCollection>;
};


export type NegoLocationArgs = {
  filters?: InputMaybe<ComponentNewLocationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegoMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegoMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegoRecipeMissionArgs = {
  filters?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegoRecipeResourceArgs = {
  filters?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegoVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type NegoEntity = {
  __typename?: 'NegoEntity';
  attributes?: Maybe<Nego>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type NegoEntityResponse = {
  __typename?: 'NegoEntityResponse';
  data?: Maybe<NegoEntity>;
};

export type NegoEntityResponseCollection = {
  __typename?: 'NegoEntityResponseCollection';
  data: Array<NegoEntity>;
  meta: ResponseCollectionMeta;
};

export type NegoFiltersInput = {
  acceptedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<NegoFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  des?: InputMaybe<JsonFilterInput>;
  fixprice?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  maap?: InputMaybe<MaapFiltersInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  matanotpend?: InputMaybe<MatanotpendFiltersInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<NegoFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegoFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  proposedHours?: InputMaybe<FloatFilterInput>;
  proposedPrice?: InputMaybe<FloatFilterInput>;
  proposedQuantity?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quant?: InputMaybe<FloatFilterInput>;
  ratson_proposal?: InputMaybe<RatsonProposalFiltersInput>;
  recipeMission?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  recipeResource?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  rejectedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  votes?: InputMaybe<VoteFiltersInput>;
};

export type NegoInput = {
  acceptedAt?: InputMaybe<Scalars['DateTime']['input']>;
  des?: InputMaybe<Scalars['JSON']['input']>;
  fixprice?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Nego_Kindof>;
  location?: InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>;
  maap?: InputMaybe<Scalars['ID']['input']>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  matanotpend?: InputMaybe<Scalars['ID']['input']>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  proposedHours?: InputMaybe<Scalars['Float']['input']>;
  proposedPrice?: InputMaybe<Scalars['Float']['input']>;
  proposedQuantity?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quant?: InputMaybe<Scalars['Float']['input']>;
  ratson_proposal?: InputMaybe<Scalars['ID']['input']>;
  recipeMission?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  recipeResource?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  rejectedAt?: InputMaybe<Scalars['DateTime']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type NegoMash = {
  __typename?: 'NegoMash';
  askm?: Maybe<AskmEntityResponse>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cycleSize?: Maybe<Scalars['Int']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  easy?: Maybe<Scalars['Float']['output']>;
  hm?: Maybe<Scalars['Float']['output']>;
  isOriginal?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Negomash_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Array<Maybe<ComponentNewLocation>>>;
  name?: Maybe<Scalars['String']['output']>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  ordern?: Maybe<Scalars['Int']['output']>;
  pmash?: Maybe<PmashEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  proposedBy?: Maybe<Enum_Negomash_Proposedby>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  recurring?: Maybe<Scalars['Boolean']['output']>;
  spnot?: Maybe<Scalars['String']['output']>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualedf?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Enum_Negomash_Status>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type NegoMashLocationArgs = {
  filters?: InputMaybe<ComponentNewLocationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegoMashUsersArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type NegoMashEntity = {
  __typename?: 'NegoMashEntity';
  attributes?: Maybe<NegoMash>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type NegoMashEntityResponse = {
  __typename?: 'NegoMashEntityResponse';
  data?: Maybe<NegoMashEntity>;
};

export type NegoMashEntityResponseCollection = {
  __typename?: 'NegoMashEntityResponseCollection';
  data: Array<NegoMashEntity>;
  meta: ResponseCollectionMeta;
};

export type NegoMashFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<NegoMashFiltersInput>>>;
  askm?: InputMaybe<AskmFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  cycleSize?: InputMaybe<IntFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  easy?: InputMaybe<FloatFilterInput>;
  hm?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isOriginal?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<NegoMashFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegoMashFiltersInput>>>;
  ordern?: InputMaybe<IntFilterInput>;
  pmash?: InputMaybe<PmashFiltersInput>;
  price?: InputMaybe<FloatFilterInput>;
  proposedBy?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  recurring?: InputMaybe<BooleanFilterInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualedf?: InputMaybe<DateTimeFilterInput>;
  status?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type NegoMashInput = {
  askm?: InputMaybe<Scalars['ID']['input']>;
  cycleSize?: InputMaybe<Scalars['Int']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  easy?: InputMaybe<Scalars['Float']['input']>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  isOriginal?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Negomash_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  ordern?: InputMaybe<Scalars['Int']['input']>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  proposedBy?: InputMaybe<Enum_Negomash_Proposedby>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  recurring?: InputMaybe<Scalars['Boolean']['input']>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  sqadualedf?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<Enum_Negomash_Status>;
  users?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type NegoMashRelationResponseCollection = {
  __typename?: 'NegoMashRelationResponseCollection';
  data: Array<NegoMashEntity>;
};

export type NegoRelationResponseCollection = {
  __typename?: 'NegoRelationResponseCollection';
  data: Array<NegoEntity>;
};

export type Negopendmission = {
  __typename?: 'Negopendmission';
  acts?: Maybe<ActRelationResponseCollection>;
  ask?: Maybe<AskEntityResponse>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  date?: Maybe<Scalars['DateTime']['output']>;
  dates?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  filds?: Maybe<ComponentNewNego>;
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  howMany?: Maybe<Scalars['Long']['output']>;
  isMonth?: Maybe<Scalars['Boolean']['output']>;
  isOriginal?: Maybe<Scalars['Boolean']['output']>;
  isRishon?: Maybe<Scalars['Boolean']['output']>;
  location?: Maybe<Array<Maybe<ComponentNewLocation>>>;
  name?: Maybe<Scalars['String']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
  ordern?: Maybe<Scalars['Int']['output']>;
  pendm?: Maybe<PendmEntityResponse>;
  perhour?: Maybe<Scalars['Float']['output']>;
  proposedBy?: Maybe<Enum_Negopendmission_Proposedby>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  skills?: Maybe<SkillRelationResponseCollection>;
  status?: Maybe<Enum_Negopendmission_Status>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  total?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  work_ways?: Maybe<WorkWayRelationResponseCollection>;
};


export type NegopendmissionActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegopendmissionLocationArgs = {
  filters?: InputMaybe<ComponentNewLocationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegopendmissionSkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegopendmissionTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegopendmissionVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegopendmissionWork_WaysArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type NegopendmissionEntity = {
  __typename?: 'NegopendmissionEntity';
  attributes?: Maybe<Negopendmission>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type NegopendmissionEntityResponse = {
  __typename?: 'NegopendmissionEntityResponse';
  data?: Maybe<NegopendmissionEntity>;
};

export type NegopendmissionEntityResponseCollection = {
  __typename?: 'NegopendmissionEntityResponseCollection';
  data: Array<NegopendmissionEntity>;
  meta: ResponseCollectionMeta;
};

export type NegopendmissionFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<NegopendmissionFiltersInput>>>;
  ask?: InputMaybe<AskFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  date?: InputMaybe<DateTimeFilterInput>;
  dates?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  filds?: InputMaybe<ComponentNewNegoFiltersInput>;
  hearotMeyuchadot?: InputMaybe<StringFilterInput>;
  howMany?: InputMaybe<LongFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMonth?: InputMaybe<BooleanFilterInput>;
  isOriginal?: InputMaybe<BooleanFilterInput>;
  isRishon?: InputMaybe<BooleanFilterInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<NegopendmissionFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegopendmissionFiltersInput>>>;
  ordern?: InputMaybe<IntFilterInput>;
  pendm?: InputMaybe<PendmFiltersInput>;
  perhour?: InputMaybe<FloatFilterInput>;
  proposedBy?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  status?: InputMaybe<StringFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
};

export type NegopendmissionInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ask?: InputMaybe<Scalars['ID']['input']>;
  date?: InputMaybe<Scalars['DateTime']['input']>;
  dates?: InputMaybe<Scalars['DateTime']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  filds?: InputMaybe<ComponentNewNegoInput>;
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  howMany?: InputMaybe<Scalars['Long']['input']>;
  isMonth?: InputMaybe<Scalars['Boolean']['input']>;
  isOriginal?: InputMaybe<Scalars['Boolean']['input']>;
  isRishon?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
  ordern?: InputMaybe<Scalars['Int']['input']>;
  pendm?: InputMaybe<Scalars['ID']['input']>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  proposedBy?: InputMaybe<Enum_Negopendmission_Proposedby>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  status?: InputMaybe<Enum_Negopendmission_Status>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  total?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  work_ways?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type NegopendmissionRelationResponseCollection = {
  __typename?: 'NegopendmissionRelationResponseCollection';
  data: Array<NegopendmissionEntity>;
};

export type Negotiation = {
  __typename?: 'Negotiation';
  arguments?: Maybe<ArgumentRelationResponseCollection>;
  clauses?: Maybe<ClauseRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdByEmail?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<UsersPermissionsUserEntityResponse>;
  cuntries?: Maybe<CuntryRelationResponseCollection>;
  currentRound?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  isLocal?: Maybe<Scalars['Boolean']['output']>;
  issues?: Maybe<IssueRelationResponseCollection>;
  maxRounds?: Maybe<Scalars['Int']['output']>;
  ownerExternalId?: Maybe<Scalars['String']['output']>;
  participants?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  positions?: Maybe<PositionRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  scaleMax?: Maybe<Scalars['Int']['output']>;
  scaleMin?: Maybe<Scalars['Int']['output']>;
  shareToken?: Maybe<Scalars['String']['output']>;
  sourceId?: Maybe<Scalars['String']['output']>;
  sourceMeta?: Maybe<Scalars['JSON']['output']>;
  sourceType?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Enum_Negotiation_Status>;
  topic?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  visibility?: Maybe<Enum_Negotiation_Visibility>;
};


export type NegotiationArgumentsArgs = {
  filters?: InputMaybe<ArgumentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegotiationClausesArgs = {
  filters?: InputMaybe<ClauseFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegotiationCuntriesArgs = {
  filters?: InputMaybe<CuntryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegotiationIssuesArgs = {
  filters?: InputMaybe<IssueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegotiationParticipantsArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NegotiationPositionsArgs = {
  filters?: InputMaybe<PositionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type NegotiationEntity = {
  __typename?: 'NegotiationEntity';
  attributes?: Maybe<Negotiation>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type NegotiationEntityResponse = {
  __typename?: 'NegotiationEntityResponse';
  data?: Maybe<NegotiationEntity>;
};

export type NegotiationEntityResponseCollection = {
  __typename?: 'NegotiationEntityResponseCollection';
  data: Array<NegotiationEntity>;
  meta: ResponseCollectionMeta;
};

export type NegotiationFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<NegotiationFiltersInput>>>;
  arguments?: InputMaybe<ArgumentFiltersInput>;
  clauses?: InputMaybe<ClauseFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  createdByEmail?: InputMaybe<StringFilterInput>;
  creator?: InputMaybe<UsersPermissionsUserFiltersInput>;
  cuntries?: InputMaybe<CuntryFiltersInput>;
  currentRound?: InputMaybe<IntFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isLocal?: InputMaybe<BooleanFilterInput>;
  issues?: InputMaybe<IssueFiltersInput>;
  maxRounds?: InputMaybe<IntFilterInput>;
  not?: InputMaybe<NegotiationFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegotiationFiltersInput>>>;
  ownerExternalId?: InputMaybe<StringFilterInput>;
  participants?: InputMaybe<UsersPermissionsUserFiltersInput>;
  positions?: InputMaybe<PositionFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  scaleMax?: InputMaybe<IntFilterInput>;
  scaleMin?: InputMaybe<IntFilterInput>;
  shareToken?: InputMaybe<StringFilterInput>;
  sourceId?: InputMaybe<StringFilterInput>;
  sourceMeta?: InputMaybe<JsonFilterInput>;
  sourceType?: InputMaybe<StringFilterInput>;
  status?: InputMaybe<StringFilterInput>;
  topic?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  visibility?: InputMaybe<StringFilterInput>;
};

export type NegotiationInput = {
  arguments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  clauses?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  createdByEmail?: InputMaybe<Scalars['String']['input']>;
  creator?: InputMaybe<Scalars['ID']['input']>;
  cuntries?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  currentRound?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isLocal?: InputMaybe<Scalars['Boolean']['input']>;
  issues?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  maxRounds?: InputMaybe<Scalars['Int']['input']>;
  ownerExternalId?: InputMaybe<Scalars['String']['input']>;
  participants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  positions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  scaleMax?: InputMaybe<Scalars['Int']['input']>;
  scaleMin?: InputMaybe<Scalars['Int']['input']>;
  shareToken?: InputMaybe<Scalars['String']['input']>;
  sourceId?: InputMaybe<Scalars['String']['input']>;
  sourceMeta?: InputMaybe<Scalars['JSON']['input']>;
  sourceType?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Enum_Negotiation_Status>;
  topic?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Enum_Negotiation_Visibility>;
};

export type NegotiationRelationResponseCollection = {
  __typename?: 'NegotiationRelationResponseCollection';
  data: Array<NegotiationEntity>;
};

export type OpenMashaabim = {
  __typename?: 'OpenMashaabim';
  archived?: Maybe<Scalars['Boolean']['output']>;
  askms?: Maybe<AskmRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cycleSize?: Maybe<Scalars['Int']['output']>;
  declinedsps?: Maybe<SpRelationResponseCollection>;
  descrip?: Maybe<Scalars['String']['output']>;
  easy?: Maybe<Scalars['Float']['output']>;
  haamadapruvs?: Maybe<HaamadapruvRelationResponseCollection>;
  haamadas?: Maybe<HaamadaRelationResponseCollection>;
  hm?: Maybe<Scalars['Float']['output']>;
  howMeny?: Maybe<Scalars['Long']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Openmashaabim_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<OpenMashaabimRelationResponseCollection>;
  location?: Maybe<ComponentNewLocation>;
  maap?: Maybe<MaapEntityResponse>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  nego_mashes?: Maybe<NegoMashRelationResponseCollection>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pmash?: Maybe<PmashEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  ratson_proposal?: Maybe<RatsonProposalEntityResponse>;
  recurring?: Maybe<Scalars['Boolean']['output']>;
  rikmashes?: Maybe<RikmashRelationResponseCollection>;
  source?: Maybe<Enum_Openmashaabim_Source>;
  splited?: Maybe<Scalars['Boolean']['output']>;
  spnot?: Maybe<Scalars['String']['output']>;
  sps?: Maybe<SpRelationResponseCollection>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualedf?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type OpenMashaabimAskmsArgs = {
  filters?: InputMaybe<AskmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimDeclinedspsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimHaamadapruvsArgs = {
  filters?: InputMaybe<HaamadapruvFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimHaamadasArgs = {
  filters?: InputMaybe<HaamadaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimLocalizationsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimNego_MashesArgs = {
  filters?: InputMaybe<NegoMashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimRikmashesArgs = {
  filters?: InputMaybe<RikmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimSpsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMashaabimUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type OpenMashaabimEntity = {
  __typename?: 'OpenMashaabimEntity';
  attributes?: Maybe<OpenMashaabim>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type OpenMashaabimEntityResponse = {
  __typename?: 'OpenMashaabimEntityResponse';
  data?: Maybe<OpenMashaabimEntity>;
};

export type OpenMashaabimEntityResponseCollection = {
  __typename?: 'OpenMashaabimEntityResponseCollection';
  data: Array<OpenMashaabimEntity>;
  meta: ResponseCollectionMeta;
};

export type OpenMashaabimFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<OpenMashaabimFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  askms?: InputMaybe<AskmFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  cycleSize?: InputMaybe<IntFilterInput>;
  declinedsps?: InputMaybe<SpFiltersInput>;
  descrip?: InputMaybe<StringFilterInput>;
  easy?: InputMaybe<FloatFilterInput>;
  haamadapruvs?: InputMaybe<HaamadapruvFiltersInput>;
  haamadas?: InputMaybe<HaamadaFiltersInput>;
  hm?: InputMaybe<FloatFilterInput>;
  howMeny?: InputMaybe<LongFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<OpenMashaabimFiltersInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  maap?: InputMaybe<MaapFiltersInput>;
  mashaabim?: InputMaybe<MashaabimFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  nego_mashes?: InputMaybe<NegoMashFiltersInput>;
  not?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<OpenMashaabimFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  pmash?: InputMaybe<PmashFiltersInput>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  ratson_proposal?: InputMaybe<RatsonProposalFiltersInput>;
  recurring?: InputMaybe<BooleanFilterInput>;
  rikmashes?: InputMaybe<RikmashFiltersInput>;
  source?: InputMaybe<StringFilterInput>;
  splited?: InputMaybe<BooleanFilterInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sps?: InputMaybe<SpFiltersInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualedf?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type OpenMashaabimInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  askms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  cycleSize?: InputMaybe<Scalars['Int']['input']>;
  declinedsps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  easy?: InputMaybe<Scalars['Float']['input']>;
  haamadapruvs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  haamadas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  howMeny?: InputMaybe<Scalars['Long']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Openmashaabim_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  maap?: InputMaybe<Scalars['ID']['input']>;
  mashaabim?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nego_mashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  ratson_proposal?: InputMaybe<Scalars['ID']['input']>;
  recurring?: InputMaybe<Scalars['Boolean']['input']>;
  rikmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  source?: InputMaybe<Enum_Openmashaabim_Source>;
  splited?: InputMaybe<Scalars['Boolean']['input']>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  sps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  sqadualedf?: InputMaybe<Scalars['DateTime']['input']>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type OpenMashaabimRelationResponseCollection = {
  __typename?: 'OpenMashaabimRelationResponseCollection';
  data: Array<OpenMashaabimEntity>;
};

export type OpenMission = {
  __typename?: 'OpenMission';
  acts?: Maybe<ActRelationResponseCollection>;
  archived: Scalars['Boolean']['output'];
  asks?: Maybe<AskRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dates?: Maybe<Scalars['DateTime']['output']>;
  declined?: Maybe<UsersPermissionsUserEntityResponse>;
  descrip?: Maybe<Scalars['String']['output']>;
  hatzaas?: Maybe<HatzaaRelationResponseCollection>;
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  howMeny?: Maybe<Scalars['Long']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isRishon?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  isglobal?: Maybe<Scalars['Boolean']['output']>;
  iskvua?: Maybe<Scalars['Boolean']['output']>;
  isshift?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<OpenMissionRelationResponseCollection>;
  location?: Maybe<ComponentNewLocation>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  mission?: Maybe<MissionEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pendm?: Maybe<PendmEntityResponse>;
  perhour?: Maybe<Scalars['Float']['output']>;
  privatlinks?: Maybe<Scalars['String']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publicklinks?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  ratson_proposals?: Maybe<RatsonProposalRelationResponseCollection>;
  rishon?: Maybe<UsersPermissionsUserEntityResponse>;
  rishonves?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  skills?: Maybe<SkillRelationResponseCollection>;
  source?: Maybe<Enum_Openmission_Source>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  usersNotRelevant?: Maybe<UsersPermissionsUserEntityResponse>;
  vallues?: Maybe<VallueRelationResponseCollection>;
  work_ways?: Maybe<WorkWayRelationResponseCollection>;
};


export type OpenMissionActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionAsksArgs = {
  filters?: InputMaybe<AskFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionHatzaasArgs = {
  filters?: InputMaybe<HatzaaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionLocalizationsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionRatson_ProposalsArgs = {
  filters?: InputMaybe<RatsonProposalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionRishonvesArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionSkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionValluesArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type OpenMissionWork_WaysArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type OpenMissionEntity = {
  __typename?: 'OpenMissionEntity';
  attributes?: Maybe<OpenMission>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type OpenMissionEntityResponse = {
  __typename?: 'OpenMissionEntityResponse';
  data?: Maybe<OpenMissionEntity>;
};

export type OpenMissionEntityResponseCollection = {
  __typename?: 'OpenMissionEntityResponseCollection';
  data: Array<OpenMissionEntity>;
  meta: ResponseCollectionMeta;
};

export type OpenMissionFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<OpenMissionFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  asks?: InputMaybe<AskFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  dates?: InputMaybe<DateTimeFilterInput>;
  declined?: InputMaybe<UsersPermissionsUserFiltersInput>;
  descrip?: InputMaybe<StringFilterInput>;
  hatzaas?: InputMaybe<HatzaaFiltersInput>;
  hearotMeyuchadot?: InputMaybe<StringFilterInput>;
  howMeny?: InputMaybe<LongFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isRishon?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  isglobal?: InputMaybe<BooleanFilterInput>;
  iskvua?: InputMaybe<BooleanFilterInput>;
  isshift?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<OpenMissionFiltersInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  mission?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<OpenMissionFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  pendm?: InputMaybe<PendmFiltersInput>;
  perhour?: InputMaybe<FloatFilterInput>;
  privatlinks?: InputMaybe<StringFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publicklinks?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  ratson_proposals?: InputMaybe<RatsonProposalFiltersInput>;
  rishon?: InputMaybe<UsersPermissionsUserFiltersInput>;
  rishonves?: InputMaybe<UsersPermissionsUserFiltersInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  source?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  usersNotRelevant?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vallues?: InputMaybe<VallueFiltersInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
};

export type OpenMissionInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  asks?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  dates?: InputMaybe<Scalars['DateTime']['input']>;
  declined?: InputMaybe<Scalars['ID']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  hatzaas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  howMeny?: InputMaybe<Scalars['Long']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isRishon?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  isglobal?: InputMaybe<Scalars['Boolean']['input']>;
  iskvua?: InputMaybe<Scalars['Boolean']['input']>;
  isshift?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mission?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendm?: InputMaybe<Scalars['ID']['input']>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  privatlinks?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publicklinks?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  ratson_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  rishon?: InputMaybe<Scalars['ID']['input']>;
  rishonves?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  source?: InputMaybe<Enum_Openmission_Source>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  usersNotRelevant?: InputMaybe<Scalars['ID']['input']>;
  vallues?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  work_ways?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type OpenMissionRelationResponseCollection = {
  __typename?: 'OpenMissionRelationResponseCollection';
  data: Array<OpenMissionEntity>;
};

export type Pagination = {
  __typename?: 'Pagination';
  page: Scalars['Int']['output'];
  pageCount: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginationArg = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  start?: InputMaybe<Scalars['Int']['input']>;
};

export type Partof = {
  __typename?: 'Partof';
  acts?: Maybe<ActRelationResponseCollection>;
  askms?: Maybe<AskmRelationResponseCollection>;
  asks?: Maybe<AskRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  default?: Maybe<Scalars['Boolean']['output']>;
  finiapruvals?: Maybe<FiniapruvalRelationResponseCollection>;
  forums?: Maybe<ForumRelationResponseCollection>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  mashabetahaliches?: Maybe<MashabetahalichRelationResponseCollection>;
  matanot?: Maybe<MatanotEntityResponse>;
  matanot_recipe_missions?: Maybe<MatanotRecipeMissionRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  open_mashaabims?: Maybe<OpenMashaabimRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  pmashes?: Maybe<PmashRelationResponseCollection>;
  ratson?: Maybe<RatsonEntityResponse>;
  sheirut_fulfillments?: Maybe<SheirutFulfillmentRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type PartofActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofAskmsArgs = {
  filters?: InputMaybe<AskmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofAsksArgs = {
  filters?: InputMaybe<AskFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofMashabetahalichesArgs = {
  filters?: InputMaybe<MashabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofMatanot_Recipe_MissionsArgs = {
  filters?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofOpen_MashaabimsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofPmashesArgs = {
  filters?: InputMaybe<PmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PartofSheirut_FulfillmentsArgs = {
  filters?: InputMaybe<SheirutFulfillmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PartofEntity = {
  __typename?: 'PartofEntity';
  attributes?: Maybe<Partof>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type PartofEntityResponse = {
  __typename?: 'PartofEntityResponse';
  data?: Maybe<PartofEntity>;
};

export type PartofEntityResponseCollection = {
  __typename?: 'PartofEntityResponseCollection';
  data: Array<PartofEntity>;
  meta: ResponseCollectionMeta;
};

export type PartofFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<PartofFiltersInput>>>;
  askms?: InputMaybe<AskmFiltersInput>;
  asks?: InputMaybe<AskFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  default?: InputMaybe<BooleanFilterInput>;
  finiapruvals?: InputMaybe<FiniapruvalFiltersInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  mashabetahaliches?: InputMaybe<MashabetahalichFiltersInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  matanot_recipe_missions?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<PartofFiltersInput>;
  open_mashaabims?: InputMaybe<OpenMashaabimFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PartofFiltersInput>>>;
  pendms?: InputMaybe<PendmFiltersInput>;
  pmashes?: InputMaybe<PmashFiltersInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  sheirut_fulfillments?: InputMaybe<SheirutFulfillmentFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type PartofInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  asks?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  default?: InputMaybe<Scalars['Boolean']['input']>;
  finiapruvals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  matanot_recipe_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  sheirut_fulfillments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type PartofRelationResponseCollection = {
  __typename?: 'PartofRelationResponseCollection';
  data: Array<PartofEntity>;
};

export type Pendm = {
  __typename?: 'Pendm';
  acts?: Maybe<ActRelationResponseCollection>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dates?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  diun?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  forums?: Maybe<ForumRelationResponseCollection>;
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  howMeny?: Maybe<Scalars['Long']['output']>;
  isLast?: Maybe<Scalars['Boolean']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  isglobal?: Maybe<Scalars['Boolean']['output']>;
  iskvua?: Maybe<Scalars['Boolean']['output']>;
  isshift?: Maybe<Scalars['Boolean']['output']>;
  location?: Maybe<ComponentNewLocation>;
  matanot_recipe_missions?: Maybe<MatanotRecipeMissionRelationResponseCollection>;
  mission?: Maybe<MissionEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  nego?: Maybe<Array<Maybe<ComponentNewNego>>>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  perhour?: Maybe<Scalars['Float']['output']>;
  privatlinks?: Maybe<Scalars['String']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publicklinks?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  rishon?: Maybe<UsersPermissionsUserEntityResponse>;
  rishonves?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  skills?: Maybe<SkillRelationResponseCollection>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<Array<Maybe<ComponentProjectsPendmnego>>>;
  vallues?: Maybe<VallueRelationResponseCollection>;
  work_ways?: Maybe<WorkWayRelationResponseCollection>;
};


export type PendmActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmDiunArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmMatanot_Recipe_MissionsArgs = {
  filters?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmNegoArgs = {
  filters?: InputMaybe<ComponentNewNegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmRishonvesArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmSkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmUsersArgs = {
  filters?: InputMaybe<ComponentProjectsPendmnegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmValluesArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PendmWork_WaysArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PendmEntity = {
  __typename?: 'PendmEntity';
  attributes?: Maybe<Pendm>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type PendmEntityResponse = {
  __typename?: 'PendmEntityResponse';
  data?: Maybe<PendmEntity>;
};

export type PendmEntityResponseCollection = {
  __typename?: 'PendmEntityResponseCollection';
  data: Array<PendmEntity>;
  meta: ResponseCollectionMeta;
};

export type PendmFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<PendmFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  dates?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  diun?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  hearotMeyuchadot?: InputMaybe<StringFilterInput>;
  howMeny?: InputMaybe<LongFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isLast?: InputMaybe<BooleanFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  isglobal?: InputMaybe<BooleanFilterInput>;
  iskvua?: InputMaybe<BooleanFilterInput>;
  isshift?: InputMaybe<BooleanFilterInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  matanot_recipe_missions?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  mission?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  nego?: InputMaybe<ComponentNewNegoFiltersInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<PendmFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PendmFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  perhour?: InputMaybe<FloatFilterInput>;
  privatlinks?: InputMaybe<StringFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publicklinks?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  rishon?: InputMaybe<UsersPermissionsUserFiltersInput>;
  rishonves?: InputMaybe<UsersPermissionsUserFiltersInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<ComponentProjectsPendmnegoFiltersInput>;
  vallues?: InputMaybe<VallueFiltersInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
};

export type PendmInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  dates?: InputMaybe<Scalars['DateTime']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  diun?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  howMeny?: InputMaybe<Scalars['Long']['input']>;
  isLast?: InputMaybe<Scalars['Boolean']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  isglobal?: InputMaybe<Scalars['Boolean']['input']>;
  iskvua?: InputMaybe<Scalars['Boolean']['input']>;
  isshift?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  matanot_recipe_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mission?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nego?: InputMaybe<Array<InputMaybe<ComponentNewNegoInput>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  privatlinks?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publicklinks?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  rishon?: InputMaybe<Scalars['ID']['input']>;
  rishonves?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  users?: InputMaybe<Array<InputMaybe<ComponentProjectsPendmnegoInput>>>;
  vallues?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  work_ways?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type PendmRelationResponseCollection = {
  __typename?: 'PendmRelationResponseCollection';
  data: Array<PendmEntity>;
};

export type Pgisha = {
  __typename?: 'Pgisha';
  archived?: Maybe<Scalars['Boolean']['output']>;
  available?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  desc?: Maybe<Scalars['String']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  isLive?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<PgishaRelationResponseCollection>;
  meeting?: Maybe<Array<Maybe<ComponentNewMeeting>>>;
  meetingStartedAt?: Maybe<Scalars['DateTime']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  pendingStart?: Maybe<Scalars['Boolean']['output']>;
  pgishauserpends?: Maybe<PgishauserpendRelationResponseCollection>;
  pgishausers?: Maybe<PgishauserRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  set?: Maybe<Scalars['Boolean']['output']>;
  startRequestedAt?: Maybe<Scalars['DateTime']['output']>;
  startRequestedBy?: Maybe<UsersPermissionsUserEntityResponse>;
  startedBy?: Maybe<UsersPermissionsUserEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  videoLink?: Maybe<Scalars['String']['output']>;
};


export type PgishaLocalizationsArgs = {
  filters?: InputMaybe<PgishaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PgishaMeetingArgs = {
  filters?: InputMaybe<ComponentNewMeetingFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PgishaPgishauserpendsArgs = {
  filters?: InputMaybe<PgishauserpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PgishaPgishausersArgs = {
  filters?: InputMaybe<PgishauserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PgishaEntity = {
  __typename?: 'PgishaEntity';
  attributes?: Maybe<Pgisha>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type PgishaEntityResponse = {
  __typename?: 'PgishaEntityResponse';
  data?: Maybe<PgishaEntity>;
};

export type PgishaEntityResponseCollection = {
  __typename?: 'PgishaEntityResponseCollection';
  data: Array<PgishaEntity>;
  meta: ResponseCollectionMeta;
};

export type PgishaFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<PgishaFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  available?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  desc?: InputMaybe<StringFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isLive?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<PgishaFiltersInput>;
  meeting?: InputMaybe<ComponentNewMeetingFiltersInput>;
  meetingStartedAt?: InputMaybe<DateTimeFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<PgishaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PgishaFiltersInput>>>;
  pendingStart?: InputMaybe<BooleanFilterInput>;
  pgishauserpends?: InputMaybe<PgishauserpendFiltersInput>;
  pgishausers?: InputMaybe<PgishauserFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  set?: InputMaybe<BooleanFilterInput>;
  startRequestedAt?: InputMaybe<DateTimeFilterInput>;
  startRequestedBy?: InputMaybe<UsersPermissionsUserFiltersInput>;
  startedBy?: InputMaybe<UsersPermissionsUserFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  videoLink?: InputMaybe<StringFilterInput>;
};

export type PgishaInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  available?: InputMaybe<Scalars['Boolean']['input']>;
  desc?: InputMaybe<Scalars['String']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  isLive?: InputMaybe<Scalars['Boolean']['input']>;
  meeting?: InputMaybe<Array<InputMaybe<ComponentNewMeetingInput>>>;
  meetingStartedAt?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pendingStart?: InputMaybe<Scalars['Boolean']['input']>;
  pgishauserpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishausers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  set?: InputMaybe<Scalars['Boolean']['input']>;
  startRequestedAt?: InputMaybe<Scalars['DateTime']['input']>;
  startRequestedBy?: InputMaybe<Scalars['ID']['input']>;
  startedBy?: InputMaybe<Scalars['ID']['input']>;
  videoLink?: InputMaybe<Scalars['String']['input']>;
};

export type PgishaRelationResponseCollection = {
  __typename?: 'PgishaRelationResponseCollection';
  data: Array<PgishaEntity>;
};

export type Pgishauser = {
  __typename?: 'Pgishauser';
  available?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  pgishas?: Maybe<PgishaRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  readyForStart?: Maybe<Scalars['Boolean']['output']>;
  uid: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type PgishauserPgishasArgs = {
  filters?: InputMaybe<PgishaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PgishauserEntity = {
  __typename?: 'PgishauserEntity';
  attributes?: Maybe<Pgishauser>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type PgishauserEntityResponse = {
  __typename?: 'PgishauserEntityResponse';
  data?: Maybe<PgishauserEntity>;
};

export type PgishauserEntityResponseCollection = {
  __typename?: 'PgishauserEntityResponseCollection';
  data: Array<PgishauserEntity>;
  meta: ResponseCollectionMeta;
};

export type PgishauserFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<PgishauserFiltersInput>>>;
  available?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<PgishauserFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PgishauserFiltersInput>>>;
  pgishas?: InputMaybe<PgishaFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  readyForStart?: InputMaybe<BooleanFilterInput>;
  uid?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type PgishauserInput = {
  available?: InputMaybe<Scalars['Boolean']['input']>;
  pgishas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  readyForStart?: InputMaybe<Scalars['Boolean']['input']>;
  uid?: InputMaybe<Scalars['String']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type PgishauserRelationResponseCollection = {
  __typename?: 'PgishauserRelationResponseCollection';
  data: Array<PgishauserEntity>;
};

export type Pgishauserpend = {
  __typename?: 'Pgishauserpend';
  approved?: Maybe<Scalars['Boolean']['output']>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  pgisha?: Maybe<PgishaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type PgishauserpendEntity = {
  __typename?: 'PgishauserpendEntity';
  attributes?: Maybe<Pgishauserpend>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type PgishauserpendEntityResponse = {
  __typename?: 'PgishauserpendEntityResponse';
  data?: Maybe<PgishauserpendEntity>;
};

export type PgishauserpendEntityResponseCollection = {
  __typename?: 'PgishauserpendEntityResponseCollection';
  data: Array<PgishauserpendEntity>;
  meta: ResponseCollectionMeta;
};

export type PgishauserpendFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<PgishauserpendFiltersInput>>>;
  approved?: InputMaybe<BooleanFilterInput>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<PgishauserpendFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PgishauserpendFiltersInput>>>;
  pgisha?: InputMaybe<PgishaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type PgishauserpendInput = {
  approved?: InputMaybe<Scalars['Boolean']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  pgisha?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type PgishauserpendRelationResponseCollection = {
  __typename?: 'PgishauserpendRelationResponseCollection';
  data: Array<PgishauserpendEntity>;
};

export type Pmash = {
  __typename?: 'Pmash';
  archived: Scalars['Boolean']['output'];
  askm?: Maybe<AskmEntityResponse>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cycleSize?: Maybe<Scalars['Int']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  diun?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  easy?: Maybe<Scalars['Float']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  hm?: Maybe<Scalars['Float']['output']>;
  isMaap?: Maybe<Scalars['Boolean']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isSelfProposal?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Pmash_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  location?: Maybe<ComponentNewLocation>;
  maap?: Maybe<MaapEntityResponse>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  mashabetahaliches?: Maybe<MashabetahalichRelationResponseCollection>;
  matanot_recipe_resources?: Maybe<MatanotRecipeResourceRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  nego_mashes?: Maybe<NegoMashRelationResponseCollection>;
  negom?: Maybe<Array<Maybe<ComponentNewNegom>>>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  recurring?: Maybe<Scalars['Boolean']['output']>;
  selfProposalUser?: Maybe<UsersPermissionsUserEntityResponse>;
  sheirut_fulfillments?: Maybe<SheirutFulfillmentRelationResponseCollection>;
  spnot?: Maybe<Scalars['String']['output']>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualedf?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type PmashDiunArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashMashabetahalichesArgs = {
  filters?: InputMaybe<MashabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashMatanot_Recipe_ResourcesArgs = {
  filters?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashNego_MashesArgs = {
  filters?: InputMaybe<NegoMashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashNegomArgs = {
  filters?: InputMaybe<ComponentNewNegomFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashSheirut_FulfillmentsArgs = {
  filters?: InputMaybe<SheirutFulfillmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PmashUsersArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PmashEntity = {
  __typename?: 'PmashEntity';
  attributes?: Maybe<Pmash>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type PmashEntityResponse = {
  __typename?: 'PmashEntityResponse';
  data?: Maybe<PmashEntity>;
};

export type PmashEntityResponseCollection = {
  __typename?: 'PmashEntityResponseCollection';
  data: Array<PmashEntity>;
  meta: ResponseCollectionMeta;
};

export type PmashFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<PmashFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  askm?: InputMaybe<AskmFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  cycleSize?: InputMaybe<IntFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  diun?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  easy?: InputMaybe<FloatFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  hm?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMaap?: InputMaybe<BooleanFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isSelfProposal?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  maap?: InputMaybe<MaapFiltersInput>;
  mashaabim?: InputMaybe<MashaabimFiltersInput>;
  mashabetahaliches?: InputMaybe<MashabetahalichFiltersInput>;
  matanot_recipe_resources?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  nego_mashes?: InputMaybe<NegoMashFiltersInput>;
  negom?: InputMaybe<ComponentNewNegomFiltersInput>;
  not?: InputMaybe<PmashFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PmashFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  recurring?: InputMaybe<BooleanFilterInput>;
  selfProposalUser?: InputMaybe<UsersPermissionsUserFiltersInput>;
  sheirut_fulfillments?: InputMaybe<SheirutFulfillmentFiltersInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualedf?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type PmashInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  askm?: InputMaybe<Scalars['ID']['input']>;
  cycleSize?: InputMaybe<Scalars['Int']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  diun?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  easy?: InputMaybe<Scalars['Float']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  isMaap?: InputMaybe<Scalars['Boolean']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isSelfProposal?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Pmash_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  maap?: InputMaybe<Scalars['ID']['input']>;
  mashaabim?: InputMaybe<Scalars['ID']['input']>;
  mashabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot_recipe_resources?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  nego_mashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negom?: InputMaybe<Array<InputMaybe<ComponentNewNegomInput>>>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  recurring?: InputMaybe<Scalars['Boolean']['input']>;
  selfProposalUser?: InputMaybe<Scalars['ID']['input']>;
  sheirut_fulfillments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  sqadualedf?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  users?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type PmashRelationResponseCollection = {
  __typename?: 'PmashRelationResponseCollection';
  data: Array<PmashEntity>;
};

export type Position = {
  __typename?: 'Position';
  aiMeta?: Maybe<Scalars['JSON']['output']>;
  arguments?: Maybe<ArgumentRelationResponseCollection>;
  author?: Maybe<UsersPermissionsUserEntityResponse>;
  authorEmail?: Maybe<Scalars['String']['output']>;
  authorExternalId?: Maybe<Scalars['String']['output']>;
  authorType?: Maybe<Enum_Position_Authortype>;
  clauses?: Maybe<ClauseRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  heading?: Maybe<Scalars['String']['output']>;
  intensity?: Maybe<Scalars['Int']['output']>;
  isAnchor?: Maybe<Scalars['Boolean']['output']>;
  kind?: Maybe<Enum_Position_Kind>;
  location?: Maybe<Scalars['Float']['output']>;
  negotiation?: Maybe<NegotiationEntityResponse>;
  order?: Maybe<Scalars['Int']['output']>;
  pole?: Maybe<Enum_Position_Pole>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  relativePlacement?: Maybe<Scalars['JSON']['output']>;
  selfPlacement?: Maybe<Scalars['Int']['output']>;
  tags?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  voters?: Maybe<Scalars['JSON']['output']>;
  votes?: Maybe<Scalars['Int']['output']>;
};


export type PositionArgumentsArgs = {
  filters?: InputMaybe<ArgumentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PositionClausesArgs = {
  filters?: InputMaybe<ClauseFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PositionEntity = {
  __typename?: 'PositionEntity';
  attributes?: Maybe<Position>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type PositionEntityResponse = {
  __typename?: 'PositionEntityResponse';
  data?: Maybe<PositionEntity>;
};

export type PositionEntityResponseCollection = {
  __typename?: 'PositionEntityResponseCollection';
  data: Array<PositionEntity>;
  meta: ResponseCollectionMeta;
};

export type PositionFiltersInput = {
  aiMeta?: InputMaybe<JsonFilterInput>;
  and?: InputMaybe<Array<InputMaybe<PositionFiltersInput>>>;
  arguments?: InputMaybe<ArgumentFiltersInput>;
  author?: InputMaybe<UsersPermissionsUserFiltersInput>;
  authorEmail?: InputMaybe<StringFilterInput>;
  authorExternalId?: InputMaybe<StringFilterInput>;
  authorType?: InputMaybe<StringFilterInput>;
  clauses?: InputMaybe<ClauseFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  heading?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  intensity?: InputMaybe<IntFilterInput>;
  isAnchor?: InputMaybe<BooleanFilterInput>;
  kind?: InputMaybe<StringFilterInput>;
  location?: InputMaybe<FloatFilterInput>;
  negotiation?: InputMaybe<NegotiationFiltersInput>;
  not?: InputMaybe<PositionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PositionFiltersInput>>>;
  order?: InputMaybe<IntFilterInput>;
  pole?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  relativePlacement?: InputMaybe<JsonFilterInput>;
  selfPlacement?: InputMaybe<IntFilterInput>;
  tags?: InputMaybe<JsonFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  voters?: InputMaybe<JsonFilterInput>;
  votes?: InputMaybe<IntFilterInput>;
};

export type PositionInput = {
  aiMeta?: InputMaybe<Scalars['JSON']['input']>;
  arguments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  author?: InputMaybe<Scalars['ID']['input']>;
  authorEmail?: InputMaybe<Scalars['String']['input']>;
  authorExternalId?: InputMaybe<Scalars['String']['input']>;
  authorType?: InputMaybe<Enum_Position_Authortype>;
  clauses?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  heading?: InputMaybe<Scalars['String']['input']>;
  intensity?: InputMaybe<Scalars['Int']['input']>;
  isAnchor?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<Enum_Position_Kind>;
  location?: InputMaybe<Scalars['Float']['input']>;
  negotiation?: InputMaybe<Scalars['ID']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  pole?: InputMaybe<Enum_Position_Pole>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  relativePlacement?: InputMaybe<Scalars['JSON']['input']>;
  selfPlacement?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Scalars['JSON']['input']>;
  voters?: InputMaybe<Scalars['JSON']['input']>;
  votes?: InputMaybe<Scalars['Int']['input']>;
};

export type PositionRelationResponseCollection = {
  __typename?: 'PositionRelationResponseCollection';
  data: Array<PositionEntity>;
};

export type Project = {
  __typename?: 'Project';
  acts?: Maybe<ActRelationResponseCollection>;
  addHoursManualy?: Maybe<Scalars['Boolean']['output']>;
  askms?: Maybe<AskmRelationResponseCollection>;
  asks?: Maybe<AskRelationResponseCollection>;
  askwants?: Maybe<AskwantRelationResponseCollection>;
  city?: Maybe<Scalars['String']['output']>;
  countries?: Maybe<CuntryRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deals?: Maybe<DealRelationResponseCollection>;
  decisions?: Maybe<DecisionRelationResponseCollection>;
  deffinitions?: Maybe<DeffinitionRelationResponseCollection>;
  descripFor?: Maybe<Scalars['String']['output']>;
  discordlink?: Maybe<Scalars['String']['output']>;
  drivelink?: Maybe<Scalars['String']['output']>;
  fblink?: Maybe<Scalars['String']['output']>;
  finiapruvals?: Maybe<FiniapruvalRelationResponseCollection>;
  finnishedM72HForDecline?: Maybe<Scalars['Boolean']['output']>;
  finnishedMAllApruve?: Maybe<Scalars['Boolean']['output']>;
  finnished_missions?: Maybe<FinnishedMissionRelationResponseCollection>;
  forums?: Maybe<ForumRelationResponseCollection>;
  githublink?: Maybe<Scalars['String']['output']>;
  haamadapruvs?: Maybe<HaamadapruvRelationResponseCollection>;
  haamadas?: Maybe<HaamadaRelationResponseCollection>;
  halukas?: Maybe<HalukaRelationResponseCollection>;
  halukas_recive?: Maybe<HalukaRelationResponseCollection>;
  isMachzikim?: Maybe<Scalars['Boolean']['output']>;
  isMachzikimPublik?: Maybe<Scalars['Boolean']['output']>;
  isOt?: Maybe<Scalars['Boolean']['output']>;
  isPlatform?: Maybe<Scalars['Boolean']['output']>;
  linkToWebsite?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<ProjectRelationResponseCollection>;
  location?: Maybe<ComponentNewLocation>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  machshirs?: Maybe<MachshirRelationResponseCollection>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  mashabetahaliches?: Maybe<MashabetahalichRelationResponseCollection>;
  matanotofs?: Maybe<MatanotRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  missions?: Maybe<MissionRelationResponseCollection>;
  newMeMissionOuto72ho?: Maybe<Scalars['Boolean']['output']>;
  newOpenMissionAllApruve?: Maybe<Scalars['Boolean']['output']>;
  newOpenMotoAfter72hoursWithnono?: Maybe<Scalars['Boolean']['output']>;
  newmeOpenAllapruve?: Maybe<Scalars['Boolean']['output']>;
  open_mashaabims?: Maybe<OpenMashaabimRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  pics?: Maybe<UploadFileRelationResponseCollection>;
  pmashes?: Maybe<PmashRelationResponseCollection>;
  profilePic?: Maybe<UploadFileEntityResponse>;
  projectName: Scalars['String']['output'];
  publicDescription?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson_proposals?: Maybe<RatsonProposalRelationResponseCollection>;
  restime?: Maybe<Enum_Project_Restime>;
  rikmashes?: Maybe<RikmashRelationResponseCollection>;
  sales?: Maybe<SaleRelationResponseCollection>;
  sales_source?: Maybe<SaleRelationResponseCollection>;
  sheirutpends?: Maybe<SheirutpendRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  sheiruts_sourced?: Maybe<SheirutRelationResponseCollection>;
  site_share_contributions?: Maybe<SiteShareContributionRelationResponseCollection>;
  sps?: Maybe<SpRelationResponseCollection>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  timeToP?: Maybe<Enum_Project_Timetop>;
  timerOnlyTOrAlsoManuallyF?: Maybe<Scalars['Boolean']['output']>;
  timers?: Maybe<TimerRelationResponseCollection>;
  tosplits?: Maybe<TosplitRelationResponseCollection>;
  totalinyearone?: Maybe<Scalars['Float']['output']>;
  totalinyearsec?: Maybe<Scalars['Float']['output']>;
  totalmaxyearone?: Maybe<Scalars['Float']['output']>;
  totalmaxyearsec?: Maybe<Scalars['Float']['output']>;
  totalminyearone?: Maybe<Scalars['Float']['output']>;
  totalminyearsec?: Maybe<Scalars['Float']['output']>;
  twiterlink?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user_1s?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  usersOfP?: Maybe<Array<Maybe<ComponentProjectsUsersOf>>>;
  vallues?: Maybe<VallueRelationResponseCollection>;
  watsapplink?: Maybe<Scalars['String']['output']>;
  welcom_tops?: Maybe<WelcomTopRelationResponseCollection>;
  work_ways?: Maybe<WorkWayRelationResponseCollection>;
  zohars?: Maybe<ZoharRelationResponseCollection>;
};


export type ProjectActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectAskmsArgs = {
  filters?: InputMaybe<AskmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectAsksArgs = {
  filters?: InputMaybe<AskFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectAskwantsArgs = {
  filters?: InputMaybe<AskwantFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectCountriesArgs = {
  filters?: InputMaybe<CuntryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectDealsArgs = {
  filters?: InputMaybe<DealFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectDecisionsArgs = {
  filters?: InputMaybe<DecisionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectDeffinitionsArgs = {
  filters?: InputMaybe<DeffinitionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectFinnished_MissionsArgs = {
  filters?: InputMaybe<FinnishedMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectHaamadapruvsArgs = {
  filters?: InputMaybe<HaamadapruvFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectHaamadasArgs = {
  filters?: InputMaybe<HaamadaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectHalukas_ReciveArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectLocalizationsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectMachshirsArgs = {
  filters?: InputMaybe<MachshirFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectMashabetahalichesArgs = {
  filters?: InputMaybe<MashabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectMatanotofsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectOpen_MashaabimsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectPicsArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectPmashesArgs = {
  filters?: InputMaybe<PmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectRatson_ProposalsArgs = {
  filters?: InputMaybe<RatsonProposalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectRikmashesArgs = {
  filters?: InputMaybe<RikmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectSalesArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectSales_SourceArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectSheirutpendsArgs = {
  filters?: InputMaybe<SheirutpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectSheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectSheiruts_SourcedArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectSite_Share_ContributionsArgs = {
  filters?: InputMaybe<SiteShareContributionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectSpsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectTimersArgs = {
  filters?: InputMaybe<TimerFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectTosplitsArgs = {
  filters?: InputMaybe<TosplitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectUser_1sArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectUsersOfPArgs = {
  filters?: InputMaybe<ComponentProjectsUsersOfFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectValluesArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectWelcom_TopsArgs = {
  filters?: InputMaybe<WelcomTopFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectWork_WaysArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProjectZoharsArgs = {
  filters?: InputMaybe<ZoharFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ProjectEntity = {
  __typename?: 'ProjectEntity';
  attributes?: Maybe<Project>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ProjectEntityResponse = {
  __typename?: 'ProjectEntityResponse';
  data?: Maybe<ProjectEntity>;
};

export type ProjectEntityResponseCollection = {
  __typename?: 'ProjectEntityResponseCollection';
  data: Array<ProjectEntity>;
  meta: ResponseCollectionMeta;
};

export type ProjectFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  addHoursManualy?: InputMaybe<BooleanFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ProjectFiltersInput>>>;
  askms?: InputMaybe<AskmFiltersInput>;
  asks?: InputMaybe<AskFiltersInput>;
  askwants?: InputMaybe<AskwantFiltersInput>;
  city?: InputMaybe<StringFilterInput>;
  countries?: InputMaybe<CuntryFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  deals?: InputMaybe<DealFiltersInput>;
  decisions?: InputMaybe<DecisionFiltersInput>;
  deffinitions?: InputMaybe<DeffinitionFiltersInput>;
  descripFor?: InputMaybe<StringFilterInput>;
  discordlink?: InputMaybe<StringFilterInput>;
  drivelink?: InputMaybe<StringFilterInput>;
  fblink?: InputMaybe<StringFilterInput>;
  finiapruvals?: InputMaybe<FiniapruvalFiltersInput>;
  finnishedM72HForDecline?: InputMaybe<BooleanFilterInput>;
  finnishedMAllApruve?: InputMaybe<BooleanFilterInput>;
  finnished_missions?: InputMaybe<FinnishedMissionFiltersInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  githublink?: InputMaybe<StringFilterInput>;
  haamadapruvs?: InputMaybe<HaamadapruvFiltersInput>;
  haamadas?: InputMaybe<HaamadaFiltersInput>;
  halukas?: InputMaybe<HalukaFiltersInput>;
  halukas_recive?: InputMaybe<HalukaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isMachzikim?: InputMaybe<BooleanFilterInput>;
  isMachzikimPublik?: InputMaybe<BooleanFilterInput>;
  isOt?: InputMaybe<BooleanFilterInput>;
  isPlatform?: InputMaybe<BooleanFilterInput>;
  linkToWebsite?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<ProjectFiltersInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  machshirs?: InputMaybe<MachshirFiltersInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  mashabetahaliches?: InputMaybe<MashabetahalichFiltersInput>;
  matanotofs?: InputMaybe<MatanotFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  newMeMissionOuto72ho?: InputMaybe<BooleanFilterInput>;
  newOpenMissionAllApruve?: InputMaybe<BooleanFilterInput>;
  newOpenMotoAfter72hoursWithnono?: InputMaybe<BooleanFilterInput>;
  newmeOpenAllapruve?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<ProjectFiltersInput>;
  open_mashaabims?: InputMaybe<OpenMashaabimFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ProjectFiltersInput>>>;
  pendms?: InputMaybe<PendmFiltersInput>;
  pmashes?: InputMaybe<PmashFiltersInput>;
  projectName?: InputMaybe<StringFilterInput>;
  publicDescription?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson_proposals?: InputMaybe<RatsonProposalFiltersInput>;
  restime?: InputMaybe<StringFilterInput>;
  rikmashes?: InputMaybe<RikmashFiltersInput>;
  sales?: InputMaybe<SaleFiltersInput>;
  sales_source?: InputMaybe<SaleFiltersInput>;
  sheirutpends?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  sheiruts_sourced?: InputMaybe<SheirutFiltersInput>;
  site_share_contributions?: InputMaybe<SiteShareContributionFiltersInput>;
  sps?: InputMaybe<SpFiltersInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  timeToP?: InputMaybe<StringFilterInput>;
  timerOnlyTOrAlsoManuallyF?: InputMaybe<BooleanFilterInput>;
  timers?: InputMaybe<TimerFiltersInput>;
  tosplits?: InputMaybe<TosplitFiltersInput>;
  totalinyearone?: InputMaybe<FloatFilterInput>;
  totalinyearsec?: InputMaybe<FloatFilterInput>;
  totalmaxyearone?: InputMaybe<FloatFilterInput>;
  totalmaxyearsec?: InputMaybe<FloatFilterInput>;
  totalminyearone?: InputMaybe<FloatFilterInput>;
  totalminyearsec?: InputMaybe<FloatFilterInput>;
  twiterlink?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  user_1s?: InputMaybe<UsersPermissionsUserFiltersInput>;
  usersOfP?: InputMaybe<ComponentProjectsUsersOfFiltersInput>;
  vallues?: InputMaybe<VallueFiltersInput>;
  watsapplink?: InputMaybe<StringFilterInput>;
  welcom_tops?: InputMaybe<WelcomTopFiltersInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
  zohars?: InputMaybe<ZoharFiltersInput>;
};

export type ProjectInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  addHoursManualy?: InputMaybe<Scalars['Boolean']['input']>;
  askms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  asks?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askwants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  city?: InputMaybe<Scalars['String']['input']>;
  countries?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  deals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  decisions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  deffinitions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descripFor?: InputMaybe<Scalars['String']['input']>;
  discordlink?: InputMaybe<Scalars['String']['input']>;
  drivelink?: InputMaybe<Scalars['String']['input']>;
  fblink?: InputMaybe<Scalars['String']['input']>;
  finiapruvals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  finnishedM72HForDecline?: InputMaybe<Scalars['Boolean']['input']>;
  finnishedMAllApruve?: InputMaybe<Scalars['Boolean']['input']>;
  finnished_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  githublink?: InputMaybe<Scalars['String']['input']>;
  haamadapruvs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  haamadas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  halukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  halukas_recive?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  isMachzikim?: InputMaybe<Scalars['Boolean']['input']>;
  isMachzikimPublik?: InputMaybe<Scalars['Boolean']['input']>;
  isOt?: InputMaybe<Scalars['Boolean']['input']>;
  isPlatform?: InputMaybe<Scalars['Boolean']['input']>;
  linkToWebsite?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  machshirs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanotofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  newMeMissionOuto72ho?: InputMaybe<Scalars['Boolean']['input']>;
  newOpenMissionAllApruve?: InputMaybe<Scalars['Boolean']['input']>;
  newOpenMotoAfter72hoursWithnono?: InputMaybe<Scalars['Boolean']['input']>;
  newmeOpenAllapruve?: InputMaybe<Scalars['Boolean']['input']>;
  open_mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pics?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  profilePic?: InputMaybe<Scalars['ID']['input']>;
  projectName?: InputMaybe<Scalars['String']['input']>;
  publicDescription?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  restime?: InputMaybe<Enum_Project_Restime>;
  rikmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sales?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sales_source?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts_sourced?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  site_share_contributions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  timeToP?: InputMaybe<Enum_Project_Timetop>;
  timerOnlyTOrAlsoManuallyF?: InputMaybe<Scalars['Boolean']['input']>;
  timers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  tosplits?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  totalinyearone?: InputMaybe<Scalars['Float']['input']>;
  totalinyearsec?: InputMaybe<Scalars['Float']['input']>;
  totalmaxyearone?: InputMaybe<Scalars['Float']['input']>;
  totalmaxyearsec?: InputMaybe<Scalars['Float']['input']>;
  totalminyearone?: InputMaybe<Scalars['Float']['input']>;
  totalminyearsec?: InputMaybe<Scalars['Float']['input']>;
  twiterlink?: InputMaybe<Scalars['String']['input']>;
  user_1s?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  usersOfP?: InputMaybe<Array<InputMaybe<ComponentProjectsUsersOfInput>>>;
  vallues?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  watsapplink?: InputMaybe<Scalars['String']['input']>;
  welcom_tops?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  work_ways?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  zohars?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type ProjectRelationResponseCollection = {
  __typename?: 'ProjectRelationResponseCollection';
  data: Array<ProjectEntity>;
};

export type ProviderProfile = {
  __typename?: 'ProviderProfile';
  ai_meta?: Maybe<Scalars['JSON']['output']>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  avg_rating?: Maybe<Scalars['Float']['output']>;
  bio_raw?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  location?: Maybe<ComponentNewLocation>;
  owner_id?: Maybe<Scalars['String']['output']>;
  owner_type?: Maybe<Enum_Providerprofile_Owner_Type>;
  pinecone_id?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  radius_km?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ProviderProfileEntity = {
  __typename?: 'ProviderProfileEntity';
  attributes?: Maybe<ProviderProfile>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ProviderProfileEntityResponse = {
  __typename?: 'ProviderProfileEntityResponse';
  data?: Maybe<ProviderProfileEntity>;
};

export type ProviderProfileEntityResponseCollection = {
  __typename?: 'ProviderProfileEntityResponseCollection';
  data: Array<ProviderProfileEntity>;
  meta: ResponseCollectionMeta;
};

export type ProviderProfileFiltersInput = {
  ai_meta?: InputMaybe<JsonFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ProviderProfileFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  avg_rating?: InputMaybe<FloatFilterInput>;
  bio_raw?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  display_name?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  lat?: InputMaybe<FloatFilterInput>;
  lng?: InputMaybe<FloatFilterInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  not?: InputMaybe<ProviderProfileFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ProviderProfileFiltersInput>>>;
  owner_id?: InputMaybe<StringFilterInput>;
  owner_type?: InputMaybe<StringFilterInput>;
  pinecone_id?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  radius_km?: InputMaybe<IntFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ProviderProfileInput = {
  ai_meta?: InputMaybe<Scalars['JSON']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  avg_rating?: InputMaybe<Scalars['Float']['input']>;
  bio_raw?: InputMaybe<Scalars['String']['input']>;
  display_name?: InputMaybe<Scalars['String']['input']>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  owner_id?: InputMaybe<Scalars['String']['input']>;
  owner_type?: InputMaybe<Enum_Providerprofile_Owner_Type>;
  pinecone_id?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  radius_km?: InputMaybe<Scalars['Int']['input']>;
};

export enum PublicationState {
  Live = 'LIVE',
  Preview = 'PREVIEW'
}

export type Query = {
  __typename?: 'Query';
  act?: Maybe<ActEntityResponse>;
  acts?: Maybe<ActEntityResponseCollection>;
  actt?: Maybe<ActtEntityResponse>;
  actts?: Maybe<ActtEntityResponseCollection>;
  apiKey?: Maybe<ApiKeyEntityResponse>;
  apiKeys?: Maybe<ApiKeyEntityResponseCollection>;
  argument?: Maybe<ArgumentEntityResponse>;
  arguments?: Maybe<ArgumentEntityResponseCollection>;
  ask?: Maybe<AskEntityResponse>;
  askm?: Maybe<AskmEntityResponse>;
  askms?: Maybe<AskmEntityResponseCollection>;
  asks?: Maybe<AskEntityResponseCollection>;
  askwant?: Maybe<AskwantEntityResponse>;
  askwants?: Maybe<AskwantEntityResponseCollection>;
  bakasha?: Maybe<BakashaEntityResponse>;
  bakashas?: Maybe<BakashaEntityResponseCollection>;
  categories?: Maybe<CategoryEntityResponseCollection>;
  category?: Maybe<CategoryEntityResponse>;
  chezin?: Maybe<ChezinEntityResponse>;
  chezins?: Maybe<ChezinEntityResponseCollection>;
  clause?: Maybe<ClauseEntityResponse>;
  clauses?: Maybe<ClauseEntityResponseCollection>;
  contentReleasesRelease?: Maybe<ContentReleasesReleaseEntityResponse>;
  contentReleasesReleaseAction?: Maybe<ContentReleasesReleaseActionEntityResponse>;
  contentReleasesReleaseActions?: Maybe<ContentReleasesReleaseActionEntityResponseCollection>;
  contentReleasesReleases?: Maybe<ContentReleasesReleaseEntityResponseCollection>;
  conventionText?: Maybe<ConventionTextEntityResponse>;
  conventionTexts?: Maybe<ConventionTextEntityResponseCollection>;
  cuntries?: Maybe<CuntryEntityResponseCollection>;
  cuntry?: Maybe<CuntryEntityResponse>;
  dea?: Maybe<DeaEntityResponse>;
  deal?: Maybe<DealEntityResponse>;
  deals?: Maybe<DealEntityResponseCollection>;
  deas?: Maybe<DeaEntityResponseCollection>;
  decision?: Maybe<DecisionEntityResponse>;
  decisions?: Maybe<DecisionEntityResponseCollection>;
  deffinition?: Maybe<DeffinitionEntityResponse>;
  deffinitions?: Maybe<DeffinitionEntityResponseCollection>;
  filtertag?: Maybe<FiltertagEntityResponse>;
  filtertags?: Maybe<FiltertagEntityResponseCollection>;
  finiapruval?: Maybe<FiniapruvalEntityResponse>;
  finiapruvals?: Maybe<FiniapruvalEntityResponseCollection>;
  finnishedMission?: Maybe<FinnishedMissionEntityResponse>;
  finnishedMissions?: Maybe<FinnishedMissionEntityResponseCollection>;
  forum?: Maybe<ForumEntityResponse>;
  forumLastSeen?: Maybe<ForumLastSeenEntityResponse>;
  forumLastSeens?: Maybe<ForumLastSeenEntityResponseCollection>;
  forums?: Maybe<ForumEntityResponseCollection>;
  haamada?: Maybe<HaamadaEntityResponse>;
  haamadapruv?: Maybe<HaamadapruvEntityResponse>;
  haamadapruvs?: Maybe<HaamadapruvEntityResponseCollection>;
  haamadas?: Maybe<HaamadaEntityResponseCollection>;
  haluka?: Maybe<HalukaEntityResponse>;
  halukas?: Maybe<HalukaEntityResponseCollection>;
  hatzaa?: Maybe<HatzaaEntityResponse>;
  hatzaas?: Maybe<HatzaaEntityResponseCollection>;
  hazbaah?: Maybe<HazbaahEntityResponse>;
  hazbaahs?: Maybe<HazbaahEntityResponseCollection>;
  i18NLocale?: Maybe<I18NLocaleEntityResponse>;
  i18NLocales?: Maybe<I18NLocaleEntityResponseCollection>;
  issue?: Maybe<IssueEntityResponse>;
  issues?: Maybe<IssueEntityResponseCollection>;
  maap?: Maybe<MaapEntityResponse>;
  maaps?: Maybe<MaapEntityResponseCollection>;
  machshir?: Maybe<MachshirEntityResponse>;
  machshirs?: Maybe<MachshirEntityResponseCollection>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  mashaabims?: Maybe<MashaabimEntityResponseCollection>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  mashabetahaliches?: Maybe<MashabetahalichEntityResponseCollection>;
  matanot?: Maybe<MatanotEntityResponse>;
  matanotRecipeMission?: Maybe<MatanotRecipeMissionEntityResponse>;
  matanotRecipeMissions?: Maybe<MatanotRecipeMissionEntityResponseCollection>;
  matanotRecipeResource?: Maybe<MatanotRecipeResourceEntityResponse>;
  matanotRecipeResources?: Maybe<MatanotRecipeResourceEntityResponseCollection>;
  matanotpend?: Maybe<MatanotpendEntityResponse>;
  matanotpends?: Maybe<MatanotpendEntityResponseCollection>;
  matanots?: Maybe<MatanotEntityResponseCollection>;
  matbea?: Maybe<MatbeaEntityResponse>;
  matbeas?: Maybe<MatbeaEntityResponseCollection>;
  me?: Maybe<UsersPermissionsMe>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  mesimabetahaliches?: Maybe<MesimabetahalichEntityResponseCollection>;
  message?: Maybe<MessageEntityResponse>;
  messages?: Maybe<MessageEntityResponseCollection>;
  mission?: Maybe<MissionEntityResponse>;
  missions?: Maybe<MissionEntityResponseCollection>;
  mode?: Maybe<ModeEntityResponse>;
  modes?: Maybe<ModeEntityResponseCollection>;
  monter?: Maybe<MonterEntityResponse>;
  monters?: Maybe<MonterEntityResponseCollection>;
  nego?: Maybe<NegoEntityResponse>;
  negoMash?: Maybe<NegoMashEntityResponse>;
  negoMashes?: Maybe<NegoMashEntityResponseCollection>;
  negopendmission?: Maybe<NegopendmissionEntityResponse>;
  negopendmissions?: Maybe<NegopendmissionEntityResponseCollection>;
  negos?: Maybe<NegoEntityResponseCollection>;
  negotiation?: Maybe<NegotiationEntityResponse>;
  negotiations?: Maybe<NegotiationEntityResponseCollection>;
  openMashaabim?: Maybe<OpenMashaabimEntityResponse>;
  openMashaabims?: Maybe<OpenMashaabimEntityResponseCollection>;
  openMission?: Maybe<OpenMissionEntityResponse>;
  openMissions?: Maybe<OpenMissionEntityResponseCollection>;
  partof?: Maybe<PartofEntityResponse>;
  partofs?: Maybe<PartofEntityResponseCollection>;
  pendm?: Maybe<PendmEntityResponse>;
  pendms?: Maybe<PendmEntityResponseCollection>;
  pgisha?: Maybe<PgishaEntityResponse>;
  pgishas?: Maybe<PgishaEntityResponseCollection>;
  pgishauser?: Maybe<PgishauserEntityResponse>;
  pgishauserpend?: Maybe<PgishauserpendEntityResponse>;
  pgishauserpends?: Maybe<PgishauserpendEntityResponseCollection>;
  pgishausers?: Maybe<PgishauserEntityResponseCollection>;
  pmash?: Maybe<PmashEntityResponse>;
  pmashes?: Maybe<PmashEntityResponseCollection>;
  position?: Maybe<PositionEntityResponse>;
  positions?: Maybe<PositionEntityResponseCollection>;
  project?: Maybe<ProjectEntityResponse>;
  projects?: Maybe<ProjectEntityResponseCollection>;
  providerProfile?: Maybe<ProviderProfileEntityResponse>;
  providerProfiles?: Maybe<ProviderProfileEntityResponseCollection>;
  ratson?: Maybe<RatsonEntityResponse>;
  ratsonMatchJob?: Maybe<RatsonMatchJobEntityResponse>;
  ratsonMatchJobs?: Maybe<RatsonMatchJobEntityResponseCollection>;
  ratsonProposal?: Maybe<RatsonProposalEntityResponse>;
  ratsonProposals?: Maybe<RatsonProposalEntityResponseCollection>;
  ratsonShare?: Maybe<RatsonShareEntityResponse>;
  ratsonShares?: Maybe<RatsonShareEntityResponseCollection>;
  ratsons?: Maybe<RatsonEntityResponseCollection>;
  richtext?: Maybe<RichtextEntityResponse>;
  richtexts?: Maybe<RichtextEntityResponseCollection>;
  rikmash?: Maybe<RikmashEntityResponse>;
  rikmashes?: Maybe<RikmashEntityResponseCollection>;
  sale?: Maybe<SaleEntityResponse>;
  sales?: Maybe<SaleEntityResponseCollection>;
  seeder?: Maybe<SeederEntityResponse>;
  seeders?: Maybe<SeederEntityResponseCollection>;
  sheirut?: Maybe<SheirutEntityResponse>;
  sheirutFulfillment?: Maybe<SheirutFulfillmentEntityResponse>;
  sheirutFulfillments?: Maybe<SheirutFulfillmentEntityResponseCollection>;
  sheirutnego?: Maybe<SheirutnegoEntityResponse>;
  sheirutnegos?: Maybe<SheirutnegoEntityResponseCollection>;
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
  sheirutpends?: Maybe<SheirutpendEntityResponseCollection>;
  sheiruts?: Maybe<SheirutEntityResponseCollection>;
  sidur?: Maybe<SidurEntityResponse>;
  sidurs?: Maybe<SidurEntityResponseCollection>;
  siteReport?: Maybe<SiteReportEntityResponse>;
  siteReports?: Maybe<SiteReportEntityResponseCollection>;
  siteShareContribution?: Maybe<SiteShareContributionEntityResponse>;
  siteShareContributions?: Maybe<SiteShareContributionEntityResponseCollection>;
  skill?: Maybe<SkillEntityResponse>;
  skills?: Maybe<SkillEntityResponseCollection>;
  solution?: Maybe<SolutionEntityResponse>;
  solutions?: Maybe<SolutionEntityResponseCollection>;
  sp?: Maybe<SpEntityResponse>;
  sps?: Maybe<SpEntityResponseCollection>;
  tafkidim?: Maybe<TafkidimEntityResponse>;
  tafkidims?: Maybe<TafkidimEntityResponseCollection>;
  tikunolam?: Maybe<TikunolamEntityResponse>;
  tikunolams?: Maybe<TikunolamEntityResponseCollection>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  timegramas?: Maybe<TimegramaEntityResponseCollection>;
  timer?: Maybe<TimerEntityResponse>;
  timers?: Maybe<TimerEntityResponseCollection>;
  tosplit?: Maybe<TosplitEntityResponse>;
  tosplits?: Maybe<TosplitEntityResponseCollection>;
  translate?: Maybe<TranslateEntityResponse>;
  translates?: Maybe<TranslateEntityResponseCollection>;
  uploadFile?: Maybe<UploadFileEntityResponse>;
  uploadFiles?: Maybe<UploadFileEntityResponseCollection>;
  uploadFolder?: Maybe<UploadFolderEntityResponse>;
  uploadFolders?: Maybe<UploadFolderEntityResponseCollection>;
  usersPermissionsRole?: Maybe<UsersPermissionsRoleEntityResponse>;
  usersPermissionsRoles?: Maybe<UsersPermissionsRoleEntityResponseCollection>;
  usersPermissionsUser?: Maybe<UsersPermissionsUserEntityResponse>;
  usersPermissionsUsers?: Maybe<UsersPermissionsUserEntityResponseCollection>;
  vallue?: Maybe<VallueEntityResponse>;
  vallues?: Maybe<VallueEntityResponseCollection>;
  vote?: Maybe<VoteEntityResponse>;
  votes?: Maybe<VoteEntityResponseCollection>;
  want?: Maybe<WantEntityResponse>;
  wants?: Maybe<WantEntityResponseCollection>;
  welcomTop?: Maybe<WelcomTopEntityResponse>;
  welcomTops?: Maybe<WelcomTopEntityResponseCollection>;
  whatandwhy?: Maybe<WhatandwhyEntityResponse>;
  workWay?: Maybe<WorkWayEntityResponse>;
  workWays?: Maybe<WorkWayEntityResponseCollection>;
  yat?: Maybe<YatEntityResponse>;
  yats?: Maybe<YatEntityResponseCollection>;
  zohar?: Maybe<ZoharEntityResponse>;
  zohars?: Maybe<ZoharEntityResponseCollection>;
};


export type QueryActArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryActtArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryActtsArgs = {
  filters?: InputMaybe<ActtFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryApiKeyArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryApiKeysArgs = {
  filters?: InputMaybe<ApiKeyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryArgumentArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryArgumentsArgs = {
  filters?: InputMaybe<ArgumentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAskArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryAskmArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryAskmsArgs = {
  filters?: InputMaybe<AskmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAsksArgs = {
  filters?: InputMaybe<AskFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAskwantArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryAskwantsArgs = {
  filters?: InputMaybe<AskwantFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBakashaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryBakashasArgs = {
  filters?: InputMaybe<BakashaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCategoriesArgs = {
  filters?: InputMaybe<CategoryFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCategoryArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryChezinArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryChezinsArgs = {
  filters?: InputMaybe<ChezinFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryClauseArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryClausesArgs = {
  filters?: InputMaybe<ClauseFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryContentReleasesReleaseArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryContentReleasesReleaseActionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryContentReleasesReleaseActionsArgs = {
  filters?: InputMaybe<ContentReleasesReleaseActionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryContentReleasesReleasesArgs = {
  filters?: InputMaybe<ContentReleasesReleaseFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryConventionTextArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryConventionTextsArgs = {
  filters?: InputMaybe<ConventionTextFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCuntriesArgs = {
  filters?: InputMaybe<CuntryFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCuntryArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryDeaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryDealArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryDealsArgs = {
  filters?: InputMaybe<DealFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDeasArgs = {
  filters?: InputMaybe<DeaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDecisionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryDecisionsArgs = {
  filters?: InputMaybe<DecisionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDeffinitionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryDeffinitionsArgs = {
  filters?: InputMaybe<DeffinitionFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryFiltertagArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryFiltertagsArgs = {
  filters?: InputMaybe<FiltertagFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryFiniapruvalArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryFinnishedMissionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryFinnishedMissionsArgs = {
  filters?: InputMaybe<FinnishedMissionFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryForumArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryForumLastSeenArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryForumLastSeensArgs = {
  filters?: InputMaybe<ForumLastSeenFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryHaamadaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryHaamadapruvArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryHaamadapruvsArgs = {
  filters?: InputMaybe<HaamadapruvFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryHaamadasArgs = {
  filters?: InputMaybe<HaamadaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryHalukaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryHatzaaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryHatzaasArgs = {
  filters?: InputMaybe<HatzaaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryHazbaahArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryHazbaahsArgs = {
  filters?: InputMaybe<HazbaahFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryI18NLocaleArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryI18NLocalesArgs = {
  filters?: InputMaybe<I18NLocaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryIssueArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryIssuesArgs = {
  filters?: InputMaybe<IssueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMaapArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMachshirArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMachshirsArgs = {
  filters?: InputMaybe<MachshirFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMashaabimArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMashabetahalichArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMashabetahalichesArgs = {
  filters?: InputMaybe<MashabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMatanotArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryMatanotRecipeMissionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMatanotRecipeMissionsArgs = {
  filters?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMatanotRecipeResourceArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMatanotRecipeResourcesArgs = {
  filters?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMatanotpendArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMatanotpendsArgs = {
  filters?: InputMaybe<MatanotpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMatbeaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryMatbeasArgs = {
  filters?: InputMaybe<MatbeaFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMesimabetahalichArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMessageArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMessagesArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMissionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryModeArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryModesArgs = {
  filters?: InputMaybe<ModeFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMonterArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMontersArgs = {
  filters?: InputMaybe<MonterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNegoArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryNegoMashArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryNegoMashesArgs = {
  filters?: InputMaybe<NegoMashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNegopendmissionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNegosArgs = {
  filters?: InputMaybe<NegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNegotiationArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryNegotiationsArgs = {
  filters?: InputMaybe<NegotiationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryOpenMashaabimArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryOpenMashaabimsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryOpenMissionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryOpenMissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPartofArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPendmArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPgishaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryPgishasArgs = {
  filters?: InputMaybe<PgishaFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPgishauserArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPgishauserpendArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPgishauserpendsArgs = {
  filters?: InputMaybe<PgishauserpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPgishausersArgs = {
  filters?: InputMaybe<PgishauserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPmashArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPmashesArgs = {
  filters?: InputMaybe<PmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPositionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPositionsArgs = {
  filters?: InputMaybe<PositionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryProjectArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryProviderProfileArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryProviderProfilesArgs = {
  filters?: InputMaybe<ProviderProfileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRatsonArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryRatsonMatchJobArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRatsonMatchJobsArgs = {
  filters?: InputMaybe<RatsonMatchJobFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRatsonProposalArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRatsonProposalsArgs = {
  filters?: InputMaybe<RatsonProposalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRatsonShareArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRatsonSharesArgs = {
  filters?: InputMaybe<RatsonShareFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRatsonsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRichtextArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryRichtextsArgs = {
  filters?: InputMaybe<RichtextFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRikmashArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRikmashesArgs = {
  filters?: InputMaybe<RikmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySaleArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySalesArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySeederArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySeedersArgs = {
  filters?: InputMaybe<SeederFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySheirutArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QuerySheirutFulfillmentArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySheirutFulfillmentsArgs = {
  filters?: InputMaybe<SheirutFulfillmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySheirutnegoArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySheirutnegosArgs = {
  filters?: InputMaybe<SheirutnegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySheirutpendArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QuerySheirutpendsArgs = {
  filters?: InputMaybe<SheirutpendFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySidurArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySidursArgs = {
  filters?: InputMaybe<SidurFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySiteReportArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySiteReportsArgs = {
  filters?: InputMaybe<SiteReportFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySiteShareContributionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySiteShareContributionsArgs = {
  filters?: InputMaybe<SiteShareContributionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySkillArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QuerySkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySolutionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySolutionsArgs = {
  filters?: InputMaybe<SolutionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySpArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QuerySpsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryTafkidimArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryTikunolamArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryTikunolamsArgs = {
  filters?: InputMaybe<TikunolamFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryTimegramaArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryTimegramasArgs = {
  filters?: InputMaybe<TimegramaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryTimerArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryTimersArgs = {
  filters?: InputMaybe<TimerFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryTosplitArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryTosplitsArgs = {
  filters?: InputMaybe<TosplitFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryTranslateArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryTranslatesArgs = {
  filters?: InputMaybe<TranslateFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryUploadFileArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUploadFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryUploadFolderArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUploadFoldersArgs = {
  filters?: InputMaybe<UploadFolderFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryUsersPermissionsRoleArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUsersPermissionsRolesArgs = {
  filters?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryUsersPermissionsUserArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUsersPermissionsUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryVallueArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryValluesArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryVoteArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWantArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryWantsArgs = {
  filters?: InputMaybe<WantFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWelcomTopArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryWelcomTopsArgs = {
  filters?: InputMaybe<WelcomTopFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWhatandwhyArgs = {
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryWorkWayArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryWorkWaysArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryYatArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryYatsArgs = {
  filters?: InputMaybe<YatFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryZoharArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryZoharsArgs = {
  filters?: InputMaybe<ZoharFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Ratson = {
  __typename?: 'Ratson';
  access_mode?: Maybe<Enum_Ratson_Access_Mode>;
  age_group?: Maybe<Scalars['String']['output']>;
  ai_meta?: Maybe<Scalars['JSON']['output']>;
  allowJoin?: Maybe<Scalars['Boolean']['output']>;
  bounti?: Maybe<Scalars['Boolean']['output']>;
  categories?: Maybe<CategoryRelationResponseCollection>;
  chat_forum?: Maybe<ForumEntityResponse>;
  consensusRule?: Maybe<Enum_Ratson_Consensusrule>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  derivedComplexMatanot?: Maybe<MatanotEntityResponse>;
  desc?: Maybe<Scalars['String']['output']>;
  extracted_missions?: Maybe<Array<Maybe<ComponentNewExtractedMissions>>>;
  extracted_resources?: Maybe<Array<Maybe<ComponentNewExtractedResources>>>;
  finnishDate?: Maybe<Scalars['DateTime']['output']>;
  frequency?: Maybe<Scalars['String']['output']>;
  fulfilled?: Maybe<Scalars['Boolean']['output']>;
  fulfillment_score?: Maybe<Scalars['Float']['output']>;
  isOnline?: Maybe<Scalars['Boolean']['output']>;
  joinDeadline?: Maybe<Scalars['DateTime']['output']>;
  joinKind?: Maybe<Enum_Ratson_Joinkind>;
  language?: Maybe<Scalars['String']['output']>;
  last_matched_at?: Maybe<Scalars['DateTime']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<RatsonRelationResponseCollection>;
  location?: Maybe<Array<Maybe<ComponentNewLocation>>>;
  location_hint?: Maybe<Scalars['String']['output']>;
  lockedAt?: Maybe<Scalars['DateTime']['output']>;
  logo?: Maybe<UploadFileEntityResponse>;
  longDes?: Maybe<Scalars['String']['output']>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  matanots_offered?: Maybe<MatanotRelationResponseCollection>;
  maxJoiners?: Maybe<Scalars['Int']['output']>;
  minJoiners?: Maybe<Scalars['Int']['output']>;
  missions?: Maybe<MissionRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  open_mashaabims?: Maybe<OpenMashaabimRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  partialConsensusFallback?: Maybe<Enum_Ratson_Partialconsensusfallback>;
  pics?: Maybe<UploadFileRelationResponseCollection>;
  pinecone_id?: Maybe<Scalars['String']['output']>;
  process?: Maybe<PartofEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  radius?: Maybe<Scalars['Long']['output']>;
  ratson_match_jobs?: Maybe<RatsonMatchJobRelationResponseCollection>;
  ratson_proposals?: Maybe<RatsonProposalRelationResponseCollection>;
  ratson_shares?: Maybe<RatsonShareRelationResponseCollection>;
  share_status?: Maybe<Enum_Ratson_Share_Status>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  status_ratson?: Maybe<Enum_Ratson_Status_Ratson>;
  sub_category?: Maybe<Scalars['String']['output']>;
  totalbounti?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  vallues?: Maybe<VallueRelationResponseCollection>;
  votes?: Maybe<VoteRelationResponseCollection>;
  willingnessModel?: Maybe<Enum_Ratson_Willingnessmodel>;
};


export type RatsonCategoriesArgs = {
  filters?: InputMaybe<CategoryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonExtracted_MissionsArgs = {
  filters?: InputMaybe<ComponentNewExtractedMissionsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonExtracted_ResourcesArgs = {
  filters?: InputMaybe<ComponentNewExtractedResourcesFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonLocalizationsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonLocationArgs = {
  filters?: InputMaybe<ComponentNewLocationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonMatanots_OfferedArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonOpen_MashaabimsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonPicsArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonRatson_Match_JobsArgs = {
  filters?: InputMaybe<RatsonMatchJobFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonRatson_ProposalsArgs = {
  filters?: InputMaybe<RatsonProposalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonRatson_SharesArgs = {
  filters?: InputMaybe<RatsonShareFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonSheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonUsers_Permissions_UsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonValluesArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type RatsonEntity = {
  __typename?: 'RatsonEntity';
  attributes?: Maybe<Ratson>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type RatsonEntityResponse = {
  __typename?: 'RatsonEntityResponse';
  data?: Maybe<RatsonEntity>;
};

export type RatsonEntityResponseCollection = {
  __typename?: 'RatsonEntityResponseCollection';
  data: Array<RatsonEntity>;
  meta: ResponseCollectionMeta;
};

export type RatsonFiltersInput = {
  access_mode?: InputMaybe<StringFilterInput>;
  age_group?: InputMaybe<StringFilterInput>;
  ai_meta?: InputMaybe<JsonFilterInput>;
  allowJoin?: InputMaybe<BooleanFilterInput>;
  and?: InputMaybe<Array<InputMaybe<RatsonFiltersInput>>>;
  bounti?: InputMaybe<BooleanFilterInput>;
  categories?: InputMaybe<CategoryFiltersInput>;
  chat_forum?: InputMaybe<ForumFiltersInput>;
  consensusRule?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  derivedComplexMatanot?: InputMaybe<MatanotFiltersInput>;
  desc?: InputMaybe<StringFilterInput>;
  extracted_missions?: InputMaybe<ComponentNewExtractedMissionsFiltersInput>;
  extracted_resources?: InputMaybe<ComponentNewExtractedResourcesFiltersInput>;
  finnishDate?: InputMaybe<DateTimeFilterInput>;
  frequency?: InputMaybe<StringFilterInput>;
  fulfilled?: InputMaybe<BooleanFilterInput>;
  fulfillment_score?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isOnline?: InputMaybe<BooleanFilterInput>;
  joinDeadline?: InputMaybe<DateTimeFilterInput>;
  joinKind?: InputMaybe<StringFilterInput>;
  language?: InputMaybe<StringFilterInput>;
  last_matched_at?: InputMaybe<DateTimeFilterInput>;
  lat?: InputMaybe<FloatFilterInput>;
  link?: InputMaybe<StringFilterInput>;
  lng?: InputMaybe<FloatFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<RatsonFiltersInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  location_hint?: InputMaybe<StringFilterInput>;
  lockedAt?: InputMaybe<DateTimeFilterInput>;
  longDes?: InputMaybe<StringFilterInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  matanots_offered?: InputMaybe<MatanotFiltersInput>;
  maxJoiners?: InputMaybe<IntFilterInput>;
  minJoiners?: InputMaybe<IntFilterInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<RatsonFiltersInput>;
  open_mashaabims?: InputMaybe<OpenMashaabimFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RatsonFiltersInput>>>;
  partialConsensusFallback?: InputMaybe<StringFilterInput>;
  pinecone_id?: InputMaybe<StringFilterInput>;
  process?: InputMaybe<PartofFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  radius?: InputMaybe<LongFilterInput>;
  ratson_match_jobs?: InputMaybe<RatsonMatchJobFiltersInput>;
  ratson_proposals?: InputMaybe<RatsonProposalFiltersInput>;
  ratson_shares?: InputMaybe<RatsonShareFiltersInput>;
  share_status?: InputMaybe<StringFilterInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  status_ratson?: InputMaybe<StringFilterInput>;
  sub_category?: InputMaybe<StringFilterInput>;
  totalbounti?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vallues?: InputMaybe<VallueFiltersInput>;
  votes?: InputMaybe<VoteFiltersInput>;
  willingnessModel?: InputMaybe<StringFilterInput>;
};

export type RatsonInput = {
  access_mode?: InputMaybe<Enum_Ratson_Access_Mode>;
  age_group?: InputMaybe<Scalars['String']['input']>;
  ai_meta?: InputMaybe<Scalars['JSON']['input']>;
  allowJoin?: InputMaybe<Scalars['Boolean']['input']>;
  bounti?: InputMaybe<Scalars['Boolean']['input']>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  chat_forum?: InputMaybe<Scalars['ID']['input']>;
  consensusRule?: InputMaybe<Enum_Ratson_Consensusrule>;
  derivedComplexMatanot?: InputMaybe<Scalars['ID']['input']>;
  desc?: InputMaybe<Scalars['String']['input']>;
  extracted_missions?: InputMaybe<Array<InputMaybe<ComponentNewExtractedMissionsInput>>>;
  extracted_resources?: InputMaybe<Array<InputMaybe<ComponentNewExtractedResourcesInput>>>;
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  frequency?: InputMaybe<Scalars['String']['input']>;
  fulfilled?: InputMaybe<Scalars['Boolean']['input']>;
  fulfillment_score?: InputMaybe<Scalars['Float']['input']>;
  isOnline?: InputMaybe<Scalars['Boolean']['input']>;
  joinDeadline?: InputMaybe<Scalars['DateTime']['input']>;
  joinKind?: InputMaybe<Enum_Ratson_Joinkind>;
  language?: InputMaybe<Scalars['String']['input']>;
  last_matched_at?: InputMaybe<Scalars['DateTime']['input']>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  link?: InputMaybe<Scalars['String']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>;
  location_hint?: InputMaybe<Scalars['String']['input']>;
  lockedAt?: InputMaybe<Scalars['DateTime']['input']>;
  logo?: InputMaybe<Scalars['ID']['input']>;
  longDes?: InputMaybe<Scalars['String']['input']>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanots_offered?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  maxJoiners?: InputMaybe<Scalars['Int']['input']>;
  minJoiners?: InputMaybe<Scalars['Int']['input']>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  open_mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  partialConsensusFallback?: InputMaybe<Enum_Ratson_Partialconsensusfallback>;
  pics?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pinecone_id?: InputMaybe<Scalars['String']['input']>;
  process?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  radius?: InputMaybe<Scalars['Long']['input']>;
  ratson_match_jobs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ratson_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ratson_shares?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  share_status?: InputMaybe<Enum_Ratson_Share_Status>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  status_ratson?: InputMaybe<Enum_Ratson_Status_Ratson>;
  sub_category?: InputMaybe<Scalars['String']['input']>;
  totalbounti?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  vallues?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  willingnessModel?: InputMaybe<Enum_Ratson_Willingnessmodel>;
};

export type RatsonMatchJob = {
  __typename?: 'RatsonMatchJob';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  finished_at?: Maybe<Scalars['DateTime']['output']>;
  mode?: Maybe<Enum_Ratsonmatchjob_Mode>;
  proposals_created?: Maybe<Scalars['Int']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  started_at?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type RatsonMatchJobEntity = {
  __typename?: 'RatsonMatchJobEntity';
  attributes?: Maybe<RatsonMatchJob>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type RatsonMatchJobEntityResponse = {
  __typename?: 'RatsonMatchJobEntityResponse';
  data?: Maybe<RatsonMatchJobEntity>;
};

export type RatsonMatchJobEntityResponseCollection = {
  __typename?: 'RatsonMatchJobEntityResponseCollection';
  data: Array<RatsonMatchJobEntity>;
  meta: ResponseCollectionMeta;
};

export type RatsonMatchJobFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<RatsonMatchJobFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  error?: InputMaybe<StringFilterInput>;
  finished_at?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  mode?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<RatsonMatchJobFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RatsonMatchJobFiltersInput>>>;
  proposals_created?: InputMaybe<IntFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  started_at?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type RatsonMatchJobInput = {
  error?: InputMaybe<Scalars['String']['input']>;
  finished_at?: InputMaybe<Scalars['DateTime']['input']>;
  mode?: InputMaybe<Enum_Ratsonmatchjob_Mode>;
  proposals_created?: InputMaybe<Scalars['Int']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  started_at?: InputMaybe<Scalars['DateTime']['input']>;
};

export type RatsonMatchJobRelationResponseCollection = {
  __typename?: 'RatsonMatchJobRelationResponseCollection';
  data: Array<RatsonMatchJobEntity>;
};

export type RatsonProposal = {
  __typename?: 'RatsonProposal';
  auto_generated?: Maybe<Scalars['Boolean']['output']>;
  covered_missions?: Maybe<Array<Maybe<ComponentNewCoveredMissions>>>;
  covered_resources?: Maybe<Array<Maybe<ComponentNewCoveredResources>>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  final_breakdown?: Maybe<Scalars['JSON']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  kind?: Maybe<Enum_Ratsonproposal_Kind>;
  matanot?: Maybe<MatanotEntityResponse>;
  matbea?: Maybe<MatbeaEntityResponse>;
  match_score?: Maybe<Scalars['Float']['output']>;
  negos?: Maybe<NegoRelationResponseCollection>;
  open_mashaabims?: Maybe<OpenMashaabimRelationResponseCollection>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  proposer_users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  ratson_willingness_entry?: Maybe<Array<Maybe<ComponentNewWillingnessEntries>>>;
  sheirutpends?: Maybe<SheirutpendRelationResponseCollection>;
  status_proposal?: Maybe<Enum_Ratsonproposal_Status_Proposal>;
  tosplits?: Maybe<TosplitRelationResponseCollection>;
  total_price?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  votes?: Maybe<VoteRelationResponseCollection>;
};


export type RatsonProposalCovered_MissionsArgs = {
  filters?: InputMaybe<ComponentNewCoveredMissionsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalCovered_ResourcesArgs = {
  filters?: InputMaybe<ComponentNewCoveredResourcesFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalNegosArgs = {
  filters?: InputMaybe<NegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalOpen_MashaabimsArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalProposer_UsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalRatson_Willingness_EntryArgs = {
  filters?: InputMaybe<ComponentNewWillingnessEntriesFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalSheirutpendsArgs = {
  filters?: InputMaybe<SheirutpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalTosplitsArgs = {
  filters?: InputMaybe<TosplitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonProposalVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type RatsonProposalEntity = {
  __typename?: 'RatsonProposalEntity';
  attributes?: Maybe<RatsonProposal>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type RatsonProposalEntityResponse = {
  __typename?: 'RatsonProposalEntityResponse';
  data?: Maybe<RatsonProposalEntity>;
};

export type RatsonProposalEntityResponseCollection = {
  __typename?: 'RatsonProposalEntityResponseCollection';
  data: Array<RatsonProposalEntity>;
  meta: ResponseCollectionMeta;
};

export type RatsonProposalFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<RatsonProposalFiltersInput>>>;
  auto_generated?: InputMaybe<BooleanFilterInput>;
  covered_missions?: InputMaybe<ComponentNewCoveredMissionsFiltersInput>;
  covered_resources?: InputMaybe<ComponentNewCoveredResourcesFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  final_breakdown?: InputMaybe<JsonFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  kind?: InputMaybe<StringFilterInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  matbea?: InputMaybe<MatbeaFiltersInput>;
  match_score?: InputMaybe<FloatFilterInput>;
  negos?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<RatsonProposalFiltersInput>;
  open_mashaabims?: InputMaybe<OpenMashaabimFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RatsonProposalFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  proposer_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  ratson_willingness_entry?: InputMaybe<ComponentNewWillingnessEntriesFiltersInput>;
  sheirutpends?: InputMaybe<SheirutpendFiltersInput>;
  status_proposal?: InputMaybe<StringFilterInput>;
  tosplits?: InputMaybe<TosplitFiltersInput>;
  total_price?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  votes?: InputMaybe<VoteFiltersInput>;
};

export type RatsonProposalInput = {
  auto_generated?: InputMaybe<Scalars['Boolean']['input']>;
  covered_missions?: InputMaybe<Array<InputMaybe<ComponentNewCoveredMissionsInput>>>;
  covered_resources?: InputMaybe<Array<InputMaybe<ComponentNewCoveredResourcesInput>>>;
  final_breakdown?: InputMaybe<Scalars['JSON']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  kind?: InputMaybe<Enum_Ratsonproposal_Kind>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  matbea?: InputMaybe<Scalars['ID']['input']>;
  match_score?: InputMaybe<Scalars['Float']['input']>;
  negos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  proposer_users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  ratson_willingness_entry?: InputMaybe<Array<InputMaybe<ComponentNewWillingnessEntriesInput>>>;
  sheirutpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  status_proposal?: InputMaybe<Enum_Ratsonproposal_Status_Proposal>;
  tosplits?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  total_price?: InputMaybe<Scalars['Float']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type RatsonProposalRelationResponseCollection = {
  __typename?: 'RatsonProposalRelationResponseCollection';
  data: Array<RatsonProposalEntity>;
};

export type RatsonRelationResponseCollection = {
  __typename?: 'RatsonRelationResponseCollection';
  data: Array<RatsonEntity>;
};

export type RatsonShare = {
  __typename?: 'RatsonShare';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  halukas?: Maybe<HalukaRelationResponseCollection>;
  joinedAt?: Maybe<Scalars['DateTime']['output']>;
  leftAt?: Maybe<Scalars['DateTime']['output']>;
  matbea?: Maybe<MatbeaEntityResponse>;
  maxContribution?: Maybe<Scalars['Float']['output']>;
  notificationsOn?: Maybe<Scalars['Boolean']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  role?: Maybe<Enum_Ratsonshare_Role>;
  status_share?: Maybe<Enum_Ratsonshare_Status_Share>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type RatsonShareHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type RatsonShareEntity = {
  __typename?: 'RatsonShareEntity';
  attributes?: Maybe<RatsonShare>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type RatsonShareEntityResponse = {
  __typename?: 'RatsonShareEntityResponse';
  data?: Maybe<RatsonShareEntity>;
};

export type RatsonShareEntityResponseCollection = {
  __typename?: 'RatsonShareEntityResponseCollection';
  data: Array<RatsonShareEntity>;
  meta: ResponseCollectionMeta;
};

export type RatsonShareFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<RatsonShareFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  halukas?: InputMaybe<HalukaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  joinedAt?: InputMaybe<DateTimeFilterInput>;
  leftAt?: InputMaybe<DateTimeFilterInput>;
  matbea?: InputMaybe<MatbeaFiltersInput>;
  maxContribution?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<RatsonShareFiltersInput>;
  notificationsOn?: InputMaybe<BooleanFilterInput>;
  or?: InputMaybe<Array<InputMaybe<RatsonShareFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  role?: InputMaybe<StringFilterInput>;
  status_share?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type RatsonShareInput = {
  halukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  joinedAt?: InputMaybe<Scalars['DateTime']['input']>;
  leftAt?: InputMaybe<Scalars['DateTime']['input']>;
  matbea?: InputMaybe<Scalars['ID']['input']>;
  maxContribution?: InputMaybe<Scalars['Float']['input']>;
  notificationsOn?: InputMaybe<Scalars['Boolean']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  role?: InputMaybe<Enum_Ratsonshare_Role>;
  status_share?: InputMaybe<Enum_Ratsonshare_Status_Share>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type RatsonShareRelationResponseCollection = {
  __typename?: 'RatsonShareRelationResponseCollection';
  data: Array<RatsonShareEntity>;
};

export type ResponseCollectionMeta = {
  __typename?: 'ResponseCollectionMeta';
  pagination: Pagination;
};

export type Richtext = {
  __typename?: 'Richtext';
  bg?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  desc?: Maybe<Scalars['JSON']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<RichtextRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type RichtextLocalizationsArgs = {
  filters?: InputMaybe<RichtextFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type RichtextEntity = {
  __typename?: 'RichtextEntity';
  attributes?: Maybe<Richtext>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type RichtextEntityResponse = {
  __typename?: 'RichtextEntityResponse';
  data?: Maybe<RichtextEntity>;
};

export type RichtextEntityResponseCollection = {
  __typename?: 'RichtextEntityResponseCollection';
  data: Array<RichtextEntity>;
  meta: ResponseCollectionMeta;
};

export type RichtextFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<RichtextFiltersInput>>>;
  bg?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  desc?: InputMaybe<JsonFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<RichtextFiltersInput>;
  not?: InputMaybe<RichtextFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RichtextFiltersInput>>>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type RichtextInput = {
  bg?: InputMaybe<Scalars['String']['input']>;
  desc?: InputMaybe<Scalars['JSON']['input']>;
};

export type RichtextRelationResponseCollection = {
  __typename?: 'RichtextRelationResponseCollection';
  data: Array<RichtextEntity>;
};

export type Rikmash = {
  __typename?: 'Rikmash';
  agprice?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cyclesCount?: Maybe<Scalars['Int']['output']>;
  deliveries?: Maybe<Array<Maybe<ComponentProjectsDeliveries>>>;
  firstDeliveryAt?: Maybe<Scalars['DateTime']['output']>;
  haamadas?: Maybe<HaamadaRelationResponseCollection>;
  hm?: Maybe<Scalars['Float']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Rikmash_Kindof>;
  lastDeliveryAt?: Maybe<Scalars['DateTime']['output']>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quantityDelivered?: Maybe<Scalars['Float']['output']>;
  sp?: Maybe<SpEntityResponse>;
  spnot?: Maybe<Scalars['String']['output']>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualef?: Maybe<Scalars['DateTime']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  total?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type RikmashDeliveriesArgs = {
  filters?: InputMaybe<ComponentProjectsDeliveriesFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RikmashHaamadasArgs = {
  filters?: InputMaybe<HaamadaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RikmashMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type RikmashEntity = {
  __typename?: 'RikmashEntity';
  attributes?: Maybe<Rikmash>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type RikmashEntityResponse = {
  __typename?: 'RikmashEntityResponse';
  data?: Maybe<RikmashEntity>;
};

export type RikmashEntityResponseCollection = {
  __typename?: 'RikmashEntityResponseCollection';
  data: Array<RikmashEntity>;
  meta: ResponseCollectionMeta;
};

export type RikmashFiltersInput = {
  agprice?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<RikmashFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  cyclesCount?: InputMaybe<IntFilterInput>;
  deliveries?: InputMaybe<ComponentProjectsDeliveriesFiltersInput>;
  firstDeliveryAt?: InputMaybe<DateTimeFilterInput>;
  haamadas?: InputMaybe<HaamadaFiltersInput>;
  hm?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  lastDeliveryAt?: InputMaybe<DateTimeFilterInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  mashabetahalich?: InputMaybe<MashabetahalichFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<RikmashFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RikmashFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quantityDelivered?: InputMaybe<FloatFilterInput>;
  sp?: InputMaybe<SpFiltersInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualef?: InputMaybe<DateTimeFilterInput>;
  summary?: InputMaybe<StringFilterInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type RikmashInput = {
  agprice?: InputMaybe<Scalars['Float']['input']>;
  cyclesCount?: InputMaybe<Scalars['Int']['input']>;
  deliveries?: InputMaybe<Array<InputMaybe<ComponentProjectsDeliveriesInput>>>;
  firstDeliveryAt?: InputMaybe<Scalars['DateTime']['input']>;
  haamadas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Rikmash_Kindof>;
  lastDeliveryAt?: InputMaybe<Scalars['DateTime']['input']>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashabetahalich?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quantityDelivered?: InputMaybe<Scalars['Float']['input']>;
  sp?: InputMaybe<Scalars['ID']['input']>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  sqadualef?: InputMaybe<Scalars['DateTime']['input']>;
  summary?: InputMaybe<Scalars['String']['input']>;
  total?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type RikmashRelationResponseCollection = {
  __typename?: 'RikmashRelationResponseCollection';
  data: Array<RikmashEntity>;
};

export type Sale = {
  __typename?: 'Sale';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  date?: Maybe<Scalars['DateTime']['output']>;
  finishDate?: Maybe<Scalars['DateTime']['output']>;
  in?: Maybe<Scalars['Float']['output']>;
  isMonterActive?: Maybe<Scalars['Boolean']['output']>;
  isSiteShareIncome?: Maybe<Scalars['Boolean']['output']>;
  matanot?: Maybe<MatanotEntityResponse>;
  monters?: Maybe<MonterRelationResponseCollection>;
  note?: Maybe<Scalars['String']['output']>;
  pending?: Maybe<Scalars['Boolean']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  source_project?: Maybe<ProjectEntityResponse>;
  splited: Scalars['Boolean']['output'];
  startDate?: Maybe<Scalars['DateTime']['output']>;
  tosplits?: Maybe<TosplitRelationResponseCollection>;
  unit?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type SaleMontersArgs = {
  filters?: InputMaybe<MonterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SaleSheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SaleTosplitsArgs = {
  filters?: InputMaybe<TosplitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SaleEntity = {
  __typename?: 'SaleEntity';
  attributes?: Maybe<Sale>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SaleEntityResponse = {
  __typename?: 'SaleEntityResponse';
  data?: Maybe<SaleEntity>;
};

export type SaleEntityResponseCollection = {
  __typename?: 'SaleEntityResponseCollection';
  data: Array<SaleEntity>;
  meta: ResponseCollectionMeta;
};

export type SaleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SaleFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  date?: InputMaybe<DateTimeFilterInput>;
  finishDate?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  in?: InputMaybe<FloatFilterInput>;
  isMonterActive?: InputMaybe<BooleanFilterInput>;
  isSiteShareIncome?: InputMaybe<BooleanFilterInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  monters?: InputMaybe<MonterFiltersInput>;
  not?: InputMaybe<SaleFiltersInput>;
  note?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<SaleFiltersInput>>>;
  pending?: InputMaybe<BooleanFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  source_project?: InputMaybe<ProjectFiltersInput>;
  splited?: InputMaybe<BooleanFilterInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  tosplits?: InputMaybe<TosplitFiltersInput>;
  unit?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type SaleInput = {
  date?: InputMaybe<Scalars['DateTime']['input']>;
  finishDate?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Scalars['Float']['input']>;
  isMonterActive?: InputMaybe<Scalars['Boolean']['input']>;
  isSiteShareIncome?: InputMaybe<Scalars['Boolean']['input']>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  monters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  note?: InputMaybe<Scalars['String']['input']>;
  pending?: InputMaybe<Scalars['Boolean']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  source_project?: InputMaybe<Scalars['ID']['input']>;
  splited?: InputMaybe<Scalars['Boolean']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  tosplits?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  unit?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type SaleRelationResponseCollection = {
  __typename?: 'SaleRelationResponseCollection';
  data: Array<SaleEntity>;
};

export type Seeder = {
  __typename?: 'Seeder';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  finnish?: Maybe<Scalars['DateTime']['output']>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  start?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type SeederEntity = {
  __typename?: 'SeederEntity';
  attributes?: Maybe<Seeder>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SeederEntityResponse = {
  __typename?: 'SeederEntityResponse';
  data?: Maybe<SeederEntity>;
};

export type SeederEntityResponseCollection = {
  __typename?: 'SeederEntityResponseCollection';
  data: Array<SeederEntity>;
  meta: ResponseCollectionMeta;
};

export type SeederFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SeederFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  finnish?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<SeederFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SeederFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  start?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type SeederInput = {
  finnish?: InputMaybe<Scalars['DateTime']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
};

export type SeederRelationResponseCollection = {
  __typename?: 'SeederRelationResponseCollection';
  data: Array<SeederEntity>;
};

export type Sheirut = {
  __typename?: 'Sheirut';
  archived?: Maybe<Scalars['Boolean']['output']>;
  askwants?: Maybe<AskwantRelationResponseCollection>;
  categories?: Maybe<CategoryRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  equaliSplited?: Maybe<Scalars['Boolean']['output']>;
  finnishDate?: Maybe<Scalars['DateTime']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  halukas?: Maybe<HalukaRelationResponseCollection>;
  iCanGetMonay?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  iGotIt?: Maybe<Scalars['Boolean']['output']>;
  iGotMoney?: Maybe<Array<Maybe<ComponentProjectsIGotMoney>>>;
  iTransferMoney?: Maybe<Scalars['Boolean']['output']>;
  iTransferedTo?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  isApruved?: Maybe<Scalars['Boolean']['output']>;
  isItOnlyOneInProject?: Maybe<Scalars['Boolean']['output']>;
  isSiteShareIncome?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<SheirutRelationResponseCollection>;
  matanot?: Maybe<MatanotEntityResponse>;
  moneyTransfered?: Maybe<Scalars['Boolean']['output']>;
  monters?: Maybe<MonterRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  oneTime?: Maybe<Scalars['Boolean']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  productExepted?: Maybe<Scalars['Boolean']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  quant?: Maybe<Scalars['Float']['output']>;
  sales?: Maybe<SaleRelationResponseCollection>;
  sheirut_fulfillments?: Maybe<SheirutFulfillmentRelationResponseCollection>;
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
  site_share_contributions?: Maybe<SiteShareContributionRelationResponseCollection>;
  source_project?: Maybe<ProjectEntityResponse>;
  source_proposals?: Maybe<RatsonRelationResponseCollection>;
  source_tosplit?: Maybe<TosplitEntityResponse>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  total?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  wants?: Maybe<WantRelationResponseCollection>;
  weFinnish?: Maybe<VoteRelationResponseCollection>;
};


export type SheirutAskwantsArgs = {
  filters?: InputMaybe<AskwantFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutCategoriesArgs = {
  filters?: InputMaybe<CategoryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutForumsArgs = {
  filters?: InputMaybe<ForumFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutICanGetMonayArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutIGotMoneyArgs = {
  filters?: InputMaybe<ComponentProjectsIGotMoneyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutITransferedToArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutLocalizationsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutMontersArgs = {
  filters?: InputMaybe<MonterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutSalesArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutSheirut_FulfillmentsArgs = {
  filters?: InputMaybe<SheirutFulfillmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutSite_Share_ContributionsArgs = {
  filters?: InputMaybe<SiteShareContributionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutSource_ProposalsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutUsers_Permissions_UsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutWantsArgs = {
  filters?: InputMaybe<WantFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutWeFinnishArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SheirutEntity = {
  __typename?: 'SheirutEntity';
  attributes?: Maybe<Sheirut>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SheirutEntityResponse = {
  __typename?: 'SheirutEntityResponse';
  data?: Maybe<SheirutEntity>;
};

export type SheirutEntityResponseCollection = {
  __typename?: 'SheirutEntityResponseCollection';
  data: Array<SheirutEntity>;
  meta: ResponseCollectionMeta;
};

export type SheirutFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SheirutFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  askwants?: InputMaybe<AskwantFiltersInput>;
  categories?: InputMaybe<CategoryFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  equaliSplited?: InputMaybe<BooleanFilterInput>;
  finnishDate?: InputMaybe<DateTimeFilterInput>;
  forums?: InputMaybe<ForumFiltersInput>;
  halukas?: InputMaybe<HalukaFiltersInput>;
  iCanGetMonay?: InputMaybe<UsersPermissionsUserFiltersInput>;
  iGotIt?: InputMaybe<BooleanFilterInput>;
  iGotMoney?: InputMaybe<ComponentProjectsIGotMoneyFiltersInput>;
  iTransferMoney?: InputMaybe<BooleanFilterInput>;
  iTransferedTo?: InputMaybe<UsersPermissionsUserFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isApruved?: InputMaybe<BooleanFilterInput>;
  isItOnlyOneInProject?: InputMaybe<BooleanFilterInput>;
  isSiteShareIncome?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<SheirutFiltersInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  moneyTransfered?: InputMaybe<BooleanFilterInput>;
  monters?: InputMaybe<MonterFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<SheirutFiltersInput>;
  oneTime?: InputMaybe<BooleanFilterInput>;
  or?: InputMaybe<Array<InputMaybe<SheirutFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  productExepted?: InputMaybe<BooleanFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  quant?: InputMaybe<FloatFilterInput>;
  sales?: InputMaybe<SaleFiltersInput>;
  sheirut_fulfillments?: InputMaybe<SheirutFulfillmentFiltersInput>;
  sheirutpend?: InputMaybe<SheirutpendFiltersInput>;
  site_share_contributions?: InputMaybe<SiteShareContributionFiltersInput>;
  source_project?: InputMaybe<ProjectFiltersInput>;
  source_proposals?: InputMaybe<RatsonFiltersInput>;
  source_tosplit?: InputMaybe<TosplitFiltersInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  wants?: InputMaybe<WantFiltersInput>;
  weFinnish?: InputMaybe<VoteFiltersInput>;
};

export type SheirutFulfillment = {
  __typename?: 'SheirutFulfillment';
  agreedPrice?: Maybe<Scalars['Float']['output']>;
  cmdm?: Maybe<Array<Maybe<ComponentProjectsConsumedMashabetahalichDeliveries>>>;
  consumedMissionHours?: Maybe<Array<Maybe<ComponentProjectsConsumedMissionHours>>>;
  consumedOpenMU?: Maybe<Array<Maybe<ComponentProjectsConsumedOpenMu>>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdMaaps?: Maybe<MaapEntityResponse>;
  createdMissions?: Maybe<MesimabetahalichEntityResponse>;
  createdPmashes?: Maybe<PmashEntityResponse>;
  matanot?: Maybe<MatanotEntityResponse>;
  process?: Maybe<PartofEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quantity?: Maybe<Scalars['Float']['output']>;
  sheirut?: Maybe<SheirutEntityResponse>;
  status_process?: Maybe<Enum_Sheirutfulfillment_Status_Process>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type SheirutFulfillmentCmdmArgs = {
  filters?: InputMaybe<ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutFulfillmentConsumedMissionHoursArgs = {
  filters?: InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutFulfillmentConsumedOpenMuArgs = {
  filters?: InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SheirutFulfillmentEntity = {
  __typename?: 'SheirutFulfillmentEntity';
  attributes?: Maybe<SheirutFulfillment>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SheirutFulfillmentEntityResponse = {
  __typename?: 'SheirutFulfillmentEntityResponse';
  data?: Maybe<SheirutFulfillmentEntity>;
};

export type SheirutFulfillmentEntityResponseCollection = {
  __typename?: 'SheirutFulfillmentEntityResponseCollection';
  data: Array<SheirutFulfillmentEntity>;
  meta: ResponseCollectionMeta;
};

export type SheirutFulfillmentFiltersInput = {
  agreedPrice?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<SheirutFulfillmentFiltersInput>>>;
  cmdm?: InputMaybe<ComponentProjectsConsumedMashabetahalichDeliveriesFiltersInput>;
  consumedMissionHours?: InputMaybe<ComponentProjectsConsumedMissionHoursFiltersInput>;
  consumedOpenMU?: InputMaybe<ComponentProjectsConsumedOpenMuFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  createdMaaps?: InputMaybe<MaapFiltersInput>;
  createdMissions?: InputMaybe<MesimabetahalichFiltersInput>;
  createdPmashes?: InputMaybe<PmashFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  not?: InputMaybe<SheirutFulfillmentFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SheirutFulfillmentFiltersInput>>>;
  process?: InputMaybe<PartofFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quantity?: InputMaybe<FloatFilterInput>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  status_process?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type SheirutFulfillmentInput = {
  agreedPrice?: InputMaybe<Scalars['Float']['input']>;
  cmdm?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMashabetahalichDeliveriesInput>>>;
  consumedMissionHours?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedMissionHoursInput>>>;
  consumedOpenMU?: InputMaybe<Array<InputMaybe<ComponentProjectsConsumedOpenMuInput>>>;
  createdMaaps?: InputMaybe<Scalars['ID']['input']>;
  createdMissions?: InputMaybe<Scalars['ID']['input']>;
  createdPmashes?: InputMaybe<Scalars['ID']['input']>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  process?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  status_process?: InputMaybe<Enum_Sheirutfulfillment_Status_Process>;
};

export type SheirutFulfillmentRelationResponseCollection = {
  __typename?: 'SheirutFulfillmentRelationResponseCollection';
  data: Array<SheirutFulfillmentEntity>;
};

export type SheirutInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  askwants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  equaliSplited?: InputMaybe<Scalars['Boolean']['input']>;
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  halukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  iCanGetMonay?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  iGotIt?: InputMaybe<Scalars['Boolean']['input']>;
  iGotMoney?: InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyInput>>>;
  iTransferMoney?: InputMaybe<Scalars['Boolean']['input']>;
  iTransferedTo?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  isApruved?: InputMaybe<Scalars['Boolean']['input']>;
  isItOnlyOneInProject?: InputMaybe<Scalars['Boolean']['input']>;
  isSiteShareIncome?: InputMaybe<Scalars['Boolean']['input']>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  moneyTransfered?: InputMaybe<Scalars['Boolean']['input']>;
  monters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  oneTime?: InputMaybe<Scalars['Boolean']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  productExepted?: InputMaybe<Scalars['Boolean']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  quant?: InputMaybe<Scalars['Float']['input']>;
  sales?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirut_fulfillments?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutpend?: InputMaybe<Scalars['ID']['input']>;
  site_share_contributions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  source_project?: InputMaybe<Scalars['ID']['input']>;
  source_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  source_tosplit?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  total?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  wants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  weFinnish?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type SheirutRelationResponseCollection = {
  __typename?: 'SheirutRelationResponseCollection';
  data: Array<SheirutEntity>;
};

export type Sheirutnego = {
  __typename?: 'Sheirutnego';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  finnishDate?: Maybe<Scalars['DateTime']['output']>;
  isOriginal?: Maybe<Scalars['Boolean']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quant?: Maybe<Scalars['Float']['output']>;
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type SheirutnegoVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SheirutnegoEntity = {
  __typename?: 'SheirutnegoEntity';
  attributes?: Maybe<Sheirutnego>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SheirutnegoEntityResponse = {
  __typename?: 'SheirutnegoEntityResponse';
  data?: Maybe<SheirutnegoEntity>;
};

export type SheirutnegoEntityResponseCollection = {
  __typename?: 'SheirutnegoEntityResponseCollection';
  data: Array<SheirutnegoEntity>;
  meta: ResponseCollectionMeta;
};

export type SheirutnegoFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SheirutnegoFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  finnishDate?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isOriginal?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<SheirutnegoFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SheirutnegoFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quant?: InputMaybe<FloatFilterInput>;
  sheirutpend?: InputMaybe<SheirutpendFiltersInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type SheirutnegoInput = {
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  isOriginal?: InputMaybe<Scalars['Boolean']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quant?: InputMaybe<Scalars['Float']['input']>;
  sheirutpend?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type SheirutnegoRelationResponseCollection = {
  __typename?: 'SheirutnegoRelationResponseCollection';
  data: Array<SheirutnegoEntity>;
};

export type Sheirutpend = {
  __typename?: 'Sheirutpend';
  appruved?: Maybe<Scalars['Boolean']['output']>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  finnishDate?: Maybe<Scalars['DateTime']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<SheirutpendRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  quant?: Maybe<Scalars['Float']['output']>;
  ratson_proposal?: Maybe<RatsonProposalEntityResponse>;
  sheirut?: Maybe<SheirutEntityResponse>;
  sheirutnegos?: Maybe<SheirutnegoRelationResponseCollection>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  total?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  votes?: Maybe<VoteRelationResponseCollection>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type SheirutpendLocalizationsArgs = {
  filters?: InputMaybe<SheirutpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutpendMatanotsArgs = {
  filters?: InputMaybe<MatanotFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutpendSheirutnegosArgs = {
  filters?: InputMaybe<SheirutnegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutpendVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SheirutpendVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SheirutpendEntity = {
  __typename?: 'SheirutpendEntity';
  attributes?: Maybe<Sheirutpend>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SheirutpendEntityResponse = {
  __typename?: 'SheirutpendEntityResponse';
  data?: Maybe<SheirutpendEntity>;
};

export type SheirutpendEntityResponseCollection = {
  __typename?: 'SheirutpendEntityResponseCollection';
  data: Array<SheirutpendEntity>;
  meta: ResponseCollectionMeta;
};

export type SheirutpendFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SheirutpendFiltersInput>>>;
  appruved?: InputMaybe<BooleanFilterInput>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  finnishDate?: InputMaybe<DateTimeFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<SheirutpendFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  not?: InputMaybe<SheirutpendFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SheirutpendFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  quant?: InputMaybe<FloatFilterInput>;
  ratson_proposal?: InputMaybe<RatsonProposalFiltersInput>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  sheirutnegos?: InputMaybe<SheirutnegoFiltersInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  votes?: InputMaybe<VoteFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type SheirutpendInput = {
  appruved?: InputMaybe<Scalars['Boolean']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  quant?: InputMaybe<Scalars['Float']['input']>;
  ratson_proposal?: InputMaybe<Scalars['ID']['input']>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  sheirutnegos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  total?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
};

export type SheirutpendRelationResponseCollection = {
  __typename?: 'SheirutpendRelationResponseCollection';
  data: Array<SheirutpendEntity>;
};

export type Sidur = {
  __typename?: 'Sidur';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  lemi?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type SidurEntity = {
  __typename?: 'SidurEntity';
  attributes?: Maybe<Sidur>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SidurEntityResponse = {
  __typename?: 'SidurEntityResponse';
  data?: Maybe<SidurEntity>;
};

export type SidurEntityResponseCollection = {
  __typename?: 'SidurEntityResponseCollection';
  data: Array<SidurEntity>;
  meta: ResponseCollectionMeta;
};

export type SidurFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SidurFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  lemi?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<SidurFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SidurFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type SidurInput = {
  lemi?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type SiteReport = {
  __typename?: 'SiteReport';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  lang?: Maybe<Scalars['String']['output']>;
  page?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Enum_Sitereport_Status>;
  type?: Maybe<Enum_Sitereport_Type>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userEmail?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
  userName?: Maybe<Scalars['String']['output']>;
};

export type SiteReportEntity = {
  __typename?: 'SiteReportEntity';
  attributes?: Maybe<SiteReport>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SiteReportEntityResponse = {
  __typename?: 'SiteReportEntityResponse';
  data?: Maybe<SiteReportEntity>;
};

export type SiteReportEntityResponseCollection = {
  __typename?: 'SiteReportEntityResponseCollection';
  data: Array<SiteReportEntity>;
  meta: ResponseCollectionMeta;
};

export type SiteReportFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SiteReportFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  lang?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<SiteReportFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SiteReportFiltersInput>>>;
  page?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  status?: InputMaybe<StringFilterInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  userEmail?: InputMaybe<StringFilterInput>;
  userId?: InputMaybe<StringFilterInput>;
  userName?: InputMaybe<StringFilterInput>;
};

export type SiteReportInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  lang?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<Enum_Sitereport_Status>;
  type?: InputMaybe<Enum_Sitereport_Type>;
  userEmail?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  userName?: InputMaybe<Scalars['String']['input']>;
};

export type SiteShareContribution = {
  __typename?: 'SiteShareContribution';
  amount?: Maybe<Scalars['Float']['output']>;
  basisAmount?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  des_status?: Maybe<Enum_Sitesharecontribution_Des_Status>;
  direction?: Maybe<Enum_Sitesharecontribution_Direction>;
  haluka?: Maybe<HalukaEntityResponse>;
  matbea?: Maybe<MatbeaEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  proposedAmount?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  recive_project?: Maybe<ProjectEntityResponse>;
  sheirut?: Maybe<SheirutEntityResponse>;
  tosplit?: Maybe<TosplitEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type SiteShareContributionEntity = {
  __typename?: 'SiteShareContributionEntity';
  attributes?: Maybe<SiteShareContribution>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SiteShareContributionEntityResponse = {
  __typename?: 'SiteShareContributionEntityResponse';
  data?: Maybe<SiteShareContributionEntity>;
};

export type SiteShareContributionEntityResponseCollection = {
  __typename?: 'SiteShareContributionEntityResponseCollection';
  data: Array<SiteShareContributionEntity>;
  meta: ResponseCollectionMeta;
};

export type SiteShareContributionFiltersInput = {
  amount?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<SiteShareContributionFiltersInput>>>;
  basisAmount?: InputMaybe<FloatFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  des_status?: InputMaybe<StringFilterInput>;
  direction?: InputMaybe<StringFilterInput>;
  haluka?: InputMaybe<HalukaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  matbea?: InputMaybe<MatbeaFiltersInput>;
  not?: InputMaybe<SiteShareContributionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SiteShareContributionFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  proposedAmount?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  reason?: InputMaybe<StringFilterInput>;
  recive_project?: InputMaybe<ProjectFiltersInput>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  tosplit?: InputMaybe<TosplitFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type SiteShareContributionInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  basisAmount?: InputMaybe<Scalars['Float']['input']>;
  des_status?: InputMaybe<Enum_Sitesharecontribution_Des_Status>;
  direction?: InputMaybe<Enum_Sitesharecontribution_Direction>;
  haluka?: InputMaybe<Scalars['ID']['input']>;
  matbea?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  proposedAmount?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  recive_project?: InputMaybe<Scalars['ID']['input']>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  tosplit?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type SiteShareContributionRelationResponseCollection = {
  __typename?: 'SiteShareContributionRelationResponseCollection';
  data: Array<SiteShareContributionEntity>;
};

export type Skill = {
  __typename?: 'Skill';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<SkillRelationResponseCollection>;
  missions?: Maybe<MissionRelationResponseCollection>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  skillName: Scalars['String']['output'];
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type SkillLocalizationsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SkillMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SkillNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SkillOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SkillPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SkillTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SkillUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SkillEntity = {
  __typename?: 'SkillEntity';
  attributes?: Maybe<Skill>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SkillEntityResponse = {
  __typename?: 'SkillEntityResponse';
  data?: Maybe<SkillEntity>;
};

export type SkillEntityResponseCollection = {
  __typename?: 'SkillEntityResponseCollection';
  data: Array<SkillEntity>;
  meta: ResponseCollectionMeta;
};

export type SkillFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SkillFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<SkillFiltersInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  not?: InputMaybe<SkillFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SkillFiltersInput>>>;
  pendms?: InputMaybe<PendmFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  skillName?: InputMaybe<StringFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type SkillInput = {
  descrip?: InputMaybe<Scalars['String']['input']>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  skillName?: InputMaybe<Scalars['String']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type SkillRelationResponseCollection = {
  __typename?: 'SkillRelationResponseCollection';
  data: Array<SkillEntity>;
};

export type Solution = {
  __typename?: 'Solution';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deas?: Maybe<DeaRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type SolutionDeasArgs = {
  filters?: InputMaybe<DeaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SolutionEntity = {
  __typename?: 'SolutionEntity';
  attributes?: Maybe<Solution>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SolutionEntityResponse = {
  __typename?: 'SolutionEntityResponse';
  data?: Maybe<SolutionEntity>;
};

export type SolutionEntityResponseCollection = {
  __typename?: 'SolutionEntityResponseCollection';
  data: Array<SolutionEntity>;
  meta: ResponseCollectionMeta;
};

export type SolutionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SolutionFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  deas?: InputMaybe<DeaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<SolutionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SolutionFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type SolutionInput = {
  deas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type SolutionRelationResponseCollection = {
  __typename?: 'SolutionRelationResponseCollection';
  data: Array<SolutionEntity>;
};

export type Sp = {
  __typename?: 'Sp';
  archived: Scalars['Boolean']['output'];
  askms?: Maybe<AskmRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  declinedm?: Maybe<OpenMashaabimEntityResponse>;
  descrip?: Maybe<Scalars['String']['output']>;
  fdate?: Maybe<Scalars['DateTime']['output']>;
  kindOf?: Maybe<Enum_Sp_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<SpRelationResponseCollection>;
  location?: Maybe<ComponentNewLocation>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  mode?: Maybe<ModeEntityResponse>;
  myp?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  openask?: Maybe<OpenMashaabimEntityResponse>;
  panui?: Maybe<Scalars['Boolean']['output']>;
  pics?: Maybe<UploadFileRelationResponseCollection>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  rikmash?: Maybe<RikmashEntityResponse>;
  sdate?: Maybe<Scalars['DateTime']['output']>;
  splited?: Maybe<Scalars['Boolean']['output']>;
  spnot?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  yat?: Maybe<YatEntityResponse>;
};


export type SpAskmsArgs = {
  filters?: InputMaybe<AskmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SpLocalizationsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SpMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SpPicsArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SpEntity = {
  __typename?: 'SpEntity';
  attributes?: Maybe<Sp>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type SpEntityResponse = {
  __typename?: 'SpEntityResponse';
  data?: Maybe<SpEntity>;
};

export type SpEntityResponseCollection = {
  __typename?: 'SpEntityResponseCollection';
  data: Array<SpEntity>;
  meta: ResponseCollectionMeta;
};

export type SpFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SpFiltersInput>>>;
  archived?: InputMaybe<BooleanFilterInput>;
  askms?: InputMaybe<AskmFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  declinedm?: InputMaybe<OpenMashaabimFiltersInput>;
  descrip?: InputMaybe<StringFilterInput>;
  fdate?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<SpFiltersInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  mashaabim?: InputMaybe<MashaabimFiltersInput>;
  mode?: InputMaybe<ModeFiltersInput>;
  myp?: InputMaybe<FloatFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<SpFiltersInput>;
  openask?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SpFiltersInput>>>;
  panui?: InputMaybe<BooleanFilterInput>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  rikmash?: InputMaybe<RikmashFiltersInput>;
  sdate?: InputMaybe<DateTimeFilterInput>;
  splited?: InputMaybe<BooleanFilterInput>;
  spnot?: InputMaybe<StringFilterInput>;
  unit?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  yat?: InputMaybe<YatFiltersInput>;
};

export type SpInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  askms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  declinedm?: InputMaybe<Scalars['ID']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  fdate?: InputMaybe<Scalars['DateTime']['input']>;
  kindOf?: InputMaybe<Enum_Sp_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<ComponentNewLocationInput>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashaabim?: InputMaybe<Scalars['ID']['input']>;
  mode?: InputMaybe<Scalars['ID']['input']>;
  myp?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  openask?: InputMaybe<Scalars['ID']['input']>;
  panui?: InputMaybe<Scalars['Boolean']['input']>;
  pics?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  rikmash?: InputMaybe<Scalars['ID']['input']>;
  sdate?: InputMaybe<Scalars['DateTime']['input']>;
  splited?: InputMaybe<Scalars['Boolean']['input']>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  unit?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  yat?: InputMaybe<Scalars['ID']['input']>;
};

export type SpRelationResponseCollection = {
  __typename?: 'SpRelationResponseCollection';
  data: Array<SpEntity>;
};

export type StringFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contains?: InputMaybe<Scalars['String']['input']>;
  containsi?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  eq?: InputMaybe<Scalars['String']['input']>;
  eqi?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  nei?: InputMaybe<Scalars['String']['input']>;
  not?: InputMaybe<StringFilterInput>;
  notContains?: InputMaybe<Scalars['String']['input']>;
  notContainsi?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export type Tafkidim = {
  __typename?: 'Tafkidim';
  acts?: Maybe<ActRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  finnished_missions?: Maybe<FinnishedMissionRelationResponseCollection>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<TafkidimRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  missions?: Maybe<MissionRelationResponseCollection>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  roleDescription: Scalars['String']['output'];
  skills?: Maybe<SkillRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type TafkidimActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimFinnished_MissionsArgs = {
  filters?: InputMaybe<FinnishedMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimLocalizationsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimSkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TafkidimUsers_Permissions_UsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TafkidimEntity = {
  __typename?: 'TafkidimEntity';
  attributes?: Maybe<Tafkidim>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type TafkidimEntityResponse = {
  __typename?: 'TafkidimEntityResponse';
  data?: Maybe<TafkidimEntity>;
};

export type TafkidimEntityResponseCollection = {
  __typename?: 'TafkidimEntityResponseCollection';
  data: Array<TafkidimEntity>;
  meta: ResponseCollectionMeta;
};

export type TafkidimFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<TafkidimFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  finnished_missions?: InputMaybe<FinnishedMissionFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<TafkidimFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  not?: InputMaybe<TafkidimFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<TafkidimFiltersInput>>>;
  pendms?: InputMaybe<PendmFiltersInput>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  roleDescription?: InputMaybe<StringFilterInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type TafkidimInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  finnished_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  roleDescription?: InputMaybe<Scalars['String']['input']>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  users_permissions_users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type TafkidimRelationResponseCollection = {
  __typename?: 'TafkidimRelationResponseCollection';
  data: Array<TafkidimEntity>;
};

export type Tikunolam = {
  __typename?: 'Tikunolam';
  amort?: Maybe<Scalars['String']['output']>;
  amortf?: Maybe<Scalars['String']['output']>;
  amorth?: Maybe<Scalars['String']['output']>;
  amorts?: Maybe<Scalars['String']['output']>;
  amortt?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<TikunolamRelationResponseCollection>;
  more?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type TikunolamLocalizationsArgs = {
  filters?: InputMaybe<TikunolamFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TikunolamEntity = {
  __typename?: 'TikunolamEntity';
  attributes?: Maybe<Tikunolam>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type TikunolamEntityResponse = {
  __typename?: 'TikunolamEntityResponse';
  data?: Maybe<TikunolamEntity>;
};

export type TikunolamEntityResponseCollection = {
  __typename?: 'TikunolamEntityResponseCollection';
  data: Array<TikunolamEntity>;
  meta: ResponseCollectionMeta;
};

export type TikunolamFiltersInput = {
  amort?: InputMaybe<StringFilterInput>;
  amortf?: InputMaybe<StringFilterInput>;
  amorth?: InputMaybe<StringFilterInput>;
  amorts?: InputMaybe<StringFilterInput>;
  amortt?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<TikunolamFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  email?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<TikunolamFiltersInput>;
  more?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<TikunolamFiltersInput>;
  notes?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<TikunolamFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type TikunolamInput = {
  amort?: InputMaybe<Scalars['String']['input']>;
  amortf?: InputMaybe<Scalars['String']['input']>;
  amorth?: InputMaybe<Scalars['String']['input']>;
  amorts?: InputMaybe<Scalars['String']['input']>;
  amortt?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  more?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type TikunolamRelationResponseCollection = {
  __typename?: 'TikunolamRelationResponseCollection';
  data: Array<TikunolamEntity>;
};

export type Timegrama = {
  __typename?: 'Timegrama';
  act?: Maybe<ActEntityResponse>;
  actt?: Maybe<ActtEntityResponse>;
  ask?: Maybe<AskEntityResponse>;
  askm?: Maybe<AskmEntityResponse>;
  askwant?: Maybe<AskwantEntityResponse>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  date?: Maybe<Scalars['DateTime']['output']>;
  decision?: Maybe<DecisionEntityResponse>;
  done?: Maybe<Scalars['Boolean']['output']>;
  finiapruval?: Maybe<FiniapruvalEntityResponse>;
  maap?: Maybe<MaapEntityResponse>;
  matanotpend?: Maybe<MatanotpendEntityResponse>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  pendm?: Maybe<PendmEntityResponse>;
  pmash?: Maybe<PmashEntityResponse>;
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
  timer?: Maybe<TimerEntityResponse>;
  tosplit?: Maybe<TosplitEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  whatami?: Maybe<Scalars['String']['output']>;
};

export type TimegramaEntity = {
  __typename?: 'TimegramaEntity';
  attributes?: Maybe<Timegrama>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type TimegramaEntityResponse = {
  __typename?: 'TimegramaEntityResponse';
  data?: Maybe<TimegramaEntity>;
};

export type TimegramaEntityResponseCollection = {
  __typename?: 'TimegramaEntityResponseCollection';
  data: Array<TimegramaEntity>;
  meta: ResponseCollectionMeta;
};

export type TimegramaFiltersInput = {
  act?: InputMaybe<ActFiltersInput>;
  actt?: InputMaybe<ActtFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<TimegramaFiltersInput>>>;
  ask?: InputMaybe<AskFiltersInput>;
  askm?: InputMaybe<AskmFiltersInput>;
  askwant?: InputMaybe<AskwantFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  date?: InputMaybe<DateTimeFilterInput>;
  decision?: InputMaybe<DecisionFiltersInput>;
  done?: InputMaybe<BooleanFilterInput>;
  finiapruval?: InputMaybe<FiniapruvalFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  maap?: InputMaybe<MaapFiltersInput>;
  matanotpend?: InputMaybe<MatanotpendFiltersInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<TimegramaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<TimegramaFiltersInput>>>;
  pendm?: InputMaybe<PendmFiltersInput>;
  pmash?: InputMaybe<PmashFiltersInput>;
  sheirutpend?: InputMaybe<SheirutpendFiltersInput>;
  timer?: InputMaybe<TimerFiltersInput>;
  tosplit?: InputMaybe<TosplitFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  whatami?: InputMaybe<StringFilterInput>;
};

export type TimegramaInput = {
  act?: InputMaybe<Scalars['ID']['input']>;
  actt?: InputMaybe<Scalars['ID']['input']>;
  ask?: InputMaybe<Scalars['ID']['input']>;
  askm?: InputMaybe<Scalars['ID']['input']>;
  askwant?: InputMaybe<Scalars['ID']['input']>;
  date?: InputMaybe<Scalars['DateTime']['input']>;
  decision?: InputMaybe<Scalars['ID']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  finiapruval?: InputMaybe<Scalars['ID']['input']>;
  maap?: InputMaybe<Scalars['ID']['input']>;
  matanotpend?: InputMaybe<Scalars['ID']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  pendm?: InputMaybe<Scalars['ID']['input']>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  sheirutpend?: InputMaybe<Scalars['ID']['input']>;
  timer?: InputMaybe<Scalars['ID']['input']>;
  tosplit?: InputMaybe<Scalars['ID']['input']>;
  whatami?: InputMaybe<Scalars['String']['input']>;
};

export type TimegramaRelationResponseCollection = {
  __typename?: 'TimegramaRelationResponseCollection';
  data: Array<TimegramaEntity>;
};

export type Timer = {
  __typename?: 'Timer';
  activeMesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  acts?: Maybe<ActRelationResponseCollection>;
  appruved?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  finiapruvals?: Maybe<FiniapruvalRelationResponseCollection>;
  finnish?: Maybe<Scalars['DateTime']['output']>;
  forApruve?: Maybe<Scalars['Boolean']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<TimerRelationResponseCollection>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  saveFiles?: Maybe<UploadFileRelationResponseCollection>;
  saveLinks?: Maybe<Scalars['String']['output']>;
  saveText?: Maybe<Scalars['String']['output']>;
  saved?: Maybe<Scalars['Boolean']['output']>;
  start?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  timers?: Maybe<Array<Maybe<ComponentNewTimes>>>;
  totalHours?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  votes?: Maybe<VoteRelationResponseCollection>;
};


export type TimerActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TimerFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TimerLocalizationsArgs = {
  filters?: InputMaybe<TimerFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TimerSaveFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TimerTimersArgs = {
  filters?: InputMaybe<ComponentNewTimesFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TimerVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TimerEntity = {
  __typename?: 'TimerEntity';
  attributes?: Maybe<Timer>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type TimerEntityResponse = {
  __typename?: 'TimerEntityResponse';
  data?: Maybe<TimerEntity>;
};

export type TimerEntityResponseCollection = {
  __typename?: 'TimerEntityResponseCollection';
  data: Array<TimerEntity>;
  meta: ResponseCollectionMeta;
};

export type TimerFiltersInput = {
  activeMesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  acts?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<TimerFiltersInput>>>;
  appruved?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  finiapruvals?: InputMaybe<FiniapruvalFiltersInput>;
  finnish?: InputMaybe<DateTimeFilterInput>;
  forApruve?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isActive?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<TimerFiltersInput>;
  mashabetahalich?: InputMaybe<MashabetahalichFiltersInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<TimerFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<TimerFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  saveLinks?: InputMaybe<StringFilterInput>;
  saveText?: InputMaybe<StringFilterInput>;
  saved?: InputMaybe<BooleanFilterInput>;
  start?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  timers?: InputMaybe<ComponentNewTimesFiltersInput>;
  totalHours?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  votes?: InputMaybe<VoteFiltersInput>;
};

export type TimerInput = {
  activeMesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  appruved?: InputMaybe<Scalars['Boolean']['input']>;
  finiapruvals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  finnish?: InputMaybe<Scalars['DateTime']['input']>;
  forApruve?: InputMaybe<Scalars['Boolean']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  mashabetahalich?: InputMaybe<Scalars['ID']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  saveFiles?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  saveLinks?: InputMaybe<Scalars['String']['input']>;
  saveText?: InputMaybe<Scalars['String']['input']>;
  saved?: InputMaybe<Scalars['Boolean']['input']>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  timers?: InputMaybe<Array<InputMaybe<ComponentNewTimesInput>>>;
  totalHours?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type TimerRelationResponseCollection = {
  __typename?: 'TimerRelationResponseCollection';
  data: Array<TimerEntity>;
};

export type Tosplit = {
  __typename?: 'Tosplit';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  finished?: Maybe<Scalars['Boolean']['output']>;
  halukas?: Maybe<HalukaRelationResponseCollection>;
  hervachti?: Maybe<Array<Maybe<ComponentProjectsHervachti>>>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<TosplitRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  prectentage?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratson_proposal?: Maybe<RatsonProposalEntityResponse>;
  sales?: Maybe<SaleRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  siteShareHalukas?: Maybe<HalukaRelationResponseCollection>;
  site_share_contributions?: Maybe<SiteShareContributionRelationResponseCollection>;
  split_origin?: Maybe<Enum_Tosplit_Split_Origin>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  whynow?: Maybe<Scalars['String']['output']>;
};


export type TosplitHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TosplitHervachtiArgs = {
  filters?: InputMaybe<ComponentProjectsHervachtiFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TosplitLocalizationsArgs = {
  filters?: InputMaybe<TosplitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TosplitSalesArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TosplitSheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TosplitSiteShareHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TosplitSite_Share_ContributionsArgs = {
  filters?: InputMaybe<SiteShareContributionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TosplitVotsArgs = {
  filters?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TosplitEntity = {
  __typename?: 'TosplitEntity';
  attributes?: Maybe<Tosplit>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type TosplitEntityResponse = {
  __typename?: 'TosplitEntityResponse';
  data?: Maybe<TosplitEntity>;
};

export type TosplitEntityResponseCollection = {
  __typename?: 'TosplitEntityResponseCollection';
  data: Array<TosplitEntity>;
  meta: ResponseCollectionMeta;
};

export type TosplitFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<TosplitFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  finished?: InputMaybe<BooleanFilterInput>;
  halukas?: InputMaybe<HalukaFiltersInput>;
  hervachti?: InputMaybe<ComponentProjectsHervachtiFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<TosplitFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<TosplitFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<TosplitFiltersInput>>>;
  prectentage?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratson_proposal?: InputMaybe<RatsonProposalFiltersInput>;
  sales?: InputMaybe<SaleFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  siteShareHalukas?: InputMaybe<HalukaFiltersInput>;
  site_share_contributions?: InputMaybe<SiteShareContributionFiltersInput>;
  split_origin?: InputMaybe<StringFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  whynow?: InputMaybe<StringFilterInput>;
};

export type TosplitInput = {
  finished?: InputMaybe<Scalars['Boolean']['input']>;
  halukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hervachti?: InputMaybe<Array<InputMaybe<ComponentProjectsHervachtiInput>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  prectentage?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratson_proposal?: InputMaybe<Scalars['ID']['input']>;
  sales?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  siteShareHalukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  site_share_contributions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  split_origin?: InputMaybe<Enum_Tosplit_Split_Origin>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  whynow?: InputMaybe<Scalars['String']['input']>;
};

export type TosplitRelationResponseCollection = {
  __typename?: 'TosplitRelationResponseCollection';
  data: Array<TosplitEntity>;
};

export type Translate = {
  __typename?: 'Translate';
  amort?: Maybe<Scalars['String']['output']>;
  amortf?: Maybe<Scalars['String']['output']>;
  amorth?: Maybe<Scalars['String']['output']>;
  amorts?: Maybe<Scalars['String']['output']>;
  amortt?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  from?: Maybe<Scalars['String']['output']>;
  lang?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type TranslateEntity = {
  __typename?: 'TranslateEntity';
  attributes?: Maybe<Translate>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type TranslateEntityResponse = {
  __typename?: 'TranslateEntityResponse';
  data?: Maybe<TranslateEntity>;
};

export type TranslateEntityResponseCollection = {
  __typename?: 'TranslateEntityResponseCollection';
  data: Array<TranslateEntity>;
  meta: ResponseCollectionMeta;
};

export type TranslateFiltersInput = {
  amort?: InputMaybe<StringFilterInput>;
  amortf?: InputMaybe<StringFilterInput>;
  amorth?: InputMaybe<StringFilterInput>;
  amorts?: InputMaybe<StringFilterInput>;
  amortt?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<TranslateFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  email?: InputMaybe<StringFilterInput>;
  from?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  lang?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<TranslateFiltersInput>;
  notes?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<TranslateFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type TranslateInput = {
  amort?: InputMaybe<Scalars['String']['input']>;
  amortf?: InputMaybe<Scalars['String']['input']>;
  amorth?: InputMaybe<Scalars['String']['input']>;
  amorts?: InputMaybe<Scalars['String']['input']>;
  amortt?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  lang?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UploadFile = {
  __typename?: 'UploadFile';
  alternativeText?: Maybe<Scalars['String']['output']>;
  caption?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  ext?: Maybe<Scalars['String']['output']>;
  formats?: Maybe<Scalars['JSON']['output']>;
  hash: Scalars['String']['output'];
  height?: Maybe<Scalars['Int']['output']>;
  mime: Scalars['String']['output'];
  name: Scalars['String']['output'];
  previewUrl?: Maybe<Scalars['String']['output']>;
  provider: Scalars['String']['output'];
  provider_metadata?: Maybe<Scalars['JSON']['output']>;
  related?: Maybe<Array<Maybe<GenericMorph>>>;
  size: Scalars['Float']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  url: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type UploadFileEntity = {
  __typename?: 'UploadFileEntity';
  attributes?: Maybe<UploadFile>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type UploadFileEntityResponse = {
  __typename?: 'UploadFileEntityResponse';
  data?: Maybe<UploadFileEntity>;
};

export type UploadFileEntityResponseCollection = {
  __typename?: 'UploadFileEntityResponseCollection';
  data: Array<UploadFileEntity>;
  meta: ResponseCollectionMeta;
};

export type UploadFileFiltersInput = {
  alternativeText?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>;
  caption?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  ext?: InputMaybe<StringFilterInput>;
  folder?: InputMaybe<UploadFolderFiltersInput>;
  folderPath?: InputMaybe<StringFilterInput>;
  formats?: InputMaybe<JsonFilterInput>;
  hash?: InputMaybe<StringFilterInput>;
  height?: InputMaybe<IntFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  mime?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<UploadFileFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>;
  previewUrl?: InputMaybe<StringFilterInput>;
  provider?: InputMaybe<StringFilterInput>;
  provider_metadata?: InputMaybe<JsonFilterInput>;
  size?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  url?: InputMaybe<StringFilterInput>;
  width?: InputMaybe<IntFilterInput>;
};

export type UploadFileInput = {
  alternativeText?: InputMaybe<Scalars['String']['input']>;
  caption?: InputMaybe<Scalars['String']['input']>;
  ext?: InputMaybe<Scalars['String']['input']>;
  folder?: InputMaybe<Scalars['ID']['input']>;
  folderPath?: InputMaybe<Scalars['String']['input']>;
  formats?: InputMaybe<Scalars['JSON']['input']>;
  hash?: InputMaybe<Scalars['String']['input']>;
  height?: InputMaybe<Scalars['Int']['input']>;
  mime?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  previewUrl?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  provider_metadata?: InputMaybe<Scalars['JSON']['input']>;
  size?: InputMaybe<Scalars['Float']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type UploadFileRelationResponseCollection = {
  __typename?: 'UploadFileRelationResponseCollection';
  data: Array<UploadFileEntity>;
};

export type UploadFolder = {
  __typename?: 'UploadFolder';
  children?: Maybe<UploadFolderRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  files?: Maybe<UploadFileRelationResponseCollection>;
  name: Scalars['String']['output'];
  parent?: Maybe<UploadFolderEntityResponse>;
  path: Scalars['String']['output'];
  pathId: Scalars['Int']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type UploadFolderChildrenArgs = {
  filters?: InputMaybe<UploadFolderFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UploadFolderFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UploadFolderEntity = {
  __typename?: 'UploadFolderEntity';
  attributes?: Maybe<UploadFolder>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type UploadFolderEntityResponse = {
  __typename?: 'UploadFolderEntityResponse';
  data?: Maybe<UploadFolderEntity>;
};

export type UploadFolderEntityResponseCollection = {
  __typename?: 'UploadFolderEntityResponseCollection';
  data: Array<UploadFolderEntity>;
  meta: ResponseCollectionMeta;
};

export type UploadFolderFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<UploadFolderFiltersInput>>>;
  children?: InputMaybe<UploadFolderFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  files?: InputMaybe<UploadFileFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<UploadFolderFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UploadFolderFiltersInput>>>;
  parent?: InputMaybe<UploadFolderFiltersInput>;
  path?: InputMaybe<StringFilterInput>;
  pathId?: InputMaybe<IntFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type UploadFolderInput = {
  children?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  files?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  parent?: InputMaybe<Scalars['ID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  pathId?: InputMaybe<Scalars['Int']['input']>;
};

export type UploadFolderRelationResponseCollection = {
  __typename?: 'UploadFolderRelationResponseCollection';
  data: Array<UploadFolderEntity>;
};

export type UsersPermissionsCreateRolePayload = {
  __typename?: 'UsersPermissionsCreateRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsDeleteRolePayload = {
  __typename?: 'UsersPermissionsDeleteRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsLoginInput = {
  identifier: Scalars['String']['input'];
  password: Scalars['String']['input'];
  provider?: Scalars['String']['input'];
};

export type UsersPermissionsLoginPayload = {
  __typename?: 'UsersPermissionsLoginPayload';
  jwt?: Maybe<Scalars['String']['output']>;
  user: UsersPermissionsMe;
};

export type UsersPermissionsMe = {
  __typename?: 'UsersPermissionsMe';
  blocked?: Maybe<Scalars['Boolean']['output']>;
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  role?: Maybe<UsersPermissionsMeRole>;
  username: Scalars['String']['output'];
};

export type UsersPermissionsMeRole = {
  __typename?: 'UsersPermissionsMeRole';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type UsersPermissionsPasswordPayload = {
  __typename?: 'UsersPermissionsPasswordPayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsPermission = {
  __typename?: 'UsersPermissionsPermission';
  action: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  role?: Maybe<UsersPermissionsRoleEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UsersPermissionsPermissionEntity = {
  __typename?: 'UsersPermissionsPermissionEntity';
  attributes?: Maybe<UsersPermissionsPermission>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type UsersPermissionsPermissionFiltersInput = {
  action?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>;
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type UsersPermissionsPermissionRelationResponseCollection = {
  __typename?: 'UsersPermissionsPermissionRelationResponseCollection';
  data: Array<UsersPermissionsPermissionEntity>;
};

export type UsersPermissionsRegisterInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type UsersPermissionsRole = {
  __typename?: 'UsersPermissionsRole';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  permissions?: Maybe<UsersPermissionsPermissionRelationResponseCollection>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type UsersPermissionsRolePermissionsArgs = {
  filters?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsRoleUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UsersPermissionsRoleEntity = {
  __typename?: 'UsersPermissionsRoleEntity';
  attributes?: Maybe<UsersPermissionsRole>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type UsersPermissionsRoleEntityResponse = {
  __typename?: 'UsersPermissionsRoleEntityResponse';
  data?: Maybe<UsersPermissionsRoleEntity>;
};

export type UsersPermissionsRoleEntityResponseCollection = {
  __typename?: 'UsersPermissionsRoleEntityResponseCollection';
  data: Array<UsersPermissionsRoleEntity>;
  meta: ResponseCollectionMeta;
};

export type UsersPermissionsRoleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>;
  permissions?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type UsersPermissionsRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  type?: InputMaybe<Scalars['String']['input']>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type UsersPermissionsUpdateRolePayload = {
  __typename?: 'UsersPermissionsUpdateRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsUser = {
  __typename?: 'UsersPermissionsUser';
  acts?: Maybe<ActRelationResponseCollection>;
  actsVali?: Maybe<ActRelationResponseCollection>;
  api_keys?: Maybe<ApiKeyRelationResponseCollection>;
  arr1?: Maybe<Scalars['JSON']['output']>;
  arrdate?: Maybe<Scalars['DateTime']['output']>;
  askeds?: Maybe<OpenMissionRelationResponseCollection>;
  askms?: Maybe<AskmRelationResponseCollection>;
  asks?: Maybe<AskRelationResponseCollection>;
  askwants?: Maybe<AskwantRelationResponseCollection>;
  auto_created_via?: Maybe<Enum_Userspermissionsuser_Auto_Created_Via>;
  availability_pref?: Maybe<Scalars['JSON']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  blocked?: Maybe<Scalars['Boolean']['output']>;
  chezin?: Maybe<ChezinEntityResponse>;
  city?: Maybe<Scalars['String']['output']>;
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cuntries?: Maybe<CuntryRelationResponseCollection>;
  cv_extracted_at?: Maybe<Scalars['DateTime']['output']>;
  cv_extraction?: Maybe<Scalars['JSON']['output']>;
  cv_url?: Maybe<UploadFileRelationResponseCollection>;
  deals?: Maybe<DealRelationResponseCollection>;
  declined?: Maybe<OpenMissionRelationResponseCollection>;
  declinedByP?: Maybe<OpenMissionRelationResponseCollection>;
  declinedm?: Maybe<OpenMashaabimRelationResponseCollection>;
  device_token?: Maybe<Scalars['String']['output']>;
  discordlink?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  fblink?: Maybe<Scalars['String']['output']>;
  filtertags?: Maybe<FiltertagRelationResponseCollection>;
  finiapruvals?: Maybe<FiniapruvalRelationResponseCollection>;
  finnished_missions?: Maybe<FinnishedMissionRelationResponseCollection>;
  forum_last_seens?: Maybe<ForumLastSeenRelationResponseCollection>;
  frd?: Maybe<Enum_Userspermissionsuser_Frd>;
  free_person?: Maybe<Scalars['Int']['output']>;
  githublink?: Maybe<Scalars['String']['output']>;
  haamadas?: Maybe<HaamadaRelationResponseCollection>;
  halukasend?: Maybe<HalukaRelationResponseCollection>;
  halukasres?: Maybe<HalukaRelationResponseCollection>;
  haskama?: Maybe<Scalars['Long']['output']>;
  haskamac?: Maybe<Scalars['Long']['output']>;
  haskamaz?: Maybe<Scalars['Long']['output']>;
  hatzaas?: Maybe<HatzaaRelationResponseCollection>;
  hervachti?: Maybe<Scalars['Float']['output']>;
  iGotMOneyForSheirut?: Maybe<SheirutRelationResponseCollection>;
  isSigned?: Maybe<Scalars['Boolean']['output']>;
  lang?: Maybe<Enum_Userspermissionsuser_Lang>;
  lat?: Maybe<Scalars['Float']['output']>;
  levManualAlready?: Maybe<Scalars['Boolean']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  location?: Maybe<Array<Maybe<ComponentNewLocation>>>;
  machshirs?: Maybe<MachshirRelationResponseCollection>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  mashabetahaliches?: Maybe<MashabetahalichRelationResponseCollection>;
  matanot_recipe_missions?: Maybe<MatanotRecipeMissionRelationResponseCollection>;
  matanot_recipe_resources?: Maybe<MatanotRecipeResourceRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  messages?: Maybe<MessageRelationResponseCollection>;
  missions_i_can_do?: Maybe<MissionRelationResponseCollection>;
  moachManualAlready?: Maybe<Scalars['Boolean']['output']>;
  nego_mashes?: Maybe<NegoMashRelationResponseCollection>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  negotiations?: Maybe<NegotiationRelationResponseCollection>;
  negotiationsIparticipante?: Maybe<NegotiationRelationResponseCollection>;
  noMail?: Maybe<Scalars['Boolean']['output']>;
  noMoachGuide?: Maybe<Scalars['Boolean']['output']>;
  noOfHoursProject1?: Maybe<Scalars['Float']['output']>;
  onboarding_status?: Maybe<Enum_Userspermissionsuser_Onboarding_Status>;
  onboarding_track?: Maybe<Enum_Userspermissionsuser_Onboarding_Track>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  pendmsforme?: Maybe<PendmRelationResponseCollection>;
  pgishas?: Maybe<PgishaRelationResponseCollection>;
  pgishasPendStrat?: Maybe<PgishaRelationResponseCollection>;
  pgishauserpends?: Maybe<PgishauserpendRelationResponseCollection>;
  pgishausers?: Maybe<PgishauserRelationResponseCollection>;
  pmashes?: Maybe<PmashRelationResponseCollection>;
  positionsAuthor?: Maybe<PositionRelationResponseCollection>;
  preferCards?: Maybe<Scalars['Boolean']['output']>;
  pricing_pref?: Maybe<Scalars['JSON']['output']>;
  profilManualAlready?: Maybe<Scalars['Boolean']['output']>;
  profilePic?: Maybe<UploadFileEntityResponse>;
  projects_1s?: Maybe<ProjectRelationResponseCollection>;
  provider?: Maybe<Scalars['String']['output']>;
  radius?: Maybe<Scalars['Long']['output']>;
  ratson_proposals?: Maybe<RatsonProposalRelationResponseCollection>;
  ratson_shares?: Maybe<RatsonShareRelationResponseCollection>;
  ratsons?: Maybe<RatsonRelationResponseCollection>;
  rikmashes?: Maybe<RikmashRelationResponseCollection>;
  rishonvesopen?: Maybe<OpenMissionRelationResponseCollection>;
  role?: Maybe<UsersPermissionsRoleEntityResponse>;
  sales?: Maybe<SaleRelationResponseCollection>;
  sheirutnegos?: Maybe<SheirutnegoRelationResponseCollection>;
  sheirutpends?: Maybe<SheirutpendRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  sheiruts_iCanGetMonay?: Maybe<SheirutRelationResponseCollection>;
  shekelsPerHoureProject1?: Maybe<Scalars['Float']['output']>;
  site_share_contributions?: Maybe<SiteShareContributionRelationResponseCollection>;
  skills?: Maybe<SkillRelationResponseCollection>;
  socketId?: Maybe<Scalars['String']['output']>;
  sphmin?: Maybe<Scalars['Float']['output']>;
  sps?: Maybe<SpRelationResponseCollection>;
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  telegramId?: Maybe<Scalars['String']['output']>;
  timeForVid?: Maybe<Scalars['DateTime']['output']>;
  timers?: Maybe<TimerRelationResponseCollection>;
  twiterlink?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  username: Scalars['String']['output'];
  vallues?: Maybe<VallueRelationResponseCollection>;
  videoval?: Maybe<Scalars['Boolean']['output']>;
  votes?: Maybe<VoteRelationResponseCollection>;
  wants?: Maybe<WantRelationResponseCollection>;
  welcom_tops?: Maybe<WelcomTopRelationResponseCollection>;
  work_ways?: Maybe<WorkWayRelationResponseCollection>;
  zohars?: Maybe<ZoharRelationResponseCollection>;
};


export type UsersPermissionsUserActsArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserActsValiArgs = {
  filters?: InputMaybe<ActFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserApi_KeysArgs = {
  filters?: InputMaybe<ApiKeyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserAskedsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserAskmsArgs = {
  filters?: InputMaybe<AskmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserAsksArgs = {
  filters?: InputMaybe<AskFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserAskwantsArgs = {
  filters?: InputMaybe<AskwantFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserCuntriesArgs = {
  filters?: InputMaybe<CuntryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserCv_UrlArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserDealsArgs = {
  filters?: InputMaybe<DealFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserDeclinedArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserDeclinedByPArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserDeclinedmArgs = {
  filters?: InputMaybe<OpenMashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserFiltertagsArgs = {
  filters?: InputMaybe<FiltertagFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserFiniapruvalsArgs = {
  filters?: InputMaybe<FiniapruvalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserFinnished_MissionsArgs = {
  filters?: InputMaybe<FinnishedMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserForum_Last_SeensArgs = {
  filters?: InputMaybe<ForumLastSeenFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserHaamadasArgs = {
  filters?: InputMaybe<HaamadaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserHalukasendArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserHalukasresArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserHatzaasArgs = {
  filters?: InputMaybe<HatzaaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserIGotMOneyForSheirutArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserLocationArgs = {
  filters?: InputMaybe<ComponentNewLocationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMachshirsArgs = {
  filters?: InputMaybe<MachshirFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMashabetahalichesArgs = {
  filters?: InputMaybe<MashabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMatanot_Recipe_MissionsArgs = {
  filters?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMatanot_Recipe_ResourcesArgs = {
  filters?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMesimabetahalichesArgs = {
  filters?: InputMaybe<MesimabetahalichFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMessagesArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserMissions_I_Can_DoArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserNego_MashesArgs = {
  filters?: InputMaybe<NegoMashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserNegotiationsArgs = {
  filters?: InputMaybe<NegotiationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserNegotiationsIparticipanteArgs = {
  filters?: InputMaybe<NegotiationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPendmsformeArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPgishasArgs = {
  filters?: InputMaybe<PgishaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPgishasPendStratArgs = {
  filters?: InputMaybe<PgishaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPgishauserpendsArgs = {
  filters?: InputMaybe<PgishauserpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPgishausersArgs = {
  filters?: InputMaybe<PgishauserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPmashesArgs = {
  filters?: InputMaybe<PmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPositionsAuthorArgs = {
  filters?: InputMaybe<PositionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserProjects_1sArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserRatson_ProposalsArgs = {
  filters?: InputMaybe<RatsonProposalFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserRatson_SharesArgs = {
  filters?: InputMaybe<RatsonShareFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserRatsonsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserRikmashesArgs = {
  filters?: InputMaybe<RikmashFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserRishonvesopenArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSalesArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSheirutnegosArgs = {
  filters?: InputMaybe<SheirutnegoFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSheirutpendsArgs = {
  filters?: InputMaybe<SheirutpendFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSheirutsArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSheiruts_ICanGetMonayArgs = {
  filters?: InputMaybe<SheirutFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSite_Share_ContributionsArgs = {
  filters?: InputMaybe<SiteShareContributionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSkillsArgs = {
  filters?: InputMaybe<SkillFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserSpsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserTafkidimsArgs = {
  filters?: InputMaybe<TafkidimFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserTimersArgs = {
  filters?: InputMaybe<TimerFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserValluesArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserVotesArgs = {
  filters?: InputMaybe<VoteFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserWantsArgs = {
  filters?: InputMaybe<WantFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserWelcom_TopsArgs = {
  filters?: InputMaybe<WelcomTopFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserWork_WaysArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserZoharsArgs = {
  filters?: InputMaybe<ZoharFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UsersPermissionsUserEntity = {
  __typename?: 'UsersPermissionsUserEntity';
  attributes?: Maybe<UsersPermissionsUser>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type UsersPermissionsUserEntityResponse = {
  __typename?: 'UsersPermissionsUserEntityResponse';
  data?: Maybe<UsersPermissionsUserEntity>;
};

export type UsersPermissionsUserEntityResponseCollection = {
  __typename?: 'UsersPermissionsUserEntityResponseCollection';
  data: Array<UsersPermissionsUserEntity>;
  meta: ResponseCollectionMeta;
};

export type UsersPermissionsUserFiltersInput = {
  acts?: InputMaybe<ActFiltersInput>;
  actsVali?: InputMaybe<ActFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  api_keys?: InputMaybe<ApiKeyFiltersInput>;
  arr1?: InputMaybe<JsonFilterInput>;
  arrdate?: InputMaybe<DateTimeFilterInput>;
  askeds?: InputMaybe<OpenMissionFiltersInput>;
  askms?: InputMaybe<AskmFiltersInput>;
  asks?: InputMaybe<AskFiltersInput>;
  askwants?: InputMaybe<AskwantFiltersInput>;
  auto_created_via?: InputMaybe<StringFilterInput>;
  availability_pref?: InputMaybe<JsonFilterInput>;
  bio?: InputMaybe<StringFilterInput>;
  blocked?: InputMaybe<BooleanFilterInput>;
  chezin?: InputMaybe<ChezinFiltersInput>;
  city?: InputMaybe<StringFilterInput>;
  confirmationToken?: InputMaybe<StringFilterInput>;
  confirmed?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  cuntries?: InputMaybe<CuntryFiltersInput>;
  cv_extracted_at?: InputMaybe<DateTimeFilterInput>;
  cv_extraction?: InputMaybe<JsonFilterInput>;
  deals?: InputMaybe<DealFiltersInput>;
  declined?: InputMaybe<OpenMissionFiltersInput>;
  declinedByP?: InputMaybe<OpenMissionFiltersInput>;
  declinedm?: InputMaybe<OpenMashaabimFiltersInput>;
  device_token?: InputMaybe<StringFilterInput>;
  discordlink?: InputMaybe<StringFilterInput>;
  email?: InputMaybe<StringFilterInput>;
  fblink?: InputMaybe<StringFilterInput>;
  filtertags?: InputMaybe<FiltertagFiltersInput>;
  finiapruvals?: InputMaybe<FiniapruvalFiltersInput>;
  finnished_missions?: InputMaybe<FinnishedMissionFiltersInput>;
  forum_last_seens?: InputMaybe<ForumLastSeenFiltersInput>;
  frd?: InputMaybe<StringFilterInput>;
  free_person?: InputMaybe<IntFilterInput>;
  githublink?: InputMaybe<StringFilterInput>;
  haamadas?: InputMaybe<HaamadaFiltersInput>;
  halukasend?: InputMaybe<HalukaFiltersInput>;
  halukasres?: InputMaybe<HalukaFiltersInput>;
  haskama?: InputMaybe<LongFilterInput>;
  haskamac?: InputMaybe<LongFilterInput>;
  haskamaz?: InputMaybe<LongFilterInput>;
  hatzaas?: InputMaybe<HatzaaFiltersInput>;
  hervachti?: InputMaybe<FloatFilterInput>;
  iGotMOneyForSheirut?: InputMaybe<SheirutFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isSigned?: InputMaybe<BooleanFilterInput>;
  lang?: InputMaybe<StringFilterInput>;
  lat?: InputMaybe<FloatFilterInput>;
  levManualAlready?: InputMaybe<BooleanFilterInput>;
  lng?: InputMaybe<FloatFilterInput>;
  location?: InputMaybe<ComponentNewLocationFiltersInput>;
  machshirs?: InputMaybe<MachshirFiltersInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  mashabetahaliches?: InputMaybe<MashabetahalichFiltersInput>;
  matanot_recipe_missions?: InputMaybe<MatanotRecipeMissionFiltersInput>;
  matanot_recipe_resources?: InputMaybe<MatanotRecipeResourceFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  messages?: InputMaybe<MessageFiltersInput>;
  missions_i_can_do?: InputMaybe<MissionFiltersInput>;
  moachManualAlready?: InputMaybe<BooleanFilterInput>;
  nego_mashes?: InputMaybe<NegoMashFiltersInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  negotiations?: InputMaybe<NegotiationFiltersInput>;
  negotiationsIparticipante?: InputMaybe<NegotiationFiltersInput>;
  noMail?: InputMaybe<BooleanFilterInput>;
  noMoachGuide?: InputMaybe<BooleanFilterInput>;
  noOfHoursProject1?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<UsersPermissionsUserFiltersInput>;
  onboarding_status?: InputMaybe<StringFilterInput>;
  onboarding_track?: InputMaybe<StringFilterInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  password?: InputMaybe<StringFilterInput>;
  pendms?: InputMaybe<PendmFiltersInput>;
  pendmsforme?: InputMaybe<PendmFiltersInput>;
  pgishas?: InputMaybe<PgishaFiltersInput>;
  pgishasPendStrat?: InputMaybe<PgishaFiltersInput>;
  pgishauserpends?: InputMaybe<PgishauserpendFiltersInput>;
  pgishausers?: InputMaybe<PgishauserFiltersInput>;
  pmashes?: InputMaybe<PmashFiltersInput>;
  positionsAuthor?: InputMaybe<PositionFiltersInput>;
  preferCards?: InputMaybe<BooleanFilterInput>;
  pricing_pref?: InputMaybe<JsonFilterInput>;
  profilManualAlready?: InputMaybe<BooleanFilterInput>;
  projects_1s?: InputMaybe<ProjectFiltersInput>;
  provider?: InputMaybe<StringFilterInput>;
  radius?: InputMaybe<LongFilterInput>;
  ratson_proposals?: InputMaybe<RatsonProposalFiltersInput>;
  ratson_shares?: InputMaybe<RatsonShareFiltersInput>;
  ratsons?: InputMaybe<RatsonFiltersInput>;
  resetPasswordToken?: InputMaybe<StringFilterInput>;
  rikmashes?: InputMaybe<RikmashFiltersInput>;
  rishonvesopen?: InputMaybe<OpenMissionFiltersInput>;
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  sales?: InputMaybe<SaleFiltersInput>;
  sheirutnegos?: InputMaybe<SheirutnegoFiltersInput>;
  sheirutpends?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  sheiruts_iCanGetMonay?: InputMaybe<SheirutFiltersInput>;
  shekelsPerHoureProject1?: InputMaybe<FloatFilterInput>;
  site_share_contributions?: InputMaybe<SiteShareContributionFiltersInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  socketId?: InputMaybe<StringFilterInput>;
  sphmin?: InputMaybe<FloatFilterInput>;
  sps?: InputMaybe<SpFiltersInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  telegramId?: InputMaybe<StringFilterInput>;
  timeForVid?: InputMaybe<DateTimeFilterInput>;
  timers?: InputMaybe<TimerFiltersInput>;
  twiterlink?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  username?: InputMaybe<StringFilterInput>;
  vallues?: InputMaybe<VallueFiltersInput>;
  videoval?: InputMaybe<BooleanFilterInput>;
  votes?: InputMaybe<VoteFiltersInput>;
  wants?: InputMaybe<WantFiltersInput>;
  welcom_tops?: InputMaybe<WelcomTopFiltersInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
  zohars?: InputMaybe<ZoharFiltersInput>;
};

export type UsersPermissionsUserInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  actsVali?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  api_keys?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  arr1?: InputMaybe<Scalars['JSON']['input']>;
  arrdate?: InputMaybe<Scalars['DateTime']['input']>;
  askeds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  asks?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askwants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  auto_created_via?: InputMaybe<Enum_Userspermissionsuser_Auto_Created_Via>;
  availability_pref?: InputMaybe<Scalars['JSON']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  blocked?: InputMaybe<Scalars['Boolean']['input']>;
  chezin?: InputMaybe<Scalars['ID']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  confirmationToken?: InputMaybe<Scalars['String']['input']>;
  confirmed?: InputMaybe<Scalars['Boolean']['input']>;
  cuntries?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  cv_extracted_at?: InputMaybe<Scalars['DateTime']['input']>;
  cv_extraction?: InputMaybe<Scalars['JSON']['input']>;
  cv_url?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  deals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  declined?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  declinedByP?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  declinedm?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  device_token?: InputMaybe<Scalars['String']['input']>;
  discordlink?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fblink?: InputMaybe<Scalars['String']['input']>;
  filtertags?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  finiapruvals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  finnished_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  forum_last_seens?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  frd?: InputMaybe<Enum_Userspermissionsuser_Frd>;
  free_person?: InputMaybe<Scalars['Int']['input']>;
  githublink?: InputMaybe<Scalars['String']['input']>;
  haamadas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  halukasend?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  halukasres?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  haskama?: InputMaybe<Scalars['Long']['input']>;
  haskamac?: InputMaybe<Scalars['Long']['input']>;
  haskamaz?: InputMaybe<Scalars['Long']['input']>;
  hatzaas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hervachti?: InputMaybe<Scalars['Float']['input']>;
  iGotMOneyForSheirut?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  isSigned?: InputMaybe<Scalars['Boolean']['input']>;
  lang?: InputMaybe<Enum_Userspermissionsuser_Lang>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  levManualAlready?: InputMaybe<Scalars['Boolean']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<Array<InputMaybe<ComponentNewLocationInput>>>;
  machshirs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot_recipe_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot_recipe_resources?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  messages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  missions_i_can_do?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  moachManualAlready?: InputMaybe<Scalars['Boolean']['input']>;
  nego_mashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negotiations?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negotiationsIparticipante?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  noMail?: InputMaybe<Scalars['Boolean']['input']>;
  noMoachGuide?: InputMaybe<Scalars['Boolean']['input']>;
  noOfHoursProject1?: InputMaybe<Scalars['Float']['input']>;
  onboarding_status?: InputMaybe<Enum_Userspermissionsuser_Onboarding_Status>;
  onboarding_track?: InputMaybe<Enum_Userspermissionsuser_Onboarding_Track>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  password?: InputMaybe<Scalars['String']['input']>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendmsforme?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishasPendStrat?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishauserpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishausers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  positionsAuthor?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  preferCards?: InputMaybe<Scalars['Boolean']['input']>;
  pricing_pref?: InputMaybe<Scalars['JSON']['input']>;
  profilManualAlready?: InputMaybe<Scalars['Boolean']['input']>;
  profilePic?: InputMaybe<Scalars['ID']['input']>;
  projects_1s?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  provider?: InputMaybe<Scalars['String']['input']>;
  radius?: InputMaybe<Scalars['Long']['input']>;
  ratson_proposals?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ratson_shares?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ratsons?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  resetPasswordToken?: InputMaybe<Scalars['String']['input']>;
  rikmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  rishonvesopen?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  role?: InputMaybe<Scalars['ID']['input']>;
  sales?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutnegos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts_iCanGetMonay?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  shekelsPerHoureProject1?: InputMaybe<Scalars['Float']['input']>;
  site_share_contributions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  socketId?: InputMaybe<Scalars['String']['input']>;
  sphmin?: InputMaybe<Scalars['Float']['input']>;
  sps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  telegramId?: InputMaybe<Scalars['String']['input']>;
  timeForVid?: InputMaybe<Scalars['DateTime']['input']>;
  timers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  twiterlink?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  vallues?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  videoval?: InputMaybe<Scalars['Boolean']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  wants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  welcom_tops?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  work_ways?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  zohars?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type UsersPermissionsUserRelationResponseCollection = {
  __typename?: 'UsersPermissionsUserRelationResponseCollection';
  data: Array<UsersPermissionsUserEntity>;
};

export type Vallue = {
  __typename?: 'Vallue';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  decisions?: Maybe<DecisionRelationResponseCollection>;
  decisionsles?: Maybe<DecisionRelationResponseCollection>;
  descrip?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<VallueRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  ratsons?: Maybe<RatsonRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  valueName: Scalars['String']['output'];
};


export type VallueDecisionsArgs = {
  filters?: InputMaybe<DecisionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type VallueDecisionslesArgs = {
  filters?: InputMaybe<DecisionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type VallueLocalizationsArgs = {
  filters?: InputMaybe<VallueFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type VallueOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ValluePendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type VallueProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type VallueRatsonsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type VallueUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type VallueEntity = {
  __typename?: 'VallueEntity';
  attributes?: Maybe<Vallue>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type VallueEntityResponse = {
  __typename?: 'VallueEntityResponse';
  data?: Maybe<VallueEntity>;
};

export type VallueEntityResponseCollection = {
  __typename?: 'VallueEntityResponseCollection';
  data: Array<VallueEntity>;
  meta: ResponseCollectionMeta;
};

export type VallueFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<VallueFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  decisions?: InputMaybe<DecisionFiltersInput>;
  decisionsles?: InputMaybe<DecisionFiltersInput>;
  descrip?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<VallueFiltersInput>;
  not?: InputMaybe<VallueFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<VallueFiltersInput>>>;
  pendms?: InputMaybe<PendmFiltersInput>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  ratsons?: InputMaybe<RatsonFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  valueName?: InputMaybe<StringFilterInput>;
};

export type VallueInput = {
  decisions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  decisionsles?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  ratsons?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  valueName?: InputMaybe<Scalars['String']['input']>;
};

export type VallueRelationResponseCollection = {
  __typename?: 'VallueRelationResponseCollection';
  data: Array<VallueEntity>;
};

export type Vote = {
  __typename?: 'Vote';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deas?: Maybe<DeaRelationResponseCollection>;
  decision?: Maybe<DecisionEntityResponse>;
  hazbaah?: Maybe<HazbaahEntityResponse>;
  item_idx?: Maybe<Scalars['Int']['output']>;
  item_kind?: Maybe<Enum_Vote_Item_Kind>;
  matanotpend?: Maybe<MatanotpendEntityResponse>;
  nego?: Maybe<NegoEntityResponse>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  ratson?: Maybe<RatsonEntityResponse>;
  ratson_proposal?: Maybe<RatsonProposalEntityResponse>;
  sheirut?: Maybe<SheirutEntityResponse>;
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
  timer?: Maybe<TimerEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  what?: Maybe<Scalars['Boolean']['output']>;
  why?: Maybe<Scalars['String']['output']>;
};


export type VoteDeasArgs = {
  filters?: InputMaybe<DeaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type VoteEntity = {
  __typename?: 'VoteEntity';
  attributes?: Maybe<Vote>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type VoteEntityResponse = {
  __typename?: 'VoteEntityResponse';
  data?: Maybe<VoteEntity>;
};

export type VoteEntityResponseCollection = {
  __typename?: 'VoteEntityResponseCollection';
  data: Array<VoteEntity>;
  meta: ResponseCollectionMeta;
};

export type VoteFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<VoteFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  deas?: InputMaybe<DeaFiltersInput>;
  decision?: InputMaybe<DecisionFiltersInput>;
  hazbaah?: InputMaybe<HazbaahFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  item_idx?: InputMaybe<IntFilterInput>;
  item_kind?: InputMaybe<StringFilterInput>;
  matanotpend?: InputMaybe<MatanotpendFiltersInput>;
  nego?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<VoteFiltersInput>;
  ok?: InputMaybe<BooleanFilterInput>;
  or?: InputMaybe<Array<InputMaybe<VoteFiltersInput>>>;
  order?: InputMaybe<IntFilterInput>;
  ratson?: InputMaybe<RatsonFiltersInput>;
  ratson_proposal?: InputMaybe<RatsonProposalFiltersInput>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  sheirutpend?: InputMaybe<SheirutpendFiltersInput>;
  timer?: InputMaybe<TimerFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  what?: InputMaybe<BooleanFilterInput>;
  why?: InputMaybe<StringFilterInput>;
};

export type VoteInput = {
  deas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  decision?: InputMaybe<Scalars['ID']['input']>;
  hazbaah?: InputMaybe<Scalars['ID']['input']>;
  item_idx?: InputMaybe<Scalars['Int']['input']>;
  item_kind?: InputMaybe<Enum_Vote_Item_Kind>;
  matanotpend?: InputMaybe<Scalars['ID']['input']>;
  nego?: InputMaybe<Scalars['ID']['input']>;
  ok?: InputMaybe<Scalars['Boolean']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  ratson?: InputMaybe<Scalars['ID']['input']>;
  ratson_proposal?: InputMaybe<Scalars['ID']['input']>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  sheirutpend?: InputMaybe<Scalars['ID']['input']>;
  timer?: InputMaybe<Scalars['ID']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  what?: InputMaybe<Scalars['Boolean']['input']>;
  why?: InputMaybe<Scalars['String']['input']>;
};

export type VoteRelationResponseCollection = {
  __typename?: 'VoteRelationResponseCollection';
  data: Array<VoteEntity>;
};

export type Want = {
  __typename?: 'Want';
  amountalready?: Maybe<Scalars['Float']['output']>;
  appruved?: Maybe<Scalars['Boolean']['output']>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  finnish?: Maybe<Scalars['DateTime']['output']>;
  halukas?: Maybe<HalukaRelationResponseCollection>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<WantRelationResponseCollection>;
  monters?: Maybe<MonterRelationResponseCollection>;
  sheirut?: Maybe<SheirutEntityResponse>;
  starte?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type WantHalukasArgs = {
  filters?: InputMaybe<HalukaFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WantLocalizationsArgs = {
  filters?: InputMaybe<WantFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WantMontersArgs = {
  filters?: InputMaybe<MonterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type WantEntity = {
  __typename?: 'WantEntity';
  attributes?: Maybe<Want>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type WantEntityResponse = {
  __typename?: 'WantEntityResponse';
  data?: Maybe<WantEntity>;
};

export type WantEntityResponseCollection = {
  __typename?: 'WantEntityResponseCollection';
  data: Array<WantEntity>;
  meta: ResponseCollectionMeta;
};

export type WantFiltersInput = {
  amountalready?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<WantFiltersInput>>>;
  appruved?: InputMaybe<BooleanFilterInput>;
  archived?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  finnish?: InputMaybe<DateTimeFilterInput>;
  halukas?: InputMaybe<HalukaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<WantFiltersInput>;
  monters?: InputMaybe<MonterFiltersInput>;
  not?: InputMaybe<WantFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<WantFiltersInput>>>;
  sheirut?: InputMaybe<SheirutFiltersInput>;
  starte?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type WantInput = {
  amountalready?: InputMaybe<Scalars['Float']['input']>;
  appruved?: InputMaybe<Scalars['Boolean']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  finnish?: InputMaybe<Scalars['DateTime']['input']>;
  halukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  monters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirut?: InputMaybe<Scalars['ID']['input']>;
  starte?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type WantRelationResponseCollection = {
  __typename?: 'WantRelationResponseCollection';
  data: Array<WantEntity>;
};

export type WelcomTop = {
  __typename?: 'WelcomTop';
  clicked: Scalars['Boolean']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};

export type WelcomTopEntity = {
  __typename?: 'WelcomTopEntity';
  attributes?: Maybe<WelcomTop>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type WelcomTopEntityResponse = {
  __typename?: 'WelcomTopEntityResponse';
  data?: Maybe<WelcomTopEntity>;
};

export type WelcomTopEntityResponseCollection = {
  __typename?: 'WelcomTopEntityResponseCollection';
  data: Array<WelcomTopEntity>;
  meta: ResponseCollectionMeta;
};

export type WelcomTopFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<WelcomTopFiltersInput>>>;
  clicked?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<WelcomTopFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<WelcomTopFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type WelcomTopInput = {
  clicked?: InputMaybe<Scalars['Boolean']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
};

export type WelcomTopRelationResponseCollection = {
  __typename?: 'WelcomTopRelationResponseCollection';
  data: Array<WelcomTopEntity>;
};

export type Whatandwhy = {
  __typename?: 'Whatandwhy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<WhatandwhyRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  what: Scalars['Boolean']['output'];
  why: Scalars['String']['output'];
};

export type WhatandwhyEntity = {
  __typename?: 'WhatandwhyEntity';
  attributes?: Maybe<Whatandwhy>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type WhatandwhyEntityResponse = {
  __typename?: 'WhatandwhyEntityResponse';
  data?: Maybe<WhatandwhyEntity>;
};

export type WhatandwhyInput = {
  what?: InputMaybe<Scalars['Boolean']['input']>;
  why?: InputMaybe<Scalars['String']['input']>;
};

export type WhatandwhyRelationResponseCollection = {
  __typename?: 'WhatandwhyRelationResponseCollection';
  data: Array<WhatandwhyEntity>;
};

export type WorkWay = {
  __typename?: 'WorkWay';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<WorkWayRelationResponseCollection>;
  missions?: Maybe<MissionRelationResponseCollection>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  projects?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  workWayName: Scalars['String']['output'];
};


export type WorkWayLocalizationsArgs = {
  filters?: InputMaybe<WorkWayFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WorkWayMissionsArgs = {
  filters?: InputMaybe<MissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WorkWayNegopendmissionsArgs = {
  filters?: InputMaybe<NegopendmissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WorkWayOpen_MissionsArgs = {
  filters?: InputMaybe<OpenMissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WorkWayPendmsArgs = {
  filters?: InputMaybe<PendmFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WorkWayProjectsArgs = {
  filters?: InputMaybe<ProjectFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WorkWayUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type WorkWayEntity = {
  __typename?: 'WorkWayEntity';
  attributes?: Maybe<WorkWay>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type WorkWayEntityResponse = {
  __typename?: 'WorkWayEntityResponse';
  data?: Maybe<WorkWayEntity>;
};

export type WorkWayEntityResponseCollection = {
  __typename?: 'WorkWayEntityResponseCollection';
  data: Array<WorkWayEntity>;
  meta: ResponseCollectionMeta;
};

export type WorkWayFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<WorkWayFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<WorkWayFiltersInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  not?: InputMaybe<WorkWayFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<WorkWayFiltersInput>>>;
  pendms?: InputMaybe<PendmFiltersInput>;
  projects?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  workWayName?: InputMaybe<StringFilterInput>;
};

export type WorkWayInput = {
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  projects?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  workWayName?: InputMaybe<Scalars['String']['input']>;
};

export type WorkWayRelationResponseCollection = {
  __typename?: 'WorkWayRelationResponseCollection';
  data: Array<WorkWayEntity>;
};

export type Yat = {
  __typename?: 'Yat';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  modes?: Maybe<ModeRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  sps?: Maybe<SpRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type YatModesArgs = {
  filters?: InputMaybe<ModeFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type YatSpsArgs = {
  filters?: InputMaybe<SpFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type YatEntity = {
  __typename?: 'YatEntity';
  attributes?: Maybe<Yat>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type YatEntityResponse = {
  __typename?: 'YatEntityResponse';
  data?: Maybe<YatEntity>;
};

export type YatEntityResponseCollection = {
  __typename?: 'YatEntityResponseCollection';
  data: Array<YatEntity>;
  meta: ResponseCollectionMeta;
};

export type YatFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<YatFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  modes?: InputMaybe<ModeFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<YatFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<YatFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  sps?: InputMaybe<SpFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type YatInput = {
  modes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  sps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type Zohar = {
  __typename?: 'Zohar';
  allSubmited?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  done?: Maybe<Scalars['Boolean']['output']>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  weekSt?: Maybe<Scalars['Date']['output']>;
};

export type ZoharEntity = {
  __typename?: 'ZoharEntity';
  attributes?: Maybe<Zohar>;
  id?: Maybe<Scalars['ID']['output']>;
};

export type ZoharEntityResponse = {
  __typename?: 'ZoharEntityResponse';
  data?: Maybe<ZoharEntity>;
};

export type ZoharEntityResponseCollection = {
  __typename?: 'ZoharEntityResponseCollection';
  data: Array<ZoharEntity>;
  meta: ResponseCollectionMeta;
};

export type ZoharFiltersInput = {
  allSubmited?: InputMaybe<BooleanFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ZoharFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  done?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<ZoharFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ZoharFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  weekSt?: InputMaybe<DateFilterInput>;
};

export type ZoharInput = {
  allSubmited?: InputMaybe<Scalars['Boolean']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  users_permissions_user?: InputMaybe<Scalars['ID']['input']>;
  weekSt?: InputMaybe<Scalars['Date']['input']>;
};

export type ZoharRelationResponseCollection = {
  __typename?: 'ZoharRelationResponseCollection';
  data: Array<ZoharEntity>;
};
