/**
 * Single source of truth for "vocabulary" entities — the shared, user-extendable
 * catalogs (skills / values / roles / …) that appear in many places across the
 * app (registration, onboarding, mission & project creation, profile editing).
 *
 * This module is SERVER-SAFE: it holds only plain metadata and imports no Svelte
 * stores, so it can be used by both the API endpoints and the UI. The client
 * store mapping lives in the component.
 */

export type VocabKind = 'skills' | 'vallues' | 'roles';

export interface VocabKindMeta {
	/** Strapi collection (plural API id), used in GraphQL + REST paths */
	collection: string;
	/** The translatable name field on the entity */
	nameField: string;
	/** GraphQL create mutation name */
	createMutation: string;
	/** Pinecone namespace for semantic duplicate detection */
	pineconeNamespace: 'skills' | 'vallues' | 'roles';
	/** contentType passed to /api/translations (Strapi REST plural id) */
	translationContentType: string;
	/** Suffix for tr.selector keys: identical<Suffix> / similar<Suffix> */
	i18nSuffix: 'Skill' | 'Value' | 'Role';
	/** tr.selector key for the search placeholder */
	searchKey: 'searchSkills' | 'searchValues' | 'searchRoles';
	/** Hebrew telemetry verb sent to /api/ste (owner notification) */
	telemetryVerb: string;
}

export const VOCAB_KINDS: Record<VocabKind, VocabKindMeta> = {
	skills: {
		collection: 'skills',
		nameField: 'skillName',
		createMutation: 'createSkill',
		pineconeNamespace: 'skills',
		translationContentType: 'skills',
		i18nSuffix: 'Skill',
		searchKey: 'searchSkills',
		telemetryVerb: 'יצר כישור חדש דרך multiselect בשם:'
	},
	vallues: {
		collection: 'vallues',
		nameField: 'valueName',
		createMutation: 'createVallue',
		pineconeNamespace: 'vallues',
		translationContentType: 'vallues',
		i18nSuffix: 'Value',
		searchKey: 'searchValues',
		telemetryVerb: 'יצר ערך חדש דרך multiselect בשם:'
	},
	roles: {
		collection: 'tafkidims',
		nameField: 'roleDescription',
		createMutation: 'createTafkidim',
		pineconeNamespace: 'roles',
		translationContentType: 'tafkidims',
		i18nSuffix: 'Role',
		searchKey: 'searchRoles',
		telemetryVerb: 'יצר תפקיד חדש דרך multiselect בשם:'
	}
};

/** Type guard — validates an untrusted `kind` value from a request. */
export function isVocabKind(value: unknown): value is VocabKind {
	return typeof value === 'string' && value in VOCAB_KINDS;
}
