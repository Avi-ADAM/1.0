import type { Schema, Attribute } from '@strapi/strapi';

export interface DesisionEditPend extends Schema.Component {
  collectionName: 'components_desision_edit_pends';
  info: {
    name: 'editPend';
    icon: 'users-cog';
    description: '';
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'desision.edit-pend',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    perhour: Attribute.Decimal;
    noofhours: Attribute.Decimal;
    descrip: Attribute.Text;
    name: Attribute.String;
    hearotMeyuchadot: Attribute.Text;
    sqadualed: Attribute.DateTime;
    skills: Attribute.Relation<
      'desision.edit-pend',
      'oneToOne',
      'api::skill.skill'
    >;
    tafkidims: Attribute.Relation<
      'desision.edit-pend',
      'oneToOne',
      'api::tafkidim.tafkidim'
    >;
    work_ways: Attribute.Relation<
      'desision.edit-pend',
      'oneToOne',
      'api::work-way.work-way'
    >;
  };
}

export interface DesisionNegodes extends Schema.Component {
  collectionName: 'components_desision_negodes';
  info: {
    name: 'negodes';
    icon: 'american-sign-language-interpreting';
  };
  attributes: {
    text: Attribute.String;
    des: Attribute.Text;
    richdes: Attribute.RichText;
    pic: Attribute.Media;
  };
}

export interface DesisionNegom extends Schema.Component {
  collectionName: 'components_desision_negoms';
  info: {
    name: 'negom';
    icon: 'balance-scale';
  };
  attributes: {
    easy: Attribute.Decimal;
    hm: Attribute.Decimal;
    descrip: Attribute.String;
    sqadualedf: Attribute.DateTime;
    price: Attribute.Decimal;
    kindOf: Attribute.Enumeration<
      ['total', 'monthly', 'yearly', 'perUnit', 'rent']
    >;
    name: Attribute.String;
    linkto: Attribute.String;
    spnot: Attribute.Text;
    sqadualed: Attribute.DateTime;
  };
}

export interface NewEdits extends Schema.Component {
  collectionName: 'components_new_edits';
  info: {
    displayName: 'edits';
  };
  attributes: {
    versionText: Attribute.RichText;
  };
}

export interface NewMeeting extends Schema.Component {
  collectionName: 'components_new_meetings';
  info: {
    displayName: 'meeting';
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'new.meeting',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    available: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface NewMonter extends Schema.Component {
  collectionName: 'components_new_monters';
  info: {
    displayName: 'monter';
  };
  attributes: {
    monthStart: Attribute.Date;
    hours: Attribute.Decimal;
    isDone: Attribute.Boolean & Attribute.DefaultTo<false>;
    hoursDone: Attribute.Decimal;
    finnished_mission: Attribute.Relation<
      'new.monter',
      'oneToOne',
      'api::finnished-mission.finnished-mission'
    >;
  };
}

export interface NewNego extends Schema.Component {
  collectionName: 'components_new_negos';
  info: {
    displayName: 'nego';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    users_permissions_user: Attribute.Relation<
      'new.nego',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    perhour: Attribute.Decimal;
    noofhours: Attribute.Decimal;
    descrip: Attribute.Text;
    hearotMeyuchadot: Attribute.Text;
    sqadualed: Attribute.DateTime;
    skills: Attribute.Relation<'new.nego', 'oneToMany', 'api::skill.skill'>;
    work_way: Attribute.Relation<
      'new.nego',
      'oneToOne',
      'api::work-way.work-way'
    >;
    tafkidim: Attribute.Relation<
      'new.nego',
      'oneToOne',
      'api::tafkidim.tafkidim'
    >;
    dates: Attribute.DateTime;
    isOriginal: Attribute.Boolean & Attribute.DefaultTo<false>;
    ide: Attribute.Integer;
  };
}

export interface NewNegom extends Schema.Component {
  collectionName: 'components_new_negoms';
  info: {
    displayName: 'negom';
    icon: 'ambulance';
  };
  attributes: {
    easy: Attribute.Decimal;
    hm: Attribute.Decimal;
    descrip: Attribute.String;
    sqadualedf: Attribute.DateTime;
    price: Attribute.Decimal;
    kindOf: Attribute.Enumeration<['monthly', 'yearly', 'perUnit', 'rent']>;
    name: Attribute.String;
    linkto: Attribute.String;
    spnot: Attribute.Text;
    sqadualed: Attribute.DateTime;
    vots: Attribute.Component<'projects.vots', true>;
  };
}

export interface NewSeen extends Schema.Component {
  collectionName: 'components_new_seens';
  info: {
    displayName: 'seen';
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'new.seen',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    seenBy: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface NewTimes extends Schema.Component {
  collectionName: 'components_new_times';
  info: {
    displayName: 'times';
    icon: 'calendar';
  };
  attributes: {
    start: Attribute.DateTime;
    stop: Attribute.DateTime;
  };
}

export interface NewUserAndIshur extends Schema.Component {
  collectionName: 'components_new_user_and_ishurs';
  info: {
    displayName: 'userAndIshur';
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'new.user-and-ishur',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    appruved: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ProjectsChatre extends Schema.Component {
  collectionName: 'components_projects_chatres';
  info: {
    displayName: 'chatre';
  };
  attributes: {
    freetext: Attribute.Text;
    send: Attribute.Relation<
      'projects.chatre',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    when: Attribute.DateTime;
    seen: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ProjectsHervachti extends Schema.Component {
  collectionName: 'components_projects_hervachtis';
  info: {
    displayName: 'hervachti';
    description: '';
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'projects.hervachti',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    nirsham: Attribute.Boolean & Attribute.DefaultTo<false>;
    amount: Attribute.Decimal;
    matbea: Attribute.Relation<
      'projects.hervachti',
      'oneToOne',
      'api::matbea.matbea'
    >;
    noten: Attribute.Boolean & Attribute.DefaultTo<false>;
    mekabel: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ProjectsMeeting extends Schema.Component {
  collectionName: 'components_projects_meetings';
  info: {
    name: 'meeting';
    icon: 'comments';
  };
  attributes: {
    users_permissions_user: Attribute.Relation<
      'projects.meeting',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    available: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ProjectsMonter extends Schema.Component {
  collectionName: 'components_projects_monters';
  info: {
    name: 'monter';
    icon: 'calendar-day';
  };
  attributes: {
    monthStart: Attribute.Date;
    hours: Attribute.Decimal;
    isDone: Attribute.Boolean & Attribute.DefaultTo<false>;
    finnished_mission: Attribute.Relation<
      'projects.monter',
      'oneToOne',
      'api::finnished-mission.finnished-mission'
    >;
    hoursdon: Attribute.Decimal;
  };
}

export interface ProjectsNegodes extends Schema.Component {
  collectionName: 'components_projects_negodes';
  info: {
    displayName: 'negodes';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    des: Attribute.String;
    rechdes: Attribute.RichText;
    pic: Attribute.Media;
    vots: Attribute.Component<'projects.vots', true>;
    newHours: Attribute.Integer;
  };
}

export interface ProjectsPendmnego extends Schema.Component {
  collectionName: 'components_projects_pendmnegos';
  info: {
    displayName: 'pendmnego';
    description: '';
  };
  attributes: {
    why: Attribute.String;
    what: Attribute.Boolean;
    order: Attribute.Integer;
    users_permissions_user: Attribute.Relation<
      'projects.pendmnego',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    ide: Attribute.Integer;
    negopendmission: Attribute.Relation<
      'projects.pendmnego',
      'oneToOne',
      'api::negopendmission.negopendmission'
    >;
    zman: Attribute.DateTime;
  };
}

export interface ProjectsShift extends Schema.Component {
  collectionName: 'components_projects_shifts';
  info: {
    name: 'shift';
    icon: 'brain';
  };
  attributes: {
    noofp: Attribute.Integer;
    start: Attribute.DateTime;
    finnish: Attribute.DateTime;
    taken: Attribute.Boolean & Attribute.DefaultTo<false>;
    users_permissions_user: Attribute.Relation<
      'projects.shift',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    sidur: Attribute.Relation<'projects.shift', 'oneToOne', 'api::sidur.sidur'>;
  };
}

export interface ProjectsTaskdis extends Schema.Component {
  collectionName: 'components_projects_taskdis';
  info: {
    name: 'taskdis';
    icon: 'atom';
  };
  attributes: {
    myWhy: Attribute.String;
    valiWhy: Attribute.String;
  };
}

export interface ProjectsUsersOf extends Schema.Component {
  collectionName: 'components_projects_users_ofs';
  info: {
    name: 'usersOf';
    icon: 'business-time';
    description: '';
  };
  attributes: {
    why: Attribute.String;
    users_permissions_user: Attribute.Relation<
      'projects.users-of',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    finnished_mission: Attribute.Relation<
      'projects.users-of',
      'oneToOne',
      'api::finnished-mission.finnished-mission'
    >;
    mesimabetahaliche: Attribute.Relation<
      'projects.users-of',
      'oneToOne',
      'api::mesimabetahalich.mesimabetahalich'
    >;
    joined: Attribute.Date;
  };
}

export interface ProjectsVots extends Schema.Component {
  collectionName: 'components_projects_vots';
  info: {
    displayName: 'vots';
    description: '';
  };
  attributes: {
    why: Attribute.String;
    what: Attribute.Boolean;
    order: Attribute.Integer;
    users_permissions_user: Attribute.Relation<
      'projects.vots',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    ide: Attribute.Integer;
    zman: Attribute.DateTime;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'desision.edit-pend': DesisionEditPend;
      'desision.negodes': DesisionNegodes;
      'desision.negom': DesisionNegom;
      'new.edits': NewEdits;
      'new.meeting': NewMeeting;
      'new.monter': NewMonter;
      'new.nego': NewNego;
      'new.negom': NewNegom;
      'new.seen': NewSeen;
      'new.times': NewTimes;
      'new.user-and-ishur': NewUserAndIshur;
      'projects.chatre': ProjectsChatre;
      'projects.hervachti': ProjectsHervachti;
      'projects.meeting': ProjectsMeeting;
      'projects.monter': ProjectsMonter;
      'projects.negodes': ProjectsNegodes;
      'projects.pendmnego': ProjectsPendmnego;
      'projects.shift': ProjectsShift;
      'projects.taskdis': ProjectsTaskdis;
      'projects.users-of': ProjectsUsersOf;
      'projects.vots': ProjectsVots;
    }
  }
}
