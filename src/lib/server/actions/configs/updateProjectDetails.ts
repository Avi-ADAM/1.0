import type { ActionConfig, ActionExecutionHandler } from '../types';
import { calcDeadlineMs } from './actionUtils.js';

const toVal = (v: string | undefined | null): string | null =>
  v && v.trim() !== '' ? v.trim() : null;

interface DecisionSpec {
  kind: string;
  extra: Record<string, unknown>;
}

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const {
    projectId,
    projectName,
    publicDescription,
    descripFor,
    linkToWebsite,
    githublink,
    fblink,
    discordlink,
    drivelink,
    twiterlink,
    watsapplink,
    restime,
    vallueIds = [],
    newPicId
  } = params;

  const projectRes = await strapi.execute(
    'getProjectBaseInfo',
    { pid: projectId },
    context.jwt,
    context.fetch
  );

  const project = projectRes?.data?.project?.data;
  if (!project) throw new Error('Project not found');

  const attrs = project.attributes;
  const memberCount: number = attrs.user_1s?.data?.length ?? 1;
  const currentRestime: string = attrs.restime ?? 'feh';
  const currentVallueIds: string[] = (attrs.vallues?.data ?? []).map((v: { id: string }) => String(v.id));

  if (memberCount <= 1) {
    const result = await strapi.execute(
      'updateProjectDetails',
      {
        id: projectId,
        projectName: projectName?.trim() || attrs.projectName,
        publicDescription: toVal(publicDescription),
        descripFor: toVal(descripFor),
        linkToWebsite: toVal(linkToWebsite),
        githublink: toVal(githublink),
        fblink: toVal(fblink),
        discordlink: toVal(discordlink),
        drivelink: toVal(drivelink),
        twiterlink: toVal(twiterlink),
        watsapplink: toVal(watsapplink),
        restime: restime || currentRestime,
        vallues: vallueIds.map(String)
      },
      context.jwt,
      context.fetch
    );

    if (newPicId) {
      await strapi.execute(
        '43updateProfilePic',
        { projectId, imageId: newPicId },
        context.jwt,
        context.fetch
      );
    }

    return {
      data: result.data?.updateProject?.data?.attributes ?? {},
      updateStrategy: { type: 'fullRefresh' }
    };
  }

  // Multi-user: create decisions for changed key fields, update minor links directly
  const now = new Date().toISOString();
  const userId = context.userId;
  const initialVot = [{ what: true, users_permissions_user: userId }];
  const deadlineDate = new Date(Date.now() + calcDeadlineMs(currentRestime)).toISOString();

  const decisionsToCreate: DecisionSpec[] = [];

  if (projectName?.trim() && projectName.trim() !== attrs.projectName) {
    decisionsToCreate.push({ kind: 'name', extra: { newname: projectName.trim() } });
  }
  if (publicDescription !== undefined && toVal(publicDescription) !== attrs.publicDescription) {
    decisionsToCreate.push({ kind: 'pubdes', extra: { newpubdes: toVal(publicDescription) } });
  }
  if (descripFor !== undefined && toVal(descripFor) !== attrs.descripFor) {
    decisionsToCreate.push({ kind: 'prides', extra: { newprides: toVal(descripFor) } });
  }
  if (fblink !== undefined && toVal(fblink) !== attrs.fblink) {
    decisionsToCreate.push({ kind: 'newFlink', extra: { newFlink: toVal(fblink) } });
  }
  if (linkToWebsite !== undefined && toVal(linkToWebsite) !== attrs.linkToWebsite) {
    decisionsToCreate.push({ kind: 'newWlink', extra: { newWlink: toVal(linkToWebsite) } });
  }
  if (restime && restime !== currentRestime) {
    decisionsToCreate.push({ kind: 'timtoM', extra: { timtoM: restime } });
  }
  if (newPicId) {
    decisionsToCreate.push({ kind: 'pic', extra: { newpic: newPicId } });
  }

  const newVallueIds = vallueIds.map(String);
  const addedIds = newVallueIds.filter((id: string) => !currentVallueIds.includes(id));
  const removedIds = currentVallueIds.filter((id) => !newVallueIds.includes(id));
  if (addedIds.length > 0) {
    decisionsToCreate.push({ kind: 'vallueadd', extra: { valluesadd: addedIds } });
  }
  if (removedIds.length > 0) {
    decisionsToCreate.push({ kind: 'vallueles', extra: { valluesles: removedIds } });
  }

  const createdDecisions = await Promise.all(
    decisionsToCreate.map(async ({ kind, extra }) => {
      const decRes = await strapi.execute(
        'createProjectDecision',
        {
          projectIds: [projectId],
          publishedAt: now,
          decisionName: kind,
          kind,
          vots: initialVot,
          ...extra
        },
        context.jwt,
        context.fetch
      );

      const decisionId = decRes?.data?.createDecision?.data?.id;
      if (!decisionId) return null;

      await strapi.execute(
        '32createTimeGrama',
        { whatami: 'decision', decision: decisionId, date: deadlineDate },
        context.jwt,
        context.fetch
      );

      return { kind, id: decisionId };
    })
  ).then((results) => results.filter((r): r is { kind: string; id: string } => r !== null));

  const minorLinksChanged =
    toVal(githublink) !== attrs.githublink ||
    toVal(discordlink) !== attrs.discordlink ||
    toVal(drivelink) !== attrs.drivelink ||
    toVal(twiterlink) !== attrs.twiterlink ||
    toVal(watsapplink) !== attrs.watsapplink;

  if (minorLinksChanged) {
    await strapi.execute(
      'updateProjectDetails',
      {
        id: projectId,
        projectName: attrs.projectName,
        publicDescription: attrs.publicDescription,
        descripFor: attrs.descripFor,
        linkToWebsite: attrs.linkToWebsite,
        githublink: toVal(githublink),
        fblink: attrs.fblink,
        discordlink: toVal(discordlink),
        drivelink: toVal(drivelink),
        twiterlink: toVal(twiterlink),
        watsapplink: toVal(watsapplink),
        restime: currentRestime,
        vallues: currentVallueIds
      },
      context.jwt,
      context.fetch
    );
  }

  return {
    data: { decisionsCreated: createdDecisions.length, decisions: createdDecisions },
    updateStrategy: createdDecisions.length > 0 ? { type: 'none' } : { type: 'fullRefresh' }
  };
};

export const updateProjectDetailsConfig: ActionConfig = {
  key: 'updateProjectDetails',
  description: 'Update project basic details (direct for single-user, vote for multi-user)',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true },
    projectName: { type: 'string', required: false },
    publicDescription: { type: 'string', required: false },
    descripFor: { type: 'string', required: false },
    linkToWebsite: { type: 'string', required: false },
    githublink: { type: 'string', required: false },
    fblink: { type: 'string', required: false },
    discordlink: { type: 'string', required: false },
    drivelink: { type: 'string', required: false },
    twiterlink: { type: 'string', required: false },
    watsapplink: { type: 'string', required: false },
    restime: { type: 'string', required: false },
    vallueIds: { type: 'array', required: false },
    newPicId: { type: 'string', required: false }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member'
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true }
    },
    templates: {
      title: { he: 'עדכון פרטי פרויקט', en: 'Project details updated', ar: 'تحديث تفاصيل المشروع' },
      body: { he: 'פרטי הפרויקט עודכנו', en: 'Project details have been updated', ar: 'تم تحديث تفاصيل المشروع' }
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' }
  }
};
