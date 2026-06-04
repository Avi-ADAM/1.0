import { sendToSer } from '$lib/send/sendToSer.js';
import { stripHtml } from '$lib/utils/stripHtml';
import type { PageServerLoad } from './$types';

function nameOf(user: any): string {
  if (!user) return 'משתמשת';
  const a = user.attributes || user;
  return a.username || 'משתמשת';
}
function initials(name: string): string {
  const parts = String(name || '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).slice(0, 2) || 'מש';
}
function shortCode(id: string | number): string {
  const s = String(id).padStart(6, '0');
  return `R-${s.slice(-6)}`;
}

export type IncomingWishProposal = {
  proposalId: string;
  status: string;
  kind: string;
  matchScore: number | null;
  createdAt: string | null;
  ratsonId: string | null;
  ratsonCode: string | null;
  ratsonName: string;
  ratsonLongDes: string;
  ratsonStatus: string;
  ratsonStart: string | null;
  ratsonFinish: string | null;
  ratsonTotalBounti: number | null;
  ratsonOwnerName: string;
  ratsonOwnerAvatar: string;
  values: string[];
  categories: string[];
};

export const load: PageServerLoad = async ({ params, fetch }) => {
  const projectId = params.projectId;
  let proposals: IncomingWishProposal[] = [];
  let loadOk = false;

  try {
    const res: any = await sendToSer(
      { projectId, limit: 60 },
      '107listRatsonsForProject',
      0,
      0,
      false,
      fetch
    );
    const nodes = res?.data?.ratsonProposals?.data ?? [];

    proposals = nodes
      .map((p: any) => {
        const pa = p.attributes || {};
        const ratNode = pa.ratson?.data;
        if (!ratNode) return null;
        const ra = ratNode.attributes || {};
        const owners = ra.users_permissions_users?.data ?? [];
        const ownerName = nameOf(owners[0]);
        return {
          proposalId: String(p.id),
          status: pa.status_proposal || 'suggested',
          kind: pa.kind || 'existing_matanot',
          matchScore: typeof pa.match_score === 'number' ? pa.match_score : null,
          createdAt: pa.createdAt ?? null,
          ratsonId: ratNode.id ? String(ratNode.id) : null,
          ratsonCode: ratNode.id ? shortCode(ratNode.id) : null,
          ratsonName: ra.name || '(ללא שם)',
          ratsonLongDes: stripHtml(ra.longDes || ra.desc || ''),
          ratsonStatus: ra.status_ratson || 'open',
          ratsonStart: ra.startDate ?? null,
          ratsonFinish: ra.finnishDate ?? null,
          ratsonTotalBounti: typeof ra.totalbounti === 'number' ? ra.totalbounti : null,
          ratsonOwnerName: ownerName,
          ratsonOwnerAvatar: initials(ownerName),
          values: (ra.vallues?.data ?? []).map((v: any) => v.attributes?.valueName).filter(Boolean),
          categories: (ra.categories?.data ?? [])
            .map((c: any) => c.attributes?.name)
            .filter(Boolean)
        };
      })
      .filter((x: IncomingWishProposal | null): x is IncomingWishProposal => x !== null);
    loadOk = true;
  } catch (e) {
    console.error('[moach/wishes] 107listRatsonsForProject failed', e);
  }

  return { proposals, loadOk, projectId };
};
