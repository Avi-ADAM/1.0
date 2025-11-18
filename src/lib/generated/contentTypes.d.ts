import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    singularName: 'release';
    pluralName: 'releases';
    displayName: 'Release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    singularName: 'release-action';
    pluralName: 'release-actions';
    displayName: 'Release Action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    contentType: Attribute.String & Attribute.Required;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    singularName: 'locale';
    pluralName: 'locales';
    collectionName: 'locales';
    displayName: 'Locale';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 50;
        },
        number
      >;
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'users-permissions_user';
  info: {
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
    name: 'User';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    isSigned: Attribute.Boolean;
    cuntries: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::cuntry.cuntry'
    >;
    skills: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::skill.skill'
    >;
    noOfHoursProject1: Attribute.Decimal;
    shekelsPerHoureProject1: Attribute.Decimal;
    tafkidims: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    profilePic: Attribute.Media;
    timeForVid: Attribute.DateTime;
    work_ways: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::work-way.work-way'
    >;
    projects_1s: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::project.project'
    >;
    mashaabims: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::mashaabim.mashaabim'
    >;
    vallues: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::vallue.vallue'
    >;
    hervachti: Attribute.Decimal & Attribute.DefaultTo<0>;
    finnished_missions: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::finnished-mission.finnished-mission'
    >;
    askeds: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::open-mission.open-mission'
    >;
    hatzaas: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::hatzaa.hatzaa'
    >;
    declined: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::open-mission.open-mission'
    >;
    mesimabetahaliches: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    welcom_tops: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::welcom-top.welcom-top'
    >;
    declinedByP: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::open-mission.open-mission'
    >;
    pendmsforme: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::pendm.pendm'
    >;
    pendms: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::pendm.pendm'
    >;
    open_missions: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::open-mission.open-mission'
    >;
    rishonvesopen: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::open-mission.open-mission'
    >;
    sphmin: Attribute.Decimal;
    videoval: Attribute.Boolean & Attribute.DefaultTo<false>;
    asks: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::ask.ask'
    >;
    finiapruvals: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::finiapruval.finiapruval'
    >;
    bio: Attribute.Text;
    frd: Attribute.Enumeration<
      ['sun', 'mon', 'thu', 'wen', 'teh', 'fri', 'shabat', 'na']
    >;
    sps: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::sp.sp'
    >;
    askms: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::askm.askm'
    >;
    declinedm: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::open-mashaabim.open-mashaabim'
    >;
    rikmashes: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::rikmash.rikmash'
    >;
    haskama: Attribute.BigInteger;
    haskamac: Attribute.BigInteger;
    haskamaz: Attribute.BigInteger;
    sales: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::sale.sale'
    >;
    haamadas: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::haamada.haamada'
    >;
    lang: Attribute.Enumeration<['he', 'en', 'ar']>;
    levManualAlready: Attribute.Boolean & Attribute.DefaultTo<false>;
    profilManualAlready: Attribute.Boolean & Attribute.DefaultTo<false>;
    moachManualAlready: Attribute.Boolean & Attribute.DefaultTo<false>;
    city: Attribute.String;
    preferCards: Attribute.Boolean & Attribute.DefaultTo<false>;
    zohars: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::zohar.zohar'
    >;
    fblink: Attribute.String;
    twiterlink: Attribute.String;
    discordlink: Attribute.String;
    githublink: Attribute.String;
    actsVali: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::act.act'
    >;
    chezin: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::chezin.chezin'
    >;
    free_person: Attribute.Integer;
    halukasend: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::haluka.haluka'
    >;
    halukasres: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::haluka.haluka'
    >;
    device_token: Attribute.String;
    telegramId: Attribute.String;
    socketId: Attribute.String;
    negopendmissions: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::negopendmission.negopendmission'
    >;
    nego_mashes: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::nego-mash.nego-mash'
    >;
    wants: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::want.want'
    >;
    askwants: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::askwant.askwant'
    >;
    machshirs: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::machshir.machshir'
    >;
    messages: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::message.message'
    >;
    votes: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::vote.vote'
    >;
    pgishauser: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::pgishauser.pgishauser'
    >;
    pgishauserpends: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::pgishauserpend.pgishauserpend'
    >;
    filtertags: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::filtertag.filtertag'
    >;
    ratsons: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::ratson.ratson'
    >;
    timers: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::timer.timer'
    >;
    arr1: Attribute.JSON;
    arrdate: Attribute.DateTime;
    noMail: Attribute.Boolean & Attribute.DefaultTo<false>;
    acts: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::act.act'
    >;
    negotiations: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::negotiation.negotiation'
    >;
    negotiationsIparticipante: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::negotiation.negotiation'
    >;
    positionsAuthor: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::position.position'
    >;
    positionsVoted: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::position.position'
    >;
    deals: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::deal.deal'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiActAct extends Schema.CollectionType {
  collectionName: 'acts';
  info: {
    singularName: 'act';
    pluralName: 'acts';
    displayName: 'Act';
    name: 'act';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    shem: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    dateS: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    naasa: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    my: Attribute.Relation<
      'api::act.act',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    des: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    dateF: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    vali: Attribute.Relation<
      'api::act.act',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    status: Attribute.Integer &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.SetMinMax<
        {
          min: 0;
          max: 100;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    project: Attribute.Relation<
      'api::act.act',
      'manyToOne',
      'api::project.project'
    >;
    mesimabetahaliches: Attribute.Relation<
      'api::act.act',
      'manyToMany',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    myIshur: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    valiIshur: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    taskdis: Attribute.Component<'projects.taskdis', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    hashivut: Attribute.Enumeration<['red', 'yellow', 'green', 'white']> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timegrama: Attribute.Relation<
      'api::act.act',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    forums: Attribute.Relation<
      'api::act.act',
      'manyToMany',
      'api::forum.forum'
    >;
    pendm: Attribute.Relation<'api::act.act', 'manyToOne', 'api::pendm.pendm'>;
    open_mission: Attribute.Relation<
      'api::act.act',
      'manyToOne',
      'api::open-mission.open-mission'
    >;
    userAndIshur: Attribute.Component<'new.user-and-ishur', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    tafkidims: Attribute.Relation<
      'api::act.act',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    isAssigned: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timers: Attribute.Relation<
      'api::act.act',
      'manyToMany',
      'api::timer.timer'
    >;
    negopendmissions: Attribute.Relation<
      'api::act.act',
      'manyToMany',
      'api::negopendmission.negopendmission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::act.act', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::act.act', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::act.act',
      'oneToMany',
      'api::act.act'
    >;
    locale: Attribute.String;
  };
}

export interface ApiActtActt extends Schema.CollectionType {
  collectionName: 'actts';
  info: {
    singularName: 'actt';
    pluralName: 'actts';
    displayName: 'Actt';
    name: 'actt';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    link: Attribute.String;
    timegrama: Attribute.Relation<
      'api::actt.actt',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::actt.actt', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::actt.actt', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiAskAsk extends Schema.CollectionType {
  collectionName: 'asks';
  info: {
    singularName: 'ask';
    pluralName: 'asks';
    displayName: 'Ask';
    name: 'ask';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    open_mission: Attribute.Relation<
      'api::ask.ask',
      'manyToOne',
      'api::open-mission.open-mission'
    >;
    project: Attribute.Relation<
      'api::ask.ask',
      'manyToOne',
      'api::project.project'
    >;
    users_permissions_user: Attribute.Relation<
      'api::ask.ask',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    archived: Attribute.Boolean & Attribute.DefaultTo<false>;
    vots: Attribute.Component<'projects.vots', true>;
    timegrama: Attribute.Relation<
      'api::ask.ask',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    chat: Attribute.Component<'projects.vots', true>;
    forums: Attribute.Relation<
      'api::ask.ask',
      'manyToMany',
      'api::forum.forum'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::ask.ask', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::ask.ask', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiAskmAskm extends Schema.CollectionType {
  collectionName: 'askms';
  info: {
    singularName: 'askm';
    pluralName: 'askms';
    displayName: 'Askm';
    name: 'askm';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    archived: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    open_mashaabim: Attribute.Relation<
      'api::askm.askm',
      'manyToOne',
      'api::open-mashaabim.open-mashaabim'
    >;
    project: Attribute.Relation<
      'api::askm.askm',
      'manyToOne',
      'api::project.project'
    >;
    sp: Attribute.Relation<'api::askm.askm', 'manyToOne', 'api::sp.sp'>;
    users_permissions_user: Attribute.Relation<
      'api::askm.askm',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    vots: Attribute.Component<'projects.vots', true>;
    timegrama: Attribute.Relation<
      'api::askm.askm',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    chat: Attribute.Component<'projects.vots', true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::askm.askm', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::askm.askm', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiAskwantAskwant extends Schema.CollectionType {
  collectionName: 'askwants';
  info: {
    singularName: 'askwant';
    pluralName: 'askwants';
    displayName: 'askwant';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived: Attribute.Boolean & Attribute.DefaultTo<false>;
    sheirut: Attribute.Relation<
      'api::askwant.askwant',
      'manyToOne',
      'api::sheirut.sheirut'
    >;
    project: Attribute.Relation<
      'api::askwant.askwant',
      'manyToOne',
      'api::project.project'
    >;
    users_permissions_user: Attribute.Relation<
      'api::askwant.askwant',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    vots: Attribute.Component<'projects.vots', true>;
    chat: Attribute.Component<'projects.chatre', true>;
    timegrama: Attribute.Relation<
      'api::askwant.askwant',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::askwant.askwant',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::askwant.askwant',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBakashaBakasha extends Schema.CollectionType {
  collectionName: 'bakashas';
  info: {
    singularName: 'bakasha';
    pluralName: 'bakashas';
    displayName: 'Bakasha';
    name: 'bakasha';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    mashaabim: Attribute.Relation<
      'api::bakasha.bakasha',
      'manyToOne',
      'api::mashaabim.mashaabim'
    >;
    furfiled: Attribute.Boolean & Attribute.DefaultTo<false>;
    matanot: Attribute.Relation<
      'api::bakasha.bakasha',
      'manyToOne',
      'api::matanot.matanot'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::bakasha.bakasha',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::bakasha.bakasha',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCategoryCategory extends Schema.CollectionType {
  collectionName: 'categories';
  info: {
    singularName: 'category';
    pluralName: 'categories';
    displayName: 'category';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    matanots: Attribute.Relation<
      'api::category.category',
      'manyToMany',
      'api::matanot.matanot'
    >;
    sheiruts: Attribute.Relation<
      'api::category.category',
      'manyToMany',
      'api::sheirut.sheirut'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::category.category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::category.category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::category.category',
      'oneToMany',
      'api::category.category'
    >;
    locale: Attribute.String;
  };
}

export interface ApiChezinChezin extends Schema.CollectionType {
  collectionName: 'chezins';
  info: {
    singularName: 'chezin';
    pluralName: 'chezins';
    displayName: 'Chezin';
    name: 'chezin';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    myQuotes: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    countries: Attribute.Relation<
      'api::chezin.chezin',
      'manyToMany',
      'api::cuntry.cuntry'
    >;
    noOpHours: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    shekelsPerHoure: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    deffinitions: Attribute.Relation<
      'api::chezin.chezin',
      'manyToMany',
      'api::deffinition.deffinition'
    >;
    phoneNumber: Attribute.String &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    users_permissions_user: Attribute.Relation<
      'api::chezin.chezin',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::chezin.chezin',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::chezin.chezin',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::chezin.chezin',
      'oneToMany',
      'api::chezin.chezin'
    >;
    locale: Attribute.String;
  };
}

export interface ApiConventionTextConventionText extends Schema.CollectionType {
  collectionName: 'convention_texts';
  info: {
    singularName: 'convention-text';
    pluralName: 'convention-texts';
    displayName: 'Convention-text';
    name: 'convention-text';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    conventionText: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    type: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::convention-text.convention-text',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::convention-text.convention-text',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::convention-text.convention-text',
      'oneToMany',
      'api::convention-text.convention-text'
    >;
    locale: Attribute.String;
  };
}

export interface ApiCuntryCuntry extends Schema.CollectionType {
  collectionName: 'cuntries';
  info: {
    singularName: 'cuntry';
    pluralName: 'cuntries';
    displayName: 'Cuntry';
    name: 'cuntry';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    signingNumber: Attribute.BigInteger &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    alpha2: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    alpha3: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    users: Attribute.Relation<
      'api::cuntry.cuntry',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    free_people: Attribute.Relation<
      'api::cuntry.cuntry',
      'manyToMany',
      'api::chezin.chezin'
    >;
    flug: Attribute.Media;
    deffinitions: Attribute.Relation<
      'api::cuntry.cuntry',
      'manyToMany',
      'api::deffinition.deffinition'
    >;
    projects: Attribute.Relation<
      'api::cuntry.cuntry',
      'manyToMany',
      'api::project.project'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::cuntry.cuntry',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::cuntry.cuntry',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::cuntry.cuntry',
      'oneToMany',
      'api::cuntry.cuntry'
    >;
    locale: Attribute.String;
  };
}

export interface ApiDeaDea extends Schema.CollectionType {
  collectionName: 'deas';
  info: {
    singularName: 'dea';
    pluralName: 'deas';
    displayName: 'dea';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    head: Attribute.String;
    desc: Attribute.Blocks;
    solutions: Attribute.Relation<
      'api::dea.dea',
      'manyToMany',
      'api::solution.solution'
    >;
    votes: Attribute.Relation<'api::dea.dea', 'manyToMany', 'api::vote.vote'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::dea.dea', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::dea.dea', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiDealDeal extends Schema.CollectionType {
  collectionName: 'deals';
  info: {
    singularName: 'deal';
    pluralName: 'deals';
    displayName: 'deal';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    costumers: Attribute.Relation<
      'api::deal.deal',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    salers: Attribute.Relation<
      'api::deal.deal',
      'manyToMany',
      'api::project.project'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::deal.deal', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::deal.deal', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiDecisionDecision extends Schema.CollectionType {
  collectionName: 'decisions';
  info: {
    singularName: 'decision';
    pluralName: 'decisions';
    displayName: 'Decision';
    name: 'decision';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    decisionName: Attribute.String;
    projects: Attribute.Relation<
      'api::decision.decision',
      'manyToMany',
      'api::project.project'
    >;
    archived: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    kind: Attribute.Enumeration<
      [
        'pic',
        'pubdes',
        'prides',
        'name',
        'vallueadd',
        'vallueles',
        'newFlink',
        'newWlink',
        'timtoM',
        'pendMatana'
      ]
    >;
    newname: Attribute.String;
    newprides: Attribute.Text;
    newpubdes: Attribute.RichText;
    valluesadd: Attribute.Relation<
      'api::decision.decision',
      'manyToMany',
      'api::vallue.vallue'
    >;
    valluesles: Attribute.Relation<
      'api::decision.decision',
      'manyToMany',
      'api::vallue.vallue'
    >;
    newpic: Attribute.Media;
    newFlink: Attribute.String;
    newWlink: Attribute.String;
    timtoM: Attribute.String;
    vots: Attribute.Component<'projects.vots', true>;
    negodes: Attribute.Component<'projects.negodes', true>;
    timegrama: Attribute.Relation<
      'api::decision.decision',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    forums: Attribute.Relation<
      'api::decision.decision',
      'manyToMany',
      'api::forum.forum'
    >;
    matanot: Attribute.Relation<
      'api::decision.decision',
      'oneToOne',
      'api::matanot.matanot'
    >;
    votes: Attribute.Relation<
      'api::decision.decision',
      'oneToMany',
      'api::vote.vote'
    >;
    moreHours: Attribute.Relation<
      'api::decision.decision',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    newHours: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::decision.decision',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::decision.decision',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiDeffinitionDeffinition extends Schema.CollectionType {
  collectionName: 'deffinitions';
  info: {
    singularName: 'deffinition';
    pluralName: 'deffinitions';
    displayName: 'Deffinition';
    name: 'deffinition';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    deffinitionName: Attribute.String &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    free_people: Attribute.Relation<
      'api::deffinition.deffinition',
      'manyToMany',
      'api::chezin.chezin'
    >;
    admin_user: Attribute.Relation<
      'api::deffinition.deffinition',
      'oneToOne',
      'admin::user'
    >;
    countries: Attribute.Relation<
      'api::deffinition.deffinition',
      'manyToMany',
      'api::cuntry.cuntry'
    >;
    projects: Attribute.Relation<
      'api::deffinition.deffinition',
      'manyToMany',
      'api::project.project'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::deffinition.deffinition',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::deffinition.deffinition',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::deffinition.deffinition',
      'oneToMany',
      'api::deffinition.deffinition'
    >;
    locale: Attribute.String;
  };
}

export interface ApiFiltertagFiltertag extends Schema.CollectionType {
  collectionName: 'filtertags';
  info: {
    singularName: 'filtertag';
    pluralName: 'filtertags';
    displayName: 'filtertag';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    users_permissions_users: Attribute.Relation<
      'api::filtertag.filtertag',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    positions: Attribute.Relation<
      'api::filtertag.filtertag',
      'manyToMany',
      'api::position.position'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::filtertag.filtertag',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::filtertag.filtertag',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::filtertag.filtertag',
      'oneToMany',
      'api::filtertag.filtertag'
    >;
    locale: Attribute.String;
  };
}

export interface ApiFiniapruvalFiniapruval extends Schema.CollectionType {
  collectionName: 'finiapruvals';
  info: {
    singularName: 'finiapruval';
    pluralName: 'finiapruvals';
    displayName: 'Finiapruval';
    name: 'finiapruval';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    missname: Attribute.String;
    why: Attribute.String;
    what: Attribute.Media;
    archived: Attribute.Boolean & Attribute.DefaultTo<false>;
    noofhours: Attribute.Float;
    mesimabetahalich: Attribute.Relation<
      'api::finiapruval.finiapruval',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    users_permissions_user: Attribute.Relation<
      'api::finiapruval.finiapruval',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    project: Attribute.Relation<
      'api::finiapruval.finiapruval',
      'manyToOne',
      'api::project.project'
    >;
    iskvua: Attribute.Boolean & Attribute.DefaultTo<false>;
    month: Attribute.Date;
    vots: Attribute.Component<'projects.vots', true>;
    timegrama: Attribute.Relation<
      'api::finiapruval.finiapruval',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    finnished_mission: Attribute.Relation<
      'api::finiapruval.finiapruval',
      'manyToOne',
      'api::finnished-mission.finnished-mission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::finiapruval.finiapruval',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::finiapruval.finiapruval',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFinnishedMissionFinnishedMission
  extends Schema.CollectionType {
  collectionName: 'finnished_missions';
  info: {
    singularName: 'finnished-mission';
    pluralName: 'finnished-missions';
    displayName: 'Finnished-mission';
    name: 'finnished-mission';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    missionName: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    mission: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'manyToOne',
      'api::mission.mission'
    >;
    users_permissions_user: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    project: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'manyToOne',
      'api::project.project'
    >;
    why: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    what: Attribute.Media;
    finiapruvals: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'oneToMany',
      'api::finiapruval.finiapruval'
    >;
    noofhours: Attribute.Float &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    perhour: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    total: Attribute.Float &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    hearotMeyuchadot: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    descrip: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    start: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    finish: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    tafkidims: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    mesimabetahalich: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    month: Attribute.Date &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    iskvua: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    idYesod: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isMust: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isFinished: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::finnished-mission.finnished-mission',
      'oneToMany',
      'api::finnished-mission.finnished-mission'
    >;
    locale: Attribute.String;
  };
}

export interface ApiForumForum extends Schema.CollectionType {
  collectionName: 'forums';
  info: {
    singularName: 'forum';
    pluralName: 'forums';
    displayName: 'forum';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    subject: Attribute.String;
    spec: Attribute.Enumeration<['general', 'spesificm', 'spesifica']>;
    done: Attribute.Boolean & Attribute.Required & Attribute.DefaultTo<false>;
    project: Attribute.Relation<
      'api::forum.forum',
      'manyToOne',
      'api::project.project'
    >;
    acts: Attribute.Relation<'api::forum.forum', 'manyToMany', 'api::act.act'>;
    mesimabetahaliches: Attribute.Relation<
      'api::forum.forum',
      'manyToMany',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    decisions: Attribute.Relation<
      'api::forum.forum',
      'manyToMany',
      'api::decision.decision'
    >;
    messages: Attribute.Relation<
      'api::forum.forum',
      'oneToMany',
      'api::message.message'
    >;
    pgisha: Attribute.Relation<
      'api::forum.forum',
      'oneToOne',
      'api::pgisha.pgisha'
    >;
    asks: Attribute.Relation<'api::forum.forum', 'manyToMany', 'api::ask.ask'>;
    haluka: Attribute.Relation<
      'api::forum.forum',
      'oneToOne',
      'api::haluka.haluka'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::forum.forum',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::forum.forum',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiHaamadaHaamada extends Schema.CollectionType {
  collectionName: 'haamadas';
  info: {
    singularName: 'haamada';
    pluralName: 'haamadas';
    displayName: 'Haamada';
    name: 'haamada';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    amount: Attribute.Decimal;
    users_permissions_user: Attribute.Relation<
      'api::haamada.haamada',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    project: Attribute.Relation<
      'api::haamada.haamada',
      'manyToOne',
      'api::project.project'
    >;
    open_mashaabims: Attribute.Relation<
      'api::haamada.haamada',
      'manyToMany',
      'api::open-mashaabim.open-mashaabim'
    >;
    rikmashes: Attribute.Relation<
      'api::haamada.haamada',
      'manyToMany',
      'api::rikmash.rikmash'
    >;
    isReturned: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    comition: Attribute.Decimal;
    haamadapruv: Attribute.Relation<
      'api::haamada.haamada',
      'oneToOne',
      'api::haamadapruv.haamadapruv'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::haamada.haamada',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::haamada.haamada',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiHaamadapruvHaamadapruv extends Schema.CollectionType {
  collectionName: 'haamadapruvs';
  info: {
    singularName: 'haamadapruv';
    pluralName: 'haamadapruvs';
    displayName: 'Haamadapruv';
    name: 'haamadapruv';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    open_mashaabim: Attribute.Relation<
      'api::haamadapruv.haamadapruv',
      'manyToOne',
      'api::open-mashaabim.open-mashaabim'
    >;
    project: Attribute.Relation<
      'api::haamadapruv.haamadapruv',
      'manyToOne',
      'api::project.project'
    >;
    haamada: Attribute.Relation<
      'api::haamadapruv.haamadapruv',
      'oneToOne',
      'api::haamada.haamada'
    >;
    archived: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    vots: Attribute.Component<'projects.vots', true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::haamadapruv.haamadapruv',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::haamadapruv.haamadapruv',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiHalukaHaluka extends Schema.CollectionType {
  collectionName: 'halukas';
  info: {
    singularName: 'haluka';
    pluralName: 'halukas';
    displayName: 'Haluka';
    name: 'haluka';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    usersend: Attribute.Relation<
      'api::haluka.haluka',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    userrecive: Attribute.Relation<
      'api::haluka.haluka',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    amount: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    matbea: Attribute.Relation<
      'api::haluka.haluka',
      'manyToOne',
      'api::matbea.matbea'
    >;
    confirmed: Attribute.Boolean &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    tosplit: Attribute.Relation<
      'api::haluka.haluka',
      'manyToOne',
      'api::tosplit.tosplit'
    >;
    ushar: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    project: Attribute.Relation<
      'api::haluka.haluka',
      'manyToOne',
      'api::project.project'
    >;
    senderconf: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    chatre: Attribute.Component<'projects.chatre', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    want: Attribute.Relation<
      'api::haluka.haluka',
      'manyToOne',
      'api::want.want'
    >;
    forum: Attribute.Relation<
      'api::haluka.haluka',
      'oneToOne',
      'api::forum.forum'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::haluka.haluka',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::haluka.haluka',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::haluka.haluka',
      'oneToMany',
      'api::haluka.haluka'
    >;
    locale: Attribute.String;
  };
}

export interface ApiHatzaaHatzaa extends Schema.CollectionType {
  collectionName: 'hatzaas';
  info: {
    singularName: 'hatzaa';
    pluralName: 'hatzaas';
    displayName: 'Hatzaa';
    name: 'hatzaa';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    open_mission: Attribute.Relation<
      'api::hatzaa.hatzaa',
      'manyToOne',
      'api::open-mission.open-mission'
    >;
    perhoure: Attribute.Decimal;
    noofhours: Attribute.Decimal;
    untilwhen: Attribute.DateTime;
    users_permissions_user: Attribute.Relation<
      'api::hatzaa.hatzaa',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    vots: Attribute.Component<'projects.vots', true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::hatzaa.hatzaa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::hatzaa.hatzaa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiHazbaahHazbaah extends Schema.CollectionType {
  collectionName: 'hazbaahs';
  info: {
    singularName: 'hazbaah';
    pluralName: 'hazbaahs';
    displayName: 'hazbaah';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    votes: Attribute.Relation<
      'api::hazbaah.hazbaah',
      'oneToMany',
      'api::vote.vote'
    >;
    approved: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::hazbaah.hazbaah',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::hazbaah.hazbaah',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMaapMaap extends Schema.CollectionType {
  collectionName: 'maaps';
  info: {
    singularName: 'maap';
    pluralName: 'maaps';
    displayName: 'Maap';
    name: 'maap';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    archived: Attribute.Boolean &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    sp: Attribute.Relation<'api::maap.maap', 'manyToOne', 'api::sp.sp'>;
    project: Attribute.Relation<
      'api::maap.maap',
      'manyToOne',
      'api::project.project'
    >;
    open_mashaabim: Attribute.Relation<
      'api::maap.maap',
      'oneToOne',
      'api::open-mashaabim.open-mashaabim'
    >;
    rikmash: Attribute.Relation<
      'api::maap.maap',
      'oneToOne',
      'api::rikmash.rikmash'
    >;
    vots: Attribute.Component<'projects.vots', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timegrama: Attribute.Relation<
      'api::maap.maap',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    partofs: Attribute.Relation<
      'api::maap.maap',
      'manyToMany',
      'api::partof.partof'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::maap.maap', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::maap.maap', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::maap.maap',
      'oneToMany',
      'api::maap.maap'
    >;
    locale: Attribute.String;
  };
}

export interface ApiMachshirMachshir extends Schema.CollectionType {
  collectionName: 'machshirs';
  info: {
    singularName: 'machshir';
    pluralName: 'machshirs';
    displayName: 'machshir';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'api::machshir.machshir',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    projects: Attribute.Relation<
      'api::machshir.machshir',
      'manyToMany',
      'api::project.project'
    >;
    jsoni: Attribute.JSON;
    archived: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::machshir.machshir',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::machshir.machshir',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMashaabimMashaabim extends Schema.CollectionType {
  collectionName: 'mashaabims';
  info: {
    singularName: 'mashaabim';
    pluralName: 'mashaabims';
    displayName: 'Mashaabim';
    name: 'mashaabim';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    price: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    kindOf: Attribute.Enumeration<
      ['total', 'monthly', 'yearly', 'perUnit', 'rent']
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    projects: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'manyToMany',
      'api::project.project'
    >;
    users_permissions_users: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    pmashes: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'oneToMany',
      'api::pmash.pmash'
    >;
    linkto: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    sps: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'oneToMany',
      'api::sp.sp'
    >;
    open_mashaabims: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'oneToMany',
      'api::open-mashaabim.open-mashaabim'
    >;
    bakashas: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'oneToMany',
      'api::bakasha.bakasha'
    >;
    matanots: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'manyToMany',
      'api::matanot.matanot'
    >;
    negos: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'manyToMany',
      'api::nego.nego'
    >;
    ratsons: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'manyToMany',
      'api::ratson.ratson'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::mashaabim.mashaabim',
      'oneToMany',
      'api::mashaabim.mashaabim'
    >;
    locale: Attribute.String;
  };
}

export interface ApiMashabetahalichMashabetahalich
  extends Schema.CollectionType {
  collectionName: 'mashabetahaliches';
  info: {
    singularName: 'mashabetahalich';
    pluralName: 'mashabetahaliches';
    displayName: 'mashabetahalich';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    timers: Attribute.Relation<
      'api::mashabetahalich.mashabetahalich',
      'oneToMany',
      'api::timer.timer'
    >;
    howmanyhoursalready: Attribute.Float;
    perhour: Attribute.Decimal;
    hoursassigned: Attribute.Decimal;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::mashabetahalich.mashabetahalich',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::mashabetahalich.mashabetahalich',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMatanotMatanot extends Schema.CollectionType {
  collectionName: 'matanots';
  info: {
    singularName: 'matanot';
    pluralName: 'matanots';
    displayName: 'Matanot';
    name: 'matanot';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    price: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    quant: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    kindOf: Attribute.Enumeration<
      ['total', 'unlimited', 'daily', 'monthly', 'yearly']
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    sales: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    sale: Attribute.Relation<
      'api::matanot.matanot',
      'oneToMany',
      'api::sale.sale'
    >;
    bakashas: Attribute.Relation<
      'api::matanot.matanot',
      'oneToMany',
      'api::bakasha.bakasha'
    >;
    minsaleyearone: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    maxsaleyearone: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    minsaleyearsec: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    maxsaleyearsec: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    projectcreates: Attribute.Relation<
      'api::matanot.matanot',
      'manyToMany',
      'api::project.project'
    >;
    categories: Attribute.Relation<
      'api::matanot.matanot',
      'manyToMany',
      'api::category.category'
    >;
    desc: Attribute.Blocks &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    decision: Attribute.Relation<
      'api::matanot.matanot',
      'oneToOne',
      'api::decision.decision'
    >;
    negos: Attribute.Relation<
      'api::matanot.matanot',
      'oneToMany',
      'api::nego.nego'
    >;
    fixPrice: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<true>;
    appruved: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    missions: Attribute.Relation<
      'api::matanot.matanot',
      'manyToMany',
      'api::mission.mission'
    >;
    mashaabims: Attribute.Relation<
      'api::matanot.matanot',
      'manyToMany',
      'api::mashaabim.mashaabim'
    >;
    partofs: Attribute.Relation<
      'api::matanot.matanot',
      'manyToMany',
      'api::partof.partof'
    >;
    sheiruts: Attribute.Relation<
      'api::matanot.matanot',
      'oneToMany',
      'api::sheirut.sheirut'
    >;
    archived: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    pic: Attribute.Media &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    startDate: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    finnishDate: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    oneForeProject: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::matanot.matanot',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::matanot.matanot',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::matanot.matanot',
      'oneToMany',
      'api::matanot.matanot'
    >;
    locale: Attribute.String;
  };
}

export interface ApiMatbeaMatbea extends Schema.CollectionType {
  collectionName: 'matbeas';
  info: {
    singularName: 'matbea';
    pluralName: 'matbeas';
    displayName: 'Matbea';
    name: 'matbea';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    simbol: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    halukas: Attribute.Relation<
      'api::matbea.matbea',
      'oneToMany',
      'api::haluka.haluka'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::matbea.matbea',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::matbea.matbea',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::matbea.matbea',
      'oneToMany',
      'api::matbea.matbea'
    >;
    locale: Attribute.String;
  };
}

export interface ApiMesimabetahalichMesimabetahalich
  extends Schema.CollectionType {
  collectionName: 'mesimabetahaliches';
  info: {
    singularName: 'mesimabetahalich';
    pluralName: 'mesimabetahaliches';
    displayName: 'Mesimabetahalich';
    name: 'mesimabetahalich';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    mission: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'manyToOne',
      'api::mission.mission'
    >;
    project: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'manyToOne',
      'api::project.project'
    >;
    users_permissions_user: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    admaticedai: Attribute.DateTime;
    howmanyhoursalready: Attribute.Float;
    perhour: Attribute.Decimal;
    hoursassinged: Attribute.Decimal;
    hearotMeyuchadot: Attribute.Text;
    descrip: Attribute.Text;
    privatlinks: Attribute.Text;
    publicklinks: Attribute.Text;
    forappruval: Attribute.Boolean & Attribute.DefaultTo<false>;
    finnished_missions: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::finnished-mission.finnished-mission'
    >;
    finnished: Attribute.Boolean & Attribute.DefaultTo<false>;
    stname: Attribute.String & Attribute.Required & Attribute.DefaultTo<'0'>;
    timer: Attribute.Decimal & Attribute.DefaultTo<0>;
    dates: Attribute.DateTime;
    start: Attribute.DateTime;
    zohars: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::zohar.zohar'
    >;
    tafkidims: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    status: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
          max: 100;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    iskvua: Attribute.Boolean & Attribute.DefaultTo<false>;
    finiapruvals: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::finiapruval.finiapruval'
    >;
    isMust: Attribute.Boolean & Attribute.DefaultTo<false>;
    isYesod: Attribute.Boolean & Attribute.DefaultTo<false>;
    monter: Attribute.Component<'new.monter', true>;
    timegramas: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::timegrama.timegrama'
    >;
    seeders: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::seeder.seeder'
    >;
    monters: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::monter.monter'
    >;
    forums: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'manyToMany',
      'api::forum.forum'
    >;
    partofs: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'manyToMany',
      'api::partof.partof'
    >;
    timers: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::timer.timer'
    >;
    acts: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'manyToMany',
      'api::act.act'
    >;
    activeTimer: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToOne',
      'api::timer.timer'
    >;
    decisions: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToMany',
      'api::decision.decision'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::mesimabetahalich.mesimabetahalich',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMessageMessage extends Schema.CollectionType {
  collectionName: 'messages';
  info: {
    singularName: 'message';
    pluralName: 'messages';
    displayName: 'message';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Attribute.RichText;
    archived: Attribute.Boolean & Attribute.DefaultTo<false>;
    when: Attribute.DateTime;
    forum: Attribute.Relation<
      'api::message.message',
      'manyToOne',
      'api::forum.forum'
    >;
    users_permissions_user: Attribute.Relation<
      'api::message.message',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    seen: Attribute.Component<'new.seen', true>;
    editHistory: Attribute.Component<'new.edits', true>;
    raplyTo: Attribute.Relation<
      'api::message.message',
      'manyToOne',
      'api::message.message'
    >;
    replys: Attribute.Relation<
      'api::message.message',
      'oneToMany',
      'api::message.message'
    >;
    fid: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMissionMission extends Schema.CollectionType {
  collectionName: 'missions';
  info: {
    singularName: 'mission';
    pluralName: 'missions';
    displayName: 'Mission';
    name: 'mission';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    missionName: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.SetMinMaxLength<{
        minLength: 2;
      }>;
    skills: Attribute.Relation<
      'api::mission.mission',
      'manyToMany',
      'api::skill.skill'
    >;
    projects: Attribute.Relation<
      'api::mission.mission',
      'manyToMany',
      'api::project.project'
    >;
    open_missions: Attribute.Relation<
      'api::mission.mission',
      'oneToMany',
      'api::open-mission.open-mission'
    >;
    mesimabetahaliches: Attribute.Relation<
      'api::mission.mission',
      'oneToMany',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    tafkidims: Attribute.Relation<
      'api::mission.mission',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    finnished_missions: Attribute.Relation<
      'api::mission.mission',
      'oneToMany',
      'api::finnished-mission.finnished-mission'
    >;
    work_ways: Attribute.Relation<
      'api::mission.mission',
      'manyToMany',
      'api::work-way.work-way'
    >;
    pendms: Attribute.Relation<
      'api::mission.mission',
      'oneToMany',
      'api::pendm.pendm'
    >;
    matanots: Attribute.Relation<
      'api::mission.mission',
      'manyToMany',
      'api::matanot.matanot'
    >;
    negos: Attribute.Relation<
      'api::mission.mission',
      'manyToMany',
      'api::nego.nego'
    >;
    ratsons: Attribute.Relation<
      'api::mission.mission',
      'manyToMany',
      'api::ratson.ratson'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::mission.mission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::mission.mission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::mission.mission',
      'oneToMany',
      'api::mission.mission'
    >;
    locale: Attribute.String;
  };
}

export interface ApiModeMode extends Schema.CollectionType {
  collectionName: 'modes';
  info: {
    singularName: 'mode';
    pluralName: 'modes';
    displayName: 'Mode';
    name: 'mode';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    yat: Attribute.Relation<'api::mode.mode', 'manyToOne', 'api::yat.yat'>;
    sps: Attribute.Relation<'api::mode.mode', 'oneToMany', 'api::sp.sp'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::mode.mode', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::mode.mode', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiMonterMonter extends Schema.CollectionType {
  collectionName: 'monters';
  info: {
    singularName: 'monter';
    pluralName: 'monters';
    displayName: 'Monter';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    mesimabetahalich: Attribute.Relation<
      'api::monter.monter',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    ani: Attribute.String;
    sheirut: Attribute.Relation<
      'api::monter.monter',
      'manyToOne',
      'api::sheirut.sheirut'
    >;
    start: Attribute.DateTime;
    finish: Attribute.DateTime;
    archived: Attribute.Boolean & Attribute.DefaultTo<false>;
    done: Attribute.Boolean & Attribute.DefaultTo<false>;
    want: Attribute.Relation<
      'api::monter.monter',
      'manyToOne',
      'api::want.want'
    >;
    sale: Attribute.Relation<
      'api::monter.monter',
      'manyToOne',
      'api::sale.sale'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::monter.monter',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::monter.monter',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNegoNego extends Schema.CollectionType {
  collectionName: 'negos';
  info: {
    singularName: 'nego';
    pluralName: 'negos';
    displayName: 'nego';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    des: Attribute.Blocks;
    votes: Attribute.Relation<'api::nego.nego', 'oneToMany', 'api::vote.vote'>;
    matanot: Attribute.Relation<
      'api::nego.nego',
      'manyToOne',
      'api::matanot.matanot'
    >;
    price: Attribute.Decimal;
    quant: Attribute.Decimal;
    kindOf: Attribute.Enumeration<
      ['total', 'unlimited', 'daily', 'monthly', 'yearly']
    >;
    fixprice: Attribute.Boolean;
    missions: Attribute.Relation<
      'api::nego.nego',
      'manyToMany',
      'api::mission.mission'
    >;
    mashaabims: Attribute.Relation<
      'api::nego.nego',
      'manyToMany',
      'api::mashaabim.mashaabim'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::nego.nego', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::nego.nego', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiNegoMashNegoMash extends Schema.CollectionType {
  collectionName: 'nego_mashes';
  info: {
    singularName: 'nego-mash';
    pluralName: 'nego-mashes';
    displayName: 'negoMash';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    descrip: Attribute.Text;
    kindOf: Attribute.Enumeration<
      ['total', 'monthly', 'yearly', 'perUnit', 'rent']
    >;
    hm: Attribute.Decimal;
    spnot: Attribute.RichText;
    price: Attribute.Decimal;
    easy: Attribute.Decimal;
    linkto: Attribute.String;
    sqadualed: Attribute.DateTime;
    sqadualedf: Attribute.DateTime;
    users: Attribute.Component<'projects.vots', true>;
    isOriginal: Attribute.Boolean & Attribute.DefaultTo<false>;
    pmash: Attribute.Relation<
      'api::nego-mash.nego-mash',
      'manyToOne',
      'api::pmash.pmash'
    >;
    users_permissions_user: Attribute.Relation<
      'api::nego-mash.nego-mash',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::nego-mash.nego-mash',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::nego-mash.nego-mash',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNegopendmissionNegopendmission
  extends Schema.CollectionType {
  collectionName: 'negopendmissions';
  info: {
    singularName: 'negopendmission';
    pluralName: 'negopendmissions';
    displayName: 'negopendmission';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    filds: Attribute.Component<'new.nego'>;
    vots: Attribute.Component<'projects.vots', true>;
    pendm: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'manyToOne',
      'api::pendm.pendm'
    >;
    name: Attribute.String;
    descrip: Attribute.Text;
    hearotMeyuchadot: Attribute.Text;
    perhour: Attribute.Decimal;
    noofhours: Attribute.Decimal;
    isOriginal: Attribute.Boolean;
    tafkidims: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    work_ways: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'manyToMany',
      'api::work-way.work-way'
    >;
    skills: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'manyToMany',
      'api::skill.skill'
    >;
    date: Attribute.DateTime;
    dates: Attribute.DateTime;
    isMonth: Attribute.Boolean;
    isRishon: Attribute.Boolean;
    howMany: Attribute.BigInteger;
    users_permissions_user: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    acts: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'manyToMany',
      'api::act.act'
    >;
    open_mission: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'manyToOne',
      'api::open-mission.open-mission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::negopendmission.negopendmission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNegotiationNegotiation extends Schema.CollectionType {
  collectionName: 'negotiations';
  info: {
    singularName: 'negotiation';
    pluralName: 'negotiations';
    displayName: 'Negotiation';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    topic: Attribute.String;
    description: Attribute.RichText;
    status: Attribute.Enumeration<['active', 'completed', 'paused']>;
    maxRounds: Attribute.Integer;
    currentRound: Attribute.Integer;
    createdByEmail: Attribute.String;
    creator: Attribute.Relation<
      'api::negotiation.negotiation',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    participants: Attribute.Relation<
      'api::negotiation.negotiation',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    positions: Attribute.Relation<
      'api::negotiation.negotiation',
      'oneToMany',
      'api::position.position'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::negotiation.negotiation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::negotiation.negotiation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiOpenMashaabimOpenMashaabim extends Schema.CollectionType {
  collectionName: 'open_mashaabims';
  info: {
    singularName: 'open-mashaabim';
    pluralName: 'open-mashaabims';
    displayName: 'Open-mashaabim';
    name: 'open-mashaabim';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    project: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'manyToOne',
      'api::project.project'
    >;
    kindOf: Attribute.Enumeration<
      ['total', 'perUnit', 'rent', 'monthly', 'yearly']
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    hm: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    spnot: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    price: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    easy: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    linkto: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    sqadualed: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    sqadualedf: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    archived: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    pmash: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToOne',
      'api::pmash.pmash'
    >;
    sps: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToMany',
      'api::sp.sp'
    >;
    mashaabim: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'manyToOne',
      'api::mashaabim.mashaabim'
    >;
    askms: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToMany',
      'api::askm.askm'
    >;
    users: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    declinedsps: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToMany',
      'api::sp.sp'
    >;
    maap: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToOne',
      'api::maap.maap'
    >;
    rikmashes: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToMany',
      'api::rikmash.rikmash'
    >;
    haamadas: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'manyToMany',
      'api::haamada.haamada'
    >;
    haamadapruvs: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToMany',
      'api::haamadapruv.haamadapruv'
    >;
    splited: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    isYesod: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isMust: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    howMeny: Attribute.BigInteger &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    partofs: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'manyToMany',
      'api::partof.partof'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::open-mashaabim.open-mashaabim',
      'oneToMany',
      'api::open-mashaabim.open-mashaabim'
    >;
    locale: Attribute.String;
  };
}

export interface ApiOpenMissionOpenMission extends Schema.CollectionType {
  collectionName: 'open_missions';
  info: {
    singularName: 'open-mission';
    pluralName: 'open-missions';
    displayName: 'Open-mission';
    name: 'open-mission';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    sqadualed: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    project: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToOne',
      'api::project.project'
    >;
    mission: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToOne',
      'api::mission.mission'
    >;
    work_ways: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToMany',
      'api::work-way.work-way'
    >;
    hearotMeyuchadot: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    skills: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToMany',
      'api::skill.skill'
    >;
    tafkidims: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    vallues: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToMany',
      'api::vallue.vallue'
    >;
    hatzaas: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToMany',
      'api::hatzaa.hatzaa'
    >;
    noofhours: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    perhour: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publicklinks: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    usersNotRelevant: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    users: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    privatlinks: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    archived: Attribute.Boolean &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    declined: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    rishon: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    rishonves: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    asks: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToMany',
      'api::ask.ask'
    >;
    dates: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    isshift: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isRishon: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    iskvua: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isMust: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isYesod: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    pendm: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToOne',
      'api::pendm.pendm'
    >;
    howMeny: Attribute.BigInteger &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    partofs: Attribute.Relation<
      'api::open-mission.open-mission',
      'manyToMany',
      'api::partof.partof'
    >;
    acts: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToMany',
      'api::act.act'
    >;
    negopendmissions: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToMany',
      'api::negopendmission.negopendmission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::open-mission.open-mission',
      'oneToMany',
      'api::open-mission.open-mission'
    >;
    locale: Attribute.String;
  };
}

export interface ApiPartofPartof extends Schema.CollectionType {
  collectionName: 'partofs';
  info: {
    singularName: 'partof';
    pluralName: 'partofs';
    displayName: 'partof';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    mesimabetahaliches: Attribute.Relation<
      'api::partof.partof',
      'manyToMany',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    maaps: Attribute.Relation<
      'api::partof.partof',
      'manyToMany',
      'api::maap.maap'
    >;
    default: Attribute.Boolean & Attribute.DefaultTo<true>;
    open_missions: Attribute.Relation<
      'api::partof.partof',
      'manyToMany',
      'api::open-mission.open-mission'
    >;
    open_mashaabims: Attribute.Relation<
      'api::partof.partof',
      'manyToMany',
      'api::open-mashaabim.open-mashaabim'
    >;
    matanots: Attribute.Relation<
      'api::partof.partof',
      'manyToMany',
      'api::matanot.matanot'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::partof.partof',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::partof.partof',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPendmPendm extends Schema.CollectionType {
  collectionName: 'pendms';
  info: {
    singularName: 'pendm';
    pluralName: 'pendms';
    displayName: 'Pendm';
    name: 'pendm';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    sqadualed: Attribute.DateTime;
    project: Attribute.Relation<
      'api::pendm.pendm',
      'manyToOne',
      'api::project.project'
    >;
    mission: Attribute.Relation<
      'api::pendm.pendm',
      'manyToOne',
      'api::mission.mission'
    >;
    work_ways: Attribute.Relation<
      'api::pendm.pendm',
      'manyToMany',
      'api::work-way.work-way'
    >;
    hearotMeyuchadot: Attribute.Text;
    name: Attribute.String;
    descrip: Attribute.Text;
    skills: Attribute.Relation<
      'api::pendm.pendm',
      'manyToMany',
      'api::skill.skill'
    >;
    tafkidims: Attribute.Relation<
      'api::pendm.pendm',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    vallues: Attribute.Relation<
      'api::pendm.pendm',
      'manyToMany',
      'api::vallue.vallue'
    >;
    noofhours: Attribute.Decimal;
    perhour: Attribute.Decimal;
    publicklinks: Attribute.Text;
    privatlinks: Attribute.Text;
    archived: Attribute.Boolean & Attribute.DefaultTo<false>;
    rishon: Attribute.Relation<
      'api::pendm.pendm',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    rishonves: Attribute.Relation<
      'api::pendm.pendm',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    dates: Attribute.DateTime;
    isMust: Attribute.Boolean & Attribute.DefaultTo<false>;
    isYesod: Attribute.Boolean & Attribute.DefaultTo<false>;
    diun: Attribute.Component<'projects.vots', true>;
    nego: Attribute.Component<'new.nego', true>;
    iskvua: Attribute.Boolean & Attribute.DefaultTo<false>;
    isshift: Attribute.Boolean & Attribute.DefaultTo<false>;
    open_mission: Attribute.Relation<
      'api::pendm.pendm',
      'oneToOne',
      'api::open-mission.open-mission'
    >;
    timegrama: Attribute.Relation<
      'api::pendm.pendm',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    isLast: Attribute.Boolean & Attribute.DefaultTo<true>;
    negopendmissions: Attribute.Relation<
      'api::pendm.pendm',
      'oneToMany',
      'api::negopendmission.negopendmission'
    >;
    users: Attribute.Component<'projects.pendmnego', true>;
    howMeny: Attribute.BigInteger;
    acts: Attribute.Relation<'api::pendm.pendm', 'oneToMany', 'api::act.act'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pendm.pendm',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::pendm.pendm',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPgishaPgisha extends Schema.CollectionType {
  collectionName: 'pgishas';
  info: {
    singularName: 'pgisha';
    pluralName: 'pgishas';
    displayName: 'Pgisha';
    name: 'pgisha';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    archived: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    available: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    meeting: Attribute.Component<'new.meeting', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    pgishausers: Attribute.Relation<
      'api::pgisha.pgisha',
      'manyToMany',
      'api::pgishauser.pgishauser'
    >;
    forum: Attribute.Relation<
      'api::pgisha.pgisha',
      'oneToOne',
      'api::forum.forum'
    >;
    set: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    pgishauserpends: Attribute.Relation<
      'api::pgisha.pgisha',
      'oneToMany',
      'api::pgishauserpend.pgishauserpend'
    >;
    desc: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pgisha.pgisha',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::pgisha.pgisha',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::pgisha.pgisha',
      'oneToMany',
      'api::pgisha.pgisha'
    >;
    locale: Attribute.String;
  };
}

export interface ApiPgishauserPgishauser extends Schema.CollectionType {
  collectionName: 'pgishausers';
  info: {
    singularName: 'pgishauser';
    pluralName: 'pgishausers';
    displayName: 'pgishauser';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    uid: Attribute.UID & Attribute.Required;
    available: Attribute.Boolean & Attribute.DefaultTo<false>;
    pgishas: Attribute.Relation<
      'api::pgishauser.pgishauser',
      'manyToMany',
      'api::pgisha.pgisha'
    >;
    users_permissions_user: Attribute.Relation<
      'api::pgishauser.pgishauser',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pgishauser.pgishauser',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::pgishauser.pgishauser',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPgishauserpendPgishauserpend extends Schema.CollectionType {
  collectionName: 'pgishauserpends';
  info: {
    singularName: 'pgishauserpend';
    pluralName: 'pgishauserpends';
    displayName: 'pgishauserpend';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'api::pgishauserpend.pgishauserpend',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    pgisha: Attribute.Relation<
      'api::pgishauserpend.pgishauserpend',
      'manyToOne',
      'api::pgisha.pgisha'
    >;
    approved: Attribute.Boolean;
    archived: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pgishauserpend.pgishauserpend',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::pgishauserpend.pgishauserpend',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPmashPmash extends Schema.CollectionType {
  collectionName: 'pmashes';
  info: {
    singularName: 'pmash';
    pluralName: 'pmashes';
    displayName: 'Pmash';
    name: 'pmash';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    descrip: Attribute.Text;
    project: Attribute.Relation<
      'api::pmash.pmash',
      'manyToOne',
      'api::project.project'
    >;
    kindOf: Attribute.Enumeration<
      ['total', 'monthly', 'yearly', 'perUnit', 'rent']
    >;
    hm: Attribute.Decimal & Attribute.DefaultTo<1>;
    spnot: Attribute.Text;
    price: Attribute.Decimal;
    easy: Attribute.Decimal;
    linkto: Attribute.String;
    sqadualed: Attribute.DateTime;
    sqadualedf: Attribute.DateTime;
    mashaabim: Attribute.Relation<
      'api::pmash.pmash',
      'manyToOne',
      'api::mashaabim.mashaabim'
    >;
    archived: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    open_mashaabim: Attribute.Relation<
      'api::pmash.pmash',
      'oneToOne',
      'api::open-mashaabim.open-mashaabim'
    >;
    isYesod: Attribute.Boolean & Attribute.DefaultTo<false>;
    isMust: Attribute.Boolean & Attribute.DefaultTo<false>;
    users: Attribute.Component<'projects.vots', true>;
    diun: Attribute.Component<'projects.vots', true>;
    negom: Attribute.Component<'new.negom', true>;
    timegrama: Attribute.Relation<
      'api::pmash.pmash',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    nego_mashes: Attribute.Relation<
      'api::pmash.pmash',
      'oneToMany',
      'api::nego-mash.nego-mash'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pmash.pmash',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::pmash.pmash',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPositionPosition extends Schema.CollectionType {
  collectionName: 'positions';
  info: {
    singularName: 'position';
    pluralName: 'positions';
    displayName: 'Position';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    heading: Attribute.String;
    description: Attribute.RichText;
    author: Attribute.Relation<
      'api::position.position',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    authorEmail: Attribute.String;
    votes: Attribute.Integer;
    voters: Attribute.Relation<
      'api::position.position',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    location: Attribute.Float;
    intensity: Attribute.Integer;
    order: Attribute.Integer;
    negotiation: Attribute.Relation<
      'api::position.position',
      'manyToOne',
      'api::negotiation.negotiation'
    >;
    tags: Attribute.Relation<
      'api::position.position',
      'manyToMany',
      'api::filtertag.filtertag'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::position.position',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::position.position',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProjectProject extends Schema.CollectionType {
  collectionName: 'projects';
  info: {
    singularName: 'project';
    pluralName: 'projects';
    displayName: 'Project';
    name: 'project';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    projectName: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    user_1s: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    publicDescription: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    profilePic: Attribute.Media;
    pics: Attribute.Media;
    decisions: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::decision.decision'
    >;
    deffinitions: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::deffinition.deffinition'
    >;
    vallues: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::vallue.vallue'
    >;
    countries: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::cuntry.cuntry'
    >;
    work_ways: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::work-way.work-way'
    >;
    tafkidims: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    missions: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::mission.mission'
    >;
    linkToWebsite: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    mashaabims: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::mashaabim.mashaabim'
    >;
    descripFor: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    finnished_missions: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::finnished-mission.finnished-mission'
    >;
    open_missions: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::open-mission.open-mission'
    >;
    pendms: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::pendm.pendm'
    >;
    usersOfP: Attribute.Component<'projects.users-of', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    mesimabetahaliches: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    newOpenMissionAllApruve: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<true>;
    newOpenMotoAfter72hoursWithnono: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    newMeMissionOuto72ho: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<true>;
    newmeOpenAllapruve: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    asks: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::ask.ask'
    >;
    addHoursManualy: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    finnishedMAllApruve: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<true>;
    finnishedM72HForDecline: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    timerOnlyTOrAlsoManuallyF: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<true>;
    finiapruvals: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::finiapruval.finiapruval'
    >;
    restime: Attribute.Enumeration<['feh', 'sth', 'nsh', 'sevend']> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<'feh'>;
    pmashes: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::pmash.pmash'
    >;
    open_mashaabims: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::open-mashaabim.open-mashaabim'
    >;
    sps: Attribute.Relation<'api::project.project', 'oneToMany', 'api::sp.sp'>;
    askms: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::askm.askm'
    >;
    matanotofs: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::matanot.matanot'
    >;
    maaps: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::maap.maap'
    >;
    rikmashes: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::rikmash.rikmash'
    >;
    sales: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::sale.sale'
    >;
    haamadas: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::haamada.haamada'
    >;
    haamadapruvs: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::haamadapruv.haamadapruv'
    >;
    welcom_tops: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::welcom-top.welcom-top'
    >;
    tosplits: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::tosplit.tosplit'
    >;
    city: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timeToP: Attribute.Enumeration<
      [
        'already',
        'week',
        'month',
        'threeM',
        'sixM',
        'oneY',
        'twoY',
        'more',
        'never'
      ]
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    zohars: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::zohar.zohar'
    >;
    githublink: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    fblink: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    discordlink: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    drivelink: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    twiterlink: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    watsapplink: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    acts: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::act.act'
    >;
    halukas: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::haluka.haluka'
    >;
    totalminyearone: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    totalmaxyearone: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    totalminyearsec: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    totalmaxyearsec: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    totalinyearone: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    totalinyearsec: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    isOt: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isMachzikim: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    isMachzikimPublik: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    sheiruts: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::sheirut.sheirut'
    >;
    askwants: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::askwant.askwant'
    >;
    sheirutpends: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::sheirutpend.sheirutpend'
    >;
    machshirs: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::machshir.machshir'
    >;
    forums: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::forum.forum'
    >;
    timers: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::timer.timer'
    >;
    deals: Attribute.Relation<
      'api::project.project',
      'manyToMany',
      'api::deal.deal'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::project.project'
    >;
    locale: Attribute.String;
  };
}

export interface ApiRatsonRatson extends Schema.CollectionType {
  collectionName: 'ratsons';
  info: {
    singularName: 'ratson';
    pluralName: 'ratsons';
    displayName: 'ratson';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    desc: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    startDate: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    finnishDate: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    fulfilled: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    pics: Attribute.Media &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    logo: Attribute.Media &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    allowJoin: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    vallues: Attribute.Relation<
      'api::ratson.ratson',
      'manyToMany',
      'api::vallue.vallue'
    >;
    bounti: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    totalbounti: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    users_permissions_users: Attribute.Relation<
      'api::ratson.ratson',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    missions: Attribute.Relation<
      'api::ratson.ratson',
      'manyToMany',
      'api::mission.mission'
    >;
    mashaabims: Attribute.Relation<
      'api::ratson.ratson',
      'manyToMany',
      'api::mashaabim.mashaabim'
    >;
    longDes: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::ratson.ratson',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::ratson.ratson',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::ratson.ratson',
      'oneToMany',
      'api::ratson.ratson'
    >;
    locale: Attribute.String;
  };
}

export interface ApiRichtextRichtext extends Schema.CollectionType {
  collectionName: 'richtexts';
  info: {
    singularName: 'richtext';
    pluralName: 'richtexts';
    displayName: 'richtext';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    desc: Attribute.Blocks &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    bg: Attribute.String &
      Attribute.CustomField<'plugin::color-picker.color'> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::richtext.richtext',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::richtext.richtext',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::richtext.richtext',
      'oneToMany',
      'api::richtext.richtext'
    >;
    locale: Attribute.String;
  };
}

export interface ApiRikmashRikmash extends Schema.CollectionType {
  collectionName: 'rikmashes';
  info: {
    singularName: 'rikmash';
    pluralName: 'rikmashes';
    displayName: 'Rikmash';
    name: 'rikmash';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    kindOf: Attribute.Enumeration<
      ['total', 'monthly', 'yearly', 'perUnit', 'rent']
    >;
    price: Attribute.Decimal;
    agprice: Attribute.Decimal;
    hm: Attribute.Decimal;
    project: Attribute.Relation<
      'api::rikmash.rikmash',
      'manyToOne',
      'api::project.project'
    >;
    users_permissions_user: Attribute.Relation<
      'api::rikmash.rikmash',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    sp: Attribute.Relation<'api::rikmash.rikmash', 'oneToOne', 'api::sp.sp'>;
    open_mashaabim: Attribute.Relation<
      'api::rikmash.rikmash',
      'manyToOne',
      'api::open-mashaabim.open-mashaabim'
    >;
    maap: Attribute.Relation<
      'api::rikmash.rikmash',
      'oneToOne',
      'api::maap.maap'
    >;
    sqadualed: Attribute.DateTime;
    sqadualef: Attribute.DateTime;
    total: Attribute.Decimal;
    spnot: Attribute.Text;
    haamadas: Attribute.Relation<
      'api::rikmash.rikmash',
      'manyToMany',
      'api::haamada.haamada'
    >;
    isYesod: Attribute.Boolean & Attribute.DefaultTo<false>;
    isMust: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::rikmash.rikmash',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::rikmash.rikmash',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSaleSale extends Schema.CollectionType {
  collectionName: 'sales';
  info: {
    singularName: 'sale';
    pluralName: 'sales';
    displayName: 'Sale';
    name: 'sale';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    project: Attribute.Relation<
      'api::sale.sale',
      'manyToOne',
      'api::project.project'
    >;
    matanot: Attribute.Relation<
      'api::sale.sale',
      'manyToOne',
      'api::matanot.matanot'
    >;
    users_permissions_user: Attribute.Relation<
      'api::sale.sale',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    in: Attribute.Decimal;
    splited: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    unit: Attribute.Decimal;
    date: Attribute.DateTime;
    monters: Attribute.Relation<
      'api::sale.sale',
      'oneToMany',
      'api::monter.monter'
    >;
    startDate: Attribute.DateTime;
    finishDate: Attribute.DateTime;
    isMonterActive: Attribute.Boolean & Attribute.DefaultTo<false>;
    note: Attribute.String;
    tosplits: Attribute.Relation<
      'api::sale.sale',
      'manyToMany',
      'api::tosplit.tosplit'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::sale.sale', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::sale.sale', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiSeederSeeder extends Schema.CollectionType {
  collectionName: 'seeders';
  info: {
    singularName: 'seeder';
    pluralName: 'seeders';
    displayName: 'seeder';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    start: Attribute.DateTime;
    finnish: Attribute.DateTime;
    mesimabetahalich: Attribute.Relation<
      'api::seeder.seeder',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::seeder.seeder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::seeder.seeder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSheirutSheirut extends Schema.CollectionType {
  collectionName: 'sheiruts';
  info: {
    singularName: 'sheirut';
    pluralName: 'sheiruts';
    displayName: 'sheirut';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    descrip: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    equaliSplited: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<true>;
    oneTime: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    project: Attribute.Relation<
      'api::sheirut.sheirut',
      'manyToOne',
      'api::project.project'
    >;
    archived: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    monters: Attribute.Relation<
      'api::sheirut.sheirut',
      'oneToMany',
      'api::monter.monter'
    >;
    wants: Attribute.Relation<
      'api::sheirut.sheirut',
      'oneToMany',
      'api::want.want'
    >;
    askwants: Attribute.Relation<
      'api::sheirut.sheirut',
      'oneToMany',
      'api::askwant.askwant'
    >;
    sheirutpend: Attribute.Relation<
      'api::sheirut.sheirut',
      'oneToOne',
      'api::sheirutpend.sheirutpend'
    >;
    isApruved: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    categories: Attribute.Relation<
      'api::sheirut.sheirut',
      'manyToMany',
      'api::category.category'
    >;
    isItOnlyOneInProject: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    matanot: Attribute.Relation<
      'api::sheirut.sheirut',
      'manyToOne',
      'api::matanot.matanot'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::sheirut.sheirut',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::sheirut.sheirut',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::sheirut.sheirut',
      'oneToMany',
      'api::sheirut.sheirut'
    >;
    locale: Attribute.String;
  };
}

export interface ApiSheirutpendSheirutpend extends Schema.CollectionType {
  collectionName: 'sheirutpends';
  info: {
    singularName: 'sheirutpend';
    pluralName: 'sheirutpends';
    displayName: 'sheirutpend';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    sheirut: Attribute.Relation<
      'api::sheirutpend.sheirutpend',
      'oneToOne',
      'api::sheirut.sheirut'
    >;
    chat: Attribute.Component<'projects.chatre', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    project: Attribute.Relation<
      'api::sheirutpend.sheirutpend',
      'manyToOne',
      'api::project.project'
    >;
    archived: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    vots: Attribute.Component<'projects.vots', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timegrama: Attribute.Relation<
      'api::sheirutpend.sheirutpend',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::sheirutpend.sheirutpend',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::sheirutpend.sheirutpend',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::sheirutpend.sheirutpend',
      'oneToMany',
      'api::sheirutpend.sheirutpend'
    >;
    locale: Attribute.String;
  };
}

export interface ApiSidurSidur extends Schema.CollectionType {
  collectionName: 'sidurs';
  info: {
    singularName: 'sidur';
    pluralName: 'sidurs';
    displayName: 'Sidur';
    name: 'sidur';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    lemi: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::sidur.sidur',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::sidur.sidur',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSkillSkill extends Schema.CollectionType {
  collectionName: 'skills';
  info: {
    singularName: 'skill';
    pluralName: 'skills';
    displayName: 'Skill';
    name: 'skill';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    skillName: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.SetMinMaxLength<{
        minLength: 2;
      }>;
    users: Attribute.Relation<
      'api::skill.skill',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    missions: Attribute.Relation<
      'api::skill.skill',
      'manyToMany',
      'api::mission.mission'
    >;
    tafkidims: Attribute.Relation<
      'api::skill.skill',
      'manyToMany',
      'api::tafkidim.tafkidim'
    >;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    open_missions: Attribute.Relation<
      'api::skill.skill',
      'manyToMany',
      'api::open-mission.open-mission'
    >;
    pendms: Attribute.Relation<
      'api::skill.skill',
      'manyToMany',
      'api::pendm.pendm'
    >;
    negopendmissions: Attribute.Relation<
      'api::skill.skill',
      'manyToMany',
      'api::negopendmission.negopendmission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::skill.skill',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::skill.skill',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::skill.skill',
      'oneToMany',
      'api::skill.skill'
    >;
    locale: Attribute.String;
  };
}

export interface ApiSolutionSolution extends Schema.CollectionType {
  collectionName: 'solutions';
  info: {
    singularName: 'solution';
    pluralName: 'solutions';
    displayName: 'solution';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    deas: Attribute.Relation<
      'api::solution.solution',
      'manyToMany',
      'api::dea.dea'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::solution.solution',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::solution.solution',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSpSp extends Schema.CollectionType {
  collectionName: 'sps';
  info: {
    singularName: 'sp';
    pluralName: 'sps';
    displayName: 'Sp';
    name: 'sp';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    myp: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    price: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    mashaabim: Attribute.Relation<
      'api::sp.sp',
      'manyToOne',
      'api::mashaabim.mashaabim'
    >;
    openask: Attribute.Relation<
      'api::sp.sp',
      'manyToOne',
      'api::open-mashaabim.open-mashaabim'
    >;
    users_permissions_user: Attribute.Relation<
      'api::sp.sp',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    project: Attribute.Relation<
      'api::sp.sp',
      'manyToOne',
      'api::project.project'
    >;
    spnot: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    panui: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<true>;
    sdate: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    fdate: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    unit: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    kindOf: Attribute.Enumeration<
      ['monthly', 'yearly', 'rent', 'perUnit', 'total']
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    pics: Attribute.Media;
    yat: Attribute.Relation<'api::sp.sp', 'manyToOne', 'api::yat.yat'>;
    mode: Attribute.Relation<'api::sp.sp', 'manyToOne', 'api::mode.mode'>;
    linkto: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    archived: Attribute.Boolean &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    askms: Attribute.Relation<'api::sp.sp', 'oneToMany', 'api::askm.askm'>;
    declinedm: Attribute.Relation<
      'api::sp.sp',
      'manyToOne',
      'api::open-mashaabim.open-mashaabim'
    >;
    maaps: Attribute.Relation<'api::sp.sp', 'oneToMany', 'api::maap.maap'>;
    rikmash: Attribute.Relation<
      'api::sp.sp',
      'oneToOne',
      'api::rikmash.rikmash'
    >;
    splited: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::sp.sp', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::sp.sp', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    localizations: Attribute.Relation<'api::sp.sp', 'oneToMany', 'api::sp.sp'>;
    locale: Attribute.String;
  };
}

export interface ApiTafkidimTafkidim extends Schema.CollectionType {
  collectionName: 'tafkidims';
  info: {
    singularName: 'tafkidim';
    pluralName: 'tafkidims';
    displayName: 'Tafkidim';
    name: 'tafkidim';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    roleDescription: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    skills: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::skill.skill'
    >;
    users_permissions_users: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    projects: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::project.project'
    >;
    missions: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::mission.mission'
    >;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    open_missions: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::open-mission.open-mission'
    >;
    pendms: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::pendm.pendm'
    >;
    mesimabetahaliches: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    finnished_missions: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::finnished-mission.finnished-mission'
    >;
    negopendmissions: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::negopendmission.negopendmission'
    >;
    acts: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'manyToMany',
      'api::act.act'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::tafkidim.tafkidim',
      'oneToMany',
      'api::tafkidim.tafkidim'
    >;
    locale: Attribute.String;
  };
}

export interface ApiTikunolamTikunolam extends Schema.CollectionType {
  collectionName: 'tikunolams';
  info: {
    singularName: 'tikunolam';
    pluralName: 'tikunolams';
    displayName: 'Tikunolam';
    name: 'tikunolam';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    amort: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    amorts: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    amortt: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    amortf: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    amorth: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    more: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    notes: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    email: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::tikunolam.tikunolam',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::tikunolam.tikunolam',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::tikunolam.tikunolam',
      'oneToMany',
      'api::tikunolam.tikunolam'
    >;
    locale: Attribute.String;
  };
}

export interface ApiTimegramaTimegrama extends Schema.CollectionType {
  collectionName: 'timegramas';
  info: {
    singularName: 'timegrama';
    pluralName: 'timegramas';
    displayName: 'timegrama';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    date: Attribute.DateTime;
    act: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::act.act'
    >;
    actt: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::actt.actt'
    >;
    ask: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::ask.ask'
    >;
    askm: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::askm.askm'
    >;
    decision: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::decision.decision'
    >;
    finiapruval: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::finiapruval.finiapruval'
    >;
    maap: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::maap.maap'
    >;
    mesimabetahalich: Attribute.Relation<
      'api::timegrama.timegrama',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    pendm: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::pendm.pendm'
    >;
    pmash: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::pmash.pmash'
    >;
    tosplit: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::tosplit.tosplit'
    >;
    whatami: Attribute.String;
    done: Attribute.Boolean & Attribute.DefaultTo<false>;
    sheirutpend: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::sheirutpend.sheirutpend'
    >;
    askwant: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::askwant.askwant'
    >;
    timer: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'api::timer.timer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::timegrama.timegrama',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTimerTimer extends Schema.CollectionType {
  collectionName: 'timers';
  info: {
    singularName: 'timer';
    pluralName: 'timers';
    displayName: 'timer';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    start: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    finnish: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    saveText: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    forApruve: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    appruved: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    mesimabetahalich: Attribute.Relation<
      'api::timer.timer',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    users_permissions_user: Attribute.Relation<
      'api::timer.timer',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    votes: Attribute.Relation<
      'api::timer.timer',
      'oneToMany',
      'api::vote.vote'
    >;
    totalHours: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timegrama: Attribute.Relation<
      'api::timer.timer',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    mashabetahalich: Attribute.Relation<
      'api::timer.timer',
      'manyToOne',
      'api::mashabetahalich.mashabetahalich'
    >;
    saveFiles: Attribute.Media &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    saveLinks: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timers: Attribute.Component<'new.times', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    acts: Attribute.Relation<'api::timer.timer', 'manyToMany', 'api::act.act'>;
    project: Attribute.Relation<
      'api::timer.timer',
      'manyToOne',
      'api::project.project'
    >;
    isActive: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    saved: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    activeMesimabetahalich: Attribute.Relation<
      'api::timer.timer',
      'oneToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::timer.timer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::timer.timer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::timer.timer',
      'oneToMany',
      'api::timer.timer'
    >;
    locale: Attribute.String;
  };
}

export interface ApiTosplitTosplit extends Schema.CollectionType {
  collectionName: 'tosplits';
  info: {
    singularName: 'tosplit';
    pluralName: 'tosplits';
    displayName: 'Tosplit';
    name: 'tosplit';
    description: '';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    whynow: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    prectentage: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    finished: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    project: Attribute.Relation<
      'api::tosplit.tosplit',
      'manyToOne',
      'api::project.project'
    >;
    halukas: Attribute.Relation<
      'api::tosplit.tosplit',
      'oneToMany',
      'api::haluka.haluka'
    >;
    vots: Attribute.Component<'projects.vots', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    hervachti: Attribute.Component<'projects.hervachti', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    timegrama: Attribute.Relation<
      'api::tosplit.tosplit',
      'oneToOne',
      'api::timegrama.timegrama'
    >;
    sales: Attribute.Relation<
      'api::tosplit.tosplit',
      'manyToMany',
      'api::sale.sale'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::tosplit.tosplit',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::tosplit.tosplit',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::tosplit.tosplit',
      'oneToMany',
      'api::tosplit.tosplit'
    >;
    locale: Attribute.String;
  };
}

export interface ApiTranslateTranslate extends Schema.CollectionType {
  collectionName: 'translates';
  info: {
    singularName: 'translate';
    pluralName: 'translates';
    displayName: 'Translate';
    name: 'translate';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    amort: Attribute.String;
    name: Attribute.String;
    amorts: Attribute.String;
    amortt: Attribute.String;
    amortf: Attribute.String;
    amorth: Attribute.String;
    lang: Attribute.String;
    from: Attribute.String;
    notes: Attribute.Text;
    email: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::translate.translate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::translate.translate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiVallueVallue extends Schema.CollectionType {
  collectionName: 'vallues';
  info: {
    singularName: 'vallue';
    pluralName: 'vallues';
    displayName: 'Vallue';
    name: 'vallue';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    valueName: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    projects: Attribute.Relation<
      'api::vallue.vallue',
      'manyToMany',
      'api::project.project'
    >;
    users: Attribute.Relation<
      'api::vallue.vallue',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    open_missions: Attribute.Relation<
      'api::vallue.vallue',
      'manyToMany',
      'api::open-mission.open-mission'
    >;
    descrip: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    pendms: Attribute.Relation<
      'api::vallue.vallue',
      'manyToMany',
      'api::pendm.pendm'
    >;
    decisions: Attribute.Relation<
      'api::vallue.vallue',
      'manyToMany',
      'api::decision.decision'
    >;
    decisionsles: Attribute.Relation<
      'api::vallue.vallue',
      'manyToMany',
      'api::decision.decision'
    >;
    ratsons: Attribute.Relation<
      'api::vallue.vallue',
      'manyToMany',
      'api::ratson.ratson'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::vallue.vallue',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::vallue.vallue',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::vallue.vallue',
      'oneToMany',
      'api::vallue.vallue'
    >;
    locale: Attribute.String;
  };
}

export interface ApiVoteVote extends Schema.CollectionType {
  collectionName: 'votes';
  info: {
    singularName: 'vote';
    pluralName: 'votes';
    displayName: 'vote';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ok: Attribute.Boolean & Attribute.DefaultTo<true>;
    users_permissions_user: Attribute.Relation<
      'api::vote.vote',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    decision: Attribute.Relation<
      'api::vote.vote',
      'manyToOne',
      'api::decision.decision'
    >;
    nego: Attribute.Relation<'api::vote.vote', 'manyToOne', 'api::nego.nego'>;
    deas: Attribute.Relation<'api::vote.vote', 'manyToMany', 'api::dea.dea'>;
    hazbaah: Attribute.Relation<
      'api::vote.vote',
      'manyToOne',
      'api::hazbaah.hazbaah'
    >;
    timer: Attribute.Relation<
      'api::vote.vote',
      'manyToOne',
      'api::timer.timer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::vote.vote', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::vote.vote', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiWantWant extends Schema.CollectionType {
  collectionName: 'wants';
  info: {
    singularName: 'want';
    pluralName: 'wants';
    displayName: 'want';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'api::want.want',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    sheirut: Attribute.Relation<
      'api::want.want',
      'manyToOne',
      'api::sheirut.sheirut'
    >;
    halukas: Attribute.Relation<
      'api::want.want',
      'oneToMany',
      'api::haluka.haluka'
    >;
    starte: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    finnish: Attribute.DateTime &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    archived: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    appruved: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Attribute.DefaultTo<false>;
    amountalready: Attribute.Decimal &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    monters: Attribute.Relation<
      'api::want.want',
      'oneToMany',
      'api::monter.monter'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::want.want', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::want.want', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::want.want',
      'oneToMany',
      'api::want.want'
    >;
    locale: Attribute.String;
  };
}

export interface ApiWelcomTopWelcomTop extends Schema.CollectionType {
  collectionName: 'welcom_tops';
  info: {
    singularName: 'welcom-top';
    pluralName: 'welcom-tops';
    displayName: 'Welcom-top';
    name: 'welcom-top';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    clicked: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    users_permissions_user: Attribute.Relation<
      'api::welcom-top.welcom-top',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    project: Attribute.Relation<
      'api::welcom-top.welcom-top',
      'manyToOne',
      'api::project.project'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::welcom-top.welcom-top',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::welcom-top.welcom-top',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiWhatandwhyWhatandwhy extends Schema.SingleType {
  collectionName: 'whatandwhies';
  info: {
    singularName: 'whatandwhy';
    pluralName: 'whatandwhies';
    displayName: 'Whatandwhy';
    name: 'whatandwhy';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    why: Attribute.String &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.SetMinMaxLength<{
        minLength: 26;
      }>;
    what: Attribute.Boolean &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::whatandwhy.whatandwhy',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::whatandwhy.whatandwhy',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::whatandwhy.whatandwhy',
      'oneToMany',
      'api::whatandwhy.whatandwhy'
    >;
    locale: Attribute.String;
  };
}

export interface ApiWorkWayWorkWay extends Schema.CollectionType {
  collectionName: 'work_ways';
  info: {
    singularName: 'work-way';
    pluralName: 'work-ways';
    displayName: 'Work-way';
    name: 'work-way';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    workWayName: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    users: Attribute.Relation<
      'api::work-way.work-way',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    projects: Attribute.Relation<
      'api::work-way.work-way',
      'manyToMany',
      'api::project.project'
    >;
    open_missions: Attribute.Relation<
      'api::work-way.work-way',
      'manyToMany',
      'api::open-mission.open-mission'
    >;
    missions: Attribute.Relation<
      'api::work-way.work-way',
      'manyToMany',
      'api::mission.mission'
    >;
    pendms: Attribute.Relation<
      'api::work-way.work-way',
      'manyToMany',
      'api::pendm.pendm'
    >;
    negopendmissions: Attribute.Relation<
      'api::work-way.work-way',
      'manyToMany',
      'api::negopendmission.negopendmission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::work-way.work-way',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::work-way.work-way',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::work-way.work-way',
      'oneToMany',
      'api::work-way.work-way'
    >;
    locale: Attribute.String;
  };
}

export interface ApiYatYat extends Schema.CollectionType {
  collectionName: 'yats';
  info: {
    singularName: 'yat';
    pluralName: 'yats';
    displayName: 'Yat';
    name: 'yat';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    modes: Attribute.Relation<'api::yat.yat', 'oneToMany', 'api::mode.mode'>;
    sps: Attribute.Relation<'api::yat.yat', 'oneToMany', 'api::sp.sp'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::yat.yat', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::yat.yat', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiZoharZohar extends Schema.CollectionType {
  collectionName: 'zohars';
  info: {
    singularName: 'zohar';
    pluralName: 'zohars';
    displayName: 'Zohar';
    name: 'zohar';
  };
  options: {
    increments: true;
    timestamps: true;
    draftAndPublish: true;
  };
  attributes: {
    done: Attribute.Boolean & Attribute.DefaultTo<false>;
    users_permissions_user: Attribute.Relation<
      'api::zohar.zohar',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    project: Attribute.Relation<
      'api::zohar.zohar',
      'manyToOne',
      'api::project.project'
    >;
    mesimabetahalich: Attribute.Relation<
      'api::zohar.zohar',
      'manyToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    weekSt: Attribute.Date;
    allSubmited: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::zohar.zohar',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::zohar.zohar',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'api::act.act': ApiActAct;
      'api::actt.actt': ApiActtActt;
      'api::ask.ask': ApiAskAsk;
      'api::askm.askm': ApiAskmAskm;
      'api::askwant.askwant': ApiAskwantAskwant;
      'api::bakasha.bakasha': ApiBakashaBakasha;
      'api::category.category': ApiCategoryCategory;
      'api::chezin.chezin': ApiChezinChezin;
      'api::convention-text.convention-text': ApiConventionTextConventionText;
      'api::cuntry.cuntry': ApiCuntryCuntry;
      'api::dea.dea': ApiDeaDea;
      'api::deal.deal': ApiDealDeal;
      'api::decision.decision': ApiDecisionDecision;
      'api::deffinition.deffinition': ApiDeffinitionDeffinition;
      'api::filtertag.filtertag': ApiFiltertagFiltertag;
      'api::finiapruval.finiapruval': ApiFiniapruvalFiniapruval;
      'api::finnished-mission.finnished-mission': ApiFinnishedMissionFinnishedMission;
      'api::forum.forum': ApiForumForum;
      'api::haamada.haamada': ApiHaamadaHaamada;
      'api::haamadapruv.haamadapruv': ApiHaamadapruvHaamadapruv;
      'api::haluka.haluka': ApiHalukaHaluka;
      'api::hatzaa.hatzaa': ApiHatzaaHatzaa;
      'api::hazbaah.hazbaah': ApiHazbaahHazbaah;
      'api::maap.maap': ApiMaapMaap;
      'api::machshir.machshir': ApiMachshirMachshir;
      'api::mashaabim.mashaabim': ApiMashaabimMashaabim;
      'api::mashabetahalich.mashabetahalich': ApiMashabetahalichMashabetahalich;
      'api::matanot.matanot': ApiMatanotMatanot;
      'api::matbea.matbea': ApiMatbeaMatbea;
      'api::mesimabetahalich.mesimabetahalich': ApiMesimabetahalichMesimabetahalich;
      'api::message.message': ApiMessageMessage;
      'api::mission.mission': ApiMissionMission;
      'api::mode.mode': ApiModeMode;
      'api::monter.monter': ApiMonterMonter;
      'api::nego.nego': ApiNegoNego;
      'api::nego-mash.nego-mash': ApiNegoMashNegoMash;
      'api::negopendmission.negopendmission': ApiNegopendmissionNegopendmission;
      'api::negotiation.negotiation': ApiNegotiationNegotiation;
      'api::open-mashaabim.open-mashaabim': ApiOpenMashaabimOpenMashaabim;
      'api::open-mission.open-mission': ApiOpenMissionOpenMission;
      'api::partof.partof': ApiPartofPartof;
      'api::pendm.pendm': ApiPendmPendm;
      'api::pgisha.pgisha': ApiPgishaPgisha;
      'api::pgishauser.pgishauser': ApiPgishauserPgishauser;
      'api::pgishauserpend.pgishauserpend': ApiPgishauserpendPgishauserpend;
      'api::pmash.pmash': ApiPmashPmash;
      'api::position.position': ApiPositionPosition;
      'api::project.project': ApiProjectProject;
      'api::ratson.ratson': ApiRatsonRatson;
      'api::richtext.richtext': ApiRichtextRichtext;
      'api::rikmash.rikmash': ApiRikmashRikmash;
      'api::sale.sale': ApiSaleSale;
      'api::seeder.seeder': ApiSeederSeeder;
      'api::sheirut.sheirut': ApiSheirutSheirut;
      'api::sheirutpend.sheirutpend': ApiSheirutpendSheirutpend;
      'api::sidur.sidur': ApiSidurSidur;
      'api::skill.skill': ApiSkillSkill;
      'api::solution.solution': ApiSolutionSolution;
      'api::sp.sp': ApiSpSp;
      'api::tafkidim.tafkidim': ApiTafkidimTafkidim;
      'api::tikunolam.tikunolam': ApiTikunolamTikunolam;
      'api::timegrama.timegrama': ApiTimegramaTimegrama;
      'api::timer.timer': ApiTimerTimer;
      'api::tosplit.tosplit': ApiTosplitTosplit;
      'api::translate.translate': ApiTranslateTranslate;
      'api::vallue.vallue': ApiVallueVallue;
      'api::vote.vote': ApiVoteVote;
      'api::want.want': ApiWantWant;
      'api::welcom-top.welcom-top': ApiWelcomTopWelcomTop;
      'api::whatandwhy.whatandwhy': ApiWhatandwhyWhatandwhy;
      'api::work-way.work-way': ApiWorkWayWorkWay;
      'api::yat.yat': ApiYatYat;
      'api::zohar.zohar': ApiZoharZohar;
    }
  }
}
