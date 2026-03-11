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

export type Ask = {
  __typename?: 'Ask';
  archived?: Maybe<Scalars['Boolean']['output']>;
  chat?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forums?: Maybe<ForumRelationResponseCollection>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
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
  not?: InputMaybe<AskFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<AskFiltersInput>>>;
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
  open_mission?: InputMaybe<Scalars['ID']['input']>;
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
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
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
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<AskmFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<AskmFiltersInput>>>;
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
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
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
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type CategoryInput = {
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
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
  forums?: Maybe<ForumRelationResponseCollection>;
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
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  valluesadd?: Maybe<VallueRelationResponseCollection>;
  valluesles?: Maybe<VallueRelationResponseCollection>;
  votes?: Maybe<VoteRelationResponseCollection>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
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
  forums?: InputMaybe<ForumFiltersInput>;
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
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  valluesadd?: InputMaybe<VallueFiltersInput>;
  valluesles?: InputMaybe<VallueFiltersInput>;
  votes?: InputMaybe<VoteFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type DecisionInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  decisionName?: InputMaybe<Scalars['String']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  valluesadd?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  valluesles?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  vots?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
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

export enum Enum_Componentdesisionnegom_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Componentnewnegom_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Yearly = 'yearly'
}

export enum Enum_Contentreleasesreleaseaction_Type {
  Publish = 'publish',
  Unpublish = 'unpublish'
}

export enum Enum_Decision_Kind {
  Name = 'name',
  NewFlink = 'newFlink',
  NewWlink = 'newWlink',
  PendMatana = 'pendMatana',
  Pic = 'pic',
  Prides = 'prides',
  Pubdes = 'pubdes',
  TimtoM = 'timtoM',
  Vallueadd = 'vallueadd',
  Vallueles = 'vallueles'
}

export enum Enum_Forum_Spec {
  General = 'general',
  Spesifica = 'spesifica',
  Spesificm = 'spesificm'
}

export enum Enum_Mashaabim_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Matanot_Kindof {
  Daily = 'daily',
  Monthly = 'monthly',
  Total = 'total',
  Unlimited = 'unlimited',
  Yearly = 'yearly'
}

export enum Enum_Negomash_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Negotiation_Status {
  Active = 'active',
  Completed = 'completed',
  Paused = 'paused'
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

export enum Enum_Pmash_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
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

export enum Enum_Rikmash_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
}

export enum Enum_Sp_Kindof {
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Rent = 'rent',
  Total = 'total',
  Yearly = 'yearly'
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
  positions?: Maybe<PositionRelationResponseCollection>;
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


export type FiltertagPositionsArgs = {
  filters?: InputMaybe<PositionFiltersInput>;
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
  positions?: InputMaybe<PositionFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type FiltertagInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  positions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  iskvua?: Maybe<Scalars['Boolean']['output']>;
  mesimabetahalich?: Maybe<MesimabetahalichEntityResponse>;
  missname?: Maybe<Scalars['String']['output']>;
  month?: Maybe<Scalars['Date']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  what?: Maybe<UploadFileRelationResponseCollection>;
  why?: Maybe<Scalars['String']['output']>;
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
  id?: InputMaybe<IdFilterInput>;
  iskvua?: InputMaybe<BooleanFilterInput>;
  mesimabetahalich?: InputMaybe<MesimabetahalichFiltersInput>;
  missname?: InputMaybe<StringFilterInput>;
  month?: InputMaybe<DateFilterInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<FiniapruvalFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<FiniapruvalFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  why?: InputMaybe<StringFilterInput>;
};

export type FiniapruvalInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  finnished_mission?: InputMaybe<Scalars['ID']['input']>;
  iskvua?: InputMaybe<Scalars['Boolean']['input']>;
  mesimabetahalich?: InputMaybe<Scalars['ID']['input']>;
  missname?: InputMaybe<Scalars['String']['input']>;
  month?: InputMaybe<Scalars['Date']['input']>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
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
  asks?: Maybe<AskRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  decisions?: Maybe<DecisionRelationResponseCollection>;
  done: Scalars['Boolean']['output'];
  forum_last_seens?: Maybe<ForumLastSeenRelationResponseCollection>;
  haluka?: Maybe<HalukaEntityResponse>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  messages?: Maybe<MessageRelationResponseCollection>;
  pgisha?: Maybe<PgishaEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
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


export type ForumForum_Last_SeensArgs = {
  filters?: InputMaybe<ForumLastSeenFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
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
  asks?: InputMaybe<AskFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  decisions?: InputMaybe<DecisionFiltersInput>;
  done?: InputMaybe<BooleanFilterInput>;
  forum_last_seens?: InputMaybe<ForumLastSeenFiltersInput>;
  haluka?: InputMaybe<HalukaFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  messages?: InputMaybe<MessageFiltersInput>;
  not?: InputMaybe<ForumFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ForumFiltersInput>>>;
  pgisha?: InputMaybe<PgishaFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  sheirutpend?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  spec?: InputMaybe<StringFilterInput>;
  subject?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ForumInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  asks?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  decisions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  forum_last_seens?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  haluka?: InputMaybe<Scalars['ID']['input']>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  messages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgisha?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
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

export type GenericMorph = Act | Actt | Ask | Askm | Askwant | Bakasha | Category | Chezin | ComponentDesisionEditPend | ComponentDesisionNegodes | ComponentDesisionNegom | ComponentNewEdits | ComponentNewMeeting | ComponentNewMonter | ComponentNewNego | ComponentNewNegom | ComponentNewSeen | ComponentNewTimes | ComponentNewUserAndIshur | ComponentProjectsChatre | ComponentProjectsHervachti | ComponentProjectsIGotMoney | ComponentProjectsMeeting | ComponentProjectsMonter | ComponentProjectsNegodes | ComponentProjectsPendmnego | ComponentProjectsShift | ComponentProjectsTaskdis | ComponentProjectsUsersOf | ComponentProjectsVots | ContentReleasesRelease | ContentReleasesReleaseAction | ConventionText | Cuntry | Dea | Deal | Decision | Deffinition | Filtertag | Finiapruval | FinnishedMission | Forum | ForumLastSeen | Haamada | Haamadapruv | Haluka | Hatzaa | Hazbaah | I18NLocale | Maap | Machshir | Mashaabim | Mashabetahalich | Matanot | Matbea | Mesimabetahalich | Message | Mission | Mode | Monter | Nego | NegoMash | Negopendmission | Negotiation | OpenMashaabim | OpenMission | Partof | Pendm | Pgisha | Pgishauser | Pgishauserpend | Pmash | Position | Project | Ratson | Richtext | Rikmash | Sale | Seeder | Sheirut | Sheirutnego | Sheirutpend | Sidur | Skill | Solution | Sp | Tafkidim | Tikunolam | Timegrama | Timer | Tosplit | Translate | UploadFile | UploadFolder | UsersPermissionsPermission | UsersPermissionsRole | UsersPermissionsUser | Vallue | Vote | Want | WelcomTop | Whatandwhy | WorkWay | Yat | Zohar;

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
  amount?: Maybe<Scalars['Float']['output']>;
  chatre?: Maybe<Array<Maybe<ComponentProjectsChatre>>>;
  confirmed: Scalars['Boolean']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  forum?: Maybe<ForumEntityResponse>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<HalukaRelationResponseCollection>;
  matbea?: Maybe<MatbeaEntityResponse>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  senderconf?: Maybe<Scalars['Boolean']['output']>;
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
  amount?: InputMaybe<FloatFilterInput>;
  and?: InputMaybe<Array<InputMaybe<HalukaFiltersInput>>>;
  chatre?: InputMaybe<ComponentProjectsChatreFiltersInput>;
  confirmed?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  forum?: InputMaybe<ForumFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<HalukaFiltersInput>;
  matbea?: InputMaybe<MatbeaFiltersInput>;
  not?: InputMaybe<HalukaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<HalukaFiltersInput>>>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  senderconf?: InputMaybe<BooleanFilterInput>;
  tosplit?: InputMaybe<TosplitFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  userrecive?: InputMaybe<UsersPermissionsUserFiltersInput>;
  usersend?: InputMaybe<UsersPermissionsUserFiltersInput>;
  ushar?: InputMaybe<BooleanFilterInput>;
  want?: InputMaybe<WantFiltersInput>;
};

export type HalukaInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  chatre?: InputMaybe<Array<InputMaybe<ComponentProjectsChatreInput>>>;
  confirmed?: InputMaybe<Scalars['Boolean']['input']>;
  forum?: InputMaybe<Scalars['ID']['input']>;
  matbea?: InputMaybe<Scalars['ID']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  senderconf?: InputMaybe<Scalars['Boolean']['input']>;
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
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MaapRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  rikmash?: Maybe<RikmashEntityResponse>;
  sp?: Maybe<SpEntityResponse>;
  timegrama?: Maybe<TimegramaEntityResponse>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  vots?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
};


export type MaapLocalizationsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MaapPartofsArgs = {
  filters?: InputMaybe<PartofFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
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
  id?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MaapFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MaapFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MaapFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  rikmash?: InputMaybe<RikmashFiltersInput>;
  sp?: InputMaybe<SpFiltersInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type MaapInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  rikmash?: InputMaybe<Scalars['ID']['input']>;
  sp?: InputMaybe<Scalars['ID']['input']>;
  timegrama?: InputMaybe<Scalars['ID']['input']>;
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  hoursassigned?: Maybe<Scalars['Float']['output']>;
  howmanyhoursalready?: Maybe<Scalars['Float']['output']>;
  perhour?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  timers?: Maybe<TimerRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
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
  and?: InputMaybe<Array<InputMaybe<MashabetahalichFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  hoursassigned?: InputMaybe<FloatFilterInput>;
  howmanyhoursalready?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<MashabetahalichFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MashabetahalichFiltersInput>>>;
  perhour?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  timers?: InputMaybe<TimerFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MashabetahalichInput = {
  hoursassigned?: InputMaybe<Scalars['Float']['input']>;
  howmanyhoursalready?: InputMaybe<Scalars['Float']['input']>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  timers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type Matanot = {
  __typename?: 'Matanot';
  appruved?: Maybe<Scalars['Boolean']['output']>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  bakashas?: Maybe<BakashaRelationResponseCollection>;
  categories?: Maybe<CategoryRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  decision?: Maybe<DecisionEntityResponse>;
  desc?: Maybe<Scalars['JSON']['output']>;
  finnishDate?: Maybe<Scalars['DateTime']['output']>;
  fixPrice?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Matanot_Kindof>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MatanotRelationResponseCollection>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
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
  projectcreates?: Maybe<ProjectRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quant?: Maybe<Scalars['Float']['output']>;
  sale?: Maybe<SaleRelationResponseCollection>;
  sales?: Maybe<Scalars['Float']['output']>;
  sheirutpends?: Maybe<SheirutpendRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
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


export type MatanotSaleArgs = {
  filters?: InputMaybe<SaleFiltersInput>;
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
  decision?: InputMaybe<DecisionFiltersInput>;
  desc?: InputMaybe<JsonFilterInput>;
  finnishDate?: InputMaybe<DateTimeFilterInput>;
  fixPrice?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MatanotFiltersInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
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
  projectcreates?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quant?: InputMaybe<FloatFilterInput>;
  sale?: InputMaybe<SaleFiltersInput>;
  sales?: InputMaybe<FloatFilterInput>;
  sheirutpends?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MatanotInput = {
  appruved?: InputMaybe<Scalars['Boolean']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  bakashas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  decision?: InputMaybe<Scalars['ID']['input']>;
  desc?: InputMaybe<Scalars['JSON']['input']>;
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  fixPrice?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Matanot_Kindof>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  projectcreates?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quant?: InputMaybe<Scalars['Float']['input']>;
  sale?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sales?: InputMaybe<Scalars['Float']['input']>;
  sheirutpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type MatanotRelationResponseCollection = {
  __typename?: 'MatanotRelationResponseCollection';
  data: Array<MatanotEntity>;
};

export type Matbea = {
  __typename?: 'Matbea';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  halukas?: Maybe<HalukaRelationResponseCollection>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<MatbeaRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
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
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MatbeaFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MatbeaFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  simbol?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MatbeaInput = {
  halukas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
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
  mission?: Maybe<MissionEntityResponse>;
  monter?: Maybe<Array<Maybe<ComponentNewMonter>>>;
  monters?: Maybe<MonterRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  perhour?: Maybe<Scalars['Float']['output']>;
  privatlinks?: Maybe<Scalars['String']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publicklinks?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  seeders?: Maybe<SeederRelationResponseCollection>;
  start?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  stname: Scalars['String']['output'];
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  timegramas?: Maybe<TimegramaRelationResponseCollection>;
  timer?: Maybe<Scalars['Float']['output']>;
  timers?: Maybe<TimerRelationResponseCollection>;
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
  mission?: InputMaybe<MissionFiltersInput>;
  monter?: InputMaybe<ComponentNewMonterFiltersInput>;
  monters?: InputMaybe<MonterFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MesimabetahalichFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MesimabetahalichFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  perhour?: InputMaybe<FloatFilterInput>;
  privatlinks?: InputMaybe<StringFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publicklinks?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  seeders?: InputMaybe<SeederFiltersInput>;
  start?: InputMaybe<DateTimeFilterInput>;
  status?: InputMaybe<IntFilterInput>;
  stname?: InputMaybe<StringFilterInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  timegramas?: InputMaybe<TimegramaFiltersInput>;
  timer?: InputMaybe<FloatFilterInput>;
  timers?: InputMaybe<TimerFiltersInput>;
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
  mission?: InputMaybe<Scalars['ID']['input']>;
  monter?: InputMaybe<Array<InputMaybe<ComponentNewMonterInput>>>;
  monters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  privatlinks?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publicklinks?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  seeders?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<Scalars['Int']['input']>;
  stname?: InputMaybe<Scalars['String']['input']>;
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  timegramas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  timer?: InputMaybe<Scalars['Float']['input']>;
  timers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  finnished_missions?: Maybe<FinnishedMissionRelationResponseCollection>;
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
  tafkidims?: Maybe<TafkidimRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
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
  finnished_missions?: InputMaybe<FinnishedMissionFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
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
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
};

export type MissionInput = {
  descrip?: InputMaybe<Scalars['String']['input']>;
  finnished_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  tafkidims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  createAsk?: Maybe<AskEntityResponse>;
  createAskm?: Maybe<AskmEntityResponse>;
  createAskwant?: Maybe<AskwantEntityResponse>;
  createBakasha?: Maybe<BakashaEntityResponse>;
  createCategory?: Maybe<CategoryEntityResponse>;
  createCategoryLocalization?: Maybe<CategoryEntityResponse>;
  createChezin?: Maybe<ChezinEntityResponse>;
  createChezinLocalization?: Maybe<ChezinEntityResponse>;
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
  createMaap?: Maybe<MaapEntityResponse>;
  createMaapLocalization?: Maybe<MaapEntityResponse>;
  createMachshir?: Maybe<MachshirEntityResponse>;
  createMashaabim?: Maybe<MashaabimEntityResponse>;
  createMashaabimLocalization?: Maybe<MashaabimEntityResponse>;
  createMashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  createMatanot?: Maybe<MatanotEntityResponse>;
  createMatanotLocalization?: Maybe<MatanotEntityResponse>;
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
  createRatson?: Maybe<RatsonEntityResponse>;
  createRatsonLocalization?: Maybe<RatsonEntityResponse>;
  createRichtext?: Maybe<RichtextEntityResponse>;
  createRichtextLocalization?: Maybe<RichtextEntityResponse>;
  createRikmash?: Maybe<RikmashEntityResponse>;
  createSale?: Maybe<SaleEntityResponse>;
  createSeeder?: Maybe<SeederEntityResponse>;
  createSheirut?: Maybe<SheirutEntityResponse>;
  createSheirutLocalization?: Maybe<SheirutEntityResponse>;
  createSheirutnego?: Maybe<SheirutnegoEntityResponse>;
  createSheirutpend?: Maybe<SheirutpendEntityResponse>;
  createSheirutpendLocalization?: Maybe<SheirutpendEntityResponse>;
  createSidur?: Maybe<SidurEntityResponse>;
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
  deleteAsk?: Maybe<AskEntityResponse>;
  deleteAskm?: Maybe<AskmEntityResponse>;
  deleteAskwant?: Maybe<AskwantEntityResponse>;
  deleteBakasha?: Maybe<BakashaEntityResponse>;
  deleteCategory?: Maybe<CategoryEntityResponse>;
  deleteChezin?: Maybe<ChezinEntityResponse>;
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
  deleteMaap?: Maybe<MaapEntityResponse>;
  deleteMachshir?: Maybe<MachshirEntityResponse>;
  deleteMashaabim?: Maybe<MashaabimEntityResponse>;
  deleteMashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  deleteMatanot?: Maybe<MatanotEntityResponse>;
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
  deleteRatson?: Maybe<RatsonEntityResponse>;
  deleteRichtext?: Maybe<RichtextEntityResponse>;
  deleteRikmash?: Maybe<RikmashEntityResponse>;
  deleteSale?: Maybe<SaleEntityResponse>;
  deleteSeeder?: Maybe<SeederEntityResponse>;
  deleteSheirut?: Maybe<SheirutEntityResponse>;
  deleteSheirutnego?: Maybe<SheirutnegoEntityResponse>;
  deleteSheirutpend?: Maybe<SheirutpendEntityResponse>;
  deleteSidur?: Maybe<SidurEntityResponse>;
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
  updateAsk?: Maybe<AskEntityResponse>;
  updateAskm?: Maybe<AskmEntityResponse>;
  updateAskwant?: Maybe<AskwantEntityResponse>;
  updateBakasha?: Maybe<BakashaEntityResponse>;
  updateCategory?: Maybe<CategoryEntityResponse>;
  updateChezin?: Maybe<ChezinEntityResponse>;
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
  updateMaap?: Maybe<MaapEntityResponse>;
  updateMachshir?: Maybe<MachshirEntityResponse>;
  updateMashaabim?: Maybe<MashaabimEntityResponse>;
  updateMashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  updateMatanot?: Maybe<MatanotEntityResponse>;
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
  updateRatson?: Maybe<RatsonEntityResponse>;
  updateRichtext?: Maybe<RichtextEntityResponse>;
  updateRikmash?: Maybe<RikmashEntityResponse>;
  updateSale?: Maybe<SaleEntityResponse>;
  updateSeeder?: Maybe<SeederEntityResponse>;
  updateSheirut?: Maybe<SheirutEntityResponse>;
  updateSheirutnego?: Maybe<SheirutnegoEntityResponse>;
  updateSheirutpend?: Maybe<SheirutpendEntityResponse>;
  updateSidur?: Maybe<SidurEntityResponse>;
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


export type MutationCreateRatsonArgs = {
  data: RatsonInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateRatsonLocalizationArgs = {
  data?: InputMaybe<RatsonInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
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


export type MutationDeleteRatsonArgs = {
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
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


export type MutationUpdateRatsonArgs = {
  data: RatsonInput;
  id: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  des?: Maybe<Scalars['JSON']['output']>;
  fixprice?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Nego_Kindof>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  matanot?: Maybe<MatanotEntityResponse>;
  missions?: Maybe<MissionRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  quant?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  votes?: Maybe<VoteRelationResponseCollection>;
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
  and?: InputMaybe<Array<InputMaybe<NegoFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  des?: InputMaybe<JsonFilterInput>;
  fixprice?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  matanot?: InputMaybe<MatanotFiltersInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<NegoFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegoFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  quant?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  votes?: InputMaybe<VoteFiltersInput>;
};

export type NegoInput = {
  des?: InputMaybe<Scalars['JSON']['input']>;
  fixprice?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Nego_Kindof>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanot?: InputMaybe<Scalars['ID']['input']>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  quant?: InputMaybe<Scalars['Float']['input']>;
  votes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type NegoMash = {
  __typename?: 'NegoMash';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  easy?: Maybe<Scalars['Float']['output']>;
  hm?: Maybe<Scalars['Float']['output']>;
  isOriginal?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Negomash_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  pmash?: Maybe<PmashEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  spnot?: Maybe<Scalars['String']['output']>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualedf?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
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
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  easy?: InputMaybe<FloatFilterInput>;
  hm?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isOriginal?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<NegoMashFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegoMashFiltersInput>>>;
  pmash?: InputMaybe<PmashFiltersInput>;
  price?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualedf?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type NegoMashInput = {
  descrip?: InputMaybe<Scalars['String']['input']>;
  easy?: InputMaybe<Scalars['Float']['input']>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  isOriginal?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Negomash_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  sqadualedf?: InputMaybe<Scalars['DateTime']['input']>;
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
  name?: Maybe<Scalars['String']['output']>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
  pendm?: Maybe<PendmEntityResponse>;
  perhour?: Maybe<Scalars['Float']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  skills?: Maybe<SkillRelationResponseCollection>;
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
  name?: InputMaybe<StringFilterInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<NegopendmissionFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegopendmissionFiltersInput>>>;
  pendm?: InputMaybe<PendmFiltersInput>;
  perhour?: InputMaybe<FloatFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  skills?: InputMaybe<SkillFiltersInput>;
  tafkidims?: InputMaybe<TafkidimFiltersInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vots?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  work_ways?: InputMaybe<WorkWayFiltersInput>;
};

export type NegopendmissionInput = {
  acts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  date?: InputMaybe<Scalars['DateTime']['input']>;
  dates?: InputMaybe<Scalars['DateTime']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  filds?: InputMaybe<ComponentNewNegoInput>;
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  howMany?: InputMaybe<Scalars['Long']['input']>;
  isMonth?: InputMaybe<Scalars['Boolean']['input']>;
  isOriginal?: InputMaybe<Scalars['Boolean']['input']>;
  isRishon?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
  pendm?: InputMaybe<Scalars['ID']['input']>;
  perhour?: InputMaybe<Scalars['Float']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdByEmail?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<UsersPermissionsUserEntityResponse>;
  currentRound?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  maxRounds?: Maybe<Scalars['Int']['output']>;
  participants?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  positions?: Maybe<PositionRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Enum_Negotiation_Status>;
  topic?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
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
  createdAt?: InputMaybe<DateTimeFilterInput>;
  createdByEmail?: InputMaybe<StringFilterInput>;
  creator?: InputMaybe<UsersPermissionsUserFiltersInput>;
  currentRound?: InputMaybe<IntFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  maxRounds?: InputMaybe<IntFilterInput>;
  not?: InputMaybe<NegotiationFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<NegotiationFiltersInput>>>;
  participants?: InputMaybe<UsersPermissionsUserFiltersInput>;
  positions?: InputMaybe<PositionFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  status?: InputMaybe<StringFilterInput>;
  topic?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type NegotiationInput = {
  createdByEmail?: InputMaybe<Scalars['String']['input']>;
  creator?: InputMaybe<Scalars['ID']['input']>;
  currentRound?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  maxRounds?: InputMaybe<Scalars['Int']['input']>;
  participants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  positions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<Enum_Negotiation_Status>;
  topic?: InputMaybe<Scalars['String']['input']>;
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
  maap?: Maybe<MaapEntityResponse>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  partofs?: Maybe<PartofRelationResponseCollection>;
  pmash?: Maybe<PmashEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  rikmashes?: Maybe<RikmashRelationResponseCollection>;
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
  maap?: InputMaybe<MaapFiltersInput>;
  mashaabim?: InputMaybe<MashaabimFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<OpenMashaabimFiltersInput>>>;
  partofs?: InputMaybe<PartofFiltersInput>;
  pmash?: InputMaybe<PmashFiltersInput>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  rikmashes?: InputMaybe<RikmashFiltersInput>;
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
  maap?: InputMaybe<Scalars['ID']['input']>;
  mashaabim?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  partofs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pmash?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  rikmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  rishon?: Maybe<UsersPermissionsUserEntityResponse>;
  rishonves?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  skills?: Maybe<SkillRelationResponseCollection>;
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
  rishon?: InputMaybe<UsersPermissionsUserFiltersInput>;
  rishonves?: InputMaybe<UsersPermissionsUserFiltersInput>;
  skills?: InputMaybe<SkillFiltersInput>;
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
  rishon?: InputMaybe<Scalars['ID']['input']>;
  rishonves?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  skills?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  default?: Maybe<Scalars['Boolean']['output']>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  matanots?: Maybe<MatanotRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  open_mashaabims?: Maybe<OpenMashaabimRelationResponseCollection>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type PartofMaapsArgs = {
  filters?: InputMaybe<MaapFiltersInput>;
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
  and?: InputMaybe<Array<InputMaybe<PartofFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  default?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  matanots?: InputMaybe<MatanotFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  not?: InputMaybe<PartofFiltersInput>;
  open_mashaabims?: InputMaybe<OpenMashaabimFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PartofFiltersInput>>>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type PartofInput = {
  default?: InputMaybe<Scalars['Boolean']['input']>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  matanots?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  hearotMeyuchadot?: Maybe<Scalars['String']['output']>;
  howMeny?: Maybe<Scalars['Long']['output']>;
  isLast?: Maybe<Scalars['Boolean']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  isglobal?: Maybe<Scalars['Boolean']['output']>;
  iskvua?: Maybe<Scalars['Boolean']['output']>;
  isshift?: Maybe<Scalars['Boolean']['output']>;
  mission?: Maybe<MissionEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  nego?: Maybe<Array<Maybe<ComponentNewNego>>>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  noofhours?: Maybe<Scalars['Float']['output']>;
  open_mission?: Maybe<OpenMissionEntityResponse>;
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
  hearotMeyuchadot?: InputMaybe<StringFilterInput>;
  howMeny?: InputMaybe<LongFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isLast?: InputMaybe<BooleanFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  isglobal?: InputMaybe<BooleanFilterInput>;
  iskvua?: InputMaybe<BooleanFilterInput>;
  isshift?: InputMaybe<BooleanFilterInput>;
  mission?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  nego?: InputMaybe<ComponentNewNegoFiltersInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  noofhours?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<PendmFiltersInput>;
  open_mission?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PendmFiltersInput>>>;
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
  hearotMeyuchadot?: InputMaybe<Scalars['String']['input']>;
  howMeny?: InputMaybe<Scalars['Long']['input']>;
  isLast?: InputMaybe<Scalars['Boolean']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  isglobal?: InputMaybe<Scalars['Boolean']['input']>;
  iskvua?: InputMaybe<Scalars['Boolean']['input']>;
  isshift?: InputMaybe<Scalars['Boolean']['input']>;
  mission?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nego?: InputMaybe<Array<InputMaybe<ComponentNewNegoInput>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  noofhours?: InputMaybe<Scalars['Float']['input']>;
  open_mission?: InputMaybe<Scalars['ID']['input']>;
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  descrip?: Maybe<Scalars['String']['output']>;
  diun?: Maybe<Array<Maybe<ComponentProjectsVots>>>;
  easy?: Maybe<Scalars['Float']['output']>;
  hm?: Maybe<Scalars['Float']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Pmash_Kindof>;
  linkto?: Maybe<Scalars['String']['output']>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  nego_mashes?: Maybe<NegoMashRelationResponseCollection>;
  negom?: Maybe<Array<Maybe<ComponentNewNegom>>>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
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
  createdAt?: InputMaybe<DateTimeFilterInput>;
  descrip?: InputMaybe<StringFilterInput>;
  diun?: InputMaybe<ComponentProjectsVotsFiltersInput>;
  easy?: InputMaybe<FloatFilterInput>;
  hm?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  linkto?: InputMaybe<StringFilterInput>;
  mashaabim?: InputMaybe<MashaabimFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  nego_mashes?: InputMaybe<NegoMashFiltersInput>;
  negom?: InputMaybe<ComponentNewNegomFiltersInput>;
  not?: InputMaybe<PmashFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PmashFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualedf?: InputMaybe<DateTimeFilterInput>;
  timegrama?: InputMaybe<TimegramaFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<ComponentProjectsVotsFiltersInput>;
};

export type PmashInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  diun?: InputMaybe<Array<InputMaybe<ComponentProjectsVotsInput>>>;
  easy?: InputMaybe<Scalars['Float']['input']>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Pmash_Kindof>;
  linkto?: InputMaybe<Scalars['String']['input']>;
  mashaabim?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nego_mashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negom?: InputMaybe<Array<InputMaybe<ComponentNewNegomInput>>>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
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
  aiMeta?: Maybe<Scalars['String']['output']>;
  author?: Maybe<UsersPermissionsUserEntityResponse>;
  authorEmail?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  heading?: Maybe<Scalars['String']['output']>;
  intensity?: Maybe<Scalars['Int']['output']>;
  location?: Maybe<Scalars['Float']['output']>;
  negotiation?: Maybe<NegotiationEntityResponse>;
  order?: Maybe<Scalars['Int']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  tags?: Maybe<FiltertagRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  voters?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  votes?: Maybe<Scalars['Int']['output']>;
};


export type PositionTagsArgs = {
  filters?: InputMaybe<FiltertagFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PositionVotersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
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
  aiMeta?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<PositionFiltersInput>>>;
  author?: InputMaybe<UsersPermissionsUserFiltersInput>;
  authorEmail?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  heading?: InputMaybe<StringFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  intensity?: InputMaybe<IntFilterInput>;
  location?: InputMaybe<FloatFilterInput>;
  negotiation?: InputMaybe<NegotiationFiltersInput>;
  not?: InputMaybe<PositionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PositionFiltersInput>>>;
  order?: InputMaybe<IntFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  tags?: InputMaybe<FiltertagFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  voters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  votes?: InputMaybe<IntFilterInput>;
};

export type PositionInput = {
  aiMeta?: InputMaybe<Scalars['String']['input']>;
  author?: InputMaybe<Scalars['ID']['input']>;
  authorEmail?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  heading?: InputMaybe<Scalars['String']['input']>;
  intensity?: InputMaybe<Scalars['Int']['input']>;
  location?: InputMaybe<Scalars['Float']['input']>;
  negotiation?: InputMaybe<Scalars['ID']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  voters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  isMachzikim?: Maybe<Scalars['Boolean']['output']>;
  isMachzikimPublik?: Maybe<Scalars['Boolean']['output']>;
  isOt?: Maybe<Scalars['Boolean']['output']>;
  linkToWebsite?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<ProjectRelationResponseCollection>;
  maaps?: Maybe<MaapRelationResponseCollection>;
  machshirs?: Maybe<MachshirRelationResponseCollection>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
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
  restime?: Maybe<Enum_Project_Restime>;
  rikmashes?: Maybe<RikmashRelationResponseCollection>;
  sales?: Maybe<SaleRelationResponseCollection>;
  sheirutpends?: Maybe<SheirutpendRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
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
  id?: InputMaybe<IdFilterInput>;
  isMachzikim?: InputMaybe<BooleanFilterInput>;
  isMachzikimPublik?: InputMaybe<BooleanFilterInput>;
  isOt?: InputMaybe<BooleanFilterInput>;
  linkToWebsite?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<ProjectFiltersInput>;
  maaps?: InputMaybe<MaapFiltersInput>;
  machshirs?: InputMaybe<MachshirFiltersInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
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
  restime?: InputMaybe<StringFilterInput>;
  rikmashes?: InputMaybe<RikmashFiltersInput>;
  sales?: InputMaybe<SaleFiltersInput>;
  sheirutpends?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
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
  isMachzikim?: InputMaybe<Scalars['Boolean']['input']>;
  isMachzikimPublik?: InputMaybe<Scalars['Boolean']['input']>;
  isOt?: InputMaybe<Scalars['Boolean']['input']>;
  linkToWebsite?: InputMaybe<Scalars['String']['input']>;
  maaps?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  machshirs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  restime?: InputMaybe<Enum_Project_Restime>;
  rikmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sales?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  maap?: Maybe<MaapEntityResponse>;
  maaps?: Maybe<MaapEntityResponseCollection>;
  machshir?: Maybe<MachshirEntityResponse>;
  machshirs?: Maybe<MachshirEntityResponseCollection>;
  mashaabim?: Maybe<MashaabimEntityResponse>;
  mashaabims?: Maybe<MashaabimEntityResponseCollection>;
  mashabetahalich?: Maybe<MashabetahalichEntityResponse>;
  mashabetahaliches?: Maybe<MashabetahalichEntityResponseCollection>;
  matanot?: Maybe<MatanotEntityResponse>;
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
  ratson?: Maybe<RatsonEntityResponse>;
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
  sheirutnego?: Maybe<SheirutnegoEntityResponse>;
  sheirutnegos?: Maybe<SheirutnegoEntityResponseCollection>;
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
  sheirutpends?: Maybe<SheirutpendEntityResponseCollection>;
  sheiruts?: Maybe<SheirutEntityResponseCollection>;
  sidur?: Maybe<SidurEntityResponse>;
  sidurs?: Maybe<SidurEntityResponseCollection>;
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


export type QueryRatsonArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
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
  allowJoin?: Maybe<Scalars['Boolean']['output']>;
  bounti?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  desc?: Maybe<Scalars['String']['output']>;
  finnishDate?: Maybe<Scalars['DateTime']['output']>;
  fulfilled?: Maybe<Scalars['Boolean']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations?: Maybe<RatsonRelationResponseCollection>;
  logo?: Maybe<UploadFileEntityResponse>;
  longDes?: Maybe<Scalars['String']['output']>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  missions?: Maybe<MissionRelationResponseCollection>;
  name?: Maybe<Scalars['String']['output']>;
  pics?: Maybe<UploadFileRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  totalbounti?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_users?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  vallues?: Maybe<VallueRelationResponseCollection>;
};


export type RatsonLocalizationsArgs = {
  filters?: InputMaybe<RatsonFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RatsonMashaabimsArgs = {
  filters?: InputMaybe<MashaabimFiltersInput>;
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


export type RatsonPicsArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
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
  allowJoin?: InputMaybe<BooleanFilterInput>;
  and?: InputMaybe<Array<InputMaybe<RatsonFiltersInput>>>;
  bounti?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  desc?: InputMaybe<StringFilterInput>;
  finnishDate?: InputMaybe<DateTimeFilterInput>;
  fulfilled?: InputMaybe<BooleanFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  link?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<RatsonFiltersInput>;
  longDes?: InputMaybe<StringFilterInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  missions?: InputMaybe<MissionFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<RatsonFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RatsonFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  totalbounti?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  vallues?: InputMaybe<VallueFiltersInput>;
};

export type RatsonInput = {
  allowJoin?: InputMaybe<Scalars['Boolean']['input']>;
  bounti?: InputMaybe<Scalars['Boolean']['input']>;
  desc?: InputMaybe<Scalars['String']['input']>;
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  fulfilled?: InputMaybe<Scalars['Boolean']['input']>;
  link?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['ID']['input']>;
  longDes?: InputMaybe<Scalars['String']['input']>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  pics?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  totalbounti?: InputMaybe<Scalars['Float']['input']>;
  users_permissions_users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  vallues?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type RatsonRelationResponseCollection = {
  __typename?: 'RatsonRelationResponseCollection';
  data: Array<RatsonEntity>;
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
  haamadas?: Maybe<HaamadaRelationResponseCollection>;
  hm?: Maybe<Scalars['Float']['output']>;
  isMust?: Maybe<Scalars['Boolean']['output']>;
  isYesod?: Maybe<Scalars['Boolean']['output']>;
  kindOf?: Maybe<Enum_Rikmash_Kindof>;
  maap?: Maybe<MaapEntityResponse>;
  name?: Maybe<Scalars['String']['output']>;
  open_mashaabim?: Maybe<OpenMashaabimEntityResponse>;
  price?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  sp?: Maybe<SpEntityResponse>;
  spnot?: Maybe<Scalars['String']['output']>;
  sqadualed?: Maybe<Scalars['DateTime']['output']>;
  sqadualef?: Maybe<Scalars['DateTime']['output']>;
  total?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users_permissions_user?: Maybe<UsersPermissionsUserEntityResponse>;
};


export type RikmashHaamadasArgs = {
  filters?: InputMaybe<HaamadaFiltersInput>;
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
  haamadas?: InputMaybe<HaamadaFiltersInput>;
  hm?: InputMaybe<FloatFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isMust?: InputMaybe<BooleanFilterInput>;
  isYesod?: InputMaybe<BooleanFilterInput>;
  kindOf?: InputMaybe<StringFilterInput>;
  maap?: InputMaybe<MaapFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<RikmashFiltersInput>;
  open_mashaabim?: InputMaybe<OpenMashaabimFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RikmashFiltersInput>>>;
  price?: InputMaybe<FloatFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  sp?: InputMaybe<SpFiltersInput>;
  spnot?: InputMaybe<StringFilterInput>;
  sqadualed?: InputMaybe<DateTimeFilterInput>;
  sqadualef?: InputMaybe<DateTimeFilterInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type RikmashInput = {
  agprice?: InputMaybe<Scalars['Float']['input']>;
  haamadas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  hm?: InputMaybe<Scalars['Float']['input']>;
  isMust?: InputMaybe<Scalars['Boolean']['input']>;
  isYesod?: InputMaybe<Scalars['Boolean']['input']>;
  kindOf?: InputMaybe<Enum_Rikmash_Kindof>;
  maap?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  open_mashaabim?: InputMaybe<Scalars['ID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  sp?: InputMaybe<Scalars['ID']['input']>;
  spnot?: InputMaybe<Scalars['String']['input']>;
  sqadualed?: InputMaybe<Scalars['DateTime']['input']>;
  sqadualef?: InputMaybe<Scalars['DateTime']['input']>;
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
  matanot?: Maybe<MatanotEntityResponse>;
  monters?: Maybe<MonterRelationResponseCollection>;
  note?: Maybe<Scalars['String']['output']>;
  pending?: Maybe<Scalars['Boolean']['output']>;
  project?: Maybe<ProjectEntityResponse>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
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
  matanot?: InputMaybe<MatanotFiltersInput>;
  monters?: InputMaybe<MonterFiltersInput>;
  not?: InputMaybe<SaleFiltersInput>;
  note?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<SaleFiltersInput>>>;
  pending?: InputMaybe<BooleanFilterInput>;
  project?: InputMaybe<ProjectFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
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
  matanot?: InputMaybe<Scalars['ID']['input']>;
  monters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  note?: InputMaybe<Scalars['String']['input']>;
  pending?: InputMaybe<Scalars['Boolean']['input']>;
  project?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  iCanGetMonay?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  iGotIt?: Maybe<Scalars['Boolean']['output']>;
  iGotMoney?: Maybe<Array<Maybe<ComponentProjectsIGotMoney>>>;
  iTransferMoney?: Maybe<Scalars['Boolean']['output']>;
  iTransferedTo?: Maybe<UsersPermissionsUserRelationResponseCollection>;
  isApruved?: Maybe<Scalars['Boolean']['output']>;
  isItOnlyOneInProject?: Maybe<Scalars['Boolean']['output']>;
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
  sheirutpend?: Maybe<SheirutpendEntityResponse>;
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
  iCanGetMonay?: InputMaybe<UsersPermissionsUserFiltersInput>;
  iGotIt?: InputMaybe<BooleanFilterInput>;
  iGotMoney?: InputMaybe<ComponentProjectsIGotMoneyFiltersInput>;
  iTransferMoney?: InputMaybe<BooleanFilterInput>;
  iTransferedTo?: InputMaybe<UsersPermissionsUserFiltersInput>;
  id?: InputMaybe<IdFilterInput>;
  isApruved?: InputMaybe<BooleanFilterInput>;
  isItOnlyOneInProject?: InputMaybe<BooleanFilterInput>;
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
  sheirutpend?: InputMaybe<SheirutpendFiltersInput>;
  startDate?: InputMaybe<DateTimeFilterInput>;
  total?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users_permissions_users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  wants?: InputMaybe<WantFiltersInput>;
  weFinnish?: InputMaybe<VoteFiltersInput>;
};

export type SheirutInput = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  askwants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  descrip?: InputMaybe<Scalars['String']['input']>;
  equaliSplited?: InputMaybe<Scalars['Boolean']['input']>;
  finnishDate?: InputMaybe<Scalars['DateTime']['input']>;
  forums?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  iCanGetMonay?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  iGotIt?: InputMaybe<Scalars['Boolean']['input']>;
  iGotMoney?: InputMaybe<Array<InputMaybe<ComponentProjectsIGotMoneyInput>>>;
  iTransferMoney?: InputMaybe<Scalars['Boolean']['input']>;
  iTransferedTo?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  isApruved?: InputMaybe<Scalars['Boolean']['input']>;
  isItOnlyOneInProject?: InputMaybe<Scalars['Boolean']['input']>;
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
  sheirutpend?: InputMaybe<Scalars['ID']['input']>;
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
  sales?: Maybe<SaleRelationResponseCollection>;
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
  sales?: InputMaybe<SaleFiltersInput>;
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
  sales?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  arr1?: Maybe<Scalars['JSON']['output']>;
  arrdate?: Maybe<Scalars['DateTime']['output']>;
  askeds?: Maybe<OpenMissionRelationResponseCollection>;
  askms?: Maybe<AskmRelationResponseCollection>;
  asks?: Maybe<AskRelationResponseCollection>;
  askwants?: Maybe<AskwantRelationResponseCollection>;
  bio?: Maybe<Scalars['String']['output']>;
  blocked?: Maybe<Scalars['Boolean']['output']>;
  chezin?: Maybe<ChezinEntityResponse>;
  city?: Maybe<Scalars['String']['output']>;
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cuntries?: Maybe<CuntryRelationResponseCollection>;
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
  levManualAlready?: Maybe<Scalars['Boolean']['output']>;
  machshirs?: Maybe<MachshirRelationResponseCollection>;
  mashaabims?: Maybe<MashaabimRelationResponseCollection>;
  mesimabetahaliches?: Maybe<MesimabetahalichRelationResponseCollection>;
  messages?: Maybe<MessageRelationResponseCollection>;
  moachManualAlready?: Maybe<Scalars['Boolean']['output']>;
  nego_mashes?: Maybe<NegoMashRelationResponseCollection>;
  negopendmissions?: Maybe<NegopendmissionRelationResponseCollection>;
  negotiations?: Maybe<NegotiationRelationResponseCollection>;
  negotiationsIparticipante?: Maybe<NegotiationRelationResponseCollection>;
  noMail?: Maybe<Scalars['Boolean']['output']>;
  noOfHoursProject1?: Maybe<Scalars['Float']['output']>;
  open_missions?: Maybe<OpenMissionRelationResponseCollection>;
  pendms?: Maybe<PendmRelationResponseCollection>;
  pendmsforme?: Maybe<PendmRelationResponseCollection>;
  pgishas?: Maybe<PgishaRelationResponseCollection>;
  pgishasPendStrat?: Maybe<PgishaRelationResponseCollection>;
  pgishauserpends?: Maybe<PgishauserpendRelationResponseCollection>;
  pgishausers?: Maybe<PgishauserRelationResponseCollection>;
  positionsAuthor?: Maybe<PositionRelationResponseCollection>;
  positionsVoted?: Maybe<PositionRelationResponseCollection>;
  preferCards?: Maybe<Scalars['Boolean']['output']>;
  profilManualAlready?: Maybe<Scalars['Boolean']['output']>;
  profilePic?: Maybe<UploadFileEntityResponse>;
  projects_1s?: Maybe<ProjectRelationResponseCollection>;
  provider?: Maybe<Scalars['String']['output']>;
  ratsons?: Maybe<RatsonRelationResponseCollection>;
  rikmashes?: Maybe<RikmashRelationResponseCollection>;
  rishonvesopen?: Maybe<OpenMissionRelationResponseCollection>;
  role?: Maybe<UsersPermissionsRoleEntityResponse>;
  sales?: Maybe<SaleRelationResponseCollection>;
  sheirutnegos?: Maybe<SheirutnegoRelationResponseCollection>;
  sheirutpends?: Maybe<SheirutpendRelationResponseCollection>;
  sheiruts?: Maybe<SheirutRelationResponseCollection>;
  shekelsPerHoureProject1?: Maybe<Scalars['Float']['output']>;
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


export type UsersPermissionsUserPositionsAuthorArgs = {
  filters?: InputMaybe<PositionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  publicationState?: InputMaybe<PublicationState>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserPositionsVotedArgs = {
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
  arr1?: InputMaybe<JsonFilterInput>;
  arrdate?: InputMaybe<DateTimeFilterInput>;
  askeds?: InputMaybe<OpenMissionFiltersInput>;
  askms?: InputMaybe<AskmFiltersInput>;
  asks?: InputMaybe<AskFiltersInput>;
  askwants?: InputMaybe<AskwantFiltersInput>;
  bio?: InputMaybe<StringFilterInput>;
  blocked?: InputMaybe<BooleanFilterInput>;
  chezin?: InputMaybe<ChezinFiltersInput>;
  city?: InputMaybe<StringFilterInput>;
  confirmationToken?: InputMaybe<StringFilterInput>;
  confirmed?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  cuntries?: InputMaybe<CuntryFiltersInput>;
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
  levManualAlready?: InputMaybe<BooleanFilterInput>;
  machshirs?: InputMaybe<MachshirFiltersInput>;
  mashaabims?: InputMaybe<MashaabimFiltersInput>;
  mesimabetahaliches?: InputMaybe<MesimabetahalichFiltersInput>;
  messages?: InputMaybe<MessageFiltersInput>;
  moachManualAlready?: InputMaybe<BooleanFilterInput>;
  nego_mashes?: InputMaybe<NegoMashFiltersInput>;
  negopendmissions?: InputMaybe<NegopendmissionFiltersInput>;
  negotiations?: InputMaybe<NegotiationFiltersInput>;
  negotiationsIparticipante?: InputMaybe<NegotiationFiltersInput>;
  noMail?: InputMaybe<BooleanFilterInput>;
  noOfHoursProject1?: InputMaybe<FloatFilterInput>;
  not?: InputMaybe<UsersPermissionsUserFiltersInput>;
  open_missions?: InputMaybe<OpenMissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  password?: InputMaybe<StringFilterInput>;
  pendms?: InputMaybe<PendmFiltersInput>;
  pendmsforme?: InputMaybe<PendmFiltersInput>;
  pgishas?: InputMaybe<PgishaFiltersInput>;
  pgishasPendStrat?: InputMaybe<PgishaFiltersInput>;
  pgishauserpends?: InputMaybe<PgishauserpendFiltersInput>;
  pgishausers?: InputMaybe<PgishauserFiltersInput>;
  positionsAuthor?: InputMaybe<PositionFiltersInput>;
  positionsVoted?: InputMaybe<PositionFiltersInput>;
  preferCards?: InputMaybe<BooleanFilterInput>;
  profilManualAlready?: InputMaybe<BooleanFilterInput>;
  projects_1s?: InputMaybe<ProjectFiltersInput>;
  provider?: InputMaybe<StringFilterInput>;
  ratsons?: InputMaybe<RatsonFiltersInput>;
  resetPasswordToken?: InputMaybe<StringFilterInput>;
  rikmashes?: InputMaybe<RikmashFiltersInput>;
  rishonvesopen?: InputMaybe<OpenMissionFiltersInput>;
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  sales?: InputMaybe<SaleFiltersInput>;
  sheirutnegos?: InputMaybe<SheirutnegoFiltersInput>;
  sheirutpends?: InputMaybe<SheirutpendFiltersInput>;
  sheiruts?: InputMaybe<SheirutFiltersInput>;
  shekelsPerHoureProject1?: InputMaybe<FloatFilterInput>;
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
  arr1?: InputMaybe<Scalars['JSON']['input']>;
  arrdate?: InputMaybe<Scalars['DateTime']['input']>;
  askeds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  asks?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  askwants?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  bio?: InputMaybe<Scalars['String']['input']>;
  blocked?: InputMaybe<Scalars['Boolean']['input']>;
  chezin?: InputMaybe<Scalars['ID']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  confirmationToken?: InputMaybe<Scalars['String']['input']>;
  confirmed?: InputMaybe<Scalars['Boolean']['input']>;
  cuntries?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  levManualAlready?: InputMaybe<Scalars['Boolean']['input']>;
  machshirs?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mashaabims?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  mesimabetahaliches?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  messages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  moachManualAlready?: InputMaybe<Scalars['Boolean']['input']>;
  nego_mashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negopendmissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negotiations?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  negotiationsIparticipante?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  noMail?: InputMaybe<Scalars['Boolean']['input']>;
  noOfHoursProject1?: InputMaybe<Scalars['Float']['input']>;
  open_missions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  password?: InputMaybe<Scalars['String']['input']>;
  pendms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pendmsforme?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishas?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishasPendStrat?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishauserpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  pgishausers?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  positionsAuthor?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  positionsVoted?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  preferCards?: InputMaybe<Scalars['Boolean']['input']>;
  profilManualAlready?: InputMaybe<Scalars['Boolean']['input']>;
  profilePic?: InputMaybe<Scalars['ID']['input']>;
  projects_1s?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  provider?: InputMaybe<Scalars['String']['input']>;
  ratsons?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  resetPasswordToken?: InputMaybe<Scalars['String']['input']>;
  rikmashes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  rishonvesopen?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  role?: InputMaybe<Scalars['ID']['input']>;
  sales?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutnegos?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheirutpends?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  sheiruts?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  shekelsPerHoureProject1?: InputMaybe<Scalars['Float']['input']>;
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
  nego?: Maybe<NegoEntityResponse>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
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
  nego?: InputMaybe<NegoFiltersInput>;
  not?: InputMaybe<VoteFiltersInput>;
  ok?: InputMaybe<BooleanFilterInput>;
  or?: InputMaybe<Array<InputMaybe<VoteFiltersInput>>>;
  order?: InputMaybe<IntFilterInput>;
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
  nego?: InputMaybe<Scalars['ID']['input']>;
  ok?: InputMaybe<Scalars['Boolean']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
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
