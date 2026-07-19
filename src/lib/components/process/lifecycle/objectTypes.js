/**
 * Object-type registry for the per-object pages
 * (moach/[projectId]/object/[type]/[id] and the [type] index).
 *
 * Every lifecycle entity that can be linked to a rikma gets an entry:
 * how to find it inside a reconstructed chain (see reconstructChains.js /
 * findChainByRef), which component field holds its votes, where its chat
 * forum lives, whether it is archived (→ read-only page), and which vote
 * page (moach/[projectId]/votes/[kind]/[id]) handles it while active.
 */

const first = (value) => (Array.isArray(value) ? value[0] : null);

export const OBJECT_TYPES = {
  pendm: {
    kind: 'mission',
    refPrefix: 'pendm',
    voteKind: 'pendm',
    fromChain: (chain) => chain.pendm,
    listFromChains: (chains) => chains.map((chain) => chain.pendm).filter(Boolean),
    name: (attrs) => attrs.name,
    archived: (attrs) => attrs.archived === true,
    votes: (attrs) => attrs.users,
    forumId: (attrs) => first(attrs.forums?.data)?.id ?? null
  },
  openMission: {
    kind: 'mission',
    refPrefix: 'om',
    voteKind: null,
    fromChain: (chain) => chain.openMission,
    listFromChains: (chains) => chains.map((chain) => chain.openMission).filter(Boolean),
    name: (attrs) => attrs.name,
    archived: (attrs) => attrs.archived === true,
    votes: () => null,
    forumId: () => null
  },
  ask: {
    kind: 'mission',
    refPrefix: 'ask',
    voteKind: 'ask',
    fromChain: (chain, id) =>
      (chain.openMission?.attributes?.asks?.data ?? []).find(
        (ask) => String(ask.id) === String(id)
      ) ?? null,
    listFromChains: (chains) =>
      chains.flatMap((chain) => chain.openMission?.attributes?.asks?.data ?? []),
    name: (attrs) => attrs.users_permissions_user?.data?.attributes?.username,
    archived: (attrs) => attrs.archived === true,
    votes: (attrs) => attrs.vots,
    forumId: (attrs) => first(attrs.forums?.data)?.id ?? null
  },
  betahalich: {
    kind: 'mission',
    refPrefix: 'bm',
    voteKind: null,
    fromChain: (chain) => chain.mesimabetahalich,
    listFromChains: (chains) => chains.map((chain) => chain.mesimabetahalich).filter(Boolean),
    name: (attrs) => attrs.name,
    archived: (attrs) => attrs.finnished === true,
    votes: () => null,
    forumId: (attrs) => first(attrs.forums?.data)?.id ?? null
  },
  act: {
    kind: 'mission',
    refPrefix: 'act',
    voteKind: null,
    fromChain: (chain, id) =>
      (chain.acts ?? []).find((act) => String(act.id) === String(id)) ?? null,
    listFromChains: (chains) => chains.flatMap((chain) => chain.acts ?? []),
    name: (attrs) => attrs.shem,
    archived: (attrs) => attrs.naasa === true && attrs.myIshur === true && attrs.valiIshur === true,
    votes: () => null,
    forumId: () => null
  },
  finiapruval: {
    kind: 'mission',
    refPrefix: 'fini',
    voteKind: null,
    fromChain: (chain, id) =>
      (chain.finiapruvals ?? []).find((fini) => String(fini.id) === String(id)) ?? null,
    listFromChains: (chains) => chains.flatMap((chain) => chain.finiapruvals ?? []),
    name: (attrs) => attrs.missname,
    archived: (attrs) => attrs.archived === true,
    votes: (attrs) => attrs.vots,
    forumId: () => null
  },
  finnished: {
    kind: 'mission',
    refPrefix: 'fm',
    voteKind: null,
    fromChain: (chain) => chain.finnishedMission,
    listFromChains: (chains) => chains.map((chain) => chain.finnishedMission).filter(Boolean),
    name: (attrs) => attrs.missionName,
    archived: () => true,
    votes: () => null,
    forumId: () => null
  },
  pmash: {
    kind: 'resource',
    refPrefix: 'pmash',
    voteKind: 'pmash',
    fromChain: (chain) => chain.pmash,
    listFromChains: (chains) => chains.map((chain) => chain.pmash).filter(Boolean),
    name: (attrs) => attrs.name,
    archived: (attrs) => attrs.archived === true,
    votes: (attrs) => attrs.users,
    forumId: (attrs) => first(attrs.forums?.data)?.id ?? null
  },
  openMashaabim: {
    kind: 'resource',
    refPrefix: 'mash',
    voteKind: null,
    fromChain: (chain) => chain.openMashaabim,
    listFromChains: (chains) => chains.map((chain) => chain.openMashaabim).filter(Boolean),
    name: (attrs) => attrs.name,
    archived: (attrs) => attrs.archived === true,
    votes: () => null,
    forumId: () => null
  },
  askm: {
    kind: 'resource',
    refPrefix: 'askm',
    voteKind: 'askm',
    fromChain: (chain, id) =>
      (chain.askms ?? []).find((askm) => String(askm.id) === String(id)) ?? null,
    listFromChains: (chains) => chains.flatMap((chain) => chain.askms ?? []),
    name: (attrs) =>
      attrs.users_permissions_user?.data?.attributes?.username ??
      attrs.sp?.data?.attributes?.users_permissions_user?.data?.attributes?.username,
    archived: (attrs) => attrs.archived === true,
    votes: (attrs) => attrs.vots,
    forumId: (attrs) => attrs.forum?.data?.id ?? null
  },
  maap: {
    kind: 'resource',
    refPrefix: 'maap',
    voteKind: null,
    fromChain: (chain) => chain.maap,
    listFromChains: (chains) => chains.map((chain) => chain.maap).filter(Boolean),
    name: (attrs) => attrs.name,
    archived: (attrs) => attrs.archived === true,
    votes: (attrs) => attrs.vots,
    forumId: (attrs) => attrs.forum?.data?.id ?? null
  },
  rikmash: {
    kind: 'resource',
    refPrefix: 'rikmash',
    voteKind: null,
    fromChain: (chain, id) =>
      (chain.rikmashes ?? []).find((rikmash) => String(rikmash.id) === String(id)) ?? null,
    listFromChains: (chains) => chains.flatMap((chain) => chain.rikmashes ?? []),
    name: (attrs) => attrs.name,
    archived: () => true,
    votes: () => null,
    forumId: () => null
  },
  matanot: {
    kind: 'sale',
    refPrefix: 'matanot',
    voteKind: null,
    fromChain: (chain) => chain.matanot,
    listFromChains: (chains) => chains.map((chain) => chain.matanot).filter(Boolean),
    name: (attrs) => attrs.name,
    archived: (attrs) => attrs.archived === true,
    votes: () => null,
    forumId: () => null
  },
  sale: {
    kind: 'sale',
    refPrefix: 'sale',
    voteKind: null,
    fromChain: (chain, id) =>
      (chain.sales ?? []).find((sale) => String(sale.id) === String(id)) ?? null,
    listFromChains: (chains) => chains.flatMap((chain) => chain.sales ?? []),
    // never surface the raw note as a display name — site-share notes are
    // structured strings that must go through parseSiteShareNote
    name: (attrs) => attrs.matanot?.data?.attributes?.name ?? null,
    archived: (attrs) => attrs.splited === true,
    votes: () => null,
    forumId: () => null
  }
};

/** The chain-lookup ref (`prefix-id`) for an object of the given type. */
export function objectRef(type, id) {
  const config = OBJECT_TYPES[type];
  return config ? `${config.refPrefix}-${id}` : null;
}

/** All entities of a type across the reconstructed chains, with their chain. */
export function listObjects(type, missionChains, resourceChains, saleChains = []) {
  const config = OBJECT_TYPES[type];
  if (!config) return [];
  const chains =
    config.kind === 'mission'
      ? missionChains
      : config.kind === 'resource'
        ? resourceChains
        : saleChains;
  return chains.flatMap((chain) =>
    config
      .listFromChains([chain])
      .filter(Boolean)
      .map((entity) => ({ entity, chain }))
  );
}
