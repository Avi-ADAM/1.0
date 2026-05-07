import { browser } from '$app/environment';
import { setContext, getContext } from 'svelte';
import { sendToSer } from '$lib/send/sendToSer.js';

const STORAGE_KEY = 'moach.cache.v1';
const MOACH_STORE_KEY = Symbol('MOACH_STORE');

const TTL = {
  base:        5 * 60_000,  // 5 min for base data
  missions:    60_000,      // 1 min for missions
  financials:  30_000,      // 30 sec for financials
  entity:      15_000       // 15 sec for single entity pages
};

export function createMoachStore() {
  let state = $state({
    projects: {},   // { [projectId]: { base, missions, financials, entities: {}, _ts: { base: Date, ... } } }
    currentId: null,
    loading: false,
    modal: { open: false, kind: null, id: null },  // kind: 'betha'|'pendm'|'openM'|'done'|'assign'
    actModal: { open: false, actData: null }
  });

  if (browser) {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        state.projects = JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse moach cache', e);
      }
    }
  }

  function persist() {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
    }
  }

  return {
    get state() { return state; },

    updateProjectData(pid, type, data) {
      if (!state.projects[pid]) {
        state.projects[pid] = { entities: {}, _ts: {} };
      }
      state.projects[pid][type] = data;
      state.projects[pid]._ts[type] = Date.now();
      persist();
    },

    updateEntity(pid, entityId, data) {
      if (!state.projects[pid]) {
        state.projects[pid] = { entities: {}, _ts: {} };
      }
      state.projects[pid].entities[entityId] = data;
      state.projects[pid]._ts[`entity_${entityId}`] = Date.now();
      persist();
    },

    isDataFresh(pid, type) {
      const project = state.projects[pid];
      if (!project || !project._ts[type]) return false;
      const ttl = TTL[type] || TTL.entity;
      return (Date.now() - project._ts[type]) < ttl;
    },

    invalidate(pid, type) {
      if (state.projects[pid] && state.projects[pid]._ts[type]) {
        delete state.projects[pid]._ts[type];
        persist();
      }
    },

    async refreshBase(pid, fetch) {
      const res = await sendToSer({ pid }, 'getProjectBaseInfoWithAuth', 0, 0, false, fetch);
      const attrs = res?.data?.project?.data?.attributes;
      if (attrs) this.updateProjectData(pid, 'base', attrs);
    },

    openModal(kind, id) {
      state.modal = { open: true, kind, id };
    },

    closeModal() {
      state.modal = { open: false, kind: null, id: null };
    },

    openActModal(actData) {
      state.actModal = { open: true, actData };
    },

    closeActModal() {
      state.actModal = { open: false, actData: null };
    }
  };
}

export function setMoachStore() {
  const store = createMoachStore();
  setContext(MOACH_STORE_KEY, store);
  return store;
}

export function getMoachStore() {
  return getContext(MOACH_STORE_KEY);
}
