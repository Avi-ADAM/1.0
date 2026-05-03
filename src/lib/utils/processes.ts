import { sendToSer } from '$lib/send/sendToSer.js';
import type {
  ProcessContext,
  ProcessTimelineItem,
  ProcessViewModel
} from '$lib/types/process';

const PROCESS_PREFIX = 'PROCESS::';
const PROCESS_ENTITY_PREFIX = 'PROCESS_ENTITY::';

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function parseProcessSubject(subject: string | null | undefined) {
  if (!subject || !subject.startsWith(PROCESS_PREFIX)) return null;
  const [, processId = '', title = ''] = subject.split('::');
  if (!processId) return null;
  return {
    processId,
    title
  };
}

function parseEntityMapping(subject: string | null | undefined) {
  if (!subject || !subject.startsWith(PROCESS_ENTITY_PREFIX)) return null;
  const [, entityType = '', processId = '', entityId = '', title = ''] = subject.split('::');
  if (!entityType || !processId || !entityId) return null;
  return {
    entityType,
    processId,
    entityId,
    title
  };
}

function item(
  id: string,
  type: string,
  title: string,
  description?: string,
  createdAt?: string | null,
  meta?: Record<string, any>
): ProcessTimelineItem {
  return {
    id: String(id),
    type,
    title: title || type,
    description: description || '',
    createdAt: createdAt || null,
    meta
  };
}

function nextExpectedStage(stageCounts: Record<string, number>): string {
  if (!stageCounts.pending && !stageCounts.negotiation && !stageCounts.open) {
    return 'pending';
  }
  if (stageCounts.open && !stageCounts.candidates) {
    return 'candidates';
  }
  if (stageCounts.candidates && !stageCounts.execution) {
    return 'execution';
  }
  if (stageCounts.execution && !stageCounts.approval) {
    return 'approval';
  }
  return 'completion';
}

export function mapProjectProcesses(projectId: string, attrs: any): ProcessViewModel[] {
  const forums = asArray(attrs?.forums?.data);
  const pendms = asArray(attrs?.pendms?.data);
  const pmashes = asArray(attrs?.pmashes?.data);
  const openMissions = asArray(attrs?.open_missions?.data);
  const openResources = asArray(attrs?.open_mashaabims?.data);
  const inProgress = asArray(attrs?.mesimabetahaliches?.data);

  const processForums = forums
    .map((forum: any) => {
      const parsed = parseProcessSubject(forum?.attributes?.subject);
      if (!parsed) return null;
      const firstMessage = asArray(forum?.attributes?.messages?.data)[0];
      return {
        processId: parsed.processId,
        title: parsed.title,
        mainForumId: String(forum.id),
        description: firstMessage?.attributes?.content || '',
        updatedAt: forum?.attributes?.updatedAt || null
      };
    })
    .filter(Boolean) as Array<{
    processId: string;
    title: string;
    mainForumId: string;
    description: string;
    updatedAt?: string | null;
  }>;

  const entityMappings = forums
    .map((forum: any) => parseEntityMapping(forum?.attributes?.subject))
    .filter(Boolean) as Array<{
    entityType: string;
    processId: string;
    entityId: string;
    title: string;
  }>;

  return processForums.map((processForum) => {
    const processId = processForum.processId;
    const pendingMissionItems = entityMappings
      .filter((mapping) => mapping.processId === processId && mapping.entityType === 'pendm')
      .map((mapping) => {
        const data = pendms.find((entry: any) => String(entry.id) === mapping.entityId);
        return data
          ? item(
              String(data.id),
              'pendm',
              data.attributes?.name || mapping.title,
              data.attributes?.descrip || data.attributes?.hearotMeyuchadot || '',
              data.attributes?.createdAt,
              data.attributes
            )
          : null;
      })
      .filter(Boolean) as ProcessTimelineItem[];

    const pendingResourceItems = entityMappings
      .filter((mapping) => mapping.processId === processId && mapping.entityType === 'pmash')
      .map((mapping) => {
        const data = pmashes.find((entry: any) => String(entry.id) === mapping.entityId);
        return data
          ? item(
              String(data.id),
              'pmash',
              data.attributes?.name || mapping.title,
              data.attributes?.descrip || data.attributes?.spnot || '',
              data.attributes?.createdAt,
              data.attributes
            )
          : null;
      })
      .filter(Boolean) as ProcessTimelineItem[];

    const openMissionItems = openMissions
      .filter((entry: any) =>
        asArray(entry?.attributes?.partofs?.data).some(
          (partof: any) => String(partof.id) === processId
        )
      )
      .map((entry: any) =>
        item(
          String(entry.id),
          'openMission',
          entry.attributes?.name || '',
          entry.attributes?.descrip || entry.attributes?.hearotMeyuchadot || '',
          entry.attributes?.createdAt,
          entry.attributes
        )
      );

    const openResourceItems = openResources
      .filter((entry: any) =>
        asArray(entry?.attributes?.partofs?.data).some(
          (partof: any) => String(partof.id) === processId
        )
      )
      .map((entry: any) =>
        item(
          String(entry.id),
          'openMashaabim',
          entry.attributes?.name || '',
          entry.attributes?.descrip || entry.attributes?.spnot || '',
          entry.attributes?.createdAt,
          entry.attributes
        )
      );

    const candidateItems = [
      ...openMissionItems.flatMap((entry) =>
        asArray(entry.meta?.asks?.data).map((ask: any) =>
          item(
            String(ask.id),
            'ask',
            ask.attributes?.users_permissions_user?.data?.attributes?.username || 'Ask',
            '',
            ask.attributes?.createdAt,
            ask.attributes
          )
        )
      ),
      ...openResourceItems.flatMap((entry) =>
        asArray(entry.meta?.askms?.data).map((askm: any) =>
          item(
            String(askm.id),
            'askm',
            askm.attributes?.users_permissions_user?.data?.attributes?.username || 'Askm',
            '',
            askm.attributes?.createdAt,
            askm.attributes
          )
        )
      )
    ];

    const executionItems = [
      ...inProgress
        .filter((entry: any) =>
          asArray(entry?.attributes?.partofs?.data).some(
            (partof: any) => String(partof.id) === processId
          )
        )
        .map((entry: any) =>
          item(
            String(entry.id),
            'mesimabetahalich',
            entry.attributes?.name || '',
            entry.attributes?.descrip || '',
            entry.attributes?.createdAt,
            entry.attributes
          )
        ),
      ...openResourceItems
        .filter((entry) => entry.meta?.maap?.data)
        .map((entry) =>
          item(
            String(entry.meta.maap.data.id),
            'maap',
            entry.title,
            '',
            entry.meta.maap.data.attributes?.createdAt,
            entry.meta.maap.data.attributes
          )
        )
    ];

    const approvalItems = inProgress
      .filter((entry: any) =>
        asArray(entry?.attributes?.partofs?.data).some(
          (partof: any) => String(partof.id) === processId
        )
      )
      .flatMap((entry: any) =>
        asArray(entry?.attributes?.finiapruvals?.data).map((approval: any) =>
          item(
            String(approval.id),
            'finiapruval',
            approval.attributes?.missname || entry.attributes?.name || '',
            '',
            approval.attributes?.createdAt,
            approval.attributes
          )
        )
      );

    const completionItems = openResourceItems.flatMap((entry) =>
      asArray(entry.meta?.rikmashes?.data).map((rikmash: any) =>
        item(
          String(rikmash.id),
          'rikmash',
          rikmash.attributes?.name || entry.title,
          '',
          rikmash.attributes?.createdAt,
          rikmash.attributes
        )
      )
    );

    const stageCounts = {
      pending: pendingMissionItems.length + pendingResourceItems.length,
      negotiation: 0,
      open: openMissionItems.length + openResourceItems.length,
      candidates: candidateItems.length,
      execution: executionItems.length,
      approval: approvalItems.length,
      completion: completionItems.length
    };

    return {
      id: processId,
      projectId,
      title: processForum.title,
      description: processForum.description,
      mainForumId: processForum.mainForumId,
      updatedAt: processForum.updatedAt,
      stageCounts,
      stages: [
        {
          key: 'need',
          label: 'Need',
          items: [item(processId, 'process', processForum.title, processForum.description, processForum.updatedAt)]
        },
        {
          key: 'pending',
          label: 'Pending',
          items: [...pendingMissionItems, ...pendingResourceItems]
        },
        {
          key: 'open',
          label: 'Open',
          items: [...openMissionItems, ...openResourceItems]
        },
        {
          key: 'candidates',
          label: 'Candidates',
          items: candidateItems
        },
        {
          key: 'execution',
          label: 'Execution',
          items: executionItems
        },
        {
          key: 'approval',
          label: 'Final approval',
          items: approvalItems
        },
        {
          key: 'completion',
          label: 'Completion',
          items: completionItems
        }
      ],
      nextExpectedStage: nextExpectedStage(stageCounts)
    };
  });
}

export async function loadProjectProcesses(projectId: string, fetchFn: typeof globalThis.fetch) {
  const result = await sendToSer(
    { projectId },
    '102projectProcessesQuery',
    null,
    null,
    false,
    fetchFn
  );
  const attrs = result?.data?.project?.data?.attributes;
  if (!attrs) {
    return [];
  }
  return mapProjectProcesses(String(projectId), attrs);
}

export function asProcessContext(process: ProcessViewModel): ProcessContext {
  return {
    processId: process.id,
    mainForumId: process.mainForumId,
    projectId: process.projectId,
    name: process.title,
    description: process.description
  };
}
